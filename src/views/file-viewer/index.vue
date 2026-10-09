<template>
  <div class="app-container file-viewer-page">
    <!-- 顶部控制条（仅在有文件预览时显示，或者常驻） -->
    <div class="viewer-header">
      <div class="header-left">
        <h3 class="page-title">
          <el-icon class="title-icon">
            <IconEpDocument/>
          </el-icon>
          文件在线预览
        </h3>
        <el-tag v-if="file" class="file-info-tag" effect="plain" round>
          <span :title="file.name" class="file-name">{{ file.name }}</span>
          <span class="file-size">({{ formatFileSize(file.size) }})</span>
        </el-tag>
      </div>
      <div class="header-actions">
        <el-button v-if="file" plain type="warning" @click="handleClearFile">
          <el-icon>
            <IconEpRefreshLeft/>
          </el-icon>
          重新选择文件
        </el-button>
      </div>
    </div>

    <!-- 预览配置面板（仅在有文件预览时展示，帮助调节参数） -->
    <el-collapse-transition>
      <el-card v-if="file" class="config-panel" shadow="never">
        <el-form :inline="true" class="config-form" size="default">
          <el-form-item label="适应模式">
            <el-select v-model="fit" placeholder="适应模式" style="width: 130px">
              <el-option label="等宽自适应" value="width"/>
              <el-option label="等高自适应" value="height"/>
              <el-option label="包含 (Contain)" value="contain"/>
              <el-option label="覆盖 (Cover)" value="cover"/>
              <el-option label="实际大小" value="actual"/>
              <el-option label="缩减适应" value="scale-down"/>
            </el-select>
          </el-form-item>
          <el-form-item label="预览主题">
            <el-select v-model="theme" placeholder="预览主题" style="width: 110px">
              <el-option label="跟随系统" value="auto"/>
              <el-option label="浅色" value="light"/>
              <el-option label="深色" value="dark"/>
            </el-select>
          </el-form-item>
          <el-form-item label="显示工具栏">
            <el-switch v-model="toolbar"/>
          </el-form-item>
          <el-form-item label="预览高度">
            <el-radio-group v-model="heightMode" @change="handleHeightModeChange">
              <el-radio-button value="standard">标准 (640px)</el-radio-button>
              <el-radio-button value="large">大屏 (800px)</el-radio-button>
              <el-radio-button value="full">视口高度 (78vh)</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </el-card>
    </el-collapse-transition>

    <!-- 核心展示区 -->
    <div class="content-body">
      <!-- 1. 未选择文件：上传与样例选择 -->
      <div v-if="!file" class="upload-container">
        <!-- 网络文件链接预览输入区 -->
        <div class="url-preview-box">
          <el-input
              v-model="fileUrl"
              class="url-preview-input"
              clearable
              placeholder="请输入以 http:// 或 https:// 开头的文件链接"
              @keyup.enter="handleUrlPreview"
          >
            <template #prepend>
              <span class="url-input-prepend">文件网址</span>
            </template>
            <template #append>
              <el-button :loading="urlLoading" type="primary" @click="handleUrlPreview"> 打开预览</el-button>
            </template>
          </el-input>
          <div class="url-preview-tip">
            * 支持直接输入网络 URL 预览（注意：链接需允许跨域 CORS 访问，若受限请下载后直接上传预览）
          </div>
        </div>

        <el-upload
            :auto-upload="false"
            :on-change="handleFileChange"
            :show-file-list="false"
            action="#"
            class="viewer-uploader"
            drag
        >
          <el-icon class="el-icon--upload">
            <IconEpUploadFilled/>
          </el-icon>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <template #tip>
            <section aria-label="支持的常见文件格式" class="formats-list-container">
              <h4 class="formats-title">支持的常见格式</h4>
              <el-row :gutter="12" class="formats-row">
                <el-col
                    v-for="group in formatGroups"
                    :key="group.label"
                    :md="group.class === 'format-code' ? 16 : 8"
                    :sm="12"
                    :xs="24"
                >
                  <div :class="group.class" class="format-group">
                    <span class="group-label">{{ group.label }}</span>
                    <div class="format-tags">
                      <el-tag v-for="format in group.formats" :key="format" effect="light" size="small">
                        {{ format }}
                      </el-tag>
                    </div>
                  </div>
                </el-col>
              </el-row>
            </section>
          </template>
        </el-upload>

        <!-- 样例快速体验区 -->
        <div class="samples-section">
          <h4 class="samples-title">✨ 零文件体验？试一试我们为您准备的本地示例：</h4>
          <el-row :gutter="16" class="samples-row">
            <el-col v-for="sample in sampleFiles" :key="sample.id" :lg="6" :md="12" :sm="12" :xs="24">
              <el-card :class="sample.class" class="sample-card" shadow="hover" @click="handleSampleSelect(sample)">
                <div class="sample-icon-wrapper">
                  <span class="sample-format">{{ sample.format }}</span>
                </div>
                <div class="sample-info">
                  <span class="sample-name">{{ sample.name }}</span>
                  <span class="sample-desc">{{ sample.desc }}</span>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 2. 已选择文件：文件渲染区域 -->
      <div v-else :style="{ height: viewerHeight }" class="preview-wrapper">
        <OpenFileViewer
            :file="file"
            :file-name="file.name"
            :fit="fit"
            :plugins="plugins"
            :theme="theme"
            :toolbar="computedToolbar"
            height="100%"
            locale="zh-CN"
            width="100%"
            @error="handleLoadError"
            @load="handleLoadSuccess"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import {OpenFileViewer} from '@open-file-viewer/vue'
