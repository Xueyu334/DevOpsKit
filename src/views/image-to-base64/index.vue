<template>
  <div class="image-base64-container">
    <el-row :gutter="20">
      <!-- 上传与预览区 -->
      <el-col :xs="24" :md="10">
        <el-card class="upload-card">
          <template #header>
            <div class="card-header">
              <span>选择图片</span>
              <el-button type="info" link @click="clearAll">清空</el-button>
            </div>
          </template>

          <el-upload class="image-uploader" drag action="#" :auto-upload="false" :show-file-list="false"
            accept="image/*" @change="handleFileChange">
            <div v-if="!imageInfo.previewUrl" class="upload-placeholder">
              <el-icon class="el-icon--upload">
                <IconEpUploadFilled />
              </el-icon>
              <div class="el-upload__text">将图片拖到此处，或 <em>点击上传</em></div>
            </div>
            <div v-else class="preview-wrapper">
              <img :src="imageInfo.previewUrl" class="image-preview" alt="Preview" />
            </div>
          </el-upload>

          <div v-if="imageInfo.previewUrl" class="file-meta">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="文件名">{{ imageInfo.name }}</el-descriptions-item>
              <el-descriptions-item label="尺寸">{{ imageInfo.width }} x {{ imageInfo.height }}</el-descriptions-item>
              <el-descriptions-item label="文件大小">{{ formatSize(imageInfo.size) }}</el-descriptions-item>
              <el-descriptions-item label="MIME 类型">{{ imageInfo.type }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-col>

      <!-- 结果展示区 -->
      <el-col :xs="24" :md="14">
        <el-card class="result-card">
          <template #header>
            <div class="card-header">
              <span>Base64 结果</span>
              <div class="header-ops">
                <el-radio-group v-model="outputType" size="small" class="type-selector">
                  <el-radio-button label="raw">Data URI</el-radio-button>
                  <el-radio-button label="css">CSS</el-radio-button>
                  <el-radio-button label="html">HTML</el-radio-button>
                </el-radio-group>
                <el-button type="primary" size="small" @click="copyResult" :disabled="!base64Result">
                  复制结果
                </el-button>
              </div>
            </div>
          </template>

          <el-input v-model="formattedResult" type="textarea" :rows="14" readonly placeholder="上传图片后此处将展示 Base64 结果..."
            class="result-textarea" />

          <div class="result-footer" v-if="base64Result">
            <span class="char-count">
              字符数: {{ base64Result.length.toLocaleString() }}
              <el-divider direction="vertical" />
              体积: {{ formatSize(base64Result.length) }}
            </span>
            <el-tag size="small" type="warning" v-if="base64Result.length > 32768">
              提示: 字符串较大，建议用于小图或图标
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>

// 状态定义
const imageInfo = reactive({
  name: '',
  size: 0,
  type: '',
  width: 0,
  height: 0,
  previewUrl: '',
  base64: ''
})

const outputType = ref('raw')
const { copy: toClipboard } = useClipboard({ legacy: true })

// 辅助函数：格式化文件大小
const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 核心逻辑：处理文件选择
const handleFileChange = (uploadFile) => {
  const file = uploadFile.raw
  if (!file) return

  // 检查是否为图片
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择有效的图片文件')
    return
  }

  imageInfo.name = file.name
  imageInfo.size = file.size
  imageInfo.type = file.type

  // 读取 Base64 和 预览图
  const reader = new FileReader()
  reader.onload = (e) => {
    const base64 = e.target.result
    imageInfo.base64 = base64
    imageInfo.previewUrl = base64

    // 获取图片原始宽高
    const img = new Image()
    img.onload = () => {
      imageInfo.width = img.width
      imageInfo.height = img.height
    }
    img.src = base64
  }
  reader.readAsDataURL(file)
}

// 计算格式化的结果
const base64Result = computed(() => imageInfo.base64)

const formattedResult = computed(() => {
  if (!base64Result.value) return ''

  if (outputType.value === 'css') {
    return `background-image: url("${base64Result.value}");`
  } else if (outputType.value === 'html') {
    return `<img src="${base64Result.value}" alt="${imageInfo.name}" />`
  }
  return base64Result.value
})

const copyResult = async () => {
  if (!formattedResult.value) return
  try {
    await toClipboard(formattedResult.value)
    ElMessage.success('已复制到剪贴板')
  } catch (err) {
    ElMessage.error('复制失败')
  }
}

const clearAll = () => {
  imageInfo.name = ''
  imageInfo.size = 0
  imageInfo.type = ''
  imageInfo.width = 0
  imageInfo.height = 0
  imageInfo.previewUrl = ''
  imageInfo.base64 = ''
}
</script>

<style scoped>
.image-base64-container {
  max-width: 1200px;
  margin: 10px auto;
}

.upload-card,
.result-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-ops {
  display: flex;
  align-items: center;
  gap: 12px;
}

.image-uploader {
  width: 100%;
}

:deep(.el-upload-dragger) {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background-color: var(--el-fill-color-blank);
  transition: all 0.3s;
}

.preview-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-preview {
  max-width: 100%;
  max-height: 220px;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: var(--el-box-shadow-light);
}

.file-meta {
  margin-top: 20px;
}

.result-textarea {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 13px;
}

:deep(.result-textarea .el-textarea__inner) {
  background-color: var(--el-fill-color-light);
  line-height: 1.6;
}

.result-footer {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 768px) {
  .type-selector {
    display: none;
    /* 小屏幕隐藏切换，直接给DataURI */
  }
}
</style>
