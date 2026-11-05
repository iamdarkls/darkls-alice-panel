"""Native YAM v2 CLI adapter and coordinated application mutations."""
import base64
import contextlib
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import signal
import shlex
import sqlite3
import subprocess
import tempfile
import threading
import time
import urllib.request
from urllib.parse import urlsplit
from native_updates import atomic_json,load_json

ASSET='yam-aarch64-unknown-linux-musl'
REPOSITORY='nyakokitsu/yam'
MAX_BINARY=16*1024*1024
MAX_PACKAGE=32*1024*1024
PROFILE='''id: pickle
arch: aarch64
triple: aarch64-unknown-linux-musl
paths:
  root: /data/yam
  etc: /data/yam/etc
  var: /data/yam/var
  run: /tmp/yam
'''
REGISTRY_URL='https://repo.yse.wtf/v2'
REGISTRY_KEY='ed25519:5Rz8F47uftWVU5kLgWYhprkEZ4rpP2kecUge/a7KQas='
OPENER=urllib.request.build_opener(urllib.request.ProxyHandler({}))


def package_name(value):
    if not isinstance(value,str) or not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,63}/[a-z0-9][a-z0-9-]{0,63}',value):
        raise ValueError('Имя пакета: namespace/name, строчные латинские буквы, цифры и дефис')
    return value


def package_spec(value):
    if not isinstance(value,str):raise ValueError('Некорректное имя пакета')
    parts=value.split('@')
    package_name(parts[0])
    if len(parts)>2 or len(parts)==2 and not re.fullmatch(r'\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?(?:\+[A-Za-z0-9.-]+)?',parts[1]):
        raise ValueError('Версия пакета должна быть SemVer')
    return value


def rows(output,count):
    result=[]
    for line in output.splitlines():
        if not line.strip():continue
        fields=line.split('\t',count-1)
        if len(fields)!=count:raise ValueError('YAM вернул неожиданный формат вывода')
        result.append(fields)
    return result


