<template>
  <div class="app-container">
    <!-- 左右编辑器面板 -->
    <div class="panel-container">
      <!-- 左侧面板 -->
      <div :class="{ 'is-active': activePane === 'left' }" class="panel left-panel">
        <div v-if="leftText" class="panel-toolbar">
          <el-tooltip content="复制全部" placement="top">
            <el-button class="copy-btn" link @click="handleCopy(leftText)">
              <el-icon>
                <IconEpCopyDocument />
              </el-icon>
            </el-button>
          </el-tooltip>
        </div>
        <textarea
          v-model="leftText"
          class="editor-area"
          placeholder="在此输入包含 HTML 标签或特殊字符的普通文本 (例如 <div>内容</div>)..."
          spellcheck="false"
          @focus="activePane = 'left'"
          @input="activePane = 'left'"
        ></textarea>
        <div v-if="leftText" class="panel-footer">{{ leftStats }}</div>
      </div>

      <!-- 右侧面板 -->
      <div :class="{ 'is-active': activePane === 'right' }" class="panel right-panel">
        <div v-if="rightText" class="panel-toolbar">
          <el-tooltip content="复制全部" placement="top">
            <el-button class="copy-btn" link @click="handleCopy(rightText)">
              <el-icon>
                <IconEpCopyDocument />
              </el-icon>
            </el-button>
          </el-tooltip>
        </div>
        <textarea
          v-model="rightText"
          class="editor-area"
          placeholder="处理结果将在此处显示，也可在此粘贴 HTML 字符引用 (例如 &amp;lt;div&amp;gt;) 进行解码还原..."
          spellcheck="false"
          @focus="activePane = 'right'"
          @input="activePane = 'right'"
        ></textarea>
        <div v-if="rightText" class="panel-footer">{{ rightStats }}</div>
      </div>
    </div>

    <!-- 选项配置与转换按钮工具栏 -->
    <div class="action-bar mb-4">
      <div class="options-group">
        <el-tooltip content="勾选后将单引号 (') 和双引号 (&quot;) 一并转换为 HTML 字符引用" placement="top">
          <el-checkbox v-model="options.encodeQuotes">转义单双引号</el-checkbox>
        </el-tooltip>
        <el-tooltip content="勾选后将空格字符转换为 &amp;nbsp; 实体" placement="top">
          <el-checkbox v-model="options.encodeSpace">转义空格字符 (&amp;nbsp;)</el-checkbox>
        </el-tooltip>
      </div>

      <div class="buttons-group">
        <el-tooltip content="将 <, >, &, 引号等 HTML 特殊字符转换为 HTML 字符引用" placement="top">
          <el-button type="primary" @click="handleEncode">HTML 编码</el-button>
        </el-tooltip>
        <el-tooltip content="将 HTML 字符引用还原为普通文本" placement="top">
          <el-button type="success" @click="handleDecode">HTML 解码</el-button>
        </el-tooltip>
        <el-button link type="danger" @click="handleClear">清空内容</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCopyText } from '@/composables/useCopyText'

const leftText = ref('')
const rightText = ref('')
const activePane = ref('left')
const { copyText } = useCopyText()

const options = reactive({
  encodeQuotes: true,
  encodeSpace: false
})

const formatSize = bytes => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const leftStats = computed(() => {
  if (!leftText.value) return ''
  const chars = leftText.value.length
  const bytes = new Blob([leftText.value]).size
  return `${chars} 字符  |  约 ${formatSize(bytes)}`
})

const rightStats = computed(() => {
  if (!rightText.value) return ''
  const chars = rightText.value.length
  const bytes = new Blob([rightText.value]).size
  return `${chars} 字符  |  约 ${formatSize(bytes)}`
})

const handleCopy = text => copyText(text)

const handleClear = () => {
  leftText.value = ''
  rightText.value = ''
  ElMessage.success('已清空内容')
}

// 核心转义映射表
const htmlEncodeMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;'
}

const encodeHtmlStr = str => {
  let res = ''
  for (const char of str) {
    if (htmlEncodeMap[char]) {
      res += htmlEncodeMap[char]
    } else if (options.encodeQuotes && char === '"') {
      res += '&quot;'
    } else if (options.encodeQuotes && char === "'") {
      res += '&#39;'
    } else if (options.encodeSpace && char === ' ') {
      res += '&nbsp;'
    } else {
      res += char
    }
  }
  return res
}

// 核心解码映射表
const htmlNamedEntities = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#39;': "'",
  '&nbsp;': ' ',
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™'
}

const decodeHtmlStr = str => {
  // 检测格式错误：&# 后面没有正确的分号封口或没有合法数值
  const malformedReg = /&#(?![0-9]+;|x[0-9a-fA-F]+;)/gi
  if (malformedReg.test(str)) {
    throw new Error('格式不正确：包含无效或未封口的数值字符引用 (例如 &# 缺少数字或末尾未加分号)')
  }

  // 检查是否存在合法的字符引用或实体
  const validReg = /&#(?:[0-9]+|x[0-9a-fA-F]+);|&(?:amp|lt|gt|quot|apos|nbsp|copy|reg|trade);/gi
  if (!validReg.test(str)) {
    throw new Error('未检测到有效的 HTML 字符引用 (示例格式：&lt;div&gt; 或 &#65;)')
  }

  // 替换数值实体
  let result = str.replace(/&#(x[0-9a-fA-F]+|[0-9]+);/gi, (match, numStr) => {
    const code = numStr.toLowerCase().startsWith('x')
      ? parseInt(numStr.slice(1), 16)
      : parseInt(numStr, 10)
    if (code > 0x10ffff) {
      throw new Error(`数值实体 ${match} 的数值超出 Unicode 有效范围`)
    }
    return String.fromCodePoint(code)
  })

  // 替换常见命名实体
  result = result.replace(/&(amp|lt|gt|quot|apos|nbsp|copy|reg|trade);/gi, match => {
    return htmlNamedEntities[match.toLowerCase()] || match
  })

  return result
}

// 统一执行
const executeAction = (fn, successMsg) => {
  const isLeftActive = activePane.value === 'left'
  const sourceText = isLeftActive ? leftText.value : rightText.value

  if (!sourceText) {
    ElMessage.warning('请输入需要处理的内容')
    return
  }

  try {
    const result = fn(sourceText)
    if (isLeftActive) {
      rightText.value = result
    } else {
      leftText.value = result
    }
    ElMessage.success(successMsg)
  } catch (error) {
    ElMessage.error(error.message || '处理时发生错误')
  }
}

const handleEncode = () => executeAction(encodeHtmlStr, 'HTML 编码完成')
const handleDecode = () => executeAction(decodeHtmlStr, 'HTML 解码完成')
</script>

<style scoped>
.app-container {
  padding: 24px;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-container {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 16px;
}

/* 面板通用 */
.panel {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  background: var(--el-bg-color);
  border-radius: 4px;
  border: 1px solid var(--el-border-color-light);
  transition: all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.panel:focus-within,
.panel.is-active {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary-light-7) inset;
}

.panel-toolbar {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.panel:hover .panel-toolbar {
  opacity: 1;
}

.copy-btn {
  color: var(--el-text-color-secondary);
  padding: 6px;
  height: auto;
  margin: 0;
}

.copy-btn:hover {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  border-radius: 6px;
}

/* 编辑区 */
.editor-area {
  flex: 1;
  width: 100%;
  border: none;
  padding: 16px;
  padding-bottom: 28px !important;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  resize: none;
  outline: none;
  background: transparent;
  color: var(--el-text-color-primary);
  line-height: 1.5;
  box-sizing: border-box;
}

.editor-area::placeholder {
  color: var(--el-text-color-placeholder);
}

.panel-footer {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  pointer-events: none;
  font-family: 'Consolas', 'Monaco', monospace;
  background-color: rgba(255, 255, 255, 0.6);
  padding: 2px 6px;
  border-radius: 4px;
}

html.dark .panel-footer {
  background-color: rgba(0, 0, 0, 0.2);
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.options-group {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.buttons-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>
