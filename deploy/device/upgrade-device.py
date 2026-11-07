"""Incremental upgrade on existing native installation; no boot/runtime changes."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time
import urllib.request

stage=Path(sys.argv[1]).resolve()
base=Path('/data/darkls-alice')
sys.path.insert(0,str(stage))
from native_updates import atomic_json, extract_release, load_json, point
from native_features import Maintenance


def main():
    meta=json.loads((stage/'release.json').read_text())
    archive=stage/'app.tar.gz'
    if hashlib.sha256(archive.read_bytes()).hexdigest()!=meta['sha256']:
        raise RuntimeError('Archive checksum mismatch')
    if os.geteuid()!=0 or os.uname().machine!='aarch64':
        raise RuntimeError('Root and aarch64 are required')
    current=(base/'current').resolve()
    if current.parent!=(base/'releases').resolve() or not (current/'native.py').is_file():
        raise RuntimeError('Existing native installation not found')
    if (base/'restart.request').exists():
        raise RuntimeError('An update is already pending')
    if shutil.disk_usage(base).free < 52*1024*1024:
        raise RuntimeError('Need 52 MiB free in /data')
    backup=Maintenance(base).create_backup(secrets=True)
    print('BACKUP='+str(Maintenance(base).download(backup['name'])),flush=True)
    target=base/'releases'/(meta['version']+'-'+meta['sha256'][:12])
    with (base/'update.lock').open('a') as lock:
        import fcntl
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        if target==current:
            print('ALREADY_INSTALLED',flush=True)
            print('NATIVE_UPGRADE_OK',flush=True)
            return
        # Never overwrite an existing extracted release.
        if target.exists():
            raise RuntimeError('Release already staged; inspect previous attempt before retrying')
        extract_release(archive,target)
        if (target/'DARKLS_VERSION').read_text().strip()!=meta['version']:
            shutil.rmtree(target)
            raise RuntimeError('Release version mismatch')
        # Compile with the real ARM interpreter before making it active.
        for p in target.glob('*.py'):
            compile(p.read_bytes(),str(p),'exec')
        point(base,'previous',current)
        point(base,'current',target)
        atomic_json(base/'restart.request',dict(version=meta['version'],requested=time.time()))
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
    port=load_json(base/'config.json').get('port',8770)
    for _ in range(100):
        time.sleep(1)
        try:
            with opener.open('http://127.0.0.1:'+str(port)+'/api/native/health',timeout=2) as r:
                health=json.load(r)
            running=load_json(base/'running.json')
            if health.get('version')==meta['version'] and health.get('pid')==running.get('pid') and not (base/'restart.request').exists():
                subprocess.run(['sync'],check=True)
                print('NATIVE_UPGRADE_OK',flush=True)
                return
            if (base/'current').resolve()==current and load_json(base/'update-status.json').get('failed')==meta['version']:
                raise RuntimeError('New release failed; supervisor restored previous version')
        except (OSError,ValueError):
            pass
    raise RuntimeError('No success confirmation. Inspect service.log and current version; do not run another update yet.')

if __name__=='__main__':main()
