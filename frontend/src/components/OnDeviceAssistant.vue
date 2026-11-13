<script setup lang="ts">
import { ref } from 'vue'
import { useAction, useApi, usePolling, stamp } from '../composables/api'
import { route } from '../composables/state'
type State = {installed:boolean;enabled:boolean;running:boolean;confirmed:boolean;url:string;model:string;
  has_key:boolean;error:string;version?:string;available_version?:string;
  transport?:string;profiles?:{url:string;model:string;transport:string}[];skills?:{time:boolean;weather:boolean};
  weather?:{city?:string;lat?:number;lon?:number};history:{at:number;question:string;answer?:string;error?:string}[]}
const api = useApi()
const {busy,message,run} = useAction()
const state = ref<State>()
const url = ref('https://api.openai.com/v1')
const model = ref('')
const key = ref('')
const confirmed = ref(false)
const question = ref('')
const transport = ref('chat')
const time = ref(true)
const weather = ref(false)
const city = ref('')
const lat = ref<number | ''>('')
const lon = ref<number | ''>('')
function chooseProfile(event:Event) {
  const saved = state.value?.profiles?.[Number((event.target as HTMLSelectElement).value)]
  if (saved) {
    url.value = saved.url
    model.value = saved.model
    transport.value = saved.transport || 'chat'
    key.value = ''
  }
}
const endpoint = '/api/native/assistant'
function update(value:State,fields=false) {
  if (!state.value || fields) {
    url.value = value.url || url.value
    model.value = value.model
    transport.value = value.transport || 'chat'
    confirmed.value = value.confirmed
    time.value = value.skills?.time ?? true
    weather.value = value.skills?.weather ?? false
    city.value = value.weather?.city || ''
    lat.value = value.weather?.lat ?? ''
    lon.value = value.weather?.lon ?? ''
  }
  state.value = value
}
async function load() {
  if (route.active !== 'chatgpt' || busy.value) return
  try { update(await api<State>(endpoint)) }
  catch(error) { message.value = (error as Error).message }
}
usePolling(load,1800,() => route.active === 'chatgpt')
function send(action:string) {
  return run(async () => {
    const data = action === 'config' ? {url:url.value.trim(),model:model.value.trim(),key:key.value.trim(),confirmed:confirmed.value,transport:transport.value,
      skills:{time:time.value,weather:weather.value},weather:{city:city.value,lat:lat.value,lon:lon.value}}
      : action === 'ask' ? {text:question.value.trim()} : {}
    update(await api<State>(endpoint,{action,...data}),action === 'config')
    if (action === 'config') key.value=''
    if (action === 'ask') question.value=''
    message.value = action === 'ask' ? 'Вопрос отправлен' : ''
  })
}
</script>

<template>
  <section class="card">
    <div class="card-head"><h2>Помощник на колонке</h2><span class="badge">{{ state?.running ? 'Запущен' : state?.enabled ? 'Запускается' : 'Остановлен' }}</span></div>
    <p class="hint">Экспериментальный режим для Мини 3 Про. Для проверки сначала останови другой голосовой мост.</p>
    <p v-if="message || state?.error" role="status" class="hint">{{ message || state?.error }}</p>
    <form v-if="state" class="col" @submit.prevent="send('config')">
      <label v-if="state.profiles?.length">Сохранённое подключение
        <select class="field" @change="chooseProfile">
          <option selected disabled value="">Выбрать профиль</option>
          <option v-for="(profile,index) in state.profiles" :key="index" :value="index">{{ profile.model }} · {{ profile.url }}</option>
        </select>
      </label>
      <label>Адрес OpenAI-совместимого API <input v-model="url" type="url" class="field" required></label>
      <label>Модель <input v-model="model" class="field" maxlength="160" required></label>
      <label>Режим API
        <select v-model="transport" class="field">
          <option value="chat">Chat Completions</option>
          <option value="realtime" :disabled="!state.version || state.version!==state.available_version">OpenAI Realtime · экспериментальный</option>
        </select>
      </label>
      <label>Ключ API <input v-model="key" type="password" class="field" autocomplete="new-password" :placeholder="state.has_key ? 'Ключ сохранён' : 'Если требует провайдер'"></label>
      <details>
        <summary>Локальные команды</summary>
        <label class="toggle"><span>Время и дата</span><input v-model="time" type="checkbox"></label>
        <label class="toggle"><span>Прогноз погоды</span><input v-model="weather" type="checkbox"></label>
        <div v-if="weather" class="row">
          <label>Город <input v-model="city" class="field" maxlength="80"></label>
          <label>Широта <input v-model.number="lat" type="number" class="field" min="-90" max="90" step="any" required></label>
          <label>Долгота <input v-model.number="lon" type="number" class="field" min="-180" max="180" step="any" required></label>
        </div>
        <p class="hint">Локальные команды требуют актуальной версии помощника. Для прогноза координаты передаются MET Norway.</p>
      </details>
      <label class="toggle"><span>Разрешить пробный запуск</span><input v-model="confirmed" type="checkbox"></label>
      <div class="row">
        <button class="btn" :disabled="busy">Сохранить настройки</button>
        <button v-if="!state.installed || (state.available_version && state.version !== state.available_version)" type="button" class="btn" :disabled="busy || state.enabled" @click="send('install')">{{ state.installed ? 'Обновить помощника' : 'Установить программу' }}</button>
        <button v-if="state.enabled" type="button" class="btn" :disabled="busy" @click="send('stop')">Остановить</button>
        <button v-else type="button" class="btn primary" :disabled="busy || !state.installed || !state.confirmed" @click="send('start')">Запустить</button>
      </div>
    </form>
    <form v-if="state?.running" class="row" @submit.prevent="send('ask')">
      <label>Проверочный вопрос <input v-model="question" class="field" maxlength="1000" required></label>
      <button class="btn" :disabled="busy || !question.trim()">Спросить</button>
    </form>
    <div v-for="(item,index) in state?.history" :key="index" class="set-item">
      <div><b>{{ item.question }}</b><div class="hint">{{ stamp(item.at) }}</div><p>{{ item.error || item.answer }}</p></div>
    </div>
  </section>
</template>
