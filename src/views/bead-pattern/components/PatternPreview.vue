<script setup>
import { drawPattern } from '../utils/render.js'

const props = defineProps({
  pattern: { type: Object, default: null },
  stale: Boolean,
  busy: Boolean,
  exporting: Boolean
})
defineEmits(['export-png', 'show-materials'])
const canvas = useTemplateRef('canvas')
const viewport = useTemplateRef('viewport')
const maxPreviewHeight = 420
const viewportWidth = ref(0)
const grid = ref(true)
const codes = ref(true)
const coordinates = ref(true)
const zoom = ref('fit')
const zoomLevels = [10, 25, 50, 75, 100, 150, 200]
const zoomOptions = computed(() =>
  typeof zoom.value === 'number' && !zoomLevels.includes(zoom.value)
    ? [...zoomLevels, zoom.value].sort((a, b) => a - b)
    : zoomLevels
)
const selection = ref(null)
const baseCellSize = computed(() =>
  props.pattern ? Math.min(24, Math.floor(3600 / Math.max(props.pattern.cols, props.pattern.rows))) : 24
)
const showCodes = computed(() => codes.value && baseCellSize.value >= 12)
const canvasWidth = computed(() =>
  props.pattern ? props.pattern.cols * baseCellSize.value + (coordinates.value ? 60 : 16) : 0
)
const canvasHeight = computed(() =>
  props.pattern ? props.pattern.rows * baseCellSize.value + (coordinates.value ? 60 : 16) : 0
)
const suggestedZoom = computed(() => {
  if (!viewportWidth.value || !canvasWidth.value || !canvasHeight.value) return 100
  const scale = Math.min(viewportWidth.value / canvasWidth.value, maxPreviewHeight / canvasHeight.value, 2)
  return Math.max(0.1, Math.floor(scale * 1000) / 10)
})
const effectiveZoom = computed(() => (zoom.value === 'fit' ? suggestedZoom.value : zoom.value))

useResizeObserver(viewport, entries => {
  viewportWidth.value = entries[0].contentRect.width
})
useEventListener(viewport, 'wheel', handleZoomWheel, { passive: false })
let geometry = null

watchEffect(() => {
  if (!canvas.value || !props.pattern) return
  geometry = drawPattern(canvas.value, props.pattern, {
    grid: grid.value,
    codes: showCodes.value,
    coordinates: coordinates.value,
    cellSize: baseCellSize.value
  })
})
watch(
  () => props.pattern,
  () => {
    selection.value = null
    zoom.value = 'fit'
  }
)

async function handleZoomWheel(event) {
  if ((!event.ctrlKey && !event.metaKey) || !props.pattern || !canvas.value) return
  event.preventDefault()
  if (!event.deltaY) return
  const target = viewport.value
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? target.clientHeight : 1
  const delta = Math.max(-100, Math.min(100, event.deltaY * unit))
  const nextZoom = Math.max(0.1, Math.min(200, Math.round(effectiveZoom.value * Math.exp(-delta * 0.002) * 10) / 10))
  if (nextZoom === effectiveZoom.value) return
  const rect = canvas.value.getBoundingClientRect()
  const bounds = target.getBoundingClientRect()
  const anchorX = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
  const anchorY = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))
  const pointerX = event.clientX - bounds.left - target.clientLeft
  const pointerY = event.clientY - bounds.top - target.clientTop
  // 放大后尽量保持鼠标指向的格子位置，避免图纸跳回左上角。
  zoom.value = nextZoom
  await nextTick()
  if (viewport.value !== target || !canvas.value || zoom.value !== nextZoom) return
  target.scrollLeft = (anchorX * canvasWidth.value * nextZoom) / 100 - pointerX
  target.scrollTop = (anchorY * canvasHeight.value * nextZoom) / 100 - pointerY
}

function selectCell(event) {
  if (!geometry || !props.pattern) return
  const rect = canvas.value.getBoundingClientRect()
  const x = Math.floor(
    (((event.clientX - rect.left) * canvas.value.width) / rect.width - geometry.left) / geometry.cellSize
  )
  const y = Math.floor(
    (((event.clientY - rect.top) * canvas.value.height) / rect.height - geometry.top) / geometry.cellSize
  )
  if (x < 0 || x >= props.pattern.cols || y < 0 || y >= props.pattern.rows) {
    selection.value = null
    return
  }
  const color = props.pattern.cells[y * props.pattern.cols + x]
  selection.value = { x: x + 1, y: y + 1, color }
}
</script>

