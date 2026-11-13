import crypto from'node:crypto';import fs from'node:fs';import http from'node:http';import path from'node:path';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||new URL('../frontend/node_modules/playwright-core/index.mjs',import.meta.url).href)
const root=fileURLToPath(new URL('../app',import.meta.url)),calls=[],errors=[];let unauthorized=false,webReady=true,mediaReady=false,termConnections=0;
let scenes={}, musicLogged=false;
const status={hostname:'Yandex-Mini-gen3-Pro-TEST',hardware_model:'pickle',ip_address:'192.0.2.10',temp:42000,mem_total:480000,mem_avail:300000,uptime:10000,load:'0.1 0.2 0.3',vol_level:100,vol_bt:100,quasar:'running',quasar_version:'factory-12',device_id:'TEST',ssid:'TEST',kernel:'5.4.242',date:'2026-11-06',ffmpeg:true,color:'blue'}
function fixture(p,body){
 if(p==='/api/conn')return{state:'online',serial:'192.0.2.10:5555',log:[]};if(p==='/api/status')return status;
 if(p==='/api/profile')return{id:'mini3pro',name:'Станция Мини 3 Про',clock:true,light:true,boot:true,alarms:true,auto:true,light_note:'Кольцо',clock_type:'segment'};
 if(p==='/api/panel-auth')return{enabled:false,authed:true,sessions:1};if(p==='/api/panel/version')return{version:'0.7.0',repo:'https://github.com/iamdarkls/darkls-alice-panel',update:{available:false},installed:true};
 if(p==='/api/darkls/health')return{native:true,device:{model:'Мини 3 Про',platform:'pickle'},adb:{state:'online',log:[]}};
 if(p==='/api/darkls/sensors')return[{id:'SOC',value:43.2,unit:'°C'}];
 if(p==='/api/apps')return{packages:[{name:'test/demo',version:'1.0.0',description:'Player',web_mode:'auto',web_detail:'Доступно',web:{port:8088,path:'/ui/',ready:webReady,source:'Порт процесса приложения'},services:[{id:'test/demo/worker',name:'worker',status:'running',pid:123,autostart:true,restart:'on-failure',runtime:'clock-compat'}]}],recovery:{checked:1700000000,ok:true,checks:[{name:'Панель',ok:true,detail:'HTTP-проверка запуска'},{name:'YAM CLI',ok:true,detail:'yam list: 0'}]}};
 if(p==='/api/apps/log')return{text:'service ready'};
 if(p==='/api/yam2/status')return{installed:true,version:'0.2.5'};if(p==='/api/yam2/packages')return[{name:'test/demo',version:'1.0.0',target:'pickle'}];if(p==='/api/yam2/registries')return[{name:'official',url:'https://repo.yse.wtf/v2'}];
 if(p==='/api/yam2/action'&&body.action==='search')return{items:[{name:'test/demo',version:'1.0.0',summary:'Test catalogue'}]};
 if(p==='/api/native/updates')return{installed:'0.7.0',feed:'https://github.com/owner/repo/releases/latest/download/update.json',auto:false,previous:'0.6.5-old',auto_cleanup:true,free:60*1048576,required_free:52*1048576,cleanup:{checked:1700000000,removed:['releases/old'],freed:1048576},status:{checked:1700000000,available:true,latest:'0.7.1',notes:'New changes'}};
 if(p==='/api/native/media')return{available:mediaReady,detail:mediaReady?'Audio ready':'WAV only'};if(p==='/api/native/media/install'){mediaReady=true;return{ok:true}};
 if(p==='/api/native/scenes'){
  if(body.action==='save')scenes={demo:{name:body.name,steps:body.steps,at:body.at,days:body.days}};
  return{items:scenes,running:null,history:[],time:'2026-11-06T16:00:00'};
 }
 if(p==='/api/native/wakeword')return{installed:true,enabled:true,ready:true,audio:{ok:true},words:[{id:'hello',name:'Привет',enabled:true}],bindings:{}};
 if(p==='/api/native/assistant')return{installed:false,enabled:false,running:false,confirmed:false,url:'',model:'',has_key:false,history:[],error:''};
 if(p==='/api/native/voice')return{url:'https://voice.test',has_token:true,compatibility_confirmed:false,note:'Unverified Mini 3 Pro'};
 if(p==='/api/native/voice/status')return{agent:'darkls-voice-agent',state:{ActiveState:'inactive'}};
 if(p==='/api/native/diagnostics')return{created:1700000000,firmware:'factory-12',checks:[{name:'Storage',status:'ok',detail:'100 MB'}]};
 if(p==='/api/native/backups')return{last_backup:{created:1700000000,size:1024}};
 if(p==='/api/music')return{auth:{logged_in:musicLogged},glagol:{connected:musicLogged,state:{playing:false,playerState:null}}};
 if(p==='/api/music/liked')return[{id:'7',title:'Избранный трек',artists:'Исполнитель'}];
 if(p==='/api/music/playlists')return[{id:'123:2',title:'Подборка',tracks:5}];
 if(p==='/api/music/play')return{status:'SUCCESS'};
 if(p==='/api/zvuk')return body.action==='search'?{tracks:[{id:'2',title:'Найденный трек',artists:'Исполнитель'}]}:{has_token:true,queue:[],track:null};
 if(p==='/api/alarms')return{alarms:[],installed:false,running:false,state:{},log:[]};
 if(p==='/api/bt')return{devices:[],available:true};if(p==='/api/clock/boot')return{frames:[{ms:100,v:Array(46).fill(0)}],default:[{ms:100,v:Array(46).fill(0)}]};
 if(p==='/api/sounds'||p==='/api/patterns'||p==='/api/logs')return[];
 if(p==='/api/fs/list')return{path:'/data/quasar',entries:[],writable:true};if(p==='/api/log')return{text:'test log'};
 if(p==='/api/metrics')return{t:[],cpu:[],temp:[],mem:[],rssi:[],disk:[],load:[],play:[],events:[],from:1700000000,to:1700003600,step:5,interval:5};if(p==='/api/footprint')return{items:[],total:0};
 if(p==='/api/speakers')return{devices:[{id:'test',name:'Тестовая колонка'},{id:'second',name:'Вторая колонка'}]};
 return{ok:true,report:'operation completed'};
}
const server=http.createServer(async(req,res)=>{let p=new URL(req.url,'http://local').pathname;const original=p;const baseline=Boolean(process.env.BASELINE_ROOT&&p.startsWith('/_baseline/'));p=p.replace(/^\/speaker\/[^/]+/,'').replace(/^\/_baseline/,'');if(p.startsWith('/api/')){const chunks=[];for await(const chunk of req)chunks.push(chunk);const raw=Buffer.concat(chunks);let body={};try{body=JSON.parse(raw.toString())}catch{}calls.push({path:original,api:p,method:req.method,body});res.setHeader('Content-Type','application/json');if(unauthorized&&p!=='/api/panel-auth/login'){res.writeHead(401);res.end(JSON.stringify({error:'Войди в панель',auth:true}));return}if(p==='/api/panel-auth/login')unauthorized=false;res.end(JSON.stringify(fixture(p,body)));return}
 if(p==='/static/model.js'){res.setHeader('Content-Type','text/javascript');res.end('document.getElementById("model-name").textContent="Станция Мини 3 Про";');return}
 if(p==='/'||p==='/index.html')p='/static/unified.html';const served=baseline?process.env.BASELINE_ROOT:root;const f=path.resolve(served,'.'+p);if(!f.startsWith(served+'/static/')||!fs.existsSync(f)){res.writeHead(404);res.end();return}res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':p.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(f)) });
server.on('upgrade',(req,socket)=>{if(!req.url.includes('/api/term')){socket.destroy();return}termConnections++;const accept=crypto.createHash('sha1').update(req.headers['sec-websocket-key']+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');const text=Buffer.from('fixture$ ');socket.write(Buffer.concat([Buffer.from([0x82,text.length]),text]));socket.on('data',data=>{if((data[0]&15)===8)socket.end(Buffer.from([0x88,0]))});socket.on('error',()=>{})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1360,height:1000},colorScheme:'dark'});page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.stack)});page.on('dialog',d=>d.accept());await page.route('https://fonts.googleapis.com/**',r=>r.abort());
 await page.goto('http://127.0.0.1:'+server.address().port+'/#apps');await page.waitForFunction(()=>document.documentElement.dataset.appReady==='true',null,{timeout:15000}).catch(async e=>{console.error('HTML',await page.locator('body').innerText());throw e});await page.waitForTimeout(150);
 assert.equal(errors.length,0,'Startup errors: '+errors.join('; '));assert.equal(await page.locator('#apps-list a[target="_blank"]').getAttribute('href'),'http://127.0.0.1:8088/ui/');assert.equal(await page.locator('#apps-boot-checks .check-row').count(),2);
 async function tab(name){await page.evaluate(n=>location.hash=n,name);await page.waitForTimeout(100);assert.equal(await page.locator('#tab-'+name).isVisible(),true);assert.equal(await page.locator('main[data-page]:visible').count(),1);assert.equal(await page.locator('nav.side a.active').getAttribute('data-tab'),name);assert.equal(await page.locator('#tab-'+name+' .page-head').isVisible(),true)}
 await page.locator('[data-app-action="restart"]').click();await page.waitForTimeout(100);assert(calls.some(c=>c.api==='/api/apps/action'&&c.body.action==='restart'));
 await page.locator('[data-app-log]').click();await page.waitForTimeout(100);assert.equal(await page.locator('#apps-log').textContent(),'service ready');
 const statusRequests=calls.filter(c=>c.api==='/api/yam2/status').length;await tab('yam');assert(calls.filter(c=>c.api==='/api/yam2/status').length>statusRequests,'Entering a tab must refresh its Vue data');await page.locator('#y2-query').fill('demo');await page.locator('#y2-search').click();await page.waitForTimeout(120);assert.equal(await page.locator('.catalog-card').count(),1);await page.locator('[data-y2-pick]').click();assert.equal(await page.locator('#y2-name').inputValue(),'test/demo');await page.locator('#y2-plan').click();await page.waitForTimeout(100);assert(calls.some(c=>c.api==='/api/yam2/action'&&c.body.action==='plan'&&c.body.name==='test/demo'));
 await tab('apps');await page.locator('#apps-list details summary').click();await page.locator('input[name="description"]').fill('Unsaved description');await tab('yam');await tab('apps');assert.equal(await page.locator('input[name="description"]').inputValue(),'Unsaved description');await page.locator('#apps-list form button[type="submit"]').click();await page.waitForTimeout(100);assert(calls.some(c=>c.api==='/api/apps/action'&&c.body.action==='metadata'&&c.body.description==='Unsaved description'));
 await tab('chatgpt');await page.locator('#voice-url').fill('https://draft.voice.test');await tab('apps');await tab('chatgpt');assert.equal(await page.locator('#voice-url').inputValue(),'https://draft.voice.test');assert.equal(await page.locator('#voice-start').isDisabled(),true);assert.equal(await page.locator('#voice-token').inputValue(),'');await page.locator('#voice-status').click();await page.waitForTimeout(100);assert.match(await page.locator('#voice-result').textContent(),/darkls-voice-agent/);
 await tab('updates');await page.locator('#native-feed').fill('https://github.com/owner/draft/releases/latest/download/update.json');await tab('apps');await tab('updates');assert.equal(await page.locator('#native-feed').inputValue(),'https://github.com/owner/draft/releases/latest/download/update.json');assert.match(await page.locator('#native-space').textContent(),/60.0 МБ/);await page.locator('#native-cleanup').click();await page.waitForTimeout(100);assert(calls.some(c=>c.api==='/api/native/updates/cleanup'&&c.method==='POST'));
 await tab('diagnostics');await page.locator('#diagnostic-run').click();await page.waitForTimeout(100);assert.equal(await page.locator('#diagnostic-checks .check-row').count(),1);assert.equal(await page.locator('#diagnostic-save').isDisabled(),false);
 await tab('scenes');await page.getByLabel('Название',{exact:true}).fill('Утро');
 await page.getByLabel('Действие',{exact:true}).selectOption('if-weekend');
 await page.locator('.scene-branch select').selectOption('volume');
 await page.getByRole('button',{name:'Сохранить сценарий'}).click();
 await page.getByText('Утро',{exact:true}).waitFor();
 assert(calls.some(c=>c.api==='/api/native/scenes'&&c.body.steps?.[0]?.value?.[0]?.kind==='volume'));
 await tab('wakeword');await page.getByLabel('Действие для Привет').selectOption('demo');
 await page.waitForTimeout(100);assert(calls.some(c=>c.api==='/api/native/wakeword'&&c.body.scene==='demo'));
 for(const name of ['home','overview','player','alarm','charts','boot','files','logs','console','settings','backups'])await tab(name);
 musicLogged=true;await tab('player');
 await page.getByRole('button',{name:'Избранное',exact:true}).click();
 await page.getByText('Избранный трек',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Играть всё',exact:true}).click();
 await page.getByText('Команда отправлена',{exact:true}).waitFor();
 assert(calls.some(c=>c.api==='/api/music/play'&&c.body.type==='likes'));
 await page.getByRole('button',{name:'Плейлисты',exact:true}).click();
 await page.getByText('Подборка',{exact:true}).click();
 await page.getByText('Команда отправлена',{exact:true}).waitFor();
 assert(calls.some(c=>c.api==='/api/music/play'&&c.body.id==='123:2'));
 await page.getByRole('button',{name:'Сбер Звук',exact:true}).click();
 await page.getByRole('textbox',{name:'Поиск в Сбер Звуке'}).fill('Тест');
 await page.getByRole('button',{name:'Найти',exact:true}).click();
 await page.getByText('Найденный трек',{exact:true}).waitFor();
 const sidebar=page.getByRole('button',{name:'Свернуть меню',exact:true});
 await sidebar.click();await page.getByRole('button',{name:'Развернуть меню',exact:true}).click();
 const connectionCount=termConnections;assert(connectionCount>0);await tab('apps');await tab('console');assert.equal(termConnections,connectionCount,'Switching tabs must preserve terminal session');
 await tab('settings');await page.locator('#media-install').click();await page.waitForTimeout(100);assert(calls.some(c=>c.api==='/api/native/media/install'));await tab('settings');
 assert.equal(await page.locator('nav.side a:not(:has(svg))').count(),0);
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Ещё',exact:true}).click();
 await page.locator('nav.side a[data-tab="console"]').click();
 await page.locator('[data-term-key="interrupt"]').waitFor({state:'visible'});
 assert.equal(await page.locator('nav.side').isVisible(),false);
 await tab('yam');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await page.setViewportSize({width:320,height:740});await tab('apps');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
 await page.setViewportSize({width:1360,height:1000});await page.emulateMedia({colorScheme:'light'});assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(246, 246, 248)');
 assert.equal(errors.length,0,'Page errors: '+errors.join('; '));
 await page.goto('http://127.0.0.1:'+server.address().port+'/speaker/test/#apps');await page.waitForFunction(()=>document.documentElement.dataset.appReady==='true');await page.waitForTimeout(100);assert(calls.some(c=>c.path==='/speaker/test/api/apps'));assert.equal(await page.locator('#speaker-select').count(),1);
 unauthorized=true;await page.evaluate(()=>dispatchEvent(new Event('darkls:authchanged')));await page.waitForFunction(()=>document.querySelector('#login-dialog').open);await page.locator('#login-password').fill('test-only');await page.locator('#login-form button').click();await page.waitForTimeout(100);assert.equal(await page.locator('#login-dialog').evaluate(e=>e.open),false);
 if(process.env.BASELINE_ROOT){
  fs.mkdirSync('/tmp/vue-layout',{recursive:true});const measures={};
  for(const mode of ['old','vue']){const p=await browser.newPage({viewport:{width:1360,height:1000},colorScheme:'dark'});await p.route('https://fonts.googleapis.com/**',r=>r.abort());await p.addInitScript(()=>{localStorage.setItem('ui.viz','0');Date.now=()=>1793970000000});
   await p.goto('http://127.0.0.1:'+server.address().port+(mode==='old'?'/_baseline/':'/')+'#apps');await p.waitForTimeout(700);
   for(const tabName of ['apps','yam','home','overview','player','settings','updates','chatgpt','backups','diagnostics']){await p.evaluate(n=>location.hash=n,tabName);await p.waitForTimeout(150);if(tabName==='yam'){await p.locator('#y2-search').click();await p.waitForTimeout(150)}
    measures[mode+':'+tabName]=await p.locator('#tab-'+tabName).evaluate(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,cards:[...e.querySelectorAll(':scope > .card')].map(c=>({width:c.getBoundingClientRect().width,height:c.getBoundingClientRect().height}))}));
    await p.screenshot({path:'/tmp/vue-layout/'+mode+'-'+tabName+'.png',fullPage:true,animations:'disabled'});
   }if(mode==='old')fs.writeFileSync('/tmp/vue-layout/old-icons.json',JSON.stringify(await p.locator('h1,h2,h3,button.btn,a.btn').evaluateAll(nodes=>nodes.map(e=>({id:e.id,text:e.textContent.trim(),icon:e.querySelector('svg use')?.getAttribute('href')})))));await p.close();
  }fs.writeFileSync('/tmp/vue-layout/measurements.json',JSON.stringify(measures,null,2));
 }
 console.log('Vue production UI: 18 tabs, actions, retained forms/terminal session, local icons, 320/390/1360px, themes, speaker context, login: OK');
}finally{await browser.close();await new Promise(r=>server.close(r))}
