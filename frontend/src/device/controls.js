// Device widgets retain their proven protocols and DOM integration (xterm, SVG, Three).
// This controller is mounted exactly once by the Vue composable and disposed with it.
export function createDeviceControls(context) {
const scope=new AbortController(),timers=new Set(),intervals=new Set(),frames=new Set(),observers=new Set(),listeners=[];
const ResizeObserver=class extends window.ResizeObserver{constructor(fn){super(fn);observers.add(this)}};
const setTimeout=(fn,ms,...args)=>{const id=window.setTimeout(()=>{timers.delete(id);if(!scope.signal.aborted)fn(...args)},ms);timers.add(id);return id};
const setInterval=(fn,ms,...args)=>{const id=window.setInterval(()=>{if(!scope.signal.aborted)fn(...args)},ms);intervals.add(id);return id};
const clearTimeout=id=>{timers.delete(id);window.clearTimeout(id)},clearInterval=id=>{intervals.delete(id);window.clearInterval(id)};
const requestAnimationFrame=fn=>{const id=window.requestAnimationFrame(t=>{frames.delete(id);if(!scope.signal.aborted)fn(t)});frames.add(id);return id};
const listen=(target,event,fn,options)=>{target.addEventListener(event,fn,options);listeners.push([target,event,fn,options])};
const unlisten=(target,event,fn,options)=>{target.removeEventListener(event,fn,options);const i=listeners.findIndex(x=>x[0]===target&&x[1]===event&&x[2]===fn);if(i>=0)listeners.splice(i,1)};
const $ = s => document.querySelector(s);
let online = false;   // есть ли связь с колонкой (см. «подключение» внизу)
const $$ = s => [...document.querySelectorAll(s)];
const icon = (id, size = 16) => `<svg width="${size}" height="${size}" aria-hidden="true"><use href="#${id}"/></svg>`;

function toast(msg, err = false) {
  const t = $('#toast');
  t.textContent = msg; t.className = 'show' + (err ? ' err' : '');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.className = '', err ? 5000 : Math.max(1800, msg.length * 55));
}

async function api(path, body, opts = {}) {
  const init = body === undefined ? {} : {
    method: 'POST',
    headers: opts.headers || { 'Content-Type': 'application/json' },
    body: opts.raw ? body : JSON.stringify(body),
  };
  const r = await PanelContext.fetch(path, {...init,signal:scope.signal});
  const data = await r.json().catch(() => ({ error: r.statusText }));
  if (!r.ok) {
    const e = new Error(data.error || r.statusText);
    // «нет связи» объяснит экран подключения — без тостов
    if (r.status === 401 && data.auth) { e.offline = true; connCheck(); throw e; }
    if (data.offline || /^(Колонка не ответила|Связь с колонкой потеряна)/.test(e.message)) { e.offline = true; connCheck(); }
    throw e;
  }
  return data;
}

async function act(btn, fn, okMsg) {
  if (btn) btn.disabled = true;
  try { const r = await fn(); if (okMsg) toast(okMsg); return r; }
  catch (e) { if (!e.offline) toast(e.message, true); }
  finally { if (btn) btn.disabled = false; }
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Скрытые значения (Device ID, IP, Wi‑Fi, логин): точки, по нажатию — значение, по повторному — снова точки.
// Приватный режим (по умолчанию включён) — защита для тех, кто скриншотит панель не глядя; выключается в «Настроить».
const revealed = new Set();
let privateOff = false;
const DOTS = '••••••••';
const secret = (key, v, dots = DOTS) => {
  if (!v) return '—';
  const on = privateOff || revealed.has(key);
  return `<button class="secret${on ? ' shown' : ''}" data-key="${key}" data-v="${esc(v)}" data-dots="${dots}" title="Показать / скрыть">${on ? esc(v) : dots}</button>`;
};
function applyPrivate() {
  $$('.secret').forEach(x => {
    const on = privateOff || revealed.has(x.dataset.key);
    x.textContent = on ? x.dataset.v : x.dataset.dots || DOTS;
    x.classList.toggle('shown', on);
  });
}
// Имя хоста и Bluetooth-имя колонки кончаются куском серийного номера (Yandex-Lite-gen2-NJ0C) — его и прячем.
const hostHtml = h => {
  const m = /^(.*[-_])([A-Za-z0-9]{4,})$/.exec(h || '');
  return m ? esc(m[1]) + secret('serial', m[2], '••••') : esc(h || '—');
};
listen(document, 'click', e => {
  const b = e.target.closest('.secret');
  if (!b) return;
  if (privateOff) return;
  revealed.has(b.dataset.key) ? revealed.delete(b.dataset.key) : revealed.add(b.dataset.key);
  applyPrivate();
});
const pctNum = v => Math.round(v / 255 * 100);
const pct = v => pctNum(v) + '%';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function splitUptime(s) {
  s = Math.floor(+s); const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
  if (d) return [d, `д ${h} ч`];
  if (h) return [h, `ч ${m} мин`];
  return [m, 'мин'];
}

// ---------- статус ----------
let volDragging = false, lastOk = 0, status = null, ymLogin = '';
async function refreshStatus() {
  try {
    const s = status = await api('/api/status');
    lastOk = Date.now();
    $('#conn').className = 'dot on';
    $('#conn-text').textContent = 'Подключено по adb';
    $('#conn-ip').innerHTML = secret('ip', s.ip_address);

    const temp = s.temp ? s.temp / 1000 : null;
    $('#st-temp').textContent = temp === null ? '—' : temp.toFixed(0);
    $('#st-temp-bar').style.width = temp === null ? '0' : clamp(temp / 85 * 100, 0, 100) + '%';

    const used = (s.mem_total - s.mem_avail) / 1024, total = s.mem_total / 1024;
    $('#st-mem').textContent = Math.round(used);
    $('#st-mem-u').textContent = `из ${Math.round(total)} МБ`;
    $('#st-mem-bar').style.width = (used / total * 100).toFixed(0) + '%';
    $('#st-mem-n').textContent = `свободно ${Math.round(s.mem_avail / 1024)} МБ`;

    const rssi = +s.RSSI;
    $('#st-rssi').textContent = s.RSSI ? String(rssi).replace('-', '−') : '—';
    $('#st-rssi-bar').style.width = s.RSSI ? clamp((rssi + 90) / 60 * 100, 0, 100) + '%' : '0';
    $('#st-wifi-n').innerHTML = [s.ssid && { html: secret('ssid', s.ssid) }, s.freq && (s.freq / 1000).toFixed(1).replace('.', ',') + ' ГГц', s.LINKSPEED && s.LINKSPEED + ' Мбит/с']
      .filter(Boolean).map(x => x.html ?? esc(x)).join(' · ') || '—';

    const [uv, uu] = splitUptime(s.uptime);
    $('#st-up').textContent = uv; $('#st-up-u').textContent = uu;
    const la = (s.load || '').split(' ');
    $('#st-load-bar').style.width = clamp(+la[0] / 4 * 100, 0, 100) + '%';
    $('#st-load-n').textContent = 'нагрузка ' + la.map(x => x.replace('.', ',')).join(' · ');

    if (!volDragging) {
      const [m, b] = [+s.vol_level || 0, +s.vol_bt || 0];
      showLevel(m);
      $('#vol-bt').value = b; $('#vol-bt-v').textContent = pct(b);
    }
    $('#ffmpeg-hint').textContent = s.ffmpeg ? 'FFmpeg найден — поддерживаются MP3, M4A/AAC, FLAC, OGG и WAV.' : 'Пока доступен WAV. Для MP3 и других форматов установи аудио-FFmpeg в Настройках.';


    window.__deviceColor = s.color;
    window.modelColor?.(s.color);
    $('#dev-info').innerHTML = [
      ['Quasar', s.quasar === 'running' ? 'работает' : 'остановлен'],
      ['Версия', s.quasar_version], ['Device ID', { html: secret('id', s.device_id) }], ['Хост', { html: hostHtml(s.hostname) }],
      ['Ядро', s.kernel], ['MAC', { html: secret('mac', s.address) }], ['Время', s.date],
    ].map(([k, v]) => `<dt>${k}</dt><dd>${v?.html ?? esc(v ?? '—')}</dd>`).join('');
    updateSub();
  } catch {}   // о потере связи расскажет экран подключения
}
function updateSub() {
  if (!status) return;
  const ago = Math.round((Date.now() - lastOk) / 1000);
  const ver = (status.quasar_version || '').split('.').slice(0, 4).join('.');
  const alive = status.quasar === 'running';
  $('#ov-sub').innerHTML = `<span class="dot ${alive ? 'on' : 'off'}" title="${alive ? 'Алиса работает' : 'Алиса остановлена'}" style="display:inline-block;margin-right:6px;vertical-align:1px"></span>`
    + hostHtml(status.hostname) + esc(` · Quasar ${ver} · ${ago} с назад`);
}
setInterval(updateSub, 1000);

// ---------- громкость ----------
// Динамик — в уровнях Алисы 0–10 (как на колонке), Bluetooth — сырой микшер 0–255.
function showLevel(level) {
  $('#vol-master').value = Math.round(level);
  $('#vol-big').textContent = Math.round(level);
}
let volTimer;
for (const [id, key] of [['#vol-master', 'level'], ['#vol-bt', 'bt']]) {
  const el = $(id);
  el.addEventListener('input', () => {
    volDragging = true;
    if (key === 'level') showLevel(+el.value);
    else $('#vol-bt-v').textContent = pct(el.value);
    clearTimeout(volTimer);
    volTimer = setTimeout(() => act(null, () => api('/api/volume', { [key]: +el.value })), 150);
  });
  el.addEventListener('change', () => setTimeout(() => volDragging = false, 1500));
}
$$('[data-level]').forEach(b => b.onclick = () => act(b, async () => {
  await api('/api/volume', { level: +b.dataset.level });
  showLevel(+b.dataset.level);
}));

// ---------- звуки ----------
let sounds = [], sndFolder = null;
const FOLDER_NAMES = { '': 'Корень', common: 'Общие', 'ru-RU': 'Русский', 'ar-EG': 'Арабский (Египет)', 'ar-SA': 'Арабский (Саудовская Аравия)', 'kk-KZ': 'Казахский' };
const folderOf = n => n.includes('/') ? n.slice(0, n.lastIndexOf('/')) : '';
function renderFolders() {
  const counts = {};
  sounds.forEach(n => counts[folderOf(n)] = (counts[folderOf(n)] || 0) + 1);
  const folders = Object.keys(counts).sort((a, b) => (a === 'common' ? -1 : b === 'common' ? 1 : a.localeCompare(b)));
  if (!folders.includes(sndFolder)) sndFolder = folders.includes(store.get('snd.folder')) ? store.get('snd.folder') : folders[0];
  $('#snd-folders').innerHTML = folders.map(f =>
    `<button data-f="${esc(f)}" class="${f === sndFolder ? 'active' : ''}" aria-pressed="${f === sndFolder}">${esc(FOLDER_NAMES[f] || f)}<span>${counts[f]}</span></button>`).join('');
  $$('#snd-folders button').forEach(b => b.onclick = () => { sndFolder = b.dataset.f; store.set('snd.folder', sndFolder); renderFolders(); renderSounds(); });
}
function renderSounds() {
  const f = $('#snd-filter').value.toLowerCase();
  // С поиском ищем по всем папкам и показываем папку рядом с именем.
  const list = f ? sounds.filter(n => n.toLowerCase().includes(f)) : sounds.filter(n => folderOf(n) === sndFolder);
  $('#snd-folders').style.opacity = f ? .5 : 1;
  $('#sounds').innerHTML = list.length ? list.map(n => {
    const base = n.slice(n.lastIndexOf('/') + 1);
    const m = base.match(/^(.*)\.([^.]+)$/) || [base, base, ''];
    const dir = folderOf(n);
    return `<div class="sound"><button class="play" data-s="${esc(n)}" aria-label="Проиграть ${esc(m[1])}">${icon('i-play', 14)}</button>
      <div class="nm" title="${esc(n)}">${esc(m[1])}</div><span class="ext">${f && dir ? esc(dir) + ' · ' : ''}${esc(m[2])}</span></div>`;
  }).join('') : '<div class="empty">Ничего не найдено</div>';
  $$('#sounds .play').forEach(b => b.onclick = () => act(b, () => api('/api/play', { name: b.dataset.s }), '▶ ' + b.dataset.s));
}
async function loadSounds() { sounds = await api('/api/sounds'); renderFolders(); renderSounds(); }
$('#snd-filter').oninput = renderSounds;
$('#stop-sound').onclick = e => act(e.currentTarget, () => api('/api/stop', {}), 'Остановлено');

async function uploadFile(f) {
  if (!f) return;
  toast('Загрузка ' + f.name + '…');
  await act(null, () => api('/api/upload', f, {
    raw: true, headers: { 'Content-Type': 'application/octet-stream', 'X-Filename': encodeURIComponent(f.name) },
  }), '▶ ' + f.name);
}
const drop = $('#drop');
drop.onclick = () => $('#file').click();
$('#file').onchange = e => { uploadFile(e.target.files[0]); e.target.value = ''; };
drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
drop.ondragleave = () => drop.classList.remove('over');
drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); uploadFile(e.dataTransfer.files[0]); };

// ---------- дисплей часов: модель и отрисовка ----------
// Кадр — 36 яркостей в порядке сервера: 4 позиции × сегменты A–H, затем DH, DL, DM, DEGREE.
const SEGS = 'ABCDEFGH';
const X_DEG = 32, X_DH = 33, X_DL = 34, X_DM = 35, NLED = 36;
const SEGMENTS = {
  '0': 'ABCDEF', '1': 'BC', '2': 'ABDEG', '3': 'ABCDG', '4': 'BCFG', '5': 'ACDFG', '6': 'ACDEFG', '7': 'ABC', '8': 'ABCDEFG', '9': 'ABCDFG',
  A: 'ABCEFG', B: 'CDEFG', C: 'ADEF', D: 'BCDEG', E: 'ADEFG', F: 'AEFG', G: 'ACDEF', H: 'BCEFG', I: 'EF', J: 'BCDE',
  L: 'DEF', N: 'CEG', O: 'CDEG', P: 'ABEFG', R: 'EG', S: 'ACDFG', T: 'DEFG', U: 'BCDEF', Y: 'BCDFG', '-': 'G', '_': 'D', ' ': '', '°': 'ABFG',
};
const blankFrame = () => new Array(NLED).fill(0);

function textToFrame(text, bright = 255, extras = {}) {
  const v = blankFrame();
  let pos = -1;
  for (const ch of String(text).toUpperCase()) {
    if (ch === ':') { v[X_DH] = v[X_DL] = bright; continue; }
    if (ch === '.') { if (pos >= 0) v[pos * 8 + 7] = bright; continue; }
    if (++pos > 3) break;
    for (const s of SEGMENTS[ch] ?? '') v[pos * 8 + SEGS.indexOf(s)] = bright;
  }
  if (extras.dh) v[X_DH] = bright;
  if (extras.dl) v[X_DL] = bright;
  if (extras.dm) v[X_DM] = bright;
  if (extras.degree) v[X_DEG] = bright;
  return v;
}

// Геометрия: цифра 56×96, толщина сегмента 10; между 2-й и 3-й цифрой — двоеточие и средняя точка.
const DIGIT_X = [0, 70, 172, 242];
function segShapes(x) {
  const t = 10, w = 56, h = 96, m = h / 2;
  return [
    ['A', `M${x + 6} 0h${w - 12}l-6 ${t}h${-(w - 24)}z`],
    ['B', `M${x + w} 6v${m - 9}l-${t} -5v${-(m - 21)}z`],
    ['C', `M${x + w} ${m + 3}v${m - 9}l-${t} -6v${-(m - 21)}z`],
    ['D', `M${x + 6} ${h}h${w - 12}l-6 -${t}h${-(w - 24)}z`],
    ['E', `M${x} ${m + 3}v${m - 9}l${t} -6v${-(m - 21)}z`],
    ['F', `M${x} 6v${m - 9}l${t} -5v${-(m - 21)}z`],
    ['G', `M${x + 4} ${m}l6 -${t / 2}h${w - 20}l6 ${t / 2}l-6 ${t / 2}h${-(w - 20)}z`],
  ];
}
function clockSVG(v, { thumb = false } = {}) {
  const lvl = i => v[i] / 255;
  const cls = i => v[i] > 0 ? 'seg-on' : 'seg-off';
  const op = i => v[i] > 0 ? ` fill-opacity="${(0.5 + 0.5 * lvl(i)).toFixed(2)}"` : '';   // горящий сегмент заметно ярче погасшего
  let s = `<svg viewBox="-4 -4 340 112" role="img" aria-label="Дисплей часов">`;
  DIGIT_X.forEach((x, p) => {
    for (const [seg, d] of segShapes(x)) {
      const i = p * 8 + SEGS.indexOf(seg);
      s += `<path d="${d}" class="${cls(i)}"${op(i)} data-i="${i}"/>`;
    }
    const i = p * 8 + 7;
    s += `<circle cx="${x + 28}" cy="36" r="4.5" class="${cls(i)}"${op(i)} data-i="${i}"/>`;   // точка H — чуть выше центра цифры
  });
  [[X_DH, 30], [X_DL, 66]].forEach(([i, y]) =>
    s += `<circle cx="146" cy="${y}" r="6" class="${cls(i)}"${op(i)} data-i="${i}"/>`);
  s += `<rect x="137" y="45" width="18" height="6" rx="2" class="${cls(X_DM)}"${op(X_DM)} data-i="${X_DM}"/>`;   // дефис
  const di = X_DEG;
  s += `<circle cx="318" cy="10" r="7" stroke-width="4" class="${v[di] > 0 ? 'deg-on' : 'deg-off'}"${v[di] > 0 ? ` stroke-opacity="${Math.max(.18, lvl(di)).toFixed(2)}"` : ''} data-i="${di}"/>`;
  if (!thumb) s += `<circle cx="318" cy="10" r="11" fill="transparent" data-i="${di}"/>`;
  return s + '</svg>';
}

// Геометрия дисплея и вывод на 3D-модель (модуль модели подключается отдельно и задаёт window.modelShow).
window.clockGeom = { segShapes, DIGIT_X, SEGS, X_DH, X_DL, X_DM, X_DEG };
const toModel = v => window.modelShow?.(v);
const toRing = leds => window.modelRing?.(leds);

