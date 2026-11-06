<script setup lang="ts">
import{ref,onMounted}from'vue';import{useApi,useEvents,useAction}from'../composables/api';import UiIcon from'./UiIcon.vue'
const api=useApi(),status=ref('Проверяем FFmpeg…'),available=ref(false),{busy,run}=useAction(status)
async function load(){try{const v=await api('/api/native/media');status.value=v.detail+(v.compressed_size?' · на /data '+(v.compressed_size/1048576).toFixed(1)+' МБ':'');available.value=v.available}catch(e){status.value=(e as Error).message}}
function install(){if(confirm('Скачать аудио-FFmpeg ARM64 на колонку? Примерно 11 МБ загрузки. Совместимость будет проверена перед установкой.'))void run(async()=>{await api('/api/native/media/install',{}, {timeout:240000});await load()})}onMounted(load);useEvents(load)
</script>
<template><section class="card" id="media-tools"><div class="card-head"><h2><UiIcon name="music"/>Аудиоформаты</h2></div><p class="hint">FFmpeg работает прямо на колонке. Сжатая копия хранится в /data, рабочая — в оперативной памяти /tmp и восстанавливается после перезагрузки.</p><p class="hint" id="media-status">{{status}}</p><button v-show="!available" class="btn primary" id="media-install" :disabled="busy" @click="install"><UiIcon name="dl"/>Установить аудио-FFmpeg</button></section></template>
