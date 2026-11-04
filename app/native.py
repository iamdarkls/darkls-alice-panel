#!/usr/bin/env python3
"""Run the full panel on the speaker without an ADB executable or connection."""
import collections
import contextlib
import fcntl
import json
import os
from pathlib import Path
import pty
import re
import shutil
import signal
import struct
import subprocess
import sys
import termios
import threading
import time
from urllib.parse import urlparse

import darkls
import server as s


class LocalDevice:
    def __init__(self, unused, serial):
        self.adb, self.serial, self.transfers, self.conn = 'local', serial, 0, None
        self.lock = threading.Lock()
        self._transfers_lock = threading.Lock()

    @contextlib.contextmanager
    def _transfer(self):
        with self._transfers_lock:
            self.transfers += 1
        try:
            yield
        finally:
            with self._transfers_lock:
                self.transfers -= 1

    def shell(self, command, timeout=15, check=True):
        p = subprocess.Popen(['/bin/sh', '-c', command], stdout=subprocess.PIPE,
                             stderr=subprocess.PIPE, start_new_session=True)
        try:
            stdout, stderr = p.communicate(timeout=timeout)
        except subprocess.TimeoutExpired as exc:
            with contextlib.suppress(ProcessLookupError):
                os.killpg(p.pid, signal.SIGKILL)
            p.communicate()
            raise s.AdbError(f'Локальная команда не завершилась за {timeout} с') from exc
        out, err = (v.decode('utf-8', 'replace') for v in (stdout, stderr))
        if check and p.returncode:
            raise s.AdbError((err or out).strip()[-800:] or f'Код завершения: {p.returncode}')
        return out, err, p.returncode

    def pull(self, remote, local, timeout=300):
        with self._transfer():
            shutil.copy2(remote, local)

    def push(self, local, remote, timeout=120):
        with self._transfer():
            shutil.copy2(local, remote)

    def read_bytes(self, remote, timeout=120):
        with self._transfer():
            return Path(remote).read_bytes()

    def ls(self, remote):
        entries = []
        for path in Path(remote).iterdir():
            stat = path.lstat()
            entries.append((stat.st_mode, stat.st_size, int(stat.st_mtime), path.name))
        return entries

    def devices(self):
        return 'Local Linux transport (root); ADB is not used.\n'

    def forward(self, port):
        return int(port)

    def _base(self):
        raise s.AdbError('Этот путь требует ADB; в автономном режиме он заменён локальным адаптером')


class LocalConnection:
    def __init__(self, device):
        self.adb, self.state, self.since = device, 'online', time.time()
        self.log = collections.deque(maxlen=80)
        self.wake = threading.Event()
        device.conn = self
        self.note('Локальный доступ: панель работает на колонке, ADB не используется')

    @property
    def online(self):
        return True

    def note(self, message, level='info'):
        self.log.append(dict(t=time.time(), level=level, msg=message))

    def info(self):
        return dict(state='online', serial=self.adb.serial, since=self.since,
                    attempts=0, retry_in=None, log=list(self.log), transport='local')

    def retry_now(self):
        return self.info()

    def lost(self, why):
        self.note(str(why), 'warn')

    def run(self):
        while True:
            self.wake.wait(3600)
            self.wake.clear()


