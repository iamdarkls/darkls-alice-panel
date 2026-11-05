import hashlib
from http.server import ThreadingHTTPServer
import http.cookiejar
import importlib.util
import io
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import tarfile
import tempfile
import threading
import time
import unittest
import urllib.request
import urllib.error
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'app'))
import native_features as f
import native_updates as u
import access

class Features(unittest.TestCase):
 def setUp(self):
  self.t=tempfile.TemporaryDirectory();self.base=Path(self.t.name)
  (self.base/'data').mkdir();(self.base/'releases/old').mkdir(parents=True)
  (self.base/'releases/old/DARKLS_VERSION').write_text('0.2.0')
  (self.base/'releases/old/native.py').write_text('old')
  u.point(self.base,'current',self.base/'releases/old')
  u.atomic_json(self.base/'config.json',dict(device_ip='192.168.50.168'))
  self.m=f.Maintenance(self.base);self.m.temp=self.base/'tmp'
  u.atomic_json(self.base/'data/.panel_settings.json',dict(volume=10))
  u.atomic_json(self.base/'data/.panel_auth.json',dict(private='passwordhash'))
  u.atomic_json(self.base/'data/.yandex_auth.json',dict(token='private-token'))
 def tearDown(self):self.t.cleanup()
 def test_atomic_json_concurrent_writers_do_not_share_temporary_files(self):
  import concurrent.futures
  p=self.base/'concurrent.json'
  with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
   list(pool.map(lambda n:u.atomic_json(p,dict(value=n)),range(30)))
  self.assertIn(u.load_json(p)['value'],range(30))
  self.assertEqual(list(self.base.glob('concurrent.json.*.new')),[])
 def test_backup_excludes_secrets_by_default_and_captures_version(self):
  b=self.m.create_backup();meta,entries=self.m.inspect_backup(self.m.download(b['name']).read_bytes())
  self.assertNotIn('panel/.yandex_auth.json',entries)
  self.assertNotIn('panel/.panel_auth.json',entries)
  self.assertEqual(meta['version'],'0.2.0')
  self.assertTrue(self.m.info()['last_backup']['created'])
 def test_secret_restore_keeps_password_and_builds_undo(self):
  b=self.m.create_backup(True);blob=self.m.download(b['name']).read_bytes()
  u.atomic_json(self.base/'data/.panel_settings.json',dict(volume=20))
  v=self.m.restore(blob)
  self.assertEqual(u.load_json(self.base/'data/.panel_settings.json'),dict(volume=10))
  _,undo=self.m.inspect_backup(self.m.download(v['undo']['name']).read_bytes())
  self.assertEqual(json.loads(undo['panel/.panel_settings.json']),dict(volume=20))
  self.assertEqual(u.load_json(self.base/'data/.panel_auth.json'),dict(private='passwordhash'))
 def test_restore_tampered_manifest_rejected_before_writes(self):
  b=self.m.create_backup();blob=self.m.download(b['name']).read_bytes()
  out=io.BytesIO()
  with tarfile.open(fileobj=io.BytesIO(blob),mode='r:gz') as src,tarfile.open(fileobj=out,mode='w:gz') as dst:
   for member in src:
    value=src.extractfile(member).read()
    if member.name=='panel/.panel_settings.json':value=b'{"hacked":true}'
    member.size=len(value);dst.addfile(member,io.BytesIO(value))
  with self.assertRaises(ValueError):self.m.restore(out.getvalue())
  self.assertEqual(u.load_json(self.base/'data/.panel_settings.json'),dict(volume=10))
 def test_traversal_link_and_duplicate_archives_rejected(self):
  for names in [('../outside',),('link',),('manifest.json','manifest.json')]:
   out=io.BytesIO()
   with tarfile.open(fileobj=out,mode='w:gz') as tf:
    for name in names:
     m=tarfile.TarInfo(name)
     if name=='link':m.type=tarfile.SYMTYPE;m.linkname='/etc/passwd'
     tf.addfile(m)
   with self.assertRaises(ValueError):self.m.inspect_backup(out.getvalue())
 def test_voice_token_masked_preserved_and_start_gated(self):
  v=self.m.voice_config(dict(url='https://voice.example.test',token='x'*32))
  self.assertNotIn('token',v);self.assertTrue(v['has_token'])
  self.m.voice_config(dict(url='https://voice.example.test',token=''))
  self.assertEqual(u.load_json(self.m.voice_file)['token'],'x'*32)
  with patch.object(f.OPENER,'open') as network:
   with self.assertRaisesRegex(ValueError,'совместимость'):self.m.voice_request('start')
   network.assert_not_called()
 def test_voice_rejects_public_cleartext_and_embedded_credentials(self):
  for url in ['http://8.8.8.8:8781','https://name:pass@voice.test','http://voice.test','http://169.254.169.254']:
   with self.assertRaises(ValueError):self.m.voice_config(dict(url=url,token='x'*32))
 def test_rollback_only_switches_release_and_preserves_data(self):
  n=self.base/'releases/new';n.mkdir();(n/'native.py').write_text('new');(n/'DARKLS_VERSION').write_text('0.3.0')
  u.point(self.base,'previous',self.base/'releases/old');u.point(self.base,'current',n)
  self.assertTrue(f.rollback(u.Updater(self.base))['restarting'])
  self.assertEqual((self.base/'current').resolve().name,'old')
  self.assertEqual((self.base/'previous').resolve().name,'new')
  self.assertEqual(u.load_json(self.base/'data/.panel_settings.json'),dict(volume=10))
  with self.assertRaises(ValueError):f.rollback(u.Updater(self.base))
 def test_diagnostics_bounded_report_omits_tokens(self):
  v=self.m.diagnostics(network=False)
  self.assertIn('checks',v);self.assertIn('storage',v)
  self.assertNotIn('private-token',json.dumps(v));self.assertTrue(self.m.info()['last_diagnostics'])

