const CONTROL_CHAR_META = {
  0: { name: 'NUL', description: '空字符', escape: '\\0' },
  1: { name: 'SOH', description: '标题开始' },
  2: { name: 'STX', description: '正文开始' },
  3: { name: 'ETX', description: '正文结束' },
  4: { name: 'EOT', description: '传输结束' },
  5: { name: 'ENQ', description: '请求' },
  6: { name: 'ACK', description: '确认' },
  7: { name: 'BEL', description: '响铃' },
  8: { name: 'BS', description: '退格', escape: '\\b' },
  9: { name: 'HT', description: '水平制表', escape: '\\t' },
  10: { name: 'LF', description: '换行', escape: '\\n' },
  11: { name: 'VT', description: '垂直制表', escape: '\\v' },
  12: { name: 'FF', description: '换页', escape: '\\f' },
  13: { name: 'CR', description: '回车', escape: '\\r' },
  14: { name: 'SO', description: '移出' },
  15: { name: 'SI', description: '移入' },
  16: { name: 'DLE', description: '数据链路转义' },
  17: { name: 'DC1', description: '设备控制 1' },
  18: { name: 'DC2', description: '设备控制 2' },
  19: { name: 'DC3', description: '设备控制 3' },
  20: { name: 'DC4', description: '设备控制 4' },
  21: { name: 'NAK', description: '否认' },
  22: { name: 'SYN', description: '同步空闲' },
  23: { name: 'ETB', description: '传输块结束' },
  24: { name: 'CAN', description: '取消' },
  25: { name: 'EM', description: '介质结束' },
  26: { name: 'SUB', description: '替换' },
  27: { name: 'ESC', description: '转义', escape: '\\x1B' },
  28: { name: 'FS', description: '文件分隔' },
  29: { name: 'GS', description: '组分隔' },
  30: { name: 'RS', description: '记录分隔' },
  31: { name: 'US', description: '单元分隔' },
  127: { name: 'DEL', description: '删除', escape: '\\x7F' }
}

const CATEGORY_META = {
  control: { label: '控制字符', tagType: 'danger' },
  space: { label: '空白字符', tagType: 'warning' },
  digit: { label: '数字', tagType: 'success' },
  uppercase: { label: '大写字母', tagType: 'primary' },
  lowercase: { label: '小写字母', tagType: 'primary' },
  punctuation: { label: '符号', tagType: 'info' }
}

const PUNCTUATION_LABEL = '可打印符号'

const getCategory = code => {
  if (code <= 31 || code === 127) return 'control'
  if (code === 32) return 'space'
  if (code >= 48 && code <= 57) return 'digit'
  if (code >= 65 && code <= 90) return 'uppercase'
  if (code >= 97 && code <= 122) return 'lowercase'
  return 'punctuation'
}

const buildPrintableDescription = (code, category) => {
  if (category === 'digit') return '十进制数字'
  if (category === 'uppercase') return '英文大写字母'
  if (category === 'lowercase') return '英文小写字母'
  return PUNCTUATION_LABEL
}

const buildPrintableItem = (code, category) => {
  const char = String.fromCharCode(code)
  return {
    char,
    displayLabel: char,
    previewLabel: char,
    description: buildPrintableDescription(code, category),
    escape: code === 92 ? '\\\\' : code === 34 ? '\\"' : '',
    isPrintable: true
  }
}

const buildControlItem = code => {
  const meta = CONTROL_CHAR_META[code]
  return {
    char: '',
    displayLabel: meta.name,
    previewLabel: meta.name,
    description: meta.description,
    escape: meta.escape || '',
    isPrintable: false
  }
}

const buildSpaceItem = () => ({
  char: ' ',
  displayLabel: '(space)',
  previewLabel: 'SPACE',
  description: '空格字符',
  escape: "' '",
  isPrintable: true
})

const toSearchTokens = item =>
  [
    item.dec,
    item.hex,
    item.binary,
    item.char,
    item.displayLabel,
    item.previewLabel,
    item.name,
    item.description,
    item.categoryLabel,
    item.escape
  ]
    .filter(Boolean)
    .map(token => String(token).toLowerCase())

export const ASCII_BLOCK_STARTS = [0, 32, 64, 96]
export const ASCII_ROW_COUNT = 32

export const ASCII_ITEMS = Array.from({ length: 128 }, (_, code) => {
  const category = getCategory(code)
  const hex = `0x${code.toString(16).toUpperCase().padStart(2, '0')}`
  const binary = `0b${code.toString(2).padStart(7, '0')}`

  const baseItem =
    category === 'control'
      ? buildControlItem(code)
      : category === 'space'
        ? buildSpaceItem()
        : buildPrintableItem(code, category)

  const item = {
    dec: code,
    hex,
    unicode: `U+${code.toString(16).toUpperCase().padStart(4, '0')}`,
    binary,
    category,
    categoryLabel: CATEGORY_META[category].label,
    tagType: CATEGORY_META[category].tagType,
    name: category === 'control' ? CONTROL_CHAR_META[code].name : baseItem.displayLabel,
    ...baseItem
  }

  return {
    ...item,
    searchTokens: toSearchTokens(item),
    searchText: toSearchTokens(item).join(' ')
  }
})
