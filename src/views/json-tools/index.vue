<script setup>
import JSON5 from 'json5'
import JsonWorker from './json.worker.js?worker'
import { addNumericKeyOrderPrefix, JSON_ORDER_PREFIX, stringifyJsonPreservingOrder } from '@/utils/json-order'

const STORAGE_KEY = 'devopskit_json_input'
const OPTIONS_KEY = 'devopskit_json_options'
const EMPTY_STATE_HTML = '<span class="status-tip">等待输入...</span>'

const renderOptionItems = [
  { key: 'color', label: 'JSON 着色渲染' },
  { key: 'showIndex', label: '显示数组索引' },
  { key: 'showType', label: '显示数据类型' },
  { key: 'compress', label: '同行紧凑输出' }
]

const rawInput = ref('')
const options = reactive({
  color: true,
  compress: false,
  showIndex: false,
  showType: false
})

const stringResultHtml = ref(EMPTY_STATE_HTML)
const evalResultHtml = ref(EMPTY_STATE_HTML)
const hasError = ref(false)
const hasNonStandard = ref(false)
const currentPath = ref('')

const leftWidth = ref(400)
const containerRef = ref(null)
let isResizing = false
let worker = null
let partialRequestSeed = 0
let strictHasNonStandard = false
let relaxedHasNonStandard = false

const { copy } = useClipboard()

const setIdleState = () => {
  stringResultHtml.value = EMPTY_STATE_HTML
  evalResultHtml.value = EMPTY_STATE_HTML
  hasError.value = false
  hasNonStandard.value = false
  currentPath.value = ''
  strictHasNonStandard = false
  relaxedHasNonStandard = false
}

const buildErrorHtml = (message, modifierClass = '') =>
  `<div class="error-box${modifierClass ? ` ${modifierClass}` : ''}">${message}</div>`

/**
 * 一个用于解析近似 JSON 格式字符串的函数。
 * 此函数先对输入值进行处理以确保格式规范化，然后尝试使用 `JSON.parse` 对其进行解析。
 * 如果标准的 JSON 解析失败，则降级使用 `JSON5.parse` 进行解析。
 * 适用于处理带注释、单引号及未加引号键的非标准 JSON 格式字符串。
 *
 * @param {string} value - 要解析的近似 JSON 格式字符串。
 * @returns {*} 返回解析后的 JavaScript 对象。
 * @throws {Error} 当输入不符合 JSON 或 JSON5 格式时抛出解析异常。
 */
const parseJsonLike = value => {
  const normalizedValue = addNumericKeyOrderPrefix(value)
  try {
    return JSON.parse(normalizedValue)
  } catch {
    // 降级使用 JSON5 解析，支持注释、单引号、未加引号键等，且绝对安全
    return JSON5.parse(normalizedValue)
  }
}

