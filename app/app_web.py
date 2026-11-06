"""Discover package-owned local HTTP UIs without scanning the LAN or guessing live URLs."""
import copy,http.client,ipaddress,os,re,socket,threading,time
from pathlib import Path
from urllib.parse import urlsplit

KNOWN={'vegych/uwu-eyes-panel':('UWU_PORT',1213),'vegych/now-playing-ticker':('TICKER_PORT',1214)}

def endpoint(port,path='/',source=''):
    if type(port)!=int or not 1024<=port<=65535:return None
    if not isinstance(path,str) or not path.startswith('/') or path.startswith('//') or len(path)>200 or any(c in path for c in '\r\n\\?#'):return None
    return dict(port=port,path=path,source=source)

def port_value(value):
    if not isinstance(value,str):return None
    m=re.fullmatch(r'(?:[A-Za-z0-9_.-]*:)?([0-9]{1,5})',value)
    if not m:return None
    n=int(m[1]);return n if 1024<=n<=65535 else None

def hints(root,p,services):
    values=[];env={}
    for item in services.values():
        if item['package']!=p['name'] or item.get('error'):continue
        spec=item['spec'];env.update(spec['env'])
        for key,value in spec['env'].items():
            if key.endswith(('_PORT','_ADDR')) or key=='PORT':
                port=port_value(value)
                if port:values.append(endpoint(port,source='Настройки службы: '+key))
        args=spec['exec']
        for i,arg in enumerate(args):
            flag,value=(arg.split('=',1)+[''])[:2] if '=' in arg else (arg,args[i+1] if i+1<len(args) else '')
            if flag in ('--port','-port','--http-port','--web-port','--listen','-listen'):
                port=port_value(value)
                if port:values.append(endpoint(port,source='Аргументы службы'))
    if p['name'] in KNOWN:
        key,default=KNOWN[p['name']];port=port_value(env.get(key,'')) or default
        values.append(endpoint(port,source='Профиль приложения'))
    payload=(Path(root)/'pkgs'/p['name']/p['version']).resolve()
    directory=payload/'share'/p['name'].replace('/','.')
    for path in list(directory.glob('README*'))[:3]:
        try:
            if not path.resolve().is_relative_to(payload) or not path.is_file():continue
            with path.open('rb') as f:text=f.read(65536).decode('utf-8','replace')
            for match in re.finditer(r'https?://[^\s<>"`]+',text):
                try:
                    url=urlsplit(match[0].rstrip(').,;'))
                    if url.scheme!='http' or not url.port or url.username or url.password or url.query or url.fragment:continue
                    value=endpoint(url.port,url.path or '/',source='README пакета')
                    if value:values.append(value)
                except ValueError:continue
            for match in re.finditer(r'(?:панел[ьиь]|web\s*(?:ui|panel)|веб-интерфейс)[^\n]{0,70}?(?:\*\*)?:([0-9]{4,5})',text,re.I):
                values.append(endpoint(int(match[1]),source='README пакета'))
        except OSError:continue
    seen=set();result=[]
    for value in values:
        if value and (key:=(value['port'],value['path'])) not in seen:seen.add(key);result.append(value)
    return result[:8]

def listeners(proc):
    result={}
    for file,family in [('tcp',socket.AF_INET),('tcp6',socket.AF_INET6)]:
        try:
            for line in (Path(proc)/'net'/file).read_text().splitlines()[1:]:
                fields=line.split()
                if len(fields)<10 or fields[3]!='0A':continue
                addr,port=fields[1].split(':');raw=bytes.fromhex(addr)
                if family==socket.AF_INET:raw=raw[::-1]
                else:raw=b''.join(raw[i:i+4][::-1] for i in range(0,16,4))
                address=socket.inet_ntop(family,raw)
                result[fields[9]]=dict(port=int(port,16),address=address,family=family)
        except (OSError,ValueError):continue
    return result

def owned_ports(root,packages,services,procs,proc='/proc'):
    proc=Path(proc);sockets=listeners(proc);owners={};parents={}
    payloads={p['name']:str((Path(root)/'pkgs'/p['name']/p['version']).resolve())+'/' for p in packages}
    for key,pid in procs.items():
        if key in services:owners[int(pid)]=services[key]['package']
    for path in list(proc.glob('[0-9]*'))[:4096]:
        try:
            pid=int(path.name);stat=(path/'stat').read_text();parents[pid]=int(stat[stat.rfind(')')+2:].split()[1])
            if pid in owners:continue
            with (path/'cmdline').open('rb') as f:args=f.read(8192).split(b'\0')
            try:exe=os.readlink(path/'exe').removesuffix(' (deleted)')
            except OSError:exe=''
            for name,prefix in payloads.items():
                if exe.startswith(prefix) or any(a.decode(errors='replace').startswith(prefix) for a in args[:2]):owners[pid]=name;break
        except (OSError,ValueError,IndexError):continue
    for _ in range(16):
        additions={pid:owners[parent] for pid,parent in parents.items() if pid not in owners and parent in owners}
        if not additions:break
        owners.update(additions)
    result={}
    for pid,name in owners.items():
        try:
            for fd in list((proc/str(pid)/'fd').iterdir())[:1024]:
                try:match=re.fullmatch(r'socket:\[([0-9]+)\]',os.readlink(fd))
                except OSError:continue
                if match and match[1] in sockets:result.setdefault(name,[]).append(sockets[match[1]])
        except OSError:continue
    return result

