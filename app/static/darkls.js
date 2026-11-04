(() => {
'use strict';
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state = {health:null, plugins:[], registry:[], loading:false, view:'home', yamOnline:false, packagesAvailable:false};
let toastTimer;
function toast(message, error=false) {
  const node=$('#darkls-toast')||$('#toast'); node.textContent=message; node.className=error?'error':''; node.hidden=false;
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>node.hidden=true,error?9000:4500);
}
async function api(path, body, options={}) {
  const response=await fetch('/api/darkls/'+path, {
    cache:'no-store', signal:AbortSignal.timeout(options.timeout||35000),
    ...(body===undefined?{}:{method:'POST',headers:{'Content-Type':options.raw?'application/octet-stream':'application/json'},body:options.raw?body:JSON.stringify(body)})
  });
  const data=await response.json().catch(()=>({error:'Некорректный ответ сервера'}));
  if(response.status===401) {
    if(!$('#login-dialog').open) $('#login-dialog').showModal();
    throw new Error('Войди в панель');
  }
  if(!response.ok) throw new Error(data.error||`HTTP ${response.status}`);
  return data;
}
function showView() {
  const native=document.body.dataset.darklsUnified==='true';
  const sections=native?['home','packages','diagnostics','updates','backups','chatgpt','overview','player','alarm','boot','apps','files','console','charts','logs','settings']:['home','packages','diagnostics'];
  state.view=sections.includes(location.hash.slice(1))?location.hash.slice(1):'home';
  for(const node of document.querySelectorAll('.view')) node.hidden=node.id!=='view-'+state.view;
  for(const node of document.querySelectorAll('[data-view]')) node.classList.toggle('active',node.dataset.view===state.view);
  $('#breadcrumb').textContent={updates:'Обновления панели',backups:'Резервные копии',chatgpt:'ChatGPT',home:'Главная',packages:'Пакеты YAM',diagnostics:'Диагностика',overview:'Свет, часы и Bluetooth',player:'Музыка',alarm:'Будильники',boot:'Запуск колонки',apps:'Демон YAM',files:'Файлы',console:'Root-консоль',charts:'Графики',logs:'Логи',settings:'Настройки'}[state.view];
  $('#menu-button').setAttribute('aria-expanded','false'); $('.sidebar').classList.remove('open');
}
addEventListener('hashchange',showView); showView();
$('#menu-button').onclick=()=>{
  const open=$('.sidebar').classList.toggle('open'); $('#menu-button').setAttribute('aria-expanded',String(open));
};
function dot(id,online) { $(id).className='status-dot '+(online?'good':'bad'); }
function renderHealth(info) {
  state.health=info; state.yamOnline=info.yam.online;
  const adb=info.adb.state==='online', yam=info.yam.online;
  dot('#yam-dot',yam); dot('#adb-dot',adb); dot('#sidebar-status',yam||adb);
  $('#yam-state').textContent=yam?'Работает':'Нет связи';
  $('#yam-detail').textContent=yam?'Демон доступен напрямую по сети':'Проверь питание и подключение колонки';
  $('#adb-state').textContent=adb?'Подключён':info.adb.state==='connecting'?'Подключение…':'Ожидаем ADB';
  $('#adb-detail').textContent=info.native?'Панель работает на колонке, ADB не нужен':adb?'Инструменты готовы к работе':'YAM доступен независимо от ADB';
  $('#hero-status').textContent=yam&&adb?'● Все подключения активны':yam?'● YAM подключён':adb?'● ADB подключён':'● Ожидаем колонку';
  $('#sidebar-text').textContent=yam?'YAM подключён':adb?'ADB подключён':'Нет подключения';
  $('#station-address').textContent=info.adb.serial||info.yam.url;
  $('#yam-link').href=info.yam.url; $('#yam-link').hidden=!yam;
  $('#device-json').textContent=JSON.stringify(info.yam.device||{error:info.yam.error||'Нет данных'},null,2);
  $('#hero-platform').textContent=info.yam.device?`${info.yam.device.model} · ${info.yam.device.architecture}`:'Mini 3 Pro · Pickle';
  $('#adb-log').textContent=(info.adb.log||[]).map(e=>`${new Date(e.t*1000).toLocaleTimeString('ru-RU')}  ${e.msg}`).join('\n')||'Событий пока нет';
  $('#connection-error').hidden=yam;
  $('#connection-error').textContent=info.yam.error||'';
}
function renderPackages() {
  const plugins=state.plugins;
  for(const id of ['#home-count','#packages-count','#nav-count']) $(id).textContent=state.yamOnline&&state.packagesAvailable?plugins.length:'—';
  if(!state.yamOnline||!state.packagesAvailable) {
    $('#home-packages').innerHTML='<span class="empty-icon">⌁</span><strong>Список пакетов недоступен</strong>Повтори обновление после проверки связи с YAM.';
    $('#package-list').innerHTML='<div class="card placeholder">Не удалось получить список пакетов. Проверь связь с YAM.</div>';
    return;
  }
  if(!plugins.length) {
    $('#home-packages').innerHTML='<span class="empty-icon">▦</span><strong>Здесь появятся твои приложения</strong>Добавь первый пакет, чтобы расширить возможности Алисы.<br><a href="#packages">＋ Установить приложение</a>';
    $('#package-list').innerHTML='<div class="card placeholder"><span class="empty-icon">▦</span><strong>Пакетов пока нет</strong>Загрузи .yap или открой реестр пакетов.</div>';
    return;
  }
  $('#home-packages').innerHTML=plugins.slice(0,4).map(p=>`<div class="summary-row"><strong>${esc(p.manifest.name||p.manifest.id)}</strong><span>${p.running?'Работает':p.enabled?'Включён':'Выключен'}</span></div>`).join('');
  $('#package-list').innerHTML=plugins.map(p=>{
    const m=p.manifest, id=esc(m.id), mode=m.launch?.mode;
    const permissions=Array.isArray(m.permissions)?m.permissions.join(', '):'';
    const button=(action,label,extra='')=>`<button class="btn sm ${extra}" data-action="${action}" data-id="${id}">${label}</button>`;
    return `<article class="card package-item"><div><h3>${esc(m.name||m.id)} <span class="muted">${esc(m.version)}</span></h3><p>${esc(m.description||m.id)}</p><span class="badge">${p.running?'● Работает':p.enabled?'Включён':'Выключен'}</span>${p.service_enabled?'<span class="badge">Автозапуск</span>':''}<p>${permissions?'Права: '+esc(permissions):''}</p>${p.compatible===false?`<p>Несовместим: ${esc(p.incompatibility||'профиль устройства')}</p>`:''}</div><div class="package-actions">${p.compatible===false?'':button(p.running?'stop':'run',p.running?'Остановить':'Запустить')}${button('toggle',p.enabled?'Выключить':'Включить')}${mode==='service'?button(p.service_enabled?'disable':'enable',p.service_enabled?'Убрать автозапуск':'Автозапуск'):''}${button('logs','Лог')}${button('remove','Удалить','danger')}</div></article>`;
  }).join('');
}
function renderSensors(sensors) {
  const rows=Array.isArray(sensors)?sensors:[];
  $('#sensors').innerHTML=rows.length?rows.slice(0,6).map(s=>`<div class="sensor-row"><span>${esc(s.id||s.kind)}</span><b>${s.value==null?'—':esc(Number(s.value).toLocaleString('ru-RU',{maximumFractionDigits:1}))} ${esc(s.unit)}</b></div>`).join(''):'<p class="muted">YAM не сообщил доступных датчиков.</p>';
}
async function refresh() {
  if(state.loading) return;
  state.loading=true;
  try {
    const info=await api('health',undefined,{timeout:12000}); renderHealth(info);
    if(info.yam.online) {
      const results=await Promise.allSettled([api('plugins'),api('sensors'),api('settings')]);
      state.packagesAvailable=results[0].status==='fulfilled';
      if(state.packagesAvailable) state.plugins=results[0].value;
      else {state.plugins=[];toast('Пакеты: '+results[0].reason.message,true);}
      if(results[1].status==='fulfilled') renderSensors(results[1].value);
      else $('#sensors').textContent='Датчики недоступны: '+results[1].reason.message;
      if(results[2].status==='fulfilled') $('#allow-binaries').checked=!!results[2].value.allow_plugin_binaries;
    } else { state.plugins=[];state.packagesAvailable=false; $('#sensors').textContent='Нет связи с YAM'; }
    renderPackages();
  } catch(error) {
    $('#connection-error').hidden=false;
    $('#connection-error').textContent='Панель не получила ответ: '+error.message;
    toast(error.message,true);
  } finally { state.loading=false; }
}
for(const node of document.querySelectorAll('[data-refresh]')) node.onclick=refresh;
$('#package-list').onclick=async event=>{
  const button=event.target.closest('[data-action]'); if(!button)return;
  const {action,id}=button.dataset;
  if(action==='remove'&&!confirm(`Удалить пакет «${id}» и его файлы?`))return;
  button.disabled=true;
  try {
    if(action==='logs') {
      const result=await api('package/logs?id='+encodeURIComponent(id));
      $('#package-log-title').textContent='Журнал: '+id;
      $('#package-log').textContent=result.text||'Журнал пуст';
      $('#package-log-card').hidden=false; $('#package-log-card').scrollIntoView({behavior:'smooth',block:'nearest'});
    } else { await api('package/action',{id,action}); toast('Готово'); await refresh(); }
  } catch(error) {toast(error.message,true);} finally {button.disabled=false;}
};
$('#close-package-log').onclick=()=>$('#package-log-card').hidden=true;
$('#package-file').onchange=async event=>{
  const file=event.target.files[0]; if(!file)return;
  if(!file.name.toLowerCase().endsWith('.yap')||file.size>32*1024*1024) {toast('Нужен файл .yap размером до 32 МБ',true);event.target.value='';return;}
  if(!confirm(`Установить «${file.name}» на колонку?`)){event.target.value='';return;}
  const label=$('.upload-label'); label.style.pointerEvents='none'; label.setAttribute('aria-busy','true');
  try {await api('package/upload',await file.arrayBuffer(),{raw:true,timeout:125000});toast('Пакет установлен');await refresh();}
  catch(error){toast(error.message,true);}
  finally {event.target.value='';label.style.pointerEvents='';label.removeAttribute('aria-busy');}
};
$('#allow-binaries').onchange=async event=>{
  const input=event.target, value=input.checked; input.disabled=true;
  try {await api('settings',{allow_plugin_binaries:value});toast('Настройка сохранена');}
  catch(error){input.checked=!value;toast(error.message,true);}finally{input.disabled=false;}
};
function renderRegistry() {
  const search=$('#registry-search').value.toLowerCase();
  const list=state.registry.filter(p=>[p.name,p.id,p.description].join(' ').toLowerCase().includes(search));
  $('#registry-list').innerHTML=list.length?list.map(p=>`<div class="package-item"><div><h3>${esc(p.name||p.id)} <span class="muted">${esc(p.version)}</span></h3><p>${esc(p.description||'')}</p><p>${esc((p.compatibility?.models||[]).join(', '))}</p></div><button class="btn sm" data-install="${esc(p.id)}" data-version="${esc(p.version)}">Установить</button></div>`).join(''):'<div class="placeholder">Пакеты не найдены</div>';
}
$('#registry-toggle').onclick=async()=>{
  const card=$('#registry-card');card.hidden=!card.hidden;if(card.hidden)return;
  if(!state.registry.length) {
    $('#registry-list').textContent='Получаем реестр…';
    try {const result=await api('registry');state.registry=result.packages||[];}
    catch(error){$('#registry-list').textContent=error.message;return;}
  }
  renderRegistry();
};
$('#registry-search').oninput=renderRegistry;
$('#registry-list').onclick=async event=>{
  const button=event.target.closest('[data-install]');if(!button)return;
  if(!confirm(`Установить ${button.dataset.install} ${button.dataset.version}? Совместимость проверит YAM.`))return;
  button.disabled=true;const old=button.textContent;button.textContent='Установка…';
  try{await api('package/install',{id:button.dataset.install,version:button.dataset.version},{timeout:180000});toast('Пакет установлен');await refresh();}
  catch(error){toast(error.message,true);}finally{button.disabled=false;button.textContent=old;}
};
$('#login-form').onsubmit=async event=>{
  event.preventDefault();const button=event.target.querySelector('button');button.disabled=true;
  try {
    const response=await fetch('/api/panel-auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:$('#login-password').value})});
    const result=await response.json();if(!response.ok)throw new Error(result.error||'Не удалось войти');
    $('#login-password').value='';$('#login-error').textContent='';$('#login-dialog').close();window.dispatchEvent(new Event('darkls:authchanged'));await refresh();
  }catch(error){$('#login-error').textContent=error.message;}finally{button.disabled=false;}
};
$('#login-dialog').addEventListener('cancel',event=>event.preventDefault());
refresh();setInterval(()=>{if(!document.hidden&&!$('#login-dialog').open)refresh();},10000);

})();
