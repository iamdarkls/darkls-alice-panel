<template>
    <header class="page-head"><div><h1>Запуск</h1><div class="sub">Что колонка показывает и играет при включении</div></div></header>
    <div class="cols">
      <section class="card">
        <div class="card-head"><h2>Когда показывать</h2><span class="badge" id="boot-hook-badge">—</span></div>
        <label class="toggle">
          <span>Показывать при каждой загрузке</span>
          <input type="checkbox" id="boot-always">
        </label>
        <p class="hint">По умолчанию заставка и звук запуска появляются только при первом включении. С этой опцией — при каждом.</p>
      </section>
      <section class="card">
        <div class="card-head"><h2>Звук запуска</h2><span class="badge" id="snd-badge">—</span></div>
        <div class="row" style="gap:8px">
          <button class="btn sm" id="bs-play-default"><svg width="14" height="14" aria-hidden="true"><use href="#i-play"/></svg>Стандартный</button>
          <button class="btn sm" id="bs-play-custom"><svg width="14" height="14" aria-hidden="true"><use href="#i-play"/></svg>Свой</button>
          <button class="btn sm danger-soft" id="bs-stop"><svg width="14" height="14" aria-hidden="true"><use href="#i-stop"/></svg>Стоп</button>
        </div>
        <button class="drop" id="bs-drop">Перетащите аудиофайл или нажмите, чтобы выбрать — он станет звуком запуска</button>
        <input type="file" id="bs-file" accept="audio/*" hidden>
        <div class="row"><button class="btn danger" id="bs-reset">Вернуть стандартный звук</button></div>
        <p class="hint">Файл перекодируется в MP3 44,1 кГц стерео, как оригинальный sounds/common/boot.wav (длительность стандартного — 8 с).</p>
      </section>
    </div>
    <!-- заставка часов -->
    <section class="card" id="boot-card">
      <div class="card-head"><h2>Заставка часов</h2><div class="status-line" id="boot-status">—</div></div>
      <div class="frames" id="boot-frames" aria-label="Кадры"></div>
      <div class="boot-grid">
        <div class="col">
          <div class="display editable" id="boot-editor"></div>
          <p class="hint">Нажимайте на сегменты, чтобы включать и выключать их.</p>
        </div>
        <div class="col">
          <div class="row" style="gap:8px">
            <input type="text" id="boot-text" class="field mono" maxlength="10" placeholder="HI:YA" aria-label="Текст в кадр" style="flex:1;min-width:100px">
            <button class="btn" id="boot-text-apply" style="min-height:42px">Текст в кадр</button>
          </div>
          <div class="row" style="gap:8px">
            <label for="boot-ms" style="min-width:auto">Длительность кадра</label>
            <input type="number" id="boot-ms" class="field mono" min="10" max="65535" step="10" style="width:100px"><span class="meta">мс</span>
          </div>
          <div class="row" style="gap:8px">
            <button class="btn sm" id="boot-dup">Дублировать кадр</button>
            <button class="btn sm" id="boot-left" aria-label="Сдвинуть кадр влево">←</button>
            <button class="btn sm" id="boot-right" aria-label="Сдвинуть кадр вправо">→</button>
            <button class="btn sm" id="boot-clear">Очистить</button>
            <button class="btn sm danger" id="boot-del">Удалить кадр</button>
          </div>
          <div class="row" style="gap:8px">
            <label for="boot-pause" style="min-width:auto">Пауза перед заставкой</label>
            <input type="number" id="boot-pause" class="field mono" min="0" max="65535" step="100" value="3300" style="width:100px"><span class="meta">мс</span>
          </div>
          <p class="hint" id="boot-pause-hint">В стандартной заставке 3,3 с пустого экрана: в первые секунды загрузки дисплей ещё не показывает картинку, и более ранние кадры не видны.</p>
          <div class="row" style="gap:8px; padding-top:12px; border-top:1px solid var(--line-2)">
            <button class="btn sm" id="boot-preview"><svg width="14" height="14" aria-hidden="true"><use href="#i-play"/></svg>В браузере</button>
            <button class="btn sm" id="boot-device"><svg width="14" height="14" aria-hidden="true"><use href="#i-play"/></svg>На колонке</button>
            <button class="btn sm" id="boot-load-default">Открыть стандартную</button>
          </div>
          <div class="row" style="gap:8px">
            <button class="btn primary" id="boot-install">Установить на загрузку</button>
            <button class="btn danger" id="boot-reset">Сбросить на стандартную</button>
          </div>
        </div>
      </div>
    </section>
  </template>