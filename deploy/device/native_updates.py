"""Versioned application updates. Runtime, user data, YAM and firmware are never replaced."""
import contextlib
import fcntl
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import tarfile
import tempfile
import time
import sys
import urllib.request
from urllib.parse import urlparse

MAX_DOWNLOAD = 16 * 1024 * 1024
MAX_UNPACKED = 32 * 1024 * 1024
RESERVE = 20 * 1024 * 1024
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def atomic_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix=path.name + '.', suffix='.new', dir=path.parent)
    temp = Path(name)
    try:
        with os.fdopen(fd, 'w') as f:
            json.dump(value, f, ensure_ascii=False, indent=2)
            f.flush()
            os.fsync(f.fileno())
        os.replace(temp, path)
    finally:
        temp.unlink(missing_ok=True)


def load_json(path, default=None):
    try:
        return json.loads(Path(path).read_text())
    except FileNotFoundError:
        return {} if default is None else default


def version(value):
    if not isinstance(value, str) or not re.fullmatch(r'\d+\.\d+\.\d+', value):
        raise ValueError('Некорректная версия')
    return tuple(map(int, value.split('.')))


def source_repo(url):
    u = urlparse(url)
    parts = u.path.strip('/').split('/')
    if (u.scheme != 'https' or u.hostname not in ('raw.githubusercontent.com', 'github.com')
            or u.username or u.password or u.port not in (None, 443)
            or u.fragment or u.query or len(parts) < 3):
        raise ValueError('Источник обновлений: HTTPS URL в своём репозитории GitHub')
    if any(not re.fullmatch(r'[A-Za-z0-9._-]+', p) or p in ('.', '..') for p in parts):
        raise ValueError('Некорректный путь GitHub')
    return tuple(parts[:2])


def point(base, name, target):
    base, target = Path(base), Path(target).resolve()
    releases = (base / 'releases').resolve()
    if target.parent != releases or not target.is_dir():
        raise ValueError('Сборка находится вне каталога releases')
    temp = base / ('.' + name + '.new')
    temp.unlink(missing_ok=True)
    temp.symlink_to(target.relative_to(base.resolve()))
    os.replace(temp, base / name)


def extract_release(archive, destination):
    destination = Path(destination)
    destination.mkdir(parents=True, exist_ok=False)
    try:
        with tarfile.open(archive, 'r:gz') as tf:
            total, names = 0, set()
            for i, member in enumerate(tf):
                path = PurePosixPath(member.name)
                if (i > 2048 or path.is_absolute() or '..' in path.parts
                        or not path.parts or member.name in names or member.issym()
                        or member.islnk() or not (member.isfile() or member.isdir())):
                    raise ValueError('Небезопасная структура архива обновления')
                names.add(member.name)
                total += member.size
                if total > MAX_UNPACKED:
                    raise ValueError('Распакованная сборка превышает 32 МБ')
                target = destination.joinpath(*path.parts)
                if member.isdir():
                    target.mkdir(parents=True, exist_ok=True)
                    continue
                target.parent.mkdir(parents=True, exist_ok=True)
                with tf.extractfile(member) as src, target.open('xb') as out:
                    shutil.copyfileobj(src, out)
                target.chmod(0o755 if member.mode & 0o111 else 0o644)
        for required in ('native.py', 'server.py', 'darkls.py', 'profiles.py', 'DARKLS_VERSION', 'static/unified.html'):
            if not (destination / required).is_file():
                raise ValueError('В сборке отсутствует ' + required)
        return destination
    except Exception:
        shutil.rmtree(destination, ignore_errors=True)
        raise


