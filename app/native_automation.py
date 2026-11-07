"""Local scenes and opt-in voice services for the autonomous panel."""
from collections import deque
from datetime import datetime
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import threading
import time
from urllib.parse import urlsplit
from uuid import uuid4

from native_assistant import Assistant, Wakeword
from native_updates import atomic_json, load_json


def validate_steps(steps, budget, depth=0):
    if not isinstance(steps, list) or not steps or depth > 2:
        raise ValueError('Добавь действия. Допустимо до двух уровней вложенности.')
    result = []
    for step in steps:
        budget[0] -= 1
        if budget[0] < 0 or not isinstance(step, dict):
            raise ValueError('Допустимо до 24 действий на сценарий')
        kind, value = step.get('kind'), step.get('value')
        if kind == 'volume' and type(value) is int and 0 <= value <= 100:
            pass
        elif kind == 'wait' and type(value) is int and 0 <= value <= 300:
            pass
        elif kind == 'ring' and isinstance(value, str) and re.fullmatch(r'#[a-fA-F0-9]{6}', value):
            pass
        elif kind == 'ring-reset':
            value = None
        elif kind == 'alice' and isinstance(value, str) and 1 <= len(value.strip()) <= 200:
            value = value.strip()
        elif kind == 'if-weekend':
            value = validate_steps(value, budget, depth + 1)
        else:
            raise ValueError('Проверь тип и значение действия')
        result.append(dict(kind=kind, value=value))
    return result


def validate_scene(data):
    name, at, days = data.get('name'), data.get('at', ''), data.get('days', [])
    if not isinstance(name, str) or not 1 <= len(name.strip()) <= 80:
        raise ValueError('Укажи имя сценария длиной до 80 символов')
    if not isinstance(at, str) or (at and not re.fullmatch(r'(?:[01][0-9]|2[0-3]):[0-5][0-9]', at)):
        raise ValueError('Укажи время в формате ЧЧ:ММ')
    if not isinstance(days, list) or any(type(d) is not int or not 0 <= d <= 6 for d in days):
        raise ValueError('Некорректные дни недели')
    if at and not days:
        raise ValueError('Выбери хотя бы один день')
    return dict(name=name.strip(), at=at, days=sorted(set(days)),
                steps=validate_steps(data.get('steps'), [24]))


def spawn(binary, *args):
    return subprocess.Popen(
        [sys.executable, __file__, str(os.getpid()), str(binary), *map(str, args)],
        stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )


