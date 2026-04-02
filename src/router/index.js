import {createRouter, createWebHistory} from 'vue-router'

import Layout from '../layout/index.vue'
import Home from '../views/Home.vue'
import TextDiff from '../views/text-diff/index.vue'
import JsonTools from '../views/json-tools/index.vue'
import AsciiTable from '../views/ascii-table/index.vue'
import Base64 from '../views/base64/index.vue'
import HashGen from '../views/hash-gen/index.vue'
import UrlEncode from '../views/url-encode/index.vue'
import IdCardGenerator from '../views/id-card-generator/index.vue'
import DockerCommands from '../views/docker-commands/index.vue'
import NginxReference from '../views/nginx-reference/index.vue'
import QrcodeGenerator from '../views/qrcode-generator/index.vue'
import NotFound from '../views/not-found/index.vue'

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
                meta: {title: '首页'}
            },
            {
                path: '/text-diff',
                name: 'textDiff',
                component: TextDiff,
                meta: {title: '文本比对'}
            },
            {
                path: '/json-tools',
                name: 'jsonTools',
                component: JsonTools,
                meta: {title: 'JSON 工具'}
            },
            {
                path: '/ascii-table',
                name: 'asciiTable',
                component: AsciiTable,
                meta: {title: 'ASCII码对照表'}
            },
            {
                path: '/base64',
                name: 'base64',
                component: Base64,
                meta: {title: 'Base64 编解码'}
            },
            {
                path: '/hash-gen',
                name: 'hashGen',
                component: HashGen,
                meta: {title: 'Hash 生成器'}
            },
            {
                path: '/url-encode',
                name: 'urlEncode',
                component: UrlEncode,
                meta: {title: 'URL 编解码'}
            },
            {
                path: '/id-card-generator',
                name: 'idCardGenerator',
                component: IdCardGenerator,
                meta: {title: '身份证号码生成器'}
            },
            {
                path: '/docker-commands',
                name: 'dockerCommands',
                component: DockerCommands,
                meta: {title: 'Docker 命令大全备查'}
            },
            {
                path: '/nginx-reference',
                name: 'nginxReference',
                component: NginxReference,
                meta: {title: 'Nginx 命令与配置大全'}
            },
            {
                path: '/qrcode-generator',
                name: 'qrcodeGenerator',
                component: QrcodeGenerator,
                meta: {title: '二维码生成器'}
            }
        ]
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'notFound',
        component: NotFound,
        meta: {title: '404'}
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
})

// 添加路由前置守卫用于动态更新标题
router.beforeEach((to) => {
    const title = to.meta.title
    if (title) {
        document.title = `${title} - DevOpsKit`
    } else {
        document.title = 'DevOpsKit'
    }
})

export default router
