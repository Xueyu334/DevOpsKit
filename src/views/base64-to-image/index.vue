<template>
  <div class="base64-image-container">
    <el-row :gutter="20">
      <!-- 输入区 -->
      <el-col :xs="24" :md="12">
        <el-card class="input-card">
          <template #header>
            <div class="card-header">
              <span>输入 Base64 字符串</span>
              <el-button type="info" link @click="clearAll">清空</el-button>
            </div>
          </template>

          <el-input
            v-model="base64Input"
            type="textarea"
            :rows="18"
            placeholder="粘贴 Data URI (data:image/...) 或纯 Base64 内容到此处..."
            class="base64-textarea"
            @input="handleInput"
          />

          <div v-if="base64Input" class="input-actions">
            <el-alert
              v-if="!hasPrefix && base64Input.length > 10"
              title="提示: 缺少 Data URI 前缀，系统已尝试自动识别格式"
              type="info"
              :closable="false"
              show-icon
              style="margin-top: 15px"
            />
          </div>
        </el-card>
      </el-col>

      <!-- 预览与结果区 -->
      <el-col :xs="24" :md="12">
        <el-card v-loading="loading" class="preview-card">
          <template #header>
            <div class="card-header">
              <span>图片预览</span>
              <el-button type="primary" size="small" :disabled="!isReady" @click="downloadImage"> 下载图片 </el-button>
            </div>
          </template>

          <div v-if="isReady" class="preview-content">
            <div class="image-box">
              <img :src="finalImageData" class="image-obj" alt="Base64 Preview" @load="onImageLoad" />
            </div>

            <div class="info-table">
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="建议后缀">{{ detectedExt }}</el-descriptions-item>
                <el-descriptions-item label="分辨率">{{ imgMeta.width }} x {{ imgMeta.height }}</el-descriptions-item>
                <el-descriptions-item label="估计大小">{{ formatSize(imgMeta.size) }}</el-descriptions-item>
                <el-descriptions-item label="MIME 类型">{{ detectedMime }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </div>

          <el-empty v-else description="等待输入有效的 Base64 数据..." />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
// 状态定义
const base64Input = ref('')
const loading = ref(false)
const isReady = ref(false)
const hasPrefix = ref(false)

const imgMeta = reactive({
  width: 0,
  height: 0,
  size: 0
})

const detectedMime = ref('image/png')
const detectedExt = ref('png')
const finalImageData = ref('')

// 辅助：格式化大小
const formatSize = bytes => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 核心逻辑：解析输入
const handleInput = () => {
  const val = base64Input.value.trim()
  if (!val) {
    isReady.value = false
    return
  }

  loading.value = true

  // 简易正则判断是否有前缀
  if (/^data:image\/[a-z+]+;base64,/.test(val)) {
    hasPrefix.value = true
    finalImageData.value = val
    // 提取 mime
    detectedMime.value = val.split(';')[0].split(':')[1]
    detectedExt.value = detectedMime.value.split('/')[1]
  } else {
    hasPrefix.value = false
    // 尝试补齐前缀 (默认为 png)
    // 进阶逻辑：可以通过 base64 开头字符判断常见类型
    // iVBORw -> png, /9j/ -> jpg, R0lG -> gif, UklG -> webp
    let mime = 'image/png'
    if (val.startsWith('/9j/')) mime = 'image/jpeg'
    else if (val.startsWith('R0lG')) mime = 'image/gif'
    else if (val.startsWith('UklG')) mime = 'image/webp'

    detectedMime.value = mime
    detectedExt.value = mime.split('/')[1]
    finalImageData.value = `data:${mime};base64,${val}`
  }

  // 计算大小 (Base64 大约是原图的 1.33 倍)
  const stringLength = val.replace(/^data:image\/[a-z+]+;base64,/, '').length
  imgMeta.size = Math.floor(stringLength * 0.75)

  // 验证图片有效性
  const img = new Image()
  img.onload = () => {
    isReady.value = true
    loading.value = false
  }
  img.onerror = () => {
    isReady.value = false
    loading.value = false
  }
  img.src = finalImageData.value
}

const onImageLoad = e => {
  imgMeta.width = e.target.naturalWidth
  imgMeta.height = e.target.naturalHeight
}

const downloadImage = () => {
  if (!finalImageData.value) return
  const link = document.createElement('a')
  link.href = finalImageData.value
  link.download = `base64-export-${Date.now()}.${detectedExt.value}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const clearAll = () => {
  base64Input.value = ''
  isReady.value = false
  finalImageData.value = ''
  imgMeta.width = 0
  imgMeta.height = 0
  imgMeta.size = 0
}
</script>

<style scoped>
.base64-image-container {
  max-width: 1200px;
  margin: 10px auto;
}

.input-card,
.preview-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.base64-textarea {
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 12px;
}

:deep(.base64-textarea .el-textarea__inner) {
  background-color: var(--el-fill-color-light);
  word-break: break-all;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

.image-box {
  width: 100%;
  min-height: 200px;
  max-height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-image:
    linear-gradient(45deg, var(--el-fill-color-light) 25%, transparent 25%),
    linear-gradient(-45deg, var(--el-fill-color-light) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--el-fill-color-light) 75%),
    linear-gradient(-45deg, transparent 75%, var(--el-fill-color-light) 75%);
  background-size: 20px 20px;
  background-position:
    0 0,
    0 10px,
    10px -10px,
    -10px 0px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  overflow: auto;
}

.image-obj {
  max-width: 100%;
  transition: transform 0.3s;
}

.info-table {
  width: 100%;
}
</style>
