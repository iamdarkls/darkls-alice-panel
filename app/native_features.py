"""Native maintenance: bounded backups, diagnostics, and authenticated voice agent."""
import concurrent.futures
import contextlib
import hashlib
import io
import ipaddress
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import socket
import ssl
import subprocess
import tarfile
import tempfile
import threading
import time
import urllib.request
import urllib.error
from urllib.parse import urlsplit, parse_qs

from native_updates import atomic_json, load_json, point

MAX_BACKUP = 16 * 1024 * 1024
SAFE_DATA = {'.panel_settings.json', '.yandex_auth.json', 'voice.json'}
DEVICE_FILES = ('/data/launch-no-update.json', '/system/vendor/quasar/launch.json',
                '/etc/init.d/S99darkls', '/etc/init.d/S99yam', '/system/vendor/quasar/onboot.sh',
                '/system/vendor/quasar/activate_adb.sh', '/system/vendor/quasar/adb_options.inc',
                '/system/vendor/quasar/version_full')
MARKERS = ('/data/quasar_activate_adb_quasmodrom', '/data/quasar_activate_network_adb')
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


class Maintenance:
    def __init__(self, base):
        self.base = Path(base).resolve()
        self.data = self.base / 'data'
        self.state = self.base / 'maintenance.json'
        self.voice_file = self.data / 'voice.json'
        self.temp = Path('/tmp/darkls-panel-backups')
        self.lock = threading.Lock()

    def info(self):
        return dict(**load_json(self.state), scope='Настройки панели и снимки изменённых системных конфигураций. Не образ NAND.',
                    restore_scope='Автоматически восстанавливаются только настройки панели. Системные файлы — для ручного восстановления.',
                    excludes='Пароль панели, сессии, прошивка, приложения YAM, аудиофайлы и runtime не входят в копию.')

    def create_backup(self, secrets=False):
        if not isinstance(secrets, bool):
            raise ValueError('secrets должен быть true/false')
        with self.lock:
            self.temp.mkdir(mode=0o700, parents=True, exist_ok=True)
            self.temp.chmod(0o700)
            for old in self.temp.glob('alice-backup-*.tar.gz'):
                old.unlink()
            entries, total = {}, 0
            def add(name, path):
                nonlocal total
                path = Path(path)
                if path.is_symlink() or not path.is_file():
                    return
                if path.stat().st_size > 4 * 1024 * 1024:
                    raise ValueError('Файл слишком большой: ' + name)
                blob = path.read_bytes()
                total += len(blob)
                if total > MAX_BACKUP:
                    raise ValueError('Содержимое копии превышает 16 МБ')
                entries[name] = blob
            for name in SAFE_DATA:
                if secrets or name not in ('.yandex_auth.json', 'voice.json'):
                    add('panel/' + name, self.data / name)
            for path in DEVICE_FILES:
                add('device' + path, path)
            # The binary user configuration is saved verbatim, never decoded/replaced as JSON.
            if secrets:
                add('device/data/quasar/data/user_config.dat', '/data/quasar/data/user_config.dat')
            cfg = load_json(self.base / 'config.json')
            entries['reference/panel-config.json'] = json.dumps(cfg, ensure_ascii=False).encode()
            manifest = dict(schema=1, created=time.time(), model='mini3pro', secrets=secrets,
                            version=(self.base / 'current' / 'DARKLS_VERSION').read_text().strip(),
                            markers={p: Path(p).is_file() for p in MARKERS},
                            files={name: hashlib.sha256(blob).hexdigest() for name, blob in entries.items()})
            name = 'alice-backup-' + time.strftime('%Y%m%d-%H%M%S', time.gmtime()) + '-' + os.urandom(3).hex() + '.tar.gz'
            dest = self.temp / name
            try:
                with dest.open('xb') as out:
                    os.chmod(dest, 0o600)
                    with tarfile.open(fileobj=out, mode='w:gz') as tf:
                        for key, blob in {'manifest.json': json.dumps(manifest).encode(), **entries}.items():
                            member = tarfile.TarInfo(key)
                            member.size, member.mode = len(blob), 0o600
                            tf.addfile(member, io.BytesIO(blob))
                if dest.stat().st_size > MAX_BACKUP:
                    raise ValueError('Архив превышает 16 МБ')
            except Exception:
                dest.unlink(missing_ok=True)
                raise
            state = load_json(self.state)
            state.update(last_backup=dict(name=name, created=manifest['created'], size=dest.stat().st_size, secrets=secrets))
            atomic_json(self.state, state)
            return dict(ok=True, name=name, download='/api/native/backups/download?name=' + name,
                        size=dest.stat().st_size, secrets=secrets)

    def download(self, name):
        if not re.fullmatch(r'alice-backup-[0-9]{8}-[0-9]{6}-[a-f0-9]{6}\.tar\.gz', name):
            raise ValueError('Некорректное имя копии')
        path = self.temp / name
        if path.is_symlink() or not path.is_file():
            raise ValueError('Копия отсутствует в /tmp. Создай новую.')
        return path

    def inspect_backup(self, blob):
        if len(blob) > MAX_BACKUP:
            raise ValueError('Архив превышает 16 МБ')
        entries, total = {}, 0
        try:
            with tarfile.open(fileobj=io.BytesIO(blob), mode='r:gz') as tf:
                for i, member in enumerate(tf):
                    p = PurePosixPath(member.name)
                    if (i > 80 or not member.isfile() or member.size > 4*1024*1024 or
                            member.name in entries or p.is_absolute() or '..' in p.parts or str(p) != member.name):
                        raise ValueError('Небезопасная структура копии')
                    total += member.size
                    if total > MAX_BACKUP:
                        raise ValueError('Распакованная копия превышает 16 МБ')
                    entries[member.name] = tf.extractfile(member).read()
        except (tarfile.TarError, EOFError, OSError) as exc:
            raise ValueError('Повреждённый архив') from exc
        try:
            manifest = json.loads(entries.pop('manifest.json'))
            hashes = manifest['files']
            if manifest['schema'] != 1 or manifest['model'] != 'mini3pro' or set(hashes) != set(entries):
                raise ValueError('Неподходящий манифест')
            for name, value in entries.items():
                allowed = name in {'panel/' + p for p in SAFE_DATA} or name in {'device' + p for p in DEVICE_FILES} or name in {'reference/panel-config.json', 'device/data/quasar/data/user_config.dat'}
                if not allowed or hashlib.sha256(value).hexdigest() != hashes[name]:
                    raise ValueError('Неверный файл или контрольная сумма: ' + name)
        except (KeyError, TypeError, json.JSONDecodeError) as exc:
            raise ValueError('Некорректный манифест копии') from exc
        return manifest, entries

    def restore(self, blob):
        manifest, entries = self.inspect_backup(blob)
        selected = {name[6:]: value for name, value in entries.items() if name.startswith('panel/')}
        if not selected:
            raise ValueError('В копии нет настроек панели для автоматического восстановления')
        for name, value in selected.items():
            try:
                data = json.loads(value)
                if not isinstance(data, dict):
                    raise ValueError('Настройки должны быть JSON-объектом')
                if name == 'voice.json':
                    self.validate_voice(data)
            except (UnicodeDecodeError, json.JSONDecodeError) as exc:
                raise ValueError('Некорректный JSON: ' + name) from exc
        # Keep a downloadable undo snapshot before replacing anything.
        undo = self.create_backup(secrets=True)
        with self.lock:
            before = {}
            try:
                for name, value in selected.items():
                    path = self.data / name
                    if path.is_symlink():
                        raise ValueError('Настройки не должны быть символьной ссылкой')
                    before[name] = path.read_bytes() if path.exists() else None
                    atomic_json(path, json.loads(value))
            except Exception:
                for name, value in before.items():
                    if value is None:
                        (self.data / name).unlink(missing_ok=True)
                    else:
                        atomic_json(self.data / name, json.loads(value))
                raise
            state = load_json(self.state)
            state['last_restore'] = dict(at=time.time(), source=manifest.get('created'), files=sorted(selected))
            atomic_json(self.state, state)
        return dict(ok=True, restored=sorted(selected), undo=undo,
                    message='Настройки восстановлены. Перезагрузи страницу. Для перечитывания токена Яндекса перезапусти службу панели.')

    def validate_voice(self, data):
        endpoint = data.get('url', '').strip()
        token = data.get('token', '')
        if not endpoint:
            return dict(url='', token='', compatibility_confirmed=False)
        u = urlsplit(endpoint)
        if (u.scheme not in ('https', 'http') or not u.hostname or u.username or u.password or
                u.query or u.fragment or u.path not in ('', '/') or u.port == 0):
            raise ValueError('Укажи адрес агента без пути, логина и параметров')
        if u.scheme == 'http':
            try:
                ip = ipaddress.ip_address(u.hostname)
            except ValueError as exc:
                raise ValueError('HTTP разрешён только по IP внутри локальной сети/туннеля') from exc
            if not (ip.is_private or ip.is_loopback) or ip.is_unspecified or ip.is_link_local:
                raise ValueError('Для публичного сервера требуется HTTPS')
        if not isinstance(token, str) or not 24 <= len(token) <= 256 or any(c.isspace() for c in token):
            raise ValueError('Токен агента должен содержать 24–256 символов без пробелов')
        return dict(url=endpoint.rstrip('/'), token=token,
                    compatibility_confirmed=data.get('compatibility_confirmed') is True)

    def voice_config(self, data=None):
        cfg = load_json(self.voice_file)
        if data is not None:
            if data.get('token') in ('', None):
                data = {**data, 'token': cfg.get('token', '')}
            cfg = self.validate_voice(data)
            atomic_json(self.voice_file, cfg)
        return dict(url=cfg.get('url', ''), has_token=bool(cfg.get('token')),
                    compatibility_confirmed=cfg.get('compatibility_confirmed', False),
                    supported_upstream=False, model='mini3pro',
                    note='Мини 3 Про отсутствует в списке поддерживаемых моделей upstream. Подтверждай совместимость только после аппаратного теста.')

    def voice_request(self, action='status'):
        cfg = load_json(self.voice_file)
        if not cfg.get('url'):
            raise ValueError('Сначала настрой адрес и токен агента Linux')
        cfg = self.validate_voice(cfg)
        if action not in ('status', 'start', 'stop', 'restart'):
            raise ValueError('Неизвестное действие')
        if action in ('start', 'restart') and not cfg['compatibility_confirmed']:
            raise ValueError('Запуск закрыт: совместимость Мини 3 Про ещё не подтверждена')
        req = urllib.request.Request(cfg['url'] + '/v1/' + action,
                data=None if action == 'status' else b'{}',
                headers={'Authorization': 'Bearer ' + cfg['token'], 'Content-Type': 'application/json'})
        try:
            with OPENER.open(req, timeout=15) as response:
                raw = response.read(65537)
            if len(raw) > 65536:
                raise ValueError('Ответ агента слишком большой')
            result = json.loads(raw)
            if not isinstance(result, dict) or result.get('agent') != 'darkls-voice-agent':
                raise ValueError('По адресу отвечает неизвестный сервис')
            return result
        except urllib.error.HTTPError as exc:
            if exc.code == 401:
                raise ValueError('Агент отклонил токен. Проверь токен в настройках.') from exc
            if exc.code == 409:
                raise ValueError('Агент отклонил действие: проверь имя systemd-сервиса и подтверждение совместимости на сервере.') from exc
            raise ValueError('Агент вернул HTTP ' + str(exc.code)) from exc
        except (OSError, ValueError) as exc:
            # Never include endpoint headers/token or arbitrary remote response bodies in an error.
            raise ValueError('Агент недоступен или вернул неверный ответ. Проверь сервис, TLS и туннель.') from exc

    def diagnostics(self, network=True):
        def read(path, limit=12000):
            try:
                return Path(path).read_text(errors='replace')[:limit]
            except OSError:
                return None
        def cmd(args):
            try:
                p = subprocess.run(args, capture_output=True, timeout=3, text=True, errors='replace')
                return p.stdout.strip()[:12000]
            except (OSError, subprocess.TimeoutExpired):
                return None
        checks = []
        disk = shutil.disk_usage(self.base)
        checks.append(dict(name='Свободное место /data', status='ok' if disk.free > 52*1024*1024 else 'warn', detail=f'{disk.free//1048576} МБ свободно; для обновления нужно 52 МБ'))
        for label, path in [('Root ADB', MARKERS[0]), ('Сетевой ADB', MARKERS[1]), ('Автозапуск панели', '/etc/init.d/S99darkls')]:
            exists = Path(path).is_file()
            checks.append(dict(name=label, status='ok' if exists else 'warn', detail='Файл присутствует' if exists else 'Файл отсутствует'))
        import native_yam2
        yam=native_yam2.Yam2(self.base)
        checks.append(dict(name='YAM v2',status='ok' if yam.binary.is_file() else 'warn',detail='CLI установлен' if yam.binary.is_file() else 'Установи YAM в разделе YAM v2'))
        try:
            from yam_host import Client
            apps=Client(self.base).request(dict(op='status'))
            selected=[s for p in apps['packages'] for s in p['services'] if s['autostart']]
            failed=[s['id'] for s in selected if s['status'] not in ('running','completed')]
            checks.append(dict(name='Приложения YAM',status='warn' if failed else 'ok',detail='Не восстановлены: '+', '.join(failed) if failed else 'Хост доступен; автозапуск: '+str(len(selected))))
        except (OSError,ValueError):checks.append(dict(name='Приложения YAM',status='warn',detail='Хост приложений недоступен'))
        services = {}
        for path in Path('/proc').glob('[0-9]*/cmdline'):
            try:
                text = path.read_bytes().replace(b'\0', b' ').decode(errors='replace')
                for name, pattern in [('updatesd', '--updatesd'), ('quasar', 'maind')]:
                    if pattern in text:
                        services.setdefault(name, []).append(int(path.parent.name))
            except OSError:
                continue
        checks.append(dict(name='Обновления прошивки', status='warn' if services.get('updatesd') else 'ok', detail='updatesd запущен' if services.get('updatesd') else 'Процесс updatesd не обнаружен'))
        def probe(url):
            started = time.monotonic()
            try:
                # TLS validation stays enabled; 4xx/5xx still prove HTTP reachability.
                with OPENER.open(urllib.request.Request(url, method='HEAD'), timeout=5) as r:
                    code = r.status
                return dict(url=url, status='ok', http=code, ms=round((time.monotonic()-started)*1000))
            except urllib.error.HTTPError as exc:
                return dict(url=url, status='warn', http=exc.code, detail='Сервер ответил; доступ к конкретному API не проверен')
            except (OSError, ValueError):
                return dict(url=url, status='error', detail='Ошибка DNS, TLS или соединения')
        endpoints = ['https://quasar.yandex.net/', 'https://scbh.yandex.net/'] if network else []
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
            reachability = list(pool.map(probe, endpoints))
        for item in reachability:
            checks.append(dict(name=item['url'], **{k:v for k,v in item.items() if k != 'url'}))
        result = dict(created=time.time(), panel_version=(self.base/'current'/'DARKLS_VERSION').read_text().strip(),
                      firmware=read('/system/vendor/quasar/version_full', 300), arch=os.uname().machine,
                      kernel=os.uname().release, root=os.geteuid()==0, uptime=read('/proc/uptime',100),
                      memory=read('/proc/meminfo'), storage=dict(free=disk.free,total=disk.total),
                      services=services, checks=checks, alsa=read('/proc/asound/pcm'),
                      audio_config=read('/etc/asound.conf'),
                      note='Проверка HTTP не подтверждает авторизацию в Яндексе. Отчёт не включает токены, серийный номер и пользовательскую конфигурацию.')
        # Only timestamps are stored on flash; report itself stays in browser memory.
        state = load_json(self.state)
        state['last_diagnostics'] = result['created']
        atomic_json(self.state, state)
        return result


