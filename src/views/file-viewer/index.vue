<template>
  <div class="app-container file-viewer-page">
    <!-- 顶部控制条（仅在有文件预览时显示，或者常驻） -->
    <div class="viewer-header">
      <div class="header-left">
        <h3 class="page-title">
          <el-icon class="title-icon"><IconEpDocument /></el-icon>
          文件在线预览
        </h3>
        <span v-if="file" class="file-info-tag">
          <span class="file-name" :title="file.name">{{ file.name }}</span>
          <span class="file-size">({{ formatFileSize(file.size) }})</span>
        </span>
      </div>
      <div class="header-actions">
        <el-button v-if="file" type="warning" plain @click="handleClearFile">
          <el-icon><IconEpRefreshLeft /></el-icon>
          重新选择文件
        </el-button>
      </div>
    </div>

    <!-- 预览配置面板（仅在有文件预览时展示，帮助调节参数） -->
    <el-collapse-transition>
      <div v-if="file" class="config-panel">
        <el-form :inline="true" size="default" class="config-form">
          <el-form-item label="适应模式">
            <el-select v-model="fit" placeholder="适应模式" style="width: 130px">
              <el-option label="等宽自适应" value="width" />
              <el-option label="等高自适应" value="height" />
              <el-option label="包含 (Contain)" value="contain" />
              <el-option label="覆盖 (Cover)" value="cover" />
              <el-option label="实际大小" value="actual" />
              <el-option label="缩减适应" value="scale-down" />
            </el-select>
          </el-form-item>
          <el-form-item label="预览主题">
            <el-select v-model="theme" placeholder="预览主题" style="width: 110px">
              <el-option label="跟随系统" value="auto" />
              <el-option label="浅色" value="light" />
              <el-option label="深色" value="dark" />
            </el-select>
          </el-form-item>
          <el-form-item label="显示工具栏">
            <el-switch v-model="toolbar" />
          </el-form-item>
          <el-form-item label="预览高度">
            <el-radio-group v-model="heightMode" @change="handleHeightModeChange">
              <el-radio-button value="standard">标准 (640px)</el-radio-button>
              <el-radio-button value="large">大屏 (800px)</el-radio-button>
              <el-radio-button value="full">视口高度 (78vh)</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>
    </el-collapse-transition>

    <!-- 核心展示区 -->
    <div class="content-body">
      <!-- 1. 未选择文件：上传与样例选择 -->
      <div v-if="!file" class="upload-container">
        <!-- 网络文件链接预览输入区 -->
        <div class="url-preview-box">
          <el-input
            v-model="fileUrl"
            placeholder="请输入以 http:// 或 https:// 开头的文件链接"
            clearable
            class="url-preview-input"
            @keyup.enter="handleUrlPreview"
          >
            <template #prepend>
              <span class="url-input-prepend">文件网址</span>
            </template>
            <template #append>
              <el-button :loading="urlLoading" type="primary" @click="handleUrlPreview">
                打开预览
              </el-button>
            </template>
          </el-input>
          <div class="url-preview-tip">
            * 支持直接输入网络 URL 预览（注意：链接需允许跨域 CORS 访问，若受限请下载后直接上传预览）
          </div>
        </div>

        <el-upload
          class="viewer-uploader"
          drag
          action="#"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileChange"
        >
          <el-icon class="el-icon--upload"><IconEpUploadFilled /></el-icon>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <template #tip>
            <div class="formats-list-container">
              <div class="format-group">
                <el-text class="group-label" size="default">图像类:</el-text>
                <span class="format-tags">
                  <el-text code type="primary" size="small">png</el-text>、
                  <el-text code type="primary" size="small">jpg</el-text>、
                  <el-text code type="primary" size="small">jpeg</el-text>、
                  <el-text code type="primary" size="small">gif</el-text>、
                  <el-text code type="primary" size="small">webp</el-text>、
                  <el-text code type="primary" size="small">svg</el-text>、
                  <el-text code type="primary" size="small">bmp</el-text>
                </span>
              </div>
              <div class="format-group">
                <el-text class="group-label" size="default">文档类:</el-text>
                <span class="format-tags">
                  <el-text code type="primary" size="small">pdf</el-text>、
                  <el-text code type="primary" size="small">docx</el-text>、
                  <el-text code type="primary" size="small">xlsx</el-text>、
                  <el-text code type="primary" size="small">pptx</el-text>、
                  <el-text code type="primary" size="small">epub</el-text>
                </span>
              </div>
              <div class="format-group">
                <el-text class="group-label" size="default">音视频:</el-text>
                <span class="format-tags">
                  <el-text code type="primary" size="small">mp4</el-text>、
                  <el-text code type="primary" size="small">webm</el-text>、
                  <el-text code type="primary" size="small">mp3</el-text>、
                  <el-text code type="primary" size="small">wav</el-text>、
                  <el-text code type="primary" size="small">ogg</el-text>
                </span>
              </div>
              <div class="format-group">
                <el-text class="group-label" size="default">文本代码:</el-text>
                <span class="format-tags">
                  <el-text code type="primary" size="small">txt</el-text>、
                  <el-text code type="primary" size="small">md</el-text>、
                  <el-text code type="primary" size="small">html</el-text>、
                  <el-text code type="primary" size="small">css</el-text>、
                  <el-text code type="primary" size="small">js</el-text>、
                  <el-text code type="primary" size="small">ts</el-text>、
                  <el-text code type="primary" size="small">json</el-text>、
                  <el-text code type="primary" size="small">xml</el-text>
                </span>
              </div>
              <div class="format-group">
                <el-text class="group-label" size="default">压缩包:</el-text>
                <span class="format-tags">
                  <el-text code type="primary" size="small">zip</el-text>
                </span>
              </div>
            </div>
          </template>
        </el-upload>

        <!-- 样例快速体验区 -->
        <div class="samples-section">
          <h4 class="samples-title">✨ 零文件体验？试一试我们为您准备的本地示例：</h4>
          <el-row :gutter="16" class="samples-row">
            <el-col v-for="sample in sampleFiles" :key="sample.id" :xs="24" :sm="12" :md="6">
              <div class="sample-card" :class="sample.class" @click="sample.action">
                <div class="sample-icon-wrapper">
                  <el-icon><component :is="sample.icon" /></el-icon>
                </div>
                <div class="sample-info">
                  <span class="sample-name">{{ sample.name }}</span>
                  <span class="sample-desc">{{ sample.desc }}</span>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 2. 已选择文件：文件渲染区域 -->
      <div v-else class="preview-wrapper" :style="{ height: viewerHeight }">
        <OpenFileViewer
          :file="file"
          :file-name="file.name"
          width="100%"
          height="100%"
          :fit="fit"
          :toolbar="computedToolbar"
          :theme="theme"
          locale="zh-CN"
          :plugins="plugins"
          @load="handleLoadSuccess"
          @error="handleLoadError"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { OpenFileViewer } from '@open-file-viewer/vue'
