<template>
    <header class="page-head">
      <div><h1>Будильник</h1><div class="sub">Локальный: срабатывает на самой колонке, без интернета и без этого компьютера</div></div>
      <div class="actions"><button class="btn primary" id="al-add"><svg width="18" height="18" aria-hidden="true"><use href="#i-plus"/></svg>Новый будильник</button></div>
    </header>
    <section class="card" id="al-setup" hidden>
      <div class="card-head"><h2>Будильник не установлен на колонке</h2><span class="badge">нужна установка</span></div>
      <p style="margin:0;color:var(--text-2)">Локальный будильник работает на самой колонке, поэтому на неё нужно поставить несколько файлов.
        Установка ничего не меняет в прошивке, и её можно в любой момент полностью удалить.</p>
      <ul class="al-points">
        <li>скрипт будильника, ~8 КБ, и звук по умолчанию (таймер Алисы, ~1,7 МБ) — в <code>/data/quasar/webpanel/alarm</code>;</li>
        <li>файл часового пояса этого компьютера — чтобы колонка знала местное время;</li>
        <li>строка автозапуска в <code>/data/quasar/rootkeeper.sh</code> — тот же хук, что у заставки (копия оригинала сохраняется).</li>
      </ul>
      <div class="row"><button class="btn primary" id="al-install">Установить на колонку</button><span class="meta" id="al-install-note"></span></div>
    </section>
    <section class="card" id="al-snoozed" hidden>
      <div class="row" style="justify-content:space-between"><span id="al-snoozed-text">—</span><button class="btn sm" id="al-snooze-cancel">Отменить</button></div>
    </section>
    <section class="card" id="al-editor" hidden>
      <div class="card-head"><h2 id="al-ed-title">Новый будильник</h2></div>
      <form class="al-form" id="al-form">
        <label class="f">Время<input type="time" class="field" id="al-time" required></label>
        <label class="f">Подпись<input type="text" class="field" id="al-label" maxlength="40" placeholder="например, «Работа»"></label>
        <div class="f full"><label class="f" style="flex-direction:row;justify-content:space-between;align-items:center">Повторять
          <span class="chips" id="al-presets"><button type="button" class="chip" data-d="">Один раз</button><button type="button" class="chip" data-d="12345">Будни</button><button type="button" class="chip" data-d="67">Выходные</button><button type="button" class="chip" data-d="1234567">Каждый день</button></span></label>
          <div class="chips day-chips" id="al-days" style="margin-top:8px"></div></div>
        <label class="f full">Что играет
          <select class="field" id="al-mode">
            <option value="wave">Моя волна</option>
            <option value="show">Утреннее шоу Алисы</option>
            <option value="music">Включить музыку…</option>
            <option value="text">Попросить Алису…</option>
            <option value="sound">Только звук (полностью локально)</option>
          </select></label>
        <label class="f full" id="al-query-l" hidden><span id="al-query-cap">Что включить</span><input type="text" class="field" id="al-query" maxlength="200"></label>
        <p class="hint full" id="al-mode-hint"></p>
        <label class="f full"><span id="al-sound-cap">Звук</span>
          <span class="row" style="flex-wrap:nowrap"><select class="field" id="al-sound"></select>
          <button type="button" class="btn sm" id="al-sound-play" title="Послушать"><svg width="14" height="14" aria-hidden="true"><use href="#i-play"/></svg></button>
          <button type="button" class="btn sm" id="al-sound-up" title="Загрузить свой"><svg width="14" height="14" aria-hidden="true"><use href="#i-ul"/></svg></button></span>
          <input type="file" id="al-sound-file" accept="audio/*" hidden></label>
        <label class="f"><span>Громкость: <span id="al-vol-v">50</span>%</span><input type="range" id="al-vol" min="1" max="10" step="1" value="5"></label>
        <label class="f">Нарастание громкости
          <select class="field" id="al-ramp"><option value="0">Сразу</option><option value="30">За 30 с</option><option value="60">За 1 мин</option><option value="180" selected>За 3 мин</option><option value="300">За 5 мин</option><option value="600">За 10 мин</option></select></label>
        <label class="f">Выключить сам через
          <select class="field" id="al-dur"><option value="5">5 мин</option><option value="10">10 мин</option><option value="15" selected>15 мин</option><option value="30">30 мин</option><option value="60">1 час</option><option value="0">Не выключать</option></select></label>
        <label class="f">Отложить на
          <select class="field" id="al-snz"><option value="5">5 мин</option><option value="9" selected>9 мин</option><option value="10">10 мин</option><option value="15">15 мин</option><option value="0">Не откладывать</option></select></label>
        <div class="actions full">
          <button class="btn primary" id="al-save">Сохранить</button>
          <button type="button" class="btn" id="al-cancel">Отмена</button>
          <button type="button" class="btn danger" id="al-del" hidden>Удалить</button>
        </div>
      </form>
    </section>
    <section class="card" id="al-list-card">
      <div class="card-head"><h2>Будильники</h2><span class="badge" id="al-badge">—</span></div>
      <div id="al-list"><div class="empty">Загрузка…</div></div>
    </section>
    <div class="cols" id="al-cols">
      <section class="card">
        <div class="card-head"><h2>Как это работает</h2></div>
        <div class="al-note"><b>Это отдельный, локальный будильник.</b> Он хранится и срабатывает на самой колонке, поэтому,
          в отличие от встроенных будильников Алисы, не зависит от интернета, серверов Яндекса и этого компьютера.
          Будильники из приложения Алисы живут в облаке: здесь их не видно, и работают они как раньше.</div>
        <ul class="al-points">
          <li><b>Музыка Алисы</b> («Моя волна», утреннее шоу, свой запрос) требует интернета. Если его нет или Алиса за 30 секунд
            ничего не включила, вместо музыки играет выбранный звук.</li>
          <li><b>Выключить:</b> кнопка на колонке, «Алиса, стоп» или кнопка в панели. <b>Отложить</b> — из панели.</li>
          <li>Время — по часовому поясу этого компьютера: <span id="al-tz">—</span>.</li>
        </ul>
        <div class="set-item" id="al-inst-row" style="padding-bottom:0">
          <div class="set-label"><b>Установлено на колонке</b><small id="al-inst-info">—</small></div>
          <div class="set-ctl"><button class="btn sm" id="al-update" hidden>Обновить скрипт</button><button class="btn sm danger" id="al-uninstall">Удалить с колонки</button></div>
        </div>
      </section>
      <section class="card">
        <div class="card-head"><h2>Журнал</h2><span class="meta" id="al-devtime"></span></div>
        <pre class="out" id="al-log" style="max-height:240px">—</pre>
      </section>
    </div>
  </template>