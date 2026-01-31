import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import VueVirtualScroller from 'vue-virtual-scroller'

const app = createApp(App)
app.use(VueVirtualScroller)
app.mount('#app')
