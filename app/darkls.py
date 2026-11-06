#!/usr/bin/env python3
"""DARKLS native station control and YAM v2; no yamd dependency."""
import argparse
import os
import re
import subprocess
import sys
import time
from urllib.parse import urlparse
import profiles
import server as s
import native_station
VERSION = "0.6.4"
UPSTREAM_COMMIT = "7df9f78e3a0fde1dcdee92e6b2f43293faf17d8a"

def health(panel):
    return dict(name='DARKLS Alice Panel',version=VERSION,transport='local',native=True,
                upstream=dict(version=s.VERSION,commit=UPSTREAM_COMMIT),adb=panel.conn.info(),
                device=native_station.device())

def install(s):
    def alive(self):
        if self.adb.transfers:
            return True
        try:
            out, _, rc = self.adb.shell("id", timeout=8)
            if rc == 0 and re.search(r"\buid=\d+", out):
                return True
            self.note("ADB check: " + repr(out[:300]), "warn")
        except (s.AdbError, subprocess.TimeoutExpired) as exc:
            self.note("ADB check: " + str(exc), "warn")
        return False

    s.Connection._alive = alive

    def connection_run(self):
        """Check through the ADB transport; do not open extra sockets to old adbd."""
        failures = 0
        while True:
            try:
                state, err = self._adb_state()
                if state == "device" and self._alive():
                    if not self.online:
                        self.note("ADB подключён: " + str(self.adb.serial))
                    failures = 0
                    self.attempts = 0
                    self._set("online")
                    self._sleep(5)
                    continue
                failures += 1
                if failures < 2 and self.online:
                    self._sleep(3)
                    continue
                self._set("connecting")
                serial = self.adb.serial
                if not serial or ":" not in serial:
                    self._set("waiting")
                    self._sleep(5)
                    continue
                self.note("ADB reconnect: " + serial)
                # One reconnect with backoff, not a tight disconnect/connect loop.
                self._drop()
                p = subprocess.run([self.adb.adb, "connect", serial],
                                   capture_output=True, timeout=12)
                self.note((p.stdout + p.stderr).decode("utf-8", "replace").strip())
                self.attempts += 1
                delay = (3, 5, 10, 20, 30)[min(self.attempts - 1, 4)]
                self.retry_at = time.time() + delay
                self._set("adb_error")
                self._sleep(delay)
            except (OSError, subprocess.TimeoutExpired) as exc:
                self.note("ADB: " + str(exc), "warn")
                self._set("adb_error")
                self._sleep(10)

    s.Connection.run = connection_run

    original_get,original_post=s.Handler.do_GET,s.Handler.do_POST
    def do_get(self):
        path=urlparse(self.path).path
        if path in ('/','/index.html','/studio'):
            if not self._guard('/'):return self._send(200,(s.STATIC/'unified.html').read_bytes(),'text/html; charset=utf-8')
            return
        if path=='/manifest.webmanifest':
            return self._send(200,dict(name='DARKLS Alice Panel',short_name='DARKLS Alice',start_url='/',display='standalone',theme_color='#0e1420',background_color='#0e1420',icons=[]))
        if path.startswith('/api/yam/'):
            if not self._guard(path):return self._send(410,dict(error='API yamd удалён. Используй /api/yam2/.'))
            return
        if path.startswith('/api/darkls/'):
            if self._guard(path):return
            routes={'/api/darkls/health':lambda:health(self.panel),'/api/darkls/device':native_station.device,'/api/darkls/sensors':native_station.sensors}
            if path not in routes:return self._send(410,dict(error='Прежний API пакетов удалён. Используй YAM v2.'))
            return self._handle(routes[path])
        return original_get(self)
    def do_post(self):
        path=urlparse(self.path).path
        if path.startswith(('/api/yam/','/api/darkls/')):
            if not self._guard(path):return self._send(410,dict(error='Прежний API yamd удалён. Используй YAM v2.'))
            return
        return original_post(self)
    s.Handler.do_GET,s.Handler.do_POST=do_get,do_post
    def check(self,refresh=False):
        return dict(version=VERSION,latest=VERSION,update=False,install='darkls',checked=time.time(),repo='https://github.com/iamdarkls/darkls-alice-panel',upstream=s.VERSION)
    s.PanelUpdater.check=check
    def update(self):raise s.AdbError('Используй раздел «Обновления панели»')
    s.PanelUpdater.update=update

def main():
    for flag,value in (('--port','8770'),('--https-port','0'),('--model','mini3pro')):
        if not any(a==flag or a.startswith(flag+'=') for a in sys.argv):sys.argv.extend((flag,value))
    original=profiles.install
    def install_profile(module,model='lite2',auto=False):
        original(module,model,auto);install(module)
    profiles.install=install_profile
    print(f'DARKLS Alice Panel {VERSION} · локальное управление + YAM v2',flush=True)
    s.main()

if __name__=='__main__':main()
