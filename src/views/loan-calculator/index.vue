<script setup>
import { calculateLoan, repaymentMethods } from './loan.js'

const form = reactive({
  principal: 100000,
  annualRate: 4.8,
  periods: 36,
  method: 'annuity',
  interestBasis: 'monthly',
  daysPerYear: 365,
  interestRounding: 'halfUp',
  loanDate: '',
  firstPaymentDate: '',
  upfrontFee: 0,
  monthlyFee: 0,
  prepay: false,
  prepayPeriod: 12,
  penaltyRate: 0,
  collectRemainingFees: false
})
const page = ref(1)
const result = computed(() => {
  try {
    return { data: calculateLoan(form), error: '' }
  } catch (error) {
    return { data: null, error: error.message }
  }
})
const method = computed(() => repaymentMethods.find(item => item.value === form.method))
const summary = computed(() => result.value.data?.summary)
const isDaily = computed(() => form.interestBasis === 'daily')
const visibleRows = computed(() => result.value.data?.rows.slice((page.value - 1) * 24, page.value * 24) ?? [])
watch(result, () => (page.value = 1))
watch(
  () => form.method,
  value => {
    if (value === 'flat') form.interestBasis = 'monthly'
  }
)
watch(
  () => form.periods,
  periods => {
    if (Number.isInteger(periods) && periods >= 1) {
      form.prepayPeriod = Math.min(form.prepayPeriod || 1, Math.max(1, periods - 1))
      if (periods === 1) form.prepay = false
    }
  }
)
const money = value => (value / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const percent = value => `${(value * 100).toLocaleString('zh-CN', { maximumFractionDigits: 4 })}%`
const columns = [
  { prop: 'principal', label: '应还本金（元）' },
  { prop: 'interest', label: '利息 / 分期费（元）' },
  { prop: 'fee', label: '固定手续费（元）' },
  { prop: 'penalty', label: '违约金（元）' },
  { prop: 'payment', label: '还款总额（元）' },
  { prop: 'balance', label: '剩余本金（元）' }
]

function exportCsv() {
  const data = result.value.data
  if (!data) return
  const lines = [
    ['还款方式', method.value.label],
    ['计息方式', isDaily.value ? '实际天数计息' : '按月计息'],
    ...(isDaily.value
      ? [
          ['借款日期', form.loanDate],
          ['首次还款日期', form.firstPaymentDate],
          ['年利率折算天数', form.daysPerYear],
          ['利息取整', form.interestRounding === 'down' ? '舍去不足一分' : '四舍五入到分']
        ]
      : []),
    ['贷款总额（元）', form.principal],
    ['年化利率 / 名义年费率（%）', form.annualRate],
    ['原分期数（月）', form.periods],
    ['放款时手续费（元）', form.upfrontFee],
    ['实际到账（元）', money(data.summary.received).replaceAll(',', '')],
    [isDaily.value ? '月等效利率（%）' : '月 IRR（%）', data.summary.monthlyIrr * 100],
    ['单利折算年化（%）', data.summary.nominalApr * 100],
    [isDaily.value ? '实际年化 XIRR（复利，%）' : '实际年化 IRR（复利，%）', data.summary.effectiveApr * 100],
    ['提前结清', form.prepay ? `第 ${form.prepayPeriod} 期正常还款后结清` : '无'],
    ['剩余固定费用', form.collectRemainingFees && form.prepay ? '结清时一次收取' : '免收'],
    [],
    ['期数', ...(isDaily.value ? ['还款日期', '计息天数'] : []), ...columns.map(column => column.label), '备注'],
    ...data.rows.map(row => [
      row.period,
      ...(isDaily.value ? [row.date, row.days] : []),
      ...columns.map(column => (row[column.prop] / 100).toFixed(2)),
      row.settlement ? '提前结清' : ''
    ])
  ]
  const csv = lines.map(line => line.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = '贷款还款计划.csv'
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
</script>

<template>
  <div class="loan-calculator">
    <div class="page-heading">
      <h1>贷款分期计算器</h1>
      <p>从每期还款到实际借款成本，支持按月或按实际天数计息。</p>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="8">
        <el-card shadow="never" class="parameters">
          <template #header>贷款与费用</template>
          <el-scrollbar height="100%">
            <el-form :model="form" label-position="top">
              <el-form-item label="还款方式">
                <el-select v-model="form.method" aria-label="还款方式">
                  <el-option
                    v-for="item in repaymentMethods"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <div class="field-tip">{{ method.description }}</div>
              </el-form-item>
              <el-form-item label="计息方式">
                <el-select v-model="form.interestBasis" aria-label="计息方式">
                  <el-option label="按月（年利率 ÷ 12）" value="monthly" />
                  <el-option
                    label="按实际天数（适用于按日计息产品）"
                    value="daily"
                    :disabled="form.method === 'flat'"
                  />
                </el-select>
              </el-form-item>
              <template v-if="isDaily">
                <el-form-item label="借款日期">
                  <el-date-picker
                    v-model="form.loanDate"
                    type="date"
                    value-format="YYYY-MM-DD"
                    placeholder="选择借款日期"
                    aria-label="借款日期"
                  />
                </el-form-item>
                <el-form-item label="首次还款日期">
                  <el-date-picker
                    v-model="form.firstPaymentDate"
                    type="date"
                    value-format="YYYY-MM-DD"
                    placeholder="选择首次还款日期"
                    aria-label="首次还款日期"
                  />
                  <div class="field-tip">后续每月同日还款，无对应日期时取月末。天数按相邻日期之差计算。</div>
                </el-form-item>
                <el-form-item label="年利率折算天数（按合同选择）">
                  <el-select v-model="form.daysPerYear" aria-label="年利率折算天数">
                    <el-option label="365 天：日利率 = 年利率 ÷ 365" :value="365" />
                    <el-option label="360 天：日利率 = 年利率 ÷ 360" :value="360" />
                  </el-select>
                </el-form-item>
                <el-form-item label="每期利息取整">
                  <el-select v-model="form.interestRounding" aria-label="每期利息取整">
                    <el-option label="四舍五入到分" value="halfUp" />
                    <el-option label="舍去不足一分" value="down" />
                  </el-select>
                </el-form-item>
              </template>
              <el-form-item label="贷款总额（元）">
                <el-input-number
                  v-model="form.principal"
                  :min="0.01"
                  :max="1e9"
                  :precision="2"
                  :step="1000"
                  controls-position="right"
                  aria-label="贷款总额（元）"
                />
              </el-form-item>
              <el-form-item
                :label="form.method === 'flat' ? '名义年费率（%，按初始本金）' : '合同年利率（%，单利计息）'"
              >
                <el-input-number
                  v-model="form.annualRate"
                  :min="0"
                  :max="100"
                  :precision="4"
                  :step="0.1"
                  controls-position="right"
                  aria-label="年化利率或名义年费率（%）"
                />
                <div v-if="form.method === 'flat'" class="field-tip">
                  每期分期费 = 初始本金 × 名义年费率 ÷ 12，实际年化见右侧 IRR。
                </div>
                <div v-else class="field-tip">
                  填写用于计息的年利率，不能直接填写标注为 IRR 的实际年化。{{
                    isDaily && Number.isFinite(form.annualRate)
                      ? `当前日利率 ${(form.annualRate / form.daysPerYear).toFixed(6)}%。`
                      : ''
                  }}
                </div>
              </el-form-item>
              <el-form-item label="分期数（月，每月一期）">
                <el-input-number
                  v-model="form.periods"
                  :min="1"
                  :max="600"
                  :precision="0"
                  controls-position="right"
                  aria-label="分期数（月）"
                />
              </el-form-item>
              <el-form-item label="放款时手续费（元）">
                <el-input-number
                  v-model="form.upfrontFee"
                  :min="0"
                  :max="1e9"
                  :precision="2"
                  controls-position="right"
                  aria-label="放款时手续费（元）"
                />
                <div class="field-tip">在放款时扣除或同时支付，从实际到账中扣减。</div>
              </el-form-item>
              <el-form-item label="每期固定手续费（元）">
                <el-input-number
                  v-model="form.monthlyFee"
                  :min="0"
                  :max="1e9"
                  :precision="2"
                  controls-position="right"
                  aria-label="每期固定手续费（元）"
                />
                <div class="field-tip">在利息 / 分期费之外额外收取。纯固定手续费产品可将利率设为 0，避免重复计费。</div>
              </el-form-item>
              <el-divider />
              <el-form-item label="提前一次性结清">
                <el-switch v-model="form.prepay" :disabled="form.periods === 1" aria-label="提前一次性结清" />
              </el-form-item>
              <template v-if="form.prepay">
                <el-form-item label="第几期正常还款后结清">
                  <el-input-number
                    v-model="form.prepayPeriod"
                    :min="1"
                    :max="Math.max(1, form.periods - 1)"
                    :precision="0"
                    controls-position="right"
                    aria-label="提前结清期数"
                  />
                </el-form-item>
                <el-form-item label="违约金（剩余本金的 %）">
                  <el-input-number
                    v-model="form.penaltyRate"
                    :min="0"
                    :max="100"
                    :precision="2"
                    :step="0.1"
                    controls-position="right"
                    aria-label="违约金比例（%）"
                  />
                </el-form-item>
                <el-form-item label="剩余固定费用结清时一次收取">
                  <el-switch v-model="form.collectRemainingFees" aria-label="收取剩余固定费用" />
                  <div class="field-tip">包含后续固定手续费及等本等息的后续分期费；其他方式的未来利息免收。</div>
                </el-form-item>
                <p class="field-tip">
                  仅测算所选还款日正常还款后全部结清，不含两次还款日之间结清、部分提前还本及手续费退还。
                </p>
              </template>
            </el-form>
          </el-scrollbar>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="16">
        <el-alert v-if="result.error" :title="result.error" type="warning" :closable="false" show-icon />
        <template v-else-if="summary">
          <el-row :gutter="12" class="summary-grid">
            <el-col :xs="24" :sm="12">
              <el-card shadow="never" class="metric">
                <div class="metric-label">{{ isDaily ? '实际年化 XIRR（按日期，复利）' : '实际年化 IRR（复利）' }}</div>
                <div class="metric-value accent">{{ percent(summary.effectiveApr) }}</div>
                <div class="field-tip">
                  {{ isDaily ? '月等效利率' : '月 IRR' }} {{ percent(summary.monthlyIrr) }} · 单利折算
                  {{ percent(summary.nominalApr) }}
                </div>
              </el-card>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-card shadow="never" class="metric">
                <div class="metric-label">总借款成本（元）</div>
                <div class="metric-value">{{ money(summary.totalCost) }}</div>
                <div class="field-tip">利息 / 分期费 + 全部手续费 + 违约金</div>
              </el-card>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-card shadow="never" class="metric">
                <div class="metric-label">总支出（含放款时手续费，元）</div>
                <div class="metric-value">{{ money(summary.totalOutlay) }}</div>
                <div class="field-tip">实际到账 {{ money(summary.received) }} 元</div>
              </el-card>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-card shadow="never" class="metric">
                <div class="metric-label">首期 / 末期还款（元）</div>
                <div class="payment-range">
                  {{ money(result.data.rows[0].payment) }} / {{ money(result.data.rows.at(-1).payment) }}
                </div>
                <div class="field-tip">
                  共 {{ result.data.rows.length }} 期{{ form.prepay ? '，末期包含结清金额' : '，最后一期调整尾差' }}
                </div>
              </el-card>
            </el-col>
          </el-row>

          <el-alert
            v-if="form.method === 'flat'"
            title="等本等息按初始本金计费，名义年费率不能直接作为实际年化。若产品给出每期费率，请先乘以 12 后填入名义年费率。"
            type="info"
            :closable="false"
            show-icon
            class="result-notice"
          />
          <el-alert
            v-if="form.prepay"
            :title="`与原计划相比，${result.data.saving >= 0 ? '节省' : '多支出'} ${money(Math.abs(result.data.saving))} 元；结清期应还 ${money(result.data.rows.at(-1).payment)} 元（含当期正常还款、剩余本金及结清费用）。`"
            :type="result.data.saving >= 0 ? 'success' : 'warning'"
            :closable="false"
            show-icon
            class="result-notice"
          />

          <el-card shadow="never" class="schedule-card">
            <template #header>
              <div class="table-heading">
                <span>还款计划 · {{ method.label }}</span>
                <el-button size="small" @click="exportCsv">导出 CSV</el-button>
              </div>
            </template>
            <p class="totals">
              本金 {{ money(summary.principal) }} · 利息 / 分期费 {{ money(summary.interest) }} · 固定手续费
              {{ money(summary.fee) }} · 违约金 {{ money(summary.penalty) }}（元）
            </p>
            <el-table :data="visibleRows" stripe border row-key="period" :max-height="360">
              <el-table-column prop="period" label="期数" width="88" fixed>
                <template #default="{ row }"
                  >{{ row.period }} <el-tag v-if="row.settlement" size="small" type="warning">结清</el-tag></template
                >
              </el-table-column>
              <el-table-column v-if="isDaily" prop="date" label="还款日期" width="120" />
              <el-table-column v-if="isDaily" prop="days" label="计息天数" width="95" align="right" />
              <el-table-column
                v-for="column in columns"
                :key="column.prop"
                :label="column.label"
                :min-width="column.prop === 'interest' ? 165 : 150"
                align="right"
              >
                <template #default="{ row }">{{ money(row[column.prop]) }}</template>
              </el-table-column>
            </el-table>
            <el-pagination
              v-model:current-page="page"
              :page-size="24"
              :total="result.data.rows.length"
              layout="total, prev, pager, next"
              :pager-count="5"
              small
              class="pagination"
            />
          </el-card>
        </template>
      </el-col>
    </el-row>

    <el-card shadow="never" class="guide">
      <el-collapse>
        <el-collapse-item title="计算公式与口径说明" name="formula">
          <p>P 为初始本金，r = 输入年利率（%）÷ 100 ÷ 12，n 为总期数，每期为一个月。</p>
          <p>
            以上月利率定义适用于按月模式。按实际天数模式：日利率 = 合同年利率 ÷ 360 或 365，每期利息 = 期初剩余本金 ×
            日利率 × 当期天数。首期从借款日期起算，后续按相邻还款日期之差计算，闰年也按所选固定基数折算。
          </p>
          <p>
            按日计息的每月等额：令 qᵢ = 日利率 × 当期天数，固定本息 M = P ÷ Σ[1 ÷ ∏ⱼ₌₁ⁱ(1 +
            qⱼ)]，月供四舍五入到分；每期本金 = M −
            当期利息，末期调整。等额本金与先息后本也使用当期实际天数，等本等息仅支持按月模式。
          </p>
          <p>
            等额本息：M = P × r ÷ [1 − (1 + r)⁻ⁿ]；每期利息 = 剩余本金 × r，本金 = M − 当期利息。零利率时 M = P ÷ n。
          </p>
          <p>等额本金：每期本金约为 P ÷ n，第 i 期利息 = [P − (i − 1) × P ÷ n] × r；实际按已归还本金计算并按分舍入。</p>
          <p>先息后本：每期利息 = P × r，最后一期另还 P。等本等息：每期本金约为 P ÷ n，每期利息 / 分期费均为 P × r。</p>
          <p>
            固定手续费是额外费用，不并入计息本金。默认按分四舍五入；按日模式可选择每期利息舍去不足一分。本金分摊存在一分尾差，等额本息末期清偿剩余本金。
          </p>
          <p>
            现金流：第 0 期到账 = P − 放款时手续费，第 i 期支出 = 本金 + 利息 / 分期费 + 固定手续费 + 违约金。求月 IRR
            j，使实际到账 = Σ[第 i 期支出 ÷ (1 + j)ⁱ]。
          </p>
          <p>
            按月模式：单利折算年化 = j × 12；实际年化 IRR（复利）= (1 + j)¹² −
            1，放款一个月后首次还款。按日模式：按真实日期求 XIRR y，使实际到账 = Σ[第 i 期支出 ÷ (1 + y)^(距借款日天数 ÷
            365)]；月等效利率 = (1 + y)^(1/12) − 1，单利折算为月等效利率 × 12。XIRR 的 365 天年化基数与合同计息所选的
            360/365 天基数相互独立。
          </p>
          <p>
            提前结清发生在所选期正常还款后；违约金按此时的剩余本金计算。后续固定费用是否减免须按合同选择；勾选收取时，后续等本等息分期费计入结清期“利息
            / 分期费”栏。
          </p>
          <p>
            年化计算口径参考
            <a
              href="https://www.gov.cn/zhengce/zhengceku/2021-03/31/content_5597156.htm"
              target="_blank"
              rel="noopener noreferrer"
              >中国人民银行公告〔2021〕第3号</a
            >。结果用于方案测算，具体收费和结清规则以合同为准。
          </p>
        </el-collapse-item>
      </el-collapse>
    </el-card>
  </div>
</template>

<style scoped>
.loan-calculator {
  max-width: 1560px;
  margin: 0 auto;
  padding: 20px;
}
.page-heading {
  margin-bottom: 24px;
}
h1 {
  margin: 0 0 8px;
  font-size: 24px;
}
.page-heading p,
.field-tip,
.totals {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.7;
}
.page-heading p {
  margin: 0;
}
.parameters {
  display: flex;
  flex-direction: column;
  height: 700px;
}
.parameters :deep(.el-card__header) {
  flex-shrink: 0;
}
.parameters :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}
.parameters :deep(.el-scrollbar__wrap) {
  overscroll-behavior-y: contain;
}
.parameters :deep(.el-form) {
  padding: 20px;
}
.parameters :deep(.el-input-number),
.parameters :deep(.el-date-editor.el-input),
.parameters :deep(.el-select) {
  width: 100%;
}
.field-tip {
  margin-top: 6px;
  width: 100%;
}
.summary-grid .el-col {
  margin-bottom: 12px;
}
.metric {
  height: 100%;
}
.metric-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.metric-value {
  font-size: 28px;
  font-weight: 600;
  margin-top: 10px;
  overflow-wrap: anywhere;
}
.accent {
  color: var(--el-color-primary);
}
.payment-range {
  font-size: 20px;
  font-weight: 600;
  margin-top: 14px;
  overflow-wrap: anywhere;
}
.result-notice {
  margin-bottom: 12px;
}
.table-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.totals {
  margin: 0 0 12px;
}
.schedule-card {
  min-width: 0;
}
.pagination {
  margin-top: 16px;
  flex-wrap: wrap;
}
.guide {
  margin-top: 20px;
}
.guide p {
  line-height: 1.8;
}
.guide a {
  color: var(--el-color-primary);
}
@media (max-width: 1199px) {
  .parameters {
    margin-bottom: 20px;
  }
}
</style>
