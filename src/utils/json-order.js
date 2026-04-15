export const JSON_ORDER_PREFIX = '\u200B'

/**
 * 为指定输入字符串中的 JSON 数字键名添加前缀。
 * 该方法会遍历输入字符串，并在满足条件的情况下为数字键名添加定义的前缀，确保顺序性和唯一性。
 *
 * @param {string} input 输入的 JSON 格式字符串。
 * 如果传入的值不是字符串或为空值，将直接返回原值。
 *
 * @return {string} 返回修改后的 JSON 字符串，如果无修改需求则返回原字符串。
 */
export function addNumericKeyOrderPrefix(input) {
  if (typeof input !== 'string' || !input) return input

  const result = []
  const stack = []
  let index = 0

  while (index < input.length) {
    const current = input[index]
    const context = stack[stack.length - 1]

    if (current === '"' || current === "'") {
      const parsedString = readQuotedString(input, index)
      if (context?.type === 'object' && context.expectKey) {
        const nextTokenIndex = skipTrivia(input, parsedString.end)
        // 只有确认“当前位置是对象键且后面紧跟冒号”时才补前缀，避免误改字符串内容里的 `123:`
        if (/^\d+$/.test(parsedString.value) && input[nextTokenIndex] === ':') {
          result.push(JSON.stringify(JSON_ORDER_PREFIX + parsedString.value))
        } else {
          result.push(parsedString.raw)
        }
      } else {
        result.push(parsedString.raw)
      }
      index = parsedString.end
      continue
    }

    if (current === '/' && input[index + 1] === '/') {
      const end = readLineCommentEnd(input, index + 2)
      result.push(input.slice(index, end))
      index = end
      continue
    }

    if (current === '/' && input[index + 1] === '*') {
      const end = readBlockCommentEnd(input, index + 2)
      result.push(input.slice(index, end))
      index = end
      continue
    }

    if (context?.type === 'object' && context.expectKey && isDigit(current)) {
      let end = index + 1
      while (end < input.length && isDigit(input[end])) {
        end++
      }

      const rawKey = input.slice(index, end)
      const nextTokenIndex = skipTrivia(input, end)
      // 兼容 JSON5 的无引号数字键写法，例如 `{ 123: "ok" }`
      if (input[nextTokenIndex] === ':') {
        result.push(JSON.stringify(JSON_ORDER_PREFIX + rawKey))
      } else {
        result.push(rawKey)
      }
      index = end
      continue
    }

    result.push(current)

    if (current === '{') {
      stack.push({ type: 'object', expectKey: true })
    } else if (current === '[') {
      stack.push({ type: 'array' })
    } else if (current === ':') {
      if (context?.type === 'object') {
        context.expectKey = false
      }
    } else if (current === ',') {
      if (context?.type === 'object') {
        context.expectKey = true
      }
    } else if (current === '}' || current === ']') {
      stack.pop()
    }

    index++
  }

  return result.join('')
}

/**
 * 移除对象键名中的数字顺序前缀。
 *
 * @param {any} value 输入值，可以是对象、数组或其他类型。
 * 如果是对象，将移除所有键名中的数字顺序前缀；
 * 如果是数组，将对数组的每个元素递归进行处理；
 * 如果是其他类型，返回值不变。
 * @return {any} 处理后的值，移除了对象键名中的数字顺序前缀。
 */
export function stripNumericKeyOrderPrefix(value) {
  if (Array.isArray(value)) {
    return value.map(item => stripNumericKeyOrderPrefix(item))
  }

  if (value && typeof value === 'object') {
    const normalized = {}
    Object.keys(value).forEach(key => {
      const cleanKey = decodeNumericKey(key)
      normalized[cleanKey] = stripNumericKeyOrderPrefix(value[key])
    })
    return normalized
  }

  return value
}

/**
 * 将 JSON 值字符串化，同时保留对象属性的顺序。
 *
 * @param {any} value 需要字符串化的 JSON 值，可以是对象、数组、字符串、数字、布尔值或 null。
 * @param {number} [space=0] 指定缩进的空格数，用于格式化输出。如果为 0，则输出无缩进的紧凑格式。
 * @return {string} 返回字符串化后的 JSON，保留对象属性的顺序。
 */