import {
  archivePlugin,
  audioPlugin,
  emailPlugin,
  epubPlugin,
  fallbackPlugin,
  gisPlugin,
  imagePlugin,
  model3dPlugin,
  ofdPlugin,
  officePlugin,
  pdfPlugin,
  textPlugin,
  videoPlugin,
  xpsPlugin
} from '@open-file-viewer/core'
import '@open-file-viewer/core/style.css'
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url'
import {sampleFiles} from './sample-files'

const formatGroups = [
  {label: '图像', class: 'format-image', formats: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp']},
  {label: '文档', class: 'format-document', formats: ['pdf', 'docx', 'xlsx', 'pptx', 'epub']},
  {label: '音视频', class: 'format-media', formats: ['mp4', 'webm', 'mp3', 'wav', 'ogg']},
  {label: '文本与代码', class: 'format-code', formats: ['txt', 'md', 'html', 'css', 'js', 'ts', 'json', 'xml']},
  {label: '压缩包', class: 'format-archive', formats: ['zip']}
]

// 配置参数响应式变量
const file = ref(null)
const router = useRouter()
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
  pdfPlugin({workerSrc: pdfWorkerSrc}),
  officePlugin(),
  archivePlugin(),
  emailPlugin(),
  model3dPlugin(),
  gisPlugin(),
  epubPlugin(),
  ofdPlugin(),
  xpsPlugin(),
  fallbackPlugin()
]

// 监听文件改变
const handleFileChange = async uploadFile => {
  if (uploadFile && uploadFile.raw) {
    await openPreview(uploadFile.raw)
  }
}

const resetPreview = () => {
  file.value = null
  fileUrl.value = ''
}

// 为预览建立独立历史记录，浏览器后退先回到文件选择区。
const openPreview = async selectedFile => {
  if (!file.value) {
    const failure = await router.push({
      path: router.currentRoute.value.path,
      query: router.currentRoute.value.query,
      hash: router.currentRoute.value.hash,
      force: true,
      state: {fileViewerPreview: true}
    })
    if (failure) return
  }
  file.value = selectedFile
}

useEventListener(window, 'popstate', resetPreview)

