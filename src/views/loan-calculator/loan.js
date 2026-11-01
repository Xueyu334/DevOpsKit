import Big from 'big.js'

// 独立构造器，避免改变其他工具的精度设置。金额统一以整数分保存。
const Decimal = Big()
Decimal.DP = 40
Decimal.RM = Decimal.roundHalfUp
const integer = value => new Decimal(value).round(0).toNumber()
const cents = value => integer(new Decimal(value).times(100))
const DAY = 86400000

function dateStamp(value) {
  const stamp = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? Date.parse(`${value}T00:00:00Z`) : NaN
  if (!Number.isFinite(stamp) || new Date(stamp).toISOString().slice(0, 10) !== value) {
    throw new Error('请输入有效的借款日期和首次还款日期')
  }
  return stamp
}

function paymentDates(options) {
  const start = dateStamp(options.loanDate)
  const first = new Date(dateStamp(options.firstPaymentDate))
  if (first.getTime() <= start) throw new Error('首次还款日期须晚于借款日期')
  let previous = start
  return Array.from({ length: options.periods }, (_, index) => {
    const date = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + index, 1))
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
    date.setUTCDate(Math.min(first.getUTCDate(), lastDay))
    const days = (date.getTime() - previous) / DAY
    previous = date.getTime()
    return { date: date.toISOString().slice(0, 10), days, elapsedDays: (previous - start) / DAY }
  })
}

export const repaymentMethods = [
  { value: 'annuity', label: '等额本息', description: '每期本息合计基本固定，按剩余本金计息。' },
  { value: 'principal', label: '等额本金', description: '本金均摊，利息随剩余本金减少，月供逐期递减。' },
  { value: 'interestOnly', label: '先息后本', description: '每月支付利息，最后一期一次性偿还全部本金。' },
  { value: 'flat', label: '等本等息', description: '本金均摊，每期均按初始本金计收利息或分期费。' }
]

function validate(options) {
  const ranges = [
    ['principal', '贷款总额', 0.01, 1e9],
    ['annualRate', '年化利率 / 名义年费率', 0, 100],
    ['periods', '分期数', 1, 600],
    ['upfrontFee', '放款时手续费', 0, 1e9],
    ['monthlyFee', '每期固定手续费', 0, 1e9]
  ]
  if (options.prepay) {
    ranges.push(['prepayPeriod', '提前结清期数', 1, options.periods - 1], ['penaltyRate', '违约金比例', 0, 100])
  }
  for (const [key, label, min, max] of ranges) {
    const value = options[key]
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
      throw new Error(`${label}须在 ${min} 至 ${max} 之间`)
    }
  }
  if (!Number.isInteger(options.periods) || (options.prepay && !Number.isInteger(options.prepayPeriod))) {
    throw new Error('分期数与提前结清期数须为整数')
  }
  if (!repaymentMethods.some(method => method.value === options.method)) throw new Error('请选择还款方式')
  if (cents(options.upfrontFee) >= cents(options.principal)) throw new Error('放款时手续费须小于贷款总额')
  if (options.interestBasis && !['monthly', 'daily'].includes(options.interestBasis)) throw new Error('请选择计息方式')
  if (options.interestBasis === 'daily') {
    if (options.method === 'flat') throw new Error('等本等息请使用按月固定费率模式')
    if (![360, 365].includes(options.daysPerYear)) throw new Error('年利率折算天数须为 360 或 365')
    if (!['halfUp', 'down'].includes(options.interestRounding)) throw new Error('请选择利息取整规则')
  }
}

