from pathlib import Path
import os,sys,tempfile,unittest
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'app'))
from native_retirement import Retirement
from native_station import sensors

class Retire(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
  self.old=self.root/'old';self.old.mkdir();(self.old/'bin').mkdir();(self.old/'bin/yamd').write_bytes(b'old')
  (self.old/'data').mkdir();(self.old/'data/settings.json').write_text('private-data')
  self.hook=self.root/'S99yam';self.hook.write_text('#!/bin/sh\n/data/quazar/yam/bin/yamd\n');self.hook.chmod(0o755)
  self.flag=self.root/'flag';self.flag.touch();self.proc=self.root/'proc';self.proc.mkdir();(self.proc/'mounts').write_text('ubi0 / ubifs ro,relatime 0 0\n')
  self.mounts=[];self.stops=[]
  self.m=Retirement(self.root/'panel',self.old,self.hook,self.flag,self.proc,stop=lambda:self.stops.append(True),mount=lambda rw:self.mounts.append(rw))
 def test_move_preserves_all_data_disables_autostart_and_is_idempotent(self):
  result=self.m.retire();self.assertFalse(result['pending']);archive=Path(result['archive'])
  self.assertEqual((archive/'runtime/data/settings.json').read_text(),'private-data');self.assertTrue((archive/'S99yam').is_file())
  self.assertFalse(self.hook.exists());self.assertFalse(self.flag.exists());self.assertEqual(self.mounts,[True,False]);self.assertEqual(len(self.stops),1)
  self.assertEqual(self.m.retire()['archive'],str(archive));self.assertEqual(len(self.stops),1)
 def test_stop_failure_restores_hook_flag_and_keeps_data(self):
  self.m.stop=lambda:(_ for _ in ()).throw(ValueError('busy process'))
  with self.assertRaisesRegex(ValueError,'busy'):self.m.retire()
  self.assertTrue(self.hook.is_file());self.assertTrue(os.access(self.hook,os.X_OK));self.assertTrue(self.flag.exists())
  self.assertEqual((self.old/'data/settings.json').read_text(),'private-data');self.assertEqual(self.m.info()['status'],'failed')
  self.assertEqual(self.mounts,[True,False,True,False])
 def test_unknown_hook_and_symlinks_never_modified(self):
  self.hook.write_text('unrelated boot service')
  with self.assertRaisesRegex(ValueError,'не относится'):self.m.retire()
  self.assertEqual(self.hook.read_text(),'unrelated boot service');self.assertEqual(self.stops,[])
  self.flag.unlink();self.flag.symlink_to(self.root/'other')
  with self.assertRaisesRegex(ValueError,'ссылки'):self.m.retire()
 def test_process_selection_is_scoped_to_runtime_and_children(self):
  def proc(pid,parent,exe,cwd,args):
   path=self.proc/str(pid);path.mkdir();fields=['S',str(parent)]+['0']*17+['123']
   (path/'stat').write_text(str(pid)+' (worker) '+' '.join(fields))
   (path/'exe').symlink_to(exe);(path/'cwd').symlink_to(cwd);(path/'cmdline').write_bytes(args)
  proc(100,1,str(self.old/'bin/yamd'),str(self.old),b'yamd')
  proc(101,100,'/bin/sh','/',b'worker')
  proc(102,1,'/usr/bin/python','/',b'unrelated')
  self.assertEqual(set(self.m.processes()),{100,101})
 def test_missing_legacy_has_no_effect(self):
  m=Retirement(self.root/'panel',self.root/'missing',self.root/'missing-hook',self.root/'missing-flag',self.proc,stop=lambda:self.fail('must not stop'))
  self.assertFalse(m.retire()['pending']);self.assertEqual(self.mounts,[])

class Sensors(unittest.TestCase):
 def test_kernel_units_and_bad_readings(self):
  with tempfile.TemporaryDirectory() as td:
   root=Path(td);zone=root/'class/thermal/thermal_zone0';zone.mkdir(parents=True);(zone/'type').write_text('soc');(zone/'temp').write_text('45000')
   hw=root/'class/hwmon/hwmon0';hw.mkdir(parents=True);(hw/'name').write_text('sensor');(hw/'humidity1_input').write_text('52300');(hw/'temp1_input').write_text('nan');(hw/'humidity2_input').write_text('999999')
   result=sensors(root);self.assertEqual([s['value'] for s in result],[45,52.3]);self.assertEqual([s['unit'] for s in result],['°C','%'])
 def test_iio_requires_explicit_scale(self):
  with tempfile.TemporaryDirectory() as td:
   root=Path(td);iio=root/'bus/iio/devices/iio:device0';iio.mkdir(parents=True);(iio/'in_illuminance_raw').write_text('500')
   self.assertEqual(sensors(root),[]);(iio/'in_illuminance_scale').write_text('0.2');(iio/'in_illuminance_offset').write_text('10')
   self.assertEqual(sensors(root)[0]['value'],102)

if __name__=='__main__':unittest.main()
