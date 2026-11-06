<script setup lang="ts">
import {ref,onMounted,onBeforeUnmount} from 'vue';import {useApi} from '../composables/api';import UiIcon from './UiIcon.vue'
const dialog=ref<HTMLDialogElement>(),password=ref(''),error=ref(''),busy=ref(false),api=useApi()
function open(){if(!dialog.value?.open)dialog.value?.showModal()}
async function login(){if(busy.value)return;busy.value=true;error.value='';try{await api('/api/panel-auth/login',{password:password.value});password.value='';dialog.value?.close();dispatchEvent(new Event('darkls:authchanged'))}catch(e){error.value=(e as Error).message}finally{busy.value=false}}
onMounted(()=>addEventListener('panel:login-required',open));onBeforeUnmount(()=>removeEventListener('panel:login-required',open))
</script>
<template><dialog id="login-dialog" ref="dialog" @cancel.prevent><form id="login-form" @submit.prevent="login"><h2><UiIcon name="lock"/>Вход в панель</h2><p class="hint">Введи пароль панели.</p><input id="login-password" v-model="password" class="field" type="password" autocomplete="current-password" placeholder="Пароль" required><p id="login-error" role="alert">{{error}}</p><button class="btn primary" type="submit" :disabled="busy"><UiIcon name="lock"/>Войти</button></form></dialog></template>
