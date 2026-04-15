<script setup>
import QrcodeVue from 'qrcode.vue'
import IconEpDownload from '~icons/ep/download'
import IconEpRefresh from '~icons/ep/refresh'
import IconEpPicture from '~icons/ep/picture'

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
    width: 50,
    height: 50,
    excavate: true,
    borderRadius: 8
  },
  // 附加文本配置
  text: {
    content: '',
    position: 'bottom',
    fontSize: 14,
    color: '#000000'
  }
})

// 自动调整 Logo 尺寸上限和纠错等级
watch(
  () => config.size,
  newSize => {
    const maxSafe = Math.floor(newSize * 0.3)
    if (config.imageSettings.width > maxSafe) config.imageSettings.width = maxSafe
    if (config.imageSettings.height > maxSafe) config.imageSettings.height = maxSafe
  }
)

const revokeOldUrl = url => {
  if (url && typeof url === 'string' && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

watch(
  () => config.imageSettings.src,
  (newVal, oldVal) => {
    // 释放之前的 Blob URL 资源
    if (oldVal && newVal !== oldVal) {
      revokeOldUrl(oldVal)
    }

    if (newVal && config.level !== 'H') {
      config.level = 'H'
      ElMessage({
        message: '检测到已开启 Logo，已自动将纠错等级提升至 H (30%) 以保证识别率',
        type: 'success',
        duration: 3000
      })
    }
  }
)

onUnmounted(() => {
  revokeOldUrl(config.imageSettings.src)
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
  const qrcodeElement = document.querySelector('.qrcode-container canvas, .qrcode-container svg')
  if (!config.value || !qrcodeElement) {
    ElMessage.warning('内容为空，无法生成和下载二维码')
    return
  }

  const hasText = !!config.text.content
  const timestamp = Date.now()

  // 如果没有文本，走原来的简单路径
  if (!hasText) {
    if (config.renderAs === 'svg') {
      const svgData = new XMLSerializer().serializeToString(qrcodeElement)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `qrcode-${timestamp}.svg`
      link.click()
      URL.revokeObjectURL(url)
    } else {
      const url = qrcodeElement.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = url
      link.download = `qrcode-${timestamp}.png`
      link.click()
    }
    return
  }

  // 处理带文本的合成下载
  if (config.renderAs === 'canvas') {
    const originalCanvas = qrcodeElement
    // 关键：获取原始 Canvas 的实际像素尺寸 (考虑到可能存在的 DPI 缩放)
    const sourceWidth = originalCanvas.width
    const sourceHeight = originalCanvas.height

    // 计算比例 (实际像素与逻辑尺寸的比例)
    const scale = sourceWidth / config.size

    const fontSize = config.text.fontSize * scale
    const margin = 10 * scale // 固定间距 10px
    const padding = 20 * scale // 额外的全局留白
    const textHeight = fontSize

    const canvas = document.createElement('canvas')
    // 总宽度 = 二维码宽度 + 左右留白
    canvas.width = sourceWidth + padding * 2
    // 总高度 = 二维码高度 + 文本高度 + 间距 + 上下留白
    canvas.height = sourceHeight + textHeight + margin + padding * 2
    const ctx = canvas.getContext('2d')

    // 绘制背景
    ctx.fillStyle = config.background
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制二维码位置
    const qrX = padding
    const qrY = config.text.position === 'top' ? padding + textHeight + margin : padding

    // 绘制原始 Canvas (保持其原始像素精度)
    ctx.drawImage(originalCanvas, qrX, qrY)

    // 绘制文本
    ctx.fillStyle = config.text.color
    ctx.font = `500 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const textX = canvas.width / 2
    const textY =
      config.text.position === 'top' ? padding + textHeight / 2 : qrY + sourceHeight + margin + textHeight / 2

    ctx.fillText(config.text.content, textX, textY)

    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = url
    link.download = `qrcode-with-text-${timestamp}.png`
    link.click()
  } else {
    // SVG 合成
    const originalSvg = qrcodeElement
    const textHeight = config.text.fontSize
    const margin = 10 // 固定间距 10px
    const padding = 20 // 留边，使图片更美观
    const totalHeight = config.size + textHeight + margin + padding * 2
    const totalWidth = config.size + padding * 2

    const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    newSvg.setAttribute('width', totalWidth.toString())
    newSvg.setAttribute('height', totalHeight.toString())
    newSvg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`)
    newSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

    // 背景
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    bg.setAttribute('width', '100%')
    bg.setAttribute('height', '100%')
    bg.setAttribute('fill', config.background)
    newSvg.appendChild(bg)

    // 二维码内容包裹层
    const qrGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const qrY = config.text.position === 'top' ? padding + textHeight + margin : padding
    qrGroup.setAttribute('transform', `translate(${padding}, ${qrY})`)

    // 深度克隆原始 SVG 的所有内容
    const clonedContent = originalSvg.cloneNode(true)
    // 移除克隆根节点的尺寸限制，由外层 g 控制
    clonedContent.removeAttribute('width')
    clonedContent.removeAttribute('height')
    clonedContent.removeAttribute('x')
    clonedContent.removeAttribute('y')

    qrGroup.appendChild(clonedContent)
    newSvg.appendChild(qrGroup)

    // 文本元素
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    const textY =
      config.text.position === 'top' ? padding + textHeight / 2 : qrY + config.size + margin + textHeight / 2

    text.setAttribute('x', (totalWidth / 2).toString())
    text.setAttribute('y', textY.toString())
    text.setAttribute('fill', config.text.color)
    text.setAttribute('font-size', config.text.fontSize.toString())
    text.setAttribute('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif')
    text.setAttribute('text-anchor', 'middle')
    text.setAttribute('dominant-baseline', 'middle')
    text.textContent = config.text.content
    newSvg.appendChild(text)

    const svgData = new XMLSerializer().serializeToString(newSvg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `qrcode-with-text-${timestamp}.svg`
    link.click()
    URL.revokeObjectURL(url)
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
  config.text.content = ''
  config.text.position = 'bottom'
  config.text.fontSize = 14
  config.text.color = '#000000'
  ElMessage.info('配置已重置')
}

// 处理 Logo 上传
const handleLogoUpload = async file => {
  const isImage = file.raw.type.startsWith('image/')

  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }

  try {
    // 预处理图片：1:1 裁剪 + 尺寸标准化
    const processImage = rawFile => {
      return new Promise((resolve, reject) => {
        const tempUrl = URL.createObjectURL(rawFile)
        const img = new Image()
        img.crossOrigin = 'anonymous'

        img.onload = () => {
          // 智能分辨率策略：在 [128, 512] 范围内自适应
          const minRes = 128
          const maxRes = 512
          const { width, height } = img
          const originalMinSide = Math.min(width, height)
          const targetSize = Math.max(minRes, Math.min(maxRes, originalMinSide))

          const canvas = document.createElement('canvas')
          canvas.width = targetSize
          canvas.height = targetSize
          const ctx = canvas.getContext('2d', { alpha: true })

          // 计算居中裁剪比例
          const sx = (width - originalMinSide) / 2
          const sy = (height - originalMinSide) / 2

          // 绘制到 Canvas
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.clearRect(0, 0, targetSize, targetSize)
          ctx.drawImage(img, sx, sy, originalMinSide, originalMinSide, 0, 0, targetSize, targetSize)

          canvas.toBlob(
            blob => {
              URL.revokeObjectURL(tempUrl) // 立即释放原始大图内存
              if (blob) {
                resolve(URL.createObjectURL(blob))
              } else {
                reject(new Error('图片处理失败'))
              }
            },
            'image/png',
            0.9
          )
        }

        img.onerror = () => {
          URL.revokeObjectURL(tempUrl)
          reject(new Error('图片加载失败，请检查文件是否损坏'))
        }

        img.src = tempUrl
      })
    }

    const processedUrl = await processImage(file.raw)
    config.imageSettings.src = processedUrl

    // 设置初始建议尺寸 (20%)
    const recommendedSize = Math.floor(config.size * 0.2)
    config.imageSettings.width = recommendedSize
    config.imageSettings.height = recommendedSize

    ElMessage.success('Logo 已自动处理为 1:1 高清比例')
  } catch (error) {
    console.error('Logo 处理错误:', error)
    ElMessage.error(error.message || '图片处理失败')
  }

  return false // 阻止自动上传
}
</script>

<template>
  <div class="qrcode-view-container">
    <el-row :gutter="24">
      <el-col :md="14" :xs="24">
        <el-card class="box-card-custom" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="title">
                <el-icon>
                  <IconEpPicture />
                </el-icon>
                生成配置
              </span>
              <el-button link type="info" @click="resetConfig">
                <el-icon>
                  <IconEpRefresh />
                </el-icon>
                重置
              </el-button>
            </div>
          </template>

          <el-form :model="config" label-position="top">
            <el-form-item label="内容文本 / URL">
              <el-input
                v-model="config.value"
                :clearable="true"
                :rows="4"
                placeholder="请输入要生成二维码的内容..."
                resize="none"
                type="textarea"
              />
            </el-form-item>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="尺寸 (px)">
                  <el-slider v-model="config.size" :max="800" :min="100" :step="10" show-input />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="外边距 (Margin)">
                  <el-input-number v-model="config.margin" :max="10" :min="0" />
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
                    <el-option
                      v-for="item in renderOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
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
                  <el-input v-model="config.imageSettings.src" disabled placeholder="请上传 Logo 图片" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="本地上传 Logo">
                  <el-upload
                    :auto-upload="false"
                    :on-change="handleLogoUpload"
                    :show-file-list="false"
                    accept="image/*"
                    action="#"
                  >
                    <el-button plain size="small" type="primary">点击上传</el-button>
                  </el-upload>
                </el-form-item>
              </el-col>
            </el-row>

            <div v-if="config.imageSettings.src" class="logo-config-box">
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="Logo 宽度">
                    <el-input-number
                      v-model="config.imageSettings.width"
                      :max="Math.floor(config.size * 0.35)"
                      :min="10"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Logo 高度">
                    <el-input-number
                      v-model="config.imageSettings.height"
                      :max="Math.floor(config.size * 0.35)"
                      :min="10"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="背景挖掘">
                    <el-switch v-model="config.imageSettings.excavate" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-alert
                v-if="config.imageSettings.width > config.size * 0.25"
                class="mt-2"
                show-icon
                title="Logo 尺寸较大，可能会影响部分扫描器的识别率，建议保持在 25% 以内。"
                type="warning"
              />
            </div>

            <el-divider content-position="left">文本备注 (可选)</el-divider>

            <el-form-item label="备注文本内容">
              <el-input v-model="config.text.content" clearable placeholder="在二维码上方或下方添加辅助文字..." />
            </el-form-item>

            <div v-if="config.text.content" class="text-config-box">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="文本位置">
                    <el-radio-group v-model="config.text.position">
                      <el-radio-button value="top">上方</el-radio-button>
                      <el-radio-button value="bottom">下方</el-radio-button>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="文本颜色">
                    <div class="color-picker-wrapper">
                      <el-color-picker v-model="config.text.color" />
                      <span class="color-value">{{ config.text.color }}</span>
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="字体大小 (px)">
                    <el-input-number v-model="config.text.fontSize" :max="40" :min="10" />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </el-form>
        </el-card>
      </el-col>

      <el-col :md="10" :xs="24">
        <div class="preview-sticky">
          <el-card class="box-card-custom" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="title">实时预览</span>
                <div class="actions">
                  <el-button :disabled="!config.value" type="primary" @click="downloadQR">
                    <el-icon>
                      <IconEpDownload />
                    </el-icon>
                    下载图片
                  </el-button>
                </div>
              </div>
            </template>

            <div class="qrcode-container">
              <div v-if="config.value" :style="{ backgroundColor: config.background }" class="qrcode-wrapper">
                <div
                  class="qrcode-inner-container"
                  :style="{ flexDirection: config.text.position === 'top' ? 'column-reverse' : 'column' }"
                >
                  <qrcode-vue
                    :background="config.background"
                    :foreground="config.foreground"
                    :gradient="config.gradient"
                    :gradient-end-color="config.gradientEndColor"
                    :gradient-start-color="config.gradientStartColor"
                    :gradient-type="config.gradientType"
                    :image-settings="computedImageSettings"
                    :level="config.level"
                    :margin="config.margin"
                    :render-as="config.renderAs"
                    :size="config.size"
                    :value="config.value"
                  />
                  <div
                    v-if="config.text.content"
                    class="qrcode-text-preview"
                    :style="{
                      color: config.text.color,
                      fontSize: config.text.fontSize + 'px',
                      [config.text.position === 'top' ? 'marginBottom' : 'marginTop']: '10px'
                    }"
                  >
                    {{ config.text.content }}
                  </div>
                </div>
              </div>
              <el-empty v-else description="请输入内容以生成二维码" />

              <div v-if="config.value" class="qrcode-info">
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
  margin: 20px auto;
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

.text-config-box {
  background-color: var(--el-fill-color-light);
  padding: 16px;
  border-radius: 8px;
  margin-top: 10px;
}

.qrcode-inner-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.qrcode-text-preview {
  font-weight: 500;
  text-align: center;
  word-break: break-all;
  max-width: 100%;
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
