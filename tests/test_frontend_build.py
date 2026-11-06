import hashlib,json,os,shutil,subprocess,sys,tempfile,unittest,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class FrontendBuild(unittest.TestCase):
 def test_stale_vue_assets_cannot_be_published_and_dependencies_are_excluded(self):
  with tempfile.TemporaryDirectory() as td:
   root=Path(td)
   shutil.copy2(ROOT/'build-release.py',root/'build-release.py');(root/'release-notes.txt').write_text('test')
   (root/'app/static/ui').mkdir(parents=True);(root/'app/DARKLS_VERSION').write_text('0.7.0');(root/'app/static/ui/panel.js').write_text('export const ready=true');(root/'app/static/ui/panel.css').write_text('body{}')
   for name in ['frontend/src/main.ts','frontend/package.json','frontend/package-lock.json','frontend/vite.config.ts','frontend/tsconfig.json','frontend/build-fingerprint.mjs','app/static/ui-polish.css','app/static/model.css','app/static/unified.css']:
    f=root/name;f.parent.mkdir(parents=True,exist_ok=True);f.write_text('{}' if f.suffix=='.json' else 'source')
   (root/'frontend/node_modules/private').mkdir(parents=True);(root/'frontend/node_modules/private/never-ship.txt').write_text('development dependency')
   command=[sys.executable,str(root/'build-release.py'),'--repository','owner/repo']
   result=subprocess.run(command,capture_output=True,text=True);self.assertNotEqual(result.returncode,0);self.assertIn('stale',result.stdout+result.stderr);self.assertFalse((root/'dist').exists())
   files=[p for p in (root/'frontend/src').rglob('*') if p.is_file()]+[root/n for n in ('frontend/package.json','frontend/package-lock.json','frontend/vite.config.ts','frontend/tsconfig.json','frontend/build-fingerprint.mjs','app/static/ui-polish.css','app/static/model.css','app/static/unified.css')]
   digest=hashlib.sha256()
   for p in sorted(files,key=lambda p:p.relative_to(root).as_posix()):digest.update(p.relative_to(root).as_posix().encode()+b'\0'+p.read_bytes()+b'\0')
   (root/'app/static/ui/source.sha256').write_text(digest.hexdigest())
   result=subprocess.run(command,capture_output=True,text=True);self.assertEqual(result.returncode,0,result.stderr)
   with zipfile.ZipFile(root/'dist/source.zip') as archive:
    self.assertIn('frontend/src/main.ts',archive.namelist());self.assertFalse(any('node_modules' in name for name in archive.namelist()))
   (root/'frontend/src/main.ts').write_text('changed source')
   result=subprocess.run(command,capture_output=True,text=True);self.assertNotEqual(result.returncode,0)
if __name__=='__main__':unittest.main()
