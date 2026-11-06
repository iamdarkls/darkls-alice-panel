<template>
    <header class="page-head">
      <div><h1>Файлы</h1><div class="sub">Корень (/) только для чтения — писать можно в /data и /tmp</div></div>
    </header>
    <div class="files-grid">
      <section class="card">
        <div class="row" style="gap:8px">
          <button class="btn sm icon" id="fs-up" aria-label="Наверх"><svg width="16" height="16" aria-hidden="true"><use href="#i-up"/></svg></button>
          <button class="btn sm icon" id="fs-refresh" aria-label="Обновить"><svg width="16" height="16" aria-hidden="true"><use href="#i-refresh"/></svg></button>
          <div class="crumbs" id="fs-crumbs"></div>
          <span class="badge" id="fs-rw"></span>
        </div>
        <div class="row" style="gap:8px">
          <select id="fs-bookmarks" class="field" aria-label="Быстрый переход">
            <option value="">Быстрый переход…</option>
            <option>/data/quasar</option>
            <option>/data/quasar/daemons_logs</option>
            <option>/system/vendor/quasar</option>
            <option>/system/vendor/quasar/sounds</option>
            <option>/tmp</option>
            <option>/etc</option>
            <option>/sys/class/leds</option>
            <option>/</option>
          </select>
          <label class="search" style="flex:1;min-width:140px"><svg width="16" height="16" aria-hidden="true"><use href="#i-search"/></svg>
            <input type="search" id="fs-filter" placeholder="Фильтр по имени" aria-label="Фильтр по имени"></label>
          <label class="row meta" style="gap:6px;font-weight:600"><input type="checkbox" id="fs-hidden" checked> скрытые</label>
        </div>
        <div class="row" style="gap:6px">
          <button class="btn sm" id="fs-upload"><svg width="15" height="15" aria-hidden="true"><use href="#i-ul"/></svg>Загрузить</button>
          <button class="btn sm" id="fs-mkdir"><svg width="15" height="15" aria-hidden="true"><use href="#i-folder"/></svg>Новая папка</button>
          <button class="btn sm" id="fs-newfile"><svg width="15" height="15" aria-hidden="true"><use href="#i-file"/></svg>Новый файл</button>
          <input type="file" id="fs-file" multiple hidden>
        </div>
        <div class="fs-wrap" id="fs-wrap">
          <table class="fs">
            <thead><tr>
              <th data-sort="name">Имя</th><th data-sort="size">Размер</th>
              <th data-sort="mtime" class="hide-sm">Изменён</th><th class="hide-sm">Права</th><th><span class="meta" style="font-weight:600">Действия</span></th>
            </tr></thead>
            <tbody id="fs-body"></tbody>
          </table>
        </div>
        <p class="hint">Перетащите файлы на список, чтобы загрузить их в текущую папку.</p>
      </section>
      <section class="card" id="fs-preview">
        <h2>Просмотр</h2><div class="empty">Выберите файл</div>
      </section>
    </div>
  </template>