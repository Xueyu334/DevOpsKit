<script setup>
import PertChart from './PertChart.vue'
import { createEstimateOption, createVarianceOption, getChartTasks } from '../utils/chart-options'

const props = defineProps({
  aggregate: { type: Object, required: true },
  unit: { type: String, required: true },
  precision: { type: Number, required: true }
})
const validTasks = computed(() => getChartTasks(props.aggregate))
const estimateOption = computed(() => createEstimateOption(validTasks.value, props.unit, props.precision))
const varianceOption = computed(() =>
  createVarianceOption(validTasks.value, props.aggregate.totalVariance, props.unit, props.precision)
)
</script>

<template>
  <el-row :gutter="16" class="task-charts">
    <el-col :xs="24" :lg="12">
      <el-card shadow="hover" class="chart-card">
        <template #header><span class="chart-title">任务三点估算区间</span></template>
        <p class="chart-description">线段表示乐观 O～悲观 P，菱形为最可能 M，圆点为期望 Te；区间颜色对应任务风险。</p>
        <PertChart
          v-if="validTasks.length"
          :option="estimateOption"
          label="各任务乐观至悲观工作量区间、最可能值与期望值"
        />
        <el-empty v-else description="暂无有效任务，请填写满足 O ≤ M ≤ P 的估算值" :image-size="80" />
      </el-card>
    </el-col>
    <el-col :xs="24" :lg="12">
      <el-card shadow="hover" class="chart-card">
        <template #header><span class="chart-title">方差贡献排名</span></template>
        <p class="chart-description">
          按方差从高到低排序，百分比为该任务占总方差的比例；优先关注对汇总不确定性影响大的任务。
        </p>
        <PertChart
          v-if="validTasks.length && aggregate.totalVariance > 0"
          :option="varianceOption"
          label="任务方差及其占总方差的贡献比例排名"
        />
        <el-empty
          v-else
          :description="validTasks.length ? '所有有效任务均无估算波动，暂无方差贡献' : '暂无有效任务'"
          :image-size="80"
        />
      </el-card>
    </el-col>
  </el-row>
</template>

<style scoped>
.task-charts {
  margin-top: 20px;
}
.chart-card {
  margin-bottom: 16px;
  height: calc(100% - 16px);
}
.chart-title {
  font-size: 16px;
  font-weight: 600;
}
.chart-description {
  margin: 0 0 12px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.7;
}
</style>
