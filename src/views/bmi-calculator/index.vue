<script setup>
import { bmiCategories, calculateBmi } from './bmi.js'

const form = reactive({ height: undefined, weight: undefined })
const submitted = ref(false)
const result = ref(null)
const calculationError = ref('')
const fields = [
  { key: 'height', label: '身高', unit: 'cm', placeholder: '例如：178' },
  { key: 'weight', label: '体重', unit: 'kg', placeholder: '例如：78' }
]
const errors = computed(() =>
  Object.fromEntries(
    fields.map(field => [
      field.key,
      submitted.value && (!Number.isFinite(form[field.key]) || form[field.key] <= 0)
        ? `请输入大于 0 的有效${field.label}`
        : ''
    ])
  )
)

watch(
  form,
  () => {
    result.value = null
    calculationError.value = ''
  },
  { flush: 'sync' }
)

function calculate() {
  submitted.value = true
  result.value = null
  calculationError.value = ''
  if (Object.values(errors.value).some(Boolean)) return
  try {
    result.value = calculateBmi(form.height, form.weight)
  } catch (error) {
    calculationError.value = error.message
  }
}

function clear() {
  form.height = undefined
  form.weight = undefined
  submitted.value = false
  result.value = null
  calculationError.value = ''
}
</script>

<template>
  <div class="bmi-page">
    <header class="page-header">
      <span class="bmi-icon" aria-hidden="true">BMI</span>
      <div>
        <h1>BMI 计算</h1>
        <p>输入身高与体重，了解你的体质指数。</p>
      </div>
    </header>

    <el-card shadow="never" class="calculator-card">
      <div class="calculator-content">
        <h2>BMI 指数中国标准</h2>
        <p class="standard-note">适用于 18 岁及以上成人 · 单位：kg/m²</p>
        <table class="standard-table">
          <thead>
            <tr>
              <th scope="col">身体状态</th>
              <th scope="col">BMI 范围</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="category in bmiCategories"
              :key="category.id"
              :class="[category.id, { selected: result?.category.id === category.id }]"
            >
              <th scope="row">{{ category.label }}</th>
              <td>{{ category.range }}</td>
            </tr>
          </tbody>
        </table>

        <el-form :model="form" label-position="top" class="bmi-form" @submit.prevent="calculate">
          <el-form-item
            v-for="field in fields"
            :key="field.key"
            :label="`${field.label}（${field.unit}）`"
            :error="errors[field.key]"
          >
            <el-input-number
              v-model="form[field.key]"
              :controls="false"
              :placeholder="field.placeholder"
              :aria-label="`${field.label}（${field.unit}）`"
              size="large"
            >
              <template #suffix>{{ field.unit }}</template>
            </el-input-number>
          </el-form-item>
          <div class="form-actions">
            <el-button type="primary" native-type="submit" size="large">开始计算</el-button>
            <el-button size="large" @click="clear">清空</el-button>
          </div>
        </el-form>

        <div class="result-area" role="status" aria-live="polite">
          <template v-if="result">
            <span>你的 BMI 指数为：</span>
            <strong>{{ result.value.toFixed(2) }}</strong>
            <el-tag :type="result.category.type" size="large">{{ result.category.label }}</el-tag>
            <p class="rounding-note">显示值保留两位小数，分类按未四舍五入的 BMI 判断。</p>
          </template>
          <el-text v-else-if="calculationError" type="danger">{{ calculationError }}</el-text>
          <span v-else class="result-placeholder">输入身高和体重后，点击“开始计算”查看结果</span>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="guide-card">
      <template #header><h2>工具介绍及使用方法</h2></template>
      <p>
        BMI（体质指数）通过体重与身高的比例，帮助评估体重状况。使用本工具可以快速计算
        BMI，并根据中国成人标准了解体重分类。
      </p>
      <ol>
        <li>输入身高（厘米）和体重（千克），支持小数。1 千克 = 2 斤。</li>
        <li>点击“开始计算”或按回车键，查看 BMI 数值与对应分类。</li>
        <li>点击“清空”可清除输入和计算结果。</li>
      </ol>
      <p class="formula">计算公式：BMI = 体重（kg）÷ 身高（m）²</p>
      <p class="standard-note">
        BMI 是体重筛查指标，不能单独用于诊断，也不能区分肌肉和脂肪。儿童、青少年和孕妇不适用本页成人分类。 标准参考：
        <el-link
          href="https://www.nhc.gov.cn/wjw/c100378/202412/f3f58b54fbeb4c87b14164fac898bf08/files/1736390749000_59785.pdf"
          target="_blank"
          rel="noopener noreferrer"
          type="primary"
        >
          国家卫生健康委《体重管理指导原则（2024 年版）》
        </el-link>
      </p>
    </el-card>
  </div>
</template>

<style scoped>
.bmi-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.bmi-icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
  font-weight: 700;
}

h1 {
  margin: 0 0 6px;
  font-size: 24px;
}

h2 {
  margin: 0;
  font-size: 18px;
}

.page-header p,
.standard-note {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.8;
}

.calculator-card,
.guide-card {
  border-radius: 12px;
}

.calculator-content {
  max-width: 500px;
  margin: 16px auto 0;
  text-align: center;
}

.calculator-content > .standard-note {
  margin-top: 8px;
}

.standard-table {
  width: 100%;
  margin: 12px 0 32px;
  border-collapse: collapse;
  font-size: 15px;
}

.standard-table th,
.standard-table td {
  width: 50%;
  height: 56px;
  padding: 8px;
  box-sizing: border-box;
  font-weight: 400;
}

.underweight {
  background: var(--el-color-primary-light-9);
}

.normal {
  background: var(--el-color-success-light-9);
}

.overweight {
  background: var(--el-color-warning-light-9);
}

.obese {
  background: var(--el-color-danger-light-9);
}

.selected {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -2px;
  font-weight: 600;
}

.bmi-form {
  max-width: 300px;
  margin: 0 auto;
}

.bmi-form .el-input-number {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: center;
}

.result-area {
  min-height: 78px;
  margin-top: 28px;
  color: var(--el-text-color-regular);
}

.result-area strong {
  margin-right: 12px;
  font-size: 26px;
  color: var(--el-color-primary);
  font-variant-numeric: tabular-nums;
}

.rounding-note,
.result-placeholder {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.guide-card {
  margin-top: 20px;
  line-height: 1.9;
}

.guide-card p {
  margin: 0 0 12px;
}

.guide-card ol {
  padding-left: 22px;
}

.formula {
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
}

@media (max-width: 767px) {
  .bmi-page {
    padding: 12px;
  }
}
</style>
