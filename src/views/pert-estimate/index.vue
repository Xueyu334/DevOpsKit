<template>
  <div class="pert-estimate-container">
    <!-- 主功能 Tabs 区域 -->
    <el-tabs v-model="activeTab" class="main-tabs" type="border-card">
      <!-- Tab 1: 单任务快速测算器 -->
      <el-tab-pane label="单任务快速测算器 (Quick Calc)" name="single">
        <SingleTaskCalculator :unit="unit" :precision="precision" />
      </el-tab-pane>

      <!-- Tab 2: 多任务项目评估表 (WBS 工作台) -->
      <el-tab-pane label="多任务项目评估表 (WBS 工作台)" name="multi">
        <MultiTaskCalculator v-model:unit="unit" v-model:precision="precision" />
      </el-tab-pane>

      <!-- Tab 3: 原理指南与公式解析 -->
      <el-tab-pane label="算法原理解析与常见疑问 (Guide)" name="guide">
        <PertFormulaGuide />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SingleTaskCalculator from './components/SingleTaskCalculator.vue'
import MultiTaskCalculator from './components/MultiTaskCalculator.vue'
import PertFormulaGuide from './components/PertFormulaGuide.vue'

const activeTab = ref('single')
const unit = ref('人天 (d)')
const precision = ref(2)
</script>

<style scoped>
.pert-estimate-container {
  padding: 20px;
  max-width: 1560px;
  margin: 0 auto;
}

.main-tabs {
  border-radius: 8px;
  overflow: hidden;
}
</style>