// 与浏览器后退共用清理逻辑，同时移回文件选择区的历史记录。
const handleClearFile = () => {
  resetPreview()
  if (window.history.state?.fileViewerPreview) router.back()
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

    // 从响应头或 URL 中解析文件名
    let fileName = ''

    // 1. 优先尝试从响应头的 Content-Disposition 中解析
    const disposition = res.headers.get('Content-Disposition') || res.headers.get('content-disposition')
    if (disposition) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      const matches = filenameRegex.exec(disposition)
      if (matches != null && matches[1]) {
        fileName = matches[1].replace(/['"]/g, '')
      }

      const filenameStarRegex = /filename\*=utf-8''([^;\n]*)/i
      const starMatches = filenameStarRegex.exec(disposition)
      if (starMatches != null && starMatches[1]) {
        try {
          fileName = decodeURIComponent(starMatches[1])
        } catch {
          // 解码失败时保持原有解析
        }
      }
    }

    // 2. 如果请求头没有或未暴露，则退回到从 URL 中解析
    if (!fileName) {
      try {
        const urlObj = new URL(fileUrl.value)
        const pathname = urlObj.pathname
        fileName = pathname.substring(pathname.lastIndexOf('/') + 1)
      } catch {
        // 忽略 URL 解析异常
      }
    }

    if (!fileName) {
      fileName = 'network_file'
    }

    await openPreview(new File([blob], fileName, {type: blob.type}))
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

const handleSampleSelect = async sample => {
  await openPreview(sample.action())
}
</script>

<style scoped>
:global(.app-main) {
  overflow: hidden;
}

.file-viewer-page {
  height: 100%;
  min-height: 0;
  padding: 16px 20px 40px;
  box-sizing: border-box;
  background-color: var(--el-bg-color);
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
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
  flex-shrink: 0;
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

.upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.viewer-uploader {
  width: 100%;
  max-width: 1080px;
}

.formats-list-container {
  margin-top: 14px;
  padding: 12px;
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--el-border-color-extra-light);
  border-radius: 12px;
  background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--el-color-primary) 5%, var(--el-bg-color)),
      var(--el-bg-color) 65%
  );
  text-align: left;
}

.formats-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-weight: 600;
}

.formats-title::before {
  content: '';
  width: 4px;
  height: 14px;
  border-radius: 2px;
  background: var(--el-color-primary);
}

.formats-row {
  row-gap: 10px;
}

.format-group {
  --format-color: var(--el-color-primary);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  gap: 6px;
  height: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid color-mix(in srgb, var(--format-color) 16%, var(--el-border-color-extra-light));
  border-radius: 8px;
  background: color-mix(in srgb, var(--format-color) 4%, var(--el-bg-color));
}

.group-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
}

.group-label::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--format-color);
}

.format-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.format-tags :deep(.el-tag) {
  --el-tag-bg-color: color-mix(in srgb, var(--format-color) 10%, var(--el-bg-color));
  --el-tag-border-color: color-mix(in srgb, var(--format-color) 20%, var(--el-bg-color));
  --el-tag-text-color: var(--format-color);
  font-family: var(--el-font-family);
  border-radius: 5px;
}

.format-document {
  --format-color: var(--el-color-success);
}

.format-media {
  --format-color: var(--el-color-warning);
}

.format-code {
  --format-color: var(--el-color-danger);
}

.format-archive {
  --format-color: #a078e8;
}

.samples-section {
  width: 100%;
  max-width: 1200px;
  margin-top: 10px;
}

.samples-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  text-align: center;
}

.samples-row {
  row-gap: 16px;
}

.samples-row :deep(.el-col) {
  min-width: 0;
}

.sample-card {
  --sample-color: var(--el-color-primary);
  border-left: 3px solid var(--sample-color);
  height: 100%;
  min-width: 0;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease,
  border-color 0.2s ease;
}

.sample-card:hover {
  transform: translateY(-2px);
}

.sample-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  padding: 14px 16px;
  min-width: 0;
}

.sample-icon-wrapper {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  border-radius: 8px;
  background: color-mix(in srgb, var(--sample-color) 12%, var(--el-bg-color));
  color: var(--sample-color);
}

.sample-format {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.sample-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sample-name {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}

.sample-desc,
.url-preview-tip {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.sample-desc {
  line-height: 1.4;
}

.sample-svg {
  --sample-color: var(--el-color-primary);
}

.sample-code {
  --sample-color: var(--el-color-success);
}

.sample-md {
  --sample-color: var(--el-color-warning);
}

.sample-json {
  --sample-color: var(--el-color-danger);
}

.preview-wrapper {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  min-height: 400px;
}

.url-preview-box {
  width: 100%;
  max-width: 1080px;
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
