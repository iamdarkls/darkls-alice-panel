<script setup lang="ts">
import { ref } from 'vue'
import { useAction, useApi, usePolling } from '../composables/api'
import { route } from '../composables/state'

type Track = {id:string;title:string;artists:string;cover?:string;duration?:number;liked?:boolean}
type State = {has_token:boolean;playing:boolean;paused:boolean;track:Track|null;queue:Track[];index:number;position:number;duration:number}
const props = defineProps<{active:boolean}>()
const api = useApi()
const {busy,message,run} = useAction()
const state = ref<State>()
const query = ref('')
const token = ref('')
const tracks = ref<Track[]>([])
const listTitle = ref('')
const language = ref('any')
const mood = ref('')
const popular = ref('')
const genre = ref('')
const position = ref<number>()
const endpoint = '/api/zvuk'
const format = (seconds:number) => Math.floor(seconds/60) + ':' + String(Math.floor(seconds%60)).padStart(2,'0')

async function load() {
  if (!props.active || route.active !== 'player' || busy.value) return
  try {
    state.value = await api<State>(endpoint)
  } catch (error) {
    message.value = (error as Error).message
  }
}
usePolling(load,1500,() => props.active && route.active==='player')

function action(name:string,fields:Record<string,unknown>={}) {
  return run(async () => {
    const result = await api<State & {tracks?:Track[]}>(endpoint,{action:name,...fields})
    if (typeof result.has_token === 'boolean') state.value = result
    if (name === 'token') token.value = ''
    if (name === 'logout') { tracks.value = []; listTitle.value = '' }
    if (['search','favorites','album','similar'].includes(name)) {
      tracks.value = result.tracks || []
      listTitle.value = ({search:'Результаты поиска',favorites:'Избранное',album:'Альбом',similar:'Похожие треки'})[name] || ''
    }
    message.value = ''
  })
}
</script>

<template>
  <section class="card col">
    <h2>Сбер Звук <span class="badge">Экспериментально</span></h2>
    <p v-if="message" class="hint" role="status">{{ message }}</p>
    <p v-if="!state && !message" class="hint">Проверяем подключение…</p>
    <form v-if="state && !state.has_token" class="col" @submit.prevent="action('token',{token})">
      <p class="hint">Войди в Сбер Звук и скопируй токен веб-сессии из профиля. Для воспроизведения нужно активное подключение колонки к Glagol.</p>
      <div class="row">
        <a class="btn sm" href="https://zvuk.com/api/tiny/profile" target="_blank" rel="noopener noreferrer">Открыть профиль Звука</a>
      </div>
      <label>Токен сессии <input v-model="token" class="field" type="password" required autocomplete="new-password"></label>
      <div class="row"><button class="btn primary" :disabled="busy">Подключить</button></div>
    </form>
    <template v-if="state?.has_token">
      <form class="row" @submit.prevent="action('search',{q:query.trim()})">
        <input v-model="query" class="field" aria-label="Поиск в Сбер Звуке" placeholder="Трек или исполнитель" maxlength="160" required>
        <button class="btn" :disabled="busy">Найти</button>
      </form>
      <div class="row music-tabs">
        <button class="btn primary" :disabled="busy" @click="action('flow',{language,mood,popular,genre})">Мой поток</button>
        <button class="btn" :disabled="busy" @click="action('favorites')">Избранное</button>
        <button class="btn" :disabled="busy" @click="action('logout')">Отключить аккаунт</button>
      </div>
      <details>
        <summary>Настроить поток</summary>
        <div class="row">
          <label>Язык <select v-model="language" class="field"><option value="any">Любой</option><option value="ru">Русский</option><option value="en">Английский</option></select></label>
          <label>Настроение <input v-model="mood" class="field" maxlength="32"></label>
          <label>Популярность <input v-model="popular" class="field" maxlength="32"></label>
          <label>Жанр <input v-model="genre" class="field" maxlength="48"></label>
        </div>
      </details>
      <div v-if="state.track" class="col">
        <h3>{{ state.track.title }}</h3>
        <span class="hint">{{ state.track.artists }}</span>
        <div v-if="state.duration>0" class="progress">
          <span>{{ format(position ?? state.position) }}</span>
          <input type="range" min="0" :max="state.duration" :value="position ?? state.position" aria-label="Позиция в треке Звука"
                 @input="position=Number(($event.target as HTMLInputElement).value)"
                 @change="action('seek',{position:Number(($event.target as HTMLInputElement).value)}).finally(()=>position=undefined)">
          <span>{{ format(state.duration) }}</span>
        </div>
        <div class="row music-tabs">
          <button class="btn" :disabled="busy" @click="action('prev')">Назад</button>
          <button class="btn primary" :disabled="busy" @click="action(state.playing?'pause':'resume')">{{ state.playing?'Пауза':'Продолжить' }}</button>
          <button class="btn" :disabled="busy" @click="action('next')">Дальше</button>
          <button class="btn" :disabled="busy" @click="action('stop')">Стоп</button>
          <button class="btn" :disabled="busy" @click="action('album')">Альбом</button>
          <button class="btn" :disabled="busy" @click="action('similar')">Похожие</button>
          <button class="btn" :disabled="busy" @click="action('like',{track_id:state.track.id,on:!state.track.liked})">{{ state.track.liked?'Убрать лайк':'Лайк' }}</button>
        </div>
      </div>
      <template v-if="listTitle">
        <div class="card-head"><h3>{{ listTitle }}</h3><button v-if="tracks.length" class="btn sm" :disabled="busy" @click="action('play-list',{tracks})">Играть всё</button></div>
        <div class="tlist">
          <button v-for="track in tracks" :key="track.id" class="trow" :disabled="busy" @click="action('play',{track})">
            <img v-if="track.cover" :src="track.cover" alt="" loading="lazy"><span v-else class="ph"></span>
            <span class="tt"><b>{{ track.title }}</b><span>{{ track.artists }}</span></span>
          </button>
          <div v-if="!tracks.length" class="empty">Треков нет</div>
        </div>
      </template>
      <details v-if="state.queue.length">
        <summary>Очередь</summary>
        <div class="tlist">
          <button v-for="(track,index) in state.queue" :key="index" class="trow" :class="{cur:state.index===index}" :disabled="busy" @click="action('jump',{index})">
            <span class="tt"><b>{{ track.title }}</b><span>{{ track.artists }}</span></span>
          </button>
        </div>
      </details>
    </template>
  </section>
</template>
