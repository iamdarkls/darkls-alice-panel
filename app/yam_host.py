"""Local service host for YAM v2. Config is owned by the panel, YAM SQLite is read-only."""
import argparse,atexit,collections,contextlib,fcntl,hashlib,hmac,json,os,re,signal,socket,sqlite3,subprocess,sys,threading,time
from pathlib import Path,PurePosixPath
from urllib.parse import quote
from native_updates import atomic_json,load_json
from vendor import yaml
from clock_runtime import ClockRuntime,PACKAGE as CLOCK_PACKAGE

PROTOCOL=1
CODE=hashlib.sha256(Path(__file__).read_bytes()+Path(__file__).with_name('clock_runtime.py').read_bytes()).hexdigest()
MAX_RUNNING=8
SERVICE_RE=r'[a-z0-9][a-z0-9-]{0,63}/[a-z0-9][a-z0-9-]{0,63}/[a-z0-9-]{1,64}'
class Loader(yaml.SafeLoader):
    def compose_node(self,parent,index):
        if self.check_event(yaml.AliasEvent):raise ValueError('YAML aliases are not supported')
        return super().compose_node(parent,index)

def read_spec(raw):
    if not isinstance(raw,str) or len(raw.encode())>32768:raise ValueError('Service spec exceeds 32 KB')
    try:d=yaml.load(raw,Loader=Loader)
    except yaml.YAMLError as e:raise ValueError('Invalid service YAML') from e
    if not isinstance(d,dict) or set(d)-{'exec','restart','after','env','oneshot'}:raise ValueError('Unknown service fields')
    argv=d.get('exec');env=d.get('env') or {};after=d.get('after') or []
    if not isinstance(argv,list) or not 1<=len(argv)<=128 or any(not isinstance(a,str) or '\0' in a or len(a)>4096 for a in argv):raise ValueError('Service exec must be an argument array')
    path=PurePosixPath(argv[0])
    if path.is_absolute() or not path.parts or any(p in ('.','..') for p in path.parts):raise ValueError('Service executable must be inside the package')
    if not isinstance(env,dict) or len(env)>128 or any(not isinstance(k,str) or not re.fullmatch('[A-Z_][A-Z0-9_]*',k) or not isinstance(v,str) or '\0' in v or len(v)>4096 for k,v in env.items()):raise ValueError('Invalid service environment')
    if any(k.startswith('YAM_') for k in env):raise ValueError('Service overrides reserved runtime variables')
    if not isinstance(after,list) or len(after)>64 or any(not isinstance(a,str) or len(a)>200 for a in after):raise ValueError('Invalid service dependencies')
    if d.get('restart','never') not in ('never','on-failure','always') or not isinstance(d.get('oneshot',False),bool):raise ValueError('Invalid restart policy')
    return dict(exec=argv,env=env,after=after,restart=d.get('restart','never'),oneshot=d.get('oneshot',False))

def catalogue(root):
    root=Path(root);db=root/'db/state.sqlite3'
    if not db.is_file():return [],{}
    packages=[];services={}
    try:
        with sqlite3.connect('file:'+quote(str(db.resolve()))+'?mode=ro',uri=True,timeout=2) as c:
            for name,version,target,payload in c.execute('SELECT name,version,target,payload_path FROM packages ORDER BY name'):
                if not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,63}/[a-z0-9][a-z0-9-]{0,63}',name) or not re.fullmatch(r'[A-Za-z0-9.+-]{1,100}',version):continue
                packages.append(dict(name=name,version=version,target=target));package_root=Path(payload).resolve()
                expected=(root/'pkgs'/name/version).resolve()
                if package_root!=expected or not package_root.is_relative_to((root/'pkgs').resolve()):continue
                for service,enabled,raw in c.execute('SELECT name,enabled,spec_yaml FROM services WHERE package_name=? ORDER BY name',(name,)):
                    key=name+'/'+service
                    if not re.fullmatch(SERVICE_RE,key):continue
                    item=dict(id=key,package=name,name=service,package_root=str(package_root),version=version,declared_enabled=bool(enabled))
                    try:item['spec']=read_spec(raw)
                    except ValueError as e:item['error']=str(e)
                    services[key]=item
    except sqlite3.Error as e:raise ValueError('Unsupported or unavailable YAM database: '+str(e)) from e
    return packages,services

class Host:
    def __init__(self,base,root='/data/yam',run=None):
        self.base=Path(base);self.root=Path(root);self.yam_run=Path('/tmp/yam') if str(self.root)=='/data/yam' else self.root/'run';self.run=Path(run or runtime(base));self.run.mkdir(parents=True,exist_ok=True,mode=0o700)
        self.settings=self.base/'data/yam-apps.json';self.cfg=load_json(self.settings,dict(autostart=[],web={},descriptions={}))
        self.cfg.setdefault('autostart',[]);self.cfg.setdefault('web',{});self.cfg.setdefault('descriptions',{})
        self.procs={};self.state={};self.log_locks=collections.defaultdict(threading.Lock);self.wanted=set(self.cfg['autostart']);self.manual_stops=set();self.completed=set();self.pause_token=None;self.pause_started=0
        self.lock=threading.RLock();self.stop_event=threading.Event();self.started=time.time();self.last_scan=0;self.packages=[];self.services={};self.error=None
        self.boot_id=read('/proc/sys/kernel/random/boot_id','unknown');self.recovery=load_json(self.base/'data/yam-recovery.json',{})
        self.check_due=time.monotonic()+15;self.check_pending=True;self.refresh();self.clock_runtime=None
    def refresh(self):
        try:self.packages,self.services=catalogue(self.root);self.error=None
        except ValueError as e:self.error=str(e)
        self.last_scan=time.monotonic()
    def save(self):atomic_json(self.settings,self.cfg)
    def dependencies(self,item):
        for dep in item['spec']['after']:
            if dep=='network':
                # Local network readiness, not an assertion of Internet access.
                lines=read('/proc/net/route','').splitlines()[1:]
                if not any(len(p:=line.split())>3 and p[0]!='lo' and int(p[3],16)&1 for line in lines):return 'Ожидаем сетевой интерфейс'
            elif dep=='quasar':
                if not any('maind' in read(p,'') for p in Path('/proc').glob('[0-9]*/comm')):return 'Ожидаем Quasar'
            else:
                key=dep if dep.count('/')==2 else item['package']+'/'+dep
                if key not in self.services:return 'Неизвестная зависимость: '+dep
                if key not in self.procs and key not in self.completed:return 'Ожидаем службу: '+key
        return None
    def mutating(self):
        if (self.root/'db/transaction.json').exists():return True
        with contextlib.ExitStack() as stack:
            try:
                for path in (self.base/'yam2.lock',self.yam_run/'yam.lock'):
                    if path.exists():
                        f=stack.enter_context(path.open('a'));fcntl.flock(f,fcntl.LOCK_SH|fcntl.LOCK_NB)
                return False
            except BlockingIOError:return True
    def argv_env(self,item):
        spec=item['spec'];pkg=Path(item['package_root']);exe=(pkg/spec['exec'][0]).resolve()
        if not exe.is_relative_to(pkg) or not exe.is_file() or not os.access(exe,os.X_OK):raise ValueError('Executable is missing, not executable, or escapes package')
        variables={'YAM_ROOT':str(self.root),'YAM_PKG':str(pkg),'YAM_ETC':str(self.root/'etc'),'YAM_VAR':str(self.root/'var'),'YAM_RUN':str(self.yam_run),'YAM_PLATFORM':'pickle'}
        def expand(value):
            value=re.sub(r'\$\{(YAM_[A-Z_]+)\}',lambda m:variables.get(m[1],m[0]),value)
            return value
        for path in (self.root/'etc',self.root/'var',self.yam_run):path.mkdir(parents=True,exist_ok=True)
        env={'PATH':str(self.root/'bin')+':/opt/bin:/opt/sbin:/usr/sbin:/usr/bin:/sbin:/bin','LANG':'C.UTF-8',**{k:expand(v) for k,v in spec['env'].items()},**variables}
        return [str(exe),*[expand(a) for a in spec['exec'][1:]]],env
    def log_path(self,key):return self.base/'app-logs'/(hashlib.sha256(key.encode()).hexdigest()[:24]+'.log')
    def pump(self,key,child):
        path=self.log_path(key);path.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
        try:
            while data:=child.stdout.read(4096):
                with self.log_locks[key]:
                    if path.exists() and path.stat().st_size+len(data)>256*1024:os.replace(path,path.with_suffix('.log.1'))
                    with path.open('ab') as f:f.write(data)
                    path.chmod(0o600)
        except OSError:pass
        finally:child.stdout.close()
    def ensure_runtime(self):
        if self.clock_runtime is None:self.clock_runtime=ClockRuntime()
        return self.clock_runtime
    def launch(self,key):
        item=self.services[key];state=self.state.setdefault(key,{})
        if item.get('error'):raise ValueError(item['error'])
        if not item['declared_enabled']:raise ValueError('Service disabled in YAM declaration')
        if len(self.procs)>=MAX_RUNNING:raise ValueError('Одновременно разрешено до 8 служб')
        reason=self.dependencies(item)
        if reason:state.update(status='waiting',detail=reason);return
        argv,env=self.argv_env(item)
        if item['package']==CLOCK_PACKAGE:env.update(self.ensure_runtime().issue(key))
        try:child=subprocess.Popen(argv,cwd=item['package_root'],env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,start_new_session=True,bufsize=0)
        except Exception:
            if self.clock_runtime:self.clock_runtime.revoke(key)
            raise
        self.procs[key]=child;self.completed.discard(key)
        state.update(status='running',pid=child.pid,started=time.time(),detail='',fingerprint=hashlib.sha256(json.dumps(item,sort_keys=True).encode()).hexdigest())
        threading.Thread(target=self.pump,args=(key,child),daemon=True).start()
    def terminate(self,key):
        child=self.procs.pop(key,None)
        if child:
            # Always clean the process group, including children after a launcher exits.
            with contextlib.suppress(ProcessLookupError):os.killpg(child.pid,signal.SIGTERM)
            try:child.wait(timeout=10 if key.rsplit('/',1)[0]==CLOCK_PACKAGE else 3)
            except subprocess.TimeoutExpired:
                with contextlib.suppress(ProcessLookupError):os.killpg(child.pid,signal.SIGKILL)
                child.wait(timeout=2)
            with contextlib.suppress(ProcessLookupError):os.killpg(child.pid,signal.SIGKILL)
        self.state.setdefault(key,{})['detail']=''
        if self.clock_runtime:
            try:self.clock_runtime.revoke(key)
            except OSError:self.state.setdefault(key,{})['detail']='Не удалось восстановить экран после остановки'
        self.state.setdefault(key,{}).update(status='stopped',pid=None)
    def tick(self):
        if not self.base.is_dir():self.stop_event.set();return
        current=self.base/'current'
        if current.is_dir() and not (current/'native_apps.py').is_file():self.stop_event.set();return
        with self.lock:
            if time.monotonic()-self.last_scan>3:self.refresh()
            for key,child in list(self.procs.items()):
                item=self.services.get(key);state=self.state[key]
                if item is None or hashlib.sha256(json.dumps(item,sort_keys=True).encode()).hexdigest()!=state['fingerprint']:
                    self.terminate(key);self.completed.discard(key);continue
                rc=child.poll()
                if rc is None:continue
                self.terminate(key);state.update(exit=rc,finished=time.time(),status='completed' if rc==0 else 'failed')
                spec=item['spec'];restart=not spec['oneshot'] and (spec['restart']=='always' or spec['restart']=='on-failure' and rc!=0)
                if not restart:self.completed.add(key)
                failures=state.setdefault('failures',[]);failures[:]=[t for t in failures if time.time()-t<60]
                if rc!=0:failures.append(time.time())
                delay=60 if len(failures)>=5 else min(30,2**min(len(failures),4))
                state['retry_at']=time.time()+delay
            if self.pause_token and time.monotonic()-self.pause_started>5 and not self.mutating():
                self.pause_token=None;self.refresh()
            if not self.pause_token and not self.mutating() and not self.error:
                for key in sorted(self.wanted-self.manual_stops-self.completed):
                    if key in self.procs or key not in self.services:continue
                    state=self.state.setdefault(key,{})
                    if time.time()<state.get('retry_at',0):state['status']='backoff';continue
                    try:self.launch(key)
                    except (ValueError,OSError) as e:state.update(status='failed',detail=str(e),retry_at=time.time()+30)
            if self.check_pending and time.monotonic()>=self.check_due:self.check_recovery()
    def check_recovery(self):
        import urllib.request
        checks=[]
        try:
            cfg=load_json(self.base/'config.json');port=int(cfg.get('port',8770));op=urllib.request.build_opener(urllib.request.ProxyHandler({}))
            with op.open('http://127.0.0.1:'+str(port)+'/api/native/health',timeout=2) as r:panel=json.load(r)
            checks.append(dict(name='Панель',ok=panel.get('native') is True,detail='HTTP-проверка запуска'))
        except Exception:checks.append(dict(name='Панель',ok=False,detail='Не отвечает локальная проверка запуска'))
        try:
            p=subprocess.run([str(self.root/'bin/yam'),'--platform','pickle','--profiles',str(self.root/'platforms'),'--root',str(self.root),'list'],capture_output=True,timeout=10)
            checks.append(dict(name='YAM CLI',ok=p.returncode==0,detail='yam list: '+str(p.returncode)))
        except (OSError,subprocess.TimeoutExpired):checks.append(dict(name='YAM CLI',ok=False,detail='CLI недоступен'))
        for key in self.cfg['autostart']:
            status=self.state.get(key,{}).get('status','missing')
            checks.append(dict(name=key,ok=status in ('running','completed'),detail=status))
        self.recovery=dict(boot_id=self.boot_id,checked=time.time(),started=self.started,ok=all(c['ok'] for c in checks),checks=checks,
                           note='Проверка процесса не подтверждает функциональную готовность приложения.')
        atomic_json(self.base/'data/yam-recovery.json',self.recovery);self.check_pending=False
    def status(self):
        with self.lock:
            self.refresh();packages=[]
            for p in self.packages:
                items=[]
                for key,item in self.services.items():
                    if item['package']!=p['name']:continue
                    state=self.state.get(key,{})
                    items.append(dict(id=key,name=item['name'],status=state.get('status','stopped'),pid=state.get('pid'),autostart=key in self.cfg['autostart'],
                                      runtime='clock-compat' if item['package']==CLOCK_PACKAGE else None,restart=item.get('spec',{}).get('restart'),oneshot=item.get('spec',{}).get('oneshot'),exit=state.get('exit'),detail=item.get('error') or state.get('detail',''),retry_at=state.get('retry_at')))
                packages.append(dict(**p,description=self.cfg['descriptions'].get(p['name'],''),web=self.cfg['web'].get(p['name']),services=items))
            return dict(protocol=PROTOCOL,code=CODE,packages=packages,error=self.error or ('Незавершённая операция YAM: проверь doctor/repair.' if (self.root/'db/transaction.json').exists() else None),paused=bool(self.pause_token) or self.mutating(),recovery_pending=self.check_pending,recovery=self.recovery,boot_id=self.boot_id,max_running=MAX_RUNNING)
    def action(self,d):
        with self.lock:
            op=d.get('action');key=d.get('service')
            if op=='pause':
                if self.pause_token:raise ValueError('Host already paused')
                self.pause_token=os.urandom(12).hex();self.pause_started=time.monotonic()
                for name in list(self.procs):self.terminate(name)
                return dict(token=self.pause_token)
            if op=='resume':
                if not self.pause_token or d.get('token')!=self.pause_token:raise ValueError('Invalid resume token')
                self.pause_token=None;self.refresh()
                if not self.error:
                    self.wanted.intersection_update(self.services);self.cfg['autostart']=[k for k in self.cfg['autostart'] if k in self.services];self.save()
                return dict(ok=True)
            if op=='recheck':self.check_pending=True;self.check_due=time.monotonic()+1;return dict(ok=True)
            if op=='metadata':
                name=d.get('package');
                if name not in {p['name'] for p in self.packages}:raise ValueError('Пакет не установлен')
                description=d.get('description','')
                if not isinstance(description,str) or len(description)>2000:raise ValueError('Описание до 2000 символов')
                port=d.get('port');path=d.get('path','/')
                if port in (None,''):self.cfg['web'].pop(name,None)
                else:
                    if type(port)!=int or not 1024<=port<=65535 or not isinstance(path,str) or not path.startswith('/') or path.startswith('//') or len(path)>200 or any(c in path for c in '\r\n\\?#'):raise ValueError('Порт 1024–65535 и путь /... без параметров')
                    self.cfg['web'][name]=dict(port=port,path=path)
                self.cfg['descriptions'][name]=description;self.save();return dict(ok=True)
            if not isinstance(key,str) or key not in self.services:raise ValueError('Служба не найдена')
            if op in ('start','restart'):
                if self.error:raise ValueError(self.error)
                if self.pause_token or self.mutating():raise ValueError('Идёт установка пакетов, дождись её завершения')
                self.manual_stops.discard(key);self.wanted.add(key);self.completed.discard(key)
                if op=='restart':self.terminate(key)
                if key not in self.procs:self.state.setdefault(key,{})['retry_at']=0;self.launch(key)
            elif op=='stop':self.manual_stops.add(key);self.wanted.discard(key);self.terminate(key)
            elif op in ('enable','disable'):
                selected=set(self.cfg['autostart'])
                if op=='enable':selected.add(key)
                else:selected.discard(key)
                self.cfg['autostart']=sorted(selected);self.save()
            else:raise ValueError('Неизвестное действие службы')
            return dict(ok=True)
    def close(self):
        self.stop_event.set()
        with self.lock:
            for key in list(self.procs):self.terminate(key)
        if self.clock_runtime:self.clock_runtime.close()

