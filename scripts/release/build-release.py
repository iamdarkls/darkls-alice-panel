"""Build repeatable, bounded app updates from this exact checkout."""
import argparse,gzip,hashlib,io,json,os,tarfile,zipfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--repository',required=True);a=p.parse_args()
root=Path(__file__).resolve().parents[2]
# Refuse a source release whose generated Vue assets are stale or absent.
if (root/'frontend').is_dir():
 source=list((root/'frontend/src').rglob('*'))
 source=[f for f in source if f.is_file()]+[root/name for name in ('frontend/package.json','frontend/package-lock.json','frontend/vite.config.ts','frontend/tsconfig.json','frontend/build-fingerprint.mjs','app/static/ui-polish.css','app/static/model.css','app/static/unified.css')]
 fingerprint=hashlib.sha256()
 for f in sorted(source,key=lambda f:f.relative_to(root).as_posix()):fingerprint.update(f.relative_to(root).as_posix().encode()+b'\0'+f.read_bytes()+b'\0')
 marker=root/'app/static/ui/source.sha256'
 if not marker.is_file() or marker.read_text().strip()!=fingerprint.hexdigest() or not all((root/'app/static/ui'/name).is_file() for name in ('panel.js','panel.css')):
  raise SystemExit('Vue assets are missing or stale: run npm ci --prefix frontend && npm run build --prefix frontend')
out=root/'dist';out.mkdir(exist_ok=True)
app=root/'app';version=(app/'DARKLS_VERSION').read_text().strip()
files=sorted(f for f in app.rglob('*') if f.is_file() and '__pycache__' not in f.parts and f.suffix not in ('.pyc','.pyo'))
for f in files:
 if f.is_symlink() or (f.name.startswith('.') and f.name not in ('.dockerignore','.gitignore','.gitattributes')) or f.name in ('user_config.dat','initial-password.txt'):
  raise SystemExit('Unexpected private or symlink file: '+str(f))
with (out/'app.tar.gz').open('wb') as raw,gzip.GzipFile(fileobj=raw,mode='wb',mtime=0,filename='') as gz,tarfile.open(fileobj=gz,mode='w') as tf:
 for f in files:
  member=tarfile.TarInfo(str(f.relative_to(app)));blob=f.read_bytes();member.size=len(blob);member.mode=0o755 if f.suffix in ('.sh','.command') else 0o644;member.mtime=0;tf.addfile(member,io.BytesIO(blob))
blob=(out/'app.tar.gz').read_bytes()
meta=dict(version=version,sha256=hashlib.sha256(blob).hexdigest(),size=len(blob))
notes=(root/'docs/release-notes.txt').read_text()
manifest=dict(schema=1,target='aarch64-linux-gnu',version=version,min_python='3.14',url=f'https://github.com/{a.repository}/releases/download/v{version}/app.tar.gz',sha256=meta['sha256'],size=meta['size'],notes=notes)
value=json.dumps(manifest,ensure_ascii=False,indent=2)+'\n'
if len(value.encode())>65536:raise SystemExit('Manifest too large')
(out/'update.json').write_text(value)
(out/'release.json').write_text(json.dumps(meta,indent=2)+'\n')
with zipfile.ZipFile(out/'source.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in sorted(root.rglob('*')):
  rel=f.relative_to(root)
  if f.is_file() and not f.is_symlink() and rel.parts[0] not in ('.git','dist','data','runtime','dependencies') and '__pycache__' not in rel.parts and 'node_modules' not in rel.parts and f.suffix not in ('.pyc','.pyo','.zip','.gz','.xz') and not f.name.startswith('.panel'):
   z.write(f,rel)
print('Version:',version,'archive:',len(blob),'manifest:',len(value.encode()))
