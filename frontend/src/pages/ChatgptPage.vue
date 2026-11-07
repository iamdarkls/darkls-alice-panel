<script setup lang="ts">
import OnDeviceAssistant from '../components/OnDeviceAssistant.vue'
import UiIcon from '../components/UiIcon.vue'
import{ref}from'vue';import{useApi,useAction,useEvents}from'../composables/api';import{route}from'../composables/state'
const api=useApi(),url=ref(''),token=ref(''),compatible=ref(false),hasToken=ref(false),note=ref(''),{busy,message,run}=useAction()
let baseline=''
async function load(force=false){try{const v=await api('/api/native/voice');if(force||!baseline||(!token.value&&JSON.stringify([url.value,compatible.value])===baseline)){url.value=v.url;compatible.value=v.compatibility_confirmed;baseline=JSON.stringify([url.value,compatible.value])}hasToken.value=v.has_token;note.value=v.note}catch(e){message.value=(e as Error).message}}
function save(){void run(async()=>{await api('/api/native/voice/config',{url:url.value.trim(),token:token.value.trim(),compatibility_confirmed:compatible.value});token.value='';message.value='Настройки сохранены';await load(true)})}
function service(action:string){if(action!=='status'&&!confirm('Выполнить «'+action+'» для голосового сервиса на Linux-сервере?'))return;void run(async()=>{message.value=JSON.stringify(await api('/api/native/voice/'+action,{}),null,2)})}
void load();useEvents(()=>{if(route.active==='chatgpt')void load()})
</script>
<template><header class="page-head"><h1><UiIcon name="chat"/>ChatGPT</h1></header>
<section class="card"><h2><UiIcon name="chat"/>Голосовой мост на Linux-сервере</h2><p class="hint" id="voice-note">{{ note }}</p><p class="hint">Нужны настроенный голосовой сервис, агент DARKLS и защищённое соединение с сервером. Эта вкладка управляет сервисом; она не устанавливает аудиодрайверы и не выполняет вход в ChatGPT.</p>
<label>Адрес агента<input class="field" id="voice-url" type="url" placeholder="https://voice.example.ru" v-model="url"></label>
<label>Токен агента<input class="field" id="voice-token" type="password" autocomplete="new-password" v-model="token" :placeholder="hasToken?'Сохранён. Оставь пустым, чтобы сохранить':'Токен агента'"></label>
<label class="toggle"><span>Совместимость аудио с этой колонкой проверена вручную</span><input type="checkbox" id="voice-compatible" v-model="compatible"></label>
<div class="row"><button class="btn" id="voice-save" @click="save" :disabled="busy"><UiIcon name="check"/>Сохранить</button><button class="btn" id="voice-status" @click="service('status')" :disabled="busy"><UiIcon name="info"/>Проверить связь</button></div><pre class="out" id="voice-result">{{ message }}</pre>
<div class="row"><button class="btn primary" id="voice-start" @click="service('start')" :disabled="busy||!compatible"><UiIcon name="play"/>Запустить</button><button class="btn" id="voice-stop" @click="service('stop')" :disabled="busy"><UiIcon name="stop"/>Остановить</button><button class="btn" id="voice-restart" @click="service('restart')" :disabled="busy||!compatible"><UiIcon name="refresh"/>Перезапустить</button></div></section><OnDeviceAssistant/></template>