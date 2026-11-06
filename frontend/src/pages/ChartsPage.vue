<template>
    <header class="page-head">
      <div><h1>Графики</h1><div class="sub">Раз в 10 секунд за последние сутки. История хранится на компьютере</div></div>
      <div class="actions">
        <div class="seg" id="ch-range" role="group" aria-label="Период"><button data-v="900">15 мин</button><button data-v="3600">1 ч</button><button data-v="21600">6 ч</button><button data-v="86400">24 ч</button></div>
        <button class="btn sm" id="ch-csv" title="Скачать данные таблицей"><svg width="14" height="14" aria-hidden="true"><use href="#i-dl"/></svg>CSV</button>
        <button class="btn sm" id="ch-clear">Очистить</button>
      </div>
    </header>
    <div class="charts" id="ch-grid"></div>
    <section class="card chart-card">
      <div class="chart-head"><h2>Воспроизведение</h2><div class="chart-val" id="ch-play-v">—</div></div>
      <div class="chart-sub" id="ch-play-sub">когда колонка что-то играла (музыка, ответы Алисы, звуки)</div>
      <svg class="chart-svg strip" id="ch-play" role="img" aria-label="Когда колонка играла звук"></svg>
    </section>
    <section class="card">
      <div class="card-head"><h2>События</h2><span class="meta">отмечены на графиках вертикальными линиями</span></div>
      <div class="ev-list" id="ch-events"><span class="meta">—</span></div>
    </section>
  </template>