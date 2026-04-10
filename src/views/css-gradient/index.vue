<template>
  <div class="css-gradient-container">
    <el-card class="tool-card">
      <template #header>
        <div class="card-header">
          <div class="title-with-icon">
            <el-icon>
              <IconEpMagicStick />
            </el-icon>
            <span>CSS 渐变生成器</span>
          </div>
          <div class="header-actions">
            <el-button type="primary" link @click="clearHistory">清空记录</el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="20">
        <!-- 左侧：预览与代码 -->
        <el-col :md="12" :xs="24">
          <div class="preview-section">
            <div class="gradient-preview" :style="{ background: gradientCss }"></div>

            <div class="code-output">
              <div class="code-label">
                <span>CSS 代码</span>
                <el-button type="primary" size="small" @click="copyCode"> 复制代码 </el-button>
              </div>
              <el-input v-model="gradientCode" type="textarea" readonly :rows="4" resize="none" class="css-textarea" />
            </div>

            <!-- 最近记录 -->
            <div v-if="history.length > 0" class="history-section">
              <h3 class="section-title">最近记录</h3>
              <div class="history-list">
                <div v-for="(item, index) in history" :key="index" class="history-item"
                  :style="{ background: item.css }" title="点击应用此样式" @click="applyHistory(item)"></div>
              </div>
            </div>
          </div>
        </el-col>

        <!-- 右侧：配置参数 -->
        <el-col :md="12" :xs="24">
          <div class="config-section">
            <!-- 基本设置 -->
            <el-form label-position="top">
              <el-form-item label="渐变类型">
                <el-radio-group v-model="config.type">
                  <el-radio-button value="linear">线性渐变</el-radio-button>
                  <el-radio-button value="radial">径向渐变</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item v-if="config.type === 'linear'" label="旋转角度 (deg)">
                <el-slider v-model="config.angle" :min="0" :max="360" show-input />
              </el-form-item>

              <el-form-item v-if="config.type === 'radial'" label="渐变形状与大小">
                <div style="display: flex; gap: 10px; width: 100%">
                  <el-select v-model="config.radialShape" placeholder="形状" style="flex: 2">
                    <el-option label="圆形 (circle)" value="circle" />
                    <el-option label="椭圆 (ellipse)" value="ellipse" />
                  </el-select>
                  <el-select v-model="config.radialSize" placeholder="大小" style="flex: 3">
                    <el-option label="最近端 (closest-side)" value="closest-side" />
                    <el-option label="最远端 (farthest-side)" value="farthest-side" />
                    <el-option label="最近角 (closest-corner)" value="closest-corner" />
                    <el-option label="最远角 (farthest-corner)" value="farthest-corner" />
                  </el-select>
                </div>
              </el-form-item>

              <!-- 颜色节点 -->
              <div class="color-stops-section">
                <div class="section-header">
                  <span>颜色节点</span>
                  <div class="header-buttons">
                    <el-button type="info" size="small" circle @click="randomizeColors" title="随机颜色与位置">
                      <el-icon>
                        <IconEpRefresh />
                      </el-icon>
                    </el-button>
                    <el-button type="primary" size="small" circle @click="addColorStop" title="添加颜色节点">
                      <el-icon>
                        <IconEpPlus />
                      </el-icon>
                    </el-button>
                  </div>
                </div>

                <div class="color-stops-list">
                  <div v-for="(stop, index) in config.stops" :key="index" class="color-stop-item">
                    <el-color-picker v-model="stop.color" show-alpha size="small" />
                    <el-slider v-model="stop.position" :min="0" :max="100" class="stop-position-slider" />
                    <span class="stop-percent">{{ stop.position }}%</span>
                    <el-button type="danger" circle size="small" :disabled="config.stops.length <= 2"
                      @click="removeColorStop(index)">
                      <el-icon>
                        <IconEpDelete />
                      </el-icon>
                    </el-button>
                  </div>
                </div>
              </div>

            </el-form>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 推荐配色方案 -->
    <el-card class="presets-card">
      <template #header>
        <div class="card-header">
          <div class="title-with-icon">
            <el-icon>
              <IconEpCollection />
            </el-icon>
            <span>推荐配色方案</span>
          </div>
        </div>
      </template>
      <el-row :gutter="15" class="presets-row">
        <el-col v-for="(preset, index) in gradientPresets" :key="index" :xs="12" :sm="8" :md="6" :lg="3"
          class="preset-col">
          <div class="preset-card" :style="{ background: preset.previewCss }" @click="applyPreset(preset)">
            <span class="preset-name">{{ preset.name }}</span>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { gradientPresets } from './presets'

const config = reactive({
  type: 'linear',
  angle: 135,
  radialShape: 'circle',
  radialSize: 'farthest-corner',
  stops: [
    { color: '#A855F7', position: 0 },
    { color: '#3B82F6', position: 100 }
  ]
})

const history = ref([])
const STORAGE_KEY = 'devops_gradient_history'

const gradientCss = computed(() => {
  const sortedStops = [...config.stops].sort((a, b) => a.position - b.position)
  const stopsStr = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ')

  if (config.type === 'linear') {
    return `linear-gradient(${config.angle}deg, ${stopsStr})`
  } else {
    return `radial-gradient(${config.radialShape} ${config.radialSize}, ${stopsStr})`
  }
})

