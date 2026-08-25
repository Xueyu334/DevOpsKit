<template>
  <div class="image-to-ico-container">
    <!-- 主体区域：两栏卡片布局 -->
    <el-row :gutter="20">
      <!-- 左侧：图片选择与原图预览 -->
      <el-col :xs="24" :lg="11">
        <el-card class="box-card left-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <el-icon class="header-icon"><IconEpPicture /></el-icon>
                <span>选择原图</span>
              </div>
              <el-button v-if="parsedInfo" type="danger" link size="small" @click="handleClear"> 清空文件 </el-button>
            </div>
          </template>

          <!-- 上传与拖拽区域 -->
          <el-upload
            class="image-uploader"
            drag
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
            @change="handleFileChange"
          >
            <div v-if="!parsedInfo" class="upload-placeholder">
              <el-icon class="upload-placeholder-icon"><IconEpUploadFilled /></el-icon>
              <div class="el-upload__text">将图片拖到此处，或 <em>点击上传</em></div>
              <div class="upload-tip">支持 PNG、JPG、JPEG、WebP、SVG (最大 20MB)，支持 Ctrl+V 粘贴</div>
            </div>

            <!-- 原图预览展示 -->
            <div v-else class="preview-area">
              <div class="checkerboard-box">
                <img :src="parsedInfo.previewUrl" class="source-image-preview" alt="原图预览" />
                <div class="hover-replace-tip">点击或拖拽新图片可直接替换</div>
              </div>
              <div class="preview-badge-row">
                <el-tag size="small" type="info" effect="plain">
                  {{ parsedInfo.isSvg ? '矢量 SVG' : '位图 ' + parsedInfo.type.replace('image/', '').toUpperCase() }}
                </el-tag>
                <el-tag size="small" type="success" effect="plain">
                  {{ parsedInfo.width }} × {{ parsedInfo.height }} px
                </el-tag>
                <el-tag size="small" effect="plain">
                  {{ formatFileSize(parsedInfo.size) }}
                </el-tag>
              </div>
            </div>
          </el-upload>

          <!-- 原图元信息表格 -->
          <div v-if="parsedInfo" class="file-meta-section">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="文件名">
                <span class="text-ellipsis" :title="parsedInfo.name">{{ parsedInfo.name }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="原始尺寸">
                {{ parsedInfo.width }} × {{ parsedInfo.height }} px
                <span v-if="parsedInfo.width !== parsedInfo.height" class="meta-sub-tip">
                  (非正方形，将等比居中保留透明留白)
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="文件大小">
                {{ formatFileSize(parsedInfo.size) }}
              </el-descriptions-item>
              <el-descriptions-item label="文件格式">
                {{ parsedInfo.type }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 安全提示 -->
          <div class="privacy-note">
            <el-icon><IconEpLock /></el-icon>
            <span>纯本地 Canvas 解析与编码转换，图片不上传服务器，保护隐私安全。</span>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：尺寸选择、转换与生成结果 -->
      <el-col :xs="24" :lg="13">
        <el-card class="box-card right-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <el-icon class="header-icon"><IconEpOperation /></el-icon>
                <span>ICO 配置与生成</span>
              </div>
              <div class="header-status">
                <el-tag v-if="processStatus === 'idle'" type="info" size="small">等待上传</el-tag>
                <el-tag v-else-if="processStatus === 'ready'" type="primary" size="small">已就绪</el-tag>
                <el-tag v-else-if="processStatus === 'processing'" type="warning" size="small">转换中...</el-tag>
                <el-tag v-else-if="processStatus === 'success'" type="success" size="small">已生成</el-tag>
                <el-tag v-else-if="processStatus === 'error'" type="danger" size="small">转换失败</el-tag>
              </div>
            </div>
          </template>

          <!-- 尺寸配置区 -->
          <div class="config-section">
            <div class="section-title-row">
              <div class="section-title-left">
                <el-checkbox
                  :model-value="isAllSelected"
                  :indeterminate="isIndeterminate"
                  class="check-all-box"
                  @change="handleCheckAllChange"
                >
                  <span class="section-title">选择 ICO 包含尺寸：</span>
                </el-checkbox>
              </div>
              <div class="preset-buttons">
                <el-button size="small" text type="primary" :disabled="isAllSelected" @click="applyPreset('all')">
                  全选
                </el-button>
                <el-button
                  size="small"
                  text
                  :type="selectedSizes.length > 0 ? 'danger' : 'info'"
                  :disabled="selectedSizes.length === 0"
                  @click="applyPreset('none')"
                >
                  取消
                </el-button>
                <el-button size="small" text type="primary" @click="applyPreset('favicon')">常用 Favicon</el-button>
              </div>
            </div>

            <div class="size-checkbox-grid">
              <el-checkbox-group v-model="selectedSizes" class="checkbox-group-wrapper">
                <el-checkbox
                  v-for="item in availableSizes"
                  :key="item.value"
                  :value="item.value"
                  class="size-checkbox-item"
                  border
                >
                  <div class="checkbox-content">
                    <span class="size-label">{{ item.label }}</span>
                    <span class="size-desc">{{ item.desc }}</span>
                  </div>
                </el-checkbox>
              </el-checkbox-group>
            </div>

            <div class="selection-counter">
              <span
                >已选 <strong>{{ selectedSizes.length }}</strong> 个尺寸</span
              >
              <span v-if="selectedSizes.length === 0" class="selection-warning"> (至少需要选择 1 个尺寸) </span>
            </div>
          </div>

          <!-- 转换触发按钮 -->
          <div class="action-bar">
            <el-button
              type="primary"
              size="large"
              :loading="isProcessing"
              :disabled="!parsedInfo || selectedSizes.length === 0 || isProcessing"
              class="convert-btn"
              @click="handleConvert"
            >
              <el-icon v-if="!isProcessing"><IconEpFinished /></el-icon>
              <span>{{ isProcessing ? '正在生成多尺寸 ICO...' : '生成 ICO 图标' }}</span>
            </el-button>
          </div>

          <!-- 转换成功结果展示区 -->
          <div v-if="processStatus === 'success' && icoResult" class="result-section">
            <el-divider content-position="center">
              <span class="divider-title">ICO 生成成功</span>
            </el-divider>

            <div class="result-summary-card">
              <div class="summary-left">
                <div class="ico-badge-icon">ICO</div>
                <div class="summary-text">
                  <div class="ico-filename">{{ icoResult.filename }}</div>
                  <div class="ico-meta">
                    <span
                      >文件大小：<strong>{{ formatFileSize(icoResult.blob.size) }}</strong></span
                    >
                    <el-divider direction="vertical" />
                    <span
                      >包含 <strong>{{ icoResult.frames.length }}</strong> 组多分辨率图标</span
                    >
                  </div>
                </div>
              </div>
              <div class="summary-right">
                <el-button type="success" size="default" class="download-btn" @click="handleDownload">
                  <el-icon><IconEpDownload /></el-icon>
                  <span>下载 .ico 文件</span>
                </el-button>
              </div>
            </div>

            <!-- 各尺寸生成预览列表 -->
            <div class="rendered-frames-container">
              <div class="frames-heading">
                <span>各尺寸图标效果预览：</span>
                <span class="frames-sub-heading">(点击单张可单独导出 PNG)</span>
              </div>
              <div class="frames-grid">
                <div
                  v-for="frame in icoResult.frames"
                  :key="frame.size"
                  class="frame-card"
                  title="点击下载此尺寸的 PNG 图片"
                  @click="handleDownloadSingleFrame(frame)"
                >
                  <div class="frame-preview-box">
                    <img
                      :src="frame.previewUrl"
                      :alt="frame.size + 'x' + frame.size"
                      class="frame-preview-img"
                      :style="{
                        width: Math.min(frame.size, 48) + 'px',
                        height: Math.min(frame.size, 48) + 'px'
                      }"
                    />
                  </div>
                  <div class="frame-size-label">{{ frame.size }} × {{ frame.size }}</div>
                  <div class="frame-data-size">{{ formatFileSize(frame.pngData.byteLength) }}</div>
                  <el-button type="primary" link size="small" class="frame-dl-btn">
                    <el-icon><IconEpDownload /></el-icon> PNG
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 底部：ICO 使用说明与科普指南 -->
    <el-card class="guide-card" shadow="never">
      <template #header>
        <div class="guide-header">
          <el-icon class="guide-icon"><IconEpInfoFilled /></el-icon>
          <span>ICO 尺寸与常见用途说明</span>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="8" class="guide-item">
          <div class="guide-title">16 × 16 & 32 × 32</div>
          <div class="guide-desc">
            网站标准 Favicon 图标。16px 用于浏览器标签页与地址栏，32px 适用于高分屏及浏览器收藏夹/书签栏。
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8" class="guide-item">
          <div class="guide-title">48 × 48 & 64 × 64</div>
          <div class="guide-desc">桌面系统快捷方式与中等尺寸图标。适用于 Windows 桌面、开始菜单常用程序图标展示。</div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8" class="guide-item">
          <div class="guide-title">128 × 128 & 256 × 256</div>
          <div class="guide-desc">
            现代高清大图标。适用于 Windows 资源管理器大图标视图、安装包及 Retina 视网膜高清显示场景。
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { validateImageFile, parseImageInfo, renderFramesForSizes, encodeIco, downloadBlob } from '@/utils/ico'

/**
 * 页面可用尺寸列表
 */
const availableSizes = [
  { value: 16, label: '16 × 16', desc: '标签页 Favicon' },
  { value: 32, label: '32 × 32', desc: '收藏夹/高分屏' },
  { value: 48, label: '48 × 48', desc: '桌面快捷方式' },
  { value: 64, label: '64 × 64', desc: '系统常规图标' },
  { value: 128, label: '128 × 128', desc: '高清大图标' },
  { value: 256, label: '256 × 256', desc: '超高清/Retina' }
]

// 响应式状态
const parsedInfo = ref(null)
// 默认不选择任何尺寸，由用户按需勾选
const selectedSizes = ref([])
const processStatus = ref('idle') // 'idle' | 'ready' | 'processing' | 'success' | 'error'
const isProcessing = computed(() => processStatus.value === 'processing')

const isAllSelected = computed(() => selectedSizes.value.length === availableSizes.length)
const isIndeterminate = computed(
  () => selectedSizes.value.length > 0 && selectedSizes.value.length < availableSizes.length
)

const handleCheckAllChange = val => {
  selectedSizes.value = val ? availableSizes.map(item => item.value) : []
}

const icoResult = ref(null)

/**
 * 格式化文件大小为易读字符串
 */
const formatFileSize = bytes => {
  if (bytes === 0) return '0 B'
  if (!bytes || isNaN(bytes)) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 处理文件上传与选择
 */
const handleFileChange = async uploadFile => {
  const file = uploadFile.raw
  if (!file) return

  // 1. 校验文件
  const check = validateImageFile(file)
  if (!check.valid) {
    ElMessage.warning(check.error || '所选文件格式不支持')
    return
  }

  // 2. 清理之前的结果和旧 URL
  cleanupPreviousState()

  try {
    const info = await parseImageInfo(file)
    parsedInfo.value = info
    processStatus.value = 'ready'
    ElMessage.success(`已载入图片：${file.name}`)
  } catch (err) {
    console.error('解析图片文件失败:', err)
    processStatus.value = 'error'
    ElMessage.error(err instanceof Error ? err.message : '解析图片文件失败，请检查文件是否损坏')
  }
}

/**
 * 应用快捷预设尺寸
 */
const applyPreset = type => {
  if (type === 'all') {
    selectedSizes.value = availableSizes.map(item => item.value)
  } else if (type === 'none') {
    selectedSizes.value = []
  } else if (type === 'favicon') {
    selectedSizes.value = [16, 32, 48]
  }
}

/**
 * 执行 ICO 转换生成
 */
const handleConvert = async () => {
  if (!parsedInfo.value) {
    ElMessage.warning('请先上传图片文件')
    return
  }
  if (selectedSizes.value.length === 0) {
    ElMessage.warning('请至少勾选一个目标 ICO 尺寸')
    return
  }

  processStatus.value = 'processing'

  // 清理先前生成的帧预览
  if (icoResult.value?.frames) {
    for (const frame of icoResult.value.frames) {
      if (frame.previewUrl) {
        URL.revokeObjectURL(frame.previewUrl)
      }
    }
  }
  icoResult.value = null

  try {
    const sizes = [...selectedSizes.value].sort((a, b) => a - b)
    const file = parsedInfo.value.rawFile

    // 1. 渲染各尺寸帧
    const frames = await renderFramesForSizes(file, sizes)

    // 2. 组装 ICO 二进制
    const blob = encodeIco(frames)

    // 3. 计算输出文件名
    const baseName = parsedInfo.value.name.replace(/\.[^.]+$/, '') || 'favicon'
    const filename = `${baseName}.ico`

    icoResult.value = {
      blob,
      filename,
      frames
    }

    processStatus.value = 'success'
    ElMessage.success('ICO 图标已生成完毕！')
  } catch (err) {
    console.error('ICO 生成异常:', err)
    processStatus.value = 'error'
    ElMessage.error(err instanceof Error ? err.message : 'ICO 转换失败，请重试')
  }
}

/**
 * 触发下载
 */
const handleDownload = () => {
  if (!icoResult.value?.blob) {
    ElMessage.warning('未找到生成的 ICO 文件')
    return
  }
  try {
    downloadBlob(icoResult.value.blob, icoResult.value.filename)
    ElMessage.success(`开始下载：${icoResult.value.filename}`)
  } catch (err) {
    console.error('下载失败:', err)
    ElMessage.error('下载触发失败')
  }
}

/**
 * 清理状态与释放内存
 */
const cleanupPreviousState = () => {
  if (parsedInfo.value?.previewUrl) {
    URL.revokeObjectURL(parsedInfo.value.previewUrl)
  }
  if (icoResult.value?.frames) {
    for (const frame of icoResult.value.frames) {
      if (frame.previewUrl) {
        URL.revokeObjectURL(frame.previewUrl)
      }
    }
  }
  parsedInfo.value = null
  icoResult.value = null
  processStatus.value = 'idle'
}

/**
 * 单独下载某个尺寸的 PNG 文件
 */
const handleDownloadSingleFrame = frame => {
  if (!frame?.blob) return
  const baseName = parsedInfo.value?.name.replace(/\.[^.]+$/, '') || 'icon'
  const filename = `${baseName}-${frame.size}x${frame.size}.png`
  try {
    downloadBlob(frame.blob, filename)
    ElMessage.success(`已下载 ${frame.size} × ${frame.size} PNG`)
  } catch (err) {
    console.error('下载单张 PNG 失败:', err)
    ElMessage.error('下载失败')
  }
}

/**
 * 监听全局粘贴图片事件 (Ctrl + V)
 */
const handleGlobalPaste = event => {
  const items = event.clipboardData?.items
  if (!items) return

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        handleFileChange({ raw: file })
        event.preventDefault()
        break
      }
    }
  }
}