import {
  imagePlugin,
  pdfPlugin,
  officePlugin,
  textPlugin,
  videoPlugin,
  audioPlugin,
  archivePlugin,
  emailPlugin,
  drawingPlugin,
  model3dPlugin,
  gisPlugin,
  epubPlugin,
  ofdPlugin,
  xpsPlugin,
  fallbackPlugin
} from '@open-file-viewer/core'
import '@open-file-viewer/core/style.css'
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url'

// 配置参数响应式变量
const file = ref(null)
const fit = ref('contain')
const theme = ref('auto')
const toolbar = ref(true)
const heightMode = ref('standard')

// 网络链接预览响应式变量
const fileUrl = ref('')
const urlLoading = ref(false)

const computedToolbar = computed(() => {
  if (!toolbar.value) return false
  return {
    zoom: true,
    rotate: true,
    download: true,
    fullscreen: true,
    print: true,
    search: true,
    labels: {
      previous: '上一个',
      next: '下一个',
      'zoom-out': '缩小',
      'zoom-in': '放大',
      'zoom-reset': '100%',
      'rotate-right': '旋转',
      download: '下载',
      fullscreen: '全屏',
      print: '打印',
      search: '搜索'
    },
    titles: {
      previous: '上一个文件',
      next: '下一个文件',
      queue: '当前文件位置',
      'zoom-out': '缩小预览',
      'zoom-in': '放大预览',
      'zoom-reset': '恢复默认比例',
      'rotate-right': '顺时针旋转90度',
      download: '下载原始文件',
      fullscreen: '全屏查看预览',
      print: '打印当前内容',
      search: '在预览文本中搜索'
    }
  }
})

