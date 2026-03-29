import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueDiff from 'vue-diff'
import 'vue-diff/dist/index.css'
import './assets/global.css'

const app = createApp(App)

app.use(router)

app.use(VueDiff, {
    componentName: 'VueDiff',
})

app.mount('#app')
