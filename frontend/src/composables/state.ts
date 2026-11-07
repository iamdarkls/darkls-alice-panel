import { computed, reactive, ref } from 'vue'
export const tabs=['apps','yam','home','diagnostics','updates','backups','chatgpt','overview','player','alarm','charts','boot','files','logs','console','settings','scenes','wakeword'] as const
export type Tab=typeof tabs[number]
export const online=ref(false)
const hash=ref(location.hash.slice(1))
export const route=reactive({active:computed<Tab>(()=>tabs.includes(hash.value as Tab)?hash.value as Tab:online.value?'overview':'home')})
export const direct=new Set(['apps','yam','home','diagnostics','settings','updates','backups','chatgpt'])
export function syncRoute(){hash.value=location.hash.slice(1)}
export const health=reactive<{info:any,error:string}>({info:null,error:''})
export const packages=ref<any[]>([])
export const yamVersion=ref('Проверяем…')
