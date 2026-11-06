import json,os,sys,tempfile,time,unittest,urllib.error,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'app'))
from clock_runtime import ClockRuntime,SEGMENTS,FEATURE,PACKAGE
from yam_host import Host

class Clock(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
  for name in SEGMENTS:
   node=self.root/('pickle:white:clock'+name);node.mkdir();(node/'brightness').write_text('12\n');(node/'trigger').write_text('none [ledfb-clock]\n')
  self.runtime=ClockRuntime(self.root);self.addCleanup(self.runtime.close)
  self.env=self.runtime.issue(PACKAGE+'/worker');self.token=self.env['YAM_API_TOKEN']
  self.opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
 def request(self,path,body=None,token=None,headers=None):
  req=urllib.request.Request(self.env['YAM_API_URL']+path,data=None if body is None else json.dumps(body).encode(),headers={'X-YAM-Token':self.token if token is None else token,'Content-Type':'application/json',**(headers or {})})
  return self.opener.open(req,timeout=3)
 def test_exact_uploaded_binary_contract(self):
  d=json.load(self.request('/device'));self.assertEqual(d['model'],'yandexmini_3_pro');self.assertEqual(d['features'],[FEATURE])
  self.assertTrue(json.load(self.request('/clock',{'segments':{'A0':140,'H3':0,'DEGREE':1}}))['ok'])
  self.assertEqual(self.runtime.node('A0').read_text().strip(),'140')
  self.assertTrue(json.load(self.request('/clock',{'off':True}))['ok']);self.assertEqual(self.runtime.node('A0').read_text().strip(),'12')
  self.assertEqual(self.runtime.node('A0').with_name('trigger').read_text().strip(),'ledfb-clock')
 def test_no_fake_capability_for_missing_hardware(self):
  self.runtime.node('A0').unlink();d=json.load(self.request('/device'));self.assertEqual(d['features'],[])
  with self.assertRaises(urllib.error.HTTPError) as e:self.request('/clock',{'segments':{'A0':30}})
  self.assertEqual(e.exception.code,503)
 def test_tokens_scoped_and_revoked(self):
  self.assertEqual(self.runtime.issue('other/pkg/worker'),{})
  with self.assertRaises(urllib.error.HTTPError) as e:self.request('/device',token='wrong')
  self.assertEqual(e.exception.code,403)
  self.request('/clock',{'segments':{'A0':44}}).close();self.runtime.revoke(PACKAGE+'/worker')
  self.assertEqual(self.runtime.node('A0').read_text().strip(),'12')
  with self.assertRaises(urllib.error.HTTPError) as e:self.request('/device')
  self.assertEqual(e.exception.code,403)
 def test_body_validation_rejects_path_injection_without_partial_write(self):
  for d in [{'segments':{'../../x':1}},{'segments':{'A0':10,'BAD':1}},{'segments':{'A0':True}},{'segments':{'A0':256}},{'off':False},{'off':True,'segments':{'A0':1}}]:
   with self.assertRaises(urllib.error.HTTPError) as e:self.request('/clock',d)
   self.assertEqual(e.exception.code,400)
  self.assertEqual(self.runtime.node('A0').read_text().strip(),'12')
 def test_unsupported_methods_browser_origin_and_second_owner(self):
  with self.assertRaises(urllib.error.HTTPError) as e:self.request('/device',headers={'Origin':'http://evil.test'})
  self.assertEqual(e.exception.code,403)
  with self.assertRaises(urllib.error.HTTPError) as e:self.request('/volume')
  self.assertEqual(e.exception.code,404)
  self.request('/clock',{'segments':{'A0':33}}).close()
  env=self.runtime.issue(PACKAGE+'/second')
  with self.assertRaises(urllib.error.HTTPError) as e:self.request('/clock',{'segments':{'A0':55}},token=env['YAM_API_TOKEN'])
  self.assertEqual(e.exception.code,409)
 def test_revocation_keeps_token_invalid_even_if_restore_fails(self):
  self.request('/clock',{'segments':{'A0':88}}).close();path=self.runtime.node('A0');path.unlink();path.mkdir()
  with self.assertRaises(OSError):self.runtime.revoke(PACKAGE+'/worker')
  self.assertFalse(self.runtime.authorized(self.token))

class HostBridge(unittest.TestCase):
 def test_service_gets_private_env_and_can_use_api_without_executing_uploaded_binary(self):
  import sqlite3
  with tempfile.TemporaryDirectory() as td:
   base=Path(td)/'panel';base.mkdir();root=Path(td)/'yam';(root/'db').mkdir(parents=True)
   package=root/'pkgs/vegych/uwu-eyes-panel/1.11.4';(package/'bin').mkdir(parents=True)
   exe=package/'bin/probe';exe.write_text('#!'+sys.executable+'\nimport os,json,urllib.request\nr=urllib.request.Request(os.environ["YAM_API_URL"]+"/device",headers={"X-YAM-Token":os.environ["YAM_API_TOKEN"]})\nop=urllib.request.build_opener(urllib.request.ProxyHandler({}))\nwith op.open(r) as res: d=json.load(res)\nprint("BRIDGE_OK",d["runtime"],flush=True)\n');exe.chmod(0o755)
   with sqlite3.connect(root/'db/state.sqlite3') as c:
    c.executescript('CREATE TABLE packages(name,version,target,payload_path);CREATE TABLE services(package_name,name,enabled,spec_yaml);')
    c.execute('INSERT INTO packages VALUES(?,?,?,?)',(PACKAGE,'1.11.4','pickle',str(package)))
    c.execute('INSERT INTO services VALUES(?,?,?,?)',(PACKAGE,'worker',1,'exec: [bin/probe]\noneshot: true\n'))
   host=Host(base,root,Path(td)/'run');key=PACKAGE+'/worker'
   try:
    host.action(dict(action='start',service=key));child=host.procs[key];self.assertEqual(child.wait(timeout=3),0)
    deadline=time.monotonic()+2
    while not child.stdout.closed and time.monotonic()<deadline:time.sleep(.02)
    host.tick();self.assertIn('BRIDGE_OK darkls-clock-compat',host.log_path(key).read_text());self.assertFalse(host.clock_runtime.tokens)
    self.assertNotIn('YAM_API_TOKEN',json.dumps(host.status()));self.assertNotIn('YAM_API_URL',json.dumps(host.status()))
   finally:host.close()

if __name__=='__main__':unittest.main()