class Agent(unittest.TestCase):
 def test_agent_auth_and_exact_unit_allowlist(self):
  spec=importlib.util.spec_from_file_location('agent',ROOT/'linux-agent/voice_agent.py');agent=importlib.util.module_from_spec(spec);spec.loader.exec_module(agent)
  with tempfile.TemporaryDirectory() as td:
   cfg=Path(td)/'agent.json';cfg.write_text(json.dumps(dict(token='x'*32,unit='test-voice.service',compatibility_confirmed=False)))
   with patch.object(agent,'CONFIG',cfg),patch.object(agent.subprocess,'run',return_value=subprocess.CompletedProcess([],0,'LoadState=loaded\nActiveState=inactive\nSubState=dead\n','')) as run:
    srv=ThreadingHTTPServer(('127.0.0.1',0),agent.Handler);threading.Thread(target=srv.serve_forever,daemon=True).start()
    try:
     url='http://127.0.0.1:'+str(srv.server_port)+'/v1/'
     with self.assertRaises(urllib.error.HTTPError) as e:urllib.request.urlopen(url+'status')
     self.assertEqual(e.exception.code,401);run.assert_not_called()
     req=urllib.request.Request(url+'status',headers={'Authorization':'Bearer '+'x'*32})
     self.assertEqual(json.load(urllib.request.urlopen(req))['state']['ActiveState'],'inactive')
     req=urllib.request.Request(url+'start',data=b'{}',headers={'Authorization':'Bearer '+'x'*32})
     with self.assertRaises(urllib.error.HTTPError) as e:urllib.request.urlopen(req)
     self.assertEqual(e.exception.code,409)
     self.assertTrue(all(call.args[0][0:2]==['systemctl','show'] for call in run.call_args_list))
    finally:srv.shutdown();srv.server_close()

@unittest.skipUnless(os.geteuid()==0,'native server uses root')
class Http(unittest.TestCase):
 def test_real_authenticated_routes_restore_and_csrf(self):
  with tempfile.TemporaryDirectory() as td:
   base=Path(td);(base/'data').mkdir();(base/'releases/current').mkdir(parents=True)
   (base/'releases/current/DARKLS_VERSION').write_text('0.3.0');u.point(base,'current',base/'releases/current')
   u.atomic_json(base/'data/.panel_settings.json',dict(volume=5))
   access.PanelAccess(base/'data/.panel_auth.json').set_password(None,'test-password-only','test')
   sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close()
   p=subprocess.Popen([sys.executable,str(ROOT/'app/native.py'),'--host','127.0.0.1','--port',str(port),'--https-port','0','--data-dir',str(base/'data'),'--device','127.0.0.1:5555'],env=dict(os.environ,DARKLS_BASE=td),stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
   op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
   url='http://127.0.0.1:'+str(port)
   def req(path,data=None,headers=None):
    r=urllib.request.Request(url+path,data=None if data is None else json.dumps(data).encode(),headers={'Content-Type':'application/json',**(headers or {})})
    return op.open(r,timeout=15)
   try:
    for _ in range(70):
     try:req('/api/native/health').close();break
     except OSError:time.sleep(.1)
    with self.assertRaises(urllib.error.HTTPError) as e:req('/api/native/voice')
    self.assertEqual(e.exception.code,401)
    with self.assertRaises(urllib.error.HTTPError) as e:req('/api/yam2/status')
    self.assertEqual(e.exception.code,401)
    req('/api/panel-auth/login',dict(password='test-password-only')).close()
    self.assertEqual(json.load(req('/api/yam2/status'))['manager'],'YAM v2 CLI')
    with self.assertRaises(urllib.error.HTTPError) as e:req('/api/yam2/action',{'action':'doctor'},{'Origin':'https://foreign.test'})
    self.assertEqual(e.exception.code,403)
    self.assertIn('capabilities',json.load(req('/api/yam2/status')))
    self.assertFalse(json.load(req('/api/native/voice'))['has_token'])
    with self.assertRaises(urllib.error.HTTPError) as e:req('/api/native/backups/create',{},dict(Origin='https://foreign.test'))
    self.assertEqual(e.exception.code,403)
    backup=json.load(req('/api/native/backups/create',{}))
    blob=req(backup['download']).read()
    r=urllib.request.Request(url+'/api/native/backups/restore',data=blob,headers={'Content-Type':'application/octet-stream'})
    self.assertTrue(json.load(op.open(r))['ok'])
    with self.assertRaises(urllib.error.HTTPError):req('/api/native/voice/start',{})
    page=req('/').read().decode();self.assertIn('id="tab-chatgpt"',page);self.assertIn('id="tab-backups"',page);self.assertIn('id="tab-yam"',page)
   finally:
    p.terminate();out=p.communicate(timeout=10)[0]
   self.assertNotIn(b'Traceback',out)

if __name__=='__main__':unittest.main()
