<template>
  <div class="single-task-calc">
    <el-row :gutter="20">
      <!-- 左侧：输入控制 -->
      <el-col :xs="24" :lg="11">
        <el-card class="calc-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="header-title">
                <el-icon class="header-icon"><TrendCharts /></el-icon>
                单任务三点参数输入
              </span>
              <div class="header-actions">
                <el-select v-model="currentUnit" size="small" style="width: 105px; margin-right: 8px">
                  <el-option label="人天 (d)" value="人天 (d)" />
                  <el-option label="人时 (h)" value="人时 (h)" />
                  <el-option label="故事点" value="故事点 (SP)" />
                  <el-option label="天" value="天" />
                  <el-option label="小时" value="小时" />
                </el-select>
                <el-button type="primary" link @click="resetToDefault">重置默认</el-button>
              </div>
            </div>
          </template>

          <el-form label-position="top">
            <el-form-item label="计算模型与权重模式">
              <el-radio-group v-model="form.weightMode" size="default">
                <el-radio-button value="beta"> 经典 PERT (加权平均 4x) </el-radio-button>
                <el-radio-button value="triangular"> 算术平均 (三角分布 1x) </el-radio-button>
                <el-radio-button value="custom"> 自定义权重 </el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item v-if="form.weightMode === 'custom'" label="最可能工时 (M) 权重倍数">
              <div class="custom-weight-row">
                <el-slider
                  v-model="form.customWeight"
                  :min="1"
                  :max="10"
                  :step="1"
                  show-stops
                  style="flex: 1; margin-right: 16px"
                />
                <span class="weight-tag">M 权重: {{ form.customWeight }}x</span>
              </div>
              <div class="formula-preview-text">
                计算公式: <em>T<sub>e</sub> = (O + {{ form.customWeight }}M + P) / {{ 2 + form.customWeight }}</em>
              </div>
            </el-form-item>

            <!-- O, M, P 三点参数输入 -->
            <div class="points-grid">
              <div class="point-item optimistic">
                <div class="point-header">
                  <span class="point-label">乐观工时 (O)</span>
                  <el-tooltip content="一切顺利、无任何意外阻碍时的最短可能耗时" placement="top">
                    <el-icon class="info-icon"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
                <el-input-number
                  v-model="form.o"
                  :min="0"
                  :step="0.5"
                  :precision="currentPrecision"
                  :value-on-clear="0"
                  controls-position="right"
                  class="full-width"
                />
                <span class="point-hint">顺利无阻态</span>
              </div>

              <div class="point-item most-likely">
                <div class="point-header">
                  <span class="point-label">最可能工时 (M)</span>
                  <el-tooltip content="正常工作节奏、按常规实际情况出现频率最高的耗时" placement="top">
                    <el-icon class="info-icon"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
                <el-input-number
                  v-model="form.m"
                  :min="0"
                  :step="0.5"
                  :precision="currentPrecision"
                  :value-on-clear="0"
                  controls-position="right"
                  class="full-width"
                />
                <span class="point-hint">基准常见态</span>
              </div>

              <div class="point-item pessimistic">
                <div class="point-header">
                  <span class="point-label">悲观工时 (P)</span>
                  <el-tooltip content="遭遇各种困难、技术阻塞、沟通重试等最坏情况下的耗时" placement="top">
                    <el-icon class="info-icon"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
                <el-input-number
                  v-model="form.p"
                  :min="0"
                  :step="0.5"
                  :precision="currentPrecision"
                  :value-on-clear="0"
                  controls-position="right"
                  class="full-width"
                />
                <span class="point-hint">最坏遭遇态</span>
              </div>
            </div>

            <div v-if="!taskResult.isValid" class="validation-alert">
              <el-alert :title="taskResult.validationMessage" type="warning" show-icon :closable="false" />
            </div>

            <!-- 详细计算步骤与公式代入 -->
            <div class="steps-detail">
              <div class="steps-title">详细计算步骤与公式代入</div>
              <div class="step-line">
                <strong>1. 期望值代入：</strong>
                <span v-if="form.weightMode === 'beta'">
                  T<sub>e</sub> = ({{ form.o }} + 4 &times; {{ form.m }} + {{ form.p }}) / 6 = ({{ form.o }} +
                  {{ 4 * form.m }} + {{ form.p }}) / 6 =
                  <strong>{{ formatNum(taskResult.te, currentPrecision) }}</strong>
                </span>
                <span v-else-if="form.weightMode === 'triangular'">
                  T<sub>e</sub> = ({{ form.o }} + {{ form.m }} + {{ form.p }}) / 3 =
                  <strong>{{ formatNum(taskResult.te, currentPrecision) }}</strong>
                </span>
                <span v-else>
                  T<sub>e</sub> = ({{ form.o }} + {{ form.customWeight }} &times; {{ form.m }} + {{ form.p }}) /
                  {{ 2 + form.customWeight }} = <strong>{{ formatNum(taskResult.te, currentPrecision) }}</strong>
                </span>
              </div>
              <div class="step-line">
                <strong>2. 标准差代入：</strong>
                &sigma; = ({{ form.p }} - {{ form.o }}) / 6 = {{ form.p - form.o }} / 6 =
                <strong>{{ formatNum(taskResult.sd, currentPrecision) }}</strong>
              </div>
              <div class="step-line">
                <strong>3. 方差代入：</strong>
                V = &sigma;² = ({{ formatNum(taskResult.sd, currentPrecision) }})² =
                <strong>{{ formatNum(taskResult.variance, currentPrecision) }}</strong>
              </div>
            </div>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右侧：实时计算结果与统计特征 -->
      <el-col :xs="24" :lg="13">
        <el-card class="result-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="header-title">
                <el-icon class="header-icon"><DataAnalysis /></el-icon>
                测算结果与风险特征
              </span>
              <el-tag :type="taskResult.riskTagType" effect="dark" round>
                {{ taskResult.riskLabel }}
              </el-tag>
            </div>
          </template>

          <!-- 核心指标 3 列看板 -->
          <div class="metrics-grid">
            <div class="metric-box primary">
              <div class="metric-title">
                期望工作量 (T<sub>e</sub>)
                <el-tooltip content="综合 O、M、P 与权重计算出的最可能期望完成工作量" placement="top">
                  <el-icon class="info-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
              <div class="metric-value">
                {{ formatNum(taskResult.te, currentPrecision) }} <span class="unit">{{ currentUnit }}</span>
              </div>
              <div class="metric-formula">
                <span v-if="form.weightMode === 'beta'">T<sub>e</sub> = (O + 4M + P) / 6</span>
                <span v-else-if="form.weightMode === 'triangular'">T<sub>e</sub> = (O + M + P) / 3</span>
                <span v-else>T<sub>e</sub> = (O + {{ form.customWeight }}M + P) / {{ 2 + form.customWeight }}</span>
              </div>
            </div>

            <div class="metric-box warning">
              <div class="metric-title">
                标准差 (&sigma;)
                <el-tooltip
                  content="衡量任务的不确定性与风险敞口：&sigma; = (P - O) / 6。数值越大，表示技术风险或需求模糊度越高"
                  placement="top"
                >
                  <el-icon class="info-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
              <div class="metric-value">
                {{ formatNum(taskResult.sd, currentPrecision) }} <span class="unit">{{ currentUnit }}</span>
              </div>
              <div class="metric-formula">&sigma; = (P - O) / 6</div>
            </div>

            <div class="metric-box info">
              <div class="metric-title">
                方差 (V = &sigma;<sup>2</sup>)
                <el-tooltip
                  content="多任务串联汇总的核心依据：V = ((P - O) / 6)²。多任务汇总时不能直接加标准差，必须相加方差后再开方！"
                  placement="top"
                >
                  <el-icon class="info-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
              <div class="metric-value">
                {{ formatNum(taskResult.variance, currentPrecision) }} <span class="unit">{{ currentUnit }}²</span>
              </div>
              <div class="metric-formula">V = &sigma;² = ((P - O) / 6)²</div>
            </div>
          </div>

          <!-- 工期区间分布可视化标尺 -->
          <div class="distribution-timeline">
            <div class="timeline-title">三点估算分布与工期跨度</div>
            <div class="timeline-bar">
              <!-- 上方：PERT 期望工期 Te 指示器与悬浮徽标 -->
              <div class="te-indicator" :style="{ left: tePercent + '%' }">
                <el-tooltip
                  :content="`期望工期 (Te): ${formatNum(taskResult.te, currentPrecision)} ${currentUnit}，综合三点加权期望值`"
                  placement="top"
                >
                  <div class="te-badge">
                    <span class="te-label">期望工期</span>
                    <span class="te-tag">T<sub>e</sub>: {{ formatNum(taskResult.te, currentPrecision) }}</span>
                  </div>
                </el-tooltip>
                <div class="te-arrow"></div>
              </div>

              <!-- 下方：三点基础估算参数 O, M, P 标尺节点 -->
              <div class="bar-point o-point" :style="{ left: '0%' }">
                <el-tooltip :content="`乐观工时 (O): ${form.o} ${currentUnit}（顺利无阻态）`" placement="bottom">
                  <div class="point-content">
                    <div class="marker"></div>
                    <div class="tag">O: {{ form.o }}</div>
                    <div class="label">乐观基线</div>
                  </div>
                </el-tooltip>
              </div>

              <div class="bar-point m-point" :style="{ left: mPercent + '%' }">
                <el-tooltip :content="`最可能工时 (M): ${form.m} ${currentUnit}（基准常见态）`" placement="bottom">
                  <div class="point-content">
                    <div class="marker"></div>
                    <div class="tag">M: {{ form.m }}</div>
                    <div class="label">最可能</div>
                  </div>
                </el-tooltip>
              </div>

              <div class="bar-point p-point" :style="{ left: '100%' }">
                <el-tooltip :content="`悲观工时 (P): ${form.p} ${currentUnit}（最坏遭遇态）`" placement="bottom">
                  <div class="point-content">
                    <div class="marker"></div>
                    <div class="tag">P: {{ form.p }}</div>
                    <div class="label">最坏悲观</div>
                  </div>
                </el-tooltip>
              </div>

              <div class="track-bg"></div>
              <div class="track-active" :style="{ left: '0%', width: '100%' }"></div>
            </div>
          </div>

          <!-- 风险与统计区间卡片 -->
          <div class="confidence-summary">
            <div class="summary-row">
              <span class="label">不确定性变异系数 (CV = &sigma; / T<sub>e</sub>):</span>
              <span class="value font-mono">{{ formatNum(taskResult.cv, 1) }}%</span>
              <span class="hint">（{{ taskResult.riskDescription }}）</span>
            </div>

            <div class="interval-cards">
              <div class="interval-card">
                <div class="interval-header">
                  <span class="name">68.27% 置信区间 (±1&sigma;)</span>
                  <span class="prob">单侧最晚按期率: 84.1%</span>
                </div>
                <div class="interval-range">
                  {{ formatNum(Math.max(0, taskResult.te - taskResult.sd), currentPrecision) }} ~
                  {{ formatNum(taskResult.te + taskResult.sd, currentPrecision) }} {{ currentUnit }}
                </div>
              </div>

              <div class="interval-card">
                <div class="interval-header">
                  <span class="name">95.45% 置信区间 (±2&sigma;)</span>
                  <span class="prob">单侧最晚按期率: 97.7%</span>
                </div>
                <div class="interval-range">
                  {{ formatNum(Math.max(0, taskResult.te - 2 * taskResult.sd), currentPrecision) }} ~
                  {{ formatNum(taskResult.te + 2 * taskResult.sd, currentPrecision) }} {{ currentUnit }}
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
import { computed, reactive, ref, watch } from 'vue'
import { TrendCharts, DataAnalysis, QuestionFilled } from '@element-plus/icons-vue'
import { calculateSingleTask, formatNum } from '../utils/pert'