function schedule(options, early, dates) {
  const { periods, method } = options
  const original = cents(options.principal)
  const monthlyRate = new Decimal(options.annualRate).div(1200)
  const fixedInterest = integer(monthlyRate.times(original))
  const monthlyFee = cents(options.monthlyFee)
  const dailyRate = dates ? new Decimal(options.annualRate).div(100).div(options.daysPerYear) : null
  const periodRates = Array.from({ length: periods }, (_, index) =>
    dates ? dailyRate.times(dates[index].days) : monthlyRate
  )
  let annuity = 0
  if (method === 'annuity') {
    // M = P / Σ(1+r)^(-i)，与本息公式等价；逐期折现限制精度及计算量，兼容零利率。
    let discount = new Decimal(1)
    let presentValue = new Decimal(0)
    for (let i = 0; i < periods; i++) {
      discount = discount.div(periodRates[i].plus(1))
      presentValue = presentValue.plus(discount)
    }
    annuity = integer(new Decimal(original).div(presentValue))
  }
  let balance = original
  const rows = []
  const end = early ? options.prepayPeriod : periods
  for (let period = 1; period <= end; period++) {
    const rounding = dates && options.interestRounding === 'down' ? Decimal.roundDown : Decimal.roundHalfUp
    let interest =
      method === 'flat'
        ? fixedInterest
        : new Decimal(balance)
            .times(periodRates[period - 1])
            .round(0, rounding)
            .toNumber()
    if (dates && method === 'annuity' && interest > annuity && balance > 0) {
      throw new Error('当期利息超过等额月供，请检查首次还款日期是否跨度过长')
    }
    let principal = 0
    if (method === 'annuity') principal = Math.min(balance, Math.max(0, annuity - interest))
    if (method === 'principal' || method === 'flat') {
      // 累计均摊后取分，避免多期舍入导致本金超还，单期尾差不超过一分。
      principal = integer(new Decimal(original).times(period).div(periods)) - (original - balance)
    }
    if (period === periods) principal = balance
    balance -= principal
    let fee = monthlyFee
    let penalty = 0
    const settlement = early && period === end
    if (settlement) {
      penalty = integer(new Decimal(balance).times(options.penaltyRate).div(100))
      principal += balance
      balance = 0
      if (options.collectRemainingFees) {
        fee += monthlyFee * (periods - period)
        if (method === 'flat') interest += fixedInterest * (periods - period)
      }
    }
    rows.push({
      period,
      ...(dates ? dates[period - 1] : {}),
      principal,
      interest,
      fee,
      penalty,
      payment: principal + interest + fee + penalty,
      balance,
      settlement
    })
  }
  return rows
}

// 仅处理一次放款、随后非负月度支出的现金流，现值函数单调且根唯一。
export function monthlyIrr(received, payments) {
  if (payments.reduce((sum, payment) => sum + payment, 0) === received) return 0
  const presentValue = rate => {
    let discount = 1
    let total = 0
    for (const payment of payments) {
      discount /= 1 + rate
      total += payment * discount
    }
    return total
  }
  let low = 0
  let high = 1
  while (presentValue(high) > received) high *= 2
  for (let i = 0; i < 160; i++) {
    const mid = (low + high) / 2
    if (presentValue(mid) > received) low = mid
    else high = mid
  }
  return (low + high) / 2
}

function datedIrr(received, rows) {
  if (rows.reduce((sum, row) => sum + row.payment, 0) === received) return 0
  // 对 log(1+年化) 二分，避免短首期下对年化率直接搜索产生溢出。
  const presentValue = logRate =>
    rows.reduce((sum, row) => sum + row.payment * Math.exp((-logRate * row.elapsedDays) / 365), 0)
  let low = 0
  let high = 1
  while (presentValue(high) > received) high *= 2
  for (let i = 0; i < 160; i++) {
    const mid = (low + high) / 2
    if (presentValue(mid) > received) low = mid
    else high = mid
  }
  return Math.expm1((low + high) / 2)
}

function summarize(rows, original, upfrontFee, dated) {
  const totals = rows.reduce(
    (sum, row) => {
      for (const key of ['principal', 'interest', 'fee', 'penalty', 'payment']) sum[key] += row[key]
      return sum
    },
    { principal: 0, interest: 0, fee: 0, penalty: 0, payment: 0 }
  )
  const received = original - upfrontFee
  const effectiveApr = dated ? datedIrr(received, rows) : null
  if (dated && !Number.isFinite(effectiveApr)) throw new Error('实际年化超出可显示范围，请检查日期与费用')
  const irr = dated
    ? Math.expm1(Math.log1p(effectiveApr) / 12)
    : monthlyIrr(
        received,
        rows.map(row => row.payment)
      )
  return {
    ...totals,
    received,
    totalOutlay: totals.payment + upfrontFee,
    totalCost: totals.interest + totals.fee + totals.penalty + upfrontFee,
    monthlyIrr: irr,
    nominalApr: irr * 12,
    effectiveApr: dated ? effectiveApr : Math.expm1(12 * Math.log1p(irr))
  }
}

export function calculateLoan(options) {
  validate(options)
  const original = cents(options.principal)
  const upfrontFee = cents(options.upfrontFee)
  const dates = options.interestBasis === 'daily' ? paymentDates(options) : null
  const baselineRows = schedule(options, false, dates)
  const baseline = summarize(baselineRows, original, upfrontFee, !!dates)
  const rows = options.prepay ? schedule(options, true, dates) : baselineRows
  const summary = options.prepay ? summarize(rows, original, upfrontFee, !!dates) : baseline
  return { rows, summary, baseline, saving: baseline.totalCost - summary.totalCost }
}
