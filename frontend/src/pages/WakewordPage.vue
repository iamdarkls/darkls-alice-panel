<script setup lang="ts">
import { ref, watch } from 'vue'
import { online, route } from '../composables/state'
import { useAction, useApi, usePolling } from '../composables/api'

type State = {installed:boolean; enabled:boolean; ready:boolean; error:string;
  bindings:Record<string,string>; audio?:{ok:boolean;error?:string};
  words?:{id:string;name:string;enabled:boolean}[];
  enroll?:{name:string;takes:number[];min_takes:number}; train?:{active:boolean;error?:string}}
const endpoint = '/api/native/wakeword'
const api = useApi()
const { busy,message,run } = useAction()
const state = ref<State>()
const scenes = ref<Record<string,{name:string}>>({})
const name = ref('')
async function refresh() {
  const [next,list] = await Promise.all([api<State>(endpoint),api('/api/native/scenes')])
  state.value = next
  scenes.value = list.items
}
async function load() {
  if (busy.value || !online.value || route.active !== 'wakeword') return
  try { await refresh() }
  catch(error) { message.value = (error as Error).message }
}
usePolling(load, 2500)
watch([online, () => route.active], load)
function send(action:string,data:Record<string,unknown>) {
  return run(async () => { await api(endpoint,{action,...data}); await refresh(); message.value='' })
}
function daemon(path:string,data={}) { return send('daemon',{path,data}) }
function install() {
  return run(async () => {
    await api('/api/yam2/action',{action:'install',name:'tangenx/wakeword'},{timeout:245000})
    await refresh()
    message.value='Пакет установлен'
  })
}
</script>

<template>
  <header class="page-head"><div><h1>Свои слова активации</h1><p>Обучи фразу для вызова Алисы, помощника или сценария.</p></div></header>
  <p v-if="message" class="hint" role="status">{{ message }}</p>
  <section class="card">
    <div class="card-head"><h2>Демон активации</h2><span class="badge">{{ state?.audio?.ok ? 'Микрофон доступен' : state?.enabled ? 'Включён в настройках' : 'Выключен' }}</span></div>
    <p class="hint">Экспериментальная функция. После включения демон запускается вместе с панелью и слушает микрофон колонки.</p>
    <p v-if="state?.error || state?.audio?.error" class="hint" role="status">{{ state.error || state.audio?.error }}</p>
    <div v-if="state" class="row">
      <button v-if="!state.installed" class="btn primary" :disabled="busy" @click="install">Установить через YAM v2</button>
      <button v-if="state.installed || state.enabled" class="btn" :disabled="busy" @click="send('config',{enabled:!state.enabled})">{{ state.enabled ? 'Выключить' : 'Включить' }}</button>
    </div>
  </section>
  <template v-if="state?.ready">
    <section class="card">
      <h2>Обучение</h2>
      <p v-if="state.train?.active">Идёт обучение…</p>
      <p v-else-if="state.train?.error" class="hint" role="status">{{ state.train.error }}</p>
      <div v-if="state.enroll">
        <p>{{ state.enroll.name }} · Записано {{ state.enroll.takes.length }} / {{ state.enroll.min_takes }}</p>
        <div class="row">
          <button class="btn" :disabled="busy" @click="daemon('/enroll/ambient')">Записать фон</button>
          <button class="btn" :disabled="busy" @click="daemon('/enroll/take')">Записать фразу</button>
          <button class="btn primary" :disabled="busy || state.enroll.takes.length < state.enroll.min_takes" @click="daemon('/enroll/train')">Обучить</button>
          <button class="btn" :disabled="busy" @click="daemon('/enroll/cancel')">Отмена</button>
        </div>
      </div>
      <form v-else class="row" @submit.prevent="daemon('/enroll/start',{name:name.trim()})">
        <label>Новая фраза <input v-model="name" maxlength="80" required></label>
        <button class="btn primary" :disabled="busy || state.train?.active || !name.trim()">Начать обучение</button>
      </form>
    </section>
    <section v-if="state.words?.length" class="card">
      <h2>Обученные фразы</h2>
      <div v-for="word in state.words" :key="word.id" class="set-item">
        <b>{{ word.name }}</b>
        <div class="row">
          <label><input type="checkbox" :checked="word.enabled" :disabled="busy" @change="daemon('/words/'+word.id,{enabled:($event.target as HTMLInputElement).checked})"> Включена</label>
          <select :value="state.bindings[word.id] || ''" :disabled="busy" :aria-label="'Действие для '+word.name" @change="send('bind',{word:word.id,scene:($event.target as HTMLSelectElement).value})">
            <option value="">Позвать Алису</option>
            <option value="@assistant">Помощник на колонке</option>
            <option v-for="(scene,key) in scenes" :key="key" :value="key">{{ scene.name }}</option>
          </select>
        </div>
      </div>
    </section>
  </template>
</template>