const props = defineProps({
  unit: {
    type: String,
    default: '人天 (d)'
  },
  precision: {
    type: Number,
    default: 2
  }
})

const currentUnit = ref(props.unit)
const currentPrecision = ref(props.precision)

watch(
  () => props.unit,
  val => {
    currentUnit.value = val
  }
)
watch(
  () => props.precision,
  val => {
    currentPrecision.value = val
  }
)

const form = reactive({
  weightMode: 'beta',
  customWeight: 4,
  o: 2,
  m: 4,
  p: 8
})

// 输入不允许是空，如果输入是空则置为 0
watch(
  () => [form.o, form.m, form.p],
  ([o, m, p]) => {
    if (o === null || o === undefined || o === '') {
      form.o = 0
    }
    if (m === null || m === undefined || m === '') {
      form.m = 0
    }
    if (p === null || p === undefined || p === '') {
      form.p = 0
    }
  }
)

const taskResult = computed(() => {
  return calculateSingleTask(
    {
      o: form.o,
      m: form.m,
      p: form.p,
      weightMode: form.weightMode,
      customWeight: form.customWeight
    },
    {
      defaultWeightMode: form.weightMode,
      defaultCustomWeight: form.customWeight
    }
  )
})

const mPercent = computed(() => {
  const span = form.p - form.o
  if (span <= 0) return 50
  const pct = ((form.m - form.o) / span) * 100
  return Math.min(95, Math.max(5, pct))
})

