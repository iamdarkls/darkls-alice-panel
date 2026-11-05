(() => {
'use strict';const $=s=>document.querySelector(s);
let loading=false;
if(['#packages'].includes(location.hash))location.replace('#yam');
function toast(message){const el=$('#darkls-toast');el.textContent=message;el.hidden=false;setTimeout(()=>el.hidden=true,8000);}
async function api(name){const r=await fetch('/api/darkls/'+name,{cache:'no-store',signal:AbortSignal.timeout(12000)});const v=await r.json();if(r.status===401){if(!$('#login-dialog').open)$('#login-dialog').showModal();throw Error('Войди в панель');}if(!r.ok)throw Error(v.error||r.statusText);return v;}
function showView(){
 const tab=location.hash.slice(1)||'home';for(const el of document.querySelectorAll('[data-view]'))el.classList.toggle('active',el.dataset.view===tab);
 $('#breadcrumb').textContent={apps:'Приложения',yam:'YAM v2',home:'Главная',diagnostics:'Диагностика',updates:'Обновления панели',backups:'Резервные копии',chatgpt:'ChatGPT'}[tab]||tab;
 $('.sidebar').classList.remove('open');$('#menu-button').setAttribute('aria-expanded','false');
}
addEventListener('hashchange',showView);showView();
$('#menu-button').onclick=()=>{$('.sidebar').classList.toggle('open');$('#menu-button').setAttribute('aria-expanded',String($('.sidebar').classList.contains('open')));};
async function refresh(){if(loading)return;loading=true;
 try{
  const info=await api('health'),device=info.device||{};$('#adb-dot').className='status-dot good';$('#sidebar-status').className='status-dot good';
  $('#adb-state').textContent='Готов';$('#adb-detail').textContent='Панель управляет колонкой локально; ADB и yamd не требуются.';
  $('#hero-status').textContent='● Панель работает на колонке';$('#sidebar-text').textContent='Локальный доступ';$('#station-address').textContent=location.host;
  $('#device-json').textContent=JSON.stringify(device,null,2);$('#hero-platform').textContent=(device.model||'Мини 3 Про')+' · '+(device.platform||'pickle');
  $('#adb-log').textContent=(info.adb.log||[]).map(e=>new Date(e.t*1000).toLocaleTimeString('ru-RU')+' '+e.msg).join('\n');$('#connection-error').hidden=true;
  const values=await api('sensors'),node=$('#sensors');node.replaceChildren();
  for(const sensor of values){const row=document.createElement('div');row.className='sensor-row';const name=document.createElement('span'),value=document.createElement('b');name.textContent=sensor.id;value.textContent=Number(sensor.value).toLocaleString('ru-RU',{maximumFractionDigits:1})+' '+sensor.unit;row.append(name,value);node.append(row);}
  if(!values.length)node.textContent='Ядро не предоставляет поддерживаемых датчиков через sysfs.';
 }catch(e){$('#connection-error').hidden=false;$('#connection-error').textContent=e.message;}finally{loading=false;}
}
for(const button of document.querySelectorAll('[data-refresh]'))button.onclick=refresh;
$('#login-form').onsubmit=async event=>{
 event.preventDefault();const button=event.target.querySelector('button');button.disabled=true;
 try{const r=await fetch('/api/panel-auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:$('#login-password').value})});const v=await r.json();if(!r.ok)throw Error(v.error);$('#login-password').value='';$('#login-error').textContent='';$('#login-dialog').close();dispatchEvent(new Event('darkls:authchanged'));await refresh();}catch(e){$('#login-error').textContent=e.message;}finally{button.disabled=false;}
};
$('#login-dialog').addEventListener('cancel',e=>e.preventDefault());addEventListener('darkls:authchanged',refresh);refresh();setInterval(()=>{if(!document.hidden&&!$('#login-dialog').open)refresh();},10000);
})();
