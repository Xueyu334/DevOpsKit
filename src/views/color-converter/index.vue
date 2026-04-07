<template>
  <div class="color-converter-container">
    <el-row :gutter="15">
      <!-- 左侧主控制区 -->
      <el-col :xs="24" :sm="24" :md="18">
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

      <!-- 右侧常用色彩库 -->
      <el-col :xs="24" :sm="24" :md="6">
        <el-card class="recommend-card" shadow="hover">
          <template #header>
            <div class="recommend-header">
              <el-icon><icon-ep-collection /></el-icon>
              <span>常用色彩库</span>
            </div>
          </template>
          <div class="recommend-card-content">
            <div class="color-grid-vertical">
              <div v-for="color in commonColors" :key="color.value" class="color-item-sidebar"
                :class="{ active: hexValue.toUpperCase() === color.value.toUpperCase() }"
                @click="applyColor(color.value)">
                <div class="color-dot" :style="{ backgroundColor: color.value }"></div>
                <div class="color-info">
                  <span class="color-name">{{ color.name }}</span>
                  <span class="color-hex">{{ color.value }}</span>
                </div>
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

// --- 数据定义 ---

const currentColor = ref('#409EFF')
const hexValue = ref('409EFF')

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

// --- 核心转换逻辑 ---

// RGB to HSL
const rgbToHsl = (r = 0, g = 0, b = 0) => {
  r = (r || 0) / 255; g = (g || 0) / 255; b = (b || 0) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2

  if (max === min) {
    h = s = 0 // achromatic
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

// HSL to RGB
const hslToRgb = (h = 0, s = 0, l = 0) => {
  h = (h || 0) / 360; s = (s || 0) / 100; l = (l || 0) / 100
  let r, g, b
  if (s === 0) {
    r = g = b = l // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  }
}

// RGB to HEX
const rgbToHex = (r = 0, g = 0, b = 0, a = 1) => {
  const toHex = x => {
    const val = Math.round(Number(x) || 0)
    return Math.max(0, Math.min(255, val)).toString(16).padStart(2, '0').toUpperCase()
  }
  let hex = toHex(r) + toHex(g) + toHex(b)
  if (a < 1) {
    hex += toHex(a * 255)
  }
  return hex
}

// 颜色解析器：支持 HEX, RGB, RGBA
const parseColor = (color) => {
  if (!color) return { r: 0, g: 0, b: 0, a: 1 }

  // 处理 RGB(A) 格式
  if (color.startsWith('rgb')) {
    const vals = color.match(/[\d.]+/g)
    if (vals && vals.length >= 3) {
      return {
        r: parseInt(vals[0]) || 0,
        g: parseInt(vals[1]) || 0,
        b: parseInt(vals[2]) || 0,
        a: vals[3] !== undefined ? parseFloat(vals[3]) : 1
      }
    }
  }

  // 处理 HEX 格式
  let hex = color.replace('#', '')
  if (hex.length === 3) {
    hex = hex.split('').map(x => x + x).join('')
  }

  const r = parseInt(hex.substring(0, 2), 16) || 0
  const g = parseInt(hex.substring(2, 4), 16) || 0
  const b = parseInt(hex.substring(4, 6), 16) || 0
  let a = 1
  if (hex.length === 8) {
    a = +(parseInt(hex.substring(6, 8), 16) / 255).toFixed(2)
  }
  return { r, g, b, a }
}

// --- 衍生逻辑 ---

const rgbValue = computed(() => {
  return rgba.a === 1 ? `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})` : `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`
})

const hslValue = computed(() => {
  return hsla.a === 1 ? `hsl(${hsla.h}, ${hsla.s}%, ${hsla.l}%)` : `hsla(${hsla.h}, ${hsla.s}%, ${hsla.l}%, ${hsla.a})`
})

const contrastColor = computed(() => {
  const { r, g, b } = rgba
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? '#000000' : '#FFFFFF'
})

const uiStates = computed(() => {
  // 生成 hover / active / disabled
  const { h, s, l } = hsla
  return [
    { name: 'Hover', value: rgbToHex(...Object.values(hslToRgb(h, s, Math.min(100, l + 10))), rgba.a) },
    { name: 'Active', value: rgbToHex(...Object.values(hslToRgb(h, s, Math.max(0, l - 10))), rgba.a) },
    { name: 'Disabled', value: rgbToHex(...Object.values(hslToRgb(h, 20, 80)), 0.6) }
  ].map(it => ({ ...it, value: '#' + it.value }))
})

const colorSteps = computed(() => {
  const { h, s, l } = hsla
  const steps = []
  // Lighten steps
  for (let i = 1; i <= 5; i++) {
    const newL = l + (100 - l) * (i / 6)
    steps.push({ name: `light-${i}`, value: '#' + rgbToHex(...Object.values(hslToRgb(h, s, newL)), rgba.a) })
  }
  // Darken steps
  for (let i = 1; i <= 3; i++) {
    const newL = l * (1 - i / 4)
    steps.push({ name: `dark-${i}`, value: '#' + rgbToHex(...Object.values(hslToRgb(h, s, newL)), rgba.a) })
  }
  return steps
})

// --- 同步逻辑 ---

const syncFromRgba = () => {
  const { r, g, b, a } = rgba
  hexValue.value = rgbToHex(r, g, b, a)
  const hsl = rgbToHsl(r, g, b)
  hsla.h = hsl.h
  hsla.s = hsl.s
  hsla.l = hsl.l
  hsla.a = a
  currentColor.value = '#' + hexValue.value
}

const syncFromHsla = () => {
  const { h, s, l, a } = hsla
  const rgb = hslToRgb(h, s, l)
  rgba.r = rgb.r
  rgba.g = rgb.g
  rgba.b = rgb.b
  rgba.a = a
  hexValue.value = rgbToHex(rgb.r, rgb.g, rgb.b, a)
  currentColor.value = '#' + hexValue.value
}

const handleHexInput = (val) => {
  const cleanHex = val.replace('#', '')
  if (/^[0-9a-fA-F]{3,8}$/.test(cleanHex)) {
    const rgb = parseColor(cleanHex)
    Object.assign(rgba, rgb)
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    Object.assign(hsla, { ...hsl, a: rgb.a })
    currentColor.value = '#' + cleanHex
  }
}

const handlePickerChange = (val) => {
  if (!val) return
  const rgb = parseColor(val)
  Object.assign(rgba, rgb)
  syncFromRgba()
}

const applyColor = (val) => {
  if (!val) return
  if (val.startsWith('#')) {
    hexValue.value = val.replace('#', '')
    handleHexInput(hexValue.value)
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
  max-width: 1000px;
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

/* 推荐色卡片 */
.recommend-card {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 10px;
}

.recommend-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 1rem;
  color: #303133;
}

.recommend-card-content {
  padding-right: 0;
}

.color-grid-vertical {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.color-item-sidebar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.4);
}

.color-item-sidebar:hover {
  background: #fff;
  transform: translateX(3px);
}

.color-item-sidebar.active {
  border-color: #409EFF;
  background: #fff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.color-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.color-hex {
  font-size: 0.75rem;
  color: #909399;
  font-family: monospace;
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

/* 移动端适配 */
@media (max-width: 768px) {
  .step-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
