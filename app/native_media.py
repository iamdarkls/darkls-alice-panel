"""Optional audio-only FFmpeg, compressed on /data and expanded into private /tmp."""
import hashlib
import io
import json
import lzma
import os
from pathlib import Path
import shutil
import subprocess
import tarfile
import tempfile
import threading
import urllib.request

from native_updates import atomic_json, load_json

REPO = 'Xiragi/FFmpeg-Audio-Builds'
ASSET = 'ffmpeg-master-latest-linuxarm64-lgpl-audio.tar.xz'
MAX_ARCHIVE = 25*1024*1024
MAX_BINARY = 24*1024*1024
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


class Media:
    def __init__(self, base, cache=None):
        self.base = Path(base)
        self.root = self.base/'tools'/'ffmpeg'
        self.cache = Path(cache or '/tmp/darkls-ffmpeg')
        self.lock = threading.Lock()

    def _directory(self):
        self.cache.mkdir(mode=0o700, parents=True, exist_ok=True)
        if self.cache.is_symlink() or self.cache.stat().st_uid != os.geteuid():
            raise ValueError('Небезопасный каталог временного FFmpeg')
        self.cache.chmod(0o700)

    def _test(self, path):
        try:
            p = subprocess.run([str(path), '-hide_banner', '-loglevel', 'error',
                '-f', 's16le', '-ar', '48000', '-ac', '2', '-i', 'pipe:0',
                '-f', 'wav', 'pipe:1'], input=b'\0'*19200, capture_output=True, timeout=15)
        except (OSError, subprocess.TimeoutExpired) as exc:
            raise ValueError('FFmpeg не запускается на этой прошивке; установка не применена') from exc
        if p.returncode or not p.stdout.startswith(b'RIFF'):
            raise ValueError('Самопроверка FFmpeg не прошла: '+p.stderr.decode('utf-8','replace')[-500:])

    def executable(self):
        meta = load_json(self.root/'installed.json')
        if not meta:
            return None
        self._directory()
        target = self.cache/'ffmpeg'
        if target.is_file() and not target.is_symlink() and hashlib.sha256(target.read_bytes()).hexdigest()==meta['sha256']:
            return str(target)
        with lzma.open(self.root/'ffmpeg.xz','rb') as src:
            blob = src.read(MAX_BINARY+1)
        if len(blob)>MAX_BINARY or hashlib.sha256(blob).hexdigest()!=meta['sha256']:
            raise ValueError('Копия FFmpeg повреждена. Повтори установку.')
        if shutil.disk_usage('/tmp').free < len(blob)+8*1024*1024:
            raise ValueError('Недостаточно места в /tmp для FFmpeg')
        temp = self.cache/'ffmpeg.new'
        if temp.is_symlink() or target.is_symlink():
            raise ValueError('Небезопасный путь FFmpeg')
        temp.write_bytes(blob);temp.chmod(0o700)
        try:
            self._test(temp)
            os.replace(temp,target)
        finally:
            temp.unlink(missing_ok=True)
        return str(target)

    def info(self, panel):
        meta = load_json(self.root/'installed.json')
        return dict(available=bool(panel.ffmpeg), managed=bool(meta), path=panel.ffmpeg,
                    source=meta.get('source'), compressed_size=meta.get('compressed_size'),
                    detail='MP3, AAC/M4A, FLAC, OGG и WAV — через FFmpeg' if panel.ffmpeg else 'Доступен только WAV. Установи аудио-FFmpeg на колонку.')

    def install(self, panel):
        if not self.lock.acquire(blocking=False):
            raise ValueError('Установка FFmpeg уже выполняется')
        try:
            if os.uname().machine != 'aarch64':
                raise ValueError('Эта сборка FFmpeg предназначена для aarch64')
            # Keep the existing updater's 52 MiB reserve available after installation.
            if shutil.disk_usage(self.base).free < 60*1024*1024:
                raise ValueError('Для FFmpeg нужно 60 МБ свободно в /data, включая резерв для обновлений панели')
            if shutil.disk_usage('/tmp').free < 90*1024*1024:
                raise ValueError('Для установки FFmpeg нужно 90 МБ свободно в /tmp')
            req = urllib.request.Request('https://api.github.com/repos/'+REPO+'/releases/latest',headers={'User-Agent':'DARKLS-Alice'})
            with OPENER.open(req,timeout=20) as r:raw=r.read(262145)
            if len(raw)>262144:raise ValueError('Слишком большой ответ GitHub')
            release=json.loads(raw)
            asset=next((a for a in release.get('assets',[]) if a['name']==ASSET),None)
            if not asset:raise ValueError('В релизе отсутствует аудио-FFmpeg ARM64')
            expected=asset.get('digest','').removeprefix('sha256:')
            import re
            if not re.fullmatch('[a-f0-9]{64}',expected):raise ValueError('GitHub не предоставил SHA-256 сборки FFmpeg')
            if not 0<asset['size']<=MAX_ARCHIVE:raise ValueError('Архив FFmpeg слишком большой')
            url=asset['browser_download_url']
            if not url.startswith('https://github.com/'+REPO+'/releases/download/'):
                raise ValueError('Неожиданный источник FFmpeg')
            self._directory()
            with tempfile.TemporaryDirectory(prefix='ffmpeg-install-',dir=self.cache) as td:
                archive=Path(td)/'ffmpeg.tar.xz'
                digest,count=hashlib.sha256(),0
                with OPENER.open(url,timeout=90) as r,archive.open('wb') as out:
                    while chunk:=r.read(65536):
                        count+=len(chunk)
                        if count>asset['size']:raise ValueError('Размер FFmpeg не совпал с релизом')
                        digest.update(chunk);out.write(chunk)
                if count!=asset['size'] or digest.hexdigest()!=expected:
                    raise ValueError('SHA-256 FFmpeg не совпала с релизом')
                binary=Path(td)/'ffmpeg'
                with tarfile.open(archive,'r:xz') as tf:
                    members=[m for m in tf if m.isfile() and m.name.endswith('/bin/ffmpeg')]
                    if len(members)!=1 or not 0<members[0].size<=MAX_BINARY:
                        raise ValueError('Неверная структура сборки FFmpeg')
                    blob=tf.extractfile(members[0]).read(MAX_BINARY+1)
                if len(blob)<20 or blob[:5]!=b'\x7fELF\x02' or int.from_bytes(blob[18:20],'little')!=183:
                    raise ValueError('FFmpeg не является ELF aarch64')
                binary.write_bytes(blob);binary.chmod(0o700)
                self._test(binary)
                # Store only the binary, compressed; don't consume flash with ffprobe/video/docs.
                compressed=Path(td)/'ffmpeg.xz'
                with lzma.open(compressed,'wb',preset=3) as out:out.write(blob)
                if shutil.disk_usage(self.base).free<compressed.stat().st_size+52*1024*1024:
                    raise ValueError('После установки не останется резерва для обновлений панели')
                # One immutable version directory + atomic pointer; interrupted installs keep the old copy usable.
                parent=self.base/'tools';parent.mkdir(mode=0o700,exist_ok=True)
                binary_sha=hashlib.sha256(blob).hexdigest()
                version_dir=parent/('ffmpeg-'+binary_sha[:16])
                if not version_dir.exists():
                    stage=Path(tempfile.mkdtemp(prefix='.ffmpeg-',dir=parent))
                    try:
                        shutil.copyfile(compressed,stage/'ffmpeg.xz')
                        atomic_json(stage/'installed.json',dict(sha256=binary_sha,compressed_size=compressed.stat().st_size,
                            source=url,archive_sha256=expected,license='LGPL',upstream='https://github.com/'+REPO))
                        os.replace(stage,version_dir)
                    finally:
                        if stage.exists():shutil.rmtree(stage)
                if self.root.exists() and not self.root.is_symlink():
                    raise ValueError('Каталог tools/ffmpeg уже существует и не принадлежит этому установщику')
                link=parent/'.ffmpeg-link-new';link.unlink(missing_ok=True);link.symlink_to(version_dir.name);os.replace(link,self.root)
                target=self.cache/'ffmpeg';os.replace(binary,target);panel.ffmpeg=str(target)
            return self.info(panel)
        finally:
            self.lock.release()
