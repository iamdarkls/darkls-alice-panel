<script setup lang="ts">
import { ref, watch } from 'vue'
import { online, route } from '../composables/state'
import SceneSteps from '../components/SceneSteps.vue'
import { useAction, useApi, usePolling, stamp } from '../composables/api'

type Kind = 'volume' | 'ring' | 'ring-reset' | 'wait' | 'alice' | 'if-weekend'
type Step = {kind: Kind; value: number | string | null | Step[]}
type Scene = {name: string; steps: Step[]; at: string; days: number[]}
type State = {items: Record<string, Scene>; running: string | null; time: string;
  history: {name: string; at: number; source: string; result: string}[]}
const endpoint = '/api/native/scenes'
const api = useApi()
const { busy, message, run } = useAction()
const state = ref<State>()
const id = ref('')
const blank = (): Scene => ({name:'',steps:[{kind:'volume',value:35}],at:'',days:[0,1,2,3,4,5,6]})
const draft = ref(blank())
const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

async function load() {
  if (busy.value || !online.value || route.active !== 'scenes') return
  try { state.value = await api<State>(endpoint) }
  catch (error) { message.value = (error as Error).message }
}
usePolling(load, 1500)
watch([online, () => route.active], load)
function edit(key = '', scene = blank()) {
  id.value = key
  draft.value = JSON.parse(JSON.stringify(scene))
}
function send(action: string, key = id.value) {
  return run(async () => {
    state.value = await api<State>(endpoint, {action,id:key,...(action === 'save' ? draft.value : {})})
    if (action === 'save' || (action === 'delete' && key === id.value)) edit()
    message.value = action === 'save' ? 'Сценарий сохранён' : ''
  })
}
</script>

<template>
  <header class="page-head"><div><h1>Сценарии</h1><p>Действия вручную, по расписанию или по своей фразе.</p></div></header>
  <p v-if="message" class="hint" role="status">{{ message }}</p>
  <section class="card">
    <div class="card-head"><h2>Мои сценарии</h2><button class="btn" @click="load">Обновить</button></div>
    <p v-if="!Object.keys(state?.items || {}).length" class="hint">Здесь появятся сохранённые сценарии.</p>
    <article v-for="(scene,key) in state?.items" :key="key" class="set-item">
      <div><b>{{ scene.name }}</b><div class="hint">{{ scene.at || 'Без расписания' }}</div></div>
      <div class="row">
        <button v-if="state?.running === key" class="btn" :disabled="busy" @click="send('stop',key)">Остановить</button>
        <button v-else class="btn primary" :disabled="busy || !!state?.running" @click="send('run',key)">Запустить</button>
        <button class="btn" @click="edit(key,scene)">Изменить</button>
        <button class="btn" :disabled="busy || state?.running === key" @click="send('delete',key)">Удалить</button>
      </div>
    </article>
  </section>
  <form class="card" @submit.prevent="send('save')">
    <div class="card-head"><h2>{{ id ? 'Изменить сценарий' : 'Новый сценарий' }}</h2><button v-if="id" type="button" class="btn" @click="edit()">Отмена</button></div>
    <label class="row">Название <input v-model="draft.name" maxlength="80" required></label>
    <SceneSteps :steps="draft.steps" :depth="0"/>
    <label class="row">По времени колонки <input v-model="draft.at" type="time"></label>
    <p v-if="state?.time" class="hint">Время на колонке {{ state.time.slice(11,16) }}</p>
    <div v-if="draft.at" class="row">
      <label v-for="(day,index) in days" :key="day"><input v-model="draft.days" type="checkbox" :value="index"> {{ day }}</label>
    </div>
    <div class="row"><button class="btn primary" :disabled="busy">Сохранить сценарий</button></div>
  </form>
  <section v-if="state?.history.length" class="card">
    <h2>Журнал сеанса панели</h2>
    <p v-for="item in state.history" :key="item.at" class="hint">{{ stamp(item.at) }} · {{ item.name }} · {{ item.source }} · {{ item.result }}</p>
  </section>
</template>
