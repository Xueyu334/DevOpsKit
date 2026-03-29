import { createRouter, createWebHistory } from 'vue-router'

import Layout from '../layout/index.vue'
import Home from '../views/Home.vue'
import TextDiff from '../views/text-diff/index.vue'
import JsonTools from '../views/json-tools/index.vue'
import Base64 from '../views/base64/index.vue'
import UrlEncode from '../views/url-encode/index.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    redirect: '/home',
    children: [
      {
        path: '/home', // 也可以写 'home'，使用 absolute path 保持兼容
        name: 'home',
        component: Home, // 真实的首页组件
        meta: { title: '首页' }
      },
      {
        path: '/text-diff',
        name: 'textDiff',
        component: TextDiff,
        meta: { title: '文本比对' }
      },
      {
        path: '/json-tools',
        name: 'jsonTools',
        component: JsonTools,
        meta: { title: 'JSON 工具' }
      },
      {
        path: '/base64',
        name: 'base64',
        component: Base64,
        meta: { title: 'Base64 编解码' }
      },
      {
        path: '/url-encode',
        name: 'urlEncode',
        component: UrlEncode,
        meta: { title: 'URL 编解码' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 添加路由前置守卫用于动态更新标题
router.beforeEach((to, from, next) => {
  const title = to.meta.title
  if (title) {
    document.title = `${title} - DevOpsKit`
  } else {
    document.title = 'DevOpsKit'
  }
  next()
})

export default router
