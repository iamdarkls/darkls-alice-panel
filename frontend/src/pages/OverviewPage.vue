<template>
    <header class="page-head">
      <div>
        <h1>Обзор</h1>
        <div class="sub" id="ov-sub">—</div>
        <div class="upd-pill" id="ov-update" hidden><a href="#settings"><svg width="14" height="14" aria-hidden="true"><use href="#i-up"/></svg><span id="ov-update-text">Доступна новая версия панели</span></a>
          <button type="button" id="ov-update-hide" aria-label="Скрыть до следующей версии" title="Скрыть до следующей версии">×</button></div>
      </div>
      <div class="actions">
        <button class="btn" id="ov-edit" aria-pressed="false"><svg width="18" height="18" aria-hidden="true"><use href="#i-edit"/></svg><span>Настроить</span></button>
        <button class="btn" id="q-restart"><svg width="18" height="18" aria-hidden="true"><use href="#i-refresh"/></svg>Перезапустить Алису</button>
        <button class="btn danger" id="reboot"><svg width="18" height="18" aria-hidden="true"><use href="#i-power"/></svg>Перезагрузить</button>
      </div>
    </header>

    <section class="card ov-editbar" id="ov-editbar" hidden>
      <div class="card-head">
        <h2>Настройка «Обзора»</h2>
        <div class="actions"><button class="btn sm" id="ov-reset">Виджеты по умолчанию</button><button class="btn sm primary" id="ov-done">Готово</button></div>
      </div>
      <div class="ov-opts">
        <label class="set-item"><div class="set-label"><b>Визуализатор за 3D-моделью</b><small>Спектр из символов за моделью, пока колонка играет музыку (нужен вход в Яндекс)</small></div>
          <div class="set-ctl"><input type="checkbox" class="switch" id="set-viz"></div></label>
        <label class="set-item"><div class="set-label"><b>Фон в покое</b><small>Пока музыка не играет, символы за моделью медленно переливаются</small></div>
          <div class="set-ctl"><input type="checkbox" class="switch" id="set-viz-idle"></div></label>
        <label class="set-item"><div class="set-label"><b>Приватный режим</b><small>Серийный номер, Wi‑Fi, логин Яндекса, адреса и имена устройств — точками,
          в «Логах» скрыты Device ID, аккаунт и токены. Чтобы случайный скриншот ничего не выдал; одно значение можно открыть нажатием</small></div>
          <div class="set-ctl"><input type="checkbox" class="switch" id="set-private"></div></label>
        <div id="model-settings" hidden></div>
        <div class="set-item set-top"><div class="set-label"><b>Виджеты</b><small>Перетаскивайте за ⠿ или двигайте стрелками. Убранные можно вернуть отсюда.
          Тема, пароль, резервная копия — во вкладке <a href="#settings">«Настройки»</a></small></div>
          <div class="set-ctl"><div class="chips" id="ov-hidden-list"></div></div></div>
      </div>
    </section>

    <div class="wzone wz-top" id="wz-top">
    <section class="grid stats" aria-label="Состояние" data-widget="stats" data-title="Состояние">
      <div class="card stat"><div class="label">Температура</div><div class="value"><b id="st-temp">—</b><span>°C</span></div><div class="bar"><i id="st-temp-bar"></i></div><div class="meta">процессор</div></div>
      <div class="card stat"><div class="label">Память</div><div class="value"><b id="st-mem">—</b><span id="st-mem-u">МБ</span></div><div class="bar"><i id="st-mem-bar"></i></div><div class="meta" id="st-mem-n">—</div></div>
      <div class="card stat"><div class="label">Wi‑Fi</div><div class="value"><b id="st-rssi">—</b><span>дБм</span></div><div class="bar"><i id="st-rssi-bar"></i></div><div class="meta" id="st-wifi-n">—</div></div>
      <div class="card stat"><div class="label">Аптайм</div><div class="value"><b id="st-up">—</b><span id="st-up-u"></span></div><div class="bar"><i id="st-load-bar"></i></div><div class="meta" id="st-load-n">—</div></div>
    </section>
    </div>

    <div class="cols overview-columns">
      <div class="col wzone" id="wz-left">
        <!-- 3D-модель -->
        <div class="model-view" id="model-view" data-widget="model" data-title="3D-модель" role="img" aria-label="3D-модель колонки: дисплей и кольцо повторяют настоящие"><canvas id="model-viz" aria-hidden="true"></canvas></div>

        <!-- громкость -->
        <section class="card" data-widget="volume" data-title="Громкость">
          <div class="card-head"><h2>Громкость</h2></div>
          <div class="vol-main">
            <div class="vol-big" id="vol-big">—</div>
            <div><label for="vol-master" class="meta" style="font-weight:600;color:var(--text-2)">Динамик</label><input type="range" id="vol-master" min="0" max="100" step="5"></div>
          </div>
          <div class="chips">
            <button class="pill" data-level="10">Тихо</button><button class="pill" data-level="30">30</button>
            <button class="pill" data-level="50">50</button><button class="pill" data-level="70">70</button>
          </div>
          <p class="hint">Шкала как на колонке: 0–100 с шагом 5. Если вы вошли в Яндекс, громкость ставит сама Алиса; иначе она пересчитывается по таблице Quasar и пишется прямо в микшер.</p>
        </section>

        <!-- подсветка -->
        <section class="card" data-widget="light" data-title="Подсветка">
          <h2>Подсветка</h2>
          <div class="ring-row">
            <div class="ring-preview" id="ring-preview">
              <svg viewBox="-50 -50 100 100" aria-hidden="true"><path fill-rule="evenodd" d="M0-46a46 46 0 1 1 0 92a46 46 0 1 1 0-92ZM0-25c3.5 0 5.6 2 7.6 5.5l13 22.5c2 3.5 2 6.4.3 9.3c-1.8 3-4.4 4.2-8.4 4.2h-25c-4 0-6.6-1.2-8.4-4.2c-1.7-2.9-1.7-5.8.3-9.3l13-22.5C-5.6-23-3.5-25 0-25Z"/></svg>
            </div>
            <div class="col" style="gap:10px">
              <div class="swatches" id="swatches">
                <button class="sw" style="--c:#6C47FF" data-hex="#6C47FF" aria-label="Фиолетовый"></button>
                <button class="sw" style="--c:#FF0000" data-hex="#FF0000" aria-label="Красный"></button>
                <button class="sw" style="--c:#FF5A00" data-hex="#FF5A00" aria-label="Оранжевый"></button>
                <button class="sw" style="--c:#00FF00" data-hex="#00FF00" aria-label="Зелёный"></button>
                <button class="sw" style="--c:#0000FF" data-hex="#0000FF" aria-label="Синий"></button>
                <button class="sw white" style="--c:#FFFFFF" data-hex="#FFFFFF" aria-label="Белый"></button>
                <label class="sw-custom" title="Свой цвет"><svg width="14" height="14" aria-hidden="true"><use href="#i-plus"/></svg><input type="color" id="ring-color" value="#6c47ff" aria-label="Свой цвет"></label>
              </div>
              <div class="row"><button class="btn sm primary" id="ring-set">Включить</button><button class="btn sm" id="ring-off">Выключить</button><button class="btn sm" id="ring-reset" title="Отдать кольцо Алисе: погасить цвет и остановить анимации панели">Сбросить</button></div>
            </div>
          </div>
          <div class="card-head">
            <div class="seg" id="pat-kind" role="group" aria-label="Анимации"><button data-k="ring" class="active">Кольцо</button><button data-k="clock">Часы</button></div>
            <div class="row" style="gap:6px">
              <label for="pat-sec" class="meta">длительность</label>
              <input type="number" id="pat-sec" class="field mono" value="5" min="1" max="600" style="width:64px;min-height:36px;padding:0 8px"><span class="meta">с</span>
              <button class="btn sm icon danger" id="pat-stop" aria-label="Остановить анимации"><svg width="14" height="14" aria-hidden="true"><use href="#i-stop"/></svg></button>
            </div>
          </div>
          <div class="pat-list" id="patterns"></div>
          <p class="hint">Цвет пишется в /sys/class/leds — любая анимация Алисы его перезапишет. Анимации часов показываются и на предпросмотре дисплея.</p>
        </section>

        <!-- часы -->
        <section class="card" data-widget="clock" data-title="Дисплей часов">
          <div class="card-head"><h2>Дисплей часов</h2>
            <div class="row" style="gap:6px"><span class="badge" id="disp-badge" hidden></span><button class="btn sm" id="disp-stop">Вернуть часы</button></div></div>
          <div class="display" id="clock-preview"></div>
          <div class="seg" id="disp-mode" role="group" aria-label="Что показывать">
            <button data-m="text" class="active">Текст</button><button data-m="date">Дата</button><button data-m="temp">Температура</button><button data-m="timer">Таймер</button>
          </div>
          <div class="col" id="dm-text" style="gap:10px">
            <input type="text" id="clock-text" class="field mono" maxlength="10" placeholder="12:34" aria-label="Текст на дисплее">
            <div class="extras">
              <label><input type="checkbox" id="x-dh"> двоеточие ↑</label>
              <label><input type="checkbox" id="x-dl"> двоеточие ↓</label>
              <label><input type="checkbox" id="x-dm"> дефис</label>
              <label><input type="checkbox" id="x-degree"> °</label>
            </div>
          </div>
          <div class="row" id="dm-timer" hidden style="gap:8px">
            <input type="text" id="timer-val" class="field mono" value="05:00" maxlength="5" aria-label="Время таймера, мм:сс" style="width:90px">
            <div class="chips"><button class="pill" data-t="60">1 мин</button><button class="pill" data-t="300">5 мин</button><button class="pill" data-t="600">10 мин</button><button class="pill" data-t="1500">25 мин</button></div>
          </div>
          <div class="row"><label for="clock-br" style="min-width:64px">Яркость</label><input type="range" id="clock-br" min="1" max="255" value="160" style="flex:1;width:auto"><span class="mono meta" id="clock-br-v" style="min-width:32px;text-align:right">160</span></div>
          <div class="row" style="gap:8px">
            <button class="btn primary" id="disp-pin" style="min-height:42px">Закрепить</button>
            <button class="btn" id="clock-set" style="min-height:42px">Показать один раз</button>
          </div>
          <p class="hint" id="disp-hint">Закреплённое держится, пока не нажать «Вернуть часы»: колонка сама перерисовывает дисплей, и Quasar его не затирает. «Один раз» — до смены минуты. По окончании таймера играет его штатный звонок.</p>
        </section>
      </div>

      <div class="col wzone" id="wz-right">
        <!-- музыка -->
        <section class="card" id="music-card" data-widget="music" data-title="Сейчас играет">
          <div class="card-head"><h2>Сейчас играет</h2>
            <div class="row" style="gap:6px"><span class="meta" id="mu-account"></span><button class="btn sm ghost" id="mu-logout" hidden>Выйти</button></div></div>
          <div id="mu-login" hidden>
            <div class="login-grid">
              <div class="qr" id="mu-qr"><div class="empty">QR-код…</div></div>
              <div class="col" style="gap:8px">
                <b>Войдите в Яндекс, чтобы видеть и переключать музыку</b>
                <p class="hint">Отсканируйте QR-код камерой телефона, на котором выполнен вход в Яндекс, и подтвердите вход.</p>
                <span class="meta" id="mu-qr-status"></span>
              </div>
            </div>
            <details style="margin-top:12px"><summary>Не получается? Войти через Яндекс</summary>
              <ol class="hint" style="padding-left:18px;margin:8px 0">
                <li><a id="mu-oauth" target="_blank" rel="noopener">Откройте страницу входа Яндекса</a> и войдите.</li>
                <li>Скопируйте из адресной строки адрес страницы, куда вас перенаправит, и вставьте сюда.</li>
              </ol>
              <div class="row" style="gap:8px"><input class="field mono" id="mu-oauth-url" placeholder="https://music.yandex.ru/#access_token=…" style="flex:1;min-width:160px" aria-label="Адрес после входа">
                <button class="btn sm primary" id="mu-oauth-go" style="min-height:42px">Готово</button></div>
            </details>
            <p class="hint" style="margin-top:10px">Токен хранится только на этом компьютере (.yandex_auth.json рядом с server.py).</p>
          </div>
          <div id="mu-player" hidden class="col" style="gap:14px">
            <div class="mu-top">
              <a class="cover mu-cover" href="#player" title="Открыть плеер"><svg width="40" height="40" aria-hidden="true"><use href="#i-music"/></svg></a>
              <div class="mu-side">
                <div class="np-info"><div class="np-title mu-title">Ничего не играет</div><div class="np-artist mu-artist"></div></div>
                <div class="controls" data-mu-controls="full"></div>
              </div>
            </div>
            <div class="progress"><span class="mu-pos">0:00</span><input type="range" class="mu-seek" min="0" max="100" value="0" step="1" aria-label="Позиция в треке"><span class="mu-dur">0:00</span></div>
            <div class="mu-bt-note"><svg width="16" height="16" aria-hidden="true"><use href="#i-bt"/></svg>
              <span><b>Музыка с устройства по Bluetooth.</b> Лайки, очередь, перемешивание и перемотка доступны только на самом устройстве.</span></div>
            <form class="row mu-ask-form" style="gap:8px">
              <input class="field" name="text" placeholder="Попросить Алису: «включи джаз»" style="flex:1;min-width:160px" aria-label="Команда Алисе">
              <button class="btn sm" style="min-height:42px">Отправить</button>
            </form>
            <p class="hint" id="mu-err" hidden></p>
          </div>
        </section>

        <!-- звуки -->
        <section class="card" data-widget="sounds" data-title="Звуки">
          <div class="card-head"><h2>Звуки</h2>
            <button class="btn sm danger-soft" id="stop-sound"><svg width="14" height="14" aria-hidden="true"><use href="#i-stop"/></svg>Стоп</button></div>
          <div class="folders" id="snd-folders" role="group" aria-label="Папка"></div>
          <label class="search"><svg width="16" height="16" aria-hidden="true"><use href="#i-search"/></svg>
            <input type="search" id="snd-filter" placeholder="Найти звук во всех папках" aria-label="Найти звук"></label>
          <div class="sound-list" id="sounds"><div class="empty">Загрузка…</div></div>
          <button class="drop" id="drop">Перетащите аудиофайл сюда или нажмите, чтобы выбрать — он проиграется на колонке</button>
          <input type="file" id="file" accept="audio/*" hidden>
          <p class="hint" id="ffmpeg-hint"></p>
        </section>

        <section class="card" data-widget="bt" data-title="Bluetooth">
          <div class="card-head"><h2>Bluetooth</h2><span class="badge" id="bt-badge">—</span></div>
          <div class="bt-pair">
            <div class="info"><b id="bt-pair-text">Скрыта</b><span class="meta" id="bt-pair-hint">—</span></div>
            <span class="bt-left" id="bt-pair-left" hidden>—</span>
            <button class="btn sm" id="bt-pair-btn">Сделать видимой</button>
          </div>
          <div class="bt-list" id="bt-list"><div class="empty">Загрузка…</div></div>
          <div class="vol-bt"><label for="vol-bt">Громкость</label><input type="range" id="vol-bt" min="0" max="255"><span id="vol-bt-v">—</span></div>
        </section>

        <section class="card" data-widget="device" data-title="Об устройстве">
          <h2>Об устройстве</h2>
          <dl class="kv" id="dev-info"><dt>…</dt><dd></dd></dl>
        </section>
      </div>
      <div class="col wzone" id="wz-extra" aria-label="Дополнительная зона виджетов"></div>
    </div>
    <div id="wz-hidden" hidden></div>

  </template>