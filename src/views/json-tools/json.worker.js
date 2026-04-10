import JSON5 from 'json5'

export default function JsonWorker() {}

let lastParsedObj = null
let lastOptions = {}
const MAX_CHILDREN = 100

/**
 * Web Worker 消息监听入口
 * 接收主线程的解析请求（全量 strict/relaxed，或局部分段 partial），并返回渲染完毕的 HTML 字符串
 * @param {MessageEvent} e - 包含请求数据的事件对象
 */
self.onmessage = function (e) {
  const { id, type, content, options, path: partialPath, offset = 0 } = e.data

  // 处理局部加载请求：支持分段增量加载
  if (type === 'partial') {
    if (!lastParsedObj) return
    const target = getValueByPath(lastParsedObj, partialPath)
    if (target === undefined) {
      self.postMessage({ id, success: false, error: 'Path not found: ' + partialPath })
      return
    }

    const htmlBuffer = []
    // 强制执行分页：每次只返回下一段 MAX_CHILDREN 条数据
    renderPartial(target, partialPath, offset, options || lastOptions, htmlBuffer)
    self.postMessage({
      id,
      success: true,
      type: 'partial',
      html: htmlBuffer.join(''),
      path: partialPath,
      nextOffset: offset + MAX_CHILDREN
    })
    return
  }

  if (!content) {
    self.postMessage({ id, success: false, error: 'Empty content' })
    return
  }

  try {
    let obj
    if (type === 'strict') {
      obj = JSON.parse(content)
    } else if (type === 'relaxed') {
      try {
        obj = JSON5.parse(content)
      } catch (err) {
        throw new Error('解析失败：' + err.message)
      }
    }

    lastParsedObj = obj
    lastOptions = options
    const hasNonStandard = checkNonStandard(obj)
    const htmlBuffer = []
    renderJSON(obj, 0, options, htmlBuffer, '[]')
    self.postMessage({ id, success: true, html: htmlBuffer.join(''), hasNonStandard })
  } catch (err) {
    self.postMessage({ id, success: false, error: err.message })
  }
}

/**
 * 通过点语法或中括号语法路径获取对象内部的嵌套值
 * @param {Object|Array} obj - 要查询的目标对象或数组
 * @param {String} path - 查询路径，如 'root.a[0].b' 或 'a[0]'
 * @returns {*} 返回找到的值，如果路径不存在或为 null 则返回 undefined
 */
function getValueByPath(obj, path) {
  if (!path || path === 'root' || path === '[]') return obj
  try {
    const parts = JSON.parse(path)
    if (!Array.isArray(parts)) throw new Error('Invalid path')
    let current = obj
    for (const part of parts) {
      if (current == null) return undefined
      current = current[part]
    }
    return current
  } catch {
    // 降级支持：如果不是有效的 JSON 数组，尝试按旧有点语法/中括号语法拆分
    const parts = path.split(/[.[\]]+/).filter(Boolean)
    let current = obj
    for (const part of parts) {
      if (current == null) return undefined
      current = current[part]
    }
    return current
  }
}

/**
 * 递归检查对象中是否包含非标准 JSON 支持的值（如 undefined、NaN、Infinity 或 Symbol 键）
 * @param {*} obj - 需要检查的任意数据类型
 * @returns {Boolean} 如果包含非标值返回 true，否则返回 false
 */
function checkNonStandard(obj) {
  if (obj === undefined || (typeof obj === 'number' && (isNaN(obj) || !isFinite(obj)))) {
    return true
  }
  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (checkNonStandard(obj[i])) return true
      }
    } else {
      // 使用 Object.keys 避免扫描原型链，并显式检查 Symbol 名
      const keys = Object.keys(obj)
      for (const key of keys) {
        if (checkNonStandard(obj[key])) return true
      }
      if (Object.getOwnPropertySymbols(obj).length > 0) return true
    }
  }
  return false
}

/**
 * 核心渲染函数，将 JSON 数据递归渲染为 HTML 字符串
 * @param {*} obj - 当前需要渲染的数据节点
 * @param {Number} [depth=0] - 当前节点的嵌套深度，用于控制高亮颜色轮换
 * @param {Object} options - 渲染配置项（如：压缩、显示类型、显示索引等）
 * @param {Array<String>} buffer - 用于拼接 HTML 的字符串数组缓冲
 * @param {String} [path='[]'] - 当前节点在整个数据结构中的绝对路径（JSON 序列化的数组）
 */
