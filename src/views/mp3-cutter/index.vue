<script setup>
import { loadLame } from './utils/load-lame'

const MAX_FILE_SIZE = 100 * 1024 * 1024
const DEFAULT_BITRATE = 192
const MIN_CLIP_DURATION = 0.1
const SLIDER_STEP = 0.05

const audioRef = ref(null)
const waveCanvasRef = ref(null)
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
const isDraggingPlayhead = ref(false)
const activeRangeHandle = ref('')
const waveformReady = ref(false)
let audioContext = null
let decodedAudioBuffer = null

const hasAudio = computed(() => !!fileInfo.url)
const clipDuration = computed(() => Math.max(0, range.value[1] - range.value[0]))
const canExport = computed(() => hasAudio.value && clipDuration.value > 0 && !isExporting.value)
const selectionStyle = computed(() => {
  if (!fileInfo.duration) return { left: '0%', width: '0%' }
  const left = (range.value[0] / fileInfo.duration) * 100
  const width = (clipDuration.value / fileInfo.duration) * 100
  return {
    left: `${left}%`,
    width: `${width}%`
  }
})
const playheadStyle = computed(() => {
  if (!fileInfo.duration) return { left: '0%' }
  const left = Math.min(100, Math.max(0, (currentTime.value / fileInfo.duration) * 100))
  return { left: `${left}%` }
})
const startHandleStyle = computed(() => ({ left: getTimePercent(range.value[0]) }))
const endHandleStyle = computed(() => ({ left: getTimePercent(range.value[1]) }))

const bitrateOptions = [
  { label: '128 kbps', value: 128 },
  { label: '192 kbps', value: 192 },
  { label: '320 kbps', value: 320 }
]

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

  clearAudio()
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
}

const handleTimeUpdate = () => {
  if (isDraggingPlayhead.value) return
  currentTime.value = audioRef.value?.currentTime || 0
  if (!isPreviewing.value || !audioRef.value) return

  if (audioRef.value.currentTime >= range.value[1]) {
    stopPreview()
  }
}

const seekToWavePosition = event => {
  if (!fileInfo.duration || !waveShellRef.value || !audioRef.value) return

  const nextTime = getTimeFromPointer(event)

  currentTime.value = nextTime
  audioRef.value.currentTime = nextTime
}

const startPlayheadDrag = event => {
  if (!hasAudio.value) return

  isDraggingPlayhead.value = true
  seekToWavePosition(event)
  window.addEventListener('mousemove', handlePlayheadDrag)
  window.addEventListener('mouseup', stopPlayheadDrag)
  window.addEventListener('touchmove', handlePlayheadDrag, { passive: false })
  window.addEventListener('touchend', stopPlayheadDrag)
}

const handlePlayheadDrag = event => {
  if (!isDraggingPlayhead.value) return
  event.preventDefault?.()
  seekToWavePosition(event)
}

const stopPlayheadDrag = () => {
  isDraggingPlayhead.value = false
  window.removeEventListener('mousemove', handlePlayheadDrag)
  window.removeEventListener('mouseup', stopPlayheadDrag)
  window.removeEventListener('touchmove', handlePlayheadDrag)
  window.removeEventListener('touchend', stopPlayheadDrag)
}

const startRangeDrag = (handle, event) => {
  if (!hasAudio.value || isExporting.value) return

  stopPreview()
  activeRangeHandle.value = handle
  updateRangeFromPointer(event)
  window.addEventListener('mousemove', handleRangeDrag)
  window.addEventListener('mouseup', stopRangeDrag)
  window.addEventListener('touchmove', handleRangeDrag, { passive: false })
  window.addEventListener('touchend', stopRangeDrag)
}

const handleRangeDrag = event => {
  if (!activeRangeHandle.value) return
  event.preventDefault?.()
  updateRangeFromPointer(event)
}

const stopRangeDrag = () => {
  activeRangeHandle.value = ''
  window.removeEventListener('mousemove', handleRangeDrag)
  window.removeEventListener('mouseup', stopRangeDrag)
  window.removeEventListener('touchmove', handleRangeDrag)
  window.removeEventListener('touchend', stopRangeDrag)
}

