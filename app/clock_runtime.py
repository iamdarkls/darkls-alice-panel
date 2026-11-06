"""Small authenticated YAM-compatible clock API for UwU Eyes on Pickle.
This is not a general YAM/Luna runtime. It exposes only verified device/clock methods.
"""
import contextlib,hmac,json,os,re,secrets,threading
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

PACKAGE='vegych/uwu-eyes-panel'
SEGMENTS=tuple(f'{s}{p}' for p in range(4) for s in 'ABCDEFGH')+('DEGREE','DH','DL','DM')
FEATURE='display.clock.segment.v1'

class ClockRuntime:
    def __init__(self,leds='/sys/class/leds',start=True):
        self.leds=Path(leds);self.tokens={};self.lock=threading.RLock();self.owner=None;self.snapshot={};self.triggers={};self.server=None
        if start:
            runtime=self
            class Handler(BaseHTTPRequestHandler):
                protocol_version='HTTP/1.1'
                def log_message(self,*args):pass
                def send(self,code,value):
                    body=json.dumps(value,ensure_ascii=False).encode();self.send_response(code);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(body)));self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(body)
                def handle_api(self):
                    self.connection.settimeout(3)
                    token=self.headers.get('X-YAM-Token','')
                    if self.client_address[0]!='127.0.0.1' or not runtime.authorized(token):return self.send(403,dict(error='Runtime token required'))
                    # Browsers must not use a service credential to control LEDs cross-origin.
                    if self.headers.get('Origin') is not None:return self.send(403,dict(error='Browser origins are not accepted'))
                    path=urlsplit(self.path).path
                    if self.command=='GET' and path=='/api/device':return self.send(200,runtime.device())
                    if self.command!='POST' or path!='/api/clock':return self.send(404,dict(error='Only device and clock API are supported'))
                    try:
                        size=int(self.headers.get('Content-Length','0'))
                        if not 0<size<=4096:self.close_connection=True;return self.send(413,dict(error='Clock payload must be 1..4096 bytes'))
                        if self.headers.get('Content-Type','').split(';')[0]!='application/json':return self.send(415,dict(error='JSON required'))
                        body=json.loads(self.rfile.read(size));value=runtime.clock(token,body)
                        return self.send(200,value)
                    except (ValueError,KeyError) as e:return self.send(400,dict(error=str(e)))
                    except BlockingIOError as e:return self.send(409,dict(error=str(e)))
                    except OSError:return self.send(503,dict(error='Clock hardware is unavailable'))
                do_GET=handle_api
                do_POST=handle_api
            class Server(ThreadingHTTPServer):daemon_threads=True
            self.server=Server(('127.0.0.1',0),Handler)
            threading.Thread(target=self.server.serve_forever,daemon=True).start()
    def node(self,name):return self.leds/('pickle:white:clock'+name)/'brightness'
    def available(self):return all(self.node(name).is_file() and os.access(self.node(name),os.R_OK|os.W_OK) for name in SEGMENTS)
    def authorized(self,token):
        if not isinstance(token,str) or not token:return False
        with self.lock:return any(hmac.compare_digest(token,t) for t in self.tokens)
    def issue(self,key):
        if key.rsplit('/',1)[0]!=PACKAGE:return {}
        with self.lock:
            if not self.server:raise ValueError('Clock runtime not listening')
            if self.owner is not None and self.owner not in self.tokens:self.restore()
            token=secrets.token_urlsafe(32);self.tokens[token]=key
            return dict(YAM_API_URL='http://127.0.0.1:'+str(self.server.server_port)+'/api',YAM_API_TOKEN=token)
    def device(self):
        supported=self.available()
        return dict(model='yandexmini_3_pro' if supported else 'unverified',platform='pickle' if supported else None,
                    features=[FEATURE] if supported else [],runtime='darkls-clock-compat',supported_methods=['GET /device','POST /clock'])
    def restore(self):
        errors=[]
        for name,value in self.snapshot.items():
            try:self.node(name).write_text(value+'\n')
            except OSError:errors.append(name)
        for name,value in self.triggers.items():
            try:self.node(name).with_name('trigger').write_text(value+'\n')
            except OSError:errors.append(name)
        if errors:raise OSError('Could not restore clock segments')
        self.owner=None;self.snapshot={};self.triggers={}
    def clock(self,token,data):
        with self.lock:
            if not self.authorized(token):raise ValueError('Unknown runtime token')
            if not isinstance(data,dict) or set(data)-{'off','segments'}:raise ValueError('Expected segments or off')
            if self.owner is not None and self.owner!=token:raise BlockingIOError('Clock is already owned by another application')
            if data=={'off':True}:
                if self.owner==token:self.restore()
                return dict(ok=True)
            if set(data)!={'segments'} or not isinstance(data['segments'],dict) or not data['segments']:raise ValueError('Expected nonempty segments map or off=true')
            values=data['segments']
            if any(k not in SEGMENTS or type(v)!=int or not 0<=v<=255 for k,v in values.items()):raise ValueError('Unknown segment or brightness outside 0..255')
            if not self.available():raise OSError('Segment clock is not available')
            if self.owner is None:
                before={name:self.node(name).read_text().strip() for name in SEGMENTS}
                if any(not v.isdecimal() or not 0<=int(v)<=255 for v in before.values()):raise ValueError('Invalid hardware brightness snapshot')
                triggers={}
                for name in SEGMENTS:
                    path=self.node(name).with_name('trigger')
                    if path.is_file():
                        active=re.search(r'\[([A-Za-z0-9_-]{1,64})\]',path.read_text())
                        if active:triggers[name]=active[1]
                self.snapshot=before;self.triggers=triggers;self.owner=token
            try:
                for name,value in values.items():self.node(name).write_text(str(value)+'\n')
            except OSError:
                with contextlib.suppress(OSError):self.restore()
                raise
            return dict(ok=True)
    def revoke(self,key):
        with self.lock:
            for token,name in list(self.tokens.items()):
                if name!=key:continue
                try:
                    if self.owner==token:self.restore()
                finally:self.tokens.pop(token,None)
    def close(self):
        with self.lock:
            with contextlib.suppress(OSError):self.restore()
            self.tokens.clear()
        if self.server:self.server.shutdown();self.server.server_close()