function debounce(func, wait) {
  let timeout
  return function (...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

const update = () => {
  const val = rawInput.value.trim()

  // 数据持久化：完全依赖 try-catch（方案 A）
  try {
    if (val) {
      localStorage.setItem(STORAGE_KEY, val)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
    localStorage.setItem(OPTIONS_KEY, JSON.stringify(options))
  } catch (e) {
    // 如果超出存储配额（QuotaExceededError），则优雅降级，仅在控制台警告
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      console.warn('JSON 自动保存失败：内容超出 LocalStorage 存储上限。')
    } else {
      console.error('持久化失败:', e)
    }
  }

  if (!val) {
    setIdleState()
    return
  }

  if (!worker) return

  const workerOptions = { ...options }
  worker.postMessage({ id: 'strict', type: 'strict', content: val, options: workerOptions })
  worker.postMessage({ id: 'relaxed', type: 'relaxed', content: val, options: workerOptions })
}

const debouncedUpdate = debounce(update, 300)

const lockedPath = ref('')
let selectedElement = null

const handleHover = e => {
  if (lockedPath.value) return

  const target = e.target
  const pathNode = target.closest('[data-path]')
  if (pathNode) {
    currentPath.value = pathNode.getAttribute('data-path') || '[]'
  }
}

/**
 * 将 JSON 数组格式的路径段转换为人类可读的点语法/中括号语法
 * @param {String} pathStr - JSON 序列化的路径数组字符串
 * @returns {String} 人类可读路径
 */
const formatPath = pathStr => {
  if (!pathStr || pathStr === '$' || pathStr === 'root' || pathStr === '[]') return ''
  try {
    const parts = JSON.parse(pathStr)
    if (!Array.isArray(parts)) return pathStr

    return parts
      .map((part, index) => {
        // 移除内部渲染用的零宽前缀
        const displayPart =
          typeof part === 'string' && part.startsWith(JSON_ORDER_PREFIX) ? part.slice(JSON_ORDER_PREFIX.length) : part

        if (typeof part === 'number') {
          return `[${part}]`
        }
        // 判定是否需要用中括号包裹：空字符串、不符合 JS 标识符命名规范的键（如包含点号、起始为数字等）
        const needsBrackets = displayPart.length === 0 || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(displayPart)
        if (needsBrackets) {
          return `["${displayPart.replace(/"/g, '\\"')}"]`
        }
        return index === 0 ? displayPart : `.${displayPart}`
      })
      .join('')
  } catch {
    return pathStr
  }
}

const handleClick = e => {
  const target = e.target
  const isToggle = target?.classList.contains('json-toggle')
  const isLoadMore = target?.classList.contains('json-load-more')

  // 处理属性层级的展开/收起切换
  if (isToggle) {
    const parent = target.parentElement
    const list = parent?.querySelector('.json-tree')
    const indicator = parent?.querySelector('.json-size-indicator')

    if (list) {
      if (list.classList.contains('folded')) {
        list.classList.remove('folded')
        if (indicator) indicator.style.display = 'none'
        target.innerText = '-'
      } else {
        list.classList.add('folded')
        if (indicator) indicator.style.display = 'inline'
        target.innerText = '+'
      }
    }
    return
  }

  // 处理大数组/大对象的局部加载
  if (isLoadMore) {
    const path = target.getAttribute('data-path')
    const offset = parseInt(target.getAttribute('data-offset') || '0', 10)
    const sourceId = target.closest('[data-worker-source]')?.getAttribute('data-worker-source')
    const requestId = `partial-${++partialRequestSeed}`

    if (!sourceId) return

    target.setAttribute('data-request-id', requestId)
    target.innerText = '正在加载更多内容...'
    target.style.pointerEvents = 'none'
    worker.postMessage({ id: requestId, type: 'partial', sourceId, path, offset, options: { ...options } })
    return
  }

  // 处理路径的锁定与解锁
  const pathNode = target.closest('[data-path]')
  if (pathNode) {
    // 清除上一次的选中状态
    if (selectedElement) {
      selectedElement.classList.remove('json-selected-node')
    }

    if (selectedElement === pathNode) {
      // 再次点击同一路径：解除锁定
      selectedElement = null
      lockedPath.value = ''
      ElMessage.info({ message: '路径锁定已解除', duration: 1000 })
    } else {
      // 点击新路径：执行锁定
      selectedElement = pathNode
      selectedElement.classList.add('json-selected-node')
      lockedPath.value = pathNode.getAttribute('data-path') || '[]'
      currentPath.value = lockedPath.value
      ElMessage.success({ message: '路径已锁定，可点击下方复制', duration: 1000 })
    }
  } else {
    // 点击空白区域：解除当前锁定
    if (selectedElement) {
      selectedElement.classList.remove('json-selected-node')
      selectedElement = null
      lockedPath.value = ''
    }
  }
}

const handleCopyPath = () => {
  if (!currentPath.value) return
  const formatted = formatPath(currentPath.value)
  const fullPath = `$${formatted.startsWith('[') ? '' : formatted ? '.' : ''}${formatted}`
  copy(fullPath)
  ElMessage.success('路径已复制')
}

const handleExpandAll = (expand = true) => {
  const resultArea = document.querySelector('.result-area')
  if (!resultArea) return
  const toggles = resultArea.querySelectorAll('.json-toggle')
  const trees = resultArea.querySelectorAll('.json-tree')
  const indicators = resultArea.querySelectorAll('.json-size-indicator')

  toggles.forEach(t => (t.innerText = expand ? '-' : '+'))
  trees.forEach(tree => {
    if (expand) tree.classList.remove('folded')
    else tree.classList.add('folded')
  })
  indicators.forEach(ind => (ind.style.display = expand ? 'none' : 'inline'))
}

const handleDrop = e => {
  e.preventDefault()
  const file = e.dataTransfer.files[0]
  if (file && (file.name.endsWith('.json') || file.type === 'application/json')) {
    const reader = new FileReader()
    reader.onload = event => {
      rawInput.value = event.target.result
      update()
      ElMessage.success('文件加载成功')
    }
    reader.readAsText(file)
  }
}

const transformParsedInput = (formatter, successMessage, errorPrefix) => {
  const val = rawInput.value.trim()
  if (!val) return

  try {
    const obj = parseJsonLike(val)
    rawInput.value = formatter(obj) ?? val

    update()
    ElMessage.success(successMessage)
  } catch (e) {
    ElMessage.error(`${errorPrefix}: ${e.message}`)
  }
}

const handleClear = () => {
  rawInput.value = ''
  setIdleState()
  localStorage.removeItem(STORAGE_KEY)
}

const handleFormat = () => {
  transformParsedInput(obj => stringifyJsonPreservingOrder(obj, 2), '格式化完成', '格式化失败')
}

const handleCompress = () => {
  transformParsedInput(obj => stringifyJsonPreservingOrder(obj), '压缩完成', '压缩失败')
}

const handleUnescape = () => {
  let val = rawInput.value.trim()
  if (!val) return

  try {
    if (val.startsWith('"') && val.endsWith('"')) {
      const parsed = JSON.parse(val)
      if (typeof parsed === 'string') {
        rawInput.value = parsed
        update()
        ElMessage.success('去除转义成功')
        return
      }
    }
  } catch (e) {
    console.warn(e)
  }

  val = val
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\\n/g, '\\n')
    .replace(/\\r/g, '\\r')
    .replace(/\\t/g, '\\t')
    .replace(/\\b/g, '\\b')
    .replace(/\\f/g, '\\f')

  if (val.startsWith('"') && val.endsWith('"')) {
    const inner = val.slice(1, -1)
    if ((inner.startsWith('{') && inner.endsWith('}')) || (inner.startsWith('[') && inner.endsWith(']'))) {
      val = inner
    }
  }

  rawInput.value = val
  update()
  ElMessage.success('部分去除转义完成')
}

const handleEscape = () => {
  let val = rawInput.value.trim()
  if (!val) return

  try {
    val = stringifyJsonPreservingOrder(parseJsonLike(val)) ?? val
  } catch {
    // ignore
  }

  rawInput.value = JSON.stringify(val)
  update()
  ElMessage.success('添加转义完成')
}

const startResizing = () => {
  isResizing = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

const handleMouseMove = e => {
  if (!isResizing || !containerRef.value) return

  const containerRect = containerRef.value.getBoundingClientRect()
  const newLeftWidth = e.clientX - containerRect.left
  const minWidth = 300

  if (newLeftWidth < minWidth || newLeftWidth > containerRect.width - minWidth) return

  leftWidth.value = newLeftWidth
}

const stopResizing = () => {
  if (!isResizing) return
  isResizing = false
  document.body.style.cursor = 'default'
  document.body.style.userSelect = ''
}

onMounted(() => {
  worker = new JsonWorker()

  // 从本地存储加载历史数据
  const savedInput = localStorage.getItem(STORAGE_KEY)
  const savedOptions = localStorage.getItem(OPTIONS_KEY)
  if (savedInput) rawInput.value = savedInput
  if (savedOptions) {
    try {
      Object.assign(options, JSON.parse(savedOptions))
    } catch {
      /* 忽略格式错误的备份 */
    }
  }

  worker.onmessage = e => {
    const { id, success, html, error, hasNonStandard: nonStandard, type } = e.data

    if (type === 'partial') {
      const selector = `.json-load-more[data-request-id="${id}"]`
      const el = document.querySelector(selector)
      if (el) {
        if (success) {
          // 使用 beforebegin 在占位符前插入新得到的 100 条数据
          el.insertAdjacentHTML('beforebegin', html)
          // 移除旧的占位符（Worker 返回的新 HTML 中如果还有剩余，会包含一个新的占位符）
          el.remove()
        } else {
          el.removeAttribute('data-request-id')
          el.innerText = '加载失败，点击重试'
          el.style.pointerEvents = ''
          ElMessage.error(error || '加载更多失败')
        }
      }
      return
    }

    if (id === 'strict') {
      if (success) {
        stringResultHtml.value = html
        hasError.value = false
        strictHasNonStandard = !!nonStandard
      } else {
        stringResultHtml.value = buildErrorHtml(`Error: ${error}`)
        hasError.value = true
        strictHasNonStandard = false
      }
      hasNonStandard.value = strictHasNonStandard || relaxedHasNonStandard
      return
    }

    if (id === 'relaxed') {
      relaxedHasNonStandard = success ? !!nonStandard : false
      hasNonStandard.value = strictHasNonStandard || relaxedHasNonStandard
    }

    evalResultHtml.value = success ? html : buildErrorHtml(`Eval error: ${error}`, 'error-box--italic')
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopResizing)

  if (containerRef.value) {
    leftWidth.value = Math.max(containerRef.value.getBoundingClientRect().width * 0.3, 400)
  }

  if (rawInput.value) update()
})

onUnmounted(() => {
  if (worker) worker.terminate()
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResizing)
})
</script>

<template>
  <div class="app-container">
    <div class="tool-header">
      <div class="tool-title">
        <span class="icon-bracket">{ }</span>
        JSON在线解析
        <span class="subtitle">(双击任意处自动格式化,支持文件拖拽)</span>
      </div>
      <div class="header-actions">
        <el-button-group class="mr-2">
          <el-button plain size="default" @click="handleExpandAll(true)">全部展开</el-button>
          <el-button plain size="default" @click="handleExpandAll(false)">全部收起</el-button>
        </el-button-group>

        <el-popover :width="180" placement="bottom-end" title="渲染设置" trigger="click">
          <template #reference>
            <el-button plain>
              <template #icon>
                <el-icon>
                  <IconEpSetting />
                </el-icon>
              </template>
              显示选项
            </el-button>
          </template>
          <div class="settings-panel">
            <el-checkbox
              v-for="item in renderOptionItems"
              :key="item.key"
              v-model="options[item.key]"
              class="settings-checkbox"
              @change="debouncedUpdate"
            >
              {{ item.label }}
            </el-checkbox>
          </div>
        </el-popover>
      </div>
    </div>

    <div ref="containerRef" class="panel-container">
      <div :style="{ flexBasis: `${leftWidth}px` }" class="panel left-panel">
        <div class="panel-header">
          <div class="panel-title">RAW INPUT</div>
          <div class="panel-actions">
            <el-button plain size="small" @click="handleFormat">格式化</el-button>
            <el-button plain size="small" @click="handleCompress">压缩</el-button>
            <el-button plain size="small" @click="handleEscape">转义</el-button>
            <el-button plain size="small" @click="handleUnescape">去转义</el-button>
            <el-button class="panel-action-icon" plain size="small" title="清空" type="danger" @click="handleClear">
              <el-icon>
                <IconEpDelete />
              </el-icon>
            </el-button>
          </div>
        </div>
        <textarea
          v-model="rawInput"
          class="editor-area"
          placeholder="在此输入或粘贴您的 JSON 数据... (双击任意处自动格式化，支持拖拽 .json 文件)"
          spellcheck="false"
          @dblclick="handleFormat"
          @drop="handleDrop"
          @input="debouncedUpdate"
          @dragover.prevent
        ></textarea>
      </div>

      <div class="gutter" @mousedown="startResizing"></div>

      <div class="panel right-panel">
        <div :class="{ 'error-header': hasError }" class="panel-header panel-header--split">
          <div class="panel-header-cell">String Parse (Strict)</div>
          <div class="panel-header-cell panel-header-cell--offset">JS Eval (Relaxed)</div>
        </div>
        <div class="result-area">
          <div
            class="result-col parse-col"
            data-worker-source="strict"
            @click="handleClick"
            @mouseover="handleHover"
            v-html="stringResultHtml"
          ></div>
          <div
            class="result-col eval-col"
            data-worker-source="relaxed"
            @click="handleClick"
            @mouseover="handleHover"
            v-html="evalResultHtml"
          ></div>
        </div>
        <div v-if="hasNonStandard" class="non-standard-warning">
          <el-icon>
            <IconEpWarning />
          </el-icon>
          <span>检测到包含 undefined / NaN 等非标准 JSON 值，执行压缩或格式化可能会导致数据丢失。</span>
        </div>
        <div :class="{ 'path-bar--locked': lockedPath }" class="path-bar">
          <div class="path-display">
            <span class="path-label">path:</span>
            <code class="path-text">{{
              currentPath
                ? (function () {
                    const formatted = formatPath(currentPath)
                    return `$${formatted.startsWith('[') ? '' : formatted ? '.' : ''}${formatted}`
                  })()
                : '$'
            }}</code>
          </div>
          <el-button v-if="lockedPath" class="path-copy-btn" link size="small" type="primary" @click="handleCopyPath">
            复制路径
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  --json-font-family: 'Consolas', 'Monaco', monospace;
  --panel-padding: 16px;
  --panel-radius: 8px;
  --panel-border: 1px solid var(--el-border-color-light);
  --panel-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  --panel-header-height: 42px;
  --gutter-width: 10px;
  --gutter-offset: -5px;
  --transition-fast: 0.15s ease;
  --icon-bracket-bg: #eef2ff;
  --json-key-0-color: #ef4444;
  --json-key-1-color: #f97316;
  --json-key-2-color: #d97706;
  --json-key-3-color: #84cc16;
  --json-key-4-color: #10b981;
  --json-key-5-color: #06b6d4;
  --json-key-6-color: #3b82f6;
  --json-key-7-color: #8b5cf6;
  --json-key-8-color: #d946ef;
  --json-string-color: #059669;
  --json-number-color: #7c3aed;
  --json-boolean-color: #ea580c;
  --json-type-string-color: #10b981;
  --json-type-number-color: #8b5cf6;
  --json-type-boolean-color: #f59e0b;
  --json-type-object-color: #f43f5e;
  --json-type-array-color: #3b82f6;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  padding: 10px 24px;
}