const previewClip = async () => {
  if (!audioRef.value || clipDuration.value <= 0) return

  audioRef.value.currentTime = range.value[0]
  isPreviewing.value = true
  try {
    await audioRef.value.play()
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

const updateRangeFromPointer = event => {
  const nextTime = snapTime(getTimeFromPointer(event))
  const [start, end] = range.value

  if (activeRangeHandle.value === 'start') {
    range.value = [Math.max(0, Math.min(nextTime, end - MIN_CLIP_DURATION)), end]
    return
  }

  if (activeRangeHandle.value === 'end') {
    range.value = [start, Math.min(fileInfo.duration, Math.max(nextTime, start + MIN_CLIP_DURATION))]
  }
}

const getTimeFromPointer = event => {
  if (!fileInfo.duration || !waveShellRef.value) return 0

  const clientX = event.touches?.[0]?.clientX ?? event.clientX
  const rect = waveShellRef.value.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
  return ratio * fileInfo.duration
}

const getTimePercent = time => {
  if (!fileInfo.duration) return '0%'
  const percent = Math.min(100, Math.max(0, (time / fileInfo.duration) * 100))
  return `${percent}%`
}

const snapTime = time => Math.min(fileInfo.duration, Math.max(0, Math.round(time / SLIDER_STEP) * SLIDER_STEP))

const prepareWaveform = async () => {
  waveformReady.value = false
  if (!fileInfo.arrayBuffer) return

  try {
    audioContext ||= new AudioContext()
    decodedAudioBuffer = await audioContext.decodeAudioData(fileInfo.arrayBuffer.slice(0))
    waveformReady.value = true
    nextTick(drawWaveform)
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

const clearAudio = () => {
  stopRangeDrag()
  stopPreview()
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
}

const drawWaveform = () => {
  const canvas = waveCanvasRef.value
  if (!canvas || !decodedAudioBuffer) return

  const width = canvas.clientWidth
  const height = canvas.clientHeight
  const ratio = window.devicePixelRatio || 1
  canvas.width = width * ratio
  canvas.height = height * ratio

  const ctx = canvas.getContext('2d')
  ctx.scale(ratio, ratio)
  ctx.clearRect(0, 0, width, height)

  const samples = decodedAudioBuffer.getChannelData(0)
  const step = Math.ceil(samples.length / width)
  const center = height / 2

  ctx.fillStyle = '#68f39b'
  for (let x = 0; x < width; x++) {
    let min = 1
    let max = -1
    const start = x * step
    const end = Math.min(start + step, samples.length)
    for (let i = start; i < end; i++) {
      const sample = samples[i]
      if (sample < min) min = sample
      if (sample > max) max = sample
    }
    const top = center + min * center * 0.86
    const bottom = center + max * center * 0.86
    ctx.fillRect(x, top, 1, Math.max(1, bottom - top))
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

onUnmounted(() => {
  stopRangeDrag()
  stopPlayheadDrag()
  clearAudio()
  audioContext?.close()
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
          <span v-if="hasAudio" class="file-meta"
            >{{ formatSize(fileInfo.size) }} / {{ formatTime(fileInfo.duration) }}</span
          >
        </div>
        <el-select v-model="bitrate" :disabled="!hasAudio || isExporting" class="bitrate-select" size="small">
          <el-option v-for="item in bitrateOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>

      <el-upload
        v-if="!hasAudio"
        :auto-upload="false"
        :show-file-list="false"
        accept=".mp3,audio/mpeg"
        action="#"
        drag
        @change="handleFileChange"
      >
        <el-icon class="el-icon--upload">
          <IconEpUploadFilled />
        </el-icon>
        <div class="el-upload__text">拖拽 MP3 文件到此处，或 <em>点击上传</em></div>
        <template #tip>
          <div class="upload-tip">建议 100MB 以内；导出时会重新编码 MP3。</div>
        </template>
      </el-upload>

      <div v-else class="studio-editor">
        <audio
          ref="audioRef"
          :src="fileInfo.url"
          class="audio-player"
          controls
          @loadedmetadata="handleLoadedMetadata"
          @pause="isPreviewing = false"
          @timeupdate="handleTimeUpdate"
        ></audio>

        <div
          ref="waveShellRef"
          class="wave-shell"
          @mousedown="startPlayheadDrag"
          @touchstart.prevent="startPlayheadDrag"
        >
          <canvas ref="waveCanvasRef" class="wave-canvas"></canvas>
          <div :style="selectionStyle" class="wave-selection"></div>
          <button
            :class="{ 'is-active': activeRangeHandle === 'start' }"
            :data-time="formatTime(range[0])"
            :style="startHandleStyle"
            aria-label="拖动设置截取开始时间"
            class="wave-range-handle wave-range-handle--start"
            type="button"
            @mousedown.stop.prevent="startRangeDrag('start', $event)"
            @touchstart.stop.prevent="startRangeDrag('start', $event)"
          ></button>
          <button
            :class="{ 'is-active': activeRangeHandle === 'end' }"
            :data-time="formatTime(range[1])"
            :style="endHandleStyle"
            aria-label="拖动设置截取结束时间"
            class="wave-range-handle wave-range-handle--end"
            type="button"
            @mousedown.stop.prevent="startRangeDrag('end', $event)"
            @touchstart.stop.prevent="startRangeDrag('end', $event)"
          ></button>
          <div :data-time="formatTime(currentTime)" :style="playheadStyle" class="wave-playhead"></div>
          <div class="selection-label">{{ formatTime(clipDuration) }}</div>
          <el-empty v-if="!waveformReady" class="wave-empty" description="正在生成波形..." />
        </div>

        <div class="timeline-row">
          <span>{{ formatTime(0) }}</span>
          <span>{{ formatTime(fileInfo.duration) }}</span>
        </div>

        <div class="studio-footer">
          <div class="time-controls">
            <el-input-number
              v-model="range[0]"
              :disabled="isExporting"
              :max="range[1]"
              :min="0"
              :precision="2"
              :step="0.1"
              controls-position="right"
              size="small"
              @change="normalizeRange"
            />
            <span class="time-divider">至</span>
            <el-input-number
              v-model="range[1]"
              :disabled="isExporting"
              :max="fileInfo.duration"
              :min="range[0]"
              :precision="2"
              :step="0.1"
              controls-position="right"
              size="small"
              @change="normalizeRange"
            />
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
          <div class="range-summary">
            <el-tag type="primary">开始 {{ formatTime(range[0]) }}</el-tag>
            <el-tag type="success">结束 {{ formatTime(range[1]) }}</el-tag>
            <el-tag type="warning">片段 {{ formatTime(clipDuration) }}</el-tag>
            <el-tag type="info">码率 {{ bitrate }} kbps</el-tag>
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
  cursor: pointer;
  user-select: none;
}

.wave-canvas {
  display: block;
  width: 100%;
  height: 180px;
}

.wave-selection {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 1;
  background: rgba(135, 229, 209, 0.12);
  border-left: 2px solid #87e5d1;
  border-right: 2px solid #87e5d1;
  pointer-events: none;
}

.wave-range-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 4;
  width: 18px;
  padding: 0;
  border: 0;
  outline: none;
  transform: translateX(-50%);
  background: transparent;
  cursor: ew-resize;
}

.wave-range-handle::after {
  content: '';
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: 50%;
  width: 4px;
  border-radius: 999px;
  transform: translateX(-50%);
  background: #0fbf93;
  box-shadow: 0 0 0 4px rgba(15, 191, 147, 0.14);
}

.wave-range-handle::before {
  content: attr(data-time);
  position: absolute;
  top: 10px;
  left: 50%;
  display: none;
  padding: 3px 8px;
  border-radius: 999px;
  transform: translateX(-50%);
  background: #0f8f70;
  color: #fff;
  font-size: 11px;
  white-space: nowrap;
}

.wave-range-handle:hover::before,
.wave-range-handle.is-active::before {
  display: block;
}

.wave-range-handle:hover::after,
.wave-range-handle.is-active::after {
  background: #0f8f70;
}

.wave-playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 3;
  width: 2px;
  background: var(--el-color-danger);
  box-shadow: 0 0 0 1px rgba(245, 108, 108, 0.16);
  cursor: ew-resize;
  pointer-events: none;
}

.wave-playhead::after {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transform: translateX(-50%);
  background: var(--el-color-danger);
}

.wave-playhead::before {
  content: attr(data-time);
  position: absolute;
  top: -26px;
  left: 50%;
  display: none;
  padding: 2px 8px;
  border-radius: 999px;
  transform: translateX(-50%);
  background: var(--el-text-color-primary);
  color: var(--el-bg-color);
  font-size: 11px;
  white-space: nowrap;
}

.wave-shell:hover .wave-playhead::before {
  display: block;
}

.selection-label {
  position: absolute;
  left: 50%;
  bottom: 12px;
  color: var(--el-text-color-secondary);
  font-family: Georgia, serif;
  font-size: 14px;
  transform: translateX(-50%);
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
  min-height: 96px;
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
