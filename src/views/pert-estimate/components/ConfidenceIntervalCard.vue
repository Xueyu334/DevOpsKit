<template>
  <div class="confidence-interval-card">
    <el-card shadow="hover" class="box-card">
      <template #header>
        <div class="card-header">
          <div class="title-wrap">
            <el-icon class="header-icon"><TrendCharts /></el-icon>
            <span class="header-title">项目交付置信度预测与承诺概率测算</span>
          </div>
          <el-tag type="success" effect="plain" round> 基于中心极限定理与正态分布 </el-tag>
        </div>
      </template>

      <!-- 核心重点说明：方差合成法则与直接相加的对比 -->
      <div class="variance-principle-banner">
        <el-alert type="info" :closable="false" show-icon>
          <template #title>
            <span class="banner-title">多任务串联汇总的核心统计学法则：标准差不可直接累加！</span>
          </template>
          <template #default>
            <div class="banner-body">
              <p>
                在多任务估算汇总时，由于各个任务面临的技术风险和不确定性是相互独立的，因此<strong>绝对不能直接将各任务的标准差相加（&sum;&sigma;）</strong>，而必须<strong
                  >先将各任务的方差相加（&sum;V），再取平方根（&sigma;<sub>total</sub> = &radic;&sum;V）</strong
                >。
              </p>
              <div class="comparison-pills">
                <div class="pill correct">
                  <span class="pill-label">科学方差合成标准差 (&sigma;<sub>total</sub>):</span>
                  <span class="pill-value font-mono">{{ formatNum(aggregate.totalSd, precision) }} {{ unit }}</span>
                  <el-tag size="small" type="success" effect="dark">科学正态</el-tag>
                </div>
                <div class="pill wrong">
                  <span class="pill-label">错误直接相加标准差 (&sum;&sigma;<sub>i</sub>):</span>
                  <span class="pill-value font-mono">{{ formatNum(aggregate.directSdSum, precision) }} {{ unit }}</span>
                  <el-tag size="small" type="danger" effect="plain">过度虚高</el-tag>
                </div>
                <div class="pill diff" v-if="aggregate.sdOverestimate > 0">
                  <span class="pill-label">风险分散抵消收益:</span>
                  <span class="pill-value font-mono"
                    >-{{ formatNum(aggregate.sdOverestimate, precision) }} {{ unit }} (-{{
                      formatNum(aggregate.sdOverestimateRatio, 1)
                    }}%)</span
                  >
                  <span class="pill-tip">（直接相加会高估风险缓冲）</span>
                </div>
              </div>
            </div>
          </template>
        </el-alert>
      </div>

      <el-row :gutter="20" class="content-row">
        <!-- 左侧：置信区间三档看板 -->
        <el-col :xs="24" :lg="14">
          <div class="intervals-container">
            <h4 class="section-title">
              <el-icon><Calendar /></el-icon>
              交付工期置信区间阶梯预测
            </h4>

            <div class="interval-tier tier-1">
              <div class="tier-badge">
                <span class="sigma-name">±1&sigma; (68.27% 双侧区间)</span>
                <span class="prob-tag">单侧按期率: 84.13%</span>
              </div>
              <div class="tier-content">
                <div class="tier-range">
                  <span class="range-val">{{ formatNum(aggregate.confidenceIntervals.oneSigma.min, precision) }}</span>
                  <span class="range-sep">至</span>
                  <span class="range-val">{{ formatNum(aggregate.confidenceIntervals.oneSigma.max, precision) }}</span>
                  <span class="unit-text">{{ unit }}</span>
                </div>
                <p class="tier-desc">
                  有约 84.1% 的概率在
                  <strong>{{ formatNum(aggregate.confidenceIntervals.oneSigma.max, precision) }} {{ unit }}</strong>
                  内交付，适合一般常规迭代计划。
                </p>
              </div>
            </div>

            <div class="interval-tier tier-2">
              <div class="tier-badge">
                <span class="sigma-name">±2&sigma; (95.45% 双侧区间)</span>
                <span class="prob-tag">单侧按期率: 97.72%</span>
              </div>
              <div class="tier-content">
                <div class="tier-range">
                  <span class="range-val">{{ formatNum(aggregate.confidenceIntervals.twoSigma.min, precision) }}</span>
                  <span class="range-sep">至</span>
                  <span class="range-val">{{ formatNum(aggregate.confidenceIntervals.twoSigma.max, precision) }}</span>
                  <span class="unit-text">{{ unit }}</span>
                </div>
                <p class="tier-desc">
                  有约 97.7% 的概率在
                  <strong>{{ formatNum(aggregate.confidenceIntervals.twoSigma.max, precision) }} {{ unit }}</strong>
                  内交付，适合外部合同或对齐重要发版节点。
                </p>
              </div>
            </div>

            <div class="interval-tier tier-3">
              <div class="tier-badge">
                <span class="sigma-name">±3&sigma; (99.73% 双侧区间)</span>
                <span class="prob-tag">单侧按期率: 99.87%</span>
              </div>
              <div class="tier-content">
                <div class="tier-range">
                  <span class="range-val">{{
                    formatNum(aggregate.confidenceIntervals.threeSigma.min, precision)
                  }}</span>
                  <span class="range-sep">至</span>
                  <span class="range-val">{{
                    formatNum(aggregate.confidenceIntervals.threeSigma.max, precision)
                  }}</span>
                  <span class="unit-text">{{ unit }}</span>
                </div>
                <p class="tier-desc">
                  有约 99.9% 的极高置信度在
                  <strong>{{ formatNum(aggregate.confidenceIntervals.threeSigma.max, precision) }} {{ unit }}</strong>
                  内完工，几乎排除所有技术逾期风险。
                </p>
              </div>
            </div>
          </div>
        </el-col>

        <!-- 右侧：承诺工期概率计算小工具 -->
        <el-col :xs="24" :lg="10">
          <div class="probability-tool-box">
            <h4 class="section-title">
              <el-icon><Opportunity /></el-icon>
              指定工期达成概率测算器
            </h4>

            <div class="calc-panel">
              <div class="input-group">
                <span class="input-label">拟定承诺或计划交付工期:</span>
                <el-input-number
                  v-model="targetEffort"
                  :min="0"
                  :step="1"
                  :precision="precision"
                  controls-position="right"
                  class="full-width"
                />
              </div>

              <div class="quick-preset-buttons">
                <span class="preset-label">快捷设为：</span>
                <el-button size="small" @click="targetEffort = Number(aggregate.totalTe.toFixed(precision))">
                  期望值 Te (50%)
                </el-button>
                <el-button
                  size="small"
                  @click="targetEffort = Number(aggregate.confidenceIntervals.oneSigma.max.toFixed(precision))"
                >
                  +1&sigma; (84%)
                </el-button>
                <el-button
                  size="small"
                  @click="targetEffort = Number(aggregate.confidenceIntervals.twoSigma.max.toFixed(precision))"
                >
                  +2&sigma; (98%)
                </el-button>
              </div>

              <div class="prob-result-card">
                <div class="prob-header">
                  <span class="title">按期达成概率 (P):</span>
                  <span class="z-score">Z = {{ formatNum(deliveryResult.z, 2) }}</span>
                </div>
                <div class="prob-gauge">
                  <div class="prob-number font-mono" :class="deliveryResult.type">
                    {{ formatNum(deliveryResult.probability, 1) }}%
                  </div>
                  <el-progress
                    :percentage="Number(deliveryResult.probability.toFixed(1))"
                    :status="progressStatus"
                    :stroke-width="12"
                    :show-text="false"
                  />
                </div>
                <div class="prob-advice" :class="deliveryResult.type">
                  <el-icon><InfoFilled /></el-icon>
                  <span>{{ deliveryResult.assessment }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
      <BudgetProbabilityChart
        :aggregate="aggregate"
        :target-effort="targetEffort ?? 0"
        :unit="unit"
        :precision="precision"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { TrendCharts, Calendar, Opportunity, InfoFilled } from '@element-plus/icons-vue'
import { calculateDeliveryProbability, formatNum } from '../utils/pert'
import BudgetProbabilityChart from './BudgetProbabilityChart.vue'

const props = defineProps({
  aggregate: {
    type: Object,
    required: true
  },
  unit: {
    type: String,
    default: '人天 (d)'
  },
  precision: {
    type: Number,
    default: 2
  }
})

// 默认承诺工期设为期望值 + 1 sigma
const targetEffort = ref(0)

// 当 aggregate 的期望值更新时，自动更新 targetEffort（如果初次或在合理范围内）
watch(
  () => props.aggregate.totalTe,
  newTe => {
    if (newTe > 0 && targetEffort.value === 0) {
      targetEffort.value = Number((newTe + props.aggregate.totalSd).toFixed(props.precision))
    }
  },
  { immediate: true }
)

const deliveryResult = computed(() => {
  return calculateDeliveryProbability(props.aggregate.totalTe, props.aggregate.totalSd, targetEffort.value)
})

const progressStatus = computed(() => {
  if (deliveryResult.value.probability < 50) return 'exception'
  if (deliveryResult.value.probability < 80) return 'warning'
  return 'success'
})
</script>

<style scoped>
.confidence-interval-card {
  margin-top: 16px;
}

.box-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  color: var(--el-color-primary);
  font-size: 18px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.variance-principle-banner {
  margin-bottom: 20px;
}

.banner-title {
  font-weight: bold;
  font-size: 14px;
}

.banner-body {
  margin-top: 6px;
  line-height: 1.6;
  font-size: 13px;
}

.comparison-pills {
  display: flex;
  gap: 16px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-light);
  font-size: 12px;
}

