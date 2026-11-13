<script setup lang="ts">
import { ref } from 'vue'
import { useAction, useApi } from '../composables/api'

type Track = {id:string;title:string;artists:string;cover?:string;durationMs?:number}
type Playlist = {id:string;title:string;tracks:number;cover?:string}
type View = 'queue'|'album'|'similar'|'liked'|'playlists'
const tabs: {id:View;title:string}[] = [
  {id:'queue',title:'Очередь'}, {id:'album',title:'Альбом'}, {id:'similar',title:'Похожие'},
  {id:'liked',title:'Избранное'}, {id:'playlists',title:'Плейлисты'},
]
const api = useApi()
const {busy,message,run} = useAction()
const view = ref<View>('queue')
const tracks = ref<Track[]>([])
const playlists = ref<Playlist[]>([])
const title = ref('')
const activeAlbum = ref('')
const navigation = ref<HTMLElement>()
const format = (ms:number) => {
  const seconds = Math.floor(ms / 1000)
  return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2,'0')
}

function select(next:View) {
  view.value = next
  message.value = ''
  if (next === 'queue' || next === 'similar') return
  return run(async () => {
    tracks.value = []
    playlists.value = []
    title.value = ''
    activeAlbum.value = ''
    if (next === 'album') {
      const id = navigation.value?.dataset.albumId
      if (!id) throw Error('У текущего трека нет доступного альбома')
      const album = await api<{title:string;tracks:Track[]}>('/api/music/album?id=' + encodeURIComponent(id))
      tracks.value = album.tracks
      title.value = album.title
      activeAlbum.value = id
    } else if (next === 'liked') {
      tracks.value = await api<Track[]>('/api/music/liked')
    } else {
      playlists.value = await api<Playlist[]>('/api/music/playlists')
    }
    message.value = ''
  })
}
function play(id:string,type:string) {
  return run(async () => {
    const result = await api<{status?:string}>('/api/music/play',{id,type})
    if (result.status && result.status !== 'SUCCESS') throw Error('Колонка ответила: ' + result.status)
    message.value = 'Команда отправлена'
  })
}
</script>

<template>
  <section class="card pl-ya-only">
    <div id="pl-list-tabs" ref="navigation" class="row music-tabs" role="group" aria-label="Списки Яндекс Музыки">
      <button v-for="tab in tabs" :key="tab.id" type="button" class="btn sm"
              :class="{primary:view===tab.id}" :aria-pressed="view===tab.id" :disabled="busy"
              @click="select(tab.id)">{{ tab.title }}</button>
    </div>
    <div v-show="view==='queue'">
      <div class="card-head"><h2 id="pl-q-title">Очередь</h2><span class="meta" id="pl-q-count"></span></div>
      <button id="pl-queue-play" type="button" class="btn sm" hidden
              @click="play(navigation?.dataset.queueId || '', navigation?.dataset.queueType || '')">Играть всё</button>
      <div class="tlist" id="pl-queue"><div class="empty">—</div></div>
    </div>
    <div v-show="view==='similar'">
      <div class="tlist" id="pl-similar"><div class="empty">—</div></div>
    </div>
    <template v-if="view==='album' || view==='liked'">
      <h3 v-if="title">{{ title }}</h3>
      <div v-if="tracks.length" class="row">
        <button v-if="view==='liked' || activeAlbum" class="btn sm" :disabled="busy"
                @click="play(activeAlbum,view==='album'?'album':'likes')">Играть всё</button>
      </div>
      <div class="tlist">
        <div v-for="(track,index) in tracks" :key="index" class="trow">
          <img v-if="track.cover" :src="track.cover" alt="" loading="lazy"><span v-else class="ph"></span>
          <span class="tt"><b>{{ track.title }}</b><span>{{ track.artists }}</span></span>
          <span v-if="track.durationMs" class="td">{{ format(track.durationMs) }}</span>
        </div>
        <div v-if="!tracks.length && !message" class="empty">Треков нет</div>
      </div>
    </template>
    <div v-if="view==='playlists'" class="tlist">
      <button v-for="playlist in playlists" :key="playlist.id" class="trow" :disabled="busy"
              @click="play(playlist.id,'playlist')">
        <img v-if="playlist.cover" :src="playlist.cover" alt="" loading="lazy"><span v-else class="ph"></span>
        <span class="tt"><b>{{ playlist.title }}</b><span>Треков: {{ playlist.tracks }}</span></span>
      </button>
      <div v-if="!playlists.length && !message" class="empty">Плейлистов нет</div>
    </div>
    <p v-if="message" class="hint" role="status">{{ message }}</p>
  </section>
</template>