// Проигрывание кадров в браузере (предпросмотр); флаг 1 у кадра — начало цикла.
function animate(el, frames, { seconds = 10, onFrame } = {}) {
  clearTimeout(el._anim);
  if (!frames.length) return;
  const until = el._until = Date.now() + seconds * 1000;
  const loopAt = frames.findIndex(f => f.flag);
  let i = 0;
  const step = () => {
    if (Date.now() > until) return el._animDone?.();
    if (i >= frames.length) {
      if (loopAt < 0) return el._animDone?.();
      i = loopAt;
    }
    el.innerHTML = clockSVG(frames[i].v);
    if (el.id === 'clock-preview') toModel(frames[i].v);
    onFrame?.(i);
    el._anim = setTimeout(step, Math.max(16, frames[i++].ms));
  };
  step();
}

// ---------- анимации ----------
let patterns = {}, patKind = 'ring';
// Человекочитаемые названия анимаций; системное имя остаётся сбоку.
const PAT_NAMES = {
  alice_listening: 'Алиса слушает', alice_speaking: 'Алиса говорит', alice_thinking: 'Алиса думает',
  alice_pro_listening: 'Алиса Про слушает', alice_pro_speaking: 'Алиса Про говорит', alice_pro_thinking: 'Алиса Про думает',
  intonation_spotting: 'Распознала интонацию',
  player_continue: 'Продолжить', player_pause: 'Пауза', player_next_track: 'Следующий трек', player_previous_track: 'Предыдущий трек',
  volume: 'Громкость', bluetooth_on: 'Bluetooth включён', bluetooth_connected: 'Bluetooth подключён', bluetooth_playing: 'Музыка по Bluetooth',
  call_incoming: 'Входящий звонок', call_outgoing: 'Исходящий звонок', call_connecting: 'Соединяю', call_connected: 'Разговор',
  call_connected_nanny: 'Разговор (радионяня)', call_ended: 'Звонок завершён', ringing: 'Звонок',
  timer: 'Таймер', notification_available: 'Есть уведомление', notification_passive: 'Тихое уведомление',
  iot_discovery: 'Поиск устройств умного дома', boot: 'Загрузка', configure: 'Настройка', configuring: 'Настройка',
  connecting_to_network: 'Подключение к сети', clock_sync_1: 'Синхронизация часов 1', clock_sync_2: 'Синхронизация часов 2',
  update_downloading: 'Скачивание обновления', update_applying: 'Установка обновления', confirm_data_reset: 'Подтвердите сброс',
  error: 'Ошибка', progress: 'Прогресс', soundinit: 'Инициализация звука', qc: 'Заводской тест',
  battery_cold: 'Батарея замёрзла', battery_hot: 'Батарея перегрелась', low_battery: 'Низкий заряд', blink: 'Моргание',
};
const PAT_GROUPS = [
  ['Алиса', /^(alice_|intonation)/], ['Плеер и звук', /^(player_|volume|bluetooth_)/], ['Звонки', /^(call_|ringing)/],
  ['Уведомления и таймер', /^(timer|notification_|iot_)/], ['Система', /^(boot|configur|connecting|clock_sync|update_|confirm_|error|progress|soundinit|qc|battery_|low_battery)/],
];
const patBase = n => n.replace(/\.(bin)?s?cled(\.zst)?$|\.led$/, '');
function renderPatterns() {
  const list = patterns[patKind] || [];
  const groups = PAT_GROUPS.map(([title, re]) => [title, list.filter(n => re.test(patBase(n)))]);
  const rest = list.filter(n => !PAT_GROUPS.some(([, re]) => re.test(patBase(n))));
  if (rest.length) groups.push(['Прочее', rest]);
  $('#patterns').innerHTML = groups.filter(([, items]) => items.length).map(([title, items]) =>
    `<div class="pat-group">${esc(title)}</div>` + items.map(n => {
      const base = patBase(n);
      return `<button class="pat" data-p="${esc(n)}"><span class="pat-play">${icon('i-play', 11)}</span>
        <span class="pat-name">${esc(PAT_NAMES[base] || base.replace(/_/g, ' '))}</span><span class="pat-sys">${esc(base)}</span></button>`;
    }).join('')).join('');
  $$('#patterns .pat').forEach(b => b.onclick = () => act(b, async () => {
    const seconds = +$('#pat-sec').value || 5;
    await api('/api/pattern', { kind: patKind, name: b.dataset.p, seconds });
    if (patKind === 'ring') animateRing(await api('/api/ring/frames?name=' + encodeURIComponent(b.dataset.p)), seconds);
    if (patKind === 'clock') {
      const frames = await api('/api/clock/frames?name=' + encodeURIComponent(b.dataset.p));
      const el = $('#clock-preview');
      el._animDone = clockPreview;
      animate(el, frames, { seconds });
    }
  }, '✦ ' + b.querySelector('.pat-name').textContent));
}
$$('#pat-kind button').forEach(b => b.onclick = () => {
  $$('#pat-kind button').forEach(x => x.classList.toggle('active', x === b));
  patKind = b.dataset.k; renderPatterns();
});
$('#pat-stop').onclick = e => act(e.currentTarget, async () => {
  await api('/api/pattern/stop', {});
  clearTimeout($('#clock-preview')._anim); clockPreview();
  clearTimeout(ringTimer); ringAnimUntil = 0;
}, 'Анимации остановлены');

// ---------- кольцо ----------
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
let ringHex = '#6C47FF';
function pickColor(hex) {
  ringHex = hex.toUpperCase();
  $('#ring-preview').style.setProperty('--ring', ringHex);
  $$('#swatches .sw').forEach(s => s.classList.toggle('sel', s.dataset.hex === ringHex));
}
const setRing = (btn, rgb, on) => act(btn, async () => {
  await api('/api/ring', { red: rgb[0], green: rgb[1], blue: rgb[2] });
  $('#ring-preview').classList.toggle('off', !on);
  toRing([rgb, rgb, rgb]);
});
$$('#swatches .sw').forEach(b => b.onclick = () => { pickColor(b.dataset.hex); setRing(b, hex2rgb(ringHex), true); });
$('#ring-color').oninput = e => pickColor(e.target.value);
$('#ring-color').onchange = e => setRing(null, hex2rgb(e.target.value), true);
$('#ring-set').onclick = e => setRing(e.currentTarget, hex2rgb(ringHex), true);
$('#ring-off').onclick = e => setRing(e.currentTarget, [0, 0, 0], false);
$('#ring-reset').onclick = e => act(e.currentTarget, async () => {
  const r = await api('/api/ring/reset', {});
  toRing(r.leds);
  $('#ring-preview').classList.toggle('off', r.leds.every(c => c.every(x => !x)));
}, 'Кольцо снова у Алисы');
pickColor(ringHex);

// ---------- часы: режимы и закрепление ----------
// «Закрепить» запускает на колонке скрипт, который сам перерисовывает дисплей раз в полсекунды
// (Quasar обновляет часы раз в минуту и иначе затирает наш вывод). «Один раз» — просто запись.
const pad2 = n => String(n).padStart(2, '0');
const pcTime = () => { const d = new Date(); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); };
const clockExtras = () => ({ dh: $('#x-dh').checked, dl: $('#x-dl').checked, dm: $('#x-dm').checked, degree: $('#x-degree').checked });
let dispMode = 'text', dispState = { mode: null }, dispStateAt = 0;
const DISP_NAMES = { frame: 'текст', date: 'дата', temp: 'температура', timer: 'таймер' };
function timerSeconds() {
  const m = ($('#timer-val').value || '').match(/^(\d{1,2})(?::(\d{1,2}))?$/);
  return m ? (+m[1]) * 60 + (+(m[2] || 0)) : 0;
}
function clockFrame() {
  const br = +$('#clock-br').value;
  if (dispMode === 'date') {   // 24.10 — разделитель как у колонки: нижняя точка двоеточия
    const d = new Date(), v = textToFrame(`${pad2(d.getDate())}${pad2(d.getMonth() + 1)}`, br);
    v[X_DL] = br;
    return v;
  }
  if (dispMode === 'temp') return textToFrame(String(Math.round((status?.temp || 0) / 1000)).padStart(4, ' '), br, { degree: true });
  if (dispMode === 'timer') { const s = timerSeconds(); return textToFrame(`${pad2(Math.min(99, Math.floor(s / 60)))}:${pad2(s % 60)}`, br); }
  return textToFrame($('#clock-text').value || pcTime(), br, clockExtras());
}
function clockPreview() { const el = $('#clock-preview'); clearTimeout(el._anim); el._until = 0; el.innerHTML = clockSVG(clockFrame()); }
['#clock-text', '#x-dh', '#x-dl', '#x-dm', '#x-degree', '#timer-val'].forEach(s => $(s).addEventListener('input', clockPreview));
$('#clock-br').oninput = e => { $('#clock-br-v').textContent = e.target.value; clockPreview(); };
$$('#disp-mode button').forEach(b => b.onclick = () => {
  dispMode = b.dataset.m;
  $$('#disp-mode button').forEach(x => x.classList.toggle('active', x === b));
  $('#dm-text').hidden = dispMode !== 'text';
  $('#dm-timer').hidden = dispMode !== 'timer';
  $('#clock-set').hidden = dispMode !== 'text';
  $('#disp-pin').textContent = dispMode === 'timer' ? 'Запустить таймер' : 'Закрепить';
  clockPreview();
});
$$('#dm-timer [data-t]').forEach(b => b.onclick = () => { const s = +b.dataset.t; $('#timer-val').value = `${pad2(s / 60 | 0)}:${pad2(s % 60)}`; clockPreview(); });

function renderDispState() {
  const st = dispState, on = !!st.mode;
  $('#disp-badge').hidden = !on;
  if (!on) return;
  let text = 'закреплено: ' + (DISP_NAMES[st.mode] || st.mode);
  if (st.mode === 'timer' && st.left != null) {
    const left = Math.max(0, st.left - Math.round((Date.now() - dispStateAt) / 1000));
    text = `таймер ${pad2(left / 60 | 0)}:${pad2(left % 60)}`;
  }
  $('#disp-badge').textContent = text;
  $('#disp-badge').className = 'badge ok';
}
async function loadDispState() {
  if (document.hidden || $('#tab-overview').hidden) return;
  try { dispState = await api('/api/display'); dispStateAt = Date.now(); renderDispState(); } catch {}
}
setInterval(loadDispState, 5000);
setInterval(() => dispState.mode === 'timer' && renderDispState(), 1000);

$('#disp-pin').onclick = e => act(e.currentTarget, async () => {
  const body = { mode: dispMode === 'text' ? 'frame' : dispMode, brightness: +$('#clock-br').value };
  if (dispMode === 'text') body.v = clockFrame();
  if (dispMode === 'timer') {
    body.seconds = timerSeconds();
    if (!body.seconds) throw new Error('Время таймера — в виде мм:сс, например 05:00');
  }
  dispState = await api('/api/display', body);
  dispStateAt = Date.now();
  renderDispState();
}, dispMode === 'timer' ? 'Таймер запущен' : 'Закреплено');
$('#disp-stop').onclick = e => act(e.currentTarget, async () => {
  dispState = await api('/api/display/stop', {});
  await api('/api/pattern/stop', {}).catch(() => {});   // и анимацию часов, если идёт
  renderDispState();
  $('#clock-text').value = '';
  clockPreview();
}, 'Дисплей снова показывает часы');
function sendClock(btn) {
  const text = $('#clock-text').value || pcTime();
  clockPreview();
  return act(btn, async () => { await api('/api/clock', { v: clockFrame() }); toModel(clockFrame()); dispState = { mode: null }; renderDispState(); },
             'На дисплее: ' + text);
}
$('#clock-set').onclick = e => sendClock(e.currentTarget);
$('#clock-text').onkeydown = e => { if (e.key === 'Enter') sendClock(null); };
clockPreview();
setInterval(() => (dispMode !== 'text' || !$('#clock-text').value) && Date.now() > ($('#clock-preview')._until || 0) && clockPreview(), 15000);

// Живое состояние дисплея и кольца для модели, пока «Обзор» на экране. Локальные анимации
// (запущенные из панели) рисуются по кадрам сами, опрос их не перебивает.
let ringAnimUntil = 0, ringLit = false, ringTimer;
async function pollLeds() {
  try {
    if (!document.hidden && !$('#tab-overview').hidden) {
      const s = await api('/api/clock/state');
      if (Date.now() >= ($('#clock-preview')._until || 0)) toModel(s.v);
      if (Date.now() >= ringAnimUntil) toRing(s.ring);
      ringLit = s.ring.some(c => c.some(x => x > 0));
    }
  } catch {}
  setTimeout(pollLeds, ringLit ? 400 : 1500);   // пока кольцо светится (например, Алиса слушает), чаще
}
pollLeds();
// Быстрый поток — только пока «Обзор» на экране, визуализатор включён и музыка играет.
// Пока играет музыка, Quasar рисует на часах эквалайзер: 4 цифры — 4 полосы, в каждой столбик из D, G, A.
const isSpectrum = v => [0, 1, 2, 3].every(p => !v[p * 8 + 1] && !v[p * 8 + 2] && !v[p * 8 + 4] && !v[p * 8 + 5] && !v[p * 8 + 7])
  && !v[X_DEG] && !v[X_DH] && !v[X_DL] && !v[X_DM];
async function liveLeds() {
  const want = online && !document.hidden && !$('#tab-overview').hidden && !window.__vizOff && !!muState()?.playing;
  if (want) {
    try {
      const r = await api('/api/leds/live');
      if (r.v) {
        const v = r.v;
        if (isSpectrum(v)) window.__spectrum = { bands: [0, 1, 2, 3].map(p => (v[p * 8] + v[p * 8 + 3] + v[p * 8 + 6]) / 756), t: performance.now() };
        if (Date.now() >= ($('#clock-preview')._until || 0)) toModel(v);
        if (Date.now() >= ringAnimUntil) toRing(r.ring);
      }
    } catch {}
  }
  // Эквалайзер Quasar держит на часах ~15 с после старта трека, потом снова часы: пока он есть — 10 раз
  // в секунду, без него — реже, только чтобы не пропустить следующий.
  const spectrumNow = window.__spectrum && performance.now() - window.__spectrum.t < 2500;
  setTimeout(liveLeds, want ? (spectrumNow ? 100 : 700) : 500);
}
setTimeout(liveLeds, 1000);   // первый запуск — когда весь скрипт уже загружен
function animateRing({ frames, loop }, seconds) {
  clearTimeout(ringTimer);
  if (!frames.length) return;
  const until = ringAnimUntil = Date.now() + seconds * 1000;
  let i = 0;
  const step = () => {
    if (Date.now() > until) { ringAnimUntil = 0; return; }
    if (i >= frames.length) {
      if (!loop) { ringAnimUntil = 0; return; }
      i = 0;
    }
    toRing(frames[i].c);
    ringTimer = setTimeout(step, Math.max(16, frames[i++].ms));
  };
  step();
}

// ---------- заставка при загрузке ----------
const boot = { frames: [], sel: 0, def: [], status: null };
const bootCur = () => boot.frames[boot.sel];
// Пустой первый кадр — это пауза перед заставкой: показываем её отдельным полем, а не кадром.
function setBootFrames(frames) {
  frames = structuredClone(frames || []);
  const lead = frames[0] && frames[0].v.every(x => x === 0) ? frames.shift().ms : 0;
  $('#boot-pause').value = lead;
  boot.frames = frames; boot.sel = 0;
  checkPause();
}
function bootFull() {
  const pause = clamp(+$('#boot-pause').value || 0, 0, 65535);
  return pause ? [{ flag: 0, v: blankFrame(), ms: pause }, ...boot.frames] : boot.frames;
}
function checkPause() {
  const short = (+$('#boot-pause').value || 0) < 3000;
  $('#boot-pause-hint').style.color = short ? 'var(--danger)' : '';
}
$('#boot-pause').oninput = checkPause;
async function uploadBootSound(f) {
  if (!f) return;
  toast('Перекодирую и устанавливаю ' + f.name + '…');
  await act($('#bs-drop'), async () => {
    boot.status = await api('/api/boot/sound', f, { raw: true, headers: { 'Content-Type': 'application/octet-stream', 'X-Filename': encodeURIComponent(f.name) } });
    renderBootStatus();
  }, 'Звук запуска заменён');
}
const bsDrop = $('#bs-drop');
bsDrop.onclick = () => $('#bs-file').click();
$('#bs-file').onchange = e => { uploadBootSound(e.target.files[0]); e.target.value = ''; };
bsDrop.ondragover = e => { e.preventDefault(); bsDrop.classList.add('over'); };
bsDrop.ondragleave = () => bsDrop.classList.remove('over');
bsDrop.ondrop = e => { e.preventDefault(); bsDrop.classList.remove('over'); uploadBootSound(e.dataTransfer.files[0]); };
$('#bs-play-default').onclick = e => act(e.currentTarget, () => api('/api/boot/sound/play', { which: 'default' }), '▶ стандартный звук запуска');
$('#bs-play-custom').onclick = e => act(e.currentTarget, () => api('/api/boot/sound/play', { which: 'custom' }), '▶ свой звук запуска');
$('#bs-stop').onclick = e => act(e.currentTarget, () => api('/api/stop', {}));
$('#bs-reset').onclick = e => confirm('Вернуть стандартный звук запуска?') &&
  act(e.currentTarget, async () => { boot.status = await api('/api/boot/sound/reset', {}); renderBootStatus(); }, 'Стандартный звук восстановлен');