html.dark .app-container {
  --icon-bracket-bg: rgba(99, 102, 241, 0.2);
  --json-key-0-color: #fca5a5;
  --json-key-1-color: #fdba74;
  --json-key-4-color: #6ee7b7;
  --json-key-6-color: #93c5fd;
  --json-string-color: #34d399;
  --json-number-color: #a78bfa;
  --json-boolean-color: #fb923c;
  --panel-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}

.tool-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.tool-title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--el-text-color-primary);
  font-size: 24px;
  font-weight: 700;
}

.header-actions {
  display: flex;
  align-items: center;
}

.mr-2 {
  margin-right: 12px;
}

.icon-bracket {
  padding: 4px 12px;
  border-radius: 6px;
  background: var(--icon-bracket-bg);
  color: #6366f1;
  font: 600 20px/1 var(--json-font-family);
}

.subtitle {
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  font-size: 13px;
  font-weight: 500;
}

.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
}

.settings-checkbox {
  margin-right: 0;
}

.panel-container {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: var(--panel-border);
  border-radius: var(--panel-radius);
  background: var(--el-bg-color);
  box-shadow: var(--panel-shadow);
}

.panel {
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  background: var(--el-bg-color);
}

.left-panel {
  flex: 0 0 400px;
  border-right: var(--panel-border);
}

.right-panel {
  flex: 1;
}

.panel-header {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--panel-header-height);
  padding: 0 var(--panel-padding);
  border-bottom: var(--panel-border);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.panel-title {
  font-weight: 700;
  letter-spacing: 0.05em;
}

.panel-actions {
  display: flex;
  gap: 8px;
}

.panel-action-icon {
  padding: 5px 8px;
}

.panel-header--split {
  justify-content: flex-start;
}

.panel-header-cell {
  flex: 1;
  min-width: 0;
}

.panel-header-cell--offset {
  padding-left: 8px;
}

.error-header {
  background: var(--el-color-danger);
  color: #fff;
}

.editor-area,
.result-col {
  color: var(--el-text-color-primary);
  font: 13px/1.5 var(--json-font-family);
}

.editor-area {
  flex: 1;
  width: 100%;
  padding: var(--panel-padding);
  border: 0;
  outline: none;
  resize: none;
  background: var(--el-bg-color);
}

.editor-area::placeholder {
  color: var(--el-text-color-placeholder);
}

.result-area {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.result-col {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: var(--panel-padding);
}

.parse-col {
  border-right: var(--panel-border);
}

.non-standard-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
  font-size: 11px;
  border-top: 1px solid var(--el-color-warning-light-7);
}

:deep(.json-selected-node) {
  background: var(--el-fill-color-light) !important;
  box-shadow: 0 0 0 1px var(--el-color-primary-light-7);
  border-radius: 2px;
  position: relative;
  z-index: 1;
}