def rollback(updater):
    with updater.lock():
        base = updater.base
        if (base/'restart.request').exists():
            raise ValueError('Дождись завершения текущего обновления')
        current, previous = (base/'current').resolve(), (base/'previous').resolve()
        releases = (base/'releases').resolve()
        if previous.parent != releases or previous == current or not (previous/'native.py').is_file():
            raise ValueError('Предыдущая сборка отсутствует')
        previous_version = (previous/'DARKLS_VERSION').read_text().strip()
        point(base, 'previous', current)
        point(base, 'current', previous)
        atomic_json(base/'restart.request', dict(version=previous_version, requested=time.time()))
        atomic_json(base/'update-status.json', dict(pending=previous_version, manual_rollback=True, available=False))
        return dict(ok=True, restarting=True, version=previous_version)


def install(module, updater):
    maintenance = Maintenance(updater.base)
    import native_media
    media = native_media.Media(updater.base)
    original_init = module.Panel.__init__
    def panel_init(self, *args, **kwargs):
        original_init(self, *args, **kwargs)
        try:
            self.ffmpeg = media.executable() or self.ffmpeg
        except (OSError, ValueError) as exc:
            print('Optional FFmpeg: '+str(exc), flush=True)
    module.Panel.__init__ = panel_init
    old_get, old_post = module.Handler.do_GET, module.Handler.do_POST
    def get(self):
        path = urlsplit(self.path).path
        routes = {'/api/native/backups': maintenance.info,
                  '/api/native/voice': maintenance.voice_config,
                  '/api/native/media': lambda: media.info(self.panel)}
        if path not in routes and path != '/api/native/backups/download':
            return old_get(self)
        if self._guard(path):
            return
        if path in routes:
            return self._handle(routes[path])
        try:
            name = parse_qs(urlsplit(self.path).query).get('name', [''])[0]
            file = maintenance.download(name)
            self._send(200, file.read_bytes(), 'application/gzip', [('Content-Disposition', 'attachment; filename="'+file.name+'"')])
        except (ValueError, OSError) as exc:
            self._send(400, dict(error=str(exc)))
    def post(self):
        path = urlsplit(self.path).path
        routes = {'/api/native/backups/create', '/api/native/backups/restore', '/api/native/diagnostics',
                  '/api/native/voice/config', '/api/native/voice/status', '/api/native/voice/start',
                  '/api/native/voice/stop', '/api/native/voice/restart', '/api/native/updates/rollback'}
        routes.add('/api/native/media/install')
        if path not in routes:
            # Bound existing native JSON endpoints too.
            if path.startswith('/api/native/'):
                try:
                    if not 0 <= int(self.headers.get('Content-Length', '0')) <= 65536:
                        return self._send(413, dict(error='Запрос слишком большой'))
                except ValueError:
                    return self._send(400, dict(error='Некорректная длина'))
            return old_post(self)
        if self._guard(path):
            return
        try:
            size = int(self.headers.get('Content-Length', '0'))
            limit = MAX_BACKUP if path.endswith('/restore') else 65536
            if size < 0 or size > limit:
                return self._send(413, dict(error='Запрос слишком большой'))
            if path.endswith('/restore'):
                if self.headers.get('Content-Type','').split(';')[0] != 'application/octet-stream':
                    raise ValueError('Загрузи архив как application/octet-stream')
                blob = self.rfile.read(size)
                if len(blob) != size:
                    raise ValueError('Неполная загрузка')
                return self._handle(lambda: maintenance.restore(blob))
            data = self._json()
            if not isinstance(data, dict):
                raise ValueError('Ожидается JSON-объект')
        except (ValueError, TypeError) as exc:
            return self._send(400, dict(error=str(exc)))
        actions = {'/api/native/backups/create': lambda: maintenance.create_backup(data.get('secrets',False)),
                   '/api/native/diagnostics': maintenance.diagnostics,
                   '/api/native/voice/config': lambda: maintenance.voice_config(data),
                   '/api/native/media/install': lambda: media.install(self.panel),
                   '/api/native/updates/rollback': lambda: rollback(updater)}
        if path in actions:
            return self._handle(actions[path])
        return self._handle(lambda: maintenance.voice_request(path.rsplit('/',1)[1]))
    module.Handler.do_GET, module.Handler.do_POST = get, post
