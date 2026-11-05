"""Reversible retirement of the known legacy runtime. Never touch /data/yam or root access."""
import contextlib
import os
from pathlib import Path
import signal
import stat
import subprocess
import time
from native_updates import atomic_json,load_json

class Retirement:
    def __init__(self,base,root='/data/quazar/yam',hook='/etc/init.d/S99yam',flag='/data/quasar/webpanel/yamd_autostart',proc='/proc',stop=None,mount=None):
        self.base=Path(base);self.root=Path(root);self.hook=Path(hook);self.flag=Path(flag);self.proc=Path(proc)
        self.state=self.base/'data/yamd-retirement.json';self.stop=stop or self.stop_processes;self.mount=mount or self.remount
    def info(self):
        saved=load_json(self.state)
        return dict(pending=any(p.exists() or p.is_symlink() for p in (self.root,self.hook,self.flag)),archive=saved.get('archive'),status=saved.get('status'),
                    note='Переход останавливает старые приложения .yap, отключает yamd и переносит весь его каталог в архив. Новые .yampkg, root и системные службы не изменяются.')
    def remount(self,writable):
        subprocess.run(['mount','-o','remount,'+('rw' if writable else 'ro'),'/'],check=True,capture_output=True,timeout=15)
    def root_readonly(self):
        try:return any(p[1]=='/' and 'ro' in p[3].split(',') for line in (self.proc/'mounts').read_text().splitlines() if len(p:=line.split())>=4)
        except OSError:raise ValueError('Не удалось определить режим корневой ФС')
    def identity(self,pid):
        try:
            value=(self.proc/str(pid)/'stat').read_text();parts=value[value.rfind(')')+2:].split()
            return (int(parts[1]),parts[19]) # parent PID and start time, protects against PID reuse
        except (OSError,ValueError,IndexError):return None
    def processes(self):
        known={};entries={}
        for path in self.proc.glob('[0-9]*'):
            pid=int(path.name);identity=self.identity(pid)
            if not identity:continue
            entries[pid]=identity
            try:
                exe=os.readlink(path/'exe').removesuffix(' (deleted)');cwd=os.readlink(path/'cwd')
                args=(path/'cmdline').read_bytes().split(b'\0')
                if exe==str(self.root/'bin/yamd') or exe.startswith(str(self.root)+'/') or cwd.startswith(str(self.root)+'/') or any(a.decode(errors='replace').startswith(str(self.root/'data/plugins')+'/') for a in args):known[pid]=identity
            except OSError:pass
        changed=True
        while changed:
            changed=False
            for pid,identity in entries.items():
                if pid not in known and identity[0] in known:known[pid]=identity;changed=True
        known.pop(os.getpid(),None)
        return known
    def stop_processes(self):
        known=self.processes()
        for sig in (signal.SIGTERM,signal.SIGKILL):
            for pid,identity in known.items():
                if self.identity(pid)==identity:
                    with contextlib.suppress(ProcessLookupError):os.kill(pid,sig)
            deadline=time.monotonic()+2
            while time.monotonic()<deadline and any(self.identity(pid)==i for pid,i in known.items()):time.sleep(.1)
        # Zombies are not running; require that no live matching executable remains.
        for pid in self.processes():
            try:
                if os.readlink(self.proc/str(pid)/'exe'):raise ValueError('Старый процесс не остановился: '+str(pid))
            except FileNotFoundError:pass
    def retire(self):
        if not self.info()['pending']:return self.info()
        if self.root.is_symlink() or self.hook.is_symlink() or self.flag.is_symlink():raise ValueError('Неизвестная схема установки: символьные ссылки; автоматический перенос остановлен')
        if self.root.exists() and not self.root.is_dir():raise ValueError('Каталог старого yamd имеет неожиданный тип')
        hook=self.hook.read_bytes() if self.hook.exists() else None
        if hook is not None and (b'/data/quazar/yam' not in hook or b'yamd' not in hook):raise ValueError('S99yam не относится к известному yamd; файл не изменён')
        archive=self.base/'archives'/('yamd-'+str(time.time_ns()));archive.mkdir(parents=True,mode=0o700)
        mode=stat.S_IMODE(self.hook.stat().st_mode) if hook is not None else None
        flag=self.flag.read_bytes() if self.flag.exists() else None
        if hook is not None:(archive/'S99yam').write_bytes(hook);(archive/'S99yam').chmod(mode)
        if flag is not None:(archive/'yamd_autostart').write_bytes(flag)
        # Publish recovery paths before any change; the whole runtime is moved, never deleted.
        journal=dict(status='prepared',archive=str(archive),runtime=str(self.root),hook=str(self.hook),hook_mode=mode,flag=str(self.flag),created=time.time())
        atomic_json(self.state,journal)
        readonly=self.root_readonly() if hook is not None else False
        removed=False;moved=False;flag_removed=False
        try:
            if hook is not None:
                if readonly:self.mount(True)
                try:self.hook.unlink();removed=True
                finally:
                    if readonly:self.mount(False)
            if flag is not None:self.flag.unlink();flag_removed=True
            self.stop()
            if self.root.exists():os.rename(self.root,archive/'runtime');moved=True
            journal['status']='complete';atomic_json(self.state,journal)
        except Exception:
            if moved:os.rename(archive/'runtime',self.root)
            if flag_removed:self.flag.parent.mkdir(parents=True,exist_ok=True);self.flag.write_bytes(flag)
            if removed:
                if readonly:self.mount(True)
                try:self.hook.write_bytes(hook);self.hook.chmod(mode)
                finally:
                    if readonly:self.mount(False)
            journal['status']='failed';atomic_json(self.state,journal)
            raise
        return self.info()
