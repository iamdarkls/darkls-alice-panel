import http.server,json,os,socket,subprocess,sys,tempfile,threading,time,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'app'))
from app_web import Discovery,endpoint,hints,listeners,owned_ports,probe

class WebPanels(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
  self.pkg={'name':'test/demo','version':'1'};self.payload=self.root/'pkgs/test/demo/1';self.payload.mkdir(parents=True)
 def detector(self,observed,checker=None):
  d=Discovery(self.root,scanner=lambda *a,**kw:{'test/demo':observed},checker=checker or (lambda *a,**kw:dict(ready=True,detail='Доступно')));self.addCleanup(d.close);return d
 def refresh(self,d,manual=None,disabled=None):
  d.refresh([self.pkg],{}, {},manual or {},disabled or [],0);return d.get('test/demo',manual or {},disabled or [])
 def test_hints_settings_readme_and_validation(self):
  folder=self.payload/'share/test.demo';folder.mkdir(parents=True);(folder/'README.md').write_text('Веб-панель на **:1213**. http://192.168.50.168:8766/ui/ https://example.test:8767/ http://host:8768/?secret=x')
  services={'a':dict(package='test/demo',spec=dict(env={'WEB_PORT':'8765'},exec=['bin/app','--http-port=8769']))}
  result=hints(self.root,self.pkg,services);self.assertEqual([v['port'] for v in result],[8765,8769,8766,1213])
  self.assertIsNone(endpoint(True));self.assertIsNone(endpoint(8080,'//host'));self.assertIsNone(endpoint(8080,'/a?secret'))
 def test_unowned_hint_is_not_probed(self):
  self.pkg=dict(name='vegych/uwu-eyes-panel',version='1');calls=[]
  d=self.detector([],lambda *a,**kw:calls.append(a));d.refresh([self.pkg],{}, {},{},[],0)
  v=d.get(self.pkg['name'],{},[]);self.assertEqual(v['endpoint']['port'],1213);self.assertFalse(v['endpoint']['ready']);self.assertFalse(calls)
 def test_auto_selects_confirmed_owned_port_and_blocks_loopback(self):
  observed=[dict(port=8081,address='127.0.0.1',family=socket.AF_INET)]
  d=self.detector(observed);self.assertFalse(self.refresh(d)['endpoint']['ready'])
  observed.append(dict(port=8081,address='0.0.0.0',family=socket.AF_INET));self.assertTrue(self.refresh(d)['endpoint']['ready'])
 def test_manual_override_and_disabled(self):
  calls=[];d=self.detector([dict(port=8081,address='0.0.0.0',family=socket.AF_INET)],lambda port,*a,**kw:(calls.append(port) or dict(ready=False,detail='offline')))
  result=self.refresh(d,{'test/demo':dict(port=8090,path='/ui')});self.assertEqual(result['endpoint']['port'],8090);self.assertEqual(calls,[8090])
  self.assertIsNone(self.refresh(d,disabled=['test/demo'])['endpoint'])
 def test_listener_ownership_and_child_process(self):
  proc=self.root/'proc';(proc/'net').mkdir(parents=True)
  (proc/'net/tcp').write_text('header\n 0: 00000000:1F90 00000000:0000 0A 0:0 00:0 0 0 0 123 1\n');(proc/'net/tcp6').write_text('header\n')
  for pid,parent in [(100,1),(101,100),(102,1)]:
   folder=proc/str(pid);(folder/'fd').mkdir(parents=True);(folder/'stat').write_text(f'{pid} (worker) S {parent} 0');(folder/'cmdline').write_bytes(b'/bin/sleep\0')
  os.symlink('socket:[123]',proc/'101/fd/3');os.symlink('socket:[456]',proc/'102/fd/3')
  result=owned_ports(self.root,[self.pkg],{'test/demo/worker':dict(package='test/demo')},{'test/demo/worker':100},proc)
  self.assertEqual(result['test/demo'][0]['port'],8080);self.assertEqual(result['test/demo'][0]['address'],'0.0.0.0')
 def test_http_html_json_rtsp_and_404(self):
  class Handler(http.server.BaseHTTPRequestHandler):
   def do_GET(self):
    if self.path=='/rtsp':self.connection.sendall(b'RTSP/1.0 400 Bad Request\r\n\r\n');return
    self.send_response(404 if self.path=='/missing' else 200);self.send_header('Content-Type','application/json' if self.path=='/json' else 'text/html');self.end_headers();self.wfile.write(b'{}' if self.path=='/json' else b'<html>panel</html>')
   def log_message(self,*a):pass
  server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
  try:
   port=server.server_port;self.assertTrue(probe(port)['ready']);self.assertFalse(probe(port,'/json')['ready']);self.assertFalse(probe(port,'/rtsp')['ready']);self.assertFalse(probe(port,'/missing')['ready']);self.assertTrue(probe(port,'/json',manual=True)['ready'])
  finally:server.shutdown();server.server_close();thread.join()
 def test_real_process_owned_http_listener(self):
  script=self.payload/'web.py';script.write_text('import http.server\ns=http.server.HTTPServer(("0.0.0.0",0),http.server.SimpleHTTPRequestHandler)\nprint(s.server_port,flush=True)\ns.serve_forever()\n')
  child=subprocess.Popen([sys.executable,str(script)],stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,text=True)
  try:
   port=int(child.stdout.readline());ports=owned_ports(self.root,[self.pkg],{}, {})
   self.assertTrue(any(v['port']==port and v['address']=='0.0.0.0' for v in ports['test/demo']))
   d=Discovery(self.root);self.addCleanup(d.close);self.assertTrue(self.refresh(d)['endpoint']['ready'])
  finally:child.terminate();child.wait(timeout=3);child.stdout.close()
 def test_async_cache_invalidated_worker_cannot_restore_old_links(self):
  start=threading.Event();finish=threading.Event()
  def scan(*a,**kw):start.set();finish.wait(2);return {}
  d=Discovery(self.root,scanner=scan);self.addCleanup(d.close)
  before=time.monotonic();d.schedule([self.pkg],{}, {},{},[]);self.assertLess(time.monotonic()-before,.2);self.assertTrue(start.wait(1))
  d.invalidate();finish.set()
  deadline=time.monotonic()+2
  while d.running and time.monotonic()<deadline:time.sleep(.01)
  self.assertEqual(d.cache,{})
if __name__=='__main__':unittest.main()
