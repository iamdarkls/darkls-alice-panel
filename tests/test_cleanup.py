import io,json,os,sys,tempfile,time,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'app'))
from native_updates import Updater,atomic_json,point

class Cleanup(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.base=Path(self.tmp.name);self.proc=self.base/'proc';self.proc.mkdir()
  self.current=self.release('0.6.4');self.previous=self.release('0.6.3');point(self.base,'current',self.current);point(self.base,'previous',self.previous);self.u=Updater(self.base)
 def release(self,version,age=7200):
  folder=self.base/'releases'/(version+'-0123456789ab');folder.mkdir(parents=True);(folder/'DARKLS_VERSION').write_text(version);(folder/'native.py').write_text('pass');os.utime(folder,(time.time()-age,time.time()-age));return folder
 def run_clean(self,force=False):
  with self.u.lock():return self.u._cleanup(force=force,proc=self.proc)
 def test_preserves_current_previous_and_running_process_release(self):
  old=self.release('0.6.1');used=self.release('0.6.2');pid=self.proc/'123';pid.mkdir();os.symlink(self.base,pid/'cwd');(pid/'cmdline').write_bytes(b'python\0'+str(used/'yam_host.py').encode()+b'\0')
  report=self.run_clean();self.assertEqual(report['removed'],['releases/'+old.name]);self.assertTrue(self.current.exists());self.assertTrue(self.previous.exists());self.assertTrue(used.exists());self.assertEqual(json.loads(self.u.cleanup_file.read_text())['removed'],report['removed'])
 def test_only_stale_recognized_releases_and_atomic_write_files(self):
  recent=self.release('0.6.0',age=30);unknown=self.base/'releases/custom-backup';unknown.mkdir();outside=self.base/'archives';outside.mkdir();(outside/'keep').write_text('backup');os.symlink(outside,self.base/'releases/0.5.0-0123456789ab')
  corrupt=self.release('0.4.0');(corrupt/'DARKLS_VERSION').write_bytes(b'\xff\xfe')
  old=self.base/'config.json.abcd.new';old.write_text('stale');os.utime(old,(time.time()-90000,)*2)
  fresh=self.base/'update-status.json.fresh.new';fresh.write_text('fresh');other=self.base/'other-data.old.new';other.write_text('keep');os.utime(other,(time.time()-90000,)*2)
  report=self.run_clean();self.assertEqual(report['removed'],[old.name]);self.assertTrue(recent.exists());self.assertTrue(unknown.exists());self.assertTrue((outside/'keep').exists());self.assertTrue(fresh.exists());self.assertTrue(other.exists());self.assertTrue(corrupt.exists())
 def test_pending_update_defers_cleanup_and_keeps_all_data(self):
  old=self.release('0.6.1');atomic_json(self.u.state_file,dict(pending='0.6.4'));self.assertIn('skipped',self.run_clean());self.assertTrue(old.exists())
  self.u.state_file.unlink();(self.base/'restart.request').write_text('{}');self.assertIn('skipped',self.run_clean());self.assertTrue(old.exists())
 def test_disabled_auto_does_not_prevent_explicit_cleanup(self):
  old=self.release('0.6.1');atomic_json(self.u.config_file,dict(auto_cleanup=False));self.assertIn('skipped',self.run_clean());self.assertTrue(old.exists());self.assertEqual(len(self.run_clean(force=True)['removed']),1)
 def test_invalid_rollback_link_and_missing_proc_preserve_releases(self):
  old=self.release('0.6.1');(self.base/'previous').unlink();os.symlink(self.base,self.base/'previous');self.assertIn('skipped',self.run_clean());self.assertTrue(old.exists())
  (self.base/'previous').unlink();self.proc.rmdir();self.assertIn('skipped',self.run_clean());self.assertTrue(old.exists())
 def test_cleanup_uses_the_update_and_rollback_lock(self):
  with self.u.lock():
   with self.assertRaises(ValueError):self.u.cleanup()
 def test_preserves_unrelated_persistent_directories(self):
  for name in ('runtime','data','tools','archives','yam'):
   folder=self.base/name;folder.mkdir();(folder/'keep').write_text(name)
  self.release('0.6.1');self.run_clean()
  for name in ('runtime','data','tools','archives','yam'):self.assertEqual((self.base/name/'keep').read_text(),name)
 def test_config_toggle_preserves_existing_feed(self):
  feed='https://github.com/owner/repo/releases/latest/download/update.json';atomic_json(self.u.config_file,dict(update_feed=feed,auto_update=True))
  result=self.u.configure(dict(auto_cleanup=False));self.assertFalse(result['auto_cleanup']);self.assertEqual(result['feed'],feed);self.assertTrue(result['auto']);self.assertIn('free',result)
  with self.assertRaises(ValueError):self.u.configure(dict(auto_cleanup='false'))
if __name__=='__main__':unittest.main()