.path-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 22px;
  padding: 0 10px;
  border-top: 1px solid var(--el-border-color-extra-light);
  background: transparent;
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  transition: all 0.2s ease;
}

.path-bar--locked {
  background: transparent;
  border-top: 1px solid var(--el-border-color);
  color: var(--el-text-color-primary);
}

.path-display {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  flex: 1;
}

.path-label {
  font-weight: 500;
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--el-text-color-placeholder);
}

.path-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--json-font-family);
  color: var(--el-text-color-secondary);
  padding: 0 4px;
}

.path-bar--locked .path-text {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.path-copy-btn {
  margin-left: 6px;
  height: 18px !important;
  font-size: 10px !important;
  padding: 0 4px !important;
}

.gutter {
  position: relative;
  z-index: 10;
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: var(--gutter-width);
  margin: 0 var(--gutter-offset);
  cursor: col-resize;
  background: transparent;
  transition: background var(--transition-fast);
}

.gutter:hover {
  background: var(--el-color-primary-light-9);
}

.gutter::after {
  content: '';
  position: absolute;
  left: 50%;
  width: 4px;
  height: 40px;
  border-radius: 2px;
  transform: translateX(-50%);
  background: var(--el-border-color);
  transition:
    background var(--transition-fast),
    height var(--transition-fast);
}

.gutter:hover::after {
  height: 60px;
  background: var(--el-color-primary);
}

:deep(.status-tip) {
  color: var(--el-text-color-secondary);
  font-style: italic;
}

:deep(.error-box) {
  padding: 12px;
  border: 1px solid var(--el-color-danger-light-5);
  border-radius: 4px;
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

:deep(.error-box--italic) {
  font-style: italic;
}

:deep(.json-tree) {
  margin: 0;
  padding-left: 20px;
  list-style: none;
  line-height: 1.5;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.json-tree li) {
  position: relative;
  white-space: pre-wrap;
  word-break: break-all;
}

:deep(.json-tree li:hover) {
  background: var(--el-fill-color-light);
}

:deep(.json-toggle) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin-right: 6px;
  border: 1px solid var(--el-border-color);
  border-radius: 3px;
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-secondary);
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  user-select: none;
}

