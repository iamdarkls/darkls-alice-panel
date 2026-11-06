<script setup lang="ts">
import MediaCard from '../components/MediaCard.vue'
</script>
<template>
<MediaCard/>
    <header class="page-head"><div><h1>Настройки</h1><div class="sub">Оформление, доступ к панели и то, что панель хранит на колонке</div></div></header>


    <div class="settings">


      <section class="card set-card">
        <div class="set-head"><span class="set-ic"><svg width="18" height="18" aria-hidden="true"><use href="#i-palette"/></svg></span><div><h2>Оформление</h2><p>Хранится в этом браузере и попадает в резервную копию</p></div></div>
        <div class="set-item"><div class="set-label"><b>Тема</b><small>«Как в системе» следует за светлой и тёмной темой устройства</small></div>
          <div class="set-ctl"><div class="seg" id="set-theme" role="group" aria-label="Тема"><button data-v="auto">Как в системе</button><button data-v="light">Светлая</button><button data-v="dark">Тёмная</button></div></div></div>
        <div class="set-item"><div class="set-label"><b>Цвет акцента</b><small>Кнопки, ссылки, графики и подсветка выбранного</small></div>
          <div class="set-ctl"><div class="swatches" id="set-accent" role="group" aria-label="Цвет акцента">
            <button class="sw" style="--c:#6C47FF" data-v="" aria-label="Фиолетовый (по умолчанию)"></button>
            <button class="sw" style="--c:#2F6BFF" data-v="#2F6BFF" aria-label="Синий"></button>
            <button class="sw" style="--c:#0F9D8F" data-v="#0F9D8F" aria-label="Бирюзовый"></button>
            <button class="sw" style="--c:#2E9E4F" data-v="#2E9E4F" aria-label="Зелёный"></button>
            <button class="sw" style="--c:#F06A1D" data-v="#F06A1D" aria-label="Оранжевый"></button>
            <button class="sw" style="--c:#E0457B" data-v="#E0457B" aria-label="Розовый"></button>
            <button class="sw" style="--c:#52525B" data-v="#52525B" aria-label="Графит"></button>
          </div></div></div>
        <label class="set-item"><div class="set-label"><b>Плеер внизу страницы</b><small>Мини-плеер на всех вкладках, кроме «Плеера». Появляется после входа в Яндекс</small></div>
          <div class="set-ctl"><input type="checkbox" class="switch" id="set-minibar"></div></label>
        <div class="set-item"><div class="set-label"><b>«Обзор»</b><small>Виджеты, 3D-модель и визуализатор</small></div>
          <div class="set-ctl"><button class="btn sm" id="set-layout-edit">Настроить «Обзор»</button><button class="btn sm" id="set-layout-reset">По умолчанию</button></div></div>
        <div class="set-item"><div class="set-label"><b>Галерея 3D-моделей</b><small>Все корпуса, которые знает панель, — без подключения к колонке</small></div>
          <div class="set-ctl"><a class="btn sm" id="model-gallery" href="./static/model-preview.html" target="_blank" rel="noopener">Открыть ↗</a></div></div>
      </section>

      <section class="card set-card">
        <div class="set-head"><span class="set-ic"><svg width="18" height="18" aria-hidden="true"><use href="#i-lock"/></svg></span><div><h2>Доступ</h2><p>Кто может открыть эту панель</p></div></div>
        <div class="set-item"><div class="set-label"><b>Пароль панели</b><small id="pw-state">—</small></div>
          <div class="set-ctl"><button class="btn sm" id="pw-set">Задать</button><button class="btn sm" id="pw-off" hidden>Убрать</button><button class="btn sm" id="pw-logout" hidden>Выйти</button></div></div>
        <form class="set-form" id="pw-form" hidden>
          <input type="text" name="username" value="panel" autocomplete="username" hidden>
          <input type="password" class="field" id="pw-cur" autocomplete="current-password" placeholder="Текущий пароль" aria-label="Текущий пароль">
          <input type="password" class="field" id="pw-new" autocomplete="new-password" placeholder="Новый пароль" aria-label="Новый пароль" minlength="4">
          <input type="password" class="field" id="pw-new2" autocomplete="new-password" placeholder="Ещё раз" aria-label="Повторите пароль">
          <div class="actions"><button class="btn sm primary" id="pw-save">Сохранить</button><button type="button" class="btn sm" id="pw-cancel">Отмена</button></div>
        </form>
        <div class="set-item" id="pw-others-row" hidden><div class="set-label"><b>Другие входы</b><small id="pw-others-n"></small></div>
          <div class="set-ctl"><button class="btn sm" id="pw-others">Завершить</button></div></div>
      </section>

      <section class="card set-card">
        <div class="set-head"><span class="set-ic"><svg width="18" height="18" aria-hidden="true"><use href="#i-expand"/></svg></span><div><h2>Приложение</h2><p>Панель с иконкой и в отдельном окне — на компьютере или телефоне</p></div></div>
        <div class="set-item"><div class="set-label"><b>Установить как приложение</b><small id="app-state">—</small></div>
          <div class="set-ctl"><button class="btn sm primary" id="app-install" hidden>Установить</button></div></div>
        <p class="set-note" id="app-hint" hidden></p>
        <div class="set-item" id="app-ca-row" hidden><div class="set-label"><b>Сертификат HTTPS</b><small>Чтобы телефон доверял панели по HTTPS. Действует только для локальных адресов</small></div>
          <div class="set-ctl"><a class="btn sm" href="ca.crt"><svg width="18" height="18" aria-hidden="true"><use href="#i-dl"/></svg>Скачать</a></div></div>
      </section>

      <section class="card set-card">
        <div class="set-head"><span class="set-ic"><svg width="18" height="18" aria-hidden="true"><use href="#i-power"/></svg></span><div><h2>Колонка</h2><p id="fp-info">Что панель поставила на колонку</p></div></div>
        <div class="set-item set-top"><div class="set-label"><b>Установлено на колонке</b><small>Остальные функции панели ничего на колонке не хранят</small></div>
          <div class="set-ctl"><div id="fp-list" class="fp-list"><span class="meta">—</span></div></div></div>
        <label class="set-item" id="privacy-row"><div class="set-label"><b>Блокировать аналитику Яндекса</b><small id="privacy-state">Адреса сбора статистики
          (clck, appmetrica, metrica) ведут в никуда. Системный раздел не меняется, Алиса и музыка работают как обычно</small></div>
          <div class="set-ctl"><button class="btn sm" id="privacy-purge" hidden>Очистить очередь</button><input type="checkbox" class="switch" id="privacy-on" disabled></div></label>
        <div class="set-item"><div class="set-label"><b>Резервная копия</b><small>Заставка, звук запуска, будильники со звуками, флаги автозапуска, оформление и раскладка.
          Пароль, вход в Яндекс и история графиков в копию не входят</small></div>
          <div class="set-ctl"><button class="btn sm" id="bk-save"><svg width="18" height="18" aria-hidden="true"><use href="#i-dl"/></svg>Скачать</button>
            <button class="btn sm" id="bk-restore"><svg width="18" height="18" aria-hidden="true"><use href="#i-ul"/></svg>Восстановить…</button></div>
          <input type="file" id="bk-file" accept=".gz,.tgz,application/gzip" hidden></div>
        <div class="set-item set-danger"><div class="set-label"><b>Удалить всё с колонки</b><small>Вернёт стандартные заставку и звук, удалит будильники и строку автозапуска. Перезагрузка не нужна</small></div>
          <div class="set-ctl"><button class="btn sm danger" id="fp-reset" disabled>Удалить всё</button></div></div>
      </section>

      <section class="card set-card" id="upd-card">
        <div class="set-head"><span class="set-ic"><svg width="18" height="18" aria-hidden="true"><use href="#i-up"/></svg></span><div><h2>О панели</h2><p id="upd-sub">Версия и обновления</p></div></div>
        <div class="set-item"><div class="set-label"><b>Колонка: <span id="upd-model">—</span></b><small id="upd-model-how">—</small></div></div>
        <div class="set-item"><div class="set-label"><b>Версия <span id="upd-version">—</span></b><small id="upd-state">проверяем…</small></div>
          <div class="set-ctl"><button class="btn sm" id="upd-check">Проверить</button><a class="btn sm" id="upd-repo" href="https://github.com/dimap/yandex-station-web" target="_blank" rel="noopener">GitHub ↗</a></div></div>
        <div class="set-item" id="upd-row" hidden><div class="set-label"><b>Доступна версия <span id="upd-latest">—</span></b><small id="upd-how">—</small></div>
          <div class="set-ctl"><a class="btn sm" id="upd-notes" target="_blank" rel="noopener">Что нового ↗</a><button class="btn sm primary" id="upd-go">Обновить</button></div></div>
        <pre class="set-cmd" id="upd-cmd" hidden></pre>
      </section>

    </div>
  </template>