def read(path,default=''):
    try:return Path(path).read_text().strip()
    except OSError:return default

def runtime(base):return '/tmp/darkls-apps-'+hashlib.sha256(str(Path(base).resolve()).encode()).hexdigest()[:12]

class Client:
    def __init__(self,base,root='/data/yam'):
        self.base=Path(base);self.root=Path(root);self.yam_run=Path('/tmp/yam') if str(self.root)=='/data/yam' else self.root/'run';self.run=Path(runtime(base));self.endpoint=self.run/'host.json';self.ensure_lock=threading.Lock()
    def request(self,data):
        state=load_json(self.endpoint)
        if not state.get('port') or not state.get('token'):raise OSError('Host not running')
        with socket.socket(socket.AF_INET,socket.SOCK_STREAM) as sock:
            sock.settimeout(60);sock.connect(('127.0.0.1',int(state['port'])));sock.sendall(json.dumps(dict(data,_auth=state['token'])).encode()+b'\n');buf=b''
            while b'\n' not in buf:
                part=sock.recv(8192)
                if not part:raise ValueError('Service host closed the connection')
                buf+=part
                if len(buf)>256*1024:raise ValueError('Service host response too large')
        result=json.loads(buf)
        if 'error' in result:raise ValueError(result['error'])
        return result['result']
    def ensure(self):
        with self.ensure_lock:return self._ensure()
    def _ensure(self):
        try:
            status=self.request(dict(op='status'))
            if status.get('code')==CODE:return status
            self.request(dict(op='shutdown'))
            deadline=time.monotonic()+45
            while self.endpoint.exists() and time.monotonic()<deadline:time.sleep(.1)
            if self.endpoint.exists():raise ValueError('Предыдущий хост ещё останавливается')
        except OSError:pass
        self.base.mkdir(parents=True,exist_ok=True);self.run.mkdir(mode=0o700,parents=True,exist_ok=True)
        log=self.base/'app-host.log'
        if log.exists() and log.stat().st_size>256*1024:os.replace(log,log.with_suffix('.log.1'))
        with log.open('ab') as output:
            log.chmod(0o600)
            child=subprocess.Popen([sys.executable,str(Path(__file__).resolve()),'--base',str(self.base),'--root',str(self.root)],stdin=subprocess.DEVNULL,stdout=output,stderr=subprocess.STDOUT,start_new_session=True,close_fds=True)
        threading.Thread(target=child.wait,daemon=True).start()
        for _ in range(60):
            time.sleep(.05)
            try:
                status=self.request(dict(op='status'))
                if status.get('code')==CODE:return status
            except (OSError,ValueError):pass
        raise ValueError('Не удалось запустить хост приложений')
    @contextlib.contextmanager
    def pause(self):
        try:self.request(dict(op='status'))
        except OSError:yield;return
        token=self.request(dict(op='action',action='pause'))['token']
        try:yield
        finally:self.request(dict(op='action',action='resume',token=token))

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--base',required=True);ap.add_argument('--root',default='/data/yam');args=ap.parse_args()
    run=Path(runtime(args.base));run.mkdir(parents=True,exist_ok=True,mode=0o700)
    lock=(run/'host.lock').open('a')
    try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
    except BlockingIOError:return
    host=Host(args.base,args.root,run);path=run/'host.json';path.unlink(missing_ok=True)
    secret=os.urandom(32).hex()
    server=socket.socket(socket.AF_INET,socket.SOCK_STREAM);server.bind(('127.0.0.1',0));server.listen(8);server.settimeout(.3)
    signal.signal(signal.SIGTERM,lambda *_:host.stop_event.set());signal.signal(signal.SIGINT,lambda *_:host.stop_event.set())
    atomic_json(path,dict(pid=os.getpid(),protocol=PROTOCOL,started=time.time(),port=server.getsockname()[1],token=secret));path.chmod(0o600)
    try:
        while not host.stop_event.is_set():
            host.tick()
            try:conn,_=server.accept()
            except socket.timeout:continue
            with conn:
                conn.settimeout(2);buf=b''
                try:
                    while b'\n' not in buf:
                        part=conn.recv(4096)
                        if not part:raise ValueError('Empty request')
                        buf+=part
                        if len(buf)>65536:raise ValueError('Request too large')
                    d=json.loads(buf)
                    if not isinstance(d,dict) or not isinstance(d.get('_auth'),str) or not hmac.compare_digest(d.pop('_auth'),secret):raise ValueError('Unauthorized host request')
                    op=d.get('op')
                    if op=='shutdown':host.stop_event.set();result=dict(ok=True)
                    elif op=='status':result=host.status()
                    elif op=='action':result=host.action(d)
                    elif op=='log':
                        key=d.get('service','')
                        if not re.fullmatch(SERVICE_RE,key):raise ValueError('Некорректная служба')
                        p=host.log_path(key)
                        if p.is_file():
                            with p.open('rb') as f:f.seek(max(0,p.stat().st_size-32768));text=f.read().decode(errors='replace')
                        else:text='Журнал пуст'
                        result=dict(text=text)
                    else:raise ValueError('Unknown operation')
                    payload=dict(result=result)
                except Exception as e:payload=dict(error=str(e))
                with contextlib.suppress(OSError):conn.sendall(json.dumps(payload,ensure_ascii=False).encode()+b'\n')
    finally:host.close();server.close();path.unlink(missing_ok=True)

if __name__=='__main__':main()