const gradientCode = computed(() => {
  const sortedStops = [...config.stops].sort((a, b) => a.position - b.position)
  const stopsStr = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ')
  const firstColor = sortedStops[0]?.color || '#ffffff'

  if (config.type === 'linear') {
    return `background: ${firstColor};\nbackground: -webkit-linear-gradient(${config.angle}deg, ${stopsStr});\nbackground: ${gradientCss.value};`
  } else {
    return `background: ${firstColor};\nbackground: -webkit-radial-gradient(${config.radialShape} ${config.radialSize}, ${stopsStr});\nbackground: ${gradientCss.value};`
  }
})

// 添加颜色节点
const addColorStop = () => {
  if (config.stops.length >= 10) {
    ElMessage.warning('最多支持 10 个颜色节点')
    return
  }

  // 找一个中间位置插入
  const positions = config.stops.map(s => s.position).sort((a, b) => a - b)
  let newPos = 50
  if (positions.length >= 2) {
    // 找出最大的空隙
    let maxGap = 0
    let gapStart = 0
    for (let i = 0; i < positions.length - 1; i++) {
      const gap = positions[i + 1] - positions[i]
      if (gap > maxGap) {
        maxGap = gap
        gapStart = positions[i]
      }
    }
    newPos = Math.round(gapStart + maxGap / 2)
  }

  config.stops.push({
    color: '#ffffff',
    position: newPos
  })
}

// 随机颜色与位置
const randomizeColors = () => {
  config.stops.forEach(stop => {
    // 随机色值
    stop.color = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
    // 随机位置 (0-100)
    stop.position = Math.floor(Math.random() * 101)
  })

  // 排序位置以保持渐变逻辑清晰
  config.stops.sort((a, b) => a.position - b.position)

  // 如果是线性渐变，顺便随机一个角度
  if (config.type === 'linear') {
    config.angle = Math.floor(Math.random() * 361)
  }
}

// 移除颜色节点
const removeColorStop = index => {
  if (config.stops.length <= 2) return
  config.stops.splice(index, 1)
}

// 复制代码
const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(gradientCode.value)
    ElMessage.success('代码已复制到剪贴板')
    saveToHistory()
  } catch (err) {
    ElMessage.error('复制失败，请手动选择复制')
  }
}

// 应用配色方案
const applyPreset = preset => {
  config.type = preset.type
  if (preset.angle !== undefined) config.angle = preset.angle
  if (preset.radialShape !== undefined) config.radialShape = preset.radialShape
  if (preset.radialSize !== undefined) config.radialSize = preset.radialSize
  config.stops = JSON.parse(JSON.stringify(preset.stops))
}

// 保存到记录
const saveToHistory = () => {
  const currentCss = gradientCss.value
  // 如果已经记录了相同的，先移除
  const index = history.value.findIndex(h => h.css === currentCss)
  if (index !== -1) {
    history.value.splice(index, 1)
  }

  // 保存当前配置快照
  history.value.unshift({
    css: currentCss,
    config: JSON.parse(JSON.stringify(config))
  })

  // 最多保留 9 条
  if (history.value.length > 9) {
    history.value.pop()
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value))
}

// 加载记录
const loadHistory = () => {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try {
      history.value = JSON.parse(data)
    } catch (e) {
      console.error('Failed to load history', e)
    }
  }
}

// 应用历史记录
const applyHistory = item => {
  Object.assign(config, JSON.parse(JSON.stringify(item.config)))
}

// 清空记录
const clearHistory = () => {
  history.value = []
  localStorage.removeItem(STORAGE_KEY)
  ElMessage.success('记录已清空')
}

// 监听配置变化，防抖保存到 history 其实不太合适，
// 这里我们在点击复制时保存，以及初始化时加载。
// 我们也可以加一个“保存当前”按钮。

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.css-gradient-container {
  max-width: 1200px;
  margin: 10px auto;
}

.tool-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.gradient-preview {
  width: 100%;
  height: 240px;
  border-radius: 12px;
  border: 1px solid #ebeef5;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05);
  background-image:
    linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
  background-size: 20px 20px;
  background-position:
    0 0,
    0 10px,
    10px -10px,
    -10px 0px;
}

.code-output {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.code-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.css-textarea :deep(.el-textarea__inner) {
  font-family: 'Fira Code', 'Courier New', Courier, monospace;
  font-size: 13px;
  background-color: #f8fafc;
  color: #334155;
  padding: 12px;
}

.history-section {
  margin-top: 10px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.history-item {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.history-item:hover {
  transform: scale(1.1);
  border-color: #409eff;
}

.config-section {
  padding: 0 10px;
}

.color-stops-section {
  margin-top: 25px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 15px;
  background-color: #fafbfc;
}

.color-stops-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-weight: 600;
  color: #606266;
}

.header-buttons {
  display: flex;
  gap: 8px;
}

.color-stops-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.color-stop-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.stop-position-slider {
  flex: 1;
}

.stop-percent {
  font-size: 12px;
  color: #909399;
  min-width: 35px;
}

.presets-card {
  margin-top: 10px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.presets-row {
  margin: -7.5px;
}

.preset-col {
  padding: 7.5px;
}

/* 在大屏幕（lg >= 1200px）下强制 7 列排列 */
@media (min-width: 1200px) {
  .preset-col {
    flex: 0 0 14.2857% !important;
    max-width: 14.2857% !important;
  }
}

.preset-card {
  height: 80px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.preset-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.preset-name {
  color: white;
  font-size: 13px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  z-index: 1;
}

@media (max-width: 768px) {
  .tool-card {
    margin: -10px;
    border-radius: 0;
  }
}
</style>
