import subprocess
import sys
import tempfile
import threading
import time
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import Mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'app'))
from native_automation import Automation, validate_scene
from server import AdbError, Panel


class AutomationTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.panel = Mock()
        self.base = temp.name
        self.manager = Automation(self.panel, self.base)

    def test_rejects_invalid_steps_and_schedule(self):
        base = dict(name='Example', steps=[dict(kind='volume', value=30)])
        for changes in (dict(steps=[dict(kind='volume', value=True)]),
                        dict(steps=[dict(kind='ring', value='; reboot')]),
                        dict(at='24:00', days=[0]), dict(at='07:00')):
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                validate_scene({**base, **changes})

    def test_weekend_branch(self):
        steps = validate_scene(dict(name='Weekend', steps=[
            dict(kind='if-weekend', value=[dict(kind='volume', value=25)])
        ]))['steps']
        self.manager.steps(steps, threading.Event(), False)
        self.panel.set_volume.assert_not_called()
        self.manager.steps(steps, threading.Event(), True)
        self.panel.set_volume.assert_called_once_with({'level': 25})

    def test_scene_can_interrupt_wait(self):
        scene = dict(name='Test', steps=[dict(kind='ring', value='#ff0010'),
                     dict(kind='wait', value=60), dict(kind='volume', value=40)])
        key, = self.manager.action(dict(action='save', **scene))['items']
        started = threading.Event()
        self.panel.ring.side_effect = lambda *_: started.set()
        self.manager.action(dict(action='run', id=key))
        self.assertTrue(started.wait(1))
        self.manager.action(dict(action='stop', id=key))
        deadline = time.monotonic() + 1
        while self.manager.state()['running'] and time.monotonic() < deadline:
            time.sleep(.01)
        self.assertIsNone(self.manager.state()['running'])
        self.panel.ring.assert_called_once_with({'red': 255, 'green': 0, 'blue': 16})
        self.panel.set_volume.assert_not_called()
        self.assertEqual(self.manager.state()['history'][0]['result'], 'Остановлен')

    def test_scheduled_slot_is_claimed_across_restarts(self):
        scene = dict(name='Morning', steps=[dict(kind='volume', value=50)], at='07:01', days=[0])
        self.manager.action(dict(action='save', **scene))
        now = datetime(2026, 11, 2, 7, 1)
        self.manager.start = Mock()
        self.manager.schedule(now)
        self.manager.schedule(now)
        self.manager.start.assert_called_once()
        restarted = Automation(self.panel, self.base)
        restarted.start = Mock()
        restarted.schedule(now)
        restarted.start.assert_not_called()

    def test_hit_cursor_only_routes_new_events(self):
        wake = self.manager.wake
        wake.on_hit = Mock()
        now = datetime.now().astimezone().isoformat()
        wake.route([dict(id=9, word='test', at=now)])
        wake.on_hit.assert_not_called()
        wake.route([dict(id=10, word='test', at=now)])
        wake.route([dict(id=10, word='test', at=now)])
        wake.on_hit.assert_called_once_with(None)

    def test_assistant_credentials_never_return_in_state(self):
        assistant = self.manager.assistant
        assistant.configure(dict(url='https://api.example.test/v1', model='model', key='secret', confirmed=False))
        self.assertTrue(assistant.state()['has_key'])
        self.assertNotIn('secret', repr(assistant.state()))
        with self.assertRaises(ValueError):
            assistant.action({'action': 'start'})

    def test_alarm_commands_are_valid_shell_in_both_modes(self):
        panel = Mock()
        for restart in (False, True):
            Panel._alarm_daemon(panel, restart)
            subprocess.run(['/bin/sh', '-n', '-c', panel.adb.shell.call_args.args[0]], check=True)
        script = Path(__file__).resolve().parents[1] / 'app/device/alarmd.sh'
        subprocess.run(['/bin/sh', '-n', script], check=True)

    def test_bluetooth_requires_remote_success(self):
        panel = Mock()
        panel.adb.shell.return_value = ('', '', 0)
        with self.assertRaises(AdbError):
            Panel._bt_command(panel, 'bluetoothctl discoverable off')
        panel.adb.shell.return_value = ('Failed to set discoverable\n__BT_OK__\n', '', 0)
        with self.assertRaises(AdbError):
            Panel._bt_command(panel, 'bluetoothctl discoverable off')
        panel.adb.shell.return_value = ('Changing discoverable succeeded\n__BT_OK__\n', '', 0)
        Panel._bt_command(panel, 'bluetoothctl discoverable off')