onMounted(() => {
  window.addEventListener('paste', handleGlobalPaste)
})

// 组件卸载时释放所有 ObjectURL，防止内存泄漏
onUnmounted(() => {
  window.removeEventListener('paste', handleGlobalPaste)
  cleanupPreviousState()
})
</script>

<style scoped>
.image-to-ico-container {
  max-width: 1280px;
  margin: 10px auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.box-card {
  border-radius: 8px;
  min-height: 480px;
  display: flex;
  flex-direction: column;
}

.box-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.header-icon {
  font-size: 18px;
  color: var(--el-color-primary);
}

/* 上传与原图预览区域 */
.image-uploader {
  width: 100%;
}

:deep(.el-upload) {
  width: 100%;
}

:deep(.el-upload-dragger) {
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  background-color: var(--el-fill-color-blank);
  border: 2px dashed var(--el-border-color);
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-upload-dragger:hover) {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-placeholder-icon {
  font-size: 48px;
  color: var(--el-text-color-secondary);
}

.upload-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

/* 经典棋盘透明背景 */
.checkerboard-box {
  position: relative;
  width: 100%;
  max-height: 220px;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  background-image:
    linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%);
  background-size: 16px 16px;
  background-position:
    0 0,
    0 8px,
    8px -8px,
    -8px 0px;
  border-radius: 6px;
  overflow: hidden;
  padding: 12px;
  cursor: pointer;
}

.hover-replace-tip {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-size: 11px;
  text-align: center;
  padding: 4px 0;
  opacity: 0;
  transition: opacity 0.2s ease;
  backdrop-filter: blur(2px);
}

.checkerboard-box:hover .hover-replace-tip {
  opacity: 1;
}

.source-image-preview {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.12));
}