class Automation:
    def __init__(self, panel, base):
        self.panel = panel
        self.data = Path(base) / 'data'
        self.file = self.data / 'scenes.json'
        self.claims = self.data / 'scene-runs.json'
        self.assistant = Assistant(self.data, spawn)
        self.wake = Wakeword(self.data, spawn, self.on_hit)
        self.lock = threading.RLock()
        self.running = None
        self.history = deque(maxlen=30)
        self.last_slot = None

    def state(self):
        with self.lock:
            return dict(items=load_json(self.file), running=self.running and self.running[0],
                        time=datetime.now().astimezone().isoformat(), history=list(self.history))

    def action(self, data):
        with self.lock:
            items, key, action = load_json(self.file), data.get('id', ''), data['action']
            if not isinstance(key, str):
                raise ValueError('Некорректный ID сценария')
            if action == 'save':
                if key and key not in items:
                    raise ValueError('Сценарий уже удалён')
                if not key and len(items) >= 32:
                    raise ValueError('Можно сохранить до 32 сценариев')
                items[key or uuid4().hex] = validate_scene(data)
                atomic_json(self.file, items)
            elif action == 'run':
                self.start(key, items[key], 'вручную')
            elif action == 'stop':
                if self.running and self.running[0] == key:
                    self.running[1].set()
            elif action == 'delete':
                if self.running and self.running[0] == key:
                    raise ValueError('Сначала останови сценарий')
                if key in self.wake.config()['bindings'].values():
                    raise ValueError('Сначала убери привязку слова активации')
                del items[key]
                atomic_json(self.file, items)
            return self.state()

    def start(self, key, scene, source):
        if self.running:
            raise ValueError('Другой сценарий уже выполняется')
        scene = validate_scene(scene)
        stop = threading.Event()
        self.running = (key, stop)
        threading.Thread(target=self.execute, args=(scene, stop, source), daemon=True).start()

    def steps(self, steps, stop, weekend):
        for step in steps:
            if stop.is_set():
                return
            kind, value = step['kind'], step['value']
            if kind == 'wait':
                stop.wait(value)
            elif kind == 'volume':
                self.panel.set_volume({'level': value})
            elif kind == 'ring':
                self.panel.ring(dict(zip(('red', 'green', 'blue'), bytes.fromhex(value[1:]))))
            elif kind == 'ring-reset':
                self.panel.ring_reset()
            elif kind == 'alice':
                self.panel.music_cmd({'command': 'sendText', 'text': value})
            elif weekend:
                self.steps(value, stop, weekend)

    def execute(self, scene, stop, source):
        try:
            self.steps(scene['steps'], stop, datetime.now().weekday() >= 5)
            result = 'Остановлен' if stop.is_set() else 'Выполнен'
        except Exception as exc:
            result = 'Ошибка: ' + str(exc)
        with self.lock:
            self.history.appendleft(dict(name=scene['name'], source=source, at=time.time(), result=result))
            self.running = None

    def schedule(self, now):
        slot = now.strftime('%Y-%m-%d %H:%M')
        with self.lock:
            if slot == self.last_slot:
                return
            self.last_slot = slot
            items = load_json(self.file)
            claims = {key: value for key, value in load_json(self.claims).items() if key in items}
            for key, scene in items.items():
                if scene['at'] != slot[-5:] or now.weekday() not in scene['days'] or claims.get(key, '') >= slot:
                    continue
                claims[key] = slot
                atomic_json(self.claims, claims)
                if self.running:
                    self.history.appendleft(dict(name=scene['name'], source='расписание', at=time.time(),
                                                 result='Пропущен: выполняется другой сценарий'))
                else:
                    self.start(key, scene, 'расписание')

    def on_hit(self, target):
        if target == '@assistant':
            self.assistant.arm()
        elif target:
            with self.lock:
                self.start(target, load_json(self.file)[target], 'слово активации')
            return
        self.wake.request('/listen', {})

    def scheduler(self):
        while True:
            try:
                self.schedule(datetime.now().astimezone())
            except (KeyError, OSError, TypeError, ValueError) as exc:
                print(f'Сценарии: {exc}', flush=True)
            time.sleep(1)


ROUTES = {
    '/api/native/scenes': ('save', 'run', 'stop', 'delete'),
    '/api/native/wakeword': ('config', 'bind', 'daemon'),
    '/api/native/assistant': ('install', 'config', 'start', 'stop', 'ask'),
}


def install(module, base):
    original_init = module.Panel.__init__

    def init(self, *args, **kwargs):
        original_init(self, *args, **kwargs)
        self.automation = Automation(self, base)
        for task in (self.automation.scheduler, self.automation.wake.loop, self.automation.assistant.loop):
            threading.Thread(target=task, daemon=True).start()

    module.Panel.__init__ = init
    old_get, old_post = module.Handler.do_GET, module.Handler.do_POST

    def get(self):
        path = urlsplit(self.path).path
        if path not in ROUTES:
            return old_get(self)
        if not self._guard(path):
            manager = self.panel.automation
            service = path.rsplit('/', 1)[-1]
            return self._handle({'scenes': manager.state, 'wakeword': manager.wake.state,
                                 'assistant': manager.assistant.state}[service])

    def post(self):
        path = urlsplit(self.path).path
        if path not in ROUTES:
            return old_post(self)
        if self._guard(path):
            return
        try:
            if not 0 <= int(self.headers.get('Content-Length', '0')) <= 32768:
                return self._send(413, dict(error='Запрос слишком большой'))
            data = self._json()
            if not isinstance(data, dict) or data.get('action') not in ROUTES[path]:
                raise ValueError('Неизвестное действие')
        except ValueError as exc:
            return self._send(400, dict(error=str(exc)))
        manager = self.panel.automation
        if path.endswith('/wakeword'):
            return self._handle(lambda: manager.wake.action(data, manager))
        action = manager.action if path.endswith('/scenes') else manager.assistant.action
        return self._handle(lambda: action(data))

    module.Handler.do_GET, module.Handler.do_POST = get, post


if __name__ == '__main__':
    import ctypes
    import signal

    # Each daemon follows its long-lived supervisor thread, including on SIGKILL.
    parent, binary, *args = sys.argv[1:]
    if ctypes.CDLL(None).prctl(1, signal.SIGKILL, 0, 0, 0) != 0 or os.getppid() != int(parent):
        raise SystemExit(1)
    os.execv(binary, [binary, *args])
