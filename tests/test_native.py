import contextlib
import hashlib
import io
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import tarfile
import tempfile
import threading
import time
import unittest
from unittest.mock import patch
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / 'app'
sys.path.insert(0, str(APP))
import native
import native_updates as updates
import access


def free_port():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]


def package(version='0.2.1', extra=None):
    output = io.BytesIO()
    with tarfile.open(fileobj=output, mode='w:gz') as tf:
        for name, blob in {'native.py': b'print("test")', 'server.py': b'', 'darkls.py': b'',
                           'profiles.py': b'', 'static/unified.html': b'<!doctype html>',
                           'DARKLS_VERSION': version.encode(), **(extra or {})}.items():
            info = tarfile.TarInfo(name)
            info.size = len(blob)
            tf.addfile(info, io.BytesIO(blob))
    return output.getvalue()


class LocalTransportTests(unittest.TestCase):
    def setUp(self):
        self.device = native.LocalDevice(None, '127.0.0.1:5555')

    def test_shell_uses_local_os_and_preserves_exit_code(self):
        out, _, code = self.device.shell('printf native-ok')
        self.assertEqual((out, code), ('native-ok', 0))
        self.assertEqual(self.device.shell('exit 7', check=False)[2], 7)
        with self.assertRaises(native.s.AdbError):
            self.device.shell('echo failed; exit 7')

    def test_timeout_terminates_command(self):
        begin = time.monotonic()
        with self.assertRaises(native.s.AdbError):
            self.device.shell('sleep 20', timeout=.1)
        self.assertLess(time.monotonic() - begin, 2)

    def test_binary_file_copy_and_listing(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            original = root / 'with spaces.bin'
            original.write_bytes(bytes(range(256)))
            self.device.pull(original, root / 'copy.bin')
            self.device.push(root / 'copy.bin', root / 'pushed.bin')
            self.assertEqual(self.device.read_bytes(root / 'pushed.bin'), original.read_bytes())
            self.assertIn('with spaces.bin', [r[3] for r in self.device.ls(root)])

    def test_local_connection_never_invokes_adb(self):
        conn = native.LocalConnection(self.device)
        self.assertTrue(conn.online)
        self.assertEqual(conn.info()['transport'], 'local')
        with self.assertRaises(native.s.AdbError):
            self.device._base()

    def test_terminal_has_real_pty(self):
        class WS:
            def __init__(self):
                self.received = bytearray()
                self.event = threading.Event()
                self.sent = False
            def send(self, blob):
                self.received.extend(blob)
                if b'PTY_OK' in blob:
                    self.event.set()
            def recv(self):
                if not self.sent:
                    self.sent = True
                    return (1, json.dumps({'t':'i', 'd':"printf 'PTY_OK\\n'; exit\n"}))
                self.event.wait(3)
                return None
            def close(self):
                self.event.set()
        ws = WS()
        terminal = native.LocalTerminal(self.device, ws, 80, 24)
        terminal.run()
        self.assertIn(b'PTY_OK', ws.received)


class UpdatesTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.base = Path(self.tmp.name)
        (self.base / 'releases' / 'old').mkdir(parents=True)
        (self.base / 'releases' / 'old' / 'DARKLS_VERSION').write_text('0.2.0')
        updates.point(self.base, 'current', self.base / 'releases' / 'old')
        updates.atomic_json(self.base / 'config.json', dict(update_feed='https://raw.githubusercontent.com/owner/repo/main/update.json'))
        self.updater = updates.Updater(self.base)
        self.blob = package()
        self.manifest = dict(schema=1, target='aarch64-linux-gnu', version='0.2.1',
                             min_python='3.9',
                             url='https://github.com/owner/repo/releases/download/v0.2.1/app.tar.gz',
                             size=len(self.blob), sha256=hashlib.sha256(self.blob).hexdigest())

    def tearDown(self):
        self.tmp.cleanup()

    def open(self, url, **kw):
        return io.BytesIO(json.dumps(self.manifest).encode() if url.endswith('update.json') else self.blob)

    def test_update_stages_version_and_preserves_data(self):
        (self.base / 'data').mkdir()
        (self.base / 'data' / 'token').write_text('preserve')
        with patch.object(updates.OPENER, 'open', side_effect=self.open):
            self.assertTrue(self.updater.check()['available'])
            value = self.updater.apply()
        self.assertTrue(value['restarting'])
        self.assertEqual((self.base / 'data' / 'token').read_text(), 'preserve')
        self.assertEqual((self.base / 'current' / 'DARKLS_VERSION').read_text(), '0.2.1')
        self.assertEqual((self.base / 'previous' / 'DARKLS_VERSION').read_text(), '0.2.0')
        self.assertTrue((self.base / 'restart.request').exists())

    def test_cleanup_runs_before_update_disk_reserve_check(self):
        stale=self.base/'releases/0.1.0-0123456789ab';stale.mkdir()
        (stale/'DARKLS_VERSION').write_text('0.1.0');(stale/'native.py').write_text('pass')
        os.utime(stale,(time.time()-7200,)*2)
        proc=self.base/'empty-proc';proc.mkdir()
        cleanup=self.updater._cleanup
        usage=shutil.disk_usage(self.base)
        def disk_usage(path):return usage._replace(free=(51 if stale.exists() else 60)*1048576)
        with patch.object(updates.OPENER,'open',side_effect=self.open),patch.object(updates.shutil,'disk_usage',side_effect=disk_usage),patch.object(self.updater,'_cleanup',side_effect=lambda:cleanup(proc=proc)):
            self.assertTrue(self.updater.apply()['restarting'])
        self.assertFalse(stale.exists());self.assertEqual((self.base/'previous'/'DARKLS_VERSION').read_text(),'0.2.0')

    def test_bad_checksum_keeps_current(self):
        self.manifest['sha256'] = '0' * 64
        with patch.object(updates.OPENER, 'open', side_effect=self.open):
            with self.assertRaises(ValueError):
                self.updater.apply()
        self.assertEqual((self.base / 'current').resolve().name, 'old')

    def test_cross_repository_payload_is_rejected(self):
        self.manifest['url'] = 'https://github.com/other/repo/releases/download/v0.2.1/app.tar.gz'
        with patch.object(updates.OPENER, 'open', side_effect=self.open):
            with self.assertRaises(ValueError):
                self.updater.check()

    def test_archive_escape_and_symlink_are_rejected(self):
        for mode in ('traversal', 'symlink'):
            stream = io.BytesIO()
            with tarfile.open(fileobj=stream, mode='w:gz') as tf:
                info = tarfile.TarInfo('../escape' if mode == 'traversal' else 'link')
                if mode == 'symlink':
                    info.type = tarfile.SYMTYPE
                    info.linkname = '/etc'
                tf.addfile(info)
            archive = self.base / 'evil.tar.gz'
            archive.write_bytes(stream.getvalue())
            with self.assertRaises(ValueError):
                updates.extract_release(archive, self.base / mode)
            self.assertFalse((self.base / mode).exists())

    def test_no_feed_and_downgrades_are_not_applied(self):
        self.updater.configure(dict(feed='', auto=True))
        self.assertFalse(self.updater.info()['auto'])
        with self.assertRaises(ValueError):
            self.updater.apply()
        with self.assertRaises(ValueError):
            self.updater.configure(dict(feed='http://unsafe.test/feed', auto=True))


class ReleaseVersionTests(unittest.TestCase):
    def test_panel_reports_the_packaged_version(self):
        import darkls

        self.assertEqual(darkls.VERSION, (APP / 'DARKLS_VERSION').read_text().strip())


@unittest.skipUnless(os.geteuid() == 0, 'native launcher requires root')
class ProcessTests(unittest.TestCase):
    def test_full_native_launcher_without_adb(self):
        with tempfile.TemporaryDirectory() as td:
            port = free_port()
            data = Path(td) / 'data'
            data.mkdir()
            access.PanelAccess(data / '.panel_auth.json').set_password(None, 'test-password-only', 'test')
            env = dict(os.environ, DARKLS_BASE=td, DARKLS_YAM_URL='http://127.0.0.1:65534')
            proc = subprocess.Popen([sys.executable, '-u', str(APP / 'native.py'), '--device', '127.0.0.1:5555',
                                     '--host', '127.0.0.1', '--port', str(port), '--data-dir', str(data)],
                                    env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
            try:
                for _ in range(50):
                    try:
                        with urllib.request.urlopen(f'http://127.0.0.1:{port}/api/native/health', timeout=.3) as r:
                            value = json.load(r)
                        break
                    except OSError:
                        time.sleep(.1)
                else:
                    self.fail('Native server did not start')
                self.assertTrue(value['native'])
                self.assertEqual(value['pid'], proc.pid)
                self.assertEqual(value['version'], (APP / 'DARKLS_VERSION').read_text().strip())
                with urllib.request.urlopen(f'http://127.0.0.1:{port}/') as response:
                    self.assertIn(b'static/ui/panel.js', response.read())
                request = urllib.request.Request(f'http://127.0.0.1:{port}/api/shell', data=b'{}', headers={'Content-Type':'application/json'})
                with self.assertRaises(urllib.error.HTTPError) as caught:
                    urllib.request.urlopen(request)
                self.assertEqual(caught.exception.code, 401)
            finally:
                proc.terminate()
                output = proc.communicate(timeout=10)[0]
            self.assertNotIn(b'Traceback', output)

    def test_supervisor_rolls_back_a_broken_release(self):
        with tempfile.TemporaryDirectory() as td:
            base, port = Path(td), free_port()
            good, bad = base / 'releases' / 'good', base / 'releases' / 'bad'
            good.mkdir(parents=True)
            bad.mkdir()
            (good / 'DARKLS_VERSION').write_text('0.2.0')
            (bad / 'DARKLS_VERSION').write_text('0.2.1')
            (bad / 'native.py').write_text('raise SystemExit(7)')
            (good / 'native.py').write_text('''import argparse,json,os\nfrom http.server import BaseHTTPRequestHandler,HTTPServer\np=argparse.ArgumentParser();p.add_argument('--port',type=int);a,_=p.parse_known_args()\nclass H(BaseHTTPRequestHandler):\n def log_message(self,*args):pass\n def do_GET(self):\n  b=json.dumps(dict(native=True,root=True,pid=os.getpid(),version='0.2.0')).encode();self.send_response(200);self.end_headers();self.wfile.write(b)\nHTTPServer(('127.0.0.1',a.port),H).serve_forever()\n''')
            shutil.copy2(ROOT / 'deploy/device/supervisor.py', base / 'supervisor.py')
            shutil.copy2(APP / 'native_updates.py', base / 'native_updates.py')
            updates.atomic_json(base / 'config.json', dict(device_ip='127.0.0.1', port=port))
            updates.point(base, 'previous', good)
            updates.point(base, 'current', bad)
            proc = subprocess.Popen([sys.executable, str(base / 'supervisor.py')], env=dict(os.environ, DARKLS_BASE=td),
                                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
            try:
                for _ in range(80):
                    try:
                        with urllib.request.urlopen(f'http://127.0.0.1:{port}/api/native/health', timeout=.2) as response:
                            value = json.load(response)
                        if value['version'] == '0.2.0':
                            break
                    except OSError:
                        pass
                    time.sleep(.1)
                else:
                    self.fail('Supervisor did not restore the working release')
                self.assertEqual((base / 'current').resolve(), good)
                self.assertEqual(updates.load_json(base / 'update-status.json')['failed'], '0.2.1')
            finally:
                proc.terminate()
                proc.communicate(timeout=10)


if __name__ == '__main__':
    unittest.main()
