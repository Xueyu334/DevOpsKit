import Big from 'big.js'

export class JsonNumber extends Big {
  constructor(raw) {
    let normalized
    // JSON5 数值规范化为 JSON 写法，其余数值保留原始精度和表示形式。
    if (/^[+-]?0x/i.test(raw)) {
      const negative = raw.startsWith('-')
      normalized = `${negative ? '-' : ''}${BigInt(raw.replace(/^[+-]/, '')).toString()}`
    } else {
      normalized = raw
        .replace(/^\+/, '')
        .replace(/^(-?)\./, '$10.')
        .replace(/\.(?=e|$)/i, '.0')
    }
    super(normalized)
    this.raw = normalized
  }
}

export function parseJsonPreservingNumbers(content, parser) {
  // 先用原解析器校验，避免占位符替换掩盖非法数字语法。
  const validated = parser(content)
  let prefix = '__devopskit_number_'
  const decodedContent = JSON.stringify(validated)
  while (content.includes(prefix) || decodedContent.includes(prefix)) prefix += '_'
  const numbers = new Map()
  // 跳过字符串、注释和标识符，只替换数值字面量。
  const tokens =
    /"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|\/\/[^\r\n]*|\/\*[\s\S]*?\*\/|(?:[a-zA-Z_$\u0080-\uFFFF]|\\u[\da-fA-F]{4})(?:[\w$\u0080-\uFFFF]|\\u[\da-fA-F]{4})*|[+-]?(?:0[xX][\da-fA-F]+|(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)/g
  const protectedContent = content.replace(tokens, token => {
    if (!/^[+\-\d.]/.test(token)) return token
    const marker = `${prefix}${numbers.size}`
    numbers.set(marker, new JsonNumber(token))
    return JSON.stringify(marker)
  })
  return parser(protectedContent, (_key, value) =>
    typeof value === 'string' && numbers.has(value) ? numbers.get(value) : value
  )
}
