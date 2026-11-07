"""Supervise the two optional native voice daemons."""
from datetime import datetime
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import socket
import subprocess
import tempfile
import threading
import time
import urllib.request
from urllib.parse import urlsplit

from native_updates import atomic_json, load_json

ASSISTANT_URL = 'https://github.com/dimap/yapanel-web/releases/download/v0.2.5/assistantd-linux-arm64'
ASSISTANT_SHA256 = '07d970dfdbd573284ab202ab1123525acdd0854caafa1ac023fb80f49f88c007'
ASSISTANT_SIZE = 5308568
WORD = r'[A-Za-z0-9_-]{1,100}'
WAKE_PATH = re.compile(rf'/(?:words/{WORD}|enroll/(?:start|cancel|ambient|take|train))')


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


DOWNLOAD = urllib.request.build_opener(urllib.request.ProxyHandler({}))
LOCAL = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())


class Service:
    def __init__(self, spawn):
        self.spawn = spawn
        self.lock = threading.RLock()
        self.process = None
        self.next_attempt = 0
        self.error = ''

    def running(self):
        return self.process is not None and self.process.poll() is None

    def stop(self):
        with self.lock:
            if self.running():
                self.process.terminate()
                try:
                    self.process.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    self.process.kill()
                    self.process.wait()
            self.process = None

    def tick(self):
        with self.lock:
            if self.enabled():
                if self.running():
                    return True
                if self.process is not None:
                    self.error = f'Демон завершился с кодом {self.process.returncode}'
                    self.process = None
                if time.monotonic() >= self.next_attempt:
                    self.next_attempt = time.monotonic() + 30
                    self.process = self.launch()
                return False
            self.stop()
            return False


