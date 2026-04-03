<script setup>
import { ref, reactive, computed } from 'vue'
import QrcodeVue from 'qrcode.vue'
import IconEpDownload from '~icons/ep/download'
import IconEpRefresh from '~icons/ep/refresh'
import IconEpPicture from '~icons/ep/picture'
import { ElMessage } from 'element-plus'

// 二维码配置
const config = reactive({
  value: '',
  size: 256,
  level: 'M',
  renderAs: 'canvas',
  background: '#ffffff',
  foreground: '#000000',
  margin: 1,
  gradient: false,
  gradientType: 'linear',
  gradientStartColor: '#000000',
  gradientEndColor: '#38bdf8',
  imageSettings: {
    src: '',
    width: 40,
    height: 40,
    excavate: true,
    borderRadius: 0
  }
})

const levelOptions = [
  { label: 'L (Low - 7%)', value: 'L' },
  { label: 'M (Medium - 15%)', value: 'M' },
  { label: 'Q (Quartile - 25%)', value: 'Q' },
  { label: 'H (High - 30%)', value: 'H' }
]

const renderOptions = [
  { label: 'Canvas (推荐)', value: 'canvas' },
  { label: 'SVG', value: 'svg' }
]

const qrcodeRef = ref(null)

// 解决子属性变化不触发更新的问题
const computedImageSettings = computed(() => {
  if (!config.imageSettings.src) return undefined
  return {
    src: config.imageSettings.src,
    width: Number(config.imageSettings.width),
    height: Number(config.imageSettings.height),
    excavate: config.imageSettings.excavate,
    borderRadius: config.imageSettings.borderRadius
  }
})

// 下载二维码
const downloadQR = () => {
  const canvas = document.querySelector('.qrcode-container canvas')
  if (config.renderAs === 'svg') {
    const svg = document.querySelector('.qrcode-container svg')
    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `qrcode-${Date.now()}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } else if (canvas) {
    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = url
    link.download = `qrcode-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } else {
    ElMessage.warning('无法找到可下载的二维码实例')
  }
}

// 重置配置
const resetConfig = () => {
  config.value = ''
  config.size = 256
  config.level = 'M'
  config.renderAs = 'canvas'
  config.background = '#ffffff'
  config.foreground = '#000000'
  config.margin = 1
  config.gradient = false
  config.imageSettings.src = ''
  ElMessage.info('配置已重置')
}

// 处理 Logo 上传
const handleLogoUpload = (file) => {
  const isImage = file.raw.type.startsWith('image/')
  const isLt2M = file.raw.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('Logo 图片大小不能超过 2MB！')
    return false
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    config.imageSettings.src = e.target.result
  }
  reader.readAsDataURL(file.raw)
  return false // 阻止自动上传
}

</script>

