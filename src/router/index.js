import { createRouter, createWebHistory } from 'vue-router'

import Layout from '@/layout/index.vue'

/**
 * 路由配置数组。
 * 包含应用的导航路径、组件绑定以及相关的元信息。
 * 每个路由对象定义一个路径与组件的映射关系。
 */
const routes = [
  {
    path: '/',
    component: Layout,
    redirect: '/home',
    children: [
      {
        path: '/home', // 也可以写 'home'，使用 absolute path 保持兼容
        name: 'home',
        component: () => import('@/views/Home.vue'), // 真实的首页组件
        meta: { title: '首页' }
      },
      {
        path: '/text-diff',
        name: 'textDiff',
        component: () => import('@/views/text-diff/index.vue'),
        meta: { title: '文本比对' }
      },
      {
        path: '/json-tools',
        name: 'jsonTools',
        component: () => import('@/views/json-tools/index.vue'),
        meta: { title: 'JSON 工具' }
      },
      {
        path: '/ascii-table',
        name: 'asciiTable',
        component: () => import('@/views/ascii-table/index.vue'),
        meta: { title: 'ASCII码对照表' }
      },
      {
        path: '/ascii-banner',
        name: 'asciiBanner',
        component: () => import('@/views/ascii-banner/index.vue'),
        meta: { title: 'ASCII 艺术字生成' }
      },
      {
        path: '/base64',
        name: 'base64',
        component: () => import('@/views/base64/index.vue'),
        meta: { title: 'Base64 编解码' }
      },
      {
        path: '/hash-gen',
        name: 'hashGen',
        component: () => import('@/views/hash-gen/index.vue'),
        meta: { title: 'Hash 生成器' }
      },
      {
        path: '/image-to-base64',
        name: 'imageBase64',
        component: () => import('@/views/image-to-base64/index.vue'),
        meta: { title: '图片转 Base64' }
      },
      {
        path: '/base64-to-image',
        name: 'base64Image',
        component: () => import('@/views/base64-to-image/index.vue'),
        meta: { title: 'Base64 转图片' }
      },
      {
        path: '/url-encode',
        name: 'urlEncode',
        component: () => import('@/views/url-encode/index.vue'),
        meta: { title: 'URL 编解码' }
      },
      {
        path: '/id-card-generator',
        name: 'idCardGenerator',
        component: () => import('@/views/id-card-generator/index.vue'),
        meta: { title: '身份证号码生成器' }
      },
      {
        path: '/docker-commands',
        name: 'dockerCommands',
        component: () => import('@/views/docker-commands/index.vue'),
        meta: { title: 'Docker 命令大全备查' }
      },
      {
        path: '/nginx-reference',
        name: 'nginxReference',
        component: () => import('@/views/nginx-reference/index.vue'),
        meta: { title: 'Nginx 命令与配置大全' }
      },
      {
        path: '/qrcode-generator',
        name: 'qrcodeGenerator',
        component: () => import('@/views/qrcode-generator/index.vue'),
        meta: { title: '二维码生成器' }
      },
      {
        path: '/mermaid-editor',
        name: 'mermaidEditor',
        component: () => import('@/views/mermaid-editor/index.vue'),
        meta: { title: 'Mermaid 图表渲染' }
      },
      {
        path: '/password-generator',
        name: 'passwordGenerator',
        component: () => import('@/views/password-generator/index.vue'),
        meta: { title: '密码生成器' }
      },
      {
        path: '/timestamp-converter',
        name: 'timestampConverter',
        component: () => import('@/views/timestamp-converter/index.vue'),
        meta: { title: '时间戳转换' }
      },
      {
        path: '/color-converter',
        name: 'colorConverter',
        component: () => import('@/views/color-converter/index.vue'),
        meta: { title: '颜色转换' }
      },
      {
        path: '/css-gradient',
        name: 'cssGradient',
        component: () => import('@/views/css-gradient/index.vue'),
        meta: { title: 'CSS 渐变生成器' }
      },
      {
        path: '/base-converter',
        name: 'baseConverter',
        component: () => import('@/views/base-converter/index.vue'),
        meta: { title: '进制转换' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: () => import('@/views/not-found/index.vue'),
    meta: { title: '404' }
  }
]

// 导入增强版进度条工具
import progress from '@/utils/nprogress'

// 路由配置... (省略 routes 变量部分)

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 添加路由前置守卫用于动态更新标题和开启进度条
router.beforeEach(to => {
  progress.start() // 使用增强版 start
  const title = to.meta.title
  if (title) {
    document.title = `${title} - DevOpsKit`
  } else {
    document.title = 'DevOpsKit'
  }
  return true
})

// 添加路由后置守卫关闭进度条
router.afterEach(() => {
  progress.done() // 使用增强版 done
})

// 处理路由解析错误，防止进度条卡死
router.onError(error => {
  progress.clear() // 发生错误时强制清理
  console.error('Router Error:', error)
})

export default router