def probe(port,path='/',address='127.0.0.1',manual=False):
    # Targets come only from local listening sockets or the user's numeric port.
    try:
        ip=ipaddress.ip_address(address)
        if ip.is_unspecified:address='127.0.0.1' if ip.version==4 else '::1'
        conn=http.client.HTTPConnection(address,port,timeout=.4)
        try:
            conn.request('GET',path,headers={'Accept':'text/html','Connection':'close','User-Agent':'DARKLS-Panel-WebCheck'})
            response=conn.getresponse();content=response.read(2048);ctype=response.getheader('Content-Type','').lower()
            html='text/html' in ctype or 'application/xhtml+xml' in ctype or bool(re.search(br'<(?:!doctype\s+html|html|head|body)(?:\s|>)',content,re.I))
            good=(200<=response.status<400 or response.status in (401,403)) and (manual or html)
            return dict(ready=good,http_status=response.status,detail='Доступно' if good else 'HTTP отвечает, веб-панель не подтверждена')
        finally:conn.close()
    except (OSError,ValueError,http.client.HTTPException):return dict(ready=False,detail='Не отвечает по HTTP')

class Discovery:
    def __init__(self,root,proc='/proc',scanner=None,checker=None):
        self.root=Path(root);self.proc=proc;self.scanner=scanner or owned_ports;self.checker=checker or probe
        self.cache={};self.lock=threading.Lock();self.running=False;self.at=0;self.generation=0;self.closed=False
    def invalidate(self):
        with self.lock:self.at=0;self.generation+=1;self.cache={}
    def schedule(self,packages,services,procs,manual,disabled):
        with self.lock:
            if self.closed or self.running or time.monotonic()-self.at<5:return
            self.running=True;self.at=time.monotonic();generation=self.generation
        args=copy.deepcopy((packages,services,procs,manual,disabled))
        threading.Thread(target=self.refresh,args=(*args,generation),daemon=True).start()
    def refresh(self,packages,services,procs,manual,disabled,generation):
        result={};deadline=time.monotonic()+6
        try:
            owned=self.scanner(self.root,packages,services,procs,proc=self.proc)
            for p in packages:
                name=p['name']
                if name in disabled:result[name]=dict(mode='none',endpoint=None,detail='Ссылка отключена');continue
                mode='manual' if name in manual else 'auto';observed=owned.get(name,[])
                candidates=[dict(manual[name],source='Указано вручную')] if mode=='manual' else hints(self.root,p,services)
                if mode=='auto':candidates += [endpoint(v['port'],source='Порт процесса приложения') for v in observed if v['port']>=1024]
                selected=None;seen=set()
                for candidate in candidates[:12]:
                    if not candidate or (key:=(candidate['port'],candidate.get('path','/'))) in seen:continue
                    seen.add(key);candidate=dict(candidate);candidate.setdefault('path','/');candidate['ready']=False
                    matching=[v for v in observed if v['port']==candidate['port']]
                    if mode=='auto' and not matching:
                        if selected is None:selected=dict(candidate,detail='Веб-панель сейчас не запущена')
                        continue
                    if time.monotonic()>deadline:break
                    matching.sort(key=lambda v:(v['family']!=socket.AF_INET,ipaddress.ip_address(v['address']).is_loopback))
                    checked=dict(ready=False,detail='Не отвечает по HTTP')
                    for listener in matching or [None]:
                        ip=ipaddress.ip_address(listener['address']) if listener else ipaddress.ip_address('127.0.0.1')
                        mapped=ip.ipv4_mapped if ip.version==6 else None
                        if listener and (ip.is_loopback or (mapped and mapped.is_loopback)):
                            checked=dict(ready=False,detail='Панель слушает только локальный адрес')
                            continue
                        if ip.version==6:
                            if ip.is_unspecified:
                                # A [::] socket may also accept IPv4. Confirm that path,
                                # rather than rejecting all tcp6 entries or assuming dual stack.
                                address='127.0.0.1'
                            elif mapped:address=str(mapped)
                            else:
                                checked=dict(ready=False,detail='Для панели не обнаружен адрес IPv4')
                                continue
                        else:address=str(ip)
                        checked=self.checker(candidate['port'],candidate['path'],address=address,manual=mode=='manual')
                        if checked['ready']:break
                        if listener and ip.version==6 and ip.is_unspecified:
                            checked['detail']='Панель не отвечает по HTTP через IPv4'
                        if time.monotonic()>deadline:break
                    candidate.update(checked,checked=time.time())
                    if selected is None or candidate['ready']:selected=candidate
                    if candidate['ready']:break
                result[name]=dict(mode=mode,endpoint=selected,detail=selected['detail'] if selected else 'Веб-интерфейс не обнаружен')
        except Exception:
            result={p['name']:dict(mode='manual' if p['name'] in manual else 'auto',endpoint=None,detail='Не удалось определить адрес панели') for p in packages}
        finally:
            with self.lock:
                if generation==self.generation and not self.closed:self.cache=result
                self.running=False
    def get(self,name,manual,disabled):
        with self.lock:cached=self.cache.get(name)
        if cached:return copy.deepcopy(cached)
        if name in disabled:return dict(mode='none',endpoint=None,detail='Ссылка отключена')
        if name in manual:return dict(mode='manual',endpoint=dict(manual[name],ready=False,source='Указано вручную',detail='Проверяем доступность…'),detail='Проверяем доступность…')
        return dict(mode='auto',endpoint=None,detail='Ищем веб-панель…')
    def close(self):
        with self.lock:self.closed=True
