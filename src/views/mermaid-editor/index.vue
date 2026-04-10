<script setup>
import { useCopyText } from '@/composables/useCopyText'

const mermaidCode = ref(`graph TD
    A[开始] --> B{选择工具}
    B -->|文本| C[文本比对]
    B -->|编码| D[Base64]
    B -->|加密| E[Hash 生成]
    B -->|图表| F[Mermaid 渲染]
    C --> G[结束]
    D --> G
    E --> G
    F --> G`)

const previewContainer = ref(null)
const svgContent = ref('')
const { copyText } = useCopyText()

// 使用 shallowRef 避免对巨大的 mermaid 实例进行深度响应式处理
const mermaidInstance = shallowRef(null)

const renderDiagram = async () => {
  if (!mermaidCode.value.trim()) {
    svgContent.value = ''
    return
  }

  // 确保 mermaid 已加载
  if (!mermaidInstance.value) {
    try {
      const { default: m } = await import('mermaid')
      m.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'inherit'
      })
      mermaidInstance.value = m
    } catch (error) {
      console.error('Failed to load mermaid:', error)
      return
    }
  }

  try {
    const id = `mermaid-${Date.now()}`
    const { svg } = await mermaidInstance.value.render(id, mermaidCode.value)
    svgContent.value = svg
  } catch (error) {
    console.error('Mermaid render error:', error)
    // 渲染失败时不清除之前的，或者显示错误提示
  }
}

// 监听输入变化实时渲染
watch(
  mermaidCode,
  () => {
    renderDiagram()
  },
  { immediate: false }
)

onMounted(() => {
  renderDiagram()
})

const downloadSVG = () => {
  if (!svgContent.value) {
    return
  }
  const blob = new Blob([svgContent.value], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `mermaid-diagram-${Date.now()}.svg`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('SVG 下载成功')
}

const downloadPNG = () => {
  if (!svgContent.value) {
    return
  }

  const svgElement = previewContainer.value.querySelector('svg')
  if (!svgElement) {
    return
  }

  const svgData = new XMLSerializer().serializeToString(svgElement)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = new Image()

  // 获取 SVG 的宽高
  const box = svgElement.viewBox.baseVal || { width: svgElement.clientWidth, height: svgElement.clientHeight }
  const width = box.width || 800
  const height = box.height || 600

  // 增加缩放以提高清晰度
  const scale = 2
  canvas.width = width * scale
  canvas.height = height * scale

  img.onload = () => {
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const pngUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = pngUrl
    link.download = `mermaid-diagram-${Date.now()}.png`
    link.click()
    ElMessage.success('PNG 下载成功')
  }

  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
}

const handleCopySvg = () => {
  if (svgContent.value) {
    copyText(svgContent.value)
  }
}
</script>

<template>
  <div class="app-container mermaid-editor">
    <el-card class="main-card" shadow="never">
      <template #header>
        <div class="header-content">
          <div>
            <h2 class="section-title">Mermaid 图表渲染</h2>
            <p class="section-subtitle">输入 Mermaid 语法实时渲染流程图、时序图、甘特图等。</p>
          </div>
          <div class="actions">
            <el-button-group>
              <el-button type="primary" @click="downloadSVG">
                <template #icon>
                  <IconEpDownload />
                </template>
                下载 SVG
              </el-button>
              <el-button type="primary" @click="downloadPNG">
                <template #icon>
                  <IconEpPicture />
                </template>
                下载 PNG
              </el-button>
            </el-button-group>
            <el-button style="margin-left: 12px" @click="handleCopySvg">复制 SVG</el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="20" class="editor-row">
        <el-col :md="10" :xs="24">
          <div class="editor-container">
            <el-input
              v-model="mermaidCode"
              :rows="24"
              class="code-input"
              clearable
              placeholder="在这里输入 Mermaid 代码..."
              resize="none"
              type="textarea"
            />
          </div>
        </el-col>
        <el-col :md="14" :xs="24">
          <div ref="previewContainer" class="preview-container">
            <div v-if="svgContent" class="svg-wrapper" v-html="svgContent"></div>
            <div v-else>
              <el-empty :image-size="100" description="等待输入有效的 Mermaid 代码" />
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="help-card" shadow="never">
      <template #header>
        <h3 class="help-title">常用语法参考</h3>
      </template>
      <el-row :gutter="20">
        <el-col :md="8" :sm="12" :xs="24">
          <div class="help-item">
            <h4>流程图 (Flowchart)</h4>
            <pre><code>graph TD
            A[开始] --> B{判断}
            B -- 是 --> C[执行]
            B -- 否 --> D[结束]</code></pre>
          </div>
        </el-col>
        <el-col :md="8" :sm="12" :xs="24">
          <div class="help-item">
            <h4>时序图 (Sequence)</h4>
            <pre><code>sequenceDiagram
            Alice->>John: Hello John, how are you?
            John-->>Alice: Great!</code></pre>
          </div>
        </el-col>
        <el-col :md="8" :sm="12" :xs="24">
          <div class="help-item">
            <h4>状态图 (State)</h4>
            <pre><code>stateDiagram-v2
            [*] --> Still
            Still --> [*]
            Still --> Moving
            Moving --> Still</code></pre>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<style scoped>
.mermaid-editor {
  padding: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.section-title {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.section-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.editor-row {
  margin-top: 10px;
}

.editor-container {
  height: 100%;
}

.code-input :deep(.el-textarea__inner) {
  font-family: 'Fira Code', 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.6;
  background-color: var(--el-fill-color-light);
}

.preview-container {
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  height: 510px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  /* Mermaid 图表通常在白色背景下效果最好 */
  overflow: auto;
  padding: 40px;
}

.svg-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.svg-wrapper :deep(svg) {
  max-width: 100%;
  height: auto;
}

.help-card {
  margin-top: 20px;
}

.help-title {
  margin: 0;
  font-size: 16px;
}

.help-item h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.help-item pre {
  background-color: var(--el-fill-color-light);
  padding: 12px;
  border-radius: 4px;
  margin: 0;
  font-size: 12px;
  overflow-x: auto;
}

/* 深色模式适配 */
:root.dark .preview-container {
  background-color: #1a1a1a;
}
</style>
