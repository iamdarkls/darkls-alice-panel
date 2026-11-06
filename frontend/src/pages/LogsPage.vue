<template>
    <header class="page-head"><div><h1>Логи</h1><div class="sub">Демоны Quasar и журнал ядра</div></div></header>
    <section class="card">
      <div class="row" style="gap:8px">
        <select id="log-name" class="field" aria-label="Лог"></select>
        <select id="log-lines" class="field" aria-label="Строк"><option>100</option><option selected>300</option><option>1000</option></select>
        <button class="btn sm" id="log-load" style="min-height:42px"><svg width="16" height="16" aria-hidden="true"><use href="#i-refresh"/></svg>Обновить</button>
        <label class="toggle" style="min-height:42px;gap:8px;font-size:14px"><input type="checkbox" id="log-follow"> авто (3 с)</label>
        <label class="toggle" style="min-height:42px;gap:8px;font-size:14px" title="Device ID, серийный номер, Wi‑Fi и MAC-адреса, логин, номер аккаунта и токены Яндекса"><input type="checkbox" id="log-mask" checked> скрыть личное</label>
        <label class="search" style="flex:1;min-width:160px"><svg width="16" height="16" aria-hidden="true"><use href="#i-search"/></svg>
          <input type="search" id="log-filter" placeholder="Фильтр" aria-label="Фильтр"></label>
      </div>
      <pre class="out" id="log-out">—</pre>
    </section>
  </template>