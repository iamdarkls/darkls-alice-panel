(() => {
'use strict';
const $=id=>document.getElementById(id);
const stamp=t=>t?new Date(t*1000).toLocaleString('ru-RU'):'Ещё не выполнялась';
async function api(path,data,raw=false){
 const r=await fetch('/api/native/'+path,{cache:'no-store',signal:AbortSignal.timeout(130000),...(data===undefined?{}:{method:'POST',headers:{'Content-Type':raw?'application/octet-stream':'application/json'},body:raw?data:JSON.stringify(data)})});
 const v=await r.json(); if(!r.ok)throw Error(v.error||`HTTP ${r.status}`);return v;
}
function download(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function bind(id,status,action){$(id).onclick=async()=>{const b=$(id);b.disabled=true;$(status).textContent='Выполняем…';try{await action();}catch(e){$(status).textContent=e.message;}finally{b.disabled=false;}};}
async function backups(){const v=await api('backups');$('backup-info').textContent='Последняя созданная копия: '+stamp(v.last_backup?.created)+(v.last_backup?' · '+Math.round(v.last_backup.size/1024)+' КБ':'')+'\nПоследнее восстановление: '+stamp(v.last_restore?.at);}
bind('backup-create','backup-status',async()=>{const v=await api('backups/create',{secrets:$('backup-secrets').checked});const r=await fetch(v.download,{cache:'no-store'});if(!r.ok)throw Error('Не удалось скачать копию');download(await r.blob(),v.name);$('backup-status').textContent='Копия подготовлена и передана браузеру. Проверь папку загрузок на своём устройстве.';await backups();});
bind('backup-restore','backup-status',async()=>{const f=$('backup-file').files[0];if(!f)throw Error('Выбери архив .tar.gz');if(f.size>16*1024*1024)throw Error('Максимальный размер — 16 МБ');if(!confirm('Восстановить настройки панели из копии? Текущие настройки будут сохранены в копии для отмены. Пароль и системные файлы не меняются.'))return;const v=await api('backups/restore',f,true);$('backup-status').textContent=v.message;const a=$('backup-undo');a.href=v.undo.download;a.hidden=false;await backups();});
let report;
bind('diagnostic-run','diagnostic-status',async()=>{report=await api('diagnostics',{});const box=$('diagnostic-checks');box.replaceChildren();for(const check of report.checks){const row=document.createElement('p');const b=document.createElement('b');b.textContent=({ok:'✓ ',warn:'⚠ ',error:'✕ '}[check.status]||'')+check.name;row.append(b,document.createTextNode(' — '+(check.detail||('HTTP '+check.http))));box.append(row);} $('diagnostic-report').textContent=JSON.stringify(report,null,2);$('diagnostic-save').disabled=false;$('diagnostic-status').textContent='Проверено '+stamp(report.created)+' · прошивка '+(report.firmware?.trim()||'не определена');});
$('diagnostic-save').onclick=()=>{if(report)download(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),'alice-diagnostics.json');};
async function voice(){const v=await api('voice');if(document.activeElement!==$('voice-url'))$('voice-url').value=v.url;$('voice-compatible').checked=v.compatibility_confirmed;$('voice-token').placeholder=v.has_token?'Сохранён. Оставь пустым, чтобы сохранить':'Токен агента';$('voice-note').textContent=v.note;$('voice-start').disabled=!v.compatibility_confirmed;$('voice-restart').disabled=!v.compatibility_confirmed;}
bind('voice-save','voice-result',async()=>{await api('voice/config',{url:$('voice-url').value.trim(),token:$('voice-token').value.trim(),compatibility_confirmed:$('voice-compatible').checked});$('voice-token').value='';$('voice-result').textContent='Настройки сохранены';await voice();});
for(const action of ['status','start','stop','restart'])bind('voice-'+action,'voice-result',async()=>{if(action!=='status'&&!confirm('Выполнить «'+action+'» для голосового сервиса на Linux-сервере?'))return;const v=await api('voice/'+action,{});$('voice-result').textContent=JSON.stringify(v,null,2);});
async function load(){try{if(location.hash==='#backups')await backups();if(location.hash==='#chatgpt')await voice();}catch(e){const id=location.hash==='#backups'?'backup-status':'voice-result';$(id).textContent=e.message;}}
addEventListener('hashchange',load);addEventListener('darkls:authchanged',load);load();
})();