function renderJSON(obj, depth = 0, options, buffer, path = '[]') {
  // 移除未使用的 color，修复 ESLint 警告
  const { compress, showType } = options

  // 1. 紧凑模式：直接将其转换为字符串并作为单个节点返回
  if (compress) {
    let str
    try {
      // 尝试使用更宽松的序列化，如果包含非标值（如 NaN），标准 JSON.stringify 会丢失信息转为 null
      str = JSON.stringify(obj, (k, v) => {
        if (v === undefined) return '___undefined___'
        if (typeof v === 'number' && isNaN(v)) return '___NaN___'
        if (typeof v === 'number' && !isFinite(v)) return v > 0 ? '___Infinity___' : '___-Infinity___'
        return v
      })
      // 还原非标值占位符，使其在界面上可见
      str = str
        .replace(/"___undefined___"/g, 'undefined')
        .replace(/"___NaN___"/g, 'NaN')
        .replace(/"___Infinity___"/g, 'Infinity')
        .replace(/"___-Infinity___"/g, '-Infinity')
    } catch {
      str = '[Circular or Large Data]'
    }
    buffer.push('<span class="json-string">' + escapeHtml(str) + '</span>')
    return
  }

  // 2. 基础数据类型处理：为不同类型（包括非标的 undefined、NaN）分别打上对应的样式标签以及数据路径 (path)
  const escapedPath = escapeAttr(path)
  if (obj === undefined) {
    buffer.push('<span class="json-null" data-path="' + escapedPath + '">undefined</span>')
    if (showType) buffer.push(' <span class="json-type type-undefined">undefined</span>')
    return
  }
  if (typeof obj === 'number' && (isNaN(obj) || !isFinite(obj))) {
    buffer.push('<span class="json-number" data-path="' + escapedPath + '">' + obj + '</span>')
    if (showType) buffer.push(' <span class="json-type type-number">number</span>')
    return
  }

  if (obj === null) {
    buffer.push('<span class="json-null" data-path="' + escapedPath + '">null</span>')
    if (showType) buffer.push(' <span class="json-type type-null">null</span>')
    return
  }
  if (typeof obj === 'number') {
    buffer.push('<span class="json-number" data-path="' + escapedPath + '">' + obj + '</span>')
    if (showType) buffer.push(' <span class="json-type type-number">number</span>')
    return
  }
  if (typeof obj === 'boolean') {
    buffer.push('<span class="json-boolean" data-path="' + escapedPath + '">' + obj + '</span>')
    if (showType) buffer.push(' <span class="json-type type-boolean">boolean</span>')
    return
  }
  if (typeof obj === 'string') {
    buffer.push('<span class="json-string" data-path="' + escapedPath + '">"' + escapeHtml(obj) + '"</span>')
    if (showType) buffer.push(' <span class="json-type type-string">string</span>')
    return
  }

  // 3. 数组类型的递归渲染
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      buffer.push('<span class="json-bracket" data-path="' + escapedPath + '">[]</span>')
      if (showType) buffer.push(' <span class="json-type type-array">array</span>')
      return
    }

    // 构建数组节点头部：折叠/展开按钮、左侧括号，以及折叠时显示的数组长度指示器
    buffer.push('<span class="json-toggle">-</span><span class="json-bracket">[</span>')
    buffer.push('<span class="json-size-indicator" style="display:none">' + obj.length + '</span>')
    buffer.push('<ul class="json-tree">')

    // 核心卡顿优化：当子节点数量超出最大限制 MAX_CHILDREN 时，只渲染第一段，剩余的由用户手动点击加载
    const renderLen = Math.min(obj.length, MAX_CHILDREN)
    renderArrayItems(obj, 0, renderLen, depth, options, buffer, path)

    buffer.push('</ul><span class="json-bracket">]</span>')
    if (showType) buffer.push(' <span class="json-type type-array">array</span>')
    return
  }

  // 4. 普通对象类型的递归渲染
  if (typeof obj === 'object') {
    const keys = Object.keys(obj)
    if (keys.length === 0) {
      buffer.push('<span class="json-bracket" data-path="' + escapedPath + '">{}</span>')
      if (showType) buffer.push(' <span class="json-type type-object">object</span>')
      return
    }

    // 构建对象节点头部：折叠/展开按钮、左侧括号，以及折叠时显示的键对数量指示器
    buffer.push('<span class="json-toggle">-</span><span class="json-bracket">{</span>')
    buffer.push('<span class="json-size-indicator" style="display:none">' + keys.length + '</span>')
    buffer.push('<ul class="json-tree">')

    // 同样执行分页渲染策略防卡顿
    const renderLen = Math.min(keys.length, MAX_CHILDREN)
    renderObjectKeys(obj, keys, 0, renderLen, depth, options, buffer, path)

    buffer.push('</ul><span class="json-bracket">}</span>')
    if (showType) buffer.push(' <span class="json-type type-object">object</span>')
    return
  }

  // 5. 其他兜底类型（罕见）处理，转换为字符串输出
  buffer.push(String(obj))
}

/**
 * 处理局部（分页）加载请求的核心控制器
 * 取出待渲染的目标节点后，根据 offset 计算出应该拉取的区间，并交给对应的辅助函数进行渲染
 * @param {*} obj - 目标数组或对象
 * @param {String} path - 该目标节点在整体数据中的路径
 * @param {Number} offset - 起始索引偏移量
 * @param {Object} options - 渲染配置项
 * @param {Array<String>} buffer - 用于拼接 HTML 的字符串数组缓冲
 */
