(() => {
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function icon(name,size=18){const id='i-'+name;if(!/^[a-z-]+$/.test(name)||!document.getElementById(id))name='info';return `<svg class="ui-icon" width="${size}" height="${size}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;}
const views={home:'home',overview:'grid',player:'music',alarm:'alarm',boot:'power',apps:'box',yam:'layers',files:'folder',console:'term',charts:'chart',logs:'log',diagnostics:'shield',updates:'update',chatgpt:'chat',backups:'archive',settings:'gear'};
const buttons={
 'apps-refresh':'refresh','apps-recheck':'shield','y2-refresh':'refresh','y2-bootstrap':'dl','y2-latest':'search','y2-retire':'archive','y2-search':'search','y2-plan':'layers','y2-install':'dl','y2-official':'plus','y2-reg-add':'plus','y2-doctor':'shield','y2-repair':'refresh','y2-entware':'server','y2-services':'layers','y2-which':'search',
 'native-save':'check','native-check':'refresh','native-apply':'dl','native-rollback':'undo','native-cleanup':'trash','diagnostic-run':'shield','diagnostic-save':'dl','backup-create':'dl','backup-restore':'undo','backup-undo':'dl','voice-save':'check','voice-status':'info','voice-start':'play','voice-stop':'stop','voice-restart':'refresh','login-submit':'lock'
};
function choose(el){
 if(el.dataset.uiIcon)return el.dataset.uiIcon;
 if(el.dataset.tab)return views[el.dataset.tab]||'grid';
 if(buttons[el.id])return buttons[el.id];
 if(el.hasAttribute('data-refresh'))return 'refresh';
 if(el.dataset.appAction)return {start:'play',stop:'stop',restart:'refresh'}[el.dataset.appAction];
 if(el.hasAttribute('data-app-log'))return 'log';
 for(const [attr,name] of [['data-y2-files','folder'],['data-y2-remove','trash'],['data-y2-reg-remove','trash'],['data-y2-pick','plus'],['data-y2-info','info']])if(el.hasAttribute(attr))return name;
 const href=el.getAttribute('href');if(href?.startsWith('#')&&views[href.slice(1)])return views[href.slice(1)];
 const text=el.textContent.trim();
 if(el.matches('h2,h3')){if(el.closest('.app-card,.package-item')||/пакет|YAM/i.test(text))return 'box';if(/Журнал|Лог/.test(text))return 'log';if(/диагност|Проверка/i.test(text))return 'shield';if(/Профиль устройства/.test(text))return 'server';}
 for(const [pattern,name] of [[/Сохран|Применить/,'check'],[/Обнов|Перезапус/,'refresh'],[/Скач|Загруз|Установ/,'dl'],[/Удал|Очист/,'trash'],[/Отмен|Назад|Вернуть|Восстанов/,'undo'],[/Провер|Диагност/,'shield'],[/Консол/,'term'],[/Плеер|Музык|Звук/,'music'],[/Запуст|Воспроиз|Играть/,'play'],[/Останов|Стоп/,'stop'],[/Найти|Поиск/,'search'],[/Описание|Сведен|Информац/,'info'],[/Доступ|Пароль|Войти|Выйти/,'lock'],[/Резерв|копи/,'archive'],[/Реестр|Каталог|зависим|служб/,'layers'],[/Журнал|Лог/,'log'],[/Файл|Папк/,'folder'],[/ChatGPT|Голос/,'chat'],[/Настрой/,'gear']])if(pattern.test(text))return name;
 if(el.matches('h1'))return views[el.closest('main')?.id.replace('tab-','')]||'grid';
 return el.matches('h2,h3')?'info':'arrow-right';
}
const selector='.btn,nav.side a,.page-head h1,.card h2,.card h3';
function decorate(root=document){
 const nodes=[...(root.matches?.(selector)?[root]:[]),...root.querySelectorAll(selector)];
 for(const el of nodes){if(el.querySelector('svg')||!el.textContent.trim()||el.closest('svg'))continue;el.insertAdjacentHTML('afterbegin',icon(choose(el),el.matches('h1')?24:el.matches('nav a')?20:18));}
}
function checkRow(name,detail,status){const type=['ok','warn','error'].includes(status)?status:'warn';return `<div class="check-row is-${type}"><span class="check-mark" role="img" aria-label="${{ok:'Успешно',warn:'Внимание',error:'Ошибка'}[type]}">${icon(type==='ok'?'check':type==='error'?'close':'info')}</span><div class="check-copy"><b>${esc(name)}</b><span>${esc(detail)}</span></div></div>`;}
window.DarklsUI={icon,decorate,checkRow};decorate();
function revealTab(){if(innerWidth<=760)document.querySelector('nav.side a.active')?.scrollIntoView?.({block:'nearest',inline:'nearest'});}
addEventListener('hashchange',()=>queueMicrotask(revealTab));requestAnimationFrame(revealTab);
// Work only on inserted content or the changed control, rather than rescanning
// the full panel for every metric/player update. Existing handlers and text remain intact.
const observer=new MutationObserver(records=>{
 const roots=new Set();
 for(const record of records){const target=record.target.nodeType===1?record.target:record.target.parentElement;if(target?.closest('svg'))continue;const control=target?.closest(selector);if(control)roots.add(control);for(const node of record.addedNodes)if(node.nodeType===1&&node.tagName.toLowerCase()!=='svg')roots.add(node);}
 for(const root of roots)if(root.isConnected)decorate(root);
});observer.observe(document.body,{childList:true,subtree:true});
})();
