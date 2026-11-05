import hashlib,io,json,lzma,os
from pathlib import Path
import sys,tarfile,tempfile,unittest
from types import SimpleNamespace
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'app'))
import native_media as media

class Media(unittest.TestCase):
 def test_install_checks_sha_and_hardware_before_switch_and_survives_tmp_loss(self):
  with tempfile.TemporaryDirectory() as td:
   base=Path(td);m=media.Media(base,base/'cache');panel=SimpleNamespace(ffmpeg=None)
   binary=b'\x7fELF\x02'+b'\0'*13+(183).to_bytes(2,'little')+b'A'*1000
   out=io.BytesIO()
   with tarfile.open(fileobj=out,mode='w:xz') as tf:
    member=tarfile.TarInfo('build/bin/ffmpeg');member.size=len(binary);tf.addfile(member,io.BytesIO(binary))
   archive=out.getvalue();asset=dict(name=media.ASSET,size=len(archive),digest='sha256:'+hashlib.sha256(archive).hexdigest(),browser_download_url='https://github.com/'+media.REPO+'/releases/download/latest/'+media.ASSET)
   def open(url,**kw):return io.BytesIO(json.dumps(dict(assets=[asset])).encode() if not isinstance(url,str) else archive)
   with patch.object(media.OPENER,'open',side_effect=open),patch.object(media.os,'uname',return_value=SimpleNamespace(machine='aarch64')),patch.object(media.shutil,'disk_usage',return_value=SimpleNamespace(free=200*1024*1024)),patch.object(m,'_test') as test:
    value=m.install(panel);self.assertTrue(value['available']);test.assert_called_once()
    self.assertTrue((m.root/'ffmpeg.xz').is_file())
    self.assertEqual(Path(panel.ffmpeg).read_bytes(),binary)
    Path(panel.ffmpeg).unlink()
    self.assertEqual(Path(m.executable()).read_bytes(),binary)
    asset['digest']='sha256:'+'0'*64
    with self.assertRaises(ValueError):m.install(panel)
    self.assertEqual(Path(panel.ffmpeg).read_bytes(),binary)
 def test_ffmpeg_probe_performs_real_audio_conversion(self):
  import shutil
  ffmpeg=shutil.which('ffmpeg')
  if not ffmpeg:self.skipTest('No host FFmpeg')
  media.Media(Path('/tmp'))._test(Path(ffmpeg))
 def test_corrupt_stored_binary_never_executes(self):
  with tempfile.TemporaryDirectory() as td:
   base=Path(td);m=media.Media(base,base/'cache');m.root.mkdir(parents=True)
   (m.root/'installed.json').write_text(json.dumps(dict(sha256='0'*64)))
   (m.root/'ffmpeg.xz').write_bytes(lzma.compress(b'corrupt'))
   with patch.object(m,'_test') as test,self.assertRaises(ValueError):m.executable()
   test.assert_not_called()
if __name__=='__main__':unittest.main()
