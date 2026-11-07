<script setup lang="ts">
import {onMounted,onBeforeUnmount,ref,watch}from'vue'
import{route,online,direct,syncRoute}from'./composables/state'
import{useDeviceControls}from'./composables/useDeviceControls'
import IconSprite from './components/IconSprite.vue'
import Sidebar from './components/Sidebar.vue'
import DeviceOverlays from './components/DeviceOverlays.vue'
import LoginDialog from './components/LoginDialog.vue'
import HomePage from './pages/HomePage.vue'
import AppsPage from './pages/AppsPage.vue'
import YamPage from './pages/YamPage.vue'
import UpdatesPage from './pages/UpdatesPage.vue'
import ChatgptPage from './pages/ChatgptPage.vue'
import BackupsPage from './pages/BackupsPage.vue'
import DiagnosticsPage from './pages/DiagnosticsPage.vue'
import ConnectionPage from './pages/ConnectionPage.vue'
import OverviewPage from './pages/OverviewPage.vue'
import SettingsPage from './pages/SettingsPage.vue'
import PlayerPage from './pages/PlayerPage.vue'
import AlarmPage from './pages/AlarmPage.vue'
import ChartsPage from './pages/ChartsPage.vue'
import BootPage from './pages/BootPage.vue'
import FilesPage from './pages/FilesPage.vue'
import LogsPage from './pages/LogsPage.vue'
import ConsolePage from './pages/ConsolePage.vue'
import ScenesPage from './pages/ScenesPage.vue'
import WakewordPage from './pages/WakewordPage.vue'
const start=useDeviceControls(),fatal=ref(''),reload=()=>location.reload()
onMounted(async()=>{try{await start();document.documentElement.dataset.appReady='true'}catch(e){fatal.value=(e as Error).message}})
onBeforeUnmount(()=>removeEventListener('hashchange',syncRoute))
watch(()=>route.active,(next,old)=>{if(next!==old)window.scrollTo({top:0})})
</script>
<template><IconSprite/><div class="shell"><Sidebar/>
<main id="tab-home" data-page class="darkls-page" :hidden="route.active !== 'home' || (!online && !direct.has(route.active))"><HomePage/></main>
<main id="tab-apps" data-page :hidden="route.active !== 'apps' || (!online && !direct.has(route.active))"><AppsPage/></main>
<main id="tab-yam" data-page :hidden="route.active !== 'yam' || (!online && !direct.has(route.active))"><YamPage/></main>
<main id="tab-updates" data-page :hidden="route.active !== 'updates' || (!online && !direct.has(route.active))"><UpdatesPage/></main>
<main id="tab-chatgpt" data-page :hidden="route.active !== 'chatgpt' || (!online && !direct.has(route.active))"><ChatgptPage/></main>
<main id="tab-backups" data-page :hidden="route.active !== 'backups' || (!online && !direct.has(route.active))"><BackupsPage/></main>
<main id="tab-diagnostics" data-page class="darkls-page" :hidden="route.active !== 'diagnostics' || (!online && !direct.has(route.active))"><DiagnosticsPage/></main>
<LoginDialog/><div id="darkls-toast" role="status" hidden></div>
<main id="conn-screen" :hidden="online || direct.has(route.active)"><ConnectionPage/></main>
<main id="tab-overview" data-page :hidden="route.active !== 'overview' || (!online && !direct.has(route.active))"><OverviewPage/></main>
<main id="tab-settings" data-page :hidden="route.active !== 'settings' || (!online && !direct.has(route.active))"><SettingsPage/></main>
<main id="tab-player" data-page :hidden="route.active !== 'player' || (!online && !direct.has(route.active))"><PlayerPage/></main>
<main id="tab-alarm" data-page :hidden="route.active !== 'alarm' || (!online && !direct.has(route.active))"><AlarmPage/></main>
<main id="tab-charts" data-page :hidden="route.active !== 'charts' || (!online && !direct.has(route.active))"><ChartsPage/></main>
<main id="tab-boot" data-page :hidden="route.active !== 'boot' || (!online && !direct.has(route.active))"><BootPage/></main>
<main id="tab-files" data-page :hidden="route.active !== 'files' || (!online && !direct.has(route.active))"><FilesPage/></main>
<main id="tab-logs" data-page :hidden="route.active !== 'logs' || (!online && !direct.has(route.active))"><LogsPage/></main>
<main id="tab-console" data-page :hidden="route.active !== 'console' || (!online && !direct.has(route.active))"><ConsolePage/></main>
<main :hidden="!online || route.active !== 'scenes'" id="tab-scenes" data-page><ScenesPage/></main>
<main :hidden="!online || route.active !== 'wakeword'" id="tab-wakeword" data-page><WakewordPage/></main>
</div><DeviceOverlays/><div v-if="fatal" class="card" role="alert">{{fatal}} <button class="btn" @click="reload">Повторить загрузку</button></div></template>