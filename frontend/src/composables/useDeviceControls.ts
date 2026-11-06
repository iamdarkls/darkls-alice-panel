import {onBeforeUnmount, watch} from 'vue'
import {createDeviceControls} from '../device/controls.js'
import {online,route} from './state'
import {contextUrl} from './api'
const loaded=new Map<string,Promise<void>>()
function script(name:string){if(!loaded.has(name))loaded.set(name,new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=contextUrl('/static/'+name);s.onload=()=>resolve();s.onerror=()=>reject(Error('Не удалось загрузить '+name));document.head.append(s)}));return loaded.get(name)!}
export function useDeviceControls(){
 let controller:ReturnType<typeof createDeviceControls>|undefined,stopped=false
 const stopWatch=watch(()=>route.active,()=>controller?.showTab(),{flush:'post'})
 onBeforeUnmount(()=>{stopped=true;stopWatch();controller?.dispose()})
 return async()=>{
  await script('vendor/qrcode.js');await script('vendor/xterm/xterm.js');await script('vendor/xterm/addon-fit.js');await script('ui-kit.js')
  if(stopped)return
  controller=createDeviceControls({active:()=>route.active,onConnection:(value:boolean)=>{online.value=value}})
  void script('speaker-selector.js').catch(console.warn)
  void import(/* @vite-ignore */contextUrl('/static/model.js')).catch(e=>console.warn('Модель устройства:',e))
 }
}
