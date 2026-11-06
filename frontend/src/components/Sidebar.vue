<script setup lang="ts">
import { route,health } from '../composables/state'
</script>
<template><aside class="sidebar">
    <a class="brand" href="#home" title="На «Обзор»">
      <svg class="brand-logo" viewBox="-50 -50 100 100" aria-hidden="true"><path fill-rule="evenodd" d="M0-46a46 46 0 1 1 0 92a46 46 0 1 1 0-92ZM0-25c3.5 0 5.6 2 7.6 5.5l13 22.5c2 3.5 2 6.4.3 9.3c-1.8 3-4.4 4.2-8.4 4.2h-25c-4 0-6.6-1.2-8.4-4.2c-1.7-2.9-1.7-5.8.3-9.3l13-22.5C-5.6-23-3.5-25 0-25Z"/></svg>
      <div><b id="model-name">Станция Лайт 2</b><small>DARKLS Alice Panel</small></div>
    </a>
    <nav class="side" aria-label="Разделы">
      <a href="#home" data-tab="home" data-view="home" :class="{ active: route.active === 'home' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-home"/></svg>Главная</a>
      <a href="#overview" data-tab="overview" data-view="overview" :class="{ active: route.active === 'overview' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-grid"/></svg>Обзор</a>
      <a href="#player" data-tab="player" data-view="player" :class="{ active: route.active === 'player' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-music"/></svg>Плеер</a>
      <div class="nav-group" role="presentation">Колонка</div>
      <a href="#alarm" data-tab="alarm" data-view="alarm" :class="{ active: route.active === 'alarm' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-alarm"/></svg>Будильник</a>
      <a href="#boot" data-tab="boot" data-view="boot" :class="{ active: route.active === 'boot' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-power"/></svg>Запуск</a>
      <a href="#apps" data-tab="apps" data-view="apps" :class="{ active: route.active === 'apps' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-box"/></svg>Приложения</a>
      <a href="#yam" data-tab="yam" data-view="yam" :class="{ active: route.active === 'yam' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-layers"/></svg>YAM v2</a>
      <a href="#files" data-tab="files" data-view="files" :class="{ active: route.active === 'files' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-folder"/></svg>Файлы</a>
      <a href="#console" data-tab="console" data-view="console" :class="{ active: route.active === 'console' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-term"/></svg>Консоль</a>
      <div class="nav-group" role="presentation">Состояние</div>
      <a href="#charts" data-tab="charts" data-view="charts" :class="{ active: route.active === 'charts' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-chart"/></svg>Графики</a>
      <a href="#logs" data-tab="logs" data-view="logs" :class="{ active: route.active === 'logs' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-log"/></svg>Логи</a>
      <div class="nav-sep" role="presentation"></div><div class="nav-group" role="presentation">Обслуживание</div>
      <a href="#diagnostics" data-tab="diagnostics" data-view="diagnostics" :class="{ active: route.active === 'diagnostics' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-shield"/></svg>Диагностика</a>
      <a href="#updates" data-tab="updates" data-view="updates" :class="{ active: route.active === 'updates' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-update"/></svg>Обновления панели</a>
      <a href="#chatgpt" data-tab="chatgpt" data-view="chatgpt" :class="{ active: route.active === 'chatgpt' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-chat"/></svg>ChatGPT</a>
      <a href="#backups" data-tab="backups" data-view="backups" :class="{ active: route.active === 'backups' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-archive"/></svg>Резервные копии</a>
      <a href="#settings" data-tab="settings" data-view="settings" :class="{ active: route.active === 'settings' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-gear"/></svg>Настройки</a>
    </nav>
    <p class="nav-scroll-hint">Разделы можно листать вбок →</p>
    <div class="conn" id="conn-box" hidden>
      <b><span class="dot" id="conn"></span><span id="conn-text">Подключение…</span></b>
      <small id="conn-ip">—</small>
    </div>
  <div class="conn"><b><span class="status-dot" :class="health.info && !health.error ? 'good' : 'bad'" id="sidebar-status"></span><span id="sidebar-text">{{ health.error ? 'Нет связи' : health.info ? 'Локальный доступ' : 'Проверяем связь' }}</span></b><small>Локальное управление</small></div><button id="menu-button" hidden aria-label="Меню"></button><span id="breadcrumb" hidden></span></aside></template>