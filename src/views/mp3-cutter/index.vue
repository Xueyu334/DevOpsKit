<script setup>
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js'
import { loadLame } from './utils/load-lame'

const MAX_FILE_SIZE = 100 * 1024 * 1024
const DEFAULT_BITRATE = 192
const MIN_CLIP_DURATION = 0.01
const SLIDER_STEP = 0.001

const audioRef = ref(null)
const waveformContainer = ref(null)
const waveShellRef = ref(null)
const fileInfo = reactive({
  name: '',
  size: 0,
  duration: 0,
  url: '',
  arrayBuffer: null
})
const range = ref([0, 0])
const bitrate = ref(DEFAULT_BITRATE)
const isPreviewing = ref(false)
const isExporting = ref(false)
const exportProgress = ref(0)
const currentTime = ref(0)
const waveformReady = ref(false)

let audioContext = null
let decodedAudioBuffer = null
let wavesurfer = null
let wsRegions = null

const hasAudio = computed(() => !!fileInfo.url)
const clipDuration = computed(() => Math.max(0, range.value[1] - range.value[0]))
const canExport = computed(() => hasAudio.value && clipDuration.value > 0 && !isExporting.value)

const bitrateOptions = [
  { label: '128 kbps', value: 128 },
  { label: '192 kbps', value: 192 },
  { label: '320 kbps', value: 320 }
]

const snapTime = time => Math.min(fileInfo.duration, Math.max(0, Math.round(time / SLIDER_STEP) * SLIDER_STEP))

const initWaveSurfer = () => {
  if (wavesurfer) {
    wavesurfer.destroy()
    wavesurfer = null
    wsRegions = null
  }

  wavesurfer = WaveSurfer.create({
    container: waveformContainer.value,
    waveColor: '#a1eafb',
    progressColor: '#0fbf93',
    cursorColor: '#f56c6c',
    cursorWidth: 2,
    height: 180,
    media: audioRef.value,
    url: fileInfo.url,
    autoScroll: true
  })

  wsRegions = wavesurfer.registerPlugin(RegionsPlugin.create())

  wavesurfer.on('ready', () => {
    waveformReady.value = true

    // Add region representing selection
    wsRegions.clearRegions()
    wsRegions.addRegion({
      id: 'clip-region',
      start: range.value[0],
      end: range.value[1],
      color: 'rgba(135, 229, 209, 0.18)',
      drag: true,
      resize: true
    })
  })

  // Synchronize region changes back to Vue state
  wsRegions.on('region-updated', region => {
    if (region.id === 'clip-region') {
      const nextStart = snapTime(region.start)
      const nextEnd = snapTime(region.end)

      const isSame = Math.abs(range.value[0] - nextStart) < 0.001 && Math.abs(range.value[1] - nextEnd) < 0.001
      if (!isSame) {
        range.value = [nextStart, nextEnd]
      }
    }
  })
}

// Watch range changes from input fields and update wavesurfer region
watch(
  () => range.value,
  newRange => {
    if (!wsRegions) return
    const region = wsRegions.getRegions().find(r => r.id === 'clip-region')
    if (region) {
      const isSame = Math.abs(region.start - newRange[0]) < 0.001 && Math.abs(region.end - newRange[1]) < 0.001
      if (!isSame) {
        region.setOptions({
          start: newRange[0],
          end: newRange[1]
        })
      }
    }
  },
  { deep: true }
)

const handleFileChange = async uploadFile => {
  const file = uploadFile.raw
  if (!file) return

  if (!file.type.includes('mpeg') && !file.name.toLowerCase().endsWith('.mp3')) {
    ElMessage.error('请选择 MP3 音频文件')
    return
  }

  if (file.size > MAX_FILE_SIZE) {
    ElMessage.error('文件过大，请选择 100MB 以内的 MP3')
    return
  }

  await clearAudio()
  fileInfo.name = file.name
  fileInfo.size = file.size
  fileInfo.arrayBuffer = await file.arrayBuffer()
  fileInfo.url = URL.createObjectURL(file)
  prepareWaveform()
}