const tePercent = computed(() => {
  const span = form.p - form.o
  if (span <= 0) return 50
  const pct = ((taskResult.value.te - form.o) / span) * 100
  return Math.min(95, Math.max(5, pct))
})

const resetToDefault = () => {
  form.weightMode = 'beta'
  form.customWeight = 4
  form.o = 2
  form.m = 4
  form.p = 8
}
</script>

<style scoped>
.single-task-calc {
  margin-top: 8px;
}

.calc-card,
.result-card {
  margin-bottom: 20px;
  border-radius: 8px;
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
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-icon {
  color: var(--el-color-primary);
  font-size: 18px;
}

.custom-weight-row {
  display: flex;
  align-items: center;
  width: 100%;
}

.weight-tag {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-primary);
  white-space: nowrap;
}

.formula-preview-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.points-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 12px;
}

@media (max-width: 640px) {
  .points-grid {
    grid-template-columns: 1fr;
  }
}

.point-item {
  padding: 12px;
  border-radius: 6px;
  background-color: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.point-item.optimistic {
  border-top: 3px solid #67c23a;
}

.point-item.most-likely {
  border-top: 3px solid #409eff;
}

.point-item.pessimistic {
  border-top: 3px solid #f56c6c;
}

.point-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.point-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.info-icon {
  color: var(--el-text-color-secondary);
  cursor: pointer;
  font-size: 14px;
}

.full-width {
  width: 100%;
}

.point-hint {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  text-align: right;
}

.validation-alert {
  margin-top: 14px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}

@media (max-width: 640px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}

.metric-box {
  padding: 16px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-box.primary {
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
}

.metric-box.warning {
  background: var(--el-color-warning-light-9);
  border: 1px solid var(--el-color-warning-light-7);
}

.metric-box.info {
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color);
}

.metric-title {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  font-family: var(--el-font-family);
  color: var(--el-text-color-primary);
}

.metric-value .unit {
  font-size: 12px;
  font-weight: normal;
  color: var(--el-text-color-secondary);
  margin-left: 2px;
}

.metric-formula {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  font-family: monospace;
}

.distribution-timeline {
  background-color: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 16px 20px 20px;
  margin-bottom: 20px;
}

.timeline-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 18px;
}

