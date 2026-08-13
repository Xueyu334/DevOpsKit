import 'element-plus/theme-chalk/dark/css-vars.css'
import './assets/global.css'
import './utils/init-prism'
import './utils/init-dayjs'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'

// 创建应用实例，后续统一注册路由与全局插件
const app = createApp(App)

// 注册路由，使页面能够基于地址进行切换
app.use(router)

// 挂载根组件，启动整个应用
app.mount('#app')