const viewerHeight = computed(() => {
  if (heightMode.value === 'standard') return '640px'
  if (heightMode.value === 'large') return '800px'
  return '78vh'
})

// 所有的渲染插件配置
const plugins = [
  imagePlugin(),
  videoPlugin(),
  audioPlugin(),
  textPlugin(),
  pdfPlugin({ workerSrc: pdfWorkerSrc }),
  officePlugin(),
  archivePlugin(),
  emailPlugin(),
  drawingPlugin(),
  model3dPlugin(),
  gisPlugin(),
  epubPlugin(),
  ofdPlugin(),
  xpsPlugin(),
  fallbackPlugin()
]

// 监听文件改变
const handleFileChange = uploadFile => {
  if (uploadFile && uploadFile.raw) {
    file.value = uploadFile.raw
  }
}

// 清除当前预览文件
const handleClearFile = () => {
  file.value = null
  fileUrl.value = ''
}

// 预览网络文件链接
const handleUrlPreview = async () => {
  if (!fileUrl.value) {
    ElMessage.warning('请输入有效的文件链接')
    return
  }
  
  if (!/^https?:\/\/.+/i.test(fileUrl.value)) {
    ElMessage.warning('请输入以 http:// 或 https:// 开头的正确链接')
    return
  }

  urlLoading.value = true
  try {
    const res = await fetch(fileUrl.value)
    if (!res.ok) {
      throw new Error(`请求失败，状态码: ${res.status}`)
    }
    const blob = await res.blob()
    
    // 从 URL 中解析文件名
    let fileName = ''
    try {
      const urlObj = new URL(fileUrl.value)
      const pathname = urlObj.pathname
      fileName = pathname.substring(pathname.lastIndexOf('/') + 1)
    } catch (_) {}
    
    if (!fileName) {
      fileName = 'network_file'
    }

    file.value = new File([blob], fileName, { type: blob.type })
    ElMessage.success('链接拉取成功，已启动预览')
  } catch (err) {
    console.error('拉取网络文件出错:', err)
    ElMessage.error({
      message: `文件链接拉取失败: ${err.message || err}。请确保目标服务已开启 CORS 跨域访问。`,
      duration: 6000
    })
  } finally {
    urlLoading.value = false
  }
}

// 处理高度选择变化
const handleHeightModeChange = () => {
  // 无需特殊操作，已通过 computed viewerHeight 响应
}