class LocalTerminal:
    MAX, active, lock = 2, 0, threading.Lock()

    def __init__(self, device, ws, cols, rows):
        self.ws, self.closed = ws, False
        pid, fd = pty.fork()
        if pid == 0:
            try:
                os.environ.update(TERM='xterm-256color', PS1='root@alice:\\w# ')
                paths = [str(p.parent) for p in Path('/data/quazar/yam/data/plugins').glob('*/bin/*')]
                os.environ['PATH'] += ':' + ':'.join(sorted(set(paths)))
                os.chdir('/data' if Path('/data').is_dir() else '/')
                os.execv('/bin/sh', ['sh', '-i'])
            finally:
                os._exit(127)
        self.pid, self.fd = pid, fd
        self.resize(cols, rows)

    def resize(self, cols, rows):
        cols, rows = max(20, min(400, int(cols))), max(5, min(200, int(rows)))
        fcntl.ioctl(self.fd, termios.TIOCSWINSZ, struct.pack('HHHH', rows, cols, 0, 0))

    def _pump(self):
        try:
            while not self.closed:
                data = os.read(self.fd, 16384)
                if not data:
                    break
                self.ws.send(data)
        except (OSError, ValueError):
            pass
        finally:
            self.ws.close()

    def run(self):
        thread = threading.Thread(target=self._pump, daemon=True)
        thread.start()
        try:
            while True:
                message = self.ws.recv()
                if message is None:
                    break
                try:
                    value = json.loads(message[1])
                    if value.get('t') == 'i' and isinstance(value.get('d'), str):
                        os.write(self.fd, value['d'].encode())
                    elif value.get('t') == 'r':
                        self.resize(value.get('c', 80), value.get('r', 24))
                except (ValueError, TypeError):
                    continue
        finally:
            self.closed = True
            with contextlib.suppress(ProcessLookupError):
                os.killpg(self.pid, signal.SIGHUP)
            with contextlib.suppress(OSError):
                os.close(self.fd)
            for _ in range(30):
                if os.waitpid(self.pid, os.WNOHANG)[0]:
                    break
                time.sleep(.05)
            else:
                with contextlib.suppress(ProcessLookupError):
                    os.killpg(self.pid, signal.SIGKILL)
                os.waitpid(self.pid, 0)


def install(module):
    # Install AFTER hardware profiles and the PC integration: no shell wrapper/ADB survives.
    module.Adb, module.Connection, module.Terminal = LocalDevice, LocalConnection, LocalTerminal
    module.find_adb = lambda: 'local'
    module.Metrics.INTERVAL = 30
    module.PanelUpdater.repair_missing = lambda self: None
    old_health = darkls.health
    def health(panel):
        result = old_health(panel)
        result.update(transport='local', native=True)
        result['yam']['url'] = f'http://{panel.adb.serial.rsplit(":", 1)[0]}:8099'
        return result
    darkls.health = health

    import native_updates
    updates = native_updates.Updater(Path(os.environ.get('DARKLS_BASE', '/data/darkls-alice')))
    old_get, old_post = module.Handler.do_GET, module.Handler.do_POST
    def do_get(self):
        path = urlparse(self.path).path
        if path == '/api/native/health':
            if self.client_address[0] not in ('127.0.0.1', '::1') and self._guard(path):
                return
            return self._send(200, dict(native=True, version=darkls.VERSION,
                                       pid=os.getpid(), root=os.geteuid() == 0))
        if path == '/api/native/updates':
            if not self._guard(path):
                self._handle(updates.info)
            return
        return old_get(self)
    def do_post(self):
        path = urlparse(self.path).path
        if not path.startswith('/api/native/'):
            return old_post(self)
        if self._guard(path):
            return
        try:
            data = self._json()
            if not isinstance(data, dict):
                raise ValueError('Ожидается JSON-объект')
        except ValueError as exc:
            return self._send(400, dict(error=str(exc)))
        actions = {'/api/native/updates/config': lambda: updates.configure(data),
                   '/api/native/updates/check': updates.check,
                   '/api/native/updates/apply': updates.apply}
        if path not in actions:
            return self._send(404, dict(error='Неизвестный API'))
        return self._handle(actions[path])
    module.Handler.do_GET, module.Handler.do_POST = do_get, do_post
    import native_features
    native_features.install(module, updates)


def main():
    if os.geteuid() != 0:
        raise SystemExit('Автономный режим требует root на своей колонке')
    os.environ.setdefault('DARKLS_YAM_URL', 'http://127.0.0.1:8099')
    original = darkls.install
    def combined(module):
        original(module)
        install(module)
    darkls.install = combined
    if not any(a == '--host' or a.startswith('--host=') for a in sys.argv):
        sys.argv.extend(['--host', '0.0.0.0'])
    print('Autonomous transport: local shell/files/PTY; no PC or ADB required', flush=True)
    darkls.main()


if __name__ == '__main__':
    main()