$('#boot-always').onchange = e => act(e.target, async () => {
  try { boot.status = await api('/api/clock/boot/always', { enabled: e.target.checked }); }
  finally { renderBootStatus(); }
}, e.target.checked ? 'Заставка и звук будут при каждой загрузке' : 'Заставка и звук — только когда Quasar сам решит');
function renderBoot() {
  if (!boot.frames.length) boot.frames = [{ flag: 0, v: blankFrame(), ms: 1000 }];
  boot.sel = clamp(boot.sel, 0, boot.frames.length - 1);
  $('#boot-frames').innerHTML = boot.frames.map((f, i) =>
    `<button class="frame-thumb ${i === boot.sel ? 'sel' : ''}" data-k="${i}" aria-label="Кадр ${i + 1}">${clockSVG(f.v, { thumb: true })}<span>${i + 1} · ${f.ms} мс</span></button>`).join('')
    + `<button class="frame-add" id="boot-add" aria-label="Добавить кадр">${icon('i-plus', 18)}</button>`;
  $$('#boot-frames .frame-thumb').forEach(b => b.onclick = () => { boot.sel = +b.dataset.k; renderBoot(); });
  $('#boot-add').onclick = () => { boot.frames.splice(boot.sel + 1, 0, { flag: 0, v: blankFrame(), ms: 500 }); boot.sel++; renderBoot(); };
  $('#boot-editor').innerHTML = clockSVG(bootCur().v);
  $('#boot-ms').value = bootCur().ms;
}
function renderBootStatus() {
  const s = boot.status;
  if (!s) return;
  $('#boot-always').checked = !!s.always;
  $('#boot-hook-badge').textContent = s.hook ? 'хук подключён' : 'хук не нужен';
  $('#boot-hook-badge').className = 'badge' + (s.hook ? ' ok' : '');
  $('#snd-badge').textContent = !s.sound_supported ? 'не поддерживается' : s.sound_custom ? 'свой' : 'стандартный';
  $('#snd-badge').className = 'badge' + (s.sound_custom ? ' ok' : '');
  $('#bs-play-custom').disabled = !s.sound_custom;
  $('#bs-reset').disabled = !s.sound_custom;
  if (!s.supported) { $('#boot-status').innerHTML = '<span class="badge bad">прошивка не поддерживается</span>'; return; }
  $('#boot-status').innerHTML = s.custom
    ? `<span class="badge ok">своя</span>${s.mounted ? '' : '<span class="badge bad">не подменена</span>'}`
    : '<span class="badge">стандартная</span>';
}
async function loadBoot() {
  try {
    boot.status = await api('/api/clock/boot');
    boot.def = boot.status.default || [];
    setBootFrames(boot.status.frames || boot.def);
    renderBootStatus(); renderBoot();
  } catch (e) { $('#boot-status').innerHTML = `<span class="badge bad">${esc(e.message)}</span>`; }
}
$('#boot-editor').onclick = e => {
  const i = e.target.closest('[data-i]')?.dataset.i;
  if (i === undefined) return;
  const v = bootCur().v;
  v[i] = v[i] > 0 ? 0 : 255;
  renderBoot();
};
$('#boot-ms').onchange = e => { bootCur().ms = clamp(+e.target.value || 100, 10, 65535); renderBoot(); };
const applyBootText = () => { bootCur().v = textToFrame($('#boot-text').value); renderBoot(); };
$('#boot-text-apply').onclick = applyBootText;
$('#boot-text').onkeydown = e => { if (e.key === 'Enter') applyBootText(); };
$('#boot-dup').onclick = () => { boot.frames.splice(boot.sel + 1, 0, structuredClone(bootCur())); boot.sel++; renderBoot(); };
$('#boot-clear').onclick = () => { bootCur().v = blankFrame(); renderBoot(); };
$('#boot-del').onclick = () => { boot.frames.splice(boot.sel, 1); renderBoot(); };
const moveFrame = d => {
  const j = boot.sel + d;
  if (j < 0 || j >= boot.frames.length) return;
  [boot.frames[boot.sel], boot.frames[j]] = [boot.frames[j], boot.frames[boot.sel]];
  boot.sel = j; renderBoot();
};
$('#boot-left').onclick = () => moveFrame(-1);
$('#boot-right').onclick = () => moveFrame(1);
const bootDuration = () => Math.ceil(bootFull().reduce((a, f) => a + f.ms, 0) / 1000) + 1;
$('#boot-preview').onclick = () => {
  const el = $('#boot-editor');
  el._animDone = renderBoot;
  const off = bootFull().length - boot.frames.length; // кадр паузы не подсвечиваем
  animate(el, bootFull(), { seconds: bootDuration(), onFrame: i => $$('#boot-frames .frame-thumb').forEach((b, k) => b.classList.toggle('sel', k === i - off)) });
};
$('#boot-device').onclick = e => act(e.currentTarget, () => api('/api/clock/play', { frames: bootFull(), seconds: bootDuration() }), 'Заставка играет на колонке');
$('#boot-load-default').onclick = () => {
  if (!boot.def.length) return toast('Стандартная заставка недоступна', true);
  setBootFrames(boot.def); renderBoot();
};
$('#boot-install').onclick = e => confirm('Установить эту заставку на загрузку колонки?') &&
  act(e.currentTarget, async () => { boot.status = await api('/api/clock/boot', { frames: bootFull() }); renderBootStatus(); }, 'Заставка установлена — покажется при следующей загрузке');
$('#boot-reset').onclick = e => confirm('Вернуть стандартную заставку часов?') &&
  act(e.currentTarget, async () => { await api('/api/clock/boot/reset', {}); await loadBoot(); }, 'Стандартная заставка восстановлена');

// ---------- bluetooth ----------

