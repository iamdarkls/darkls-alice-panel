#!/usr/bin/env python3
"""DARKLS Alice Panel: full dimap studio plus a direct YAM control plane."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from urllib.parse import urlparse

import profiles
import server as s

VERSION = "0.4.0"
UPSTREAM_COMMIT = "7df9f78e3a0fde1dcdee92e6b2f43293faf17d8a"
LIMIT = 32 * 1024 * 1024
BASE = "/data/quazar/yam"
YAM_CONSTANTS = {k: v for k, v in vars(s).items() if k.startswith("YAM")}
ORIGINAL_START = s.Panel.yam_start
ORIGINAL_INSTALL = s.Panel.yam_install_daemon
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def valid_yam_url(value):
    u = urlparse(value)
    if (u.scheme != "http" or not u.hostname or u.username or u.password
            or u.path not in ("", "/") or u.query or u.fragment):
        raise ValueError("YAM URL: укажи http://IP:8099 без пути и пароля")
    # Force parsing/validation of the port, including invalid values.
    _ = u.port
    return value.rstrip("/")


def yam_url(panel):
    explicit = os.environ.get("DARKLS_YAM_URL")
    if explicit:
        return valid_yam_url(explicit)
    serial = panel.adb.serial or ""
    if ":" not in serial:
        raise s.AdbError("Для USB укажи --yam-url http://IP:8099")
    host = serial.rsplit(":", 1)[0]
    return valid_yam_url(f"http://{host}:8099")


def yam_request(self, method, path, body=None, headers=None, timeout=30):
    if not path.startswith("/api/") or ".." in path or "?" in path or "#" in path:
        raise ValueError("Недопустимый путь API YAM")
    request = urllib.request.Request(yam_url(self) + path, data=body,
                                     method=method, headers=headers or {})
    try:
        with OPENER.open(request, timeout=timeout) as response:
            data = response.read(LIMIT + 1)
            if len(data) > LIMIT:
                raise s.AdbError("Ответ YAM превышает 32 МБ")
            if not data:
                return None
            if "json" in response.headers.get("Content-Type", ""):
                return json.loads(data)
            return data.decode("utf-8", "replace")
    except urllib.error.HTTPError as exc:
        detail = exc.read(4096).decode("utf-8", "replace")
        raise s.AdbError(f"YAM HTTP {exc.code}: {detail or exc.reason}") from exc
    except (urllib.error.URLError, OSError, TimeoutError) as exc:
        raise s.AdbError(f"YAM недоступен по {yam_url(self)}: {exc}") from exc


def health(panel):
    result = {"name": "DARKLS Alice Panel", "version": VERSION,
              "upstream": {"version": s.VERSION, "commit": UPSTREAM_COMMIT},
              "adb": panel.conn.info(), "yam": {"online": False, "url": yam_url(panel)}}
    try:
        result["yam"].update(online=True, device=panel._yam("GET", "/api/device", timeout=3))
    except s.AdbError as exc:
        result["yam"]["error"] = str(exc)
    return result


def yam_status(self):
    try:
        self._yam("GET", "/api/device", timeout=3)
        running = True
    except s.AdbError:
        running = False
    installed, autostart = running, False
    if self.conn.online:
        out = self.adb.shell(
            f"test -x {BASE}/bin/yamd && echo installed; "
            "test -x /etc/init.d/S99yam && echo autostart; true", timeout=6)[0]
        installed, autostart = "installed" in out.split(), "autostart" in out.split()
    return dict(installed=installed, running=running, autostart=autostart,
                web_url=yam_url(self) + "/")


def yam_autostart(self, enabled):
    # Use only the known official installer hook; never install Lite 2 rootkeeper.
    self.adb.shell("test -f /etc/init.d/S99yam && grep -q /data/quazar/yam /etc/init.d/S99yam")
    mode = "755" if enabled else "644"
    self.adb.shell("set -e; mount -o remount,rw /; "
                   "trap 'mount -o remount,ro /' 0; "
                   f"chmod {mode} /etc/init.d/S99yam; sync")
    return self.yam_status()


def yam_install(self, drop_backups=False):
    # Preserve a timestamped copy of an existing binary before an upstream update.
    # Data/plugins are never moved or removed; the full upstream SHA256 check is kept.
    self.adb.shell(f"mkdir -p {BASE}/backups; if [ -x {BASE}/bin/yamd ]; then "
                   f"cp -p {BASE}/bin/yamd {BASE}/backups/yamd-$(date +%s); fi")
    return ORIGINAL_INSTALL(self)


def package_action(panel, data):
    pkg = data.get("id", "")
    if not re.fullmatch(r"[a-z0-9_-]+", pkg):
        raise ValueError("Некорректный ID пакета")
    actions = {"run": ("POST", "/invoke"), "stop": ("POST", "/stop"),
               "toggle": ("POST", "/toggle"), "remove": ("DELETE", ""),
               "enable": ("POST", "/service/enable"),
               "disable": ("POST", "/service/disable")}
    if data.get("action") not in actions:
        raise ValueError("Неизвестное действие")
    method, suffix = actions[data["action"]]
    payload = b"{}" if suffix == "/invoke" else None
    try:
        panel._yam(method, f"/api/plugins/{pkg}{suffix}", payload,
                   {"Content-Type": "application/json"} if payload else {})
    except s.AdbError as exc:
        if suffix != "/invoke" or "launch mode" not in str(exc):
            raise
        panel._yam("POST", f"/api/plugins/{pkg}/service/start")
    return {"ok": True}


def upload_package(panel, blob):
    if not blob or len(blob) > LIMIT:
        raise ValueError("Выбери .yap размером до 32 МБ")
    boundary = "darkls" + os.urandom(12).hex()
    body = (f'--{boundary}\r\nContent-Disposition: form-data; name="package"; '
            'filename="upload.yap"\r\nContent-Type: application/octet-stream\r\n\r\n').encode()
    body += blob + f"\r\n--{boundary}--\r\n".encode()
    return panel._yam("POST", "/api/plugins", body,
                      {"Content-Type": "multipart/form-data; boundary=" + boundary}, timeout=120)


def install_registry_package(self, pkg_id, version):
    if not re.fullmatch(r"[a-z0-9_-]+", pkg_id or ""):
        raise ValueError("Некорректный ID пакета")
    entry = next((p for p in self.yam_registry()["packages"]
                  if p["id"] == pkg_id and p["version"] == version), None)
    if entry is None:
        raise ValueError("Пакет не найден в реестре")
    if urlparse(entry["url"]).scheme != "https":
        raise ValueError("Реестр должен использовать HTTPS")
    with urllib.request.urlopen(entry["url"], timeout=90) as response:
        blob = response.read(LIMIT + 1)
    if len(blob) > LIMIT:
        raise ValueError("Пакет превышает 32 МБ")
    if hashlib.sha256(blob).hexdigest() != entry["sha256"]:
        raise ValueError("SHA-256 пакета не совпал с реестром")
    return upload_package(self, blob)


def install(s):
    # Profiles intentionally replace several methods: apply integration AFTER them.
    for key, value in YAM_CONSTANTS.items():
        setattr(s, key, value)
    s.Panel._yam = yam_request
    s.Panel.yam_status = yam_status
    s.Panel.yam_start = ORIGINAL_START
    s.Panel.yam_autostart = yam_autostart
    s.Panel.yam_install_daemon = yam_install
    s.Panel.yam_update_daemon = yam_install
    import yam_releases
    yam_releases.install(s)
    s.Panel.yam_install = install_registry_package

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

    original_get, original_post = s.Handler.do_GET, s.Handler.do_POST
    original_offline = s.Handler._offline

    def offline(self, path):
        # Direct YAM reads/actions remain usable independently of ADB.
        if path.startswith("/api/yam/") and path not in (
                "/api/yam/start", "/api/yam/install-daemon", "/api/yam/autostart", "/api/yam/version"):
            return False
        return original_offline(self, path)
    s.Handler._offline = offline

    def do_get(self):
        path = urlparse(self.path).path
        if path in ("/", "/index.html", "/studio"):
            if self._guard("/"):
                return
            name = "unified.html"
            return self._send(200, (s.STATIC / name).read_bytes(), "text/html; charset=utf-8")
        if path == "/manifest.webmanifest":
            return self._send(200, dict(name="DARKLS Alice Panel", short_name="DARKLS Alice",
                             start_url="/", display="standalone", theme_color="#0e1420",
                             background_color="#0e1420", icons=[]))
        if path.startswith("/api/darkls/"):
            if self._guard(path):
                return
            p = self.panel
            routes = {"/api/darkls/health": lambda: health(p),
                      "/api/darkls/device": lambda: p._yam("GET", "/api/device"),
                      "/api/darkls/sensors": lambda: p._yam("GET", "/api/sensors"),
                      "/api/darkls/plugins": p.yam_plugins,
                      "/api/darkls/settings": lambda: p._yam("GET", "/api/settings"),
                      "/api/darkls/clock": lambda: p._yam("GET", "/api/clock"),
                      "/api/darkls/registry": p.yam_registry}
            if path == "/api/darkls/package/logs":
                query = s.parse_qs(urlparse(self.path).query)
                return self._handle(lambda: p.yam_logs(query.get("id", [""])[0]))
            if path not in routes:
                return self._send(404, {"error": "Неизвестный API"})
            return self._handle(routes[path])
        return original_get(self)

    def do_post(self):
        path = urlparse(self.path).path
        if not path.startswith("/api/darkls/"):
            return original_post(self)
        if self._guard(path):
            return
        try:
            size = int(self.headers.get("Content-Length", 0))
            if not 0 <= size <= LIMIT:
                self.close_connection = True
                return self._send(413, {"error": "Максимальный размер — 32 МБ"})
            if path == "/api/darkls/package/upload":
                return self._handle(lambda: upload_package(self.panel, self._body()))
            data = self._json()
            if not isinstance(data, dict):
                raise ValueError("Ожидается JSON-объект")
        except (ValueError, json.JSONDecodeError) as exc:
            return self._send(400, {"error": str(exc)})
        p = self.panel
        def settings():
            current = p._yam("GET", "/api/settings")
            value = data.get("allow_plugin_binaries")
            if not isinstance(value, bool):
                raise ValueError("allow_plugin_binaries должен быть true/false")
            current["allow_plugin_binaries"] = value
            return p._yam("PUT", "/api/settings", json.dumps(current).encode(),
                          {"Content-Type": "application/json"})
        routes = {"/api/darkls/package/action": lambda: package_action(p, data),
                  "/api/darkls/package/install": lambda: p.yam_install(data["id"], data["version"]),
                  "/api/darkls/settings": settings}
        if path not in routes:
            return self._send(404, {"error": "Неизвестный API"})
        return self._handle(routes[path])
    s.Handler.do_GET, s.Handler.do_POST = do_get, do_post

    # Never let the upstream updater overwrite this fork with a dimap release.
    def check(self, refresh=False):
        return dict(version=VERSION, latest=VERSION, update=False, install="darkls",
                    checked=time.time(), repo="https://github.com/dimap/yandex-station-web",
                    upstream=s.VERSION)
    s.PanelUpdater.check = check
    def update(self):
        raise s.AdbError("Обновления DARKLS устанавливаются отдельным архивом")
    s.PanelUpdater.update = update


def main():
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("--yam-url", default=os.environ.get("DARKLS_YAM_URL"))
    opts, remaining = parser.parse_known_args()
    if opts.yam_url:
        os.environ["DARKLS_YAM_URL"] = valid_yam_url(opts.yam_url)
    sys.argv = [sys.argv[0]] + remaining
    for flag, value in (("--port", "8770"), ("--https-port", "0"), ("--model", "mini3pro")):
        if not any(a == flag or a.startswith(flag + "=") for a in remaining):
            sys.argv.extend((flag, value))
    original = profiles.install
    def install_profile(module, model="lite2", auto=False):
        original(module, model, auto)
        install(module)
    profiles.install = install_profile
    print(f"DARKLS Alice Panel {VERSION} · dimap {s.VERSION} + YAM", flush=True)
    s.main()


if __name__ == "__main__":
    main()
