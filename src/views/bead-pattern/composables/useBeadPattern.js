import { generatePattern, materialsCsv } from '../utils/pattern.js'
import { exportPatternPng } from '../utils/render.js'
import { downloadBlob } from '@/utils/ico/download.js'

export function useBeadPattern() {
  const source = shallowRef(null)
  const pattern = shallowRef(null)
  const options = reactive({ maxEdge: 48, paletteSize: 24, sampling: 'average', crop: 'full', skipTransparent: true })
  const loading = ref(false)
  const generating = ref(false)
  const exporting = ref(false)
  const error = ref('')
  const generatedOptions = ref('')
  const signature = computed(() => JSON.stringify(options))
  const stale = computed(() => !!pattern.value && generatedOptions.value !== signature.value)
  let revision = 0
  let disposed = false
  let updateTimer = null

  function clear() {
    revision++
    clearTimeout(updateTimer)
    updateTimer = null
    if (source.value) URL.revokeObjectURL(source.value.url)
    source.value = null
    pattern.value = null
    error.value = ''
    loading.value = generating.value = false
  }

  async function generate() {
    if (!source.value || loading.value || disposed) return
    const current = ++revision
    const settings = { ...options }
    const image = source.value.image
    generating.value = true
    error.value = ''
    try {
      const result = await generatePattern(image, settings, () => disposed || current !== revision)
      if (!result || current !== revision || disposed) return
      pattern.value = result
      generatedOptions.value = JSON.stringify(settings)
    } catch (cause) {
      if (current === revision && !disposed) error.value = cause.message || '生成失败，请更换图片后重试'
    } finally {
      if (current === revision && !disposed) generating.value = false
    }
  }

  watch(
    signature,
    () => {
      clearTimeout(updateTimer)
      updateTimer = null
      if (!source.value || loading.value || disposed) return
      // 参数变化立即使旧任务失效；等待连续输入结束后再计算最新图纸。
      revision++
      generating.value = true
      error.value = ''
      updateTimer = setTimeout(() => {
        updateTimer = null
        void generate()
      }, 300)
    },
    { flush: 'sync' }
  )

  async function loadFile(uploadFile) {
    const file = uploadFile.raw
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      ElMessage.error('请选择 PNG、JPG 或 WebP 图片')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      ElMessage.error('图片不能超过 20MB')
      return
    }
    clear()
    const current = revision
    loading.value = true
    const url = URL.createObjectURL(file)
    const image = new Image()
    try {
      await new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = () => reject(new Error('无法读取图片，请确认文件未损坏'))
        image.src = url
      })
      if (current !== revision || disposed) {
        URL.revokeObjectURL(url)
        return
      }
      if (image.naturalWidth * image.naturalHeight > 40_000_000) throw new Error('图片超过 4000 万像素，请缩小后重试')
      source.value = { image, url, name: file.name, width: image.naturalWidth, height: image.naturalHeight }
      loading.value = false
      await generate()
    } catch (cause) {
      URL.revokeObjectURL(url)
      if (current === revision && !disposed) error.value = cause.message || '图片读取失败'
    } finally {
      if (current === revision && !disposed) loading.value = false
    }
  }

  const filename = () => (source.value?.name || '拼豆图纸').replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]/g, '_')

  async function exportPng() {
    if (!pattern.value || stale.value || generating.value || exporting.value) return
    exporting.value = true
    try {
      const result = pattern.value
      const name = filename()
      const blob = await exportPatternPng(result)
      if (!disposed) downloadBlob(blob, `${name}-${result.cols}x${result.rows}-拼豆图纸.png`)
    } catch (cause) {
      if (!disposed) ElMessage.error(cause.message || '导出失败，请减小网格尺寸后重试')
    } finally {
      exporting.value = false
    }
  }

  function exportCsv() {
    if (!pattern.value || stale.value || generating.value) return
    downloadBlob(
      new Blob([materialsCsv(pattern.value)], { type: 'text/csv;charset=utf-8' }),
      `${filename()}-拼豆用料.csv`
    )
  }

  onBeforeUnmount(() => {
    disposed = true
    clear()
  })

  return {
    source,
    pattern,
    options,
    loading,
    generating,
    exporting,
    error,
    stale,
    clear,
    loadFile,
    exportPng,
    exportCsv
  }
}
