<script setup lang="ts">
import { ref } from 'vue'
import { useAction, useApi, usePolling, stamp } from '../composables/api'
import { route } from '../composables/state'
type State = {installed:boolean;enabled:boolean;running:boolean;confirmed:boolean;url:string;model:string;
  has_key:boolean;error:string;history:{at:number;question:string;answer?:string;error?:string}[]}
const api = useApi()
const {busy,message,run} = useAction()
const state = ref<State>()
const url = ref('https://api.openai.com/v1')
const model = ref('')
const key = ref('')
const confirmed = ref(false)
const question = ref('')
const endpoint = '/api/native/assistant'
function update(value:State,fields=false) {
  if (!state.value || fields) {
    url.value = value.url || url.value
    model.value = value.model
    confirmed.value = value.confirmed
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
    const data = action === 'config' ? {url:url.value.trim(),model:model.value.trim(),key:key.value.trim(),confirmed:confirmed.value}
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
      <label>Адрес OpenAI-совместимого API <input v-model="url" type="url" class="field" required></label>
      <label>Модель <input v-model="model" class="field" maxlength="160" required></label>
      <label>Ключ API <input v-model="key" type="password" class="field" autocomplete="new-password" :placeholder="state.has_key ? 'Ключ сохранён' : 'Если требует провайдер'"></label>
      <label class="toggle"><span>Разрешить пробный запуск</span><input v-model="confirmed" type="checkbox"></label>
      <div class="row">
        <button class="btn" :disabled="busy">Сохранить настройки</button>
        <button v-if="!state.installed" type="button" class="btn" :disabled="busy" @click="send('install')">Установить программу</button>
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