// Виджет Bluetooth: сопряжённые устройства, видимость с таймером. Опрашиваем, только пока виден «Обзор».
let btData = null, btTimer;
const BT_ICONS = { phone: 'i-bt', 'audio-card': 'i-vol', 'audio-headset': 'i-vol', 'audio-headphones': 'i-vol', computer: 'i-term' };
async function loadBt() {
  clearTimeout(btTimer);
  if (!online || document.hidden || $('#tab-overview').hidden || $('[data-widget="bt"]').closest('#wz-hidden')) {
    btTimer = setTimeout(loadBt, 3000); return;
  }
  try { btData = await api('/api/bt'); renderBt(); } catch (e) { if (!e.offline) $('#bt-list').innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
  btTimer = setTimeout(loadBt, btData?.pair_until ? 2000 : 5000);
}
function btLeft() {
  const left = btData?.pair_until ? Math.max(0, Math.round(btData.pair_until - Date.now() / 1000)) : 0;
  $('#bt-pair-left').hidden = !left;
  $('#bt-pair-left').textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
}
setInterval(() => btData?.pair_until && btLeft(), 1000);
function renderBt() {
  const d = btData, conn = d.devices.filter(x => x.connected), vis = d.discoverable;
  $('#bt-badge').textContent = !d.powered ? 'выключен' : conn.length ? 'подключено' : 'включён';
  $('#bt-badge').className = 'badge' + (d.powered ? ' ok' : '');
  $('.bt-pair').classList.toggle('on', vis);
  $('#bt-pair-text').textContent = vis ? 'Колонка видна' : 'Колонка скрыта';
  $('#bt-pair-hint').innerHTML = vis ? `Выберите «${d.alias ? hostHtml(d.alias) : 'колонку'}» в настройках Bluetooth телефона`
    : `Чтобы подключить новое устройство, сделайте её видимой на 3 минуты`;
  $('#bt-pair-btn').textContent = vis ? 'Скрыть' : 'Сделать видимой';
  $('#bt-pair-btn').classList.toggle('primary', !vis);
  btLeft();
  $('#bt-list').innerHTML = d.devices.length ? d.devices.map(x => `<div class="bt-row${x.connected ? ' on' : ''}" data-mac="${esc(x.mac)}">
      <div class="bt-ic">${icon(BT_ICONS[x.icon] || 'i-bt', 18)}</div>
      <div class="info"><b>${x.name ? secret('btn-' + x.mac, x.name) : 'Без имени'}</b>
        <span class="meta">${[x.connected ? 'подключено' : 'сопряжено', x.battery != null ? `батарея ${x.battery}%` : ''].filter(Boolean).join(' · ')} · ${secret('bt-' + x.mac, x.mac)}</span></div>
      <div class="actions">${x.connected ? '<button class="btn sm" data-bta="disconnect">Отключить</button>' : '<button class="btn sm" data-bta="connect">Подключить</button>'}
        <button class="btn sm ghost" data-bta="remove" title="Забыть устройство" aria-label="Забыть устройство">${icon('i-trash', 16)}</button></div></div>`).join('')
    : '<div class="empty">Сопряжённых устройств нет</div>';
}
const btDo = (btn, body, msg) => act(btn, async () => { btData = await api('/api/bt', body); renderBt(); }, msg);
$('#bt-pair-btn').onclick = e => btDo(e.currentTarget, { action: btData?.discoverable ? 'pair_off' : 'pair_on' },
  btData?.discoverable ? 'Колонка скрыта' : 'Колонка видна 3 минуты');
$('#bt-list').onclick = e => {
  const b = e.target.closest('[data-bta]'); if (!b) return;
  const row = b.closest('.bt-row'), dev = btData.devices.find(x => x.mac === row.dataset.mac), a = b.dataset.bta;
  if (a === 'remove' && !confirm(`Забыть «${dev?.name || dev?.mac}»? Чтобы подключиться снова, понадобится новое сопряжение.`)) return;
  if (a === 'connect') toast('Подключаемся… устройство должно быть рядом и с включённым Bluetooth');
  btDo(b, { action: a, mac: row.dataset.mac }, { connect: 'Подключено', disconnect: 'Отключено', remove: 'Устройство забыто' }[a]);
};
loadBt();

// ---------- система ----------
$('#q-restart').onclick = e => confirm('Перезапустить Quasar? Алиса будет недоступна ~30 с.') &&
  act(e.currentTarget, () => api('/api/system', { action: 'quasar_restart' }), 'Quasar перезапускается…');
$('#reboot').onclick = e => confirm('Перезагрузить колонку?') &&
  act(e.currentTarget, () => api('/api/system', { action: 'reboot' }), 'Перезагрузка…');

// ---------- логи ----------
let logText = '';
// В логах Quasar — Device ID, номер аккаунта, сеть: для скриншотов прячем всё, что известно о колонке и аккаунте.
function maskLog(t) {
  const st = status || {}, serial = /[-_]([A-Za-z0-9]{4,})$/.exec(st.hostname || '')?.[1];
  // номер аккаунта Яндекса встречается в разном виде (uid: …, id=…, Account …) — находим и прячем везде
  const uids = new Set([...t.matchAll(/(?:passport_uid|puid|uid)"?\s*[:=]\s*"?(\d{5,})/gi)].map(m => m[1]));
  for (const v of [st.device_id, st.ssid, st.address, ymLogin, serial, ...uids].filter(v => v && v.length >= 4))
    t = t.split(v).join('••••');
  return t.replace(/\b(?:y0_|AQAAAA)[\w-]{10,}/g, '••••')                           // OAuth-токены
    .replace(/(token["']?\s*[:=]\s*["']?)[\w.-]{20,}/gi, '$1••••')
    .replace(/(\b[Aa]ccount[ :=]+)\d{5,}/g, '$1••••')
    .replace(/("wifi_hash"\s*:\s*")[0-9a-f]+/g, '$1••••')
    // MAC роутера (BSSID) находится в открытых базах точек Wi‑Fi — по нему можно узнать адрес
    .replace(/\b[0-9a-f]{2}(?::[0-9a-f]{2}){5}\b/gi, '••:••:••:••:••:••');
}
function renderLog() {
  const f = $('#log-filter').value.toLowerCase();
  const out = $('#log-out');
  const atBottom = out.scrollTop + out.clientHeight >= out.scrollHeight - 20;
  const text = $('#log-mask').checked ? maskLog(logText) : logText;
  out.textContent = f ? text.split('\n').filter(l => l.toLowerCase().includes(f)).join('\n') : text;
  if (atBottom) out.scrollTop = out.scrollHeight;
}
async function loadLog(btn) {
  const r = await act(btn, () => api(`/api/log?name=${encodeURIComponent($('#log-name').value)}&lines=${$('#log-lines').value}`));
  if (r) { logText = r.text; renderLog(); }
}
$('#log-load').onclick = e => loadLog(e.currentTarget);
$('#log-name').onchange = () => { $('#log-out').scrollTop = 1e9; loadLog(); };
$('#log-lines').onchange = () => loadLog();
$('#log-filter').oninput = renderLog;
$('#log-mask').onchange = renderLog;
setInterval(() => $('#log-follow').checked && !$('#tab-logs').hidden && loadLog(), 3000);

// ---------- консоль ----------
// xterm.js ↔ WebSocket /api/term ↔ adb shell с псевдотерминалом на сервере. Сеанс живёт, пока открыта страница.
let term = null, termFit = null, termWs = null;
// Буфер обмена: navigator.clipboard есть только на HTTPS и localhost, иначе — старый execCommand через textarea.
async function copyText(text) {
  try { if (navigator.clipboard && isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch {}
  const ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.append(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch {}
  ta.remove();
  term?.focus();
  return ok;
}
function termState(text, ok) { $('#term-state').textContent = text; $('#term-state').className = 'badge' + (ok ? ' ok' : ''); }
function termInit() {
  if (term) return true;
  if (!window.Terminal||!window.FitAddon) { $('#term').textContent=document.readyState==='loading'?'Загрузка терминала…':'Не загрузился xterm.js'; return false; }
  $('#term').textContent='';
  term = new Terminal({
    fontFamily: "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace", fontSize: 13, lineHeight: 1.2,
    cursorBlink: true, scrollback: 5000, allowProposedApi: false,
    theme: { background: '#111116', foreground: '#E6E6EB', cursor: '#A78BFA', selectionBackground: '#6C47FF66',
             black: '#16161D', brightBlack: '#5F5F6E' },
  });
  termFit = new FitAddon.FitAddon();
  term.loadAddon(termFit);
  term.open($('#term'));
  // Копирование как в обычных терминалах: выделил мышью — уже в буфере; Ctrl+C при выделении — копировать
  // (без выделения — прервать команду), Ctrl+Shift+C — копировать.
  const copySel = () => {
    const text = term.getSelection();
    if (!text) return false;
    copyText(text).then(ok => ok && toast('Скопировано'));
    return true;
  };
  $('#term').addEventListener('mouseup', () => setTimeout(copySel, 0));
  term.attachCustomKeyEventHandler(e => {
    if (e.type !== 'keydown' || !e.ctrlKey || e.altKey || e.code !== 'KeyC') return true;
    if (e.shiftKey || term.hasSelection()) { copySel(); term.clearSelection(); e.preventDefault(); return false; }
    return true;
  });
  term.onData(d => {
    if (termWs?.readyState === 1) termWs.send(JSON.stringify({ t: 'i', d }));
    else if (d === '\r') termConnect();          // сеанс закрыт — Enter открывает новый
  });
  term.onResize(({ cols, rows }) => termWs?.readyState === 1 && termWs.send(JSON.stringify({ t: 'r', c: cols, r: rows })));
  new ResizeObserver(() => { if (shownTab === 'console') try { termFit.fit(); } catch {} }).observe($('#term'));
  return true;
}
function termConnect() {
  if (!termInit() || termWs) return;
  try { termFit.fit(); } catch {}
  termState('подключение…');
  const ws = new WebSocket(PanelContext.websocket(`/api/term?cols=${term.cols}&rows=${term.rows}`));
  ws.binaryType = 'arraybuffer';
  termWs = ws;
  ws.onopen = () => { termState('подключено', true); term.focus(); };
  ws.onmessage = e => term.write(new Uint8Array(e.data));
  ws.onclose = () => {
    if (termWs !== ws) return;
    termWs = null;
    termState('закрыт');
    term.write('\r\n\x1b[90m[сеанс закрыт — Enter, чтобы открыть новый]\x1b[0m\r\n');
  };
}
$('#term-new').onclick = () => {
  if (termWs) { const old = termWs; termWs = null; old.close(); }
  termInit() && term.reset();
  termConnect();
};

// ---------- вкладки ----------
const store = {
  get: k => { try { return localStorage.getItem(PanelContext.storageKey(k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(PanelContext.storageKey(k), v); } catch {} },
};
let bootLoaded = false;
let logsLoaded = false;
let shownTab = null;
function showTab() {
  const tab = context.active();
  shownTab = tab;
  if (!online) {
    if (tab === 'settings') { loadAccess(); loadPanelVersion().catch(() => {}); loadPanelModel(); }
    return;
  }
  if (tab === 'files' && !fs.loaded) fsOpen(store.get('fs.cwd') || '/data/quasar');
  if (tab === 'logs' && !logsLoaded) {
    logsLoaded = true;
    api('/api/logs').then(l => {
      $('#log-name').innerHTML = l.map(n => `<option ${n === 'maind.log' ? 'selected' : ''}>${esc(n)}</option>`).join('');
      loadLog();
    }).catch(e => toast(e.message, true));
  }
  if (tab === 'console') setTimeout(() => { termConnect(); try { termFit?.fit(); } catch {} term?.focus(); }, 0);
  if (tab === 'boot' && !bootLoaded) { bootLoaded = true; loadBoot(); }
  if (tab === 'alarm') loadAlarms();
  if (tab === 'charts') loadCharts();
  if (tab === 'settings') { loadAccess(); loadFootprint(); loadPanelVersion().catch(() => {}); loadPanelModel(); }
  if (tab === 'overview') loadBt();
  if (tab === 'player') { renderMusic(); loadPlayerExtras(); loadMusic(); }
  updateMinibar();
}


// ---------- музыка (Glagol + API Яндекс Музыки) ----------
// Сервер держит соединение с колонкой; страница раз в секунду берёт последнее состояние, а позицию в треке
// между обновлениями досчитывает сама. Одно и то же состояние рисуется в трёх местах: виджет на «Обзоре»,
// нижний плеер и вкладка «Плеер» — элементы помечены общими классами (.mu-title, .mu-seek…) и data-mu.
const mu = { info: null, seeking: false, volSet: 0, qr: null, qrTimer: null, trackId: null, track: null, extras: {} };
const fmtDur = s => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const muState = () => mu.info?.glagol?.state;
const muPlayer = () => muState()?.playerState;
const muHas = () => { const p = muPlayer(); return !!(p && (p.title || p.subtitle)); };
const minibarOn = () => store.get('ui.minibar') !== '0';
const coverUrl = (uri, size) => uri ? (uri.includes('://') ? uri : 'https://' + uri.replace('%%', `${size}x${size}`)) : '';
const muCmd = (btn, payload, msg) => act(btn, async () => {
  const r = await api('/api/music/cmd', payload);
  if (r.status && r.status !== 'SUCCESS' && r.status !== 'timeout') throw new Error('Колонка ответила: ' + r.status);
  setTimeout(loadMusic, 300);
}, msg);

// кнопки управления — одинаковые везде
const MU_BTNS = { dislike: ['i-dislike', 18, 'Дизлайк'], shuffle: ['i-shuffle', 18, 'Перемешать'], prev: ['i-prev', 20, 'Предыдущий'],
                  play: ['i-play', 24, 'Играть'], next: ['i-next', 20, 'Следующий'], repeat: ['i-repeat', 18, 'Повтор'], like: ['i-like', 18, 'Лайк'] };
$$('[data-mu-controls]').forEach(el => {
  const set = el.dataset.muControls === 'bar' ? ['shuffle', 'prev', 'play', 'next', 'repeat'] : Object.keys(MU_BTNS);
  el.innerHTML = set.map(k => `<button class="cbtn${k === 'play' ? ' big' : ''}" data-mu="${k}" aria-label="${MU_BTNS[k][2]}">${icon(MU_BTNS[k][0], MU_BTNS[k][1])}</button>`).join('');
});

function updateMinibar() {
  const show = online && minibarOn() && !!mu.info?.auth?.logged_in && $('#tab-player').hidden;
  $('#minibar').hidden = !show;
  document.body.classList.toggle('has-minibar', show);
}

async function loadMusic() {
  const need = !$('#tab-overview').hidden || !$('#tab-player').hidden || (minibarOn() && mu.info?.auth?.logged_in !== false);
  if (document.hidden || !online || !need) return;
  try { mu.info = await api('/api/music'); } catch { return; }
  renderMusic();
}
setInterval(loadMusic, 1000);

function musicPos() {
  const s = muState(), p = s?.playerState;
  if (!p) return 0;
  // + сколько прошло с момента, когда позиция измерена (по Bluetooth её берёт сервер у телефона — progress_at)
  const since = s.playing ? (Date.now() / 1000 - (mu.info.glagol.progress_at || mu.info.glagol.updated)) : 0;
  return Math.min(p.duration || Infinity, (p.progress || 0) + Math.max(0, since));
}

// Ссылки на music.yandex.ru — по данным трека, которые уже пришли из API Яндекс Музыки.
const YM = 'https://music.yandex.ru';
const ymA = (path, text, cls = '') => `<a class="ym${cls ? ' ' + cls : ''}" href="${YM}${esc(path)}" target="_blank" rel="noopener" title="Открыть в Яндекс Музыке">${esc(text)}</a>`;
const ymTrackPath = t => t.album?.id ? `/album/${t.album.id}/track/${t.id}` : `/track/${t.id}`;
// Источник воспроизведения: альбом, плейлист (владелец:номер) или исполнитель
function ymSourcePath(p) {
  const id = String(p?.playlistId || '');
  if (!id || id === 'user:onyourwave') return null;
  if (p.playlistType === 'Album') return `/album/${id}`;
  if (p.playlistType === 'Artist') return `/artist/${id}`;
  if (p.playlistType === 'Playlist') { const [owner, kind] = id.includes(':') ? id.split(':') : [p.playlistPuid, id]; return owner && kind ? `/users/${owner}/playlists/${kind}` : null; }
  return null;
}
// Ставим разметку, только если она поменялась: иначе renderMusic (4 раза в секунду) пересоздаёт ссылку под курсором и клик теряется.
const setHtml = (e, html) => { if (e._html !== html) { e._html = html; e.innerHTML = html; } };

function renderMusic() {
  const i = mu.info;
  if (!i) return;
  const logged = i.auth.logged_in;
  updateMinibar();
  $('#mu-login').hidden = logged;
  $('#mu-player').hidden = !logged;
  $('#mu-logout').hidden = !logged;
  ymLogin = logged ? i.auth.login || '' : '';
  $('#mu-account').innerHTML = ymLogin ? secret('login', ymLogin) : '';
  $('#pl-login').hidden = logged;
  $('#pl-body').hidden = !logged;
  if (!logged) { if (!mu.qr && !$('#tab-overview').hidden) startQr(); return; }
  stopQr();

  const g = i.glagol, s = g.state, p = s?.playerState, has = muHas();
  const isBt = p?.playerType === 'bluetooth';
  document.body.classList.toggle('mu-bt', isBt);
  $('#mu-err').hidden = g.connected;
  $('#mu-err').textContent = g.connected ? '' : (g.error || 'Подключаемся к колонке…');
  const title = has ? p.title : 'Ничего не играет';
  const artist = has ? (p.subtitle || '') + (isBt && p.extra?.album ? ' — ' + p.extra.album : '') : (g.connected ? 'Нажмите ▶ — включится «Моя волна»' : '');
  // В виджете и на вкладке «Плеер» название и исполнители — ссылки на Яндекс Музыку (нижний плеер ведёт во вкладку).
  const t = !isBt && mu.track && mu.track.id === String(p?.id) ? mu.track : null;
  $$('.mu-title').forEach(e => {
    if (t && e.closest('#music-card, #tab-player')) setHtml(e, ymA(ymTrackPath(t), title));
    else setHtml(e, esc(title));
  });
  $$('.mu-artist').forEach(e => {
    if (t?.artistList?.length && e.closest('#music-card, #tab-player')) setHtml(e, t.artistList.map(a => ymA(`/artist/${a.id}`, a.name)).join(', '));
    else setHtml(e, esc(artist));
  });
  const cover = has && !isBt ? coverUrl(p.extra?.coverURI, 400) : '';
  $$('.mu-cover').forEach(e => {
    const url = e.classList.contains('pl-cover') && mu.track?.coverBig ? mu.track.coverBig : cover;
    e.style.backgroundImage = url ? `url("${url}")` : '';
    if (e.firstElementChild) e.firstElementChild.style.display = url ? 'none' : '';
  });

  const playing = !!s?.playing, rep = p?.entityInfo?.repeatMode || 'None';
  $$('[data-mu="play"]').forEach(b => { b.innerHTML = icon(playing ? 'i-pause' : 'i-play', 24); b.setAttribute('aria-label', playing ? 'Пауза' : 'Играть'); });
  $$('[data-mu="prev"]').forEach(b => b.disabled = !p?.hasPrev);
  $$('[data-mu="next"]').forEach(b => b.disabled = !p?.hasNext);
  $$('[data-mu="repeat"]').forEach(b => {
    b.classList.toggle('on', rep !== 'None');
    b.innerHTML = icon('i-repeat', 18) + (rep === 'One' ? '<span class="one">1</span>' : '');
    b.setAttribute('aria-label', { None: 'Повтор выключен', All: 'Повтор всех', One: 'Повтор трека' }[rep]);
  });
  $$('[data-mu="shuffle"]').forEach(b => b.classList.toggle('on', !!p?.entityInfo?.shuffled));
  $$('[data-mu="like"]').forEach(b => { b.classList.toggle('liked', !!mu.track?.liked); b.setAttribute('aria-label', mu.track?.liked ? 'Убрать лайк' : 'Лайк'); });
  $$('[data-mu="shuffle"], [data-mu="repeat"], [data-mu="like"], [data-mu="dislike"]').forEach(b => b.disabled = !has);
  const pos = musicPos();
  $$('input.mu-seek').forEach(r => {
    // по Bluetooth позиция приходит верная, но перематывать колонка не умеет — только на телефоне
    r.disabled = !p?.duration || isBt;
    r.title = isBt ? 'По Bluetooth перематывать можно только на телефоне' : '';
    if (!mu.seeking) { r.max = Math.round(p?.duration || 100); r.value = Math.round(pos); }
  });
  if (!mu.seeking) $$('.mu-pos').forEach(e => e.textContent = fmtDur(pos));
  $$('.mu-dur').forEach(e => e.textContent = fmtDur(p?.duration));
  if (typeof s?.volume === 'number' && Date.now() - mu.volSet > 2500) {
    $$('input.mu-vol').forEach(r => r.value = Math.round(s.volume * 100));
    $$('.mu-vol-v').forEach(e => e.textContent = Math.round(s.volume * 100));
  }

  if (p?.id && p.id !== mu.trackId) {   // сменился трек — подробности и всё для вкладки «Плеер»
    mu.trackId = p.id; mu.track = null; mu.extras = {};
    if (!isBt) api('/api/music/info?id=' + encodeURIComponent(p.id)).then(t => { if (mu.trackId === p.id) { mu.track = t; renderMusic(); } }).catch(() => {});
    if (!$('#tab-player').hidden) loadPlayerExtras();
  }
  if (!$('#tab-player').hidden) renderPlayerTab();
}
setInterval(() => muState()?.playing && !mu.seeking && renderMusic(), 250);   // плавный прогресс

// ----- вкладка «Плеер» -----
const PL_TYPES = { Radio: 'Радио', Album: 'Альбом', Playlist: 'Плейлист', Artist: 'Исполнитель', Track: 'Трек', FmRadio: 'FM-радио' };
function renderPlayerTab() {
  const s = muState(), p = muPlayer(), t = mu.track;
  const q = mu.extras.queue;
  const src = q?.title || (p?.playlistId === 'user:onyourwave' ? 'Моя волна' : p?.playlistDescription);
  const isBt = p?.playerType === 'bluetooth';
  const srcPath = !isBt && muHas() ? ymSourcePath(p) : null;
  setHtml($('#pl-source'), isBt ? 'Bluetooth · звук с телефона или компьютера'
    : muHas() ? esc(PL_TYPES[p.playlistType] || p.playlistType || '') + (src ? ' · ' + (srcPath ? ymA(srcPath, src) : esc(src)) : '') : 'Ничего не играет');
  $('#pl-kind').textContent = p ? (isBt ? 'Bluetooth' : PL_TYPES[p.type] || p.type || 'Трек') + (s?.playing ? ' · играет' : ' · пауза') : '—';
  const meta = [];
  if (t) {
    if (t.album?.title) meta.push(t.album.id ? ymA(`/album/${t.album.id}`, `Альбом «${t.album.title}»`, 'badge') : `<span class="badge">${esc(`Альбом «${t.album.title}»`)}</span>`);
    for (const m of [t.album?.year, t.album?.genre, t.album?.label, t.album?.trackCount && `${t.album.trackCount} треков в альбоме`, t.explicit && '18+'])
      if (m) meta.push(`<span class="badge">${esc(m)}</span>`);
  }
  setHtml($('#pl-meta'), meta.join(''));
  // текст: если есть синхронизация — подсвечиваем текущую строку
  const ly = mu.extras.lyrics;
  if (ly?.sync) {
    const pos = musicPos(), idx = ly.sync.reduce((k, l, j) => l[0] <= pos ? j : k, -1);
    if (idx !== mu.extras.lyIdx) {
      mu.extras.lyIdx = idx;
      $$('#pl-lyrics .ln').forEach((el, j) => el.classList.toggle('cur', j === idx));
      // Прокручиваем только сам блок текста (не страницу) и не мешаем, если его недавно крутили рукой.
      const box = $('#pl-lyrics'), line = $(`#pl-lyrics .ln:nth-child(${idx + 1})`);
      if (line && Date.now() - (box._userScroll || 0) > 6000) {
        box._auto = Date.now();
        box.scrollTo({ top: line.offsetTop - box.clientHeight / 2 + line.offsetHeight / 2, behavior: 'smooth' });   // offsetTop — от самого блока (position: relative)
      }
    }
  }
  if ($('#pl-raw-box').open) renderRaw();
}
function renderRaw() {
  const out = [], walk = (o, pre) => Object.entries(o || {}).forEach(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v) ? walk(v, pre + k + '.') : out.push([pre + k, Array.isArray(v) ? `[${v.length}]` : String(v)]));
  walk(muState(), '');
  $('#pl-raw').innerHTML = out.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v.length > 140 ? v.slice(0, 140) + '…' : v)}</dd>`).join('');
}
$('#pl-raw-box').addEventListener('toggle', renderRaw);
// ручная прокрутка текста (колесо, тач, перетаскивание полосы) — ставит автопрокрутку на паузу
['wheel', 'touchmove', 'pointerdown'].forEach(ev => $('#pl-lyrics').addEventListener(ev, () => { $('#pl-lyrics')._userScroll = Date.now(); }, { passive: true }));
const trackRow = (t, cur, tag) => `<button class="trow${cur ? ' cur' : ''}" data-play="${esc(t.id)}" ${t.available === false ? 'disabled' : ''}>
  ${t.cover ? `<img src="${esc(t.cover)}" alt="" loading="lazy">` : '<span class="ph"></span>'}
  <span class="tt"><b>${esc(t.title)}</b><span>${esc(t.artists)}</span></span>
  ${tag ? `<span class="badge${cur ? ' ok' : ''}">${tag}</span>` : ''}<span class="td">${t.durationMs ? fmtDur(t.durationMs / 1000) : ''}</span></button>`;
async function loadPlayerExtras() {
  const id = mu.trackId;
  if (!id || mu.extras.for === id) return;
  mu.extras = { for: id };
  $('#pl-lyrics').innerHTML = $('#pl-queue').innerHTML = $('#pl-similar').innerHTML = '<div class="empty">Загрузка…</div>';
  const p = muPlayer(), isBt = p?.playerType === 'bluetooth';
  // По Bluetooth у трека нет id Яндекса: текст ищем в LRCLIB по названию, очередь и похожие не нужны.
  const lyUrl = isBt ? '/api/music/lyrics?' + new URLSearchParams({ title: p.title || '', artist: p.subtitle || '', album: p.extra?.album || '', duration: p.duration || 0 })
                     : '/api/music/lyrics?id=' + id;
  const none = Promise.reject(new Error('—'));
  none.catch(() => {});
  const [ly, q, sim] = await Promise.allSettled([api(lyUrl), isBt ? none : api('/api/music/queue'), isBt ? none : api('/api/music/similar?id=' + id)]);
  if (mu.trackId !== id) return;
  const L = ly.status === 'fulfilled' ? ly.value : {};
  if (L.text) {
    mu.extras.lyrics = L;
    $('#pl-lyrics').innerHTML = L.sync
      ? L.sync.map(l => `<span class="ln">${esc(l[1]) || '&nbsp;'}</span>`).join('')
      : esc(L.text);
    $('#pl-ly-meta').textContent = L.sync ? 'идёт вместе с песней' : '';
  } else {
    $('#pl-lyrics').innerHTML = `<div class="empty">${L.instrumental ? 'Инструментальный трек — без слов' : 'Текст не нашёлся ни в Яндекс Музыке, ни в LRCLIB'}</div>`;
    $('#pl-ly-meta').textContent = '';
  }
  // откуда текст
  const SRC = { 'Яндекс Музыка': 'Текст: Яндекс Музыка', 'LRCLIB': 'Текст: <a href="https://lrclib.net" target="_blank" rel="noopener">LRCLIB</a> — открытая база текстов песен' };
  $('#pl-ly-src').hidden = !L.source;
  $('#pl-ly-src').innerHTML = SRC[L.source] || '';
  if (q.status === 'fulfilled') {
    mu.extras.queue = q.value;
    $('#pl-q-title').textContent = q.value.title ? `Очередь · ${q.value.title}` : 'Очередь';
    $('#pl-q-count').textContent = q.value.tracks.length > 3 ? `${q.value.tracks.length} треков` : '';
    const cur = q.value.current, tagOf = k => cur == null ? '' : k === cur ? 'сейчас' : k === cur + 1 ? 'далее' : k === cur - 1 ? 'было' : '';
    $('#pl-queue').innerHTML = q.value.tracks.map((t, k) => trackRow(t, k === cur, tagOf(k))).join('') || '<div class="empty">Пусто</div>';
    $('#pl-queue .trow.cur')?.scrollIntoView({ block: 'nearest' });
  } else $('#pl-queue').innerHTML = `<div class="empty">${esc(q.reason?.message || 'Не удалось')}</div>`;
  $('#pl-similar').innerHTML = sim.status === 'fulfilled' && sim.value.length ? sim.value.map(t => trackRow(t)).join('') : '<div class="empty">Нет</div>';
  if (isBt) return;
  // исполнитель — когда приедут подробности о треке
  const waitTrack = async () => { for (let k = 0; k < 20 && !mu.track && mu.trackId === id; k++) await new Promise(r => setTimeout(r, 300)); };
  await waitTrack();
  const aid = mu.track?.artistList?.[0]?.id;
  if (!aid) { $('#pl-artist').innerHTML = '<div class="empty">—</div>'; return; }
  try {
    const a = await api('/api/music/artist?id=' + aid);
    if (mu.trackId !== id) return;
    $('#pl-artist').innerHTML = `<div class="artist-grid">
      ${a.cover ? `<img src="${esc(a.cover)}" alt="">` : '<span></span>'}
      <div class="col" style="gap:8px">
        <div style="font-size:22px;font-weight:800">${ymA(`/artist/${a.id}`, a.name)}</div>
        <div class="pl-meta">${(a.genres || []).map(g => `<span class="badge">${esc(g)}</span>`).join('')}
          ${a.likes ? `<span class="badge">♥ ${a.likes.toLocaleString('ru')}</span>` : ''}
          ${a.tracks ? `<span class="badge">${a.tracks} треков</span>` : ''}${a.albums ? `<span class="badge">${a.albums} альбомов</span>` : ''}</div>
        ${a.description ? `<p class="hint" style="font-size:14px">${esc(a.description)}</p>` : ''}
        ${a.similar?.length ? `<div class="meta">Похожие: ${a.similar.map(x => x.id ? ymA(`/artist/${x.id}`, x.name) : esc(x.name)).join(', ')}</div>` : ''}
        <div><a class="btn sm" href="${YM}/artist/${esc(a.id)}" target="_blank" rel="noopener">Открыть в Яндекс Музыке ↗</a></div>
        ${a.popular?.length ? `<b style="margin-top:6px">Популярное</b><div class="tlist">${a.popular.map(t => trackRow(t)).join('')}</div>` : ''}
      </div></div>`;
  } catch (e) { $('#pl-artist').innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}

// ----- управление (общие обработчики) -----
function musicAction(a, btn) {
  const s = muState(), p = muPlayer();
  if (a === 'play') {
    if (s?.playing) return muCmd(btn, { command: 'stop' });
    if (!muHas()) return muCmd(btn, { command: 'sendText', text: 'Включи мою волну' }, 'Включаю «Мою волну»');
    return muCmd(btn, { command: 'play' });
  }
  if (a === 'prev' || a === 'next') return muCmd(btn, { command: a });
  if (a === 'shuffle') return muCmd(btn, { command: 'shuffle', enable: !p?.entityInfo?.shuffled });
  if (a === 'repeat') return muCmd(btn, { command: 'repeat', mode: { None: 'All', All: 'One', One: 'None' }[p?.entityInfo?.repeatMode || 'None'] });
  if (!p?.id) return;
  if (a === 'like') return act(btn, async () => {
    const r = await api('/api/music/like', { id: p.id, like: !mu.track?.liked });
    if (mu.track) mu.track.liked = r.liked;
    renderMusic();
    toast(r.liked ? '♥ В «Мне нравится»' : 'Лайк убран');
  });
  if (a === 'dislike') return act(btn, () => api('/api/music/dislike', { id: p.id }), 'Дизлайк — дальше');
}
listen(document, 'click', e => {
  const b = e.target.closest('[data-mu]');
  if (b) return musicAction(b.dataset.mu, b);
  const r = e.target.closest('[data-play]');
  if (r) act(r, () => api('/api/music/play', { id: r.dataset.play, type: 'track' }), 'Включаю');
});
listen(document, 'input', e => {
  if (e.target.matches('input.mu-seek')) { mu.seeking = true; $$('.mu-pos').forEach(x => x.textContent = fmtDur(+e.target.value)); }
  if (e.target.matches('input.mu-vol')) { mu.volSet = Date.now(); $$('.mu-vol-v').forEach(x => x.textContent = e.target.value); }
});
listen(document, 'change', e => {
  if (e.target.matches('input.mu-seek'))
    muCmd(null, { command: 'rewind', position: +e.target.value }).finally(() => setTimeout(() => mu.seeking = false, 800));
  if (e.target.matches('input.mu-vol')) { mu.volSet = Date.now(); act(null, () => api('/api/volume', { level: +e.target.value })); }
});
listen(document, 'submit', e => {
  if (!e.target.matches('.mu-ask-form')) return;
  e.preventDefault();
  const input = e.target.elements.text, text = input.value.trim();
  if (!text) return;
  muCmd(e.submitter, { command: 'sendText', text }, 'Алиса: «' + text + '»').then(() => input.value = '');
});
$('#mu-logout').onclick = e => confirm('Выйти из аккаунта Яндекса? Токен будет удалён с этого компьютера.') &&
  act(e.currentTarget, async () => { await api('/api/auth/logout', {}); mu.qr = null; await loadMusic(); }, 'Вы вышли из аккаунта');

// вход по QR: показываем код и раз в 2 с спрашиваем, подтвердили ли вход на телефоне
async function startQr() {
  mu.qr = 'pending';
  $('#mu-qr').innerHTML = '<div class="empty">QR-код…</div>';
  $('#mu-qr-status').textContent = '';
  try {
    const [r, a] = await Promise.all([api('/api/auth/qr', {}), api('/api/auth')]);
    mu.qr = r.link;
    $('#mu-oauth').href = a.oauth_url;
    const q = qrcode(0, 'M');
    q.addData(r.link);
    q.make();
    $('#mu-qr').innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    $('#mu-qr-status').textContent = 'Ждём подтверждения на телефоне…';
    clearInterval(mu.qrTimer);
    mu.qrTimer = setInterval(pollQr, 2000);
  } catch (e) {
    mu.qr = 'failed';
    $('#mu-qr').innerHTML = '<div class="empty">QR недоступен</div>';
    $('#mu-qr-status').textContent = e.offline ? '' : e.message + ' — войдите через Яндекс ниже.';
    api('/api/auth').then(a => $('#mu-oauth').href = a.oauth_url).catch(() => {});
  }
}
function stopQr() { clearInterval(mu.qrTimer); mu.qrTimer = null; mu.qr = null; }
async function pollQr() {
  try {
    const r = await api('/api/auth/qr');
    if (r.state === 'done') { stopQr(); toast('Вход выполнен' + (r.login ? ': ' + r.login : '')); loadMusic(); }
    else if (r.state === 'expired' || r.state === 'none') {
      clearInterval(mu.qrTimer);
      $('#mu-qr-status').innerHTML = 'QR-код устарел. <button class="btn sm" id="mu-qr-new">Новый код</button>';
      $('#mu-qr-new').onclick = () => startQr();
    }
  } catch (e) { if (!e.offline) $('#mu-qr-status').textContent = e.message; }
}
$('#mu-oauth-go').onclick = e => act(e.currentTarget, async () => {
  const r = await api('/api/auth/oauth', { url: $('#mu-oauth-url').value });
  $('#mu-oauth-url').value = '';
  stopQr();
  await loadMusic();
  return r;
}, 'Вход выполнен');

// ---------- ASCII-визуализатор за моделью ----------
// Звука у панели нет, но пока играет музыка, Quasar сам рисует на часах эквалайзер из 4 полос — его мы
// получаем потоком (liveLeds) и раскладываем по кругу. Без него — синтетика: лучи пульсируют в темпе.
// В покое (по желанию) — медленно переливающийся фон. Цвет — акцент темы.
(() => {
  const cv = $('#model-viz'), ctx = cv.getContext('2d');
  const RAMP = ' .·:-=+*%#@', FS = 13;
  let cw = 0, ch = 0, energy = 0, last = 0, color = '#6C47FF';
  const sb = [0, 0, 0, 0];   // сглаженные полосы спектра
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const readColor = () => { color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || color; };
  readColor();
  listen(matchMedia('(prefers-color-scheme: dark)'), 'change', readColor);
  listen(window, 'themechange', readColor);
  new ResizeObserver(() => {
    const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio, 2);
    cw = r.width; ch = r.height;
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }).observe(cv);

  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden || !cv.offsetParent || !cw || now - last < 33) return;   // ~30 к/с и только на экране
    last = now;
    if (window.__vizOff) { if (energy) { ctx.clearRect(0, 0, cw, ch); energy = 0; } return; }
    const t = now / 1000;
    // фон в покое: пока музыка не играет, символы медленно переливаются (выключается в «Настроить»)
    const idle = window.__vizIdleOff ? 0 : 1 - energy, ti = reduced.matches ? 0 : t;
    const playing = !!mu.info?.glagol?.state?.playing;
    energy += ((playing ? 1 : 0.12) - energy) * 0.05;          // плавно разгоняется и затихает
    const beat = Math.exp(-((t * 2) % 1) * 5);                 // запасной пульс 120 уд/мин
    // Настоящий спектр с колонки, если он свежий: сглаживаем полосы, пульс — от общей громкости.
    const sp = window.__spectrum, live = !!sp && now - sp.t < 700;
    if (live) sp.bands.forEach((b, k) => { sb[k] += (b - sb[k]) * 0.35; }); else sb.forEach((_, k) => { sb[k] *= 0.9; });
    const loud = (sb[0] + sb[1] + sb[2] + sb[3]) / 4;
    const pulse = live ? 0.45 + 0.75 * loud : 0.55 + 0.45 * beat;
    ctx.clearRect(0, 0, cw, ch);
    if (energy < 0.02 && idle < 0.02) return;
    ctx.font = `${FS}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    const cx = cw / 2, cy = ch / 2, colW = FS * 0.62, rowH = FS * 1.1, maxR = Math.hypot(cx, cy), idleR = Math.min(cw, ch) * 0.75;
    for (let y = rowH / 2; y < ch; y += rowH) {
      for (let x = colW / 2; x < cw; x += colW) {
        const dx = x - cx, dy = y - cy;
        const r = Math.hypot(dx, dy) / maxR, a = Math.atan2(dy, dx);
        // дальность луча в этом направлении: по спектру (4 полосы по кругу, зеркально сверху и снизу —
        // справа низкие частоты, слева высокие) или, без него, несколько «частот» по углу
        let amp;
        if (live) {
          const u = Math.abs(a) / Math.PI * 3, k = Math.min(2, Math.floor(u)), f = u - k;
          amp = 0.2 + 0.95 * (sb[k] * (1 - f) + sb[k + 1] * f) + 0.06 * Math.sin(a * 9 + t * 2);
        } else amp = 0.4 + 0.22 * Math.sin(a * 3 + t * 1.3) + 0.18 * Math.sin(a * 7 - t * 2.1) + 0.12 * Math.sin(a * 13 + t * 3.7);
        // Лучи идут прямо из центра и редеют к концу.
        const reach = (0.42 + 0.5 * amp * pulse) * energy;
        let v = r < reach ? 1 - (r / reach) ** 2 : 0;
        v = Math.max(v, Math.max(0, Math.sin(r * 16 - t * 3.4)) ** 3 * 0.5 * energy * (1 - r));   // волны-кольца
        if (idle) {
          const wave = 0.78 + 0.12 * Math.sin(a * 3 + ti * 0.8) + 0.07 * Math.sin(a * 7 - ti);
          // сплошное пятно из центра; крупнее модели, чтобы край выходил из-за корпуса
          v = Math.max(v, Math.max(0, 1 - (Math.hypot(dx, dy) / idleR / wave) ** 2) * 0.45 * idle);
        }
        if (v < 0.08) continue;
        ctx.globalAlpha = Math.min(0.8, v * 0.85);
        ctx.fillText(RAMP[Math.min(RAMP.length - 1, Math.floor(v * RAMP.length))], x, y);
      }
    }
    ctx.globalAlpha = 1;
  }
  requestAnimationFrame(frame);
})();

// ---------- файлы ----------
const fs = { cwd: '/', entries: [], writable: false, sort: 'name', dir: 1, sel: null, loaded: false };
const AUDIO = /\.(wav|mp3|opus|ogg|oga|flac|m4a|aac)$/i;
const join = (dir, name) => (dir === '/' ? '' : dir) + '/' + name;
const parent = p => p.replace(/\/[^/]*$/, '') || '/';

function fmtSize(n) {
  if (n < 1024) return n + ' Б';
  const u = ['КБ', 'МБ', 'ГБ']; let i = -1;
  do { n /= 1024; i++; } while (n >= 1024 && i < u.length - 1);
  return n.toFixed(n < 10 ? 1 : 0) + ' ' + u[i];
}
function fmtTime(t) {
  if (!t) return '—';
  const d = new Date(t * 1000), p = x => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

async function fsOpen(path, keepSel = false) {
  try {
    const r = await api('/api/fs/list?path=' + encodeURIComponent(path));
    Object.assign(fs, { cwd: r.path, entries: r.entries, writable: r.writable, loaded: true });
    if (!keepSel) fs.sel = null;
    store.set('fs.cwd', r.path);
    $('#fs-filter').value = keepSel ? $('#fs-filter').value : '';
    renderCrumbs(); renderFs();
  } catch (e) {
    toast(e.message, true);
    if (!fs.loaded && path !== '/') fsOpen('/');
  }
}

function renderCrumbs() {
  const parts = fs.cwd.split('/').filter(Boolean);
  let acc = '';
  $('#fs-crumbs').innerHTML = '<a data-p="/">/</a>' + parts.map((p, i) => {
    acc += '/' + p;
    return (i ? '<span>/</span>' : '') + `<a data-p="${esc(acc)}">${esc(p)}</a>`;
  }).join('');
  $$('#fs-crumbs a').forEach(a => a.onclick = () => fsOpen(a.dataset.p));
  const rw = $('#fs-rw');
  rw.textContent = fs.writable ? 'запись' : 'только чтение';
  rw.className = 'badge' + (fs.writable ? ' ok' : '');
  ['#fs-upload', '#fs-mkdir', '#fs-newfile'].forEach(s => $(s).disabled = !fs.writable);
}

function renderFs() {
  const f = $('#fs-filter').value.toLowerCase(), hidden = $('#fs-hidden').checked;
  const list = fs.entries
    .filter(e => (hidden || !e.name.startsWith('.')) && (!f || e.name.toLowerCase().includes(f)))
    .sort((a, b) => (b.is_dir - a.is_dir) || fs.dir * (fs.sort === 'name'
      ? a.name.localeCompare(b.name, 'ru', { numeric: true }) : a[fs.sort] - b[fs.sort]));
  $$('table.fs th[data-sort]').forEach(th => {
    th.textContent = th.textContent.replace(/ [▲▼]$/, '') + (th.dataset.sort === fs.sort ? (fs.dir > 0 ? ' ▲' : ' ▼') : '');
  });
  const body = $('#fs-body');
  if (!list.length) {
    body.innerHTML = `<tr><td colspan="5"><div class="empty">${fs.entries.length ? 'Ничего не найдено' : 'Пустая папка'}</div></td></tr>`;
    return;
  }
  body.innerHTML = list.map(e => {
    const ico = e.is_dir ? 'i-folder' : e.type === 'link' ? 'i-link' : AUDIO.test(e.name) ? 'i-music' : 'i-file';
    return `<tr data-name="${esc(e.name)}" class="${e.is_dir ? 'dir' : ''} ${fs.sel === e.name ? 'sel' : ''}">
      <td class="name"><span class="n">${icon(ico, 18)}${esc(e.name)}</span>${e.target ? ` <span class="tgt">→ ${esc(e.target)}</span>` : ''}</td>
      <td class="num">${e.is_dir ? '' : fmtSize(e.size)}</td>
      <td class="dim hide-sm">${fmtTime(e.mtime)}</td>
      <td class="dim hide-sm">${esc(e.mode)}</td>
      <td class="act">
        <button class="btn sm icon ghost" data-a="dl" aria-label="Скачать${e.is_dir ? ' архивом' : ''}" title="Скачать${e.is_dir ? ' (.tar.gz)' : ''}">${icon('i-dl')}</button>
        ${fs.writable ? `<button class="btn sm icon ghost" data-a="mv" aria-label="Переименовать" title="Переименовать">${icon('i-edit')}</button>
        <button class="btn sm icon ghost danger" data-a="rm" aria-label="Удалить" title="Удалить">${icon('i-trash')}</button>` : ''}
      </td></tr>`;
  }).join('');
  $$('#fs-body tr[data-name]').forEach(tr => {
    const e = fs.entries.find(x => x.name === tr.dataset.name);
    tr.onclick = ev => {
      const a = ev.target.closest('button')?.dataset.a;
      if (a) return fsAction(a, e);
      if (e.is_dir) return fsOpen(join(fs.cwd, e.name));
      fs.sel = e.name; renderFs(); fsPreview(e);
    };
  });
}

async function fsAction(a, e) {
  const p = join(fs.cwd, e.name);
  if (a === 'dl') {
    toast(e.is_dir ? 'Упаковка папки…' : 'Скачивание…');
    const link = document.createElement('a');
    link.href = PanelContext.url('/api/fs/download?path=' + encodeURIComponent(p));
    link.download = ''; document.body.append(link); link.click(); link.remove();
  } else if (a === 'mv') {
    const name = prompt('Новое имя', e.name);
    if (!name || name === e.name) return;
    if (await act(null, () => api('/api/fs/rename', { path: p, name }), 'Переименовано')) {
      if (fs.sel === e.name) fs.sel = name;
      fsOpen(fs.cwd, true);
    }
  } else if (a === 'rm') {
    if (!confirm(`Удалить ${e.is_dir ? 'папку со всем содержимым' : 'файл'}\n${p}?`)) return;
    if (await act(null, () => api('/api/fs/delete', { path: p }), 'Удалено')) {
      if (fs.sel === e.name) clearPreview();
      fsOpen(fs.cwd, true);
    }
  }
}

function clearPreview() {
  fs.sel = null;
  $('#fs-preview').innerHTML = '<h2>Просмотр</h2><div class="empty">Выберите файл</div>';
}

async function fsPreview(e, isNew = false) {
  const p = join(fs.cwd, e.name), pv = $('#fs-preview');
  pv.innerHTML = `<h2>Просмотр</h2><div class="pv-name">${esc(p)}</div>
    <div class="row" id="pv-actions" style="gap:8px"></div><div id="pv-body"><div class="empty">Загрузка…</div></div>`;
  const actions = $('#pv-actions');
  const addBtn = (html, fn, cls = '') => {
    const b = document.createElement('button'); b.innerHTML = html; b.className = 'btn sm ' + cls;
    b.onclick = () => fn(b); actions.append(b); return b;
  };
  if (!isNew) addBtn(icon('i-dl', 14) + 'Скачать', () => fsAction('dl', e));
  if (AUDIO.test(e.name)) {
    addBtn(icon('i-play', 14) + 'Играть на колонке', b => act(b, () => api('/api/fs/play', { path: p }), '▶ ' + e.name), 'primary');
    addBtn(icon('i-stop', 14) + 'Стоп', b => act(b, () => api('/api/stop', {})), 'danger-soft');
    $('#pv-body').innerHTML = `<p class="hint">${fmtSize(e.size)} · ${fmtTime(e.mtime)}</p>`;
    return;
  }
  let r = { text: '', binary: false, truncated: false };
  if (!isNew) {
    try { r = await api('/api/fs/read?path=' + encodeURIComponent(p)); }
    catch (err) { $('#pv-body').innerHTML = `<div class="empty">${esc(err.message)}</div>`; return; }
    if (fs.sel !== e.name) return; // пока грузили, выбрали другой файл
  }
  const body = $('#pv-body');
  if (r.binary) {
    body.innerHTML = `<p class="hint" style="margin-bottom:8px">Бинарный файл, ${fmtSize(e.size)}. Первые 4 КБ:</p><pre class="out"></pre>`;
    body.querySelector('pre').textContent = r.text;
    return;
  }
  const editable = fs.writable && !r.truncated;
  body.innerHTML = `<textarea spellcheck="false" aria-label="Содержимое файла" ${editable ? '' : 'readonly'}></textarea>
    ${r.truncated ? '<p class="hint">Показаны первые 512 КБ — редактирование отключено.</p>' : ''}
    ${!fs.writable ? '<p class="hint">Папка только для чтения.</p>' : ''}`;
  const ta = body.querySelector('textarea');
  ta.value = r.text;
  if (editable) {
    const save = addBtn('Сохранить', b => act(b, async () => {
      await api('/api/fs/write', { path: p, text: ta.value });
      save.textContent = 'Сохранить'; isNew && fsOpen(fs.cwd, true); isNew = false;
    }, 'Сохранено'), 'primary');
    ta.oninput = () => save.textContent = 'Сохранить •';
    ta.onkeydown = ev => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key === 's') { ev.preventDefault(); save.click(); }
      if (ev.key === 'Tab') { ev.preventDefault(); ta.setRangeText('\t', ta.selectionStart, ta.selectionEnd, 'end'); }
    };
  }
}

async function fsUpload(files) {
  if (!fs.writable) return toast('Папка только для чтения', true);
  for (const f of files) {
    toast(`Загрузка ${f.name} (${fmtSize(f.size)})…`);
    const ok = await act(null, () => api('/api/fs/upload', f, {
      raw: true, headers: { 'Content-Type': 'application/octet-stream',
        'X-Filename': encodeURIComponent(f.name), 'X-Dir': encodeURIComponent(fs.cwd) },
    }), 'Загружено: ' + f.name);
    if (!ok) break;
  }
  fsOpen(fs.cwd, true);
}

$('#fs-up').onclick = () => fsOpen(parent(fs.cwd));
$('#fs-refresh').onclick = () => fsOpen(fs.cwd, true);
$('#fs-bookmarks').onchange = e => { if (e.target.value) fsOpen(e.target.value); e.target.value = ''; };
$('#fs-filter').oninput = renderFs;
$('#fs-hidden').onchange = renderFs;
$$('table.fs th[data-sort]').forEach(th => th.onclick = () => {
  fs.dir = fs.sort === th.dataset.sort ? -fs.dir : 1; fs.sort = th.dataset.sort; renderFs();
});
$('#fs-upload').onclick = () => $('#fs-file').click();
$('#fs-file').onchange = e => { fsUpload([...e.target.files]); e.target.value = ''; };
$('#fs-mkdir').onclick = async () => {
  const name = prompt('Имя новой папки');
  if (name && await act(null, () => api('/api/fs/mkdir', { path: join(fs.cwd, name) }), 'Папка создана')) fsOpen(fs.cwd, true);
};
$('#fs-newfile').onclick = () => {
  const name = prompt('Имя нового файла');
  if (!name || name.includes('/')) return;
  fs.sel = name; renderFs();
  fsPreview({ name, size: 0, mtime: 0 }, true);
};
const wrap = $('#fs-wrap');
wrap.ondragover = e => { e.preventDefault(); wrap.classList.add('over'); };
wrap.ondragleave = e => { if (!wrap.contains(e.relatedTarget)) wrap.classList.remove('over'); };
wrap.ondrop = e => { e.preventDefault(); wrap.classList.remove('over'); fsUpload([...e.dataTransfer.files]); };

// ---------- настройка «Обзора»: виджеты можно убирать, возвращать и переставлять ----------
const LAYOUT_KEY = 'ov.layout', ZONES = ['wz-top', 'wz-left', 'wz-right'];
const widgetEls = () => $$('[data-widget]');
function readLayout() {
  const ids = el => [...el.children].filter(c => c.dataset.widget).map(c => c.dataset.widget);
  return { zones: Object.fromEntries(ZONES.map(z => [z, ids($('#' + z))])), hidden: ids($('#wz-hidden')) };
}
const DEFAULT_LAYOUT = { zones: {
  'wz-top': ['stats'],
  'wz-left': ['model', 'volume', 'bt', 'sounds'],
  'wz-right': ['music', 'clock', 'light', 'device'],
}, hidden: [] };
const homeZone = id => ZONES.find(z => DEFAULT_LAYOUT.zones[z].includes(id)) || 'wz-right';
function applyLayout(l) {
  const byId = Object.fromEntries(widgetEls().map(w => [w.dataset.widget, w]));
  const put = (parent, id) => { if (byId[id]) { parent.append(byId[id]); delete byId[id]; } };
  ZONES.forEach(z => (l.zones?.[z] || []).forEach(id => put($('#' + z), id)));
  (l.hidden || []).forEach(id => put($('#wz-hidden'), id));
  // виджеты, которых не было в сохранённой раскладке (появились в новой версии панели), — на своё место
  Object.keys(byId).forEach(id => put($('#' + homeZone(id)), id));
}
function saveLayout() {
  store.set(LAYOUT_KEY, JSON.stringify(readLayout()));
  renderHiddenList();
}
function renderHiddenList() {
  const hidden = [...$('#wz-hidden').children];
  $('#ov-hidden-list').innerHTML = hidden.length
    ? hidden.map(w => `<button class="chip" data-id="${esc(w.dataset.widget)}">+ ${esc(w.dataset.title)}</button>`).join('')
    : '<span class="meta">Все виджеты на месте.</span>';
  $$('#ov-hidden-list button').forEach(b => b.onclick = () => {
    $('#' + homeZone(b.dataset.id)).append($(`[data-widget="${b.dataset.id}"]`));
    saveLayout();
  });
}
function moveWidget(w, how) {
  const zone = w.parentElement;
  const sib = dir => { let s = w[dir]; while (s && !s.dataset.widget) s = s[dir]; return s; };
  if (how === 'up') { const s = sib('previousElementSibling'); if (s) zone.insertBefore(w, s); }
  else if (how === 'down') { const s = sib('nextElementSibling'); if (s) s.after(w); }
  else if (how === 'side') $(zone.id === 'wz-left' ? '#wz-right' : '#wz-left').append(w);
  else if (how === 'hide') $('#wz-hidden').append(w);
  saveLayout();
}
function widgetBar(w) {
  const b = document.createElement('div');
  b.className = 'wbar';
  b.innerHTML = `<span class="grip" title="Перетащить">⠿ ${esc(w.dataset.title)}</span>
    <button data-m="up" aria-label="Выше" title="Выше">↑</button><button data-m="down" aria-label="Ниже" title="Ниже">↓</button>
    <button data-m="side" aria-label="В другую колонку" title="В другую колонку">⇄</button>
    <button data-m="hide" aria-label="Убрать виджет" title="Убрать">✕</button>`;
  b.querySelector('.grip').addEventListener('pointerdown', () => { w.draggable = true; });
  b.addEventListener('click', e => { const m = e.target.closest('button')?.dataset.m; if (m) moveWidget(w, m); });
  return b;
}
function setEditing(on) {
  document.body.classList.toggle('editing', on);
  $('#ov-editbar').hidden = !on;
  $('#ov-edit').classList.toggle('primary', on);
  $('#ov-edit').setAttribute('aria-pressed', on);
  $('#ov-edit span').textContent = on ? 'Готово' : 'Настроить';
  widgetEls().forEach(w => { if (!w.querySelector(':scope > .wbar')) w.prepend(widgetBar(w)); w.draggable = false; });
  renderHiddenList();
}
$('#ov-edit').onclick = () => setEditing(!document.body.classList.contains('editing'));
$('#set-layout-edit').onclick = () => { location.hash = '#overview'; setTimeout(() => { setEditing(true); window.scrollTo({ top: 0 }); }, 0); };
$('#set-layout-reset').onclick = () => $('#ov-reset').click();
$('#ov-done').onclick = () => setEditing(false);
$('#ov-reset').onclick = () => { applyLayout(DEFAULT_LAYOUT); $$('#wz-hidden > [data-widget]').forEach(w => $('#' + homeZone(w.dataset.widget)).append(w)); saveLayout(); toast('Раскладка по умолчанию'); };
// Перетаскивание: виджет переезжает прямо во время движения, место выбирается по середине соседей.
let dragW = null;
listen(document, 'dragstart', e => {
  const w = e.target.closest?.('[data-widget]');
  if (!document.body.classList.contains('editing') || !w) return;
  dragW = w;
  w.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', w.dataset.widget);
});
listen(document, 'dragend', () => {
  if (!dragW) return;
  dragW.classList.remove('dragging');
  dragW.draggable = false;
  dragW = null;
  saveLayout();
});
ZONES.forEach(z => $('#' + z).addEventListener('dragover', e => {
  if (!dragW) return;
  e.preventDefault();
  const zone = e.currentTarget;
  const before = [...zone.children].filter(c => c.dataset.widget && c !== dragW)
    .find(c => { const r = c.getBoundingClientRect(); return e.clientY < r.top + r.height / 2; });
  if (before) { if (dragW.nextElementSibling !== before) zone.insertBefore(dragW, before); }
  else if (zone.lastElementChild !== dragW) zone.append(dragW);
}));
applyLayout(DEFAULT_LAYOUT);
try { const saved = JSON.parse(store.get(LAYOUT_KEY)); if (saved) applyLayout(saved); } catch {}

// Оформление: тема, акцент, визуализатор (храним в браузере; применяется ещё в <head>).
function applyUI() {
  const root = document.documentElement, theme = store.get('ui.theme') || 'auto', accent = store.get('ui.accent') || '';
  if (theme === 'auto') delete root.dataset.theme; else root.dataset.theme = theme;
  for (const [k, v] of [['--accent', accent], ['--accent-ink', accent && `color-mix(in srgb, ${accent} 72%, var(--text))`],
                        ['--accent-soft', accent && `color-mix(in srgb, ${accent} 15%, var(--card))`]])
    v ? root.style.setProperty(k, v) : root.style.removeProperty(k);
  window.__vizOff = store.get('ui.viz') === '0';
  $$('#set-theme button').forEach(b => b.classList.toggle('active', b.dataset.v === theme));
  $$('#set-accent .sw').forEach(b => b.classList.toggle('sel', b.dataset.v === accent));
  $('#set-viz').checked = !window.__vizOff;
  window.__vizIdleOff = store.get('ui.vizIdle') === '0';
  $('#set-viz-idle').checked = !window.__vizIdleOff;
  privateOff = store.get('ui.private') === '0';
  $('#set-private').checked = !privateOff;
  $('#log-mask').checked = !privateOff;
  applyPrivate();
  if (logText) renderLog();
  $('#set-minibar').checked = minibarOn();
  updateMinibar();
  window.dispatchEvent(new Event('themechange'));
}
$$('#set-theme button').forEach(b => b.onclick = () => { store.set('ui.theme', b.dataset.v); applyUI(); });
$$('#set-accent .sw').forEach(b => b.onclick = () => { store.set('ui.accent', b.dataset.v); applyUI(); });
$('#set-viz').onchange = e => { store.set('ui.viz', e.target.checked ? '1' : '0'); applyUI(); };
$('#set-viz-idle').onchange = e => { store.set('ui.vizIdle', e.target.checked ? '1' : '0'); applyUI(); };
$('#set-private').onchange = e => { store.set('ui.private', e.target.checked ? '1' : '0'); applyUI(); };
$('#set-minibar').onchange = e => { store.set('ui.minibar', e.target.checked ? '1' : '0'); applyUI(); loadMusic(); };
applyUI();

// Доступ: пароль панели и установка как приложение.
let accessInfo = null, installEvt = null;
const isLocalHost = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
async function authPost(path, body) {
  const r = await PanelContext.fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || r.statusText);
  return d;
}
async function loadAccess() {
  try { accessInfo = await (await PanelContext.fetch('/api/panel-auth')).json(); } catch { return; }
  const a = accessInfo, st = $('#pw-state');
  st.textContent = a.enabled ? 'Задан. Вход запоминается в этом браузере на 90 дней'
    : isLocalHost ? 'Не задан. Пока панель открыта только на этом компьютере, это не страшно'
    : 'Не задан — любой в вашей сети может управлять колонкой и её файлами';
  st.classList.toggle('warn', !a.enabled && !isLocalHost);
  $('#pw-set').textContent = a.enabled ? 'Сменить' : 'Задать';
  $('#pw-off').hidden = $('#pw-logout').hidden = !a.enabled;
  $('#pw-cur').hidden = !a.enabled;
  const others = Math.max(0, (a.sessions || 0) - 1);
  $('#pw-others-row').hidden = !others;
  $('#pw-others-n').textContent = `Ещё ${others} — браузеры, где выполнен вход`;
  renderInstall();
}
function pwForm(mode) {
  const f = $('#pw-form');
  f.hidden = !mode; f.dataset.mode = mode || '';
  if (!mode) return;
  f.reset();
  const off = mode === 'off';
  $('#pw-cur').hidden = !accessInfo?.enabled;
  $('#pw-new').hidden = $('#pw-new2').hidden = off;
  $('#pw-save').textContent = off ? 'Убрать пароль' : 'Сохранить';
  $('#pw-save').classList.toggle('danger', off);
  (accessInfo?.enabled ? $('#pw-cur') : $('#pw-new')).focus();
}
$('#pw-set').onclick = () => pwForm('set');
$('#pw-off').onclick = () => pwForm('off');
$('#pw-cancel').onclick = () => pwForm(null);
$('#pw-form').onsubmit = e => {
  e.preventDefault();
  const off = $('#pw-form').dataset.mode === 'off', cur = $('#pw-cur').value, nw = $('#pw-new').value;
  if (!off && nw !== $('#pw-new2').value) return toast('Пароли не совпадают', true);
  act($('#pw-save'), async () => {
    if (off) await authPost('/api/panel-auth/disable', { current: cur });
    else await authPost('/api/panel-auth/password', { current: cur, password: nw });
    pwForm(null);
    await loadAccess();
  }, off ? 'Пароль убран' : 'Пароль сохранён, другие входы завершены');
};
$('#pw-logout').onclick = e => act(e.currentTarget, async () => { await authPost('/api/panel-auth/logout'); await connCheck(); });
$('#pw-others').onclick = e => act(e.currentTarget, async () => {
  const r = await authPost('/api/panel-auth/logout-others'); await loadAccess(); return r;
}, 'Другие входы завершены');

// Что панель поставила на колонку, и полный откат.
let footprint = null;
async function loadFootprint() {
  try { footprint = await api('/api/footprint'); } catch { return; }
  const f = footprint, kb = x => x >= 1024 ? (x / 1024).toFixed(1) + ' МБ' : x + ' КБ';
  $('#fp-list').innerHTML = f.items.map(i => `<div class="fp-item${i.on ? ' on' : ''}"><i></i><span>${esc(i.name)}`
    + `${i.on && (i.detail || i.size_kb) ? ` <small>${esc([i.detail, i.size_kb ? kb(i.size_kb) : ''].filter(Boolean).join(' · '))}</small>` : ''}`
    + `${i.on ? '' : ' <small>— нет</small>'}</span></div>`).join('');
  $('#fp-info').textContent = f.any ? `Всё лежит в ${f.dir} · ${kb(f.size_kb)}` + (f.yam_installed ? ' · yam не затрагивается, у него своё удаление' : '')
    : 'Сейчас на колонке ничего от панели нет';
  $('#fp-reset').disabled = !f.any;
  loadPrivacy();
}
async function loadPrivacy() {
  let p;
  try { p = await api('/api/privacy'); } catch { return; }
  $('#privacy-on').checked = p.enabled;
  $('#privacy-purge').hidden = !(p.enabled && p.queued > 16);
  $('#privacy-on').disabled = false;
  const q = p.queued > 16 ? ` Сейчас в очереди ${(p.queued / 1024).toFixed(1)} КБ.` : '';
  $('#privacy-state').textContent = p.enabled
    ? (p.blocked ? `Включено: ${p.hosts.join(', ')} → 127.0.0.1. Неотправленная аналитика удаляется `
        + `при каждом включении колонки.${q}`
      : 'Включено, но адрес аналитики всё ещё доступен — попробуйте выключить и включить снова')
    : 'Адреса сбора статистики (clck, appmetrica, metrica) ведут в никуда. Системный раздел не меняется, Алиса и музыка работают как обычно';
}
$('#privacy-purge').onclick = e => {
  e.preventDefault();   // кнопка внутри <label> — не переключать блокировку
  act(e.currentTarget, async () => { await api('/api/privacy/purge', {}); await loadPrivacy(); }, 'Накопленная аналитика удалена');
};
$('#privacy-on').onchange = e => {
  const on = e.target.checked;
  e.target.disabled = true;
  api('/api/privacy', {enabled: on})
    .then(() => toast(on ? 'Аналитика заблокирована' : 'Блокировка аналитики снята'))
    .catch(err => toast(err.message, true))
    .finally(loadFootprint);
};
$('#fp-reset').onclick = e => {
  if (!confirm('Удалить с колонки всё, что поставила панель?\n\n• своя заставка и звук запуска — вернутся стандартные;\n'
    + '• будильники и их звуки;\n• блокировка аналитики;\n• флаги автозапуска;\n• строка в rootkeeper.sh и копии оригиналов.\n\nКолонку перезагружать не нужно.')) return;
  act(e.currentTarget, async () => {
    footprint = await api('/api/footprint/reset', {});
    await loadFootprint();
    if (footprint?.note) toast(footprint.note, true);
    bootLoaded = false; alarmsData = null;
  }, 'С колонки удалено всё, что ставила панель');
};

// Резервная копия: файлы панели с колонки + настройки этого браузера (localStorage).
const UI_KEYS = /^(ui|ov|ch|snd)\./;
$('#bk-save').onclick = e => act(e.currentTarget, async () => {
  const ui = {};
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (UI_KEYS.test(k)) ui[k] = localStorage.getItem(PanelContext.storageKey(k)); } } catch {}
  const r = await PanelContext.fetch('/api/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ui }) });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.statusText);
  const name = /filename="([^"]+)"/.exec(r.headers.get('Content-Disposition') || '')?.[1] || 'stantsiya-backup.tar.gz';
  const a = document.createElement('a'); a.href = URL.createObjectURL(await r.blob()); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}, 'Копия скачана');
$('#bk-restore').onclick = () => $('#bk-file').click();
$('#bk-file').onchange = async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f || !confirm(`Восстановить из «${f.name}»?\n\nТо, что сейчас стоит на колонке от панели (заставка, звук запуска, будильники), `
    + 'будет заменено содержимым копии. Оформление и раскладка этого браузера тоже вернутся из копии.')) return;
  toast('Восстанавливаем… это может занять минуту');
  const r = await act($('#bk-restore'), () => api('/api/backup/restore', f, { raw: true, headers: { 'Content-Type': 'application/gzip' } }));
  if (!r) return;
  try { for (const [k, v] of Object.entries(r.ui || {})) if (UI_KEYS.test(k)) localStorage.setItem(PanelContext.storageKey(k), v); } catch {}
  applyUI();
  try { const saved = JSON.parse(store.get(LAYOUT_KEY)); if (saved) applyLayout(saved); } catch {}
  bootLoaded = false; alarmsData = null;
  await loadFootprint();
  const when = r.created ? new Date(r.created.replace(/([+-]\d\d)(\d\d)$/, '$1:$2')).toLocaleString('ru-RU') : '';
  toast('Восстановлено' + (when ? ` (копия от ${when})` : '') + ': ' + (r.restored.length ? r.restored.join(', ') : 'на колонке ничего не было'));
};

