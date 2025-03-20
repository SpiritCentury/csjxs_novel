import 'element-plus/dist/index.css'
import '@/css/main.css'
import '@/css/novelReading.css'
import '@/css/readingTool.css'
import '@/css/noteCard.css'

import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import App from './App.vue'

createApp(App).use(ElementPlus).mount('#app')