class Assistant(Service):
    def __init__(self, data, spawn):
        super().__init__(spawn)
        self.root = data / 'assistant'
        self.config = self.root / 'config.json'
        self.binary = self.root / 'assistantd'
        self.command = Path('/tmp/webpanel_assistant.cmd')
        self.status = Path('/tmp/webpanel_assistant.json')

    def enabled(self):
        cfg = load_json(self.config)
        return cfg.get('enabled') is True and cfg.get('confirmed') is True

    def state(self):
        cfg = load_json(self.config)
        llm = cfg.get('llm', {})
        status = load_json(self.status) if self.running() else {}
        return dict(installed=self.binary.is_file(), enabled=self.enabled(), running=self.running(),
                    confirmed=cfg.get('confirmed', False), url=llm.get('base_url', ''),
                    model=llm.get('model', ''), has_key=bool(cfg.get('keys', {}).get(llm.get('base_url', '').lower())),
                    history=status.get('history') or [], route=status.get('route') is True,
                    error=self.error or status.get('config_error', ''))

    def install(self):
        if self.running() or self.enabled():
            raise ValueError('Сначала останови помощника')
        if platform.machine() != 'aarch64':
            raise ValueError('Помощнику нужна колонка ARM64')
        self.root.mkdir(mode=0o700, parents=True, exist_ok=True)
        try:
            req = urllib.request.Request(ASSISTANT_URL, headers={'User-Agent': 'DARKLS-Alice'})
            with DOWNLOAD.open(req, timeout=20) as response:
                blob = response.read(ASSISTANT_SIZE + 1)
        except OSError as exc:
            raise ValueError('Не удалось скачать помощника') from exc
        if len(blob) != ASSISTANT_SIZE or hashlib.sha256(blob).hexdigest() != ASSISTANT_SHA256:
            raise ValueError('Размер или SHA-256 помощника не совпадает')
        with tempfile.NamedTemporaryFile(dir=self.root, delete=False) as handle:
            path = Path(handle.name)
            try:
                handle.write(blob)
                handle.flush()
                os.fsync(handle.fileno())
                path.chmod(0o700)
                path.replace(self.binary)
            finally:
                path.unlink(missing_ok=True)

    def configure(self, data):
        cfg = load_json(self.config)
        url, model, key, confirmed = (data.get(k) for k in ('url', 'model', 'key', 'confirmed'))
        if not isinstance(url, str) or len(url) > 500 or any(c.isspace() for c in url):
            raise ValueError('Некорректный адрес API')
        endpoint = urlsplit(url)
        if endpoint.scheme != 'https' or not endpoint.hostname or endpoint.username is not None or endpoint.query or endpoint.fragment:
            raise ValueError('Укажи HTTPS-адрес API без ключа и параметров')
        if not isinstance(model, str) or not 1 <= len(model.strip()) <= 160:
            raise ValueError('Укажи модель')
        if not isinstance(key, str) or len(key) > 1000 or re.search(r'[\x00-\x20\x7f]', key):
            raise ValueError('Некорректный ключ API')
        if type(confirmed) is not bool:
            raise ValueError('Некорректное подтверждение')
        url = url.rstrip('/')
        keys = cfg.get('keys', {})
        if key:
            keys[url.lower()] = key
        atomic_json(self.config, {**cfg, 'confirmed': confirmed, 'enabled': self.enabled() and confirmed,
                    'llm': {'base_url': url, 'model': model.strip()}, 'keys': keys,
                    'led': {'enabled': False}, 'radio': {'voice': False}})
        if not confirmed:
            self.stop()

    def launch(self):
        if not self.binary.is_file():
            raise ValueError('Установи помощника')
        for comm in Path('/proc').glob('[0-9]*/comm'):
            try:
                name = comm.read_text().strip()
            except OSError:
                continue
            if name == 'assistantd':
                raise ValueError('Другой экземпляр помощника уже запущен')
        self.command.unlink(missing_ok=True)
        self.status.unlink(missing_ok=True)
        self.error = ''
        return self.spawn(self.binary, '-dir', self.root)

    def send(self, **command):
        with self.lock:
            if not self.running() or not self.status.is_file():
                raise ValueError('Помощник ещё не готов')
            if self.command.exists():
                raise ValueError('Предыдущая команда ещё обрабатывается')
            atomic_json(self.command, command)

    def arm(self):
        self.send(route=True)
        until = time.monotonic() + 2
        while time.monotonic() < until:
            if not self.command.exists() and self.state()['route']:
                return
            time.sleep(.05)
        raise ValueError('Помощник не подтвердил переключение')

    def action(self, data):
        with self.lock:
            action = data['action']
            if action == 'install':
                self.install()
            elif action == 'config':
                self.configure(data)
            elif action in ('start', 'stop'):
                cfg = load_json(self.config)
                enabled = action == 'start'
                if enabled and (not self.binary.is_file() or cfg.get('confirmed') is not True or not cfg.get('llm', {}).get('model')):
                    raise ValueError('Установи помощника, настрой API и разреши пробный запуск')
                atomic_json(self.config, {**cfg, 'enabled': enabled})
                self.next_attempt = 0
                self.error = ''
                if not enabled:
                    self.stop()
            elif action == 'ask':
                text = data.get('text')
                if not isinstance(text, str) or not 1 <= len(text.strip()) <= 1000:
                    raise ValueError('Вопрос должен содержать от 1 до 1000 символов')
                self.send(ask=text.strip())
            return self.state()

    def loop(self):
        while True:
            try:
                self.tick()
            except (OSError, ValueError, TypeError) as exc:
                self.error = str(exc)
            time.sleep(1)


