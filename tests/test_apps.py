import contextlib,fcntl,hashlib,json,os,signal,socket,sqlite3,subprocess,sys,tempfile,time,unittest
from pathlib import Path
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'app'))
from yam_host import Host,Client,read_spec,catalogue,runtime
from native_updates import atomic_json

class Apps(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.base=Path(self.tmp.name)/'panel';self.base.mkdir();self.root=Path(self.tmp.name)/'yam';(self.root/'db').mkdir(parents=True)
  self.pkg=self.root/'pkgs/test/demo/1.0.0';(self.pkg/'bin').mkdir(parents=True)
  self.exe=self.pkg/'bin/worker';self.exe.write_text('#!/bin/sh\nprintf "ready: %s %s\\n" "$YAM_PLATFORM" "$1"\nwhile :; do sleep 1; done\n');self.exe.chmod(0o755)
  with sqlite3.connect(self.root/'db/state.sqlite3') as c:
   c.executescript('CREATE TABLE packages(name,version,target,payload_path); CREATE TABLE services(package_name,name,enabled,spec_yaml);')
   c.execute('INSERT INTO packages VALUES(?,?,?,?)',('test/demo','1.0.0','pickle',str(self.pkg)))
   c.execute('INSERT INTO services VALUES(?,?,?,?)',('test/demo','worker',1,'exec: [bin/worker, "hello world"]\nrestart: on-failure\nenv: {EXAMPLE: value}\n'))
  self.host=Host(self.base,self.root,Path(self.tmp.name)/'run');self.addCleanup(self.host.close)
 def wait(self,fn,timeout=3):
  deadline=time.monotonic()+timeout
  while time.monotonic()<deadline:
   if fn():return
   time.sleep(.03)
  self.fail('condition did not become true')
 def test_start_stop_restart_and_live_logs(self):
  key='test/demo/worker';self.host.action(dict(action='start',service=key));pid=self.host.procs[key].pid
  self.wait(lambda:self.host.log_path(key).exists());self.assertIn('hello world',self.host.log_path(key).read_text())
  self.host.action(dict(action='restart',service=key));self.assertNotEqual(self.host.procs[key].pid,pid)
  self.host.action(dict(action='stop',service=key));self.host.tick();self.assertNotIn(key,self.host.procs);self.assertFalse(self.host.cfg['autostart'])
 def test_autostart_survives_host_restart_without_browser(self):
  key='test/demo/worker';self.host.action(dict(action='enable',service=key));self.assertFalse(self.host.procs)
  self.host.close();other=Host(self.base,self.root,Path(self.tmp.name)/'run2');self.addCleanup(other.close);other.tick()
  self.assertIn(key,other.procs);self.assertTrue(other.status()['packages'][0]['services'][0]['autostart'])
 def test_pause_resume_and_mutation_lock(self):
  key='test/demo/worker';self.host.action(dict(action='start',service=key));token=self.host.action(dict(action='pause'))['token']
  self.assertFalse(self.host.procs);self.host.tick();self.assertFalse(self.host.procs)
  with self.assertRaises(ValueError):self.host.action(dict(action='start',service=key))
  self.host.action(dict(action='resume',token=token));self.host.tick();self.assertIn(key,self.host.procs)
  self.host.action(dict(action='stop',service=key))
  with (self.base/'yam2.lock').open('a') as f:
   fcntl.flock(f,fcntl.LOCK_EX)
   with self.assertRaisesRegex(ValueError,'установка'):self.host.action(dict(action='start',service=key))
 def test_stale_pause_recovers_when_panel_disappears(self):
  key='test/demo/worker';self.host.action(dict(action='start',service=key));self.host.action(dict(action='pause'));self.host.pause_started-=10
  self.host.tick();self.assertFalse(self.host.pause_token);self.assertIn(key,self.host.procs)
 def test_oneshot_completion_and_failure_backoff(self):
  key='test/demo/worker';self.exe.write_text('#!/bin/sh\nexit 3\n')
  self.host.action(dict(action='start',service=key));self.wait(lambda:self.host.procs[key].poll() is not None);self.host.tick()
  self.assertEqual(self.host.state[key]['exit'],3);self.assertEqual(self.host.state[key]['status'],'backoff');self.assertFalse(self.host.procs)
  with sqlite3.connect(self.root/'db/state.sqlite3') as c:c.execute('UPDATE services SET spec_yaml=?',('exec: [bin/worker]\noneshot: true\nrestart: always\n',))
  self.exe.write_text('#!/bin/sh\nexit 0\n');self.host.refresh();self.host.action(dict(action='start',service=key));self.wait(lambda:self.host.procs[key].poll() is not None);self.host.tick();self.host.tick()
  self.assertIn(key,self.host.completed);self.assertEqual(self.host.state[key]['status'],'completed');self.assertFalse(self.host.procs)
 def test_spec_paths_env_and_aliases_rejected(self):
  for value in ['exec: [/bin/sh]','exec: [../bad]','exec: shell-command','exec: [bin/worker]\nenv: {YAM_ROOT: /etc}','exec: &a [bin/worker]\nafter: *a']:
   with self.assertRaises(ValueError):read_spec(value)
  self.host.services['test/demo/worker']['spec']['exec']=['bin/link'];(self.pkg/'bin/link').symlink_to('/bin/sh')
  with self.assertRaises(ValueError):self.host.action(dict(action='start',service='test/demo/worker'))
 def test_database_is_read_only_and_unknown_schema_fails(self):
  before=(self.root/'db/state.sqlite3').read_bytes();catalogue(self.root);self.assertEqual((self.root/'db/state.sqlite3').read_bytes(),before)
  with sqlite3.connect(self.root/'db/state.sqlite3') as c:c.execute('DROP TABLE services')
  with self.assertRaisesRegex(ValueError,'database'):catalogue(self.root)
 def test_metadata_web_validation_and_reserved_names(self):
  self.host.action(dict(action='metadata',package='test/demo',description='Player',port=8088,path='/ui/'))
  card=self.host.status()['packages'][0];self.assertEqual(card['description'],'Player');self.assertEqual(card['web']['port'],8088)
  for path in ['//evil.test','/bad?token=x','/bad\\path']:
   with self.assertRaises(ValueError):self.host.action(dict(action='metadata',package='test/demo',description='',port=8088,path=path))
 def test_after_unknown_dependency_is_visible(self):
  key='test/demo/worker';self.host.services[key]['spec']['after']=['missing']
  self.host.action(dict(action='start',service=key));self.assertFalse(self.host.procs);self.assertEqual(self.host.state[key]['status'],'waiting')
 def test_package_removal_stops_running_service_and_prunes_autostart(self):
  key='test/demo/worker';self.host.action(dict(action='enable',service=key));self.host.action(dict(action='start',service=key));token=self.host.action(dict(action='pause'))['token']
  with sqlite3.connect(self.root/'db/state.sqlite3') as c:c.executescript('DELETE FROM services; DELETE FROM packages;')
  self.host.action(dict(action='resume',token=token));self.host.tick();self.assertFalse(self.host.procs);self.assertFalse(self.host.cfg['autostart'])
 def test_recovery_report_has_expected_services_and_boot_id(self):
  key='test/demo/worker';self.host.action(dict(action='enable',service=key));self.host.action(dict(action='start',service=key));self.host.tick()
  class Response:
   def __enter__(self):return self
   def __exit__(self,*a):pass
   def read(self):return b'{"native":true}'
  atomic_json(self.base/'config.json',dict(port=8770))
  with patch('urllib.request.OpenerDirector.open',return_value=Response()),patch('subprocess.run',return_value=subprocess.CompletedProcess([],0)):
   self.host.check_recovery()
  self.assertTrue(self.host.recovery['ok']);self.assertEqual(self.host.recovery['boot_id'],self.host.boot_id);self.assertTrue((self.base/'data/yam-recovery.json').is_file())
 def test_process_group_cleanup_includes_children(self):
  key='test/demo/worker';self.exe.write_text('#!/bin/sh\nsleep 100 &\necho $! > "$YAM_VAR/child"\nwait\n')
  self.host.action(dict(action='start',service=key));self.wait(lambda:(self.root/'var/child').is_file());pid=int((self.root/'var/child').read_text())
  self.host.action(dict(action='stop',service=key))
  def dead():
   try:return Path('/proc/'+str(pid)+'/stat').read_text().split(') ')[1].startswith('Z')
   except FileNotFoundError:return True
  self.wait(dead)
 def test_rollback_to_release_without_host_requests_shutdown(self):
  (self.base/'current').mkdir();self.host.tick();self.assertTrue(self.host.stop_event.is_set())
 def test_log_rotation_is_bounded(self):
  key='test/demo/worker';self.exe.write_text('#!/bin/sh\nhead -c 600000 /dev/zero\n')
  self.host.action(dict(action='start',service=key));child=self.host.procs[key];child.wait(timeout=3);self.wait(lambda:child.stdout.closed)
  path=self.host.log_path(key);self.assertLessEqual(path.stat().st_size,256*1024);self.assertLessEqual(path.with_suffix('.log.1').stat().st_size,256*1024)
 def test_real_package_mutation_coordinates_host(self):
  from native_yam2 import Yam2
  client=Client(self.base,self.root)
  try:
   client.ensure();client.request(dict(op='action',action='start',service='test/demo/worker'))
   manager=Yam2(self.base,self.root);manager.app_host=client
   with manager.mutation(pause=True):
    status=client.request(dict(op='status'));self.assertTrue(status['paused']);self.assertEqual(status['packages'][0]['services'][0]['status'],'stopped')
   self.wait(lambda:client.request(dict(op='status'))['packages'][0]['services'][0]['status']=='running')
  finally:
   with contextlib.suppress(OSError,ValueError):client.request(dict(op='shutdown'))
 def test_ipc_host_single_instance_and_detached_restart(self):
  client=Client(self.base,self.root)
  try:
   try:result=client.ensure()
   except Exception:
    print((self.base/'app-host.log').read_text());raise
   self.assertIn('packages',result);self.assertEqual(result['protocol'],1)
   info=json.loads(client.endpoint.read_text());self.assertEqual(client.endpoint.stat().st_mode & 0o777,0o600)
   with socket.create_connection(('127.0.0.1',info['port'])) as sock:
    sock.sendall(b'{"op":"action","action":"start","token":"bad"}\n');self.assertIn('Unauthorized',sock.recv(4096).decode())
   client.ensure();self.assertEqual(json.loads(client.endpoint.read_text())['pid'],info['pid'])
   client.request(dict(op='action',action='enable',service='test/demo/worker'))
   client.request(dict(op='shutdown'));self.wait(lambda:not client.endpoint.exists(),5)
   status=client.ensure();self.wait(lambda:client.request(dict(op='status'))['packages'][0]['services'][0]['status']=='running')
   self.assertTrue(status['packages'][0]['services'][0]['autostart'])
  finally:
   with contextlib.suppress(OSError,ValueError):client.request(dict(op='shutdown'))

if __name__=='__main__':unittest.main()
