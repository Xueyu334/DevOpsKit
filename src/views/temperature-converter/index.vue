<script setup>
import { convertTemperature, temperatureUnits } from './temperature.js'

const input = ref('0')
const sourceId = ref('celsius')
const precision = ref(4)
const sourceUnit = computed(() => temperatureUnits.find(unit => unit.id === sourceId.value))
const conversion = computed(() => {
  const text = input.value.trim()
  if (!text) return { results: [], error: '' }
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) {
    return { results: [], error: '请输入有效数字，支持负数、小数和科学计数法' }
  }
  try {
    return { results: convertTemperature(Number(text), sourceId.value), error: '' }
  } catch (error) {
    return { results: [], error: error.message }
  }
})
const presets = [
  { label: '绝对零度', value: '-273.15', type: 'info' },
  { label: '冰点 · 0 °C', value: '0', type: 'primary' },
  { label: '室温 · 25 °C', value: '25', type: 'success' },
  { label: '沸点 · 100 °C', value: '100', type: 'warning' }
]

function applyPreset(value) {
  sourceId.value = 'celsius'
  input.value = value
}

function formatTemperature(value) {
  return String(Number(value.toFixed(precision.value)))
}
</script>

<template>
  <div class="temperature-page">
    <header class="page-header">
      <span class="temperature-icon" aria-hidden="true">°C</span>
      <div>
        <h1>温度转换</h1>
        <p>摄氏度、华氏度、开尔文、兰氏度、列氏度，一次输入同步换算。</p>
      </div>
    </header>

    <el-card shadow="never" class="converter-card">
      <template #header><h2>温度换算器</h2></template>
      <el-form label-position="top" @submit.prevent>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="8">
            <el-form-item label="输入单位">
              <el-select v-model="sourceId" aria-label="输入单位" size="large">
                <el-option
                  v-for="unit in temperatureUnits"
                  :key="unit.id"
                  :value="unit.id"
                  :label="`${unit.name}（${unit.symbol}）`"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="10">
            <el-form-item label="温度数值" :error="conversion.error">
              <el-input
                v-model="input"
                placeholder="请输入温度"
                aria-label="温度数值"
                inputmode="decimal"
                clearable
                size="large"
              >
                <template #suffix>{{ sourceUnit.symbol }}</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="6">
            <el-form-item label="最多保留小数位">
              <el-select v-model="precision" aria-label="最多保留小数位" size="large">
                <el-option v-for="digits in [2, 4, 6, 8]" :key="digits" :label="`${digits} 位`" :value="digits" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <div class="quick-actions">
          <span class="muted">常用温度</span>
          <el-space wrap>
            <el-button
              v-for="preset in presets"
              :key="preset.value"
              :type="preset.type"
              plain
              @click="applyPreset(preset.value)"
            >
              {{ preset.label }}
            </el-button>
            <el-button type="danger" plain @click="input = ''">清空</el-button>
          </el-space>
        </div>
      </el-form>

      <div class="results" aria-live="polite" aria-label="温度换算结果">
        <el-row v-if="conversion.results.length" :gutter="16">
          <el-col v-for="result in conversion.results" :key="result.id" :xs="24" :sm="12" :lg="8">
            <div
              class="result-card"
              :class="[result.id, { 'source-result': result.id === sourceId }]"
              :data-symbol="result.symbol"
            >
              <div class="result-heading">
                <h3>{{ result.name }}</h3>
                <span v-if="result.id === sourceId" class="source-badge">输入单位</span>
              </div>
              <span class="english-name">{{ result.english }}</span>
              <p class="result-value">
                <strong>{{ formatTemperature(result.value) }}</strong>
                <span>{{ result.symbol }}</span>
              </p>
            </div>
          </el-col>
        </el-row>
        <el-empty
          v-else
          :description="conversion.error ? '请修正输入后查看换算结果' : '输入温度即可查看五种换算结果'"
          :image-size="80"
        />
      </div>
      <p class="muted result-note">结果按所选小数位四舍五入并省略末尾的 0；输入单位的数值也按此精度显示。</p>
    </el-card>

    <el-card shadow="never" class="guide-card">
      <template #header><h2>工具介绍及使用方法</h2></template>
      <p>
        选择原始单位并输入温度，系统会实时计算五种温标的对应值。切换单位时，当前输入数字保持不变，按新单位重新换算。
      </p>
      <p>支持负数、小数和科学计数法；点击常用温度可快速填入示例，点击“清空”可清除输入和所有结果。</p>
      <h3>换算公式</h3>
      <p class="muted">下表中 C 表示摄氏温度数值。换算其他单位时，先换算为摄氏度，再应用对应公式。</p>
      <el-table :data="temperatureUnits" class="formula-table">
        <el-table-column prop="name" label="温标" min-width="170" />
        <el-table-column prop="symbol" label="符号" width="80" />
        <el-table-column prop="formula" label="从摄氏度换算" min-width="220" />
        <el-table-column label="绝对零度" min-width="150">
          <template #default="{ row }">{{ row.min }} {{ row.symbol }}</template>
        </el-table-column>
      </el-table>
      <p class="muted guide-note">
        开尔文使用 K，不带度符号；兰氏度（Rankine）使用 °R，列氏度（Réaumur）使用 °Ré。
        冰点与沸点按钮采用常用标准大气压下的近似参考值。本工具用于温度值换算，不适用于温差换算。
      </p>
    </el-card>
  </div>
