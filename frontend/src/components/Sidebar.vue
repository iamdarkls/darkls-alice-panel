<script setup lang="ts">
import { ref, watch } from 'vue'
import { route,health } from '../composables/state'
const more = ref(false)
const collapsed = ref(localStorage.getItem('ui.sidebar-collapsed') === '1')
function toggleSidebar() {
  collapsed.value = !collapsed.value
  localStorage.setItem('ui.sidebar-collapsed',collapsed.value ? '1' : '0')
}
watch(() => route.active, () => { more.value = false })
</script>
<template><aside class="sidebar" :class="{'is-collapsed':collapsed}">
    <a class="brand" href="#home" title="На «Обзор»">
      <svg class="brand-logo" viewBox="-50 -50 100 100" aria-hidden="true"><path fill-rule="evenodd" d="M0-46a46 46 0 1 1 0 92a46 46 0 1 1 0-92ZM0-25c3.5 0 5.6 2 7.6 5.5l13 22.5c2 3.5 2 6.4.3 9.3c-1.8 3-4.4 4.2-8.4 4.2h-25c-4 0-6.6-1.2-8.4-4.2c-1.7-2.9-1.7-5.8.3-9.3l13-22.5C-5.6-23-3.5-25 0-25Z"/></svg>
      <div><b id="model-name">Станция Лайт 2</b><small>DARKLS Alice Panel</small></div>
    </a>
    <button type="button" class="btn sm sidebar-toggle" aria-controls="side-sections"
            :aria-expanded="!collapsed" :aria-label="collapsed?'Развернуть меню':'Свернуть меню'" @click="toggleSidebar">
      <svg width="18" height="18" aria-hidden="true"><use href="#i-layers"/></svg><span>Свернуть меню</span>
    </button>
    <nav id="side-sections" class="side" :class="{ 'mobile-open': more }" aria-label="Разделы" @click="more = false" @keydown.esc="more = false">
      <a href="#home" data-tab="home" title="Главная" data-view="home" :class="{ active: route.active === 'home' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-home"/></svg><span>Главная</span></a>
      <a href="#overview" data-tab="overview" title="Обзор" data-view="overview" :class="{ active: route.active === 'overview' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-grid"/></svg><span>Обзор</span></a>
      <a href="#player" data-tab="player" title="Плеер" data-view="player" :class="{ active: route.active === 'player' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-music"/></svg><span>Плеер</span></a>
      <div class="nav-group" role="presentation">Колонка</div>
      <a href="#scenes" data-tab="scenes" title="Сценарии" data-view="scenes" :class="{active:route.active==='scenes'}"><svg width="20" height="20" aria-hidden="true"><use href="#i-layers"/></svg><span>Сценарии</span></a>
      <a href="#wakeword" data-tab="wakeword" title="Активация" data-view="wakeword" :class="{active:route.active==='wakeword'}"><svg width="20" height="20" aria-hidden="true"><use href="#i-chat"/></svg><span>Активация</span></a>
      <a href="#alarm" data-tab="alarm" title="Будильник" data-view="alarm" :class="{ active: route.active === 'alarm' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-alarm"/></svg><span>Будильник</span></a>
      <a href="#boot" data-tab="boot" title="Запуск" data-view="boot" :class="{ active: route.active === 'boot' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-power"/></svg><span>Запуск</span></a>
      <a href="#apps" data-tab="apps" title="Приложения" data-view="apps" :class="{ active: route.active === 'apps' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-box"/></svg><span>Приложения</span></a>
      <a href="#yam" data-tab="yam" title="YAM v2" data-view="yam" :class="{ active: route.active === 'yam' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-layers"/></svg><span>YAM v2</span></a>
      <a href="#files" data-tab="files" title="Файлы" data-view="files" :class="{ active: route.active === 'files' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-folder"/></svg><span>Файлы</span></a>
      <a href="#console" data-tab="console" title="Консоль" data-view="console" :class="{ active: route.active === 'console' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-term"/></svg><span>Консоль</span></a>
      <div class="nav-group" role="presentation">Состояние</div>
      <a href="#charts" data-tab="charts" title="Графики" data-view="charts" :class="{ active: route.active === 'charts' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-chart"/></svg><span>Графики</span></a>
      <a href="#logs" data-tab="logs" title="Логи" data-view="logs" :class="{ active: route.active === 'logs' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-log"/></svg><span>Логи</span></a>
      <div class="nav-sep" role="presentation"></div><div class="nav-group" role="presentation">Обслуживание</div>
      <a href="#diagnostics" data-tab="diagnostics" title="Диагностика" data-view="diagnostics" :class="{ active: route.active === 'diagnostics' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-shield"/></svg><span>Диагностика</span></a>
      <a href="#updates" data-tab="updates" title="Обновления панели" data-view="updates" :class="{ active: route.active === 'updates' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-update"/></svg><span>Обновления панели</span></a>
      <a href="#chatgpt" data-tab="chatgpt" title="ChatGPT" data-view="chatgpt" :class="{ active: route.active === 'chatgpt' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-chat"/></svg><span>ChatGPT</span></a>
      <a href="#backups" data-tab="backups" title="Резервные копии" data-view="backups" :class="{ active: route.active === 'backups' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-archive"/></svg><span>Резервные копии</span></a>
      <a href="#settings" data-tab="settings" title="Настройки" data-view="settings" :class="{ active: route.active === 'settings' }"><svg width="20" height="20" aria-hidden="true"><use href="#i-gear"/></svg><span>Настройки</span></a>
    </nav>
    <nav class="mobile-nav" aria-label="Быстрая навигация">
      <a v-for="(label,key) in {home:'Главная',overview:'Обзор',player:'Плеер'}" :key="key" :href="'#'+key" :aria-current="route.active === key ? 'page' : undefined" @click="more=false">{{ label }}</a>
      <button type="button" aria-controls="side-sections" :aria-expanded="more" @click="more=!more">Ещё</button>
    </nav>
    <div class="conn" id="conn-box" hidden>
      <b><span class="dot" id="conn"></span><span id="conn-text">Подключение…</span></b>
      <small id="conn-ip">—</small>
    </div>
  <div class="conn"><b><span class="status-dot" :class="health.info && !health.error ? 'good' : 'bad'" id="sidebar-status"></span><span id="sidebar-text">{{ health.error ? 'Нет связи' : health.info ? 'Локальный доступ' : 'Проверяем связь' }}</span></b><small>Локальное управление</small></div><button id="menu-button" hidden aria-label="Меню"></button><span id="breadcrumb" hidden></span></aside></template>