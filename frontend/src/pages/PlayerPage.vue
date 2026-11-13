<script setup lang="ts">
import { ref } from 'vue'
import MusicLibrary from '../components/MusicLibrary.vue'
import ZvukPlayer from '../components/ZvukPlayer.vue'
const provider = ref<'yandex'|'zvuk'>('yandex')
</script>

<template>
    <header class="page-head"><div><h1>Плеер</h1><div class="sub" id="pl-source">—</div></div></header>
    <div class="row music-tabs" role="group" aria-label="Музыкальный сервис">
      <button class="btn" :class="{primary:provider==='yandex'}" :aria-pressed="provider==='yandex'" @click="provider='yandex'">Яндекс Музыка</button>
      <button class="btn" :class="{primary:provider==='zvuk'}" :aria-pressed="provider==='zvuk'" @click="provider='zvuk'">Сбер Звук</button>
    </div>
    <ZvukPlayer v-show="provider==='zvuk'" :active="provider==='zvuk'"/>
    <div v-show="provider==='yandex'" class="col" style="gap:14px">
    <section class="card" id="pl-login" hidden>
      <h2>Нужен вход в Яндекс</h2>
      <p class="hint">Войдите в виджете «Сейчас играет» на «Обзоре» — по QR-коду или через страницу Яндекса.</p>
      <div class="row"><a class="btn primary" href="#overview">Перейти на «Обзор»</a></div>
    </section>
    <div id="pl-body" class="col" style="gap:14px">
      <section class="card pl-hero">
        <div class="pl-cover mu-cover"><svg width="64" height="64" aria-hidden="true"><use href="#i-music"/></svg></div>
        <div class="col pl-main" style="gap:12px">
          <div class="pl-kicker" id="pl-kind">Трек</div>
          <h2 class="pl-title mu-title">Ничего не играет</h2>
          <div class="pl-artist mu-artist"></div>
          <div class="pl-meta" id="pl-meta"></div>
          <div class="progress"><span class="mu-pos">0:00</span><input type="range" class="mu-seek" min="0" max="100" value="0" step="1" aria-label="Позиция в треке"><span class="mu-dur">0:00</span></div>
          <div class="controls pl-controls" data-mu-controls="full"></div>
          <div class="mu-volrow"><svg width="18" height="18" aria-hidden="true"><use href="#i-vol"/></svg>
            <input type="range" class="mu-vol" min="0" max="100" step="5" aria-label="Громкость"><span class="mono mu-vol-v">—</span></div>
          <form class="row mu-ask-form" style="gap:8px">
            <input class="field" name="text" placeholder="Попросить Алису: «включи что-нибудь весёлое»" style="flex:1;min-width:160px" aria-label="Команда Алисе">
            <button class="btn sm" style="min-height:42px">Отправить</button>
          </form>
        </div>
      </section>
      <div class="cols pl-body-cols">
        <section class="card">
          <div class="card-head"><h2>Текст песни</h2><span class="meta" id="pl-ly-meta"></span></div>
          <div class="lyrics" id="pl-lyrics"><div class="empty">—</div></div>
          <p class="hint" id="pl-ly-src" hidden></p>
        </section>
        <MusicLibrary/>
      </div>
      <section class="card pl-ya-only" id="pl-artist-card">
        <h2>Об исполнителе</h2>
        <div id="pl-artist"><div class="empty">—</div></div>
      </section>
      <section class="card">
        <details id="pl-raw-box"><summary>Всё, что сообщает колонка</summary><dl class="kv" id="pl-raw" style="margin-top:10px"></dl></details>
      </section>
    </div>
    </div>
  </template>