:deep(.json-toggle:hover) {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

:deep(.folded) {
  display: none;
}

:deep(.json-size-indicator) {
  padding: 0 4px;
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 600;
}

:deep(.json-key) {
  font-weight: 500;
}

:deep([data-path]) {
  cursor: pointer;
  border-radius: 2px;
  transition: background 0.1s;
}

:deep([data-path]:hover) {
  background: var(--el-color-primary-light-9);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
}

:deep(.json-key-0) {
  color: var(--json-key-0-color);
}

:deep(.json-key-1) {
  color: var(--json-key-1-color);
}

:deep(.json-key-2) {
  color: var(--json-key-2-color);
}

:deep(.json-key-3) {
  color: var(--json-key-3-color);
}

:deep(.json-key-4) {
  color: var(--json-key-4-color);
}

:deep(.json-key-5) {
  color: var(--json-key-5-color);
}

:deep(.json-key-6) {
  color: var(--json-key-6-color);
}

:deep(.json-key-7) {
  color: var(--json-key-7-color);
}

:deep(.json-key-8) {
  color: var(--json-key-8-color);
}

:deep(.json-load-more) {
  color: var(--el-color-primary);
  cursor: pointer;
  font-style: italic;
  padding: 4px 0;
  list-style: none !important;
  font-size: 11px;
  opacity: 0.8;
  transition: all 0.2s;
}

:deep(.json-load-more:hover) {
  opacity: 1;
  text-decoration: underline;
}

:deep(.json-string) {
  color: var(--json-string-color);
}

:deep(.json-number) {
  color: var(--json-number-color);
  font-weight: 500;
}

:deep(.json-boolean) {
  color: var(--json-boolean-color);
  font-weight: 600;
}

:deep(.json-null) {
  color: var(--el-text-color-placeholder);
  font-style: italic;
}

:deep(.json-bracket) {
  color: var(--el-text-color-regular);
}

:deep(.json-type) {
  margin-left: 6px;
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  opacity: 0.6;
}

:deep(.type-string) {
  color: var(--json-type-string-color);
}

:deep(.type-number) {
  color: var(--json-type-number-color);
}

:deep(.type-boolean) {
  color: var(--json-type-boolean-color);
}

:deep(.type-object) {
  color: var(--json-type-object-color);
}

:deep(.type-array) {
  color: var(--json-type-array-color);
}
</style>
