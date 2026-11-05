import hashlib,io,json,os,shutil,subprocess,sys,tarfile,tempfile,unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'app'))
import native_yam2 as y

class Adapter(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
  self.base=Path(self.temp.name)/'panel';self.base.mkdir();self.calls=[]
  def runner(argv,timeout):self.calls.append(argv);return ''
  self.m=y.Yam2(self.base,Path(self.temp.name)/'yam',runner)
 def binary(self):
  self.m.binary.parent.mkdir(parents=True,exist_ok=True);self.m.binary.write_bytes(b'old');self.m.binary.chmod(0o755)
 def fixture(self):
  blob=b'\x7fELF\x02'+b'\0'*13+(183).to_bytes(2,'little')+b'\0'*50
  sha=hashlib.sha256(blob).hexdigest();url='https://github.com/nyakokitsu/yam/releases/download/yam-v0.2.5/'
  release=dict(tag='yam-v0.2.5',version='0.2.5',assets={y.ASSET:dict(size=len(blob),digest='sha256:'+sha,browser_download_url=url+y.ASSET),'SHA256SUMS':dict(browser_download_url=url+'SHA256SUMS')})
  def open(url,**kwargs):return io.BytesIO((sha+'  '+y.ASSET).encode() if url.endswith('SHA256SUMS') else blob)
  return release,open
 def test_latest_selects_cli_release_and_ignores_legacy_prerelease(self):
  def rel(tag,draft=False):return dict(tag_name=tag,draft=draft,assets=[dict(name=y.ASSET),dict(name='SHA256SUMS')])
  entries=[rel('v0.1.19'),rel('yam-v0.9.0',True),rel('yam-v0.2.5')]
  with patch.object(y.OPENER,'open',return_value=io.BytesIO(json.dumps(entries).encode())):self.assertEqual(self.m.latest()['version'],'0.2.5')
 def test_validation_prevents_option_and_shell_interpretation(self):
  self.binary()
  for value in ['--help','../x','X/name','ns/name;reboot','ns/name@2','ns/name@1.2.3@x']:
   with self.assertRaises(ValueError):self.m.action(dict(action='install',name=value))
  self.m.action(dict(action='install',name='ns/name@1.2.3'))
  self.assertEqual(self.calls[-1][-2:],['install','ns/name@1.2.3']);self.assertNotIn('--yes',self.calls[-1])
  self.m.action(dict(action='install',name='ns/name',allow_replacements=True));self.assertEqual(self.calls[-1][-1],'--yes')
  self.assertEqual(self.calls[-1][1:3],['--platform','pickle'])
 def test_legacy_upload_and_invalid_registry_key_rejected(self):
  self.binary()
  with self.assertRaisesRegex(ValueError,'Старый .yap'):self.m.upload(b'PKnot-yampkg')
  with self.assertRaises(ValueError):self.m.action(dict(action='registry-add',url='https://example.test',key='ed25519:invalid'))
  with self.assertRaises(ValueError):self.m.action(dict(action='registry-add',url='http://example.test',key=y.REGISTRY_KEY))
  self.assertEqual(self.calls,[])
 def test_first_install_stages_and_retry_after_failure(self):
  release,opener=self.fixture();count=0
  def runner(argv,timeout):
   nonlocal count
   count+=1
   if count==3:raise ValueError('staging database failed')
   return ''
  self.m._runner=runner
  with patch.object(y.os,'uname',return_value=SimpleNamespace(machine='aarch64')),patch.object(self.m,'latest',return_value=release),patch.object(y.OPENER,'open',side_effect=opener):
   with self.assertRaisesRegex(ValueError,'staging'):self.m.install_latest()
   self.assertFalse(self.m.root.exists());self.assertFalse(list(self.base.parent.glob('.darkls-yam-*')))
   self.m.install_latest()
  self.assertEqual(self.m.info()['version'],'0.2.5')
  self.assertTrue((self.m.root/'bin/yam-run').is_file())
 def test_existing_nonempty_root_not_overwritten(self):
  self.m.root.mkdir();keep=self.m.root/'keep';keep.write_text('legacy')
  with patch.object(y.os,'uname',return_value=SimpleNamespace(machine='aarch64')),self.assertRaisesRegex(ValueError,'уже есть данные'):self.m.install_latest()
  self.assertEqual(keep.read_text(),'legacy')
 def test_signed_update_success_not_rolled_back_on_metadata_outage(self):
  self.binary();y.atomic_json(self.m.record,dict(version='0.2.4',sha256='old'))
  def command(args,**kw):
   if args==['update']:self.m.binary.write_bytes(b'new');return 'Установлено обновление 0.2.5.'
   return ''
  with patch.object(self.m,'command',side_effect=command),patch.object(self.m,'latest',side_effect=OSError('GitHub unavailable')):
   self.m.action(dict(action='update'))
  self.assertEqual(self.m.binary.read_bytes(),b'new');self.assertIsNone(self.m.info()['version'])
  self.assertEqual(len(list((self.base/'yam2-backups').iterdir())),1)
 def test_failed_update_restores_binary_and_keeps_db_snapshot(self):
  self.binary();y.atomic_json(self.m.record,dict(version='0.2.4'))
  def command(args,**kw):
   if args==['update']:self.m.binary.write_bytes(b'bad');return 'update'
   raise ValueError('new binary failed')
  with patch.object(self.m,'command',side_effect=command),self.assertRaises(ValueError):self.m.action(dict(action='update'))
  self.assertEqual(self.m.binary.read_bytes(),b'old');self.assertEqual(self.m.info()['version'],'0.2.4')
 def test_registry_and_service_output_parsing(self):
  with patch.object(self.m,'command',return_value='test/demo/worker\tenabled\tbin/demo --arg\n'):
   result=self.m.services();self.assertFalse(result['supervised']);self.assertEqual(result['items'][0]['exec'],'bin/demo --arg')
  with patch.object(self.m,'command',return_value='official\thttps://repo.yse.wtf/v2\n'):self.assertEqual(self.m.registries()[0]['name'],'official')

@unittest.skipUnless(os.environ.get('YAM2_QEMU') and os.environ.get('YAM2_BINARY'),'Set YAM2_QEMU and YAM2_BINARY for real ARM integration')
class ArmIntegration(unittest.TestCase):
 def test_real_cli_package_registry_doctor_remove(self):
  import zstandard
  with tempfile.TemporaryDirectory() as td:
   base=Path(td);root=base/'yam';(root/'bin').mkdir(parents=True);profiles=root/'platforms';profiles.mkdir()
   (profiles/'pickle.yaml').write_text(y.PROFILE.replace('/data/yam',str(root)).replace('/tmp/yam',str(base/'run')))
   shutil.copy2(os.environ['YAM2_BINARY'],root/'bin/yam')
   def runner(argv,timeout):
    p=subprocess.run([os.environ['YAM2_QEMU'],*argv],capture_output=True,text=True,timeout=timeout)
    if p.returncode:raise ValueError(p.stderr)
    return p.stdout
   m=y.Yam2(base/'panel',root,runner)
   self.assertEqual(m.packages(),[]);self.assertTrue(m.action(dict(action='doctor'))['ok'])
   m.action(dict(action='official-registry'));self.assertEqual(m.registries(),[dict(name='official',url=y.REGISTRY_URL)])
   payload=b'#!/bin/sh\necho fixture\n';manifest=dict(name='test/demo',version='1.0.0',license='MIT',description='Integration fixture',target='pickle',arch='aarch64',files_sha256={'bin/demo':hashlib.sha256(payload).hexdigest()},services={'worker':{'exec':['bin/demo']}})
   out=io.BytesIO()
   with tarfile.open(fileobj=out,mode='w') as tar:
    for name,data in [('MANIFEST.yaml',json.dumps(manifest).encode()),('files/bin/demo',payload)]:
     info=tarfile.TarInfo(name);info.size=len(data);info.mode=0o755 if name.startswith('files/') else 0o644;tar.addfile(info,io.BytesIO(data))
   m.upload(zstandard.ZstdCompressor().compress(out.getvalue()))
   self.assertEqual(m.packages(),[dict(name='test/demo',version='1.0.0',target='pickle')])
   self.assertEqual(m.action(dict(action='files',name='test/demo'))['files'],['bin/demo'])
   self.assertEqual(m.action(dict(action='which',path='bin/demo'))['owner'],'test/demo')
   self.assertEqual(m.services()['items'][0]['name'],'test/demo/worker');self.assertFalse(m.services()['supervised'])
   (root/'bin/demo').unlink();self.assertFalse(m.action(dict(action='doctor'))['ok'])
   m.action(dict(action='repair'));self.assertTrue(m.action(dict(action='doctor'))['ok'])
   m.action(dict(action='remove',name='test/demo'));self.assertEqual(m.packages(),[])

if __name__=='__main__':unittest.main()