class Wakeword(Service):
    port = 8780

    def __init__(self, data, spawn, on_hit):
        super().__init__(spawn)
        self.file = data / 'wakeword-panel.json'
        self.data = data / 'wakeword'
        self.binary = Path('/data/yam/bin/wakeword')
        self.negatives = Path('/data/yam/share/tangenx.wakeword/negatives.bin')
        self.on_hit = on_hit
        self.cursor = None

    def config(self):
        value = load_json(self.file)
        return dict(enabled=value.get('enabled') is True, bindings=value.get('bindings', {}))

    def enabled(self):
        return self.config()['enabled']

    def installed(self):
        return self.binary.is_file() and self.negatives.is_file()

    def launch(self):
        if not self.installed():
            raise ValueError('Установи tangenx/wakeword через YAM v2')
        with socket.socket() as probe:
            probe.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                probe.bind(('127.0.0.1', self.port))
            except OSError as exc:
                raise ValueError(f'Порт {self.port} занят другим экземпляром') from exc
        self.data.mkdir(mode=0o700, parents=True, exist_ok=True)
        settings = self.data / 'settings.json'
        atomic_json(settings, {**load_json(settings), 'dry_run': True})
        self.cursor = None
        self.error = ''
        return self.spawn(self.binary, 'run', '-data', self.data, '-negatives', self.negatives,
                          '-listen', f'127.0.0.1:{self.port}')

    def request(self, path, data=None, timeout=3):
        if not self.running():
            raise ValueError('Демон активации остановлен')
        req = urllib.request.Request(f'http://127.0.0.1:{self.port}/api{path}',
            data=json.dumps(data).encode() if data is not None else None,
            headers={'Content-Type': 'application/json'})
        try:
            with LOCAL.open(req, timeout=timeout) as response:
                raw = response.read(262145)
        except urllib.error.HTTPError as exc:
            try:
                message = json.loads(exc.read(4096)).get('error')
            except (ValueError, AttributeError):
                message = None
            raise ValueError(message or f'Демон активации: HTTP {exc.code}') from exc
        except OSError as exc:
            raise ValueError('API демона активации недоступен') from exc
        if len(raw) > 262144:
            raise ValueError('Слишком большой ответ демона')
        value = json.loads(raw)
        if not isinstance(value, dict):
            raise ValueError('Некорректный ответ демона')
        return value

    def state(self):
        state = {}
        error = self.error
        if self.running():
            try:
                state = self.request('/state')
            except ValueError as exc:
                error = str(exc)
        return dict(**self.config(), installed=self.installed(), ready=bool(state), error=error,
                    **{key: state.get(key) for key in ('words', 'audio', 'enroll', 'train')})

    def action(self, data, automation):
        action = data['action']
        if action == 'daemon':
            path, payload = data.get('path'), data.get('data')
            if not isinstance(path, str) or not WAKE_PATH.fullmatch(path) or not isinstance(payload, dict):
                raise ValueError('Операция API активации недоступна')
            return self.request(path, payload, timeout=30)
        with automation.lock, self.lock:
            cfg = self.config()
            if action == 'config':
                enabled = data.get('enabled')
                if type(enabled) is not bool:
                    raise ValueError('Некорректное состояние запуска')
                if enabled and not self.installed():
                    raise ValueError('Установи tangenx/wakeword через YAM v2')
                cfg['enabled'] = enabled
            elif action == 'bind':
                word, target = data.get('word'), data.get('scene')
                if not isinstance(word, str) or not re.fullmatch(WORD, word):
                    raise ValueError('Некорректный ID слова')
                if target == '':
                    cfg['bindings'].pop(word, None)
                elif word not in {w['id'] for w in self.request('/state').get('words', [])}:
                    raise ValueError('Слово не найдено')
                elif target == '@assistant' or (isinstance(target, str) and target in load_json(automation.file)):
                    cfg['bindings'][word] = target
                else:
                    raise ValueError('Сценарий не найден')
            atomic_json(self.file, cfg)
            if action == 'config':
                self.error = ''
                self.next_attempt = 0
                if not cfg['enabled']:
                    self.stop()
        return self.state()

    def route(self, hits):
        entries = sorted((hit for hit in hits if type(hit.get('id')) is int), key=lambda hit: hit['id'])
        if self.cursor is None:
            self.cursor = entries[-1]['id'] if entries else 0
            return
        bindings = self.config()['bindings']
        for hit in entries:
            if hit['id'] <= self.cursor:
                continue
            self.cursor = hit['id']
            at = datetime.fromisoformat(hit['at']).timestamp()
            if 0 <= time.time() - at <= 10:
                self.on_hit(bindings.get(hit.get('word')))

    def loop(self):
        while True:
            try:
                if self.tick():
                    state = self.request('/state')
                    self.route(state.get('hits') or [])
                    self.error = ''
            except (OSError, ValueError, TypeError, KeyError) as exc:
                self.error = str(exc)
            time.sleep(.5)
