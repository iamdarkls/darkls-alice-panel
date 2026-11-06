import {createApp}from'vue'
import App from'./App.vue'
import{syncRoute}from'./composables/state'
import './styles/panel.css'
import '../../app/static/unified.css'
import '../../app/static/model.css'
import '../../app/static/ui-polish.css'
addEventListener('hashchange',syncRoute)
createApp(App).mount('#app')
