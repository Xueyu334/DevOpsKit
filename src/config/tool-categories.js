// Element Plus el-tag 的 type 可选值：
// 'primary', 'success', 'info', 'warning', 'danger'
export const tagTypeHints = {
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
                icon: 'DocumentCopy',
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
                icon: 'Tickets',
                color: '#67C23A',
                tag: 'Dev',
                tagType: 'info',
                tagTip: '开发向工具，适合调试与数据处理'
            },
            {
                id: 'ascii-table',
                name: 'ASCII码对照表',
                menuTitle: 'ASCII码对照表',
                desc: '查看 0-127 ASCII 十进制、十六进制、二进制与控制字符含义，支持快速搜索定位。',
                keywords: ['ascii', 'ascii table', 'ascii码', 'ascii对照表', '字符编码', '控制字符', '十六进制字符表'],
                route: '/ascii-table',
                icon: 'Tools',
                color: '#14B8A6',
                tag: 'Ref',
                tagType: 'success',
                tagTip: '编码速查类参考工具'
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
                icon: 'Postcard',
                color: '#E6A23C',
                tag: 'encoding',
                tagTip: '编码转换类工具'
            },
            {
                id: 'hash-gen',
                name: 'Hash 生成器',
                menuTitle: 'Hash 生成器',
                desc: '计算文本的 MD5, SHA1, SHA256 等常见信息摘要。',
                keywords: ['hash', 'md5', 'sha1', 'sha256', '摘要', '加密摘要'],
                route: '/hash-gen',
                icon: 'Key',
                color: '#F56C6C',
                tag: 'hash',
                tagType: 'primary',
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
                icon: 'Link',
                color: '#909399',
                tag: 'url',
                tagTip: 'URL 处理类工具'
            },
            {
                id: 'cron',
                name: 'Cron 表达式',
                menuTitle: 'Cron 表达式',
                desc: '在线生成、反解析以及测试 Cron 定时任务执行时间表。',
                keywords: ['cron', 'crontab', '定时任务', '计划任务', '表达式'],
                route: '',
                icon: 'Timer',
                color: '#8E44AD',
                tag: 'corn',
                tagType: 'info',
                tagTip: '定时任务相关工具'
            }
        ]
    },
    {
        name: '容器与部署',
        menuKey: 'container-deploy',
        tools: [
            {
                id: 'docker-commands',
                name: 'Docker 命令大全备查',
                menuTitle: 'Docker 命令大全',
                desc: '按镜像、容器、网络、数据卷、系统与 Docker Compose 分类整理的命令速查页。',
                keywords: ['docker', 'docker compose', 'compose', '容器', '镜像', 'volume', 'network', 'docker命令', 'docker备查'],
                route: '/docker-commands',
                icon: 'Tools',
                color: '#2496ED',
                tag: 'Docker',
                tagType: 'primary',
                tagTip: '容器与编排命令速查工具'
            },
            {
                id: 'nginx-reference',
                name: 'Nginx 命令与配置大全',
                menuTitle: 'Nginx 命令与配置',
                desc: '覆盖常用 Nginx CLI 命令、排障命令和 conf 配置片段的速查页。',
                keywords: ['nginx', 'nginx conf', 'nginx config', 'nginx命令', '反向代理', 'upstream', 'ssl', 'gzip', 'server_name'],
                route: '/nginx-reference',
                icon: 'Tools',
                color: '#009639',
                tag: 'Nginx',
                tagType: 'success',
                tagTip: 'Nginx 命令与配置速查工具'
            }
        ]
    },
    {
        name: '便民与生成',
        menuKey: 'utility',
        tools: [
            {
                id: 'id-card-generator',
                name: '身份证号码生成器',
                menuTitle: '身份证号码生成器',
                desc: '手动输入区域码、生日和性别，快速生成符合校验位规则的身份证号码。',
                keywords: ['身份证', '身份证号', '身份证号码生成', '公民身份号码', 'identity card', 'id card'],
                route: '/id-card-generator',
                icon: 'CreditCard',
                color: '#5B8FF9',
                tag: 'New',
                tagType: 'primary',
                tagTip: '新上线的便民生成工具'
            }
        ]
    }
]
