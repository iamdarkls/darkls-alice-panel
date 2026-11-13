import io
from pathlib import Path
import sys
import tarfile
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'app'))
import music_library
import server
import zvuk


class PlayerLibraryTests(unittest.TestCase):
    def test_favorites_batches_ids_and_preserves_order(self):
        music = music_library.Library(SimpleNamespace())
        music._uid = 42
        music._req = Mock(side_effect=[
            {'library': {'tracks': [{'id': 7}, {'track': {'id': 2, 'title': 'Second'}}, {'id': 99}]}},
            [{'id': 7, 'title': 'First'}],
        ])
        self.assertEqual([t['id'] for t in music.liked_tracks()], ['7', '2'])
        music._req.assert_called_with('/tracks', form={'track-ids': '7,99'})

    def test_invalid_album_does_not_call_provider(self):
        music = music_library.Library(SimpleNamespace())
        music._req = Mock()
        with self.assertRaises(ValueError):
            music.album_tracks('../liked')
        music._req.assert_not_called()

    def test_zvuk_token_storage_is_private_and_state_uses_loopback(self):
        with tempfile.TemporaryDirectory() as directory:
            auth = zvuk.Auth(Path(directory) / '.zvuk_auth.json')
            auth.save('test-account-token')
            self.assertEqual(auth.path.stat().st_mode & 0o777, 0o600)
            with patch.object(server, 'DATA_DIR', Path(directory)), patch.object(server.tempfile, 'mkdtemp', return_value=directory), patch('zvuk_player.threading.Thread'):
                panel = server.Panel(SimpleNamespace(adb='local', serial='192.0.2.10:5555'))
                player = panel.zvuk_player()
                self.assertEqual(player._lan_ip(), '127.0.0.1')
                self.assertTrue(player.state()['has_token'])
                self.assertNotIn(auth.token, repr(player.state()))

    def test_legacy_restore_rejects_foreign_archive_before_mutation(self):
        panel = server.Panel(SimpleNamespace())
        panel.footprint_reset = Mock()
        payload = io.BytesIO()
        with tarfile.open(fileobj=payload, mode='w:gz') as archive:
            for name, value in [('manifest.json', b'{"format":1}'), ('../outside', b'no')]:
                entry = tarfile.TarInfo(name)
                entry.size = len(value)
                archive.addfile(entry, io.BytesIO(value))
        with self.assertRaises(server.AdbError):
            panel.backup_restore(payload.getvalue())
        panel.footprint_reset.assert_not_called()
