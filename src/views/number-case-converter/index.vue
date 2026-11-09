<script setup>
import { amountToNumber, numberToAmount } from './amount.js'

const mode = ref('upper')
const inputs = reactive({ upper: '1234.56', lower: '人民币壹仟贰佰叁拾肆元伍角陆分' })
const input = computed({
  get: () => inputs[mode.value],
  set: value => (inputs[mode.value] = value)
})
const isUpper = computed(() => mode.value === 'upper')
const conversion = computed(() => {
  if (!input.value.trim()) return { data: null, error: '' }
  try {
    return { data: (isUpper.value ? numberToAmount : amountToNumber)(input.value), error: '' }
  } catch (error) {
    return { data: null, error: error.message }
  }
})
const output = computed(() => {
  const data = conversion.value.data
  return data ? (isUpper.value ? data.upper : data.number) : ''
})
const examples = [
  { label: '整数', number: '100', upper: '壹佰元整', type: 'primary' },
  { label: '角与分', number: '1234.56', upper: '壹仟贰佰叁拾肆元伍角陆分', type: 'success' },
  { label: '中间有零', number: '10001.05', upper: '壹万零壹元零伍分', type: 'warning' },
  { label: '负数', number: '-68.09', upper: '负陆拾捌元零玖分', type: 'info' }
]
const digitPairs = [...'零壹贰叁肆伍陆柒捌玖'].map((upper, number) => ({ upper, number }))

function useExample(example) {
  input.value = isUpper.value ? example.number : example.upper
}

function reverse() {
  const nextMode = isUpper.value ? 'lower' : 'upper'
  inputs[nextMode] = output.value
  mode.value = nextMode
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(output.value)
    ElMessage.success('已复制转换结果')
  } catch {
    ElMessage.error('复制失败，请手动选择结果复制')
  }
}
</script>

<template>
  <div class="number-case-page">
    <header class="page-header">
      <span class="page-icon" aria-hidden="true">壹</span>
      <div>
        <h1>数字大小写转换</h1>
        <p>数字金额与人民币中文大写双向转换，精确到分。</p>
      </div>
    </header>

    <el-card shadow="never" class="converter-card">
      <div class="mode-bar">
        <el-radio-group v-model="mode" aria-label="转换方向">
          <el-radio-button value="upper">数字 → 大写</el-radio-button>
          <el-radio-button value="lower">大写 → 数字</el-radio-button>
        </el-radio-group>
        <el-tag type="success" effect="plain">实时转换 · 本地处理</el-tag>
      </div>

      <el-row :gutter="24">
        <el-col :xs="24" :md="12">
          <el-form label-position="top" @submit.prevent>
            <el-form-item :label="isUpper ? '数字金额（元）' : '中文大写金额'" :error="conversion.error">
              <el-input
                v-model="input"
                type="textarea"
                :rows="5"
                :maxlength="120"
                show-word-limit
                resize="vertical"
                :aria-label="isUpper ? '数字金额（元）' : '中文大写金额'"
                :placeholder="isUpper ? '例如：1234.56 或 1,234.56' : '例如：人民币壹仟贰佰叁拾肆元伍角陆分'"
              />
            </el-form-item>
          </el-form>
          <div class="input-actions">
            <el-button type="danger" plain @click="input = ''">清空</el-button>
            <span class="muted">{{
              isUpper ? '最多 12 位整数、2 位小数，不自动取整' : '支持“人民币”前缀、“圆”和“正”字'
            }}</span>
          </div>
        </el-col>
        <el-col :xs="24" :md="12">
          <section class="result-panel" aria-live="polite" aria-label="转换结果">
            <div class="result-heading">
              <h2>{{ isUpper ? '人民币大写' : '数字金额（元）' }}</h2>
              <span class="result-label">{{ isUpper ? '中文金额' : '保留两位小数' }}</span>
            </div>
            <p v-if="output" class="result-value" :class="{ 'number-value': !isUpper }">{{ output }}</p>
            <p v-else class="result-placeholder">
              {{ conversion.error ? '请修正输入后查看结果' : '输入金额即可查看转换结果' }}
            </p>
            <div class="result-actions">
              <el-button type="primary" :disabled="!output" @click="copyResult">复制结果</el-button>
              <el-button :disabled="!output" @click="reverse">反向转换</el-button>
            </div>
          </section>
        </el-col>
      </el-row>

      <div class="examples">
        <span class="muted">试一试</span>
        <el-space wrap>
          <el-button
            v-for="example in examples"
            :key="example.number"
            :type="example.type"
            plain
            @click="useExample(example)"
          >
            {{ example.label }} · {{ example.number }}
          </el-button>
        </el-space>
      </div>
    </el-card>

    <el-card shadow="never" class="guide-card">
      <template #header><h2>工具介绍及使用方法</h2></template>
      <p>
        选择转换方向并输入金额，即可实时获得结果。点击“反向转换”可将当前结果填入另一个方向，点击“复制结果”可复制完整金额。
      </p>
      <div class="digit-reference">
        <div v-for="pair in digitPairs" :key="pair.number" class="digit-pair">
          <span>{{ pair.number }}</span>
          <strong>{{ pair.upper }}</strong>
        </div>
      </div>
      <ul>
        <li>支持范围：-999,999,999,999.99 至 999,999,999,999.99 元。小写输入可带规范千分位、¥ 或 RMB 前缀。</li>
        <li>金额最多两位小数，超过时提示修改；整数和只有角的金额补“整”，有分时不加“整”。</li>
        <li>大写转数字须包含“元”或“圆”，使用完整位值和大写数字，例如“壹仟零壹元整”；不解析“一千元”等口语写法。</li>
        <li>负数以“负”表示，负零统一显示为零。</li>
      </ul>
      <p class="muted">
        大写数字及“整”的写法参考
        <el-link
          href="https://www.mof.gov.cn/gp/xxgkml/tfs/201903/t20190318_3195239.htm"
          target="_blank"
          rel="noopener noreferrer"
          type="primary"
        >
          财政部《会计基础工作规范》 </el-link
        >。
      </p>
    </el-card>
  </div>
