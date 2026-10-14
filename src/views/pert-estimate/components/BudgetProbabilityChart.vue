<script setup>
import PertChart from './PertChart.vue'
import { createProbabilityOption } from '../utils/chart-options'

const props = defineProps({
  aggregate: { type: Object, required: true },
  targetEffort: { type: Number, default: 0 },
  unit: { type: String, required: true },
  precision: { type: Number, required: true }
})
const option = computed(() => createProbabilityOption(props.aggregate, props.targetEffort, props.unit, props.precision))
</script>

<template>
  <div class="budget-chart">
    <h4 class="chart-title">预算达成概率曲线</h4>
    <p class="chart-description">横轴为总工作量预算，纵轴为总工作量不超过预算的概率；红点与上方目标输入联动。</p>
    <template v-if="aggregate.validCount > 0">
      <PertChart :option="option" label="工作量预算与达成概率曲线，含当前预算和概率参考点" />
      <p class="chart-description">
        {{
          aggregate.totalSd === 0
            ? '当前无估算波动，按现有测算规则展示确定性阶跃结果。'
            : '基于任务独立假设与正态近似，80%、90%、95% 为单侧达成概率参考点。'
        }}
        沿用当前标准差计算口径，不代表严格的三角分布模拟；工作量预算不等同于实际交付日期。
      </p>
    </template>
    <el-empty v-else description="暂无有效任务，无法展示预算达成概率" :image-size="80" />
  </div>
</template>

<style scoped>
.budget-chart {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-light);
}
.chart-title {
  margin: 0 0 12px;
  font-size: 16px;
  color: var(--el-text-color-primary);
}
.chart-description {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}
</style>