const handleLoadedMetadata = () => {
  const duration = audioRef.value?.duration || 0
  fileInfo.duration = Number.isFinite(duration) ? duration : 0
  range.value = [0, Math.min(fileInfo.duration, 30)]

  nextTick(() => {
    initWaveSurfer()
  })
}

let monitorId = null

const startProgressMonitor = () => {
  if (monitorId) cancelAnimationFrame(monitorId)

  const check = () => {
    if (!audioRef.value || !isPreviewing.value) {
      monitorId = null
      return
    }

    const curr = audioRef.value.currentTime
    if (curr >= range.value[1]) {
      stopPreview()
      // 试听结束自动复位到片段起点，不仅彻底解决终点视觉探头问题，还方便快速重新试听
      const safeTime = range.value[0]
      audioRef.value.currentTime = safeTime
      currentTime.value = safeTime
      if (wavesurfer) wavesurfer.setTime(safeTime)
    } else {
      currentTime.value = curr
      monitorId = requestAnimationFrame(check)
    }
  }
  monitorId = requestAnimationFrame(check)
}

const stopProgressMonitor = () => {
  if (monitorId) {
    cancelAnimationFrame(monitorId)
    monitorId = null
  }
}

const handleTimeUpdate = () => {
  currentTime.value = audioRef.value?.currentTime || 0
  if (!isPreviewing.value || !audioRef.value) return

  if (audioRef.value.currentTime >= range.value[1]) {
    stopPreview()
    const safeTime = range.value[0]
    audioRef.value.currentTime = safeTime
    currentTime.value = safeTime
    if (wavesurfer) wavesurfer.setTime(safeTime)
  }
}

const previewClip = async () => {
  if (!audioRef.value || clipDuration.value <= 0) return

  audioRef.value.currentTime = range.value[0]
  isPreviewing.value = true
  try {
    await audioRef.value.play()
    startProgressMonitor()
  } catch {
    isPreviewing.value = false
    ElMessage.error('试听播放失败')
  }
}

const stopPreview = () => {
  if (audioRef.value) {
    audioRef.value.pause()
  }
  isPreviewing.value = false
  stopProgressMonitor()
}

const handleRangeInput = value => {
  if (isPreviewing.value) stopPreview()
  const [start, end] = value
  let nextStart = Math.min(fileInfo.duration, Math.max(0, start))
  let nextEnd = Math.min(fileInfo.duration, Math.max(0, end))

  if (nextEnd - nextStart < MIN_CLIP_DURATION) {
    if (nextStart + MIN_CLIP_DURATION <= fileInfo.duration) {
      nextEnd = nextStart + MIN_CLIP_DURATION
    } else {
      nextStart = Math.max(0, nextEnd - MIN_CLIP_DURATION)
    }
  }

  range.value = [nextStart, nextEnd]
}

const normalizeRange = () => {
  handleRangeInput(range.value)
}

const prepareWaveform = async () => {
  if (!fileInfo.arrayBuffer) return

  try {
    audioContext ||= new AudioContext()
    decodedAudioBuffer = await audioContext.decodeAudioData(fileInfo.arrayBuffer.slice(0))
  } catch (error) {
    console.warn('波形解析失败:', error)
  }
}