<template>
  <div class="qrcode-view-container">
    <el-row :gutter="24">
      <el-col :xs="24" :md="14">
        <el-card class="box-card-custom" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="title">
                <el-icon>
                  <IconEpPicture />
                </el-icon> 生成配置
              </span>
              <el-button type="info" link @click="resetConfig">
                <el-icon>
                  <IconEpRefresh />
                </el-icon> 重置
              </el-button>
            </div>
          </template>

          <el-form :model="config" label-position="top">
            <el-form-item label="内容文本 / URL">
              <el-input v-model="config.value" type="textarea" :clearable="true" :rows="4" placeholder="请输入要生成二维码的内容..."
                resize="none" />
            </el-form-item>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="尺寸 (px)">
                  <el-slider v-model="config.size" :min="100" :max="800" :step="10" show-input />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="外边距 (Margin)">
                  <el-input-number v-model="config.margin" :min="0" :max="10" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="纠错等级">
                  <el-select v-model="config.level" style="width: 100%">
                    <el-option v-for="item in levelOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="渲染方式">
                  <el-select v-model="config.renderAs" style="width: 100%">
                    <el-option v-for="item in renderOptions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">外观样式</el-divider>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="背景颜色">
                  <div class="color-picker-wrapper">
                    <el-color-picker v-model="config.background" show-alpha />
                    <span class="color-value">{{ config.background }}</span>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="前景颜色">
                  <div class="color-picker-wrapper">
                    <el-color-picker v-model="config.foreground" :disabled="config.gradient" />
                    <span class="color-value">{{ config.foreground }}</span>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="启用渐变色">
              <div class="flex-center-between w-full">
                <el-switch v-model="config.gradient" />
                <div v-if="config.gradient" class="gradient-controls flex">
                  <el-color-picker v-model="config.gradientStartColor" class="mr-2" />
                  <el-color-picker v-model="config.gradientEndColor" />
                </div>
              </div>
            </el-form-item>

            <el-divider content-position="left">Logo 设置 (可选)</el-divider>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Logo 地址">
                  <el-input v-model="config.imageSettings.src" clearable placeholder="输入图片 URL 或从下方上传" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="本地上传 Logo">
                  <el-upload action="#" :auto-upload="false" :on-change="handleLogoUpload" :show-file-list="false"
                    accept="image/*">
                    <el-button type="primary" plain size="small">点击上传</el-button>
                  </el-upload>
                </el-form-item>
              </el-col>
            </el-row>

            <div v-if="config.imageSettings.src" class="logo-config-box">
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="Logo 宽度">
                    <el-input-number v-model="config.imageSettings.width" :min="10" :max="config.size / 2" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Logo 高度">
                    <el-input-number v-model="config.imageSettings.height" :min="10" :max="config.size / 2" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="背景挖掘">
                    <el-switch v-model="config.imageSettings.excavate" />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="10">
        <div class="preview-sticky">
          <el-card class="box-card-custom" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="title">实时预览</span>
                <div class="actions">
                  <el-button type="primary" @click="downloadQR">
                    <el-icon>
                      <IconEpDownload />
                    </el-icon> 下载图片
                  </el-button>
                </div>
              </div>
            </template>

            <div class="qrcode-container">
              <div class="qrcode-wrapper" :style="{ backgroundColor: config.background }">
                <qrcode-vue :value="config.value || ' '" :size="config.size" :level="config.level"
                  :render-as="config.renderAs" :background="config.background" :foreground="config.foreground"
                  :margin="config.margin" :gradient="config.gradient" :gradient-type="config.gradientType"
                  :gradient-start-color="config.gradientStartColor" :gradient-end-color="config.gradientEndColor"
                  :image-settings="computedImageSettings" />
              </div>
              <div class="qrcode-info">
                <p>内容长度: {{ config.value?.length || 0 }} 字符</p>
                <p>当前渲染: {{ config.renderAs.toUpperCase() }}</p>
              </div>
            </div>
          </el-card>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.qrcode-view-container {
  padding: 0;
  max-width: 1280px;
  margin: 0 auto;
}

.box-card-custom {
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s ease;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header .title {
  font-weight: 600;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-value {
  font-family: monospace;
  font-size: 0.9rem;
  color: var(--el-text-color-secondary);
}

.logo-config-box {
  background-color: var(--el-fill-color-light);
  padding: 16px;
  border-radius: 8px;
  margin-top: 10px;
}

.preview-sticky {
  position: sticky;
  top: 20px;
}

.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 20px;
}

.qrcode-wrapper {
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
  max-width: 100%;
}

.qrcode-wrapper:hover {
  transform: scale(1.02);
}

.qrcode-wrapper :deep(canvas),
.qrcode-wrapper :deep(svg) {
  max-width: 100% !important;
  height: auto !important;
}

.qrcode-info {
  text-align: center;
  font-size: 0.85rem;
  color: var(--el-text-color-secondary);
}

.flex-center-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.w-full {
  width: 100%;
}

.mr-2 {
  margin-right: 8px;
}

.mt-2 {
  margin-top: 8px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .preview-sticky {
    position: static;
    margin-top: 24px;
  }
}
</style>