export function stringifyJsonPreservingOrder(value, space = 0) {
  const indentSize = normalizeIndent(space)
  return serializeJsonValue(value, indentSize, 0)
}

/**
 * 解码给定的数字键。如果数字键是以指定的前缀开头的字符串，
 * 则去掉该前缀并返回其余部分；否则，直接返回原始键。
 *
 * @param {string} key 要解码的数字键。
 * @return {string} 解码后的键。如果输入键不是以指定前缀开头的字符串，则返回原始键。
 */
export function decodeNumericKey(key) {
  return typeof key === 'string' && key.startsWith(JSON_ORDER_PREFIX) ? key.slice(JSON_ORDER_PREFIX.length) : key
}

/**
 * 跳过输入中的空白字符和注释，从指定位置返回下一个有效字符的索引。
 *
 * @param {string} input 输入的字符串。
 * @param {number} startIndex 开始检查的位置索引。
 * @return {number} 返回跳过空白和注释后的下一个有效字符的索引。
 */
function skipTrivia(input, startIndex) {
  let index = startIndex

  while (index < input.length) {
    const current = input[index]
    const next = input[index + 1]

    // 跳过空白和注释，确保“下一个有效 token”判断在 JSON5 场景下依然准确
    if (/\s/.test(current)) {
      index++
      continue
    }

    if (current === '/' && next === '/') {
      index = readLineCommentEnd(input, index + 2)
      continue
    }

    if (current === '/' && next === '*') {
      index = readBlockCommentEnd(input, index + 2)
      continue
    }

    break
  }

  return index
}

/**
 * 解析包含引号的字符串。
 *
 * @param {string} input 输入的字符串。
 * @param {number} startIndex 开始解析的位置索引。
 * @return {Object} 返回一个对象，其中包含以下属性：
 *   - raw: 表示对应的包含引号的原始字符串。
 *   - value: 解析后的字符串内容，移除了外层的引号且处理了转义字符。
 *   - end: 表示解析结束位置的索引。
 */
function readQuotedString(input, startIndex) {
  const quote = input[startIndex]
  let index = startIndex + 1
  let value = ''

  while (index < input.length) {
    const current = input[index]

    if (current === '\\') {
      if (index + 1 < input.length) {
        value += current + input[index + 1]
        index += 2
        continue
      }
      value += current
      index++
      continue
    }

    if (current === quote) {
      return {
        raw: input.slice(startIndex, index + 1),
        // 这里把引号内容解析成真实值，后面才能可靠判断它是不是纯数字键
        value: tryParseStringValue(input.slice(startIndex, index + 1)),
        end: index + 1
      }
    }

    value += current
    index++
  }

  return {
    raw: input.slice(startIndex),
    value,
    end: input.length
  }
}

/**
 * 解析一个字符串值，尝试将其解析为 JSON 格式，如果解析失败则返回处理后的原始值。
 *
 * @param {string} raw 原始字符串值。
 * @return {string|Object} 如果解析成功，返回 JSON 格式对象或值；如果解析失败，返回处理后的原始字符串值。
 */