</template>

<style scoped>
.temperature-page {
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

.temperature-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 18px;
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
  font-size: 24px;
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
.muted,
.english-name {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.8;
}

.converter-card,
.guide-card {
  border-radius: 12px;
}

.quick-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}

.results {
  margin-top: 28px;
}

.result-card {
  --card-accent: var(--el-color-primary);
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: 24px;
  margin-bottom: 16px;
  border: 1px solid color-mix(in srgb, var(--card-accent) 24%, var(--el-border-color-light));
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--card-accent) 10%, var(--el-bg-color)),
    var(--el-bg-color)
  );
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.result-card::before {
  content: '';
  display: block;
  width: 28px;
  height: 4px;
  margin-bottom: 18px;
  border-radius: 4px;
  background: var(--card-accent);
}

.result-card::after {
  content: attr(data-symbol);
  position: absolute;
  z-index: -1;
  right: -8px;
  bottom: -24px;
  color: var(--card-accent);
  opacity: 0.07;
  font-size: 116px;
  font-weight: 800;
  line-height: 1.2;
  transform: rotate(-12deg);
  pointer-events: none;
}

.fahrenheit {
  --card-accent: var(--el-color-warning);
}

.kelvin {
  --card-accent: var(--el-color-success);
}

.rankine {
  --card-accent: var(--el-color-danger);
}

.reaumur {
  --card-accent: #a078da;
}

.source-result {
  border-color: var(--card-accent);
  box-shadow: inset 0 0 0 1px var(--card-accent);
}

.source-badge {
  padding: 1px 8px;
  border-radius: 20px;
  background: color-mix(in srgb, var(--card-accent) 12%, var(--el-bg-color));
  color: var(--el-text-color-primary);
  border: 1px solid color-mix(in srgb, var(--card-accent) 35%, transparent);
  font-size: 11px;
  line-height: 18px;
}

.result-heading {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.result-heading h3 {
  margin: 0;
  font-size: 15px;
}

.result-value {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 22px 0 0;
  color: var(--el-text-color-secondary);
}

.result-value strong {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums;
  color: color-mix(in srgb, var(--card-accent) 65%, var(--el-text-color-primary));
}

@media (hover: hover) {
  .result-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px color-mix(in srgb, var(--card-accent) 14%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .result-card {
    transition: none;
  }

  .result-card:hover {
    transform: none;
  }
}

.result-note {
  margin-top: 4px;
}

.guide-card {
  margin-top: 20px;
  line-height: 1.9;
}

.guide-card p {
  margin-top: 0;
}

.guide-card h3 {
  margin: 20px 0 8px;
  font-size: 15px;
}

.formula-table {
  margin: 12px 0 16px;
}

.guide-card .guide-note {
  margin-bottom: 0;
}

@media (max-width: 767px) {
  .temperature-page {
    padding: 12px;
  }
}
</style>
