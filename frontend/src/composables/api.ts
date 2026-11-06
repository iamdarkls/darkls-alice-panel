import { onBeforeUnmount, onMounted, ref } from 'vue'
declare global { interface Window {PanelContext:{url:(p:string)=>string,fetch:typeof fetch,deviceId:string};DarklsUI:any} }
export function contextUrl(path:string){return window.PanelContext?.url(path)||path}
export function useApi(){
 const scope=new AbortController();onBeforeUnmount(()=>scope.abort())
 return async function api<T=any>(path:string,body?:unknown,options:{raw?:boolean,timeout?:number,headers?:Record<string,string>}={}):Promise<T>{
  const request=new AbortController(),cancel=()=>request.abort();scope.signal.addEventListener('abort',cancel,{once:true});if(scope.signal.aborted)request.abort();const timeout=setTimeout(()=>request.abort(),options.timeout||130000);const signal=request.signal
  try {const response=await fetch(contextUrl(path),{cache:'no-store',signal,...(body===undefined?{}:{method:'POST',headers:{'Content-Type':options.raw?'application/octet-stream':'application/json',...options.headers},body:options.raw?body as BodyInit:JSON.stringify(body)})})
  const value=await response.json();if(!response.ok){if(response.status===401)window.dispatchEvent(new Event('panel:login-required'));throw Error(value.error||`HTTP ${response.status}`)}return value}finally{clearTimeout(timeout);scope.signal.removeEventListener('abort',cancel)}
 }
}
export function useEvents(load:()=>unknown,events=['hashchange','darkls:authchanged']){onMounted(()=>events.forEach(e=>window.addEventListener(e,load)));onBeforeUnmount(()=>events.forEach(e=>window.removeEventListener(e,load)))}
export function usePolling(load:()=>unknown,ms:number,when=()=>true){onMounted(()=>{void load();const timer=setInterval(()=>{if(!document.hidden&&when())void load()},ms);onStop=()=>clearInterval(timer)});let onStop=()=>{};onBeforeUnmount(()=>onStop())}
export function useAction(message=ref('')){const busy=ref(false);async function run(action:()=>Promise<unknown>){if(busy.value)return;busy.value=true;message.value='Выполняется…';try{await action()}catch(e){message.value=e instanceof Error?e.message:String(e)}finally{busy.value=false}}return{busy,message,run}}
export const stamp=(n?:number)=>n?new Date(n*1000).toLocaleString('ru-RU'):'Ещё не выполнялась'
export function download(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)}