.preview-badge-row {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.file-meta-section {
  margin-top: 16px;
}

.text-ellipsis {
  display: inline-block;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.meta-sub-tip {
  color: var(--el-color-warning);
  font-size: 12px;
  margin-left: 4px;
}

.privacy-note {
  margin-top: auto;
  padding-top: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 右侧配置区 */
.config-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.section-title-left {
  display: flex;
  align-items: center;
}

.check-all-box {
  margin-right: 0 !important;
}

:deep(.check-all-box .el-checkbox__label) {
  padding-left: 8px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.preset-buttons {
  display: flex;
  align-items: center;
  gap: 0;
}

.preset-buttons :deep(.el-button) {
  margin-left: 0 !important;
  padding: 2px 4px !important;
  height: 24px;
  font-size: 12px;
}

.size-checkbox-grid {
  margin-top: 4px;
}

.checkbox-group-wrapper {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 10px;
  width: 100%;
}

.size-checkbox-item {
  margin: 0 !important;
  height: auto !important;
  padding: 10px 14px !important;
  border-radius: 6px !important;
}

.checkbox-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-left: 6px;
}

.size-label {
  font-weight: 600;
  font-size: 14px;
}

.size-desc {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.selection-counter {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.selection-warning {
  color: var(--el-color-danger);
  margin-left: 6px;
}

/* 操作栏 */
.action-bar {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.convert-btn {
  width: 100%;
  max-width: 320px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* 生成结果展示区 */
.result-section {
  margin-top: 16px;
}

.divider-title {
  font-size: 13px;
  color: var(--el-color-success);
  font-weight: 600;
}

.result-summary-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 14px 18px;
  flex-wrap: wrap;
  gap: 12px;
}

.summary-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.ico-badge-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 1px;
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
}

.ico-filename {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.ico-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.download-btn {
  font-weight: 600;
}

/* 多尺寸图标效果预览网格 */
.rendered-frames-container {
  margin-top: 16px;
}

.frames-heading {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  margin-bottom: 10px;
}

.frames-sub-heading {
  font-size: 12px;
  font-weight: normal;
  color: var(--el-text-color-secondary);
}

.frames-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.frame-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 8px 6px 8px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s,
    border-color 0.2s;
}

.frame-card:hover {
  transform: translateY(-2px);
  border-color: var(--el-color-primary-light-5);
  box-shadow: var(--el-box-shadow-light);
}

.frame-dl-btn {
  margin-top: 4px;
  font-size: 11px;
  height: 22px;
  padding: 0 4px;
}

.frame-preview-box {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  background-image:
    linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%);
  background-size: 10px 10px;
  background-position:
    0 0,
    0 5px,
    5px -5px,
    -5px 0px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.frame-preview-img {
  object-fit: contain;
  image-rendering: pixelated;
}

.frame-size-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.frame-data-size {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

/* 底部指南卡片 */
.guide-card {
  border-radius: 8px;
  background: var(--el-fill-color-light);
}

.guide-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.guide-icon {
  color: var(--el-color-info);
}

.guide-item {
  margin-bottom: 8px;
}

.guide-title {
  font-weight: 600;
  font-size: 13px;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.guide-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

@media (max-width: 768px) {
  .checkbox-group-wrapper {
    grid-template-columns: 1fr 1fr;
  }
  .result-summary-card {
    flex-direction: column;
    align-items: flex-start;
  }
  .summary-right {
    width: 100%;
  }
  .download-btn {
    width: 100%;
  }
}
</style>
