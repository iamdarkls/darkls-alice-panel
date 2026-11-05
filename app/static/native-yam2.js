(() => {
'use strict';
const $=id=>document.getElementById(id);if(!$('tab-yam'))return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let busy=false,installed=false;
async function api(path,body,raw=false){
  const r=await fetch('/api/yam2/'+path,{cache:'no-store',signal:AbortSignal.timeout(300000),...(body===undefined?{}:{method:'POST',headers:{'Content-Type':raw?'application/octet-stream':'application/json',...(raw&&$('y2-replace').checked?{'X-Yam-Allow-Replacements':'true'}:{})},body:raw?body:JSON.stringify(body)})});
  const v=await r.json();if(!r.ok)throw Error(v.error||'HTTP '+r.status);return v;
}
const report=v=>{$('y2-report').textContent=typeof v==='string'?v:v.report||JSON.stringify(v,null,2);};
const registry=()=>$('y2-registry').value||'official';
function action(name,extra={}){return api('action',{action:name,registry:registry(),...extra});}
async function refresh(){
  const v=await api('status');installed=v.installed;
  const text=installed?'Установлен '+(v.version||'(версия не определена)'):'Ещё не установлен';
  $('y2-version').textContent=text;$('y2-home-version').textContent=text;
  $('y2-controls').hidden=!installed;
  $('y2-state').textContent=installed?'YAM v2 готов. Управление через CLI; HTTP API yamd не требуется.':'Установи актуальную ARM64-версию YAM. После установки заверши переход на новый менеджер.';
  $('y2-bootstrap').textContent=installed?'Обновить YAM':'Установить актуальный YAM';
  const transition=await api('retirement');$('y2-transition').hidden=!transition.pending;$('y2-retire').disabled=!installed;
  if(!transition.pending&&transition.archive)$('y2-state').textContent+=' Архив прежнего менеджера: '+transition.archive;
  if(!installed){$('home-count').textContent='—';$('home-packages').textContent='Установи YAM в разделе YAM v2.';return;}
  const results=await Promise.allSettled([api('packages'),api('registries')]);
  if(results[0].status==='fulfilled'){
    const packages=results[0].value;$('y2-count').textContent=packages.length;$('home-count').textContent=packages.length;
    $('y2-packages').innerHTML=packages.length?packages.map(p=>`<article class="card package-item"><div><h3>${esc(p.name)}</h3><p>${esc(p.version)} · ${esc(p.target)}</p></div><div class="row"><button class="btn sm" data-y2-files="${esc(p.name)}">Файлы</button><button class="btn sm danger" data-y2-remove="${esc(p.name)}">Удалить</button></div></article>`).join(''):'<p class="hint">Пакетов .yampkg пока нет.</p>';
  }else{$('y2-packages').textContent=results[0].reason.message;}
  if(results[1].status==='fulfilled'){
    const old=registry(),regs=results[1].value;
    $('y2-registry').innerHTML=regs.map(r=>`<option value="${esc(r.name)}">${esc(r.name)}</option>`).join('');
    if(regs.some(r=>r.name===old))$('y2-registry').value=old;
    $('y2-registries').innerHTML=regs.length?regs.map(r=>`<div class="summary-row"><span><b>${esc(r.name)}</b> · ${esc(r.url)}</span><button class="btn sm danger" data-y2-reg-remove="${esc(r.name)}">Удалить</button></div>`).join(''):'<p class="hint">Реестр ещё не подключён. Добавь официальный реестр для поиска и установки по имени.</p>';
  }else{$('y2-registries').textContent=results[1].reason.message;}
}
async function run(fn){
  if(busy)return;busy=true;const inputs=[...$('tab-yam').querySelectorAll('button,input,select')];const states=inputs.map(e=>e.disabled);inputs.forEach(e=>e.disabled=true);
  report('Операция выполняется…');
  try{const v=await fn();if(v!==undefined)report(v);await refresh();}catch(e){report(e.message);}finally{inputs.forEach((e,i)=>e.disabled=states[i]);$('y2-retire').disabled=!installed;busy=false;}
}
$('y2-refresh').onclick=()=>run(async()=>{await refresh();return 'Данные обновлены.';});
$('y2-latest').onclick=()=>run(async()=>{const v=await api('latest');return 'Последняя стабильная версия: '+v.version+'\n'+v.url;});
$('y2-bootstrap').onclick=()=>{
  const message=installed?'Обновить YAM его штатным механизмом с проверкой подписи? Бинарник и база будут сохранены перед операцией.':'Установить актуальный YAM ARM64 в /data/yam? Скачивание около 4 МБ; старые yamd и .yap сохранятся.';
  if(confirm(message))run(()=>api('bootstrap',{}));
};
$('y2-retire').onclick=()=>{if(confirm('Остановить прежние приложения .yap, убрать yamd и его автозапуск? Весь каталог и загрузочный скрипт будут сохранены в архиве.'))run(()=>api('retire',{}));};
$('y2-official').onclick=()=>run(()=>action('official-registry'));
$('y2-reg-add').onclick=()=>run(()=>action('registry-add',{registry:$('y2-reg-name').value.trim(),url:$('y2-reg-url').value.trim(),key:$('y2-reg-key').value.trim()}));
$('y2-search').onclick=()=>run(async()=>{
  const v=await action('search',{query:$('y2-query').value});
  $('y2-results').innerHTML=v.items.length?v.items.map(p=>`<article class="card"><h3>${esc(p.name)} · ${esc(p.version)}</h3><p>${esc(p.summary)}</p><button class="btn sm" data-y2-pick="${esc(p.name)}">Выбрать</button><button class="btn sm" data-y2-info="${esc(p.name)}">Описание</button></article>`).join(''):'<p class="hint">По этому запросу пакетов нет.</p>';
  return 'Найдено: '+v.items.length;
});
$('y2-query').onkeydown=e=>{if(e.key==='Enter')$('y2-search').click();};
$('y2-plan').onclick=()=>run(()=>action('plan',{name:$('y2-name').value.trim()}));
$('y2-install').onclick=()=>{const name=$('y2-name').value.trim();if(confirm('Установить '+name+' и его зависимости? Проверь план установки.'))run(()=>action('install',{name,allow_replacements:$('y2-replace').checked}));};
$('y2-file').onchange=()=>{
  const file=$('y2-file').files[0];if(!file)return;
  if(!file.name.endsWith('.yampkg')||file.size>32*1048576){report('Нужен файл .yampkg до 32 МБ.');$('y2-file').value='';return;}
  if(confirm('Установить локальный пакет '+file.name+'? Его код и postinstall получат права root.'))run(async()=>{try{return await api('upload',file,true);}finally{$('y2-file').value='';}});
  else $('y2-file').value='';
};
$('y2-doctor').onclick=()=>run(()=>action('doctor'));
$('y2-repair').onclick=()=>{if(confirm('Восстановить ссылки пакетов по базе YAM?'))run(()=>action('repair'));};
$('y2-entware').onclick=()=>run(()=>action('entware'));
$('y2-services').onclick=()=>run(()=>api('services'));
$('y2-which').onclick=()=>run(()=>action('which',{path:$('y2-path').value.trim()}));
$('tab-yam').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||busy)return;
  if(b.dataset.y2Files)run(()=>action('files',{name:b.dataset.y2Files}));
  if(b.dataset.y2Remove&&confirm('Удалить пакет '+b.dataset.y2Remove+'?'))run(()=>action('remove',{name:b.dataset.y2Remove}));
  if(b.dataset.y2RegRemove&&confirm('Удалить реестр '+b.dataset.y2RegRemove+'? Установленные пакеты сохранятся.'))run(()=>action('registry-remove',{registry:b.dataset.y2RegRemove}));
  if(b.dataset.y2Pick){$('y2-name').value=b.dataset.y2Pick;report('Пакет выбран. Проверь зависимости перед установкой.');}
  if(b.dataset.y2Info)run(()=>action('info',{name:b.dataset.y2Info}));
});
function load(){if(!busy)refresh().catch(e=>{$('y2-state').textContent=e.message;});}
addEventListener('hashchange',()=>{if(location.hash==='#yam'||location.hash==='#home')load();});
addEventListener('darkls:authchanged',load);load();
})();