.timeline-bar {
  position: relative;
  height: 96px;
  margin: 0 35px 8px 35px;
}

.track-bg {
  position: absolute;
  top: 32px;
  left: 0;
  right: 0;
  height: 6px;
  background-color: var(--el-border-color-lighter);
  border-radius: 3px;
}

.track-active {
  position: absolute;
  top: 32px;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #67c23a 0%, #409eff 50%, #f56c6c 100%);
  border-radius: 3px;
}

/* 顶部 Te 期望工期指示器 */
.te-indicator {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 4;
}

.te-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 9px;
  background-color: #fdf6ec;
  border: 1px solid #e6a23c;
  border-radius: 12px;
  font-size: 11px;
  line-height: 18px;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(230, 162, 60, 0.2);
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.te-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(230, 162, 60, 0.3);
}

.te-badge .te-label {
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.te-badge .te-tag {
  color: #b88230;
  font-weight: 700;
}

html.dark .te-badge {
  background-color: rgba(230, 162, 60, 0.15);
  border-color: rgba(230, 162, 60, 0.5);
}

html.dark .te-badge .te-label {
  color: var(--el-text-color-regular);
}

html.dark .te-badge .te-tag {
  color: #e6a23c;
}

.te-arrow {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid #e6a23c;
  margin-top: 1px;
}

/* 标尺节点样式（O, M, P）位于轨道及下方 */
.bar-point {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  z-index: 3;
}

.point-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.point-content .marker {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
  margin-top: 29px;
  transition: transform 0.15s ease;
}

.point-content:hover .marker {
  transform: scale(1.2);
}

.o-point .marker {
  background-color: #67c23a;
}

.m-point .marker {
  background-color: #409eff;
}

.p-point .marker {
  background-color: #f56c6c;
}

.point-content .tag {
  font-size: 12px;
  font-weight: bold;
  line-height: 1.4;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  margin-top: 6px;
}

.point-content .label {
  font-size: 11px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  margin-top: 2px;
}

.confidence-summary {
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 16px;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.summary-row .label {
  color: var(--el-text-color-secondary);
}

.summary-row .value {
  font-weight: 700;
  color: var(--el-color-primary);
}

.summary-row .hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.interval-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 640px) {
  .interval-cards {
    grid-template-columns: 1fr;
  }
}

.interval-card {
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 10px 14px;
}

.interval-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 6px;
}

.interval-header .name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.interval-header .prob {
  color: var(--el-color-success);
}

.interval-range {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-color-primary);
  font-family: var(--el-font-family);
}

.steps-detail {
  margin-top: 16px;
  padding: 14px 16px;
  background-color: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.steps-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}

.step-line {
  font-size: 13px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}

.font-mono {
  font-family: monospace;
}
</style>
