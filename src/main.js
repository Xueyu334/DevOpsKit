import { createApp } from 'vue'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/zh-cn'

import App from './App.vue'
import router from './router'
import VueDiff from 'vue-diff'
import 'vue-diff/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './assets/global.css'

import { extend as colordExtend } from 'colord'
import mixPlugin from 'colord/plugins/mix'

// Configure globally
colordExtend([mixPlugin])

// Configure dayjs globally
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('zh-cn')

const app = createApp(App)

app.use(router)

app.use(VueDiff, {
  componentName: 'VueDiff'
})

app.mount('#app')
