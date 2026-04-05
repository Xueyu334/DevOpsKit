// Element Plus el-tag 的 type 可选值：
// 'primary', 'success', 'info', 'warning', 'danger'
export const tagTypeHints = {
  primary: '主要工具，具有核心生产价值',
  success: '稳定工具，推荐日常开发使用',
  info: '转换类工具，适合临时数据处理',
  warning: '时间与计算类工具，需注意单位规则',
  danger: '高频热点工具，DevOps 常用首选'
}

export const toolCategories = [
  {
    name: '开发与文本处理',
    menuKey: 'dev-text',
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
        tagTip: '热点工具，支持超大代码比对'
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
        tagType: 'primary',
        tagTip: '前端与 API 开发必备工具'
      },
      {
        id: 'mermaid-editor',
        name: 'Mermaid 图表渲染',
        menuTitle: 'Mermaid 渲染',
        desc: '支持 Mermaid 语法的实时渲染，可快速生成流程图、时序图。',
        keywords: ['mermaid', '流程图', '时序图', '甘特图', '图表生成', 'diagram', 'chart'],
        route: '/mermaid-editor',
        icon: 'DataAnalysis',
        color: '#FF9900',
        tag: 'Design',
        tagType: 'success',
        tagTip: '基于代码的图表可视化工具'
      },
      {
        id: 'ascii-table',
        name: 'ASCII码对照表',
        menuTitle: 'ASCII码对照表',
        desc: '查看 0-127 ASCII 对照表，包含十进制、十六进制及控制字符含义。',
        keywords: ['ascii', 'ascii table', 'ascii码', 'ascii对照表', '字符编码', '控制字符'],
        route: '/ascii-table',
        icon: 'Grid',
        color: '#14B8A6',
        tag: 'Reference',
        tagType: 'info',
        tagTip: '编码速查类开发者参考工具'
      }
    ]
  },
  {
    name: '编解码与安全',
    menuKey: 'encoding-security',
    tools: [
      {
        id: 'base64',
        name: 'Base64 编解码',
        menuTitle: 'Base64 编解码',
        desc: '快速进行 Base64 字符串的编码与解码转换。',
        keywords: ['base64', 'b64', '编码', '解码', 'encode', 'decode'],
        route: '/base64',
        icon: 'Connection',
        color: '#E6A23C',
        tag: 'Encoding',
        tagType: 'info',
        tagTip: '二进制协议与字符串转换'
      },
      {
        id: 'url-encode',
        name: 'URL 编解码',
        menuTitle: 'URL 编解码',
        desc: '对 URI 字符串中的特殊字符进行批量转义处理，解决中文乱码。',
        keywords: ['url', 'uri', 'url encode', 'percent encoding', '链接编码'],
        route: '/url-encode',
        icon: 'Link',
        color: '#909399',
        tag: 'Network',
        tagType: 'info',
        tagTip: '网络请求参数转义必备'
      },
      {
        id: 'hash-gen',
        name: 'Hash 生成器',
        menuTitle: 'Hash 生成器',
        desc: '计算文本的 MD5, SHA1, SHA256 等摘要，支持文件与文本。',
        keywords: ['hash', 'md5', 'sha1', 'sha256', '摘要', '加密摘要'],
        route: '/hash-gen',
        icon: 'Key',
        color: '#F56C6C',
        tag: 'Security',
        tagType: 'primary',
        tagTip: '数据完整性校验与摘要计算'
      },
      {
        id: 'password-generator',
        name: '密码生成器',
        menuTitle: '密码生成器',
        desc: '支持自定义规则的强密码批量生成工具，排除混淆字符。',
        keywords: ['密码', 'password', '生成器', 'generator', '随机密码', '强密码'],
        route: '/password-generator',
        icon: 'Lock',
        color: '#F06292',
        tag: 'Security',
        tagType: 'success',
        tagTip: '多端账号高强度密码生成'
      }
    ]
  },
  {
    name: '数据转换与便民',
    menuKey: 'utility',
    tools: [
      {
        id: 'timestamp-converter',
        name: '时间戳转换',
        menuTitle: '时间戳转换',
        desc: 'Unix 时间戳（秒/毫秒）与日期时间互转，支持 27 个全球时区。',
        keywords: ['时间戳', 'timestamp', 'unix time', 'date', '日期转换', '毫秒', '时区'],
        route: '/timestamp-converter',
        icon: 'Timer',
        color: '#FF7043',
        tag: 'Time',
        tagType: 'warning',
        tagTip: '日志分析与时区调试利器'
      },
      {
        id: 'qrcode-generator',
        name: '二维码生成器',
        menuTitle: '二维码生成器',
        desc: '支持高度自定义颜色、Logo及尺寸的二维码生成。',
        keywords: ['qrcode', '二维码', '二维码生成', 'qr generator', '码生成', '扫码'],
        route: '/qrcode-generator',
        icon: 'Menu',
        color: '#8E44AD',
        tag: 'Tool',
        tagType: 'success',
        tagTip: '多行业通用二维码生成'
      },
      {
        id: 'id-card-generator',
        name: '身份证号码生成器',
        menuTitle: '身份证号码生成器',
        desc: '快速生成符合校验位规则的身份证号码，用于数据仿真。',
        keywords: ['身份证', '身份证号', '身份证号码生成', 'citizen service', 'id card'],
        route: '/id-card-generator',
        icon: 'Postcard',
        color: '#5B8FF9',
        tag: 'Citizen',
        tagType: 'info',
        tagTip: '研发模拟数据填充辅助'
      }
    ]
  },
  {
    name: '运维与部署备查',
    menuKey: 'ops-deploy',
    tools: [
      {
        id: 'docker-commands',
        name: 'Docker 备查',
        menuTitle: 'Docker 备查',
        desc: '镜像、容器、网络、Compose 等分类整理的 Docker 命令集。',
        keywords: ['docker', 'docker compose', 'compose', '容器', '镜像', 'docker命令'],
        route: '/docker-commands',
        icon: 'Operation',
        color: '#2496ED',
        tag: 'Ops',
        tagType: 'primary',
        tagTip: '容器化开发与生产运维速查'
      },
      {
        id: 'nginx-reference',
        name: 'Nginx 备查',
        menuTitle: 'Nginx 备查',
        desc: '包含常用 CLI 命令、反向代理/SSL/Gzip 等配置片段。',
        keywords: ['nginx', 'nginx conf', 'nginx config', 'nginx命令', '反向代理'],
        route: '/nginx-reference',
        icon: 'Tools',
        color: '#009639',
        tag: 'Ops',
        tagType: 'success',
        tagTip: '反向代理与站点部署参考'
      }
    ]
  }
]
