import Big from 'big.js'

const digits = '零壹贰叁肆伍陆柒捌玖'
const smallUnits = new Map([
  ['拾', '10'],
  ['佰', '100'],
  ['仟', '1000']
])
const groupUnits = ['', '万', '亿']
const maxCents = new Big('99999999999999')

function groupToUpper(value) {
  const text = String(value)
  let result = ''
  let pendingZero = false
  for (let index = 0; index < text.length; index++) {
    const digit = Number(text[index])
    if (digit === 0) {
      pendingZero = Boolean(result)
    } else {
      if (pendingZero) result += '零'
      result += digits[digit] + ['', '拾', '佰', '仟'][text.length - index - 1]
      pendingZero = false
    }
  }
  return result
}

function integerToUpper(value) {
  if (value.eq('0')) return '零'
  const groups = []
  while (value.gt('0')) {
    const group = value.mod('10000')
    groups.push(group.toNumber())
    // 去掉余数后精确缩放，避免除法受全局 DP、RM 配置影响。
    value = value.minus(group).times('0.0001')
  }
  let result = ''
  let pendingZero = false
  for (let index = groups.length - 1; index >= 0; index--) {
    const group = groups[index]
    if (group === 0) {
      pendingZero = Boolean(result)
      continue
    }
    if (result && (pendingZero || group < 1000)) result += '零'
    result += groupToUpper(group) + groupUnits[index]
    pendingZero = false
  }
  return result
}

function checkRange(cents) {
  if (cents.abs().gt(maxCents)) {
    throw new Error('金额绝对值不能超过 999,999,999,999.99 元')
  }
}

function formatCents(cents) {
  return cents.eq('0') ? '0.00' : cents.times('0.01').toFixed(2)
}

function centsToUpper(cents) {
  const negative = cents.lt('0')
  const [integerText, fraction] = cents.abs().times('0.01').toFixed(2).split('.')
  const integer = new Big(integerText)
  const jiao = Number(fraction[0])
  const fen = Number(fraction[1])
  let result = `${negative ? '负' : ''}${integerToUpper(integer)}元`
  if (jiao) result += `${digits[jiao]}角`
  if (fen) {
    if (!jiao && integer.gt('0')) result += '零'
    result += `${digits[fen]}分`
  } else {
    result += '整'
  }
  return result
}

export function numberToAmount(input) {
  const text = input
    .trim()
    .normalize('NFKC')
    .replace(/^(?:人民币|RMB)\s*/i, '')
    .replace(/^¥\s*/, '')
  const match = /^(-?)(\d+|\d{1,3}(?:,\d{3})+)(?:\.(\d{1,2}))?$/.exec(text)
  if (!match) throw new Error('请输入数字金额，最多两位小数；千分位示例：1,234.56')
  const integer = match[2].replaceAll(',', '').replace(/^0+(?=\d)/, '')
  if (integer.length > 12) throw new Error('金额整数部分最多支持 12 位')
  const fraction = (match[3] || '').padEnd(2, '0')
  const cents = new Big(`${match[1]}${integer}.${fraction}`).times('100')
  checkRange(cents)
  return { number: formatCents(cents), upper: `人民币${centsToUpper(cents)}` }
}

function upperToInteger(text) {
  let total = new Big('0')
  let section = new Big('0')
  let digit = new Big('0')
  for (const char of text) {
    if (digits.includes(char)) {
      digit = new Big(String(digits.indexOf(char)))
    } else if (smallUnits.has(char)) {
      section = section.plus(digit.times(smallUnits.get(char)))
      digit = new Big('0')
    } else if (char === '万') {
      section = section.plus(digit).times('10000')
      digit = new Big('0')
    } else if (char === '亿') {
      total = total.plus(section.plus(digit).times('100000000'))
      section = new Big('0')
      digit = new Big('0')
    }
  }
  const value = total.plus(section).plus(digit)
  checkRange(value.times('100'))
  // 回写整数部分，拒绝重复单位、单位倒序和缺失位值等有歧义的写法。
  if (integerToUpper(value) !== text) throw new Error('整数部分格式有误，请使用完整大写，例如：壹仟零壹元整')
  return value
}

export function amountToNumber(input) {
  const text = input
    .trim()
    .replace(/\s/g, '')
    .replace(/^人民币/, '')
    .replaceAll('圆', '元')
    .replaceAll('正', '整')
  const match =
    /^(负?)([零壹贰叁肆伍陆柒捌玖拾佰仟万亿]+)元(整|零?([壹贰叁肆伍陆柒捌玖])角(?:([壹贰叁肆伍陆柒捌玖])分|整)?|零?([壹贰叁肆伍陆柒捌玖])分)$/.exec(
      text
    )
  if (!match) throw new Error('请输入含“元”的完整大写金额，例如：壹佰元整、壹元伍角陆分')
  const integer = upperToInteger(match[2])
  const jiao = match[4] ? digits.indexOf(match[4]) : 0
  const fen = match[5] || match[6] ? digits.indexOf(match[5] || match[6]) : 0
  const cents = integer
    .times('100')
    .plus(new Big(String(jiao)).times('10'))
    .plus(String(fen))
    .times(match[1] ? '-1' : '1')
  checkRange(cents)
  return { number: formatCents(cents), upper: `人民币${centsToUpper(cents)}` }
}