// 格式化文件大小
const formatFileSize = bytes => {
  if (!bytes) return '未知大小'
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 预览回调
const handleLoadSuccess = loadedFile => {
  console.log('文件预览载入成功:', loadedFile)
}

const handleLoadError = (err, failedFile) => {
  console.error('文件预览载入失败:', err, failedFile)
  ElMessage.error(`预览加载失败: ${err.message || '文件可能损坏或暂不支持直接预览'}`)
}

// ==================== 示例文件生成与载入 ====================

// 样例 1：SVG 矢量图形
const loadSampleImage = () => {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FF512F;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#DD2476;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="400" height="400" rx="40" fill="url(#grad)" />
    <circle cx="200" cy="180" r="70" fill="#ffffff" opacity="0.9" />
    <polygon points="200,140 230,210 170,210" fill="#FF512F" />
    <text x="200" y="310" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">DevOpsKit Vector</text>
    <text x="200" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#ffffff" opacity="0.8" text-anchor="middle">在线预览示例图形 (SVG)</text>
  </svg>`
  const blob = new Blob([svgContent], { type: 'image/svg+xml' })
  file.value = new File([blob], 'devopskit_sample.svg', { type: 'image/svg+xml' })
}

// 样例 2：HTML 代码文本
const loadSampleCode = () => {
  const codeContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>代码在线预览体验</title>
  <style>
    body {
      background-color: #0f172a;
      color: #38bdf8;
      font-family: Consolas, monospace;
      padding: 30px;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 20px;
      background: #1e293b;
    }
    .badge {
      background: #0369a1;
      color: #bae6fd;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>💻 HTML / CSS 代码效果</h2>
    <p>这是一个前端直接通过 Blob 构造的虚拟网页代码文件，被 textPlugin 成功读取并着色渲染出来。</p>
    <span class="badge">Vite + Vue3 + Element Plus</span>
  </div>
</body>
</html>`
  const blob = new Blob([codeContent], { type: 'text/html' })
  file.value = new File([blob], 'sample_code.html', { type: 'text/html' })
}

// 样例 3：Markdown 格式
const loadSampleMarkdown = () => {
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

> 提示：您可以从本地选择任意支持格式的文件拖入上方，感受无缝的预览效果！
`
  const blob = new Blob([mdContent], { type: 'text/markdown' })
  file.value = new File([blob], 'README_PREVIEW.md', { type: 'text/markdown' })
}

// 样例 4：JSON 格式数据
const loadSampleJson = () => {
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
    metadata: {
      author: 'Antigravity',
      workspace: 'DevOpsKit',
      env: 'Vite & Vue 3 & Element Plus'
    }
  }
  const blob = new Blob([JSON.stringify(jsonObject, null, 2)], { type: 'application/json' })
  file.value = new File([blob], 'system_config.json', { type: 'application/json' })
}

// 示例卡片数据列表
const sampleFiles = [
  {
    id: 'svg',
    name: '示例 SVG 矢量图',
    desc: '查看图像渲染与自适应比例',
    icon: 'IconEpPicture',
    class: 'sample-svg',
    action: loadSampleImage
  },
  {
    id: 'code',
    name: '示例 HTML 代码',
    desc: '查看代码高亮与文本结构',
    icon: 'IconEpDocument',
    class: 'sample-code',
    action: loadSampleCode
  },
  {
    id: 'markdown',
    name: '示例 Markdown 文档',
    desc: '查看排版转换与大纲渲染',
    icon: 'IconEpTickets',
    class: 'sample-md',
    action: loadSampleMarkdown
  },
  {
    id: 'json',
    name: '示例 JSON 配置',
    desc: '查看格式化树与节点数据',
    icon: 'IconEpMenu',
    class: 'sample-json',
    action: loadSampleJson
  }
]
</script>

<style scoped>
.file-viewer-page {
  min-height: 100%;
  padding: 16px 20px 40px;
  box-sizing: border-box;
  background-color: var(--el-bg-color);
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  padding-bottom: 12px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-primary);
}

.title-icon {
  color: var(--el-color-primary);
}

.file-info-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background-color: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-8);
  border-radius: 6px;
  font-size: 13px;
  color: var(--el-color-primary);
  max-width: 350px;
}

.file-name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  color: var(--el-text-color-secondary);
  font-family: monospace;
  font-size: 12px;
  flex-shrink: 0;
}

.config-panel {
  background: var(--el-bg-color-overlay);
  padding: 14px 20px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--el-box-shadow-light);
  flex-shrink: 0;
  animation: slideInDown 0.3s ease;
}

.config-form :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 24px;
}

.content-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* 未选择文件：上传区域与样式 */
.upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 10px;
  gap: 36px;
  width: 100%;
}

.viewer-uploader {
  width: 100%;
  max-width: 680px;
}

.viewer-uploader :deep(.el-upload-dragger) {
  padding: 48px 24px;
  border: 2px dashed var(--el-border-color-darker);
  background: var(--el-bg-color-overlay);
  border-radius: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.viewer-uploader :deep(.el-upload-dragger:hover) {
  border-color: var(--el-color-primary);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.1);
}

.el-icon--upload {
  font-size: 54px;
  color: var(--el-text-color-placeholder);
  transition: color 0.3s ease;
}

.viewer-uploader :deep(.el-upload-dragger:hover) .el-icon--upload {
  color: var(--el-color-primary);
}

.formats-list-container {
  margin-top: 20px;
  width: 100%;
  max-width: 680px;
  background-color: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 16px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.format-group {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
}

.group-label {
  font-weight: 600 !important;
  color: var(--el-text-color-regular) !important;
  min-width: 70px;
  flex-shrink: 0;
}

.format-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.format-tags :deep(.el-text--code) {
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: default;
}

.format-tags :deep(.el-text--code:hover) {
  background-color: var(--el-color-primary-light-8) !important;
  border-color: var(--el-color-primary-light-7) !important;
  transform: translateY(-1px);
}

/* 样例体验区样式 */
.samples-section {
  width: 100%;
  max-width: 900px;
  margin-top: 10px;
}

.samples-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  margin-bottom: 16px;
  text-align: center;
}

.samples-row {
  row-gap: 16px;
}

.sample-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  user-select: none;
}

.sample-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--el-box-shadow-light);
  border-color: var(--el-color-primary-light-5);
}

.sample-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.sample-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow: hidden;
}

.sample-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sample-desc {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 四个卡片定制背景渐变和颜色 */
.sample-svg .sample-icon-wrapper {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  color: #0284c7;
}
.sample-code .sample-icon-wrapper {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  color: #16a34a;
}
.sample-md .sample-icon-wrapper {
  background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
  color: #9333ea;
}
.sample-json .sample-icon-wrapper {
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  color: #ea580c;
}

/* 深色模式下的微调 */
html.dark .sample-svg .sample-icon-wrapper {
  background: linear-gradient(135deg, #0c4a6e 0%, #075985 100%);
  color: #38bdf8;
}
html.dark .sample-code .sample-icon-wrapper {
  background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
  color: #4ade80;
}
html.dark .sample-md .sample-icon-wrapper {
  background: linear-gradient(135deg, #3b0764 0%, #4a044e 100%);
  color: #c084fc;
}
html.dark .sample-json .sample-icon-wrapper {
  background: linear-gradient(135deg, #7c2d12 0%, #9a3412 100%);
  color: #fb923c;
}

/* 已选择文件：预览区域与特效 */
.preview-wrapper {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow-light);
  transition: height 0.3s ease;
  min-height: 400px;
}

@keyframes slideInDown {
  from {
    transform: translate3d(0, -10px, 0);
    opacity: 0;
  }
  to {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
}

/* 网络链接预览输入框样式 */
.url-preview-box {
  width: 100%;
  max-width: 680px;
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.url-preview-input :deep(.el-input-group__prepend) {
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-weight: 500;
  border-right: none;
  padding: 0 16px;
}

.url-preview-input :deep(.el-input-group__append) {
  background-color: var(--el-color-primary) !important;
  border-left: none;
  padding: 0;
}

.url-preview-input :deep(.el-input-group__append button) {
  color: #ffffff !important;
  background-color: var(--el-color-primary) !important;
  border: none;
  height: 100%;
  margin: 0;
  padding: 0 20px;
  border-radius: 0 4px 4px 0;
}

.url-preview-input :deep(.el-input-group__append button:hover) {
  background-color: var(--el-color-primary-light-3) !important;
}

.url-preview-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: left;
  padding-left: 4px;
}
</style>
