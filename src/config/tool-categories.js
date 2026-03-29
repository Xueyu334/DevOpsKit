// Element Plus el-tag 的 type 可选值：
// ''(默认), 'primary', 'success', 'info', 'warning', 'danger'
export const tagTypeHints = {
    '': '默认标签风格',
    primary: '主色标签，适合默认推荐项',
    success: '成功标签，适合稳定可用或已完成功能',
    info: '信息标签，适合中性说明或开发类工具',
    warning: '警告标签，适合实验性或需要注意的功能',
    danger: '高亮标签，适合热点、重点推荐或高优先级功能'
}

export const toolCategories = [
    {
        name: '文本与代码处理',
        menuKey: 'text-and-code',
        tools: [
            {
                id: 'text-diff',
                name: '文本比对 (Text Diff)',
                menuTitle: '文本比对',
                desc: '支持大文本、多语言的代码和普通文本差异对比，提供并排和统一模式。',
                keywords: ['diff', 'text diff', 'compare', '文本对比', '差异比对', '代码比对'],
                route: '/text-diff',
                svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="13" x2="12" y2="17"/><line x1="10" y1="15" x2="14" y2="15"/></svg>',
                color: '#409EFF',
                tag: 'Hot',
                tagType: 'danger',
                tagTip: '热点工具，优先推荐体验'
            },
            {
                id: 'json-tools',
                name: 'JSON 工具',
                menuTitle: 'JSON 工具',
                desc: 'JSON 格式化、压缩、转译、解析以及结构校验。',
                keywords: ['json', 'format json', 'json格式化', 'json压缩', 'json校验', 'json解析'],
                route: '/json-tools',
                svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1 2-2V5a2 2 0 0 0-2-2h-1"/></svg>',
                color: '#67C23A',
                tag: 'Dev',
                tagType: 'info',
                tagTip: '开发向工具，适合调试与数据处理'
            }
        ]
    },
    {
        name: '编解码与加密',
        menuKey: 'crypto',
        tools: [
            {
                id: 'base64',
                name: 'Base64 编解码',
                menuTitle: 'Base64 编解码',
                desc: '快速进行 Base64 字符串的编码与解码转换。',
                keywords: ['base64', 'b64', '编码', '解码', 'encode', 'decode'],
                route: '/base64',
                svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
                color: '#E6A23C',
                tag: 'encoding',
                tagType: '',
                tagTip: '编码转换类工具'
            },
            {
                id: 'hash-gen',
                name: 'Hash 生成器',
                menuTitle: 'Hash 生成器',
                desc: '计算文本的 MD5, SHA1, SHA256 等常见信息摘要。',
                keywords: ['hash', 'md5', 'sha1', 'sha256', '摘要', '加密摘要'],
                route: '',
                svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>',
                color: '#F56C6C',
                tag: 'hash',
                tagType: '',
                tagTip: '摘要计算类工具'
            }
        ]
    },
    {
        name: '网络与其它配置',
        menuKey: 'network',
        tools: [
            {
                id: 'url-encode',
                name: 'URL 编解码',
                menuTitle: 'URL 编解码',
                desc: '对 URI 字符串中的特殊字符进行批量转义处理。',
                keywords: ['url', 'uri', 'url encode', 'url decode', 'urlencode', 'urldecode', 'percent encoding', 'percent decode', '链接编码', '链接解码'],
                route: '/url-encode',
                svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
                color: '#909399',
                tag: 'url',
                tagType: '',
                tagTip: 'URL 处理类工具'
            },
            {
                id: 'cron',
                name: 'Cron 表达式',
                menuTitle: 'Cron 表达式',
                desc: '在线生成、反解析以及测试 Cron 定时任务执行时间表。',
                keywords: ['cron', 'crontab', '定时任务', '计划任务', '表达式'],
                route: '',
                svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
                color: '#8E44AD',
                tag: 'corn',
                tagType: 'info',
                tagTip: '定时任务相关工具'
            }
        ]
    }
]