<template>
  <el-card shadow="hover">
    <template #header>
      <div class="card-heading">
        <span>拼豆图纸预览</span>
        <el-tag :type="busy || stale ? 'warning' : pattern ? 'success' : 'info'" size="small">
          {{ busy ? '正在更新图纸' : stale ? '待更新' : pattern ? '已生成' : '等待图片' }}
        </el-tag>
      </div>
    </template>
    <el-alert
      v-if="stale"
      class="stale-note"
      :title="busy ? '正在根据最新参数更新图纸，完成后可导出。' : '图纸更新未完成，请调整参数重试。'"
      type="warning"
      :closable="false"
    />
    <template v-if="pattern">
      <div class="summary">
        <el-tag effect="plain">{{ pattern.cols }} × {{ pattern.rows }} 格</el-tag>
        <el-tag type="success" effect="plain">{{ pattern.total.toLocaleString() }} 颗豆</el-tag>
        <el-tag type="info" effect="plain">{{ pattern.materials.length }} 种颜色</el-tag>
        <span class="hint">约 {{ (pattern.cols * 0.5).toFixed(1) }} × {{ (pattern.rows * 0.5).toFixed(1) }} cm</span>
      </div>
      <div class="toolbar">
        <el-checkbox v-model="grid">网格线</el-checkbox>
        <el-checkbox v-model="codes">色号</el-checkbox>
        <el-checkbox v-model="coordinates">行列坐标</el-checkbox>
        <el-select v-model="zoom" class="zoom-select" aria-label="预览缩放">
          <el-option :label="`适应图纸（建议 ${suggestedZoom}%）`" value="fit" />
          <el-option v-for="value in zoomOptions" :key="value" :label="`${value}%`" :value="value" />
        </el-select>
      </div>
      <div ref="viewport" class="canvas-viewport" :style="{ '--preview-max-height': `${maxPreviewHeight}px` }">
        <canvas
          ref="canvas"
          class="pattern-canvas"
          :style="{ width: `${(canvasWidth * effectiveZoom) / 100}px` }"
          aria-label="拼豆坐标图，点击查看格子详情"
          @click="selectCell"
        />
      </div>
      <div class="cell-detail" aria-live="polite">
        <template v-if="selection">
          第 <strong>{{ selection.y }}</strong> 行，第 <strong>{{ selection.x }}</strong> 列：
          <template v-if="selection.color">
            <span class="swatch" :style="{ backgroundColor: selection.color.hex }" />
            {{ selection.color.code }} · {{ selection.color.name }} · {{ selection.color.hex }}
          </template>
          <span v-else>空白格，不放豆</span>
        </template>
        <span v-else class="hint cell-hint">
          <el-icon aria-hidden="true"><IconEpInfoFilled /></el-icon>
          <span>点击格子查看行、列和色号；坐标从左上角的 1 开始。</span>
        </span>
      </div>
      <p class="hint">
        Ctrl / ⌘ + 鼠标滚轮缩放图纸。每 5 / 10 格加辅助线。大图预览可能隐藏色号，导出的 PNG
        始终包含色号、坐标和用料图例。
      </p>
      <div class="export-actions">
        <el-button type="primary" :disabled="stale || busy" :loading="exporting" @click="$emit('export-png')"
          >导出图纸 PNG</el-button
        >
        <el-button :disabled="stale || busy" @click="$emit('show-materials')">
          用料清单 · {{ pattern.materials.length }} 色 / {{ pattern.total.toLocaleString() }} 颗
        </el-button>
      </div>
    </template>
    <el-empty v-else :description="busy ? '正在生成拼豆图纸…' : '上传图片后自动生成第一张拼豆图纸'" />
  </el-card>
</template>

<style scoped>
.card-heading,
.summary,
.toolbar,
.export-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.card-heading {
  justify-content: space-between;
}
.summary {
  margin-bottom: 12px;
}
.toolbar {
  margin-bottom: 12px;
}
.toolbar .el-checkbox {
  margin-right: 0;
}
.zoom-select {
  width: 210px;
  margin-left: auto;
}
.canvas-viewport {
  overflow: auto;
  max-height: var(--preview-max-height);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}
.pattern-canvas {
  display: block;
  max-width: none;
  cursor: crosshair;
}
.cell-detail {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  min-height: 32px;
  margin-top: 10px;
  font-size: 13px;
}
.swatch {
  width: 16px;
  height: 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 3px;
}
.cell-hint {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.cell-hint .el-icon {
  flex-shrink: 0;
}
.hint {
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}
.stale-note {
  margin-bottom: 16px;
}
.export-actions {
  margin-top: 16px;
}
.export-actions .el-button + .el-button {
  margin-left: 0;
}
</style>