.pill.correct {
  border-color: var(--el-color-success-light-5);
  background: var(--el-color-success-light-9);
}

.pill.wrong {
  border-color: var(--el-color-danger-light-5);
  background: var(--el-color-danger-light-9);
}

.pill-label {
  color: var(--el-text-color-secondary);
}

.pill-value {
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.pill-tip {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 14px;
}

.interval-tier {
  padding: 12px 16px;
  border-radius: 8px;
  background-color: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  margin-bottom: 12px;
}

.tier-1 {
  border-left: 4px solid var(--el-color-primary);
}

.tier-2 {
  border-left: 4px solid var(--el-color-success);
}

.tier-3 {
  border-left: 4px solid var(--el-color-warning);
}

.tier-badge {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.sigma-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.prob-tag {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.tier-range {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.range-val {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  font-family: var(--el-font-family);
}

.range-sep {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.unit-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.tier-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.probability-tool-box {
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 16px;
  height: calc(100% - 32px);
}

.calc-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-size: 13px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.full-width {
  width: 100%;
}

.quick-preset-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.preset-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.prob-result-card {
  margin-top: 10px;
  padding: 16px;
  border-radius: 8px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
}

.prob-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.z-score {
  font-family: monospace;
  font-size: 12px;
  background: var(--el-fill-color);
  padding: 2px 6px;
  border-radius: 4px;
}

.prob-gauge {
  margin-bottom: 12px;
}

.prob-number {
  font-size: 32px;
  font-weight: 800;
  text-align: center;
  margin-bottom: 8px;
}

.prob-number.success {
  color: var(--el-color-success);
}

.prob-number.primary {
  color: var(--el-color-primary);
}

.prob-number.warning {
  color: var(--el-color-warning);
}

.prob-number.danger {
  color: var(--el-color-danger);
}

.prob-advice {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  line-height: 1.5;
  padding: 8px 10px;
  border-radius: 6px;
}

.prob-advice.success {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.prob-advice.primary {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.prob-advice.warning {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}

.prob-advice.danger {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.font-mono {
  font-family: monospace;
}
</style>
