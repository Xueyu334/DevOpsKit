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

// 为 colord 注册混色插件，供全局颜色计算逻辑复用
colordExtend([mixPlugin])

// 统一配置 dayjs 的时区与中文语言环境，避免各页面重复初始化
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('zh-cn')

// 创建应用实例，后续统一注册路由与全局插件
const app = createApp(App)

// 注册路由，使页面能够基于地址进行切换
app.use(router)

// 注册文本差异对比组件，统一暴露为 VueDiff
app.use(VueDiff, {
  componentName: 'VueDiff'
})

// 挂载根组件，启动整个应用
app.mount('#app')