function renderPartial(obj, path, offset, options, buffer) {
  // 精确计算路径深度以保证颜色轮换接序正常
  let depth
  try {
    depth = JSON.parse(path).length
  } catch {
    depth = (path.match(/[.[]/g) || []).length
  }

  if (Array.isArray(obj)) {
    const end = Math.min(obj.length, offset + MAX_CHILDREN)
    renderArrayItems(obj, offset, end, depth, options, buffer, path)
  } else if (typeof obj === 'object' && obj !== null) {
    const keys = Object.keys(obj)
    const end = Math.min(keys.length, offset + MAX_CHILDREN)
    renderObjectKeys(obj, keys, offset, end, depth, options, buffer, path)
  }
}

/**
 * 数组项的遍历渲染逻辑（支持分段按需渲染）
 * @param {Array} obj - 目标数组
 * @param {Number} offset - 遍历起始索引
 * @param {Number} end - 遍历结束索引
 * @param {Number} depth - 当前所在的嵌套深度
 * @param {Object} options - 渲染配置项
 * @param {Array<String>} buffer - HTML缓冲数组
 * @param {String} path - 当前数组的绝对路径
 */
function renderArrayItems(obj, offset, end, depth, options, buffer, path) {
  const { showIndex } = options
  const escapedPath = escapeAttr(path)

  let pathArr = []
  try {
    pathArr = JSON.parse(path)
  } catch {
    /* fallback to empty array */
  }

  for (let i = offset; i < end; i++) {
    const currentPath = JSON.stringify([...pathArr, i])
    buffer.push('<li>')
    if (showIndex) buffer.push('<span style="color:#999; margin-right:5px; font-size:12px">' + i + ':</span>')
    renderJSON(obj[i], depth + 1, options, buffer, currentPath)
    if (i < obj.length - 1) buffer.push('<span class="json-bracket">,</span>')
    buffer.push('</li>')
  }

  if (obj.length > end) {
    buffer.push(
      '<li class="json-load-more" data-path="' +
        escapedPath +
        '" data-offset="' +
        end +
        '">... 还有 ' +
        (obj.length - end) +
        ' 项，点击继续加载</li>'
    )
  }
}

/**
 * 对象属性键值对的遍历渲染逻辑（支持分段按需渲染与多级着色）
 * @param {Object} obj - 目标对象
 * @param {Array<String>} keys - 提取出的目标对象键名数组
 * @param {Number} offset - 遍历起始索引
 * @param {Number} end - 遍历结束索引
 * @param {Number} depth - 当前所在的嵌套深度
 * @param {Object} options - 渲染配置项
 * @param {Array<String>} buffer - HTML缓冲数组
 * @param {String} path - 当前对象的绝对路径
 */
function renderObjectKeys(obj, keys, offset, end, depth, options, buffer, path) {
  const { color } = options
  const escapedPath = escapeAttr(path)

  let pathArr = []
  try {
    pathArr = JSON.parse(path)
  } catch {
    /* fallback to empty array */
  }

  for (let i = offset; i < end; i++) {
    const key = keys[i]
    const colorIdx = (i + depth) % 9
    const currentPath = JSON.stringify([...pathArr, key])
    const escapedCurrentPath = escapeAttr(currentPath)

    const displayKey = color
      ? '<span class="json-key json-key-' +
        colorIdx +
        '" data-path="' +
        escapedCurrentPath +
        '">"' +
        escapeHtml(key) +
        '"</span>'
      : '<span data-path="' + escapedCurrentPath + '">"' + escapeHtml(key) + '"</span>'

    buffer.push('<li>')
    buffer.push(displayKey + '<span class="json-bracket">: </span>')
    renderJSON(obj[key], depth + 1, options, buffer, currentPath)
    if (i < keys.length - 1) buffer.push('<span class="json-bracket">,</span>')
    buffer.push('</li>')
  }

  if (keys.length > end) {
    buffer.push(
      '<li class="json-load-more" data-path="' +
        escapedPath +
        '" data-offset="' +
        end +
        '">... 还有 ' +
        (keys.length - end) +
        ' 对，点击继续加载</li>'
    )
  }
}

/**
 * 对文本内的 HTML 特殊字符进行转义，防止 XSS 攻击或页面结构破坏
 * @param {String} str - 需要转义的原始字符串
 * @returns {String} 转义后的安全字符串
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return str
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * 专门用于 HTML 属性值的转义，比 escapeHtml 更严格
 * @param {String} str - 需要转义的属性字符串
 * @returns {String} 转义后的属性值
 */
function escapeAttr(str) {
  if (typeof str !== 'string') return str
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\s/g, '&#32;') // 防止空格破坏属性边界
}