class Yam2:
    def __init__(self,base,root='/data/yam',runner=None):
        self.base=Path(base);self.root=Path(root);self.binary=self.root/'bin/yam'
        self.profiles=self.root/'platforms';self.record=self.root/'.darkls-yam.json'
        self._runner=runner;self.lock=threading.Lock();self.events=[]
        self.last_release=(0,None)

    def command(self,args,timeout=30,binary=None,root=None,profiles=None):
        exe=Path(binary or self.binary)
        if not exe.is_file():raise ValueError('YAM v2 ещё не установлен. Нажми «Установить актуальный YAM».')
        argv=[str(exe),'--platform','pickle','--profiles',str(profiles or self.profiles),'--root',str(root or self.root),*args]
        if self._runner:return self._runner(argv,timeout=timeout)
        env=os.environ.copy();env.update(YAM_PLATFORM='pickle',YAM_ROOT=str(root or self.root),YAM_PROFILES=str(profiles or self.profiles))
        p=subprocess.Popen(argv,stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True,env=env)
        try:out,err=p.communicate(timeout=timeout)
        except subprocess.TimeoutExpired as exc:
            with contextlib.suppress(ProcessLookupError):os.killpg(p.pid,signal.SIGKILL)
            p.communicate();raise ValueError('Команда YAM не завершилась вовремя. Проверь состояние через doctor.') from exc
        if len(out)+len(err)>2*1024*1024:raise ValueError('Ответ YAM превышает 2 МБ')
        text=out.decode('utf-8','replace')
        if p.returncode:raise ValueError(err.decode('utf-8','replace').strip()[-4000:] or text[-4000:] or 'Ошибка YAM')
        return text

    @contextlib.contextmanager
    def mutation(self,pause=False):
        if not self.lock.acquire(blocking=False):raise ValueError('Другая операция YAM уже выполняется')
        self.base.mkdir(parents=True,exist_ok=True)
        try:
            with (self.base/'yam2.lock').open('a') as lock:
                try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
                except BlockingIOError as exc:raise ValueError('YAM занят другой операцией панели') from exc
                host=getattr(self,'app_host',None)
                with host.pause() if pause and host else contextlib.nullcontext():yield
        finally:self.lock.release()

    def note(self,action,ok,message):
        self.events.append(dict(at=time.time(),action=action,ok=ok,message=str(message)[-4000:]))
        self.events=self.events[-25:]

    def latest(self,refresh=False):
        if not refresh and time.monotonic()-self.last_release[0]<300 and self.last_release[1]:return self.last_release[1]
        req=urllib.request.Request('https://api.github.com/repos/'+REPOSITORY+'/releases?per_page=50',headers={'User-Agent':'DARKLS-Alice'})
        with OPENER.open(req,timeout=20) as r:raw=r.read(2*1024*1024+1)
        if len(raw)>2*1024*1024:raise ValueError('Слишком большой ответ GitHub')
        releases=json.loads(raw)
        for rel in releases:
            assets={a['name']:a for a in rel.get('assets',[])}
            if not rel.get('draft') and not rel.get('prerelease') and re.fullmatch(r'yam-v\d+\.\d+\.\d+',rel.get('tag_name','')) and ASSET in assets and 'SHA256SUMS' in assets:
                result=dict(tag=rel['tag_name'],version=rel['tag_name'][5:],url=rel.get('html_url'),assets=assets)
                self.last_release=(time.monotonic(),result);return result
        raise ValueError('Стабильный релиз YAM v2 для aarch64 не найден')

    def info(self):
        exists=self.binary.is_file();record=load_json(self.record)
        return dict(installed=exists,version=record.get('version'),root=str(self.root),platform='pickle',
                    manager='YAM v2 CLI',daemon=False,package_format='.yampkg',services_supervised=False,
                    registry_default=REGISTRY_URL,
                    events=list(self.events),capabilities=['list','install','remove','files','which','search','info','plan','registry','doctor','repair','update','entware','service-list'])

    def packages(self):
        return [dict(name=n,version=v,target=t) for n,v,t in rows(self.command(['list']),3)]

    def registries(self):
        return [dict(name=n,url=u) for n,u in rows(self.command(['registry','list']),2)]

    def services(self):
        return dict(supervised=False,note='В YAM 0.2.5 службы только объявлены. Запуск и автозапуск не реализованы в менеджере.',
                    items=[dict(name=n,enabled=s=='enabled',exec=e) for n,s,e in rows(self.command(['service','list']),3)])

    def snapshot(self,label):
        dest=self.base/'yam2-backups'/(str(int(time.time()))+'-'+os.urandom(4).hex())
        dest.mkdir(mode=0o700,parents=True)
        if self.binary.is_file():shutil.copy2(self.binary,dest/'yam')
        for name in ('.darkls-yam.json','platforms/pickle.yaml','db/registries.yaml'):
            source=self.root/name
            if source.is_file():
                target=dest/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,target)
        db=self.root/'db/state.sqlite3'
        if db.is_file():
            with sqlite3.connect(str(db)) as src,sqlite3.connect(str(dest/'state.sqlite3')) as out:src.backup(out)
        atomic_json(dest/'snapshot.json',dict(label=label,created=time.time(),root=str(self.root)))
        # Keep two rollback snapshots; the speaker has limited flash space.
        siblings=sorted(dest.parent.iterdir(),key=lambda p:p.name,reverse=True)
        for old in siblings[2:]:
            if old.is_dir() and not old.is_symlink() and (old/'snapshot.json').is_file():shutil.rmtree(old)
        return dest

    def install_latest(self):
        with self.mutation(pause=True):
            if os.uname().machine!='aarch64':raise ValueError('Установка поддерживается на aarch64')
            if self.binary.is_file():return self._update()
            if self.root.is_symlink():raise ValueError('Корень YAM не должен быть символьной ссылкой')
            if self.root.exists() and any(self.root.iterdir()):raise ValueError('В /data/yam уже есть данные без бинарника. Не перезаписываю их; нужна диагностика.')
            release=self.latest(True);asset=release['assets'][ASSET];checksum=release['assets']['SHA256SUMS']
            urls=[asset['browser_download_url'],checksum['browser_download_url']]
            if any(not u.startswith('https://github.com/'+REPOSITORY+'/releases/download/'+release['tag']+'/') for u in urls):raise ValueError('Некорректный источник YAM')
            if not 0<asset['size']<=MAX_BINARY:raise ValueError('Бинарник YAM слишком большой')
            if shutil.disk_usage(self.base).free<asset['size']+56*1024*1024:raise ValueError('Недостаточно места в /data: нужен бинарник YAM и 56 МБ резерва для обновлений панели')
            with OPENER.open(urls[1],timeout=20) as r:sums=r.read(65537)
            if len(sums)>65536:raise ValueError('SHA256SUMS превышает 64 КБ')
            expected=next((p[0] for line in sums.decode().splitlines() if len(p:=line.split())==2 and p[1].lstrip('*')==ASSET),None)
            if not expected or not re.fullmatch('[a-f0-9]{64}',expected):raise ValueError('SHA-256 YAM не найдена')
            with OPENER.open(urls[0],timeout=90) as r:blob=r.read(MAX_BINARY+1)
            if len(blob)!=asset['size'] or hashlib.sha256(blob).hexdigest()!=expected:raise ValueError('Размер или SHA-256 YAM не совпали')
            if asset.get('digest') and asset['digest']!='sha256:'+expected:raise ValueError('GitHub digest YAM не совпал')
            if blob[:5]!=b'\x7fELF\x02' or int.from_bytes(blob[18:20],'little')!=183:raise ValueError('Неверная архитектура YAM')
            # Probe the real ARM binary and its database in /tmp before touching installation paths.
            with tempfile.TemporaryDirectory(prefix='darkls-yam-probe-',dir='/tmp') as td:
                probe=Path(td);candidate=probe/'yam';candidate.write_bytes(blob);candidate.chmod(0o755)
                profiles=probe/'profiles';profiles.mkdir();(profiles/'pickle.yaml').write_text(PROFILE)
                self.command(['list'],binary=candidate,root=probe/'state',profiles=profiles)
                self.command(['doctor'],binary=candidate,root=probe/'state',profiles=profiles)
            # Stage on the same filesystem. Failed installation leaves /data/yam untouched.
            self.root.parent.mkdir(parents=True,exist_ok=True)
            with tempfile.TemporaryDirectory(prefix='.darkls-yam-',dir=self.root.parent) as td:
                staged=Path(td)/'root';staged.mkdir(mode=0o700)
                (staged/'bin').mkdir();(staged/'platforms').mkdir()
                (staged/'platforms/pickle.yaml').write_text(PROFILE)
                candidate=staged/'bin/yam';candidate.write_bytes(blob);candidate.chmod(0o755)
                self.command(['list'],binary=candidate,root=staged,profiles=staged/'platforms')
                wrapper=staged/'bin/yam-run'
                wrapper.write_text('#!/bin/sh\nexport YAM_PLATFORM=pickle\nexport YAM_PROFILES='+shlex.quote(str(self.profiles))+'\nexport YAM_ROOT='+shlex.quote(str(self.root))+'\nexec '+shlex.quote(str(self.binary))+' "$@"\n');wrapper.chmod(0o755)
                atomic_json(staged/'.darkls-yam.json',dict(version=release['version'],tag=release['tag'],sha256=expected,installed=time.time()))
                os.rename(staged,self.root)
            self.note('install',True,'YAM '+release['version']+' установлен. Менеджер готов к работе.')
            return self.info()

    def _update(self):
        backup=self.snapshot('before-self-update')
        try:
            message=self.command(['update'],timeout=180)
            self.command(['list']);self.command(['doctor'])
            actual=hashlib.sha256(self.binary.read_bytes()).hexdigest()
            record=load_json(self.record)
            if record.get('sha256')!=actual:record.update(version=None,sha256=actual)
            # A metadata outage must not undo a successful signature-verified native update.
            try:
                release=self.latest(True)
                digest=(release['assets'][ASSET].get('digest') or '').removeprefix('sha256:')
                if actual==digest:record.update(version=release['version'],tag=release['tag'])
            except Exception:pass
            atomic_json(self.record,record);self.note('update',True,message)
            return dict(**self.info(),message=message,backup=str(backup))
        except Exception:
            if (backup/'yam').is_file():
                tmp=self.binary.with_suffix('.rollback');shutil.copy2(backup/'yam',tmp);os.replace(tmp,self.binary)
            if (backup/'.darkls-yam.json').is_file():atomic_json(self.record,load_json(backup/'.darkls-yam.json'))
            self.note('update',False,'Обновление YAM не завершено; предыдущий бинарник сохранён/возвращён. Копия: '+str(backup))
            raise

    def action(self,data):
        action=data.get('action');registry=data.get('registry','official')
        if not isinstance(registry,str) or not re.fullmatch('[a-z0-9-]{1,64}',registry):raise ValueError('Некорректное имя реестра')
        prefix=['--registry',registry]
        if action=='search':
            query=data.get('query','')
            if not isinstance(query,str) or len(query)>200 or '\0' in query:raise ValueError('Некорректный поисковый запрос')
            return dict(items=[dict(name=n,version=v,summary=s) for n,v,s in rows(self.command(prefix+['search',query],timeout=45),3)])
        if action=='info':return json.loads(self.command(prefix+['info',package_name(data.get('name'))],timeout=45))
        if action=='plan':return dict(items=[dict(name=n,version=v,url=u) for n,v,u in rows(self.command(prefix+['plan',package_spec(data.get('name'))],timeout=45),3)])
        if action=='files':return dict(files=self.command(['files',package_name(data.get('name'))]).splitlines())
        if action=='which':
            path=data.get('path','')
            if not isinstance(path,str) or not path or len(path)>500 or path.startswith(('/','-')) or '..' in Path(path).parts:raise ValueError('Укажи относительный путь bin/... или share/...')
            return dict(owner=self.command(['which',path]).strip())
        if action=='doctor':
            try:return dict(ok=True,report=self.command(['doctor']))
            except ValueError as exc:return dict(ok=False,report=str(exc))
        if action=='entware':
            status=self.command(['entware','status']).strip();return dict(status=status,packages=self.command(['entware','list']) if status=='available' else '')
        if action not in ('install','remove','repair','registry-add','registry-remove','official-registry','update'):raise ValueError('Неизвестное действие YAM')
        with self.mutation(pause=action in ('install','remove','update','repair')):
            if action=='update':return self._update()
            if action=='install':
                spec=package_spec(data.get('name'));args=prefix+['install',spec]
                if data.get('allow_replacements') is True:args.append('--yes')
            elif action=='remove':args=['remove',package_name(data.get('name'))]
            elif action=='repair':args=['repair']
            elif action=='registry-remove':args=['registry','remove',registry]
            else:
                url,key=(REGISTRY_URL,REGISTRY_KEY) if action=='official-registry' else (data.get('url',''),data.get('key',''))
                u=urlsplit(url)
                if u.scheme!='https' or not u.hostname or u.username or u.password or u.query or u.fragment:raise ValueError('Реестр должен иметь HTTPS URL без пароля и параметров')
                try:
                    if not key.startswith('ed25519:') or len(base64.b64decode(key[8:],validate=True))!=32:raise ValueError()
                except Exception as exc:raise ValueError('Ключ реестра: ed25519: и публичный ключ Base64 из 32 байт') from exc
                args=['registry','add','official' if action=='official-registry' else registry,url,'--key',key]
            try:
                report=self.command(args,timeout=240 if action=='install' else 60)
                self.note(action,True,report)
                return dict(ok=True,report=report)
            except ValueError as exc:self.note(action,False,str(exc));raise

    def upload(self,blob,allow=False):
        if not blob or len(blob)>MAX_PACKAGE:raise ValueError('Пакет .yampkg должен быть не больше 32 МБ')
        # Format, path safety, payload hashes, compatibility and dependency rules are validated by YAM itself.
        if blob[:4]!=b'\x28\xb5\x2f\xfd':raise ValueError('Нужен .yampkg (tar.zst). Старый .yap сюда не подходит.')
        with self.mutation(pause=True),tempfile.TemporaryDirectory(prefix='yam-package-',dir='/tmp') as td:
            path=Path(td)/'upload.yampkg';path.write_bytes(blob)
            args=['install',str(path)]+(['--yes'] if allow else [])
            report=self.command(args,timeout=240);self.note('upload',True,report)
            return dict(ok=True,report=report)


