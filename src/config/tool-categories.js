// Element Plus el-tag 的 type 可选值：
// 'primary', 'success', 'info', 'warning', 'danger'
export const tagTypeHints = {
  danger: '高频热点 / 安全加密工具',
  primary: '研发核心 / DevOps / 文件解析工具',
  success: '视觉 UI / 设计绘图 / 样式生成工具',
  info: '字符编解码 / 格式转义处理工具',
  warning: '时间计算 / 进制数据 / 便民效率工具'
}

export const toolCategories = [
  {
    id: 'dev-text',
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
        tagTip: '高频热点，大文本与代码差异比对'
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
        tag: 'Hot',
        tagType: 'danger',
        tagTip: '高频热点，JSON 格式化校验与压缩'
      },
      {
        id: 'pdm-parser',
        name: 'PDM 在线解析',
        menuTitle: 'PDM 解析',
        desc: '本地解析 PowerDesigner .pdm 文件，提取表结构、字段、主键与备注并导出文档。',
        keywords: ['pdm', 'powerdesigner', '表结构', '数据库设计', '数据模型', '字段文档'],
        route: '/pdm-parser',
        icon: 'DataAnalysis',
        color: '#0EA5E9',
        tag: 'Parse',
        tagType: 'primary',
        tagTip: 'PowerDesigner 模型文件与表结构解析'
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
        tagTip: '代码驱动流程图与架构图绘制'
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
        tag: 'Ref',
        tagType: 'info',
        tagTip: '字符编码与 0-127 ASCII 码速查'
      },
      {
        id: 'ascii-banner',
        name: 'ASCII 艺术字生成',
        menuTitle: 'ASCII 艺术字',
        desc: '生成 Spring Boot 风格的 ASCII 艺术字 Banner，支持多种字体设置。',
        keywords: ['ascii art', 'ascii banner', 'spring boot banner', '艺术字', 'banner生成'],
        route: '/ascii-banner',
        icon: 'EditPen',
        color: '#FF6B6B',
        tag: 'Design',
        tagType: 'success',
        tagTip: 'Spring Boot 启动 Banner 艺术字生成'
      },
      {
        id: 'regex-tester',
        name: '正则表达式测试',
        menuTitle: '正则测试',
        desc: '在线测试正则表达式，支持全局、忽略大小写匹配，实时展示匹配结果及分组信息。',
        keywords: ['regex', '正则表达式', '正则测试', '正则匹配', 'regular expression'],
        route: '/regex-tester',
        icon: 'Filter',
        color: '#E6A23C',
        tag: 'Dev',
        tagType: 'primary',
        tagTip: '文本正则表达式实时匹配与分组分析'
      },
      {
        id: 'file-viewer',
        name: '文件在线预览 (File Viewer)',
        menuTitle: '文件预览',
        desc: '支持图片、PDF、Office文档、音视频、代码、压缩包等多种本地文件在线预览。',
        keywords: ['file viewer', 'pdf viewer', 'office preview', '文件预览', '在线预览', 'pdf预览', 'docx预览'],
        route: '/file-viewer',
        icon: 'Document',
        color: '#67C23A',
        tag: 'Media',
        tagType: 'primary',
        tagTip: '多格式本地文件与文档安全在线预览'
      }
    ]
  },
  {
    id: 'encoding-security',
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
        tag: 'Codec',
        tagType: 'info',
        tagTip: 'Base64 文本与二进制转义处理'
      },
      {
        id: 'image-to-base64',
        name: '图片转 Base64',
        menuTitle: '图片转 Base64',
        desc: '支持图片的上传或拖拽转换，生成适用于 CSS、HTML 的 Base64 数据。',
        keywords: ['image to base64', '图片转base64', 'base64图片', 'data uri', '图片编码'],
        route: '/image-to-base64',
        icon: 'Picture',
        color: '#67C23A',
        tag: 'Codec',
        tagType: 'info',
        tagTip: '图片文件转 Base64 与 Data URI'
      },
      {
        id: 'base64-to-image',
        name: 'Base64 转图片',
        menuTitle: 'Base64 转图片',
        desc: '将 Data URI 或纯 Base64 内容还原为图片预览，并支持一键下载还原后的文件。',
        keywords: ['base64 to image', 'base64转图片', '图片还原', 'base64解码图片'],
        route: '/base64-to-image',
        icon: 'Finished',
        color: '#E6A23C',
        tag: 'Codec',
        tagType: 'info',
        tagTip: 'Base64 / Data URI 还原预览与下载'
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
        tag: 'Codec',
        tagType: 'info',
        tagTip: 'URL 链接与网络参数转义处理'
      },
      {
        id: 'unicode-converter',
        name: 'Unicode 编码转换',
        menuTitle: 'Unicode 编码',
        desc: '提供文本与 Unicode 转义序列、HTML 字符实体之间的双向转换服务。',
        keywords: ['unicode', 'unicode escape', 'html entity', '字符实体', '转义', '编码转换'],
        route: '/unicode-converter',
        icon: 'Switch',
        color: '#0EA5E9',
        tag: 'Codec',
        tagType: 'info',
        tagTip: 'Unicode 转义序列与 HTML 实体转换'
      },
      {
        id: 'html-encode',
        name: 'HTML 编解码',
        menuTitle: 'HTML 编解码',
        desc: '对 HTML 特殊字符进行实体转义与还原，避免文本被误识别为标签。',
        keywords: ['html', 'html encode', 'html decode', 'html实体', '字符引用', '标签转义'],
        route: '/html-encode',
        icon: 'Document',
        color: '#67C23A',
        tag: 'Codec',
        tagType: 'info',
        tagTip: 'HTML 敏感字符与实体标签防注入转换'
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
        tagType: 'danger',
        tagTip: 'MD5 / SHA1 / SHA256 加密摘要计算'
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
        tagType: 'danger',
        tagTip: '自定义规则高强度随机安全密码生成'
      }
    ]
  },
  {
    id: 'utility',
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
        tagTip: 'Unix 时间戳与全球 27 时区格式化'
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
        tag: 'Util',
        tagType: 'warning',
        tagTip: '自定义颜色与 Logo 的二维码生成'
      },
      {
        id: 'mp3-cutter',
        name: 'MP3 音频截取',
        menuTitle: 'MP3 截取',
        desc: '上传 MP3 后选择时间段，支持片段实时试听并导出为 MP3。',
        keywords: ['mp3', '音频截取', '音频剪切', '音频裁剪', 'audio cutter', '音乐剪辑'],
        route: '/mp3-cutter',
        icon: 'Finished',
        color: '#22C55E',
        tag: 'Media',
        tagType: 'warning',
        tagTip: '浏览器本地音频剪辑与片段导出'
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
        tag: 'Data',
        tagType: 'warning',
        tagTip: '符合 GB11643-1999 校验规则的仿真数据'
      },
      {
        id: 'color-converter',
        name: '颜色转换 (Color Converter)',
        menuTitle: '颜色转换',
        desc: '支持 HEX 与 RGB 互相转换，提供实时取色、预览及常用 Web 安全色推荐。',
        keywords: ['color', 'hex', 'rgb', 'rgba', 'color picker', '颜色转换', '取色器'],
        route: '/color-converter',
        icon: 'Brush',
        color: '#F06292',
        tag: 'Design',
        tagType: 'success',
        tagTip: 'HEX / RGB 色值互转与取色调试'
      },
      {
        id: 'css-gradient',
        name: 'CSS 渐变生成器 (CSS Gradient Generator)',
        menuTitle: 'CSS 渐变生成器',
        desc: '在线生成线性渐变与径向渐变 CSS 代码，支持角度调整、颜色方案选择及历史记录。',
        keywords: ['css gradient', 'linear gradient', 'radial gradient', '渐变生成器', 'css渐变', '配色方案'],
        route: '/css-gradient',
        icon: 'MagicStick',
        color: '#A855F7',
        tag: 'Design',
        tagType: 'success',
        tagTip: '线性与径向 CSS 渐变代码在线生成'
      },
      {
        id: 'base-converter',
        name: '进制转换 (Base Converter)',
        menuTitle: '进制转换',
        desc: '支持 2, 8, 10, 16 进制之间的实时互相转换，支持大数与千分符格式化。',
        keywords: ['base', 'converter', 'binary', 'hex', 'decimal', 'octal', '进制转换', '二进制', '十六进制'],
        route: '/base-converter',
        icon: 'Finished',
        color: '#409EFF',
        tag: 'Math',
        tagType: 'warning',
        tagTip: '2 / 8 / 10 / 16 进制大数实时转换'
      }
    ]
  },
  {
    id: 'ops-deploy',
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
        tag: 'Hot',
        tagType: 'danger',
        tagTip: '容器化开发与 Ops 常用命令速查'
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
        tagType: 'primary',
        tagTip: '反向代理、SSL 与 Gzip 配置片段备查'
      }
    ]
  }
]