function tryParseStringValue(raw) {
  try {
    if (raw.startsWith("'")) {
      return JSON.parse(`"${raw.slice(1, -1).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
    }
    return JSON.parse(raw)
  } catch {
    return raw.slice(1, -1)
  }
}

/**
 * 读取单行注释的结束位置。
 *
 * @param {string} input 要解析的输入字符串。
 * @param {number} startIndex 搜索的起始索引位置。
 * @return {number} 返回单行注释结束的位置，或输入字符串长度（如果没有换行符）。
 */
function readLineCommentEnd(input, startIndex) {
  let index = startIndex
  while (index < input.length && input[index] !== '\n') {
    index++
  }
  return index
}

/**
 * 读取块注释的结束位置。
 * @param {string} input 要解析的输入字符串。
 * @param {number} startIndex 开始查找的起始索引位置。
 * @return {number} 返回块注释结束位置的索引。如果未找到结束标记，则返回输入字符串的长度。
 */
function readBlockCommentEnd(input, startIndex) {
  const commentEnd = input.indexOf('*/', startIndex)
  return commentEnd === -1 ? input.length : commentEnd + 2
}

/**
 * 判断给定字符是否为数字字符。
 *
 * @param {string} char 要检查的单个字符。
 * @return {boolean} 如果字符是数字字符，则返回 true，否则返回 false。
 */
function isDigit(char) {
  return char >= '0' && char <= '9'
}

/**
 * 序列化给定的值为 JSON 字符串形式。
 *
 * @param {any} value 要序列化的值，可以是任意类型（字符串、数字、布尔值、对象、数组等）。
 * @param {number} indentSize 缩进的空格数，用于控制输出的 JSON 格式化程度。
 * @param {number} depth 当前递归深度，用于辅助格式化嵌套结构的缩进。
 * @return {string|undefined} 返回序列化后的 JSON 字符串。如果输入的值类型为 `undefined`、函数或符号，返回 `undefined`。
 *                              如果输入值是 `BigInt` 类型，将抛出一个 `TypeError`。
 */
function serializeJsonValue(value, indentSize, depth) {
  if (value === null) return 'null'

  const valueType = typeof value
  if (valueType === 'string') return JSON.stringify(value)
  if (valueType === 'number') return Number.isFinite(value) ? String(value) : 'null'
  if (valueType === 'boolean') return String(value)

  if (valueType === 'undefined' || valueType === 'function' || valueType === 'symbol') {
    return undefined
  }

  if (valueType === 'bigint') {
    throw new TypeError('Do not know how to serialize a BigInt')
  }

  if (Array.isArray(value)) {
    const items = value.map(item => {
      const serializedItem = serializeJsonValue(item, indentSize, depth + 1)
      // 与 JSON.stringify 一致：数组里的 `undefined/function/symbol` 序列化为 `null`
      return serializedItem === undefined ? 'null' : serializedItem
    })
    return joinCollection(items, indentSize, depth, '[', ']')
  }

  const entries = []
  Object.keys(value).forEach(key => {
    const serializedValue = serializeJsonValue(value[key], indentSize, depth + 1)
    if (serializedValue !== undefined) {
      // 使用当前对象的枚举顺序输出，并去掉内部零宽前缀，避免格式化后再次触发数字键重排
      entries.push(`${JSON.stringify(decodeNumericKey(key))}:${indentSize ? ' ' : ''}${serializedValue}`)
    }
  })

  return joinCollection(entries, indentSize, depth, '{', '}')
}

/**
 * 将集合中的元素以指定格式拼接成字符串。
 *
 * @param {string[]} items 字符串集合，需要被拼接的元素数组。
 * @param {number} indentSize 缩进大小，用于控制每一层的缩进空格数。
 * @param {number} depth 当前深度，用于计算缩进。
 * @param {string} open 起始字符，作为拼接字符串的开始部分。
 * @param {string} close 结束字符，作为拼接字符串的结束部分。
 * @return {string} 返回拼接完成的字符串。
 */
function joinCollection(items, indentSize, depth, open, close) {
  if (items.length === 0) {
    return `${open}${close}`
  }

  if (!indentSize) {
    return `${open}${items.join(',')}${close}`
  }

  const currentIndent = ' '.repeat(indentSize * depth)
  const nextIndent = ' '.repeat(indentSize * (depth + 1))
  return `${open}\n${nextIndent}${items.join(`,\n${nextIndent}`)}\n${currentIndent}${close}`
}

/**
 * 规范化缩进值，将输入的缩进值限制在 0 到 10 的范围内，并确保其为整数。
 *
 * @param {number} space 输入的缩进值，期望为一个有限的数字。
 * @return {number} 返回规范化后的缩进值，范围在 0 到 10 之间的整数。
 */
function normalizeIndent(space) {
  if (typeof space !== 'number' || !Number.isFinite(space)) return 0
  return Math.max(0, Math.min(10, Math.floor(space)))
}