</template>

<style scoped>
.number-case-page {
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

.page-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 18px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  font-size: 28px;
  font-weight: 700;
}

h1 {
  margin: 0 0 6px;
  font-size: 24px;
}

h2 {
  margin: 0;
  font-size: 17px;
}

.page-header p,
.muted {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.8;
}

.converter-card,
.guide-card {
  border-radius: 14px;
}

.mode-bar,
.input-actions,
.examples,
.result-heading,
.result-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.mode-bar {
  justify-content: space-between;
  margin-bottom: 24px;
}

.input-actions {
  margin-top: 26px;
}

.result-panel {
  min-height: 230px;
  box-sizing: border-box;
  padding: 24px;
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 14px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-bg-color));
}

.result-heading {
  justify-content: space-between;
}

.result-label {
  color: var(--el-color-primary);
  font-size: 12px;
}

.result-value,
.result-placeholder {
  min-height: 74px;
  margin: 22px 0;
  overflow-wrap: anywhere;
  line-height: 1.7;
}

.result-value {
  color: var(--el-text-color-primary);
  font-size: 23px;
  font-weight: 600;
  user-select: all;
}

.number-value {
  color: var(--el-color-primary);
  font-size: 30px;
  font-variant-numeric: tabular-nums;
}

.result-placeholder {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.result-actions .el-button + .el-button {
  margin-left: 0;
}

.examples {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px dashed var(--el-border-color);
}

.guide-card {
  margin-top: 20px;
  line-height: 1.9;
}

.guide-card ul {
  padding-left: 20px;
}

.digit-reference {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 8px;
  margin: 20px 0;
}

.digit-pair {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 0;
  border-radius: 10px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  font-size: 13px;
}

.digit-pair strong {
  color: var(--el-color-primary);
  font-size: 20px;
}

@media (max-width: 991px) {
  .result-panel {
    margin-top: 24px;
  }
}

@media (max-width: 767px) {
  .number-case-page {
    padding: 12px;
  }

  .digit-reference {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
</style>