def install(module,base):
    manager=Yam2(base)
    from native_retirement import Retirement
    retirement=Retirement(base)
    old_get,old_post=module.Handler.do_GET,module.Handler.do_POST
    def get(self):
        path=urlsplit(self.path).path
        if not path.startswith('/api/yam2/'):return old_get(self)
        if self._guard(path):return
        routes={'/api/yam2/retirement':retirement.info,'/api/yam2/status':manager.info,'/api/yam2/packages':manager.packages,
                '/api/yam2/registries':manager.registries,'/api/yam2/services':manager.services,
                '/api/yam2/latest':lambda:{k:v for k,v in manager.latest(True).items() if k!='assets'}}
        if path not in routes:return self._send(404,dict(error='Неизвестный API YAM v2'))
        return self._handle(routes[path])
    def post(self):
        path=urlsplit(self.path).path
        if not path.startswith('/api/yam2/'):return old_post(self)
        if self._guard(path):return
        try:
            size=int(self.headers.get('Content-Length','0'))
            if not 0<=size<=(MAX_PACKAGE if path=='/api/yam2/upload' else 65536):return self._send(413,dict(error='Запрос слишком большой'))
            if path=='/api/yam2/upload':
                if self.headers.get('Content-Type','').split(';')[0]!='application/octet-stream':raise ValueError('Ожидается бинарный файл .yampkg')
                if size==0:raise ValueError('Пустой пакет')
                blob=self.rfile.read(size)
                if len(blob)!=size:raise ValueError('Неполная загрузка')
                return self._handle(lambda:manager.upload(blob,self.headers.get('X-Yam-Allow-Replacements')=='true'))
            data=self._json()
            if not isinstance(data,dict):raise ValueError('Ожидается JSON-объект')
        except ValueError as exc:return self._send(400,dict(error=str(exc)))
        if path=='/api/yam2/retire':
            def retire():
                with manager.mutation():
                    manager.command(['list']) # Require a working replacement before stopping old apps.
                    return retirement.retire()
            return self._handle(retire)
        if path=='/api/yam2/bootstrap':return self._handle(manager.install_latest)
        if path=='/api/yam2/action':return self._handle(lambda:manager.action(data))
        return self._send(404,dict(error='Неизвестный API YAM v2'))
    module.Handler.do_GET,module.Handler.do_POST=get,post
    import native_apps
    native_apps.install(module,manager,base)
