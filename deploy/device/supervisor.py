#!/usr/bin/env python3
"""Bounded logs, health checks, automatic rollback and periodic update polling."""
import json
import logging
from logging.handlers import RotatingFileHandler
import os
from pathlib import Path
import signal
import subprocess
import sys
import threading
import time
import urllib.request

from native_updates import Updater, atomic_json, load_json, point

BASE = Path(os.environ.get('DARKLS_BASE', '/data/darkls-alice')).resolve()
STOP = threading.Event()
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))
LOG = logging.getLogger('darkls')


def healthy(port, pid, version):
    try:
        with OPENER.open(f'http://127.0.0.1:{port}/api/native/health', timeout=2) as response:
            value = json.load(response)
        return value.get('native') is True and value.get('root') is True and value.get('pid') == pid and value.get('version') == version
    except Exception:
        return False


def terminate(child):
    if child.poll() is None:
        child.terminate()
        try:
            child.wait(timeout=5)
        except subprocess.TimeoutExpired:
            child.kill()
            child.wait(timeout=3)


def stream(child):
    try:
        for line in child.stdout:
            LOG.info(line.rstrip()[:3000])
    except (OSError, ValueError):
        pass


def main():
    BASE.mkdir(parents=True, exist_ok=True)
    handler = RotatingFileHandler(BASE / 'service.log', maxBytes=256*1024, backupCount=2)
    handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
    LOG.addHandler(handler)
    LOG.setLevel(logging.INFO)
    lock = (BASE / 'supervisor.lock').open('a')
    import fcntl
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        raise SystemExit('Supervisor is already running')
    atomic_json(BASE / 'supervisor.json', dict(pid=os.getpid(), started=time.time()))
    signal.signal(signal.SIGTERM, lambda *_: STOP.set())
    signal.signal(signal.SIGINT, lambda *_: STOP.set())
    updater = Updater(BASE)
    last_check = 0
    # Remove only unused application releases. Never remove runtime or user data.
    def clean_releases():
        import shutil
        keep = {(BASE / name).resolve() for name in ('current', 'previous')}
        for path in (BASE / 'releases').iterdir():
            if path.is_dir() and not path.is_symlink() and path.resolve() not in keep:
                shutil.rmtree(path)
    child = None
    try:
        while not STOP.is_set():
            cfg = load_json(BASE / 'config.json')
            release = (BASE / 'current').resolve()
            version = (release / 'DARKLS_VERSION').read_text().strip()
            port = int(cfg.get('port', 8770))
            env = os.environ.copy()
            env.update(DARKLS_BASE=str(BASE), DARKLS_YAM_URL='http://127.0.0.1:8099',
                       PYTHONDONTWRITEBYTECODE='1', PYTHONUTF8='1', PYTHONIOENCODING='utf-8')
            cmd = [sys.executable, '-u', str(release / 'native.py'), '--device', cfg['device_ip'] + ':5555',
                   '--host', '0.0.0.0', '--port', str(port), '--https-port', '0',
                   '--model', 'mini3pro', '--data-dir', str(BASE / 'data')]
            LOG.info('Starting release %s', version)
            child = subprocess.Popen(cmd, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                     text=True, errors='replace', cwd=release)
            threading.Thread(target=stream, args=(child,), daemon=True).start()
            deadline, ready = time.monotonic() + 40, False
            while time.monotonic() < deadline and child.poll() is None and not STOP.is_set():
                if healthy(port, child.pid, version):
                    ready = True
                    break
                STOP.wait(1)
            if not ready:
                terminate(child)
                previous = (BASE / 'previous').resolve()
                if previous.is_dir() and previous != release:
                    point(BASE, 'current', previous)
                    (BASE / 'restart.request').unlink(missing_ok=True)
                    atomic_json(BASE / 'update-status.json', dict(error='Новая сборка не прошла проверку запуска; выполнен откат',
                                                                failed=version, rolled_back=previous.name, checked=time.time()))
                    LOG.error('Health failed: rolled back from %s to %s', release.name, previous.name)
                else:
                    LOG.error('Release failed health check; retry in 30 seconds')
                    STOP.wait(30)
                continue
            LOG.info('Healthy: %s', version)
            atomic_json(BASE / 'running.json', dict(pid=child.pid, supervisor=os.getpid(),
                                                   version=version, started=time.time()))
            pending = BASE / 'restart.request'
            if pending.exists():
                pending.unlink()
                atomic_json(BASE / 'update-status.json', dict(installed=version, healthy=True, checked=time.time(), error=None))
                clean_releases()
            failure_count = 0
            while child.poll() is None and not STOP.is_set():
                if pending.exists():
                    LOG.info('Restart requested for a staged update')
                    break
                cfg = load_json(BASE / 'config.json')
                interval = max(3600, int(cfg.get('update_interval_hours', 6)) * 3600)
                if cfg.get('auto_update') and cfg.get('update_feed') and time.time() - last_check > interval:
                    last_check = time.time()
                    try:
                        if updater.check().get('available'):
                            updater.apply()
                    except Exception as exc:
                        LOG.warning('Update check: %s', exc)
                if not healthy(port, child.pid, version):
                    failure_count += 1
                    if failure_count >= 3:
                        LOG.warning('Health checks failed; restarting the application')
                        break
                else:
                    failure_count = 0
                STOP.wait(10)
            terminate(child)
            (BASE / 'running.json').unlink(missing_ok=True)
            if not pending.exists():
                STOP.wait(3)
    finally:
        if child is not None:
            terminate(child)
        (BASE / 'supervisor.json').unlink(missing_ok=True)
        (BASE / 'running.json').unlink(missing_ok=True)


if __name__ == '__main__':
    main()