const exportMp3 = async () => {
  if (!canExport.value) return

  isExporting.value = true
  exportProgress.value = 5

  try {
    audioContext ||= new AudioContext()
    const audioBuffer = decodedAudioBuffer || (await audioContext.decodeAudioData(fileInfo.arrayBuffer.slice(0)))
    exportProgress.value = 35

    const clipped = clipAudioBuffer(audioBuffer, range.value[0], range.value[1])
    const mp3Blob = await encodeMp3(clipped, bitrate.value)
    exportProgress.value = 95

    downloadBlob(
      mp3Blob,
      `${sanitizeFileName(fileInfo.name)}-${formatTimeForName(range.value[0])}-${formatTimeForName(range.value[1])}.mp3`
    )
    exportProgress.value = 100
    ElMessage.success('MP3 导出完成')
  } catch (error) {
    console.error(error)
    ElMessage.error('MP3 导出失败，请尝试缩短截取时长或更换文件')
  } finally {
    setTimeout(() => {
      isExporting.value = false
      exportProgress.value = 0
    }, 300)
  }
}

const clipAudioBuffer = (audioBuffer, startTime, endTime) => {
  const sampleRate = audioBuffer.sampleRate
  const startFrame = Math.floor(startTime * sampleRate)
  const endFrame = Math.min(audioBuffer.length, Math.ceil(endTime * sampleRate))
  const frameCount = Math.max(1, endFrame - startFrame)
  const channelCount = Math.min(audioBuffer.numberOfChannels, 2)
  const clipped = {
    sampleRate,
    numberOfChannels: channelCount,
    length: frameCount,
    channels: []
  }

  for (let channel = 0; channel < channelCount; channel++) {
    clipped.channels.push(audioBuffer.getChannelData(channel).slice(startFrame, endFrame))
  }

  return clipped
}

const encodeMp3 = async (audioBuffer, outputBitrate) => {
  const { Mp3Encoder } = loadLame()
  const encoder = new Mp3Encoder(audioBuffer.numberOfChannels, audioBuffer.sampleRate, outputBitrate)
  const blockSize = 1152
  const chunks = []

  for (let offset = 0; offset < audioBuffer.length; offset += blockSize) {
    const left = floatToInt16(audioBuffer.channels[0].subarray(offset, offset + blockSize))
    let mp3Buffer

    if (audioBuffer.numberOfChannels > 1) {
      const right = floatToInt16(audioBuffer.channels[1].subarray(offset, offset + blockSize))
      mp3Buffer = encoder.encodeBuffer(left, right)
    } else {
      mp3Buffer = encoder.encodeBuffer(left)
    }

    if (mp3Buffer.length > 0) chunks.push(mp3Buffer)
    exportProgress.value = Math.min(90, 35 + Math.floor((offset / audioBuffer.length) * 55))
    await nextTick()
  }

  const flushed = encoder.flush()
  if (flushed.length > 0) chunks.push(flushed)
  return new Blob(chunks, { type: 'audio/mpeg' })
}

const floatToInt16 = samples => {
  const output = new Int16Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]))
    output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
  }
  return output
}

const clearAudio = async () => {
  stopPreview()
  if (wavesurfer) {
    wavesurfer.destroy()
    wavesurfer = null
    wsRegions = null
  }
  if (fileInfo.url) URL.revokeObjectURL(fileInfo.url)
  fileInfo.name = ''
  fileInfo.size = 0
  fileInfo.duration = 0
  fileInfo.url = ''
  fileInfo.arrayBuffer = null
  range.value = [0, 0]
  currentTime.value = 0
  exportProgress.value = 0
  waveformReady.value = false
  decodedAudioBuffer = null

  if (audioContext) {
    try {
      await audioContext.close()
    } catch (error) {
      console.warn('释放 AudioContext 失败:', error)
    }
    audioContext = null
  }
}

const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const formatTime = seconds => {
  if (!Number.isFinite(seconds)) return '00:00.000'
  const minutes = Math.floor(seconds / 60)
  const remainSeconds = Math.floor(seconds % 60)
  const milliseconds = Math.floor((seconds % 1) * 1000)
  return `${String(minutes).padStart(2, '0')}:${String(remainSeconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`
}

const formatTimeForName = seconds => formatTime(seconds).replace(/[:.]/g, '-')