class Updater:
    def __init__(self, base):
        self.base = Path(base).resolve()
        self.config_file = self.base / 'config.json'
        self.state_file = self.base / 'update-status.json'

    @contextlib.contextmanager
    def lock(self):
        with (self.base / 'update.lock').open('a') as f:
            try:
                fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError as exc:
                raise ValueError('Проверка или обновление уже выполняется') from exc
            yield

    def info(self):
        cfg = load_json(self.config_file)
        active = (self.base / 'current').resolve()
        installed = (active / 'DARKLS_VERSION').read_text().strip() if active.is_dir() else None
        return dict(installed=installed, feed=cfg.get('update_feed', ''),
                    auto=bool(cfg.get('auto_update') and cfg.get('update_feed')),
                    interval_hours=cfg.get('update_interval_hours', 6),
                    status=load_json(self.state_file),
                    previous=(self.base / 'previous').resolve().name if (self.base / 'previous').is_dir() else None)

    def configure(self, data):
        with self.lock():
            cfg = load_json(self.config_file)
            feed = data.get('feed', cfg.get('update_feed', ''))
            if not isinstance(feed, str):
                raise ValueError('feed должен быть строкой')
            feed = feed.strip()
            if feed:
                source_repo(feed)
            auto = data.get('auto', cfg.get('auto_update', False))
            if not isinstance(auto, bool):
                raise ValueError('auto должен быть true/false')
            cfg.update(update_feed=feed, auto_update=bool(feed and auto))
            atomic_json(self.config_file, cfg)
            return self.info()

    def _manifest(self):
        cfg = load_json(self.config_file)
        feed = cfg.get('update_feed', '')
        if not feed:
            raise ValueError('Источник обновлений не настроен')
        repo = source_repo(feed)
        with OPENER.open(feed, timeout=20) as response:
            raw = response.read(65537)
        if len(raw) > 65536:
            raise ValueError('Манифест превышает 64 КБ')
        value = json.loads(raw)
        if value.get('schema') != 1 or value.get('target') != 'aarch64-linux-gnu':
            raise ValueError('Неподходящий формат/архитектура обновления')
        version(value.get('version'))
        minimum = value.get('min_python', '3.14')
        if not isinstance(minimum, str) or not re.fullmatch(r'\d+\.\d+', minimum):
            raise ValueError('Некорректная версия Python в манифесте')
        if tuple(map(int, minimum.split('.'))) > sys.version_info[:2]:
            raise ValueError('Обновление требует более нового runtime; установи его с ПК')
        if source_repo(value.get('url', '')) != repo:
            raise ValueError('Архив должен находиться в том же репозитории GitHub')
        if not re.fullmatch(r'[a-f0-9]{64}', value.get('sha256', '')):
            raise ValueError('Некорректная SHA-256')
        if not isinstance(value.get('size'), int) or not 0 < value['size'] <= MAX_DOWNLOAD:
            raise ValueError('Недопустимый размер архива')
        return value

    def check(self):
        with self.lock():
            return self._check()

    def _check(self):
        try:
            candidate = self._manifest()
            current = self.info()['installed']
            value = dict(checked=time.time(), latest=candidate['version'],
                         available=version(candidate['version']) > version(current),
                         notes=str(candidate.get('notes', ''))[:12000],
                         published=str(candidate.get('published', ''))[:100], error=None)
            atomic_json(self.state_file, value)
            return value
        except Exception as exc:
            atomic_json(self.state_file, dict(checked=time.time(), error=str(exc), available=False))
            raise

    def apply(self):
        with self.lock():
            candidate = self._manifest()
            current = (self.base / 'current').resolve()
            if version(candidate['version']) <= version((current / 'DARKLS_VERSION').read_text().strip()):
                raise ValueError('Новая версия отсутствует; откат через источник обновлений запрещён')
            if (self.base / 'restart.request').exists():
                raise ValueError('Предыдущее обновление ещё проверяется')
            if shutil.disk_usage(self.base).free < MAX_UNPACKED + RESERVE:
                raise ValueError('Для обновления нужно не менее 52 МБ свободного места в /data')
            with tempfile.TemporaryDirectory(prefix='darkls-update-', dir='/tmp') as td:
                archive = Path(td) / 'app.tar.gz'
                digest, count = hashlib.sha256(), 0
                with OPENER.open(candidate['url'], timeout=90) as response, archive.open('wb') as out:
                    while True:
                        chunk = response.read(65536)
                        if not chunk:
                            break
                        count += len(chunk)
                        if count > candidate['size']:
                            raise ValueError('Размер загрузки больше манифеста')
                        digest.update(chunk)
                        out.write(chunk)
                if count != candidate['size'] or digest.hexdigest() != candidate['sha256']:
                    raise ValueError('Размер или SHA-256 обновления не совпали')
                target = self.base / 'releases' / (candidate['version'] + '-' + candidate['sha256'][:12])
                if target.exists():
                    raise ValueError('Такая сборка уже существует; проверь журнал предыдущей установки')
                extract_release(archive, target)
                if (target / 'DARKLS_VERSION').read_text().strip() != candidate['version']:
                    shutil.rmtree(target)
                    raise ValueError('Версия архива не совпала с манифестом')
                point(self.base, 'previous', current)
                point(self.base, 'current', target)
                atomic_json(self.base / 'restart.request', dict(version=candidate['version'], requested=time.time()))
                atomic_json(self.state_file, dict(checked=time.time(), pending=candidate['version'],
                                                 previous=current.name, available=False, error=None))
            return dict(ok=True, version=candidate['version'], restarting=True)
