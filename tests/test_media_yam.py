import hashlib,io,json,lzma,os
from pathlib import Path
import sys,tarfile,tempfile,unittest
from types import SimpleNamespace
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'app'))
import native_media as media
import yam_releases as yam

class Releases(unittest.TestCase):
 def release(self,tag,asset):return dict(tag_name=tag,assets=[dict(name=asset),dict(name='SHA256SUMS')])
 def test_cli_is_not_a_daemon_update(self):
  self.assertFalse(yam.compatible(self.release('yam-v0.2.5','yam-aarch64-unknown-linux-musl')))
  self.assertTrue(yam.compatible(self.release('v0.1.19','yamd-aarch64-linux-musl')))
  bad=self.release('v0.1.19','yamd-aarch64-linux-musl');bad['prerelease']=True
  self.assertFalse(yam.compatible(bad))
 def test_release_filter_keeps_latest_compatible_daemon(self):
  rows=[self.release('yam-v0.2.5','yam-aarch64-unknown-linux-musl'),self.release('v0.1.19','yamd-aarch64-linux-musl'),self.release('v0.1.18','yamd-aarch64-linux-musl')]
  class P:
   YAM_ASSET='yamd-aarch64-linux-musl'
   def _yam_release_list(self,refresh=False):return rows
  yam.install(SimpleNamespace(Panel=P))
  self.assertEqual(P()._yam_release_list()[0]['tag_name'],'v0.1.19')
 def test_daemon_checksum_validated_before_install(self):
  blob=b'\x7fELF\x02'+b'\0'*13+(183).to_bytes(2,'little')+b'\0'*50
  sha=hashlib.sha256(blob).hexdigest();name='yamd-aarch64-linux-musl'
  rel=dict(assets=[dict(name='SHA256SUMS',browser_download_url='https://github.com/nyakokitsu/yam/releases/download/v0.1.19/SHA256SUMS'),dict(name=name,browser_download_url='https://github.com/nyakokitsu/yam/releases/download/v0.1.19/'+name,size=len(blob),digest='sha256:'+sha)])
  def open(url,**kw):return io.BytesIO((sha+'  '+name).encode() if url.endswith('SHA256SUMS') else blob)
  with patch.object(yam.urllib.request,'urlopen',side_effect=open):self.assertEqual(yam.verified_blob(SimpleNamespace(YAM_ASSET=name),rel),(blob,sha))
  rel['assets'][1]['digest']='sha256:'+'0'*64
  with patch.object(yam.urllib.request,'urlopen',side_effect=open),self.assertRaises(ValueError):yam.verified_blob(SimpleNamespace(YAM_ASSET=name),rel)

class DaemonTransaction(unittest.TestCase):
 def test_failed_settings_validation_restores_old_daemon_and_data(self):
  import subprocess
  with tempfile.TemporaryDirectory() as td:
   base=Path(td);(base/'bin').mkdir();(base/'data').mkdir()
   old,new=b'old-daemon',b'new-daemon'
   binary=base/'bin/yamd';binary.write_bytes(old);binary.chmod(0o755)
   (base/'data/keep').write_text('original')
   state={'running':True}
   class Adb:
    def shell(self,command,timeout=15,check=True):
     if command.startswith('pidof yamd'):state['running']=False;return ('','',0)
     if str(binary)+'.panel-new --help' in command:return ('usage','',0)
     p=subprocess.run(['/bin/sh','-c',command],capture_output=True,text=True,timeout=timeout)
     if check and p.returncode:raise ValueError(p.stderr)
     return p.stdout,p.stderr,p.returncode
    def push(self,local,remote):Path(remote).write_bytes(Path(local).read_bytes())
   class P:
    YAM_ASSET='yamd-aarch64-linux-musl'
    def __init__(self):self.adb=Adb();self._yam_port=None
    def _yam_release_list(self,refresh=False):return [dict(tag_name='v0.1.19',assets=[dict(name=self.YAM_ASSET),dict(name='SHA256SUMS')])]
    def yam_plugins(self):return []
    def yam_status(self):return dict(installed=True,running=state['running'])
    def yam_start(self):
     state['running']=True
     if binary.read_bytes()==new:(base/'data/keep').write_text('changed-by-new-daemon')
     return self.yam_status()
    def _yam(self,method,path):return dict(setting='different' if binary.read_bytes()==new else 'original')
   yam.install(SimpleNamespace(Panel=P,YAM_DIR=str(base),YAMD=str(binary),AdbError=ValueError))
   with patch.object(yam,'verified_blob',return_value=(new,hashlib.sha256(new).hexdigest())),self.assertRaisesRegex(ValueError,'Настройки YAM изменились'):
    P().yam_install_daemon()
   self.assertEqual(binary.read_bytes(),old)
   self.assertEqual((base/'data/keep').read_text(),'original')
   self.assertTrue(state['running'])

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