const formatSize = bytes => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`
}

const sanitizeFileName = value =>
  String(value || 'clip')
    .replace(/\.mp3$/i, '')
    .replace(/[\\/:*?"<>|]/g, '_')

const handleKeyDown = e => {
  if (!hasAudio.value) return

  // 避免在输入框输入时触发快捷键
  const activeEl = document.activeElement
  if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
    return
  }

  const key = e.key

  // 1. 空格键播放/暂停
  if (key === ' ') {
    e.preventDefault()
    if (isPreviewing.value) {
      stopPreview()
    } else {
      previewClip()
    }
    return
  }

  // 2. 左右方向键快进/快退进度 (无修饰键快退/快进 1s，配合 Shift 快退/快进 0.1s)
  if (key === 'ArrowLeft' || key === 'ArrowRight') {
    if (audioRef.value) {
      e.preventDefault()
      const isRight = key === 'ArrowRight'
      const step = e.shiftKey ? 0.1 : 1.0
      let targetTime = audioRef.value.currentTime + (isRight ? step : -step)
      targetTime = Math.max(0, Math.min(fileInfo.duration, targetTime))
      audioRef.value.currentTime = targetTime
      currentTime.value = targetTime
    }
    return
  }

  // 3. A / D 微调开始时间 (默认微调 0.01s，配合 Shift 微调 0.1s)
  if (key === 'a' || key === 'A' || key === 'd' || key === 'D') {
    e.preventDefault()
    const step = e.shiftKey ? 0.1 : 0.01
    const delta = key === 'd' || key === 'D' ? step : -step
    handleRangeInput([range.value[0] + delta, range.value[1]])
    return
  }

  // 4. Q / E 微调结束时间 (默认微调 0.01s，配合 Shift 微调 0.1s)
  if (key === 'q' || key === 'Q' || key === 'e' || key === 'E') {
    e.preventDefault()
    const step = e.shiftKey ? 0.1 : 0.01
    const delta = key === 'e' || key === 'E' ? step : -step
    handleRangeInput([range.value[0], range.value[1] + delta])
    return
  }

  // 5. Mark In / Mark Out 设为开始/结束时间
  if (key === '[' || key === 'i' || key === 'I') {
    e.preventDefault()
    const current = audioRef.value ? audioRef.value.currentTime : 0
    handleRangeInput([current, range.value[1]])
    ElMessage({
      message: '已标记开始时间',
      type: 'success',
      duration: 1000,
      grouping: true
    })
    return
  }

  if (key === ']' || key === 'o' || key === 'O') {
    e.preventDefault()
    const current = audioRef.value ? audioRef.value.currentTime : 0
    handleRangeInput([range.value[0], current])
    ElMessage({
      message: '已标记结束时间',
      type: 'success',
      duration: 1000,
      grouping: true
    })
    return
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(async () => {
  window.removeEventListener('keydown', handleKeyDown)
  stopProgressMonitor()
  await clearAudio()
})
</script>

<template>
  <div class="mp3-cutter-container">
    <div class="page-header">
      <div class="page-heading">
        <h1 class="page-title">MP3 音频截取</h1>
        <el-tag effect="plain" type="info">本地处理，支持区间试听和导出 MP3</el-tag>
      </div>
      <el-button :disabled="!hasAudio || isExporting" plain type="info" @click="clearAudio">清空</el-button>
    </div>

    <el-card class="studio-card">
      <div class="studio-topbar">
        <div class="file-title">
          <span class="file-name">{{ hasAudio ? fileInfo.name : '等待上传 MP3 文件' }}</span>
          <span v-if="hasAudio" class="file-meta">{{ formatSize(fileInfo.size) }} / {{ formatTime(fileInfo.duration)
            }}</span>
        </div>
        <el-select v-model="bitrate" :disabled="!hasAudio || isExporting" class="bitrate-select" size="small">
          <el-option v-for="item in bitrateOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>

      <el-upload v-if="!hasAudio" :auto-upload="false" :show-file-list="false" accept=".mp3,audio/mpeg" action="#" drag
        @change="handleFileChange">
        <el-icon class="el-icon--upload">
          <IconEpUploadFilled />
        </el-icon>
        <div class="el-upload__text">拖拽 MP3 文件到此处，或 <em>点击上传</em></div>
        <template #tip>
          <div class="upload-tip">建议 100MB 以内；导出时会重新编码 MP3。</div>
        </template>
      </el-upload>

      <div v-else class="studio-editor">
        <audio ref="audioRef" :src="fileInfo.url" class="audio-player" controls @loadedmetadata="handleLoadedMetadata"
          @pause="isPreviewing = false" @timeupdate="handleTimeUpdate"></audio>

        <div ref="waveShellRef" class="wave-shell">
          <div ref="waveformContainer" class="wave-canvas"></div>
          <div class="selection-label">{{ formatTime(clipDuration) }}</div>
          <el-empty v-if="!waveformReady" class="wave-empty" description="正在生成波形..." />
        </div>

        <div class="timeline-row">
          <span>{{ formatTime(0) }}</span>
          <span>{{ formatTime(fileInfo.duration) }}</span>
        </div>

        <div class="studio-footer">
          <div class="time-controls">
            <el-input-number v-model="range[0]" :disabled="isExporting" :max="range[1]" :min="0" :precision="3"
              :step="0.01" controls-position="right" size="small" @change="normalizeRange" />
            <span class="time-divider">至</span>
            <el-input-number v-model="range[1]" :disabled="isExporting" :max="fileInfo.duration" :min="range[0]"
              :precision="3" :step="0.01" controls-position="right" size="small" @change="normalizeRange" />
          </div>

          <div class="action-row">
            <el-button :disabled="clipDuration <= 0 || isExporting" @click="previewClip">
              {{ isPreviewing ? '重新试听' : '试听片段' }}
            </el-button>
            <el-button :disabled="!isPreviewing" @click="stopPreview">停止</el-button>
            <el-button :disabled="!canExport" :loading="isExporting" type="primary" @click="exportMp3">
              导出 MP3
            </el-button>
          </div>
        </div>

        <el-progress v-if="isExporting" :percentage="exportProgress" :stroke-width="10" />
      </div>
    </el-card>

    <el-row v-if="hasAudio" :gutter="16" class="info-row">
      <el-col :lg="8" :xs="24">
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span>文件信息</span>
              <el-tag effect="light" type="success">本地处理</el-tag>
            </div>
          </template>
          <el-descriptions :column="1" border class="file-info" size="small">
            <el-descriptions-item label="文件名">{{ fileInfo.name }}</el-descriptions-item>
            <el-descriptions-item label="文件大小">{{ formatSize(fileInfo.size) }}</el-descriptions-item>
            <el-descriptions-item label="总时长">{{ formatTime(fileInfo.duration) }}</el-descriptions-item>
            <el-descriptions-item label="截取时长">{{ formatTime(clipDuration) }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :lg="16" :xs="24">
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span>快捷操作指南</span>
              <div class="range-summary">
                <el-tag type="primary" size="small">开始 {{ formatTime(range[0]) }}</el-tag>
                <el-tag type="success" size="small">结束 {{ formatTime(range[1]) }}</el-tag>
                <el-tag type="warning" size="small">片段 {{ formatTime(clipDuration) }}</el-tag>
                <el-tag type="info" size="small">码率 {{ bitrate }} kbps</el-tag>
              </div>
            </div>
          </template>
          <div class="shortcut-container">
            <el-row :gutter="12">
              <el-col :sm="12" :xs="24">
                <div class="shortcut-item"><kbd>Space</kbd> <span>播放 / 暂停试听</span></div>
                <div class="shortcut-item">
                  <kbd>←</kbd> / <kbd>→</kbd> <span>快进 / 快退 1s (加 Shift 微调 0.1s)</span>
                </div>
                <div class="shortcut-item"><kbd>[</kbd> 或 <kbd>I</kbd> <span>设当前位置为【开始时间】</span></div>
              </el-col>
              <el-col :sm="12" :xs="24">
                <div class="shortcut-item"><kbd>]</kbd> 或 <kbd>O</kbd> <span>设当前位置为【结束时间】</span></div>
                <div class="shortcut-item">
                  <kbd>A</kbd> / <kbd>D</kbd> <span>微调开始时间 (0.01s，按 Shift 为 0.1s)</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Q</kbd> / <kbd>E</kbd> <span>微调结束时间 (0.01s，按 Shift 为 0.1s)</span>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.mp3-cutter-container {
  max-width: 1440px;
  margin: 8px auto;
  padding: 0 20px 24px;
  box-sizing: border-box;
}

.page-header,
.page-heading,
.card-header,
.range-summary,
.action-row,
.studio-topbar,
.studio-footer,
.time-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-header,
.card-header {
  justify-content: space-between;
}

.page-header {
  margin-bottom: 10px;
}

.page-title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 22px;
  line-height: 1.2;
}

.studio-card {
  overflow: hidden;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.studio-card :deep(.el-card__body) {
  padding: 22px;
}

.studio-topbar {
  justify-content: space-between;
  margin-bottom: 18px;
}

.file-title {
  min-width: 0;
}

.file-name {
  display: block;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: block;
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.studio-editor {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.upload-tip {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.file-info {
  margin-top: 0;
}

.file-info :deep(.el-descriptions__label) {
  width: 82px;
}

.file-info :deep(.el-descriptions__content) {
  max-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bitrate-select {
  width: 130px;
}

.audio-player {
  width: 100%;
  opacity: 0.9;
}

.wave-shell {
  position: relative;
  min-height: 180px;
  overflow: hidden;
  border-radius: 10px;
  background: linear-gradient(180deg, var(--el-fill-color-light), var(--el-fill-color-blank));
  border: 1px solid var(--el-border-color-light);
  user-select: none;
}

.wave-canvas {
  display: block;
  width: 100%;
  height: 180px;
}

.wave-canvas ::part(region) {
  border-left: 2px solid #87e5d1;
  border-right: 2px solid #87e5d1;
}

.selection-label {
  position: absolute;
  left: 50%;
  bottom: 12px;
  color: var(--el-text-color-secondary);
  font-family: Georgia, serif;
  font-size: 14px;
  transform: translateX(-50%);
  z-index: 5;
}

.wave-empty {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.86);
}

.timeline-row {
  display: flex;
  justify-content: space-between;
  color: var(--el-text-color-secondary);
  font-family: Georgia, serif;
  font-size: 13px;
}

.range-summary {
  flex-wrap: wrap;
}

.studio-footer {
  flex-wrap: wrap;
  justify-content: space-between;
  margin-top: 4px;
}

.time-controls {
  flex-wrap: wrap;
}

.time-divider {
  color: var(--el-text-color-secondary);
}

.action-row {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.info-row {
  margin-top: 16px;
}

.info-card {
  min-height: 156px;
}

.shortcut-container {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.shortcut-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  line-height: 1.5;
}

.shortcut-item:last-child {
  margin-bottom: 0;
}

.shortcut-item kbd {
  background-color: var(--el-fill-color-dark);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  color: var(--el-text-color-primary);
  display: inline-block;
  font-family: var(--el-font-family-monospace);
  font-size: 11px;
  font-weight: bold;
  line-height: 1.2;
  padding: 3px 6px;
  margin-right: 8px;
  white-space: nowrap;
}

@media (max-width: 992px) {

  .page-header,
  .page-heading,
  .card-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .studio-card :deep(.el-card__body) {
    padding: 14px;
  }

  .wave-shell,
  .wave-canvas {
    min-height: 130px;
    height: 130px;
  }

  .studio-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .action-row {
    justify-content: flex-start;
  }
}
</style>