// Установка: Chrome/Edge дают событие beforeinstallprompt, но только на HTTPS (или localhost).
listen(window, 'beforeinstallprompt', e => { e.preventDefault(); installEvt = e; renderInstall(); });
listen(window, 'appinstalled', () => { installEvt = null; renderInstall(); toast('Панель установлена'); });
function renderInstall() {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const hint = $('#app-hint'), st = $('#app-state'), a = accessInfo || {}, httpsPort = a.ports?.https;
  $('#app-install').hidden = !installEvt;
  // сертификат нужен другим устройствам, чтобы открыть панель по HTTPS
  $('#app-ca-row').hidden = !(a.ca && httpsPort);
  hint.hidden = true;
  if (standalone) { st.textContent = 'Панель уже открыта как приложение'; return; }
  if (installEvt) { st.textContent = 'Появится иконка, панель откроется в отдельном окне'; return; }
  if (!isSecureContext) {
    st.textContent = 'Браузер разрешает установку только по HTTPS';
    if (httpsPort) {
      const url = `https://${location.hostname}:${httpsPort}${PanelContext.basePath}`;
      hint.innerHTML = `Откройте панель по адресу <a href="${url}">${esc(url)}</a>. Чтобы браузер ей доверял, один раз установите сертификат (строка ниже): `
        + 'на Android — «Настройки → Безопасность → Шифрование и учётные данные → Установить сертификат → Сертификат ЦС»; '
        + 'на iPhone — открыть файл, затем «Основные → Об этом устройстве → Доверие сертификатам».';
    } else hint.textContent = 'HTTPS выключен: запустите server.py без --https-port 0.';
    hint.hidden = false;
    return;
  }
  st.textContent = 'Через меню браузера: «Установить приложение» или «На экран „Домой“»';
}
$('#app-install').onclick = async () => {
  if (!installEvt) return;
  installEvt.prompt();
  await installEvt.userChoice.catch(() => null);
  installEvt = null; renderInstall();
};
if ('serviceWorker' in navigator && isSecureContext) navigator.serviceWorker.register(PanelContext.url('/sw.js'), {scope:PanelContext.basePath}).catch(() => {});
loadAccess();

// ---------- графики ----------
// Каждая метрика — свой график с одной осью; наведение двигает перекрестие сразу на всех.
const CHARTS = [
  { k: 'cpu', name: 'Процессор', unit: '%', min: 0, max: 100, fmt: v => Math.round(v) },
  { k: 'temp', name: 'Температура', unit: '°C', pad: 2, fmt: v => v.toFixed(1) },
  { k: 'mem', name: 'Память занята', unit: 'МБ', min: 0, total: true, fmt: v => Math.round(v) },
  { k: 'rssi', name: 'Сигнал Wi‑Fi', unit: 'дБм', pad: 3, fmt: v => Math.round(v), note: 'ближе к нулю — лучше' },
  { k: 'disk', name: 'Диск /data занят', unit: 'МБ', min: 0, total: true, fmt: v => v.toFixed(1) },
  { k: 'load', name: 'Средняя нагрузка', unit: '', min: 0, fmt: v => v.toFixed(2), note: 'load average за минуту' },
];
const EV_TEXT = { reboot: '⟲', offline: '⨯', online: '✓', alarm: '⏰' };
let chData = null, chRange = +(store.get('ch.range') || 3600), chHover = null, chTimer;
$('#ch-grid').innerHTML = CHARTS.map(c => `<section class="card chart-card">
  <div class="chart-head"><h2>${c.name}</h2><div class="chart-val" id="ch-${c.k}-v">—</div></div>
  <div class="chart-sub" id="ch-${c.k}-sub">${c.note || ''}</div>
  <svg class="chart-svg" id="ch-${c.k}" role="img" aria-label="${c.name}"></svg></section>`).join('');
const hm = t => { const d = new Date(t * 1000); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
function niceTicks(lo, hi, n = 3) {
  const span = hi - lo || 1, raw = span / n, mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => span / s <= n) || 10 * mag;
  // шкала накрывает данные целиком: от «круглого» снизу до «круглого» сверху
  const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step - 1e-9) * step, out = [];
  for (let v = a; v <= b + step * 1e-9; v += step) out.push(+v.toFixed(6));
  return { ticks: out, lo: out[0], hi: out[out.length - 1] };
}
async function loadCharts() {
  clearTimeout(chTimer);
  if (shownTab !== 'charts') return;
  try { chData = await api('/api/metrics?range=' + chRange); renderCharts(); } catch (e) { if (!e.offline) toast(e.message, true); }
  chTimer = setTimeout(loadCharts, 10000);
}
function chGeom(svg) {
  const W = svg.clientWidth || 600, H = svg.clientHeight || 150;
  return { W, H, L: 40, R: 8, T: 8, B: 20 };
}
function xOf(g, t) { return g.L + (t - chData.from) / (chData.to - chData.from) * (g.W - g.L - g.R); }
function renderCharts() {
  const d = chData; if (!d) return;
  $$('#ch-range button').forEach(b => b.classList.toggle('active', +b.dataset.v === chRange));
  const xt = { 900: 300, 3600: 900, 21600: 3600, 86400: 4 * 3600 }[chRange] || 3600;
  const xTicks = []; for (let t = Math.ceil(d.from / xt) * xt; t <= d.to; t += xt) xTicks.push(t);
  for (const c of CHARTS) {
    const svg = $('#ch-' + c.k), g = chGeom(svg), vals = d[c.k];
    const pts = d.t.map((t, i) => [t, vals[i]]).filter(p => p[1] != null);
    svg.setAttribute('viewBox', `0 0 ${g.W} ${g.H}`);
    if (!pts.length) { svg.innerHTML = `<text class="axis" x="${g.W / 2}" y="${g.H / 2}" text-anchor="middle">Данных пока нет</text>`; c.y = null; continue; }
    // память и диск — от нуля до полного объёма, чтобы было видно долю занятого
    const cmax = c.total && d.totals?.[c.k] ? d.totals[c.k] : c.max;
    let lo = c.min ?? Math.min(...pts.map(p => p[1])) - (c.pad || 0), hi = cmax ?? Math.max(...pts.map(p => p[1])) + (c.pad || 0);
    if (c.min != null && cmax == null) hi = Math.max(hi * 1.1, lo + 1);
    const nt = niceTicks(lo, hi); lo = c.min ?? nt.lo; hi = cmax ?? nt.hi;
    const y = v => g.T + (1 - (v - lo) / (hi - lo || 1)) * (g.H - g.T - g.B);
    c.y = y; c.g = g;
    // линия рвётся там, где данных не было (null от сервера)
    let path = '', area = '', run = [];
    const flush = () => {
      if (!run.length) return;
      const seg = run.map((p, i) => {
        const X = xOf(g, p[0]).toFixed(1), Y = y(p[1]).toFixed(1);
        if (c.step && i) return `H${X}V${Y}`;
        return (i ? 'L' : 'M') + X + ',' + Y;
      }).join('');
      path += seg;
      area += seg + `V${(g.H - g.B).toFixed(1)}H${xOf(g, run[0][0]).toFixed(1)}Z`;
      run = [];
    };
    d.t.forEach((t, i) => { if (vals[i] == null) flush(); else run.push([t, vals[i]]); });
    flush();
    svg.innerHTML =
      (cmax && c.total ? [0, Math.round(cmax / 2), cmax] : nt.ticks.filter(v => v >= lo && v <= hi)).map(v => `<line class="grid" x1="${g.L}" x2="${g.W - g.R}" y1="${y(v)}" y2="${y(v)}"/>`
        + `<text class="axis" x="${g.L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('')
      + xTicks.map(t => `<text class="axis" x="${xOf(g, t)}" y="${g.H - 4}" text-anchor="middle">${hm(t)}</text>`).join('')
      + d.events.map(e => `<line class="ev" x1="${xOf(g, e.t)}" x2="${xOf(g, e.t)}" y1="${g.T}" y2="${g.H - g.B}"><title>${hm(e.t)} ${esc(e.text)}</title></line>`).join('')
      + `<path class="area" d="${area}"/><path class="line" d="${path}"/>`
      + `<g class="hover" visibility="hidden"><line class="cross" y1="${g.T}" y2="${g.H - g.B}"/><circle class="dot" r="4"/></g>`;
  }
  // полоса воспроизведения
  const ps = $('#ch-play'), pg = { ...chGeom(ps), T: 4, B: 18 };
  ps.setAttribute('viewBox', `0 0 ${pg.W} ${pg.H}`);
  const bw = Math.max(1, (pg.W - pg.L - pg.R) * d.step / (d.to - d.from));
  ps.innerHTML = `<line class="grid" x1="${pg.L}" x2="${pg.W - pg.R}" y1="${pg.H - pg.B}" y2="${pg.H - pg.B}"/>`
    + d.t.map((t, i) => d.play[i] ? `<rect class="bar" x="${(xOf(pg, t) - bw / 2).toFixed(1)}" y="${pg.T}" width="${bw.toFixed(1)}" height="${pg.H - pg.T - pg.B}" rx="1"/>` : '').join('')
    + xTicks.map(t => `<text class="axis" x="${xOf(pg, t)}" y="${pg.H - 3}" text-anchor="middle">${hm(t)}</text>`).join('')
    + `<g class="hover" visibility="hidden"><line class="cross" y1="${pg.T}" y2="${pg.H - pg.B}"/></g>`;
  const played = d.play.filter(Boolean).length * d.step;
  $('#ch-play-v').innerHTML = played ? `${played >= 3600 ? (played / 3600).toFixed(1) + '<span>ч</span>' : Math.round(played / 60) + '<span>мин</span>'}` : '—';
  $('#ch-events').innerHTML = d.events.length ? d.events.slice().reverse().map(e =>
    `<div class="ev-row"><time>${hm(e.t)}</time><span>${EV_TEXT[e.type] || '•'} ${esc(e.text)}</span></div>`).join('')
    : '<span class="meta">За этот период ничего не случилось</span>';
  showHover(chHover);
}
function showHover(t) {
  const d = chData; if (!d) return;
  let i = -1;
  if (t != null) {
    let best = Infinity;
    d.t.forEach((x, k) => { const dd = Math.abs(x - t); if (dd < best) { best = dd; i = k; } });
  }
  for (const c of CHARTS) {
    const svg = $('#ch-' + c.k), h = svg.querySelector('.hover');
    const vals = d[c.k];
    // без наведения — последнее значение
    let k = i;
    if (k < 0) for (k = vals.length - 1; k >= 0 && vals[k] == null; k--);
    const v = k >= 0 ? vals[k] : null;
    const tot = c.total && d.totals?.[c.k];
    $('#ch-' + c.k + '-v').innerHTML = v == null ? '—' : `${c.fmt(v)}<span>${c.unit}${tot ? ` из ${tot} · ${Math.round(v / tot * 100)}%` : ''}</span>`;
    $('#ch-' + c.k + '-sub').textContent = i >= 0 ? `в ${hm(d.t[i])}` + (d.step > d.interval ? ` · среднее за ${d.step >= 60 ? Math.round(d.step / 60) + ' мин' : d.step + ' с'}` : '') : (c.note || 'сейчас');
    if (!h || !c.y) continue;
    if (i < 0) { h.setAttribute('visibility', 'hidden'); continue; }
    const X = xOf(c.g, d.t[i]);
    h.setAttribute('visibility', 'visible');
    h.querySelector('.cross').setAttribute('x1', X); h.querySelector('.cross').setAttribute('x2', X);
    const dot = h.querySelector('.dot');
    if (v == null || k !== i) dot.setAttribute('visibility', 'hidden');
    else { dot.setAttribute('visibility', 'visible'); dot.setAttribute('cx', X); dot.setAttribute('cy', c.y(v)); }
  }
  const ph = $('#ch-play .hover');
  if (ph) {
    if (i < 0) ph.setAttribute('visibility', 'hidden');
    else { const X = xOf({ ...chGeom($('#ch-play')) }, d.t[i]); ph.setAttribute('visibility', 'visible'); ph.querySelector('.cross').setAttribute('x1', X); ph.querySelector('.cross').setAttribute('x2', X); }
    $('#ch-play-sub').textContent = i >= 0 ? `в ${hm(d.t[i])}: ${d.play[i] ? 'играла' : 'тишина'}` : 'когда колонка что-то играла (музыка, ответы Алисы, звуки)';
  }
}
function chPointer(e) {
  const svg = e.currentTarget, r = svg.getBoundingClientRect(), g = chGeom(svg);
  const fx = (e.clientX - r.left - g.L) / (g.W - g.L - g.R);
  if (!chData || fx < 0 || fx > 1) { chHover = null; return showHover(null); }
  chHover = chData.from + fx * (chData.to - chData.from);
  showHover(chHover);
}
$$('#tab-charts .chart-svg').forEach(svg => {
  svg.addEventListener('pointermove', chPointer);
  svg.addEventListener('pointerleave', () => { chHover = null; showHover(null); });
});
$$('#ch-range button').forEach(b => b.onclick = () => { chRange = +b.dataset.v; store.set('ch.range', chRange); loadCharts(); });
new ResizeObserver(() => shownTab === 'charts' && renderCharts()).observe($('#ch-grid'));
$('#ch-clear').onclick = e => {
  if (!confirm('Стереть всю историю графиков?')) return;
  act(e.currentTarget, async () => { await api('/api/metrics/clear', {}); await loadCharts(); }, 'История очищена');
};
$('#ch-csv').onclick = () => {
  const d = chData; if (!d) return;
  const rows = [['время', ...CHARTS.map(c => c.name + (c.unit ? ', ' + c.unit : '')), 'играла']];
  d.t.forEach((t, i) => rows.push([new Date(t * 1000).toLocaleString('ru-RU'), ...CHARTS.map(c => d[c.k][i] ?? ''), d.play[i] ?? '']));
  const blob = new Blob(['\ufeff' + rows.map(r => r.join(';')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `stantsiya-${hm(d.to).replace(':', '')}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

// ---------- будильник ----------
// Будильники хранятся на колонке (alarms.conf), панель только редактирует их и показывает состояние.
const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const AL_MODES = {
  wave: { name: 'Моя волна', hint: 'Алиса включит «Мою волну».' },
  show: { name: 'Утреннее шоу', hint: 'Утреннее шоу Алисы: музыка, погода, новости.' },
  music: { name: 'Музыка', cap: 'Что включить', ph: 'например: плейлист дня, Queen, джаз', hint: 'Алиса получит запрос «включи …».' },
  text: { name: 'Запрос Алисе', cap: 'Что сказать Алисе', ph: 'например: доброе утро', hint: 'Запрос уходит Алисе как есть, будто вы сказали его вслух.' },
  sound: { name: 'Звук', hint: 'Играет по кругу прямо с колонки — не нужен ни интернет, ни Алиса.' },
};
let alarmsData = null, alEditing = null, alUploaded = [];
// у системных звуков в sound_name лежит путь (common/timer.wav), у своих — имя файла
const sndName = a => a.sound.startsWith('u_') ? a.sound_name : (a.sound_name || 'common/timer.wav').split('/').pop().replace(/\.[^.]+$/, '');
function daysText(d) {
  if (!d) return 'Один раз';
  if (d === '1234567') return 'Каждый день';
  if (d === '12345') return 'По будням';
  if (d === '67') return 'По выходным';
  return [...d].map(x => DAY_NAMES[x - 1]).join(', ');
}
function nextFire(a) {
  // ближайшее срабатывание по времени браузера (часовой пояс — как у компьютера с панелью)
  const [h, m] = a.time.split(':').map(Number), now = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, h, m);
    const dow = (d.getDay() + 6) % 7 + 1;
    if (d > now && (!a.days || a.days.includes(dow))) return d;
  }
  return null;
}
function inText(ms) {
  const min = Math.round(ms / 60000), h = Math.floor(min / 60), m = min % 60;
  return 'через ' + (h ? `${h} ч ` : '') + (m || !h ? `${m} мин` : '');
}
async function loadAlarms() {
  try { alarmsData = await api('/api/alarms'); } catch (e) { if (!e.offline) $('#al-list').innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
  renderAlarms();
}
function renderAlarms() {
  const d = alarmsData; if (!d) return;
  const on = d.alarms.filter(a => a.on);
  const next = on.map(a => [a, nextFire(a)]).filter(x => x[1]).sort((x, y) => x[1] - y[1])[0];
  $('#al-badge').textContent = !d.alarms.length ? 'нет' : next ? `ближайший ${inText(next[1] - Date.now())}` : 'все выключены';
  $('#al-badge').className = 'badge' + (on.length && d.running ? ' ok' : on.length && !d.running ? ' bad' : '');
  if (on.length && !d.running) $('#al-badge').textContent = 'демон не запущен — сохраните ещё раз';
  $('#al-list').innerHTML = d.alarms.length ? d.alarms.map(a => {
    const m = AL_MODES[a.mode] || AL_MODES.sound;
    const what = a.mode === 'music' ? `Включить: ${a.query}` : a.mode === 'text' ? `«${a.query}»` : m.name;
    const extra = [a.mode !== 'sound' ? `иначе звук «${sndName(a)}»` : `звук «${sndName(a)}»`,
                   `громкость ${a.volume * 10}%`, a.ramp ? `нарастание ${a.ramp >= 60 ? a.ramp / 60 + ' мин' : a.ramp + ' с'}` : ''].filter(Boolean).join(' · ');
    return `<div class="al-row${a.on ? '' : ' off'}" data-id="${esc(a.id)}">
      <div class="al-time">${esc(a.time)}</div>
      <div class="al-info"><b>${esc(a.label || daysText(a.days))}</b>
        <div class="meta">${esc(a.label ? daysText(a.days) + ' · ' : '')}${esc(what)}</div><div class="meta">${esc(extra)}</div></div>
      <div class="actions">
        <input type="checkbox" data-a="toggle" ${a.on ? 'checked' : ''} aria-label="Включён" title="Включён">
        <button class="btn sm" data-a="test" title="Сработает прямо сейчас">Проверить</button>
        <button class="btn sm" data-a="edit">Изменить</button>
      </div></div>`;
  }).join('') : '<div class="empty">Будильников пока нет</div>';
  $('#al-tz').textContent = d.pc_tz || 'неизвестен (используется UTC)';
  $('#al-devtime').textContent = d.device_time?.hm ? `на колонке ${d.device_time.hm} ${d.device_time.zone || ''}` : '';
  // в журнале демона — id; показываем вместо них время и подпись
  const alName = id => { const a = d.alarms.find(x => x.id === id); return a ? a.time + (a.label ? ' ' + a.label : '') : id; };
  $('#al-log').textContent = d.log.length ? d.log.slice().reverse().map(l => l.replace(/ ([0-9a-f]{8}): /, (_, id) => ` ${alName(id)}: `)).join('\n') : 'Пока пусто';
  const sn = d.snooze;
  $('#al-snoozed').hidden = !sn;
  if (sn) {
    const a = d.alarms.find(x => x.id === sn.id), t = new Date(sn.at * 1000);
    $('#al-snoozed-text').textContent = `Отложенный будильник${a?.label ? ' «' + a.label + '»' : ''} зазвонит в ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  }
  renderAlarmBar();
  // без установки на колонку — только карточка установки
  const inst = d.installed;
  $('#al-setup').hidden = inst;
  ['#al-list-card', '#al-cols', '#al-add'].forEach(x => $(x).hidden = !inst);
  if (!inst) { $('#al-editor').hidden = true; $('#al-snoozed').hidden = true; }
  $('#al-install-note').textContent = d.ffmpeg ? '' : 'Для перекодирования установи FFmpeg в среде панели.';
  $('#al-install').disabled = !d.ffmpeg;
  $('#al-inst-info').textContent = `${d.dir}${d.size_kb != null ? ' · ' + (d.size_kb >= 1024 ? (d.size_kb / 1024).toFixed(1) + ' МБ' : d.size_kb + ' КБ') : ''}`
    + (d.outdated ? ' · есть новая версия скрипта' : '');
  $('#al-update').hidden = !d.outdated;
}
function renderAlarmBar() {
  const st = alarmsData?.state, bar = $('#alarm-bar');
  bar.hidden = !st?.ringing;
  if (!st?.ringing) return;
  const a = alarmsData.alarms.find(x => x.id === st.id);
  $('#ab-title').textContent = 'Будильник' + (a ? ' ' + a.time : '') + (a?.label ? ' · ' + a.label : '');
  $('#ab-sub').textContent = st.via === 'alice' ? 'играет Алиса' : st.via === 'starting' ? 'включаем…' : 'играет звук';
  $('#ab-snooze').hidden = !a?.snooze;
  if (a?.snooze) $('#ab-snooze').textContent = `Отложить на ${a.snooze} мин`;
}
// на колонке системный звук хранится перекодированным (s_*.wav) — серверу отдаём исходный путь
const alToSave = a => ({ ...a, sound: a.sound.startsWith('s_') ? 'sys:' + a.sound_name : a.sound });
async function saveAlarms(list, msg) {
  alarmsData = await api('/api/alarms', { alarms: list });
  renderAlarms();
  if (msg) toast(msg);
}
$('#al-list').onclick = e => {
  const b = e.target.closest('[data-a]'), row = e.target.closest('.al-row');
  if (!b || !row) return;
  const a = alarmsData.alarms.find(x => x.id === row.dataset.id);
  if (b.dataset.a === 'edit') openAlarm(a);
  if (b.dataset.a === 'test') act(b, async () => { await api('/api/alarms/test', { id: a.id }); setTimeout(loadAlarms, 2500); }, 'Сейчас зазвонит…');
};
$('#al-list').onchange = e => {
  if (e.target.dataset.a !== 'toggle') return;
  const id = e.target.closest('.al-row').dataset.id;
  const list = alarmsData.alarms.map(a => alToSave(a.id === id ? { ...a, on: e.target.checked } : a));
  act(null, () => saveAlarms(list, e.target.checked ? 'Будильник включён' : 'Будильник выключен'));
};
$('#al-days').innerHTML = DAY_NAMES.map((n, i) => `<button type="button" class="chip" data-d="${i + 1}" aria-pressed="false">${n}</button>`).join('');
$('#al-days').onclick = e => { const c = e.target.closest('.chip'); if (c) c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') !== 'true'); };
$('#al-presets').onclick = e => { const c = e.target.closest('.chip'); if (c) setDays(c.dataset.d); };
function setDays(d) { $$('#al-days .chip').forEach(c => c.setAttribute('aria-pressed', d.includes(c.dataset.d))); }
const getDays = () => $$('#al-days .chip').filter(c => c.getAttribute('aria-pressed') === 'true').map(c => c.dataset.d).join('');
function fillSounds(sel) {
  const groups = {};
  (sounds || []).forEach(n => { const [g, ...r] = n.split('/'); (groups[r.length ? g : ''] ||= []).push(n); });
  const up = [...new Map([...alUploaded, ...(alarmsData?.alarms || []).filter(a => a.sound.startsWith('u_')).map(a => ({ sound: a.sound, sound_name: a.sound_name }))]
    .map(u => [u.sound, u])).values()];
  $('#al-sound').innerHTML = (up.length ? `<optgroup label="Свои">${up.map(u => `<option value="${esc(u.sound)}">${esc(u.sound_name)}</option>`).join('')}</optgroup>` : '')
    + Object.entries(groups).map(([g, l]) => `<optgroup label="${esc(g || 'Система')}">${l.map(n => `<option value="sys:${esc(n)}">${esc(n.split('/').pop().replace(/\.[^.]+$/, ''))}</option>`).join('')}</optgroup>`).join('');
  $('#al-sound').value = sel;
  if ($('#al-sound').selectedIndex < 0) $('#al-sound').value = 'sys:common/timer.wav';
}
function alModeUI() {
  const m = $('#al-mode').value, info = AL_MODES[m];
  $('#al-query-l').hidden = !info.cap;
  if (info.cap) { $('#al-query-cap').textContent = info.cap; $('#al-query').placeholder = info.ph; }
  $('#al-mode-hint').textContent = info.hint + (m === 'sound' ? '' : ' Нужен интернет; без него или если Алиса не ответит за 30 с — играет звук ниже.');
  $('#al-sound-cap').textContent = m === 'sound' ? 'Звук' : 'Звук, если Алиса не сможет';
  $('#al-dur').querySelector('[value="0"]').disabled = m === 'sound';
  if (m === 'sound' && $('#al-dur').value === '0') $('#al-dur').value = '15';
}
$('#al-mode').onchange = alModeUI;
$('#al-vol').oninput = () => $('#al-vol-v').textContent = $('#al-vol').value * 10;
function openAlarm(a) {
  alEditing = a || null;
  const x = a || { time: '07:30', days: '12345', mode: 'wave', query: '', sound: '', volume: 5, ramp: 180, duration: 15, snooze: 9, label: '' };
  $('#al-ed-title').textContent = a ? 'Будильник ' + a.time : 'Новый будильник';
  $('#al-time').value = x.time; $('#al-label').value = x.label; setDays(x.days);
  $('#al-mode').value = x.mode; $('#al-query').value = x.query;
  fillSounds(x.sound.startsWith('u_') ? x.sound : x.sound.startsWith('s_') ? 'sys:' + x.sound_name : 'sys:common/timer.wav');
  $('#al-vol').value = x.volume; $('#al-vol').oninput();
  $('#al-ramp').value = String(x.ramp); if ($('#al-ramp').selectedIndex < 0) $('#al-ramp').value = '180';
  $('#al-dur').value = String(x.duration); if ($('#al-dur').selectedIndex < 0) $('#al-dur').value = '15';
  $('#al-snz').value = String(x.snooze); if ($('#al-snz').selectedIndex < 0) $('#al-snz').value = '9';
  $('#al-del').hidden = !a;
  alModeUI();
  $('#al-editor').hidden = false;
  $('#al-editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
$('#al-add').onclick = () => openAlarm(null);
$('#al-cancel').onclick = () => { $('#al-editor').hidden = true; };
$('#al-form').onsubmit = e => {
  e.preventDefault();
  const snd = $('#al-sound').value, opt = $('#al-sound').selectedOptions[0];
  const item = {
    id: alEditing?.id, on: alEditing ? alEditing.on : true, time: $('#al-time').value, days: getDays(),
    mode: $('#al-mode').value, query: $('#al-query').value.trim(), label: $('#al-label').value.trim(),
    sound: snd, sound_name: snd.startsWith('sys:') ? snd.slice(4) : opt?.textContent || '',
    volume: +$('#al-vol').value, ramp: +$('#al-ramp').value, duration: +$('#al-dur').value, snooze: +$('#al-snz').value,
  };
  if (alEditing && (alEditing.time !== item.time || alEditing.days !== item.days)) item.on = true;
  const list = (alarmsData?.alarms || []).filter(a => a.id !== alEditing?.id).map(alToSave);
  list.push(item);
  list.sort((a, b) => a.time.localeCompare(b.time));
  act($('#al-save'), async () => { await saveAlarms(list); $('#al-editor').hidden = true; }, 'Будильник сохранён на колонке');
};
$('#al-del').onclick = e => {
  if (!alEditing || !confirm('Удалить будильник ' + alEditing.time + '?')) return;
  const list = alarmsData.alarms.filter(a => a.id !== alEditing.id).map(alToSave);
  act(e.currentTarget, async () => { await saveAlarms(list); $('#al-editor').hidden = true; }, 'Будильник удалён');
};
$('#al-sound-play').onclick = e => {
  const v = $('#al-sound').value;
  if (!v.startsWith('sys:')) return toast('Свой звук можно послушать кнопкой «Проверить» после сохранения');
  act(e.currentTarget, () => api('/api/play', { name: v.slice(4) }));
};
$('#al-sound-up').onclick = () => $('#al-sound-file').click();
$('#al-sound-file').onchange = async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  toast('Загружаем ' + f.name + '…');
  const r = await act($('#al-sound-up'), () => api('/api/alarms/sound', f, {
    raw: true, headers: { 'Content-Type': 'application/octet-stream', 'X-Filename': encodeURIComponent(f.name) } }), 'Звук загружен');
  if (r) { alUploaded.push(r); fillSounds(r.sound); }
};
$('#al-install').onclick = e => act(e.currentTarget, async () => { alarmsData = await api('/api/alarms/install', {}); renderAlarms(); }, 'Будильник установлен на колонку');
$('#al-update').onclick = e => act(e.currentTarget, async () => { alarmsData = await api('/api/alarms/install', {}); renderAlarms(); }, 'Скрипт обновлён');
$('#al-uninstall').onclick = e => {
  const n = alarmsData?.alarms.length || 0;
  if (!confirm('Удалить будильник с колонки?' + (n ? ` Все будильники (${n}) и загруженные звуки будут удалены.` : '')
               + ' Строка автозапуска уберётся из rootkeeper.sh, если она больше ничему не нужна.')) return;
  act(e.currentTarget, async () => { alarmsData = await api('/api/alarms/uninstall', {}); renderAlarms(); }, 'Будильник удалён с колонки');
};
$('#al-snooze-cancel').onclick = e => act(e.currentTarget, async () => { await api('/api/alarms/cmd', { action: 'cancel_snooze' }); await loadAlarms(); }, 'Отложенный будильник отменён');
$('#ab-stop').onclick = e => act(e.currentTarget, async () => { await api('/api/alarms/cmd', { action: 'stop' }); setTimeout(loadAlarms, 1500); }, 'Будильник выключен');
$('#ab-snooze').onclick = e => act(e.currentTarget, async () => { await api('/api/alarms/cmd', { action: 'snooze' }); setTimeout(loadAlarms, 1500); }, 'Отложено');
// Состояние: на вкладке — часто, на остальных — реже и только если будильники вообще есть.
setInterval(() => {
  if (!online || document.hidden) return;
  const onTab = shownTab === 'alarm';
  if (onTab || alarmsData?.state?.ringing || (alarmsData?.installed && alarmsData.alarms.some(a => a.on))) {
    if (onTab || Date.now() - (loadAlarms.t || 0) > 15000 || alarmsData?.state?.ringing) { loadAlarms.t = Date.now(); loadAlarms(); }
  }
}, 3000);

// ---------- версия панели и обновление ----------
// Сервер раз в 6 часов спрашивает GitHub о последнем релизе. В «Обзоре» — пометка (её можно скрыть
// до следующей версии), в «Настройках» → «О панели» — само обновление.
let panelVer = null;
const UPD_HOW = {
  zip: 'Панель скачает релиз с GitHub, заменит свои файлы и перезапустится. Вход в Яндекс, пароль, история и папка runtime сохранятся.',
  git: 'Панель установлена через git: выполнит git pull и перезапустится.',
  docker: 'Панель работает в Docker — образ обновляется снаружи командой ниже. Данные в томе /data сохранятся.',
};
async function loadPanelModel() {
  let p;
  try { p = await api('/api/profile'); } catch { return; }
  $('#upd-model').textContent = p.name;
  $('#upd-model-how').textContent = p.auto
    ? 'Определена автоматически по плате колонки. Задать вручную — параметр --model'
    : `Задана вручную: --model ${p.id}. Определять автоматически — --model auto (так по умолчанию)`;
}
async function loadPanelVersion(refresh) {
  try { panelVer = await api('/api/panel/version' + (refresh ? '?refresh=1' : '')); }
  catch (e) {
    if (!e.offline) $('#upd-state').textContent = 'Не удалось проверить обновления: ' + e.message;
    throw e;
  }
  renderPanelVersion();
}
function renderPanelVersion() {
  const v = panelVer; if (!v) return;
  const date = d => d ? new Date(d).toLocaleDateString('ru-RU') : '';
  $('#upd-version').textContent = v.version;
  $('#upd-repo').href = v.repo;
  const checked = v.checked ? ' · проверено ' + new Date(v.checked * 1000).toLocaleTimeString('ru-RU') : '';
  $('#upd-state').textContent = v.error ? 'Не удалось проверить: ' + v.error
    : v.update ? 'Доступна версия ' + v.latest + checked
    : v.latest ? 'Установлена последняя версия' + checked : 'Нет данных о релизе';
  $('#upd-state').classList.toggle('warn', !!v.update || !!v.error);
  $('#upd-row').hidden = !v.update;
  if (v.update) {
    $('#upd-latest').textContent = v.latest + (v.latest_date ? ` от ${date(v.latest_date)}` : '');
    $('#upd-how').textContent = v.multi ? 'Обновятся шлюз и все процессы колонок; данные сохранятся.' : (UPD_HOW[v.install] || '');
    $('#upd-notes').href = v.url || v.repo;
    $('#upd-go').hidden = v.install === 'docker';
  }
  $('#upd-cmd').hidden = !(v.update && v.install === 'docker');
  $('#upd-cmd').textContent = 'docker compose pull && docker compose up -d';
  $('#ov-update').hidden = !v.update || store.get('upd.hide') === v.latest;
  $('#ov-update-text').textContent = `Доступна новая версия панели — ${v.latest}`;
}
$('#ov-update-hide').onclick = () => { store.set('upd.hide', panelVer?.latest || ''); renderPanelVersion(); };
$('#upd-check').onclick = e => act(e.currentTarget, async () => {
  const btn = e.currentTarget; btn.textContent = 'Проверяю…'; $('#upd-state').textContent = 'Проверяю релизы на GitHub…';
  try { await loadPanelVersion(true); if (!panelVer.error && !panelVer.update) toast('Проверено: установлена последняя версия'); }
  finally { btn.textContent = 'Проверить'; }
});
$('#upd-go').onclick = e => {
  if (!confirm(`Обновить панель до ${panelVer.latest}? Сервер перезапустится, страница обновится сама.`)) return;
  const btn = e.currentTarget;
  return act(btn, async () => {
    btn.textContent = 'Обновляем…';
    try {
      const updated = await api('/api/panel/update', {});
      toast('Обновлено, перезапускаемся…');
      // ждём, пока сервер поднимется именно с новой версией, и перезагружаем страницу
      const until = Date.now() + 60000;
      await new Promise(r => setTimeout(r, 2500));
      while (Date.now() < until) {
        try { const r = await PanelContext.fetch('/api/panel/version'); if (r.status === 401 || (r.ok && (await r.json()).version === updated.version)) { location.reload(); return; } } catch {}
        await new Promise(r => setTimeout(r, 1000));
      }
      throw new Error('Сервер не поднялся за минуту — запустите панель вручную');
    } finally { btn.textContent = 'Обновить'; }
  });
};
loadPanelVersion().catch(() => {});
setInterval(() => !document.hidden && loadPanelVersion().catch(() => {}), 6 * 3600 * 1000);

// ---------- подключение ----------
// Сервер сам переподключается к колонке; страница только показывает состояние и после
// подключения (в том числе повторного) заново загружает данные.
let connInfo = null, retryDeadline = 0, connTimer;
const CONN_TEXT = {
  server: ['Сервер панели не отвечает', 'Проверьте, что DARKLS Alice Panel запущена, — страница переподключится сама.', ''],
  connecting: ['Подключаемся к колонке', 'Устанавливаем соединение по adb…', ''],
  waiting: ['Ожидание колонки', 'Колонка пока не в сети: включите её или проверьте Wi‑Fi. Панель подключится сама, как только она появится.', 'wait'],
  adb_error: ['Нет подключения по adb', 'Колонка в сети, но adb не отвечает.', 'err'],
  locked: ['Вход в панель', 'Панель защищена паролем.', 'lock'],
};
function renderConn() {
  const i = connInfo || { state: 'connecting' };
  const [title, text, ring] = CONN_TEXT[i.state] || CONN_TEXT.connecting;
  $('#cs-title').textContent = title;
  let more = '';
  if (i.state === 'adb_error') {
    const left = Math.max(0, Math.ceil((retryDeadline - Date.now()) / 1000));
    more = left ? ` Переподключение через ${left} с.` : ' Переподключаемся…';
    if (i.attempts > 1) more += ` Попытка ${i.attempts}.`;
  }
  $('#cs-text').textContent = text + more;
  $('#cs-addr').innerHTML = i.serial ? secret('ip', i.serial) : '';
  $('#cs-ring').className = 'conn-ring' + (ring ? ' ' + ring : '');
  $('#cs-ring').innerHTML = i.state === 'locked' ? icon('i-lock', 28) : '';
  const locked = i.state === 'locked', form = $('#cs-login');
  if (form.hidden === locked) { form.hidden = !locked; if (locked) setTimeout(() => $('#cs-pass').focus(), 0); }
  $('#cs-retry').hidden = !['adb_error', 'waiting'].includes(i.state);
  $('#cs-log-box').hidden = !(i.log && i.log.length);
  if (i.log) {
    const p = x => String(x).padStart(2, '0');
    $('#cs-log').textContent = i.log.map(l => {
      const d = new Date(l.t * 1000);
      return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}  ${l.level === 'warn' ? '⚠ ' : ''}${l.msg}`;
    }).join('\n');
  }
  $('#conn-box').hidden = !online;
}
async function connCheck() {
  clearTimeout(connTimer);
  try {
    const r = await PanelContext.fetch('/api/conn');
    connInfo = r.status === 401 ? { state: 'locked' } : await r.json();
  } catch { connInfo = { state: 'server' }; }
  if (connInfo.retry_in != null) retryDeadline = Date.now() + connInfo.retry_in * 1000;
  const was = online;
  online = connInfo.state === 'online';
  context.onConnection(online);
  renderConn();
  if (online !== was) { online ? onConnected() : showTab(); updateMinibar(); }
  connTimer = setTimeout(connCheck, online ? 3000 : connInfo.state === 'locked' ? 10000 : 1000);
}
setInterval(() => connInfo?.state === 'adb_error' && renderConn(), 1000);   // обратный отсчёт
$('#cs-login').onsubmit = async e => {
  e.preventDefault();
  const btn = $('#cs-login-btn'), err = $('#cs-login-err');
  btn.disabled = true; err.textContent = '';
  try {
    const r = await PanelContext.fetch('/api/panel-auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                                                     body: JSON.stringify({ password: $('#cs-pass').value }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || r.statusText);
    $('#cs-pass').value = '';
    await connCheck();
    loadAccess();
  } catch (x) { err.textContent = x.message; $('#cs-pass').select(); }
  finally { btn.disabled = false; }
};
$('#cs-retry').onclick = e => act(e.currentTarget, async () => { await PanelContext.fetch('/api/conn/retry', { method: 'POST' }); await connCheck(); });

let statusTimer;
function onConnected() {
  // После переподключения всё, что могло не загрузиться, грузим заново.
  fs.loaded = false; logsLoaded = false; bootLoaded = false;
  showTab();
  refreshStatus();
  clearInterval(statusTimer);
  statusTimer = setInterval(refreshStatus, 5000);
  loadSounds().catch(e => { if (!e.offline) $('#sounds').innerHTML = `<div class="empty">${esc(e.message)}</div>`; });
  api('/api/patterns').then(p => { patterns = p; renderPatterns(); }).catch(e => e.offline || toast(e.message, true));
  loadMusic();
  loadDispState();
  loadAlarms();
  loadBt();
}

// ---------- старт ----------
renderConn();
connCheck();
// A fast local worker can connect before the vendor scripts below have loaded.


showTab();listen(window,'darkls:authchanged',connCheck);
return {showTab,dispose(){scope.abort();for(const id of timers)window.clearTimeout(id);for(const id of intervals)window.clearInterval(id);for(const id of frames)window.cancelAnimationFrame(id);for(const observer of observers)observer.disconnect();for(const [target,event,fn,options] of listeners)target.removeEventListener(event,fn,options);try{const ws=termWs;termWs=null;ws?.close();term?.dispose()}catch{}}};
}
