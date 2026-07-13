const createSampleFile = (content, name, type) => new File([new Blob([content], { type })], name, { type })

// 样例 1：SVG 矢量图形
export const loadSampleImage = () => {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FF512F;stop-opacity:1" /><stop offset="100%" style="stop-color:#DD2476;stop-opacity:1" /></linearGradient></defs>
    <rect width="400" height="400" rx="40" fill="url(#grad)" /><circle cx="200" cy="180" r="70" fill="#ffffff" opacity="0.9" /><polygon points="200,140 230,210 170,210" fill="#FF512F" />
    <text x="200" y="310" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">DevOpsKit Vector</text><text x="200" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#ffffff" opacity="0.8" text-anchor="middle">在线预览示例图形 (SVG)</text>
  </svg>`
  return createSampleFile(svgContent, 'devopskit_sample.svg', 'image/svg+xml')
}

// 样例 2：HTML 代码文本
export const loadSampleCode = () => {
  const codeContent = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>代码在线预览体验</title>
    <style>
      body {
        background-color: #0f172a;
        color: #38bdf8;
        font-family: Consolas, monospace;
        padding: 30px;
      }

      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        border: 1px solid #334155;
      }
    </style>
  </head>
  <body>
    <main class="container">
      <h2>HTML / CSS 代码效果</h2>
      <p>这是一个由 Blob 构造的 HTML 示例文件。</p>
    </main>
  </body>
</html>`
  return createSampleFile(codeContent, 'sample_code.html', 'text/html')
}

// 样例 3：Markdown 格式
export const loadSampleMarkdown = () => {
  const mdContent = `# 🚀 DevOpsKit 文件在线预览系统

这是一个采用 **Markdown (MD)** 格式构造的轻量排版演示文件。

## 💡 技术栈简介
- **渲染引擎**：\`@open-file-viewer/core\` 与适配器 \`@open-file-viewer/vue\`。
- **UI 组件**：\`Element Plus\` 提供的响应式容器与拖拽上传。
- **本地化**：零数据网络传输，所有解析和预览动作均在浏览器端静默完成。

### 📌 支持预览的常见格式列表
1. **图像类**：PNG, JPG, SVG, WebP, GIF, BMP...
2. **文本与代码**：HTML, CSS, JS, JSON, XML, MD, Java, Python, Go...
3. **Office 文档**：Word (.docx), Excel (.xlsx), PPT (.pptx)
4. **数码与工程**：PDF, EPUB, ZIP, 3D 模型 (.gltf / .glb), EML 邮件...

---

> 提示：您可以从本地选择任意支持格式的文件拖入上方，感受无缝的预览效果！`
  return createSampleFile(mdContent, 'README_PREVIEW.md', 'text/markdown')
}

// 样例 4：JSON 格式数据
export const loadSampleJson = () => {
  const jsonObject = {
    toolName: 'File Viewer',
    category: 'Development & Text',
    status: 'Stable',
    version: '1.0.0',
    capabilities: {
      clientSideRender: true,
      dragAndDrop: true,
      dynamicProperties: ['fit', 'theme', 'toolbar', 'height']
    },
    supportedPlugins: [
      'ImagePlugin',
      'TextPlugin',
      'PdfPlugin (pdfjs-dist)',
      'OfficePlugin',
      'ArchivePlugin',
      'CadPlugin',
      'Model3dPlugin',
      'GisPlugin'
    ],
    metadata: { author: 'Antigravity', workspace: 'DevOpsKit', env: 'Vite & Vue 3 & Element Plus' }
  }
  return createSampleFile(JSON.stringify(jsonObject, null, 2), 'system_config.json', 'application/json')
}

export const sampleFiles = [
  {
    id: 'svg',
    name: '示例 SVG 矢量图',
    desc: '查看图像渲染与自适应比例',
    format: 'SVG',
    class: 'sample-svg',
    action: loadSampleImage
  },
  {
    id: 'code',
    name: '示例 HTML 代码',
    desc: '查看代码高亮与文本结构',
    format: 'HTML',
    class: 'sample-code',
    action: loadSampleCode
  },
  {
    id: 'markdown',
    name: '示例 Markdown 文档',
    desc: '查看排版转换与大纲渲染',
    format: 'MD',
    class: 'sample-md',
    action: loadSampleMarkdown
  },
  {
    id: 'json',
    name: '示例 JSON 配置',
    desc: '查看格式化树与节点数据',
    format: 'JSON',
    class: 'sample-json',
    action: loadSampleJson
  }
]
