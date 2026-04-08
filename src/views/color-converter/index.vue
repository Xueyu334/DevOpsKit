<template>
  <div class="color-converter-container">
    <el-row :gutter="15">
      <!-- 1. 最近选择 (左侧) -->
      <el-col :xs="24" :sm="24" :md="4">
        <el-card class="sidebar-card" shadow="hover">
          <template #header>
            <div class="sidebar-card-header">
              <el-icon><icon-ep-clock /></el-icon>
              <span>最近选择</span>
            </div>
          </template>
          <div class="sidebar-list">
            <div v-for="(color, index) in colorHistory" :key="index" class="sidebar-item" @click="applyColor(color)">
              <div class="history-dot" :style="{ backgroundColor: color }"></div>
              <span class="mono-label">{{ color }}</span>
            </div>
            <div v-if="colorHistory.length === 0" class="empty-tip">暂无选择记录</div>
          </div>
        </el-card>
      </el-col>

      <!-- 2. 主控制区 (中间) -->
      <el-col :xs="24" :sm="24" :md="14">
        <el-card class="converter-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <span class="title">专业颜色转换器</span>
                <p class="subtitle">支持 HEX / RGB / HSL 联动及衍生色生成</p>
              </div>
              <el-color-picker v-model="currentColor" show-alpha size="large" @change="handlePickerChange" />
            </div>
          </template>

          <!-- 主要预览区 -->
          <div class="main-preview-section">
            <div class="checkerboard-bg">
              <div class="color-preview-box" :style="{ backgroundColor: currentColor }">
                <div class="preview-text-info" :style="{ color: contrastColor }">
                  <div class="hex-text">{{ hexValue }}</div>
                  <div class="format-text">{{ rgbValue }}</div>
                  <div class="format-text">{{ hslValue }}</div>
                </div>
              </div>
            </div>
          </div>

          <el-divider />

          <div class="converter-content">
            <!-- 输入控制组 -->
            <el-row :gutter="20">
              <!-- HEX 组 -->
              <el-col :xs="24" :sm="24" :md="24" :lg="6">
                <div class="input-group">
                  <div class="group-header">
                    <span class="group-title">HEX</span>
                    <el-button link type="primary" @click="copy(hexValue)">复制</el-button>
                  </div>
                  <el-input v-model="hexValue" placeholder="#FFFFFF" @input="handleHexInput">
                    <template #prefix>#</template>
                  </el-input>
                </div>
              </el-col>

              <!-- RGB 组 -->
              <el-col :xs="24" :sm="24" :md="24" :lg="9">
                <div class="input-group">
                  <div class="group-header">
                    <span class="group-title">RGB / RGBA</span>
                    <el-button link type="primary" @click="copy(rgbValue)">复制</el-button>
                  </div>
                  <div class="slider-controls">
                    <div v-for="item in rgbControls" :key="item.key" class="slider-item">
                      <span class="label">{{ item.label }}</span>
                      <el-slider v-model="rgba[item.key]" :max="item.max" :min="0" :step="item.step" size="small"
                        @input="syncFromRgba" />
                      <el-input-number v-model="rgba[item.key]" :controls="false" :max="item.max" :min="0"
                        :precision="item.precision" size="small" class="tiny-number" @change="syncFromRgba" />
                    </div>
                  </div>
                </div>
              </el-col>

              <!-- HSL 组 -->
              <el-col :xs="24" :sm="24" :md="24" :lg="9">
                <div class="input-group">
                  <div class="group-header">
                    <span class="group-title">HSL</span>
                    <el-button link type="primary" @click="copy(hslValue)">复制</el-button>
                  </div>
                  <div class="slider-controls">
                    <div v-for="item in hslControls" :key="item.key" class="slider-item">
                      <span class="label">{{ item.label }}</span>
                      <el-slider v-model="hsla[item.key]" :max="item.max" :min="0" :step="1" size="small"
                        @input="syncFromHsla" />
                      <el-input-number v-model="hsla[item.key]" :controls="false" :max="item.max" :min="0" size="small"
                        class="tiny-number" @change="syncFromHsla" />
                      <span class="unit">{{ item.unit }}</span>
                    </div>
                  </div>
                </div>
              </el-col>
            </el-row>

            <el-divider />

            <!-- 衍生色生成 -->
            <div class="derived-section">
              <div class="section-header">
                <h3 class="section-title">衍生色 (Derived Colors)</h3>
                <p class="section-desc">基于主色自动计算的 UI 状态色与阶梯色</p>
              </div>

              <el-row :gutter="15">
                <el-col :xs="24" :sm="12">
                  <div class="derived-block">
                    <span class="block-title">UI 状态推断</span>
                    <div class="derived-grid">
                      <div v-for="color in uiStates" :key="color.name" class="color-chip-wrapper"
                        @click="applyColor(color.value)">
                        <div class="color-chip" :style="{ backgroundColor: color.value }"></div>
                        <span class="chip-name">{{ color.name }}</span>
                        <span class="chip-value">{{ color.value }}</span>
                      </div>
                    </div>
                  </div>
                </el-col>
                <el-col :xs="24" :sm="12">
                  <div class="derived-block">
                    <span class="block-title">色阶 (Tints & Shades)</span>
                    <div class="derived-grid step-grid">
                      <div v-for="color in colorSteps" :key="color.name" class="color-chip-wrapper"
                        @click="applyColor(color.value)">
                        <div class="color-chip" :style="{ backgroundColor: color.value }"></div>
                        <span class="chip-name">{{ color.name }}</span>
                      </div>
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 3. 常用色彩库 (右侧) -->
      <el-col :xs="24" :sm="24" :md="6">
        <el-card class="sidebar-card" shadow="hover">
          <template #header>
            <div class="sidebar-card-header">
              <el-icon><icon-ep-collection /></el-icon>
              <span>常用色彩库</span>
            </div>
          </template>
          <div class="sidebar-list">
            <div v-for="color in commonColors" :key="color.value" class="sidebar-item"
              :class="{ active: hexValue.toUpperCase() === color.value.toUpperCase() }"
              @click="applyColor(color.value)">
              <div class="color-dot" :style="{ backgroundColor: color.value }"></div>
              <div class="color-info">
                <span class="color-name">{{ color.name }}</span>
                <span class="mono-label">{{ color.value }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { colord } from 'colord'

// --- 数据定义 ---

const currentColor = ref('#409EFF')
const hexValue = ref('409EFF')
// 历史记录列表持久化
const colorHistory = useStorage('devopskit_color_history', [])
const maxHistoryCount = 12   // 最大记录数

const rgba = reactive({ r: 64, g: 158, b: 255, a: 1 })
const hsla = reactive({ h: 210, s: 100, l: 63, a: 1 })

const rgbControls = [
  { label: 'R', key: 'r', max: 255, step: 1, precision: 0 },
  { label: 'G', key: 'g', max: 255, step: 1, precision: 0 },
  { label: 'B', key: 'b', max: 255, step: 1, precision: 0 },
  { label: 'A', key: 'a', max: 1, step: 0.01, precision: 2 }
]

const hslControls = [
  { label: 'H', key: 'h', max: 360, unit: '°' },
  { label: 'S', key: 's', max: 100, unit: '%' },
  { label: 'L', key: 'l', max: 100, unit: '%' }
]

const commonColors = [
  { name: '主要蓝', value: '#409EFF' },
  { name: '成功绿', value: '#67C23A' },
  { name: '警告橙', value: '#E6A23C' },
  { name: '危险红', value: '#F56C6C' },
  { name: '基础灰', value: '#909399' },
  { name: '深幽蓝', value: '#2c3e50' },
  { name: '优雅紫', value: '#8e44ad' },
  { name: '热粉红', value: '#ff4757' },
  { name: '星空黑', value: '#2f3542' },
  { name: '云朵白', value: '#f1f2f6' }
]

// --- 衍生逻辑 ---

const rgbValue = computed(() => {
  return colord(rgba).toRgbString()
})

const hslValue = computed(() => {
  return colord(hsla).toHslString()
})

const contrastColor = computed(() => {
  return colord(currentColor.value).isLight() ? '#000000' : '#FFFFFF'
})

const uiStates = computed(() => {
  const c = colord(currentColor.value)
  return [
    { name: 'Hover', value: c.lighten(0.1).toHex() },
    { name: 'Active', value: c.darken(0.1).toHex() },
    { name: 'Disabled', value: c.desaturate(0.5).alpha(0.6).toHex() }
  ]
})

const colorSteps = computed(() => {
  const c = colord(currentColor.value)
  const steps = []
  // Lighten steps (mix with white)
  for (let i = 1; i <= 5; i++) {
    steps.push({ name: `light-${i}`, value: c.mix('#ffffff', i / 6).toHex() })
  }
  // Darken steps (mix with black)
  for (let i = 1; i <= 3; i++) {
    steps.push({ name: `dark-${i}`, value: c.mix('#000000', i / 4).toHex() })
  }
  return steps
})

// --- 同步逻辑 ---

const syncFromRgba = () => {
  const c = colord(rgba)
  const hex = c.toHex()
  hexValue.value = hex.replace('#', '').toUpperCase()
  const hsl = c.toHsl()
  hsla.h = Math.round(hsl.h)
  hsla.s = Math.round(hsl.s)
  hsla.l = Math.round(hsl.l)
  hsla.a = hsl.a
  currentColor.value = hex
}

const syncFromHsla = () => {
  const c = colord(hsla)
  const rgb = c.toRgb()
  rgba.r = Math.round(rgb.r)
  rgba.g = Math.round(rgb.g)
  rgba.b = Math.round(rgb.b)
  rgba.a = rgb.a
  const hex = c.toHex()
  hexValue.value = hex.replace('#', '').toUpperCase()
  currentColor.value = hex
}

const handleHexInput = (val) => {
  const prefixVal = val.startsWith('#') ? val : '#' + val
  const c = colord(prefixVal)
  if (c.isValid()) {
    const rgb = c.toRgb()
    Object.assign(rgba, { r: Math.round(rgb.r), g: Math.round(rgb.g), b: Math.round(rgb.b), a: rgb.a })
    const hsl = c.toHsl()
    Object.assign(hsla, { h: Math.round(hsl.h), s: Math.round(hsl.s), l: Math.round(hsl.l), a: hsl.a })
    currentColor.value = c.toHex()
  }
}

const recordHistory = (color) => {
  if (!color) return
  const c = colord(color)
  if (!c.isValid()) return
  const normalizedColor = c.toHex().toUpperCase()

  // 核心逻辑：去重并置顶 (MRU)
  const index = colorHistory.value.indexOf(normalizedColor)
  if (index > -1) {
    // 如果已经存在，先从原位置删除
    colorHistory.value.splice(index, 1)
  }

  // 将最新使用的颜色置顶
  colorHistory.value.unshift(normalizedColor)

  // 保持记录上限
  if (colorHistory.value.length > maxHistoryCount) {
    colorHistory.value.pop()
  }
}

const handlePickerChange = (val) => {
  if (!val) return
  const c = colord(val)
  if (c.isValid()) {
    const rgb = c.toRgb()
    Object.assign(rgba, { r: Math.round(rgb.r), g: Math.round(rgb.g), b: Math.round(rgb.b), a: rgb.a })
    syncFromRgba()
    // 只有在选择器确定改变后才记录新颜色
    recordHistory(val)
  }
}

const applyColor = (val) => {
  if (!val) return
  const c = colord(val)
  if (c.isValid()) {
    const hexWithoutHash = c.toHex().replace('#', '').toUpperCase()
    hexValue.value = hexWithoutHash
    handleHexInput(hexWithoutHash)
    // 记录这次成功的应用操作
    recordHistory(val)
  }
}

const copy = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制: ' + text)
  })
}

