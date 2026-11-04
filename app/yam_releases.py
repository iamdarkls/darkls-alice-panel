"""Keep legacy yamd releases separate from the incompatible yam-v CLI channel."""
import hashlib
import re
import urllib.request

MAX_DAEMON=32*1024*1024


def compatible(release, asset_name='yamd-aarch64-linux-musl'):
    assets={a.get('name') for a in release.get('assets',[])}
    return (not release.get('draft') and not release.get('prerelease')
            and bool(re.fullmatch(r'v?\d+\.\d+\.\d+',release.get('tag_name','')))
            and asset_name in assets and 'SHA256SUMS' in assets)


def verified_blob(panel, release):
    assets={a['name']:a for a in release.get('assets',[])}
    binary=assets[panel.YAM_ASSET]
    urls=[assets['SHA256SUMS']['browser_download_url'],binary['browser_download_url']]
    if any(not u.startswith('https://github.com/nyakokitsu/yam/releases/download/') for u in urls):
        raise ValueError('Неверный источник yamd')
    if not 0<binary.get('size',MAX_DAEMON)<=MAX_DAEMON:
        raise ValueError('Слишком большой бинарник yamd')
    with urllib.request.urlopen(urls[0],timeout=30) as r:sums=r.read(65537)
    if len(sums)>65536:raise ValueError('SHA256SUMS превышает 64 КБ')
    expected=next((line.split()[0] for line in sums.decode().splitlines()
                   if len(line.split())==2 and line.split()[1].lstrip('*')==panel.YAM_ASSET),None)
    if not expected or not re.fullmatch('[a-f0-9]{64}',expected):raise ValueError('SHA-256 yamd отсутствует')
    with urllib.request.urlopen(urls[1],timeout=90) as r:blob=r.read(MAX_DAEMON+1)
    if len(blob)>MAX_DAEMON or hashlib.sha256(blob).hexdigest()!=expected:
        raise ValueError('Контрольная сумма yamd не совпала')
    if binary.get('size') and len(blob)!=binary['size']:raise ValueError('Размер yamd не совпал')
    if binary.get('digest') and binary['digest']!='sha256:'+expected:raise ValueError('Digest GitHub не совпал с SHA256SUMS')
    if len(blob)<20 or blob[:5]!=b'\x7fELF\x02' or int.from_bytes(blob[18:20],'little')!=183:
        raise ValueError('yamd не является ELF aarch64')
    return blob,expected


def install(s):
    import json,shlex,tempfile,threading,time,uuid
    from pathlib import Path
    lock=threading.Lock()
    original_list=s.Panel._yam_release_list
    def release_list(self,refresh=False):
        return [r for r in original_list(self,refresh) if compatible(r,self.YAM_ASSET)]
    s.Panel._yam_release_list=release_list

    def update(self,drop_backups=False):
        if not lock.acquire(blocking=False):raise s.AdbError('Обновление yamd уже выполняется')
        base=s.YAM_DIR;binary=s.YAMD;backup=base+'/backups/web-'+uuid.uuid4().hex
        new=binary+'.panel-new';stopped=False;copied=False
        try:
            # Only update the existing legacy daemon layout; never migrate the separate CLI.
            self.adb.shell(f'test -x {binary} && test -d {base}/data')
            rels=self._yam_release_list(True)
            if not rels:raise s.AdbError('Совместимые релизы yamd не найдены. Новый YAM CLI устанавливается отдельно.')
            release=rels[0];blob,expected=verified_blob(self,release)
            actual=self.adb.shell('sha256sum '+binary)[0].split()[0]
            if actual==expected:return {**self.yam_status(),'version':release['tag_name'],'unchanged':True}
            plugins_before=self.yam_plugins()
            settings_before=self._yam('GET','/api/settings')
            # Validate the binary on hardware BEFORE stopping the old daemon.
            with tempfile.TemporaryDirectory() as td:
                file=Path(td)/'yamd';file.write_bytes(blob);self.adb.push(file,new)
            self.adb.shell(f'chmod 755 {new}; {new} --help',timeout=10)
            free=int(self.adb.shell(f"df -k {base} | tail -1 | awk '{{print $4}}'")[0].strip())
            used=int(self.adb.shell(f"du -sk {base}/data | awk '{{print $1}}'")[0].strip())
            if free<used+len(blob)//1024+8192:raise s.AdbError('Недостаточно места для копии YAM перед обновлением')
            self.adb.shell(f'mkdir -p {backup}; cp -p {binary} {backup}/yamd')
            copied=True
            # Use the same legacy start command as the existing S99yam; no boot files are changed.
            stopped=True
            self.adb.shell('pidof yamd >/dev/null && kill $(pidof yamd); true',check=False)
            for _ in range(20):
                if not self.yam_status()['running']:break
                time.sleep(.5)
            else:raise s.AdbError('Старый yamd не остановился')
            self.adb.shell(f'cp -a {base}/data {backup}/data',timeout=60)
            self.adb.shell(f'mv {new} {binary}')
            self._yam_port=None
            self.yam_start()
            deadline=time.monotonic()+20
            def selected(rows):return sorted((p['manifest']['id'],p['manifest']['version'],p.get('enabled')) for p in rows)
            while True:
                after=self.yam_plugins()
                running=all(not p.get('running') or next((q.get('running') for q in after if q['manifest']['id']==p['manifest']['id']),False) for p in plugins_before)
                if running:break
                if time.monotonic()>deadline:raise s.AdbError('Приложения YAM не восстановились')
                time.sleep(1)
            if selected(plugins_before)!=selected(after):raise s.AdbError('Список приложений YAM изменился')
            if self._yam('GET','/api/settings')!=settings_before:raise s.AdbError('Настройки YAM изменились')
            if self.adb.shell('sha256sum '+binary)[0].split()[0]!=expected:raise s.AdbError('Проверка установленного yamd не прошла')
            self._yam_releases=(0,[])
            return {**self.yam_status(),'version':release['tag_name'],'backup':backup}
        except Exception as exc:
            if stopped and copied:
                try:
                    self.adb.shell('pidof yamd >/dev/null && kill $(pidof yamd); true',check=False)
                    time.sleep(1)
                    self.adb.shell(f'cp -p {backup}/yamd {binary}; '
                         f'if [ -d {backup}/data ]; then mv {base}/data {backup}/failed-data; cp -a {backup}/data {base}/data; fi',timeout=60)
                    self._yam_port=None;self.yam_start()
                except Exception as rollback:
                    raise s.AdbError('Ошибка обновления и отката YAM. Копия: '+backup+'. '+str(rollback)) from exc
            raise s.AdbError('Обновление yamd не выполнено: '+str(exc)) from exc
        finally:
            try:
                self.adb.shell('rm -f '+new,check=False)
            finally:
                lock.release()
    s.Panel.yam_install_daemon=update
    s.Panel.yam_update_daemon=update