onMounted(() => {
  syncFromRgba()
})
</script>

<style scoped>
.color-converter-container {
  max-width: 1200px;
  margin: 5px auto;
  animation: fadeIn 0.5s ease-out;
}

:deep(.el-card__header) {
  padding: 10px 15px;
}

:deep(.el-card__body) {
  padding: 12px 15px;
  overflow: visible !important;
  max-height: none !important;
}

.converter-card {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left .title {
  font-size: 1.4rem;
  font-weight: 700;
  background: linear-gradient(135deg, #2c3e50, #409EFF);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  margin: 2px 0 0;
  font-size: 0.9rem;
  color: #606266;
}

/* 预览区优化 */
.main-preview-section {
  padding: 5px 0;
}

.checkerboard-bg {
  background-image:
    linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee),
    linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee);
  background-size: 16px 16px;
  background-position: 0 0, 8px 8px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05);
}

.color-preview-box {
  width: 100%;
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
  border: 3px solid #fff;
}

.preview-text-info {
  text-align: center;
  font-family: 'Fira Code', 'Monaco', monospace;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.hex-text {
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.format-text {
  font-size: 0.85rem;
  opacity: 0.85;
  margin-top: 2px;
}

/* 输入控制 */
.input-group {
  margin-bottom: 5px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.group-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #303133;
}

.slider-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slider-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-item .label {
  width: 15px;
  font-weight: bold;
  font-size: 0.85rem;
  color: #909399;
}

.slider-item .el-slider {
  flex: 1;
}

.tiny-number {
  width: 65px !important;
}

.unit {
  width: 15px;
  font-size: 0.85rem;
  color: #C0C4CC;
}

/* 衍生色 */
.derived-section {
  margin-top: 0;
}

.derived-block {
  background: rgba(255, 255, 255, 0.4);
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  height: 100%;
}

.block-title {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #606266;
}

.derived-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
}

.step-grid {
  grid-template-columns: repeat(4, 1fr);
}

.color-chip-wrapper {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: transform 0.2s;
}

.color-chip-wrapper:hover {
  transform: translateY(-3px);
}

.color-chip {
  width: 100%;
  padding-top: 60%;
  border-radius: 6px;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.chip-name {
  font-size: 0.75rem;
  color: #909399;
}

.chip-value {
  font-size: 0.7rem;
  font-family: monospace;
  color: #C0C4CC;
}

/* 侧边栏通用样式 (最近选择 & 常用色彩) */
.sidebar-card {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 10px;
}

.sidebar-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 1rem;
  color: #303133;
}

.sidebar-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid transparent;
  transition: all 0.2s;
}

.sidebar-item:hover {
  background: #fff;
  transform: translateX(3px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.sidebar-item.active {
  border-color: #409EFF;
  background: #fff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.color-dot,
.history-dot {
  flex-shrink: 0;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.color-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
}

.history-dot {
  width: 24px;
  height: 24px;
  border-radius: 6px;
}

.color-info {
  display: flex;
  flex-direction: column;
}

.color-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #303133;
}

.mono-label {
  font-size: 0.75rem;
  color: #909399;
  font-family: 'Fira Code', monospace;
}

.empty-tip {
  font-size: 0.85rem;
  color: #C0C4CC;
  text-align: center;
  padding: 20px 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.el-divider--horizontal) {
  margin: 12px 0;
}
</style>
