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
          placeholder="在此输入普通文本（支持中文、英文、数字及常用符号）..."
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
          placeholder="处理结果将在此处显示，也可在此粘贴 Unicode 转义序列 (如 \u4e2d\u6587) 或 HTML 字符实体 (如 &amp;#65;&amp;#20013;) 进行逆向转换..."
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
        <el-tooltip
          content="勾选后英文字符、数字及常用半角符号保持原样，仅转换中文等多字节非 ASCII 字符"
          placement="top"
        >
          <el-checkbox v-model="options.onlyNonAscii">仅转义非 ASCII 字符</el-checkbox>
        </el-tooltip>

        <el-tooltip
          content="勾选后生成 &amp;#x41;&amp;#x4e2d; 形式的十六进制实体，未勾选时默认生成 &amp;#65;&amp;#20013; 形式的十进制实体"
          placement="top"
        >
          <el-checkbox v-model="options.hexHtmlEntity">HTML 实体优先十六进制 (&amp;#xHEX;)</el-checkbox>
        </el-tooltip>

        <el-tooltip
          content="勾选后使用 ES6 扩展的 \u{1f600} 格式，未勾选时默认使用标准的 UTF-16 \uXXXX 格式或代理对"
          placement="top"
        >
          <el-checkbox v-model="options.es6Unicode">Unicode 优先 ES6 格式 (\u{...})</el-checkbox>
        </el-tooltip>
      </div>

      <div class="buttons-group">
        <el-tooltip content="将文本字符转换为 Unicode 转义序列，如 中文 → \u4e2d\u6587" placement="top">
          <el-button type="primary" @click="handleTextToUnicode">文本转 Unicode 转义</el-button>
        </el-tooltip>

        <el-tooltip content="将 Unicode 转义序列还原为可读文本，如 \u4e2d\u6587 → 中文" placement="top">
          <el-button type="primary" @click="handleUnicodeToText">Unicode 转义转文本</el-button>
        </el-tooltip>

        <el-tooltip content="将文本字符转换为 HTML 字符实体，如 A中 → &amp;#65;&amp;#20013;" placement="top">
          <el-button type="success" @click="handleTextToHtmlEntity">文本转 HTML 字符实体</el-button>
        </el-tooltip>

        <el-tooltip content="将 HTML 字符实体还原为可读文本，如 &amp;#65;&amp;#20013; → A中" placement="top">
          <el-button type="success" @click="handleHtmlEntityToText">HTML 字符实体转文本</el-button>
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
  onlyNonAscii: false,
  hexHtmlEntity: false,
  es6Unicode: false
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

// 1. 文本转 Unicode 转义
const textToUnicodeStr = str => {
  let res = ''
  for (const char of str) {
    const codePoint = char.codePointAt(0)
    if (options.onlyNonAscii && codePoint < 128) {
      res += char
    } else if (options.es6Unicode) {
      res += `\\u{${codePoint.toString(16).toLowerCase()}}`
    } else {
      if (codePoint <= 0xffff) {
        res += '\\u' + codePoint.toString(16).padStart(4, '0')
      } else {
        // UTF-16 代理对
        const high = Math.floor((codePoint - 0x10000) / 0x400) + 0xd800
        const low = ((codePoint - 0x10000) % 0x400) + 0xdc00
        res += '\\u' + high.toString(16).padStart(4, '0') + '\\u' + low.toString(16).padStart(4, '0')
      }
    }
  }
  return res
}

// 2. Unicode 转义转文本
const unicodeToTextStr = str => {
  // 检查格式问题
  const malformedReg = /\\u(?![0-9a-fA-F]{4}|\{[0-9a-fA-F]+\})/g
  if (malformedReg.test(str)) {
    throw new Error('格式不正确：包含无效的 Unicode 转义序列 (如 \\u 后位数不足或包含非十六进制字符)')
  }

  const validReg = /\\u(?:[0-9a-fA-F]{4}|\{[0-9a-fA-F]+\})/g
  if (!validReg.test(str)) {
    throw new Error('未检测到有效的 Unicode 转义序列 (示例格式：\\u4e2d\\u6587 或 \\u{1f600})')
  }

  // 转换 ES6 格式 \u{XXXX}
  let converted = str.replace(/\\u\{([0-9a-fA-F]+)\}/g, (match, hex) => {
    const code = parseInt(hex, 16)
    if (code > 0x10ffff) {
      throw new Error(`码点 U+${hex.toUpperCase()} 超出 Unicode 有效范围`)
    }
    return String.fromCodePoint(code)
  })

  // 转换 UTF-16 代理对
  converted = converted.replace(/\\u([0-9a-fA-F]{4})\\u([0-9a-fA-F]{4})/g, (match, highHex, lowHex) => {
    const high = parseInt(highHex, 16)
    const low = parseInt(lowHex, 16)
    if (high >= 0xd800 && high <= 0xdbff && low >= 0xdc00 && low <= 0xdfff) {
      const code = (high - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000
      return String.fromCodePoint(code)
    }
    return String.fromCharCode(high) + String.fromCharCode(low)
  })

  // 转换单字 \uXXXX
  converted = converted.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16))
  })

  return converted
}

// 3. 文本转 HTML 字符实体
const textToHtmlEntityStr = str => {
  let res = ''
  for (const char of str) {
    const codePoint = char.codePointAt(0)
    if (options.onlyNonAscii && codePoint < 128) {
      res += char
    } else {
      if (options.hexHtmlEntity) {
        res += `&#x${codePoint.toString(16)};`
      } else {
        res += `&#${codePoint};`
      }
    }
  }
  return res
}

// 4. HTML 字符实体转文本
const htmlEntityMap = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&nbsp;': ' '
}

const htmlEntityToTextStr = str => {
  const malformedReg = /&#(?![0-9]+;|x[0-9a-fA-F]+;)/gi
  if (malformedReg.test(str)) {
    throw new Error('格式不正确：包含格式不完整的 HTML 实体 (缺少数值或未以分号 ; 结尾，如 &#65)')
  }

  const validReg = /&#(?:[0-9]+|x[0-9a-fA-F]+);|&(?:amp|lt|gt|quot|apos|nbsp);/gi
  if (!validReg.test(str)) {
    throw new Error('未检测到有效的 HTML 字符实体 (示例格式：&#65;&#20013; 或 &#x41;&#x4e2d;)')
  }

  let converted = str.replace(/&#(x[0-9a-fA-F]+|[0-9]+);/gi, (match, numStr) => {
    const code = numStr.toLowerCase().startsWith('x') ? parseInt(numStr.slice(1), 16) : parseInt(numStr, 10)
    if (code > 0x10ffff) {
      throw new Error(`实体 ${match} 的数值超出 Unicode 有效范围`)
    }
    return String.fromCodePoint(code)
  })

  converted = converted.replace(/&(amp|lt|gt|quot|apos|nbsp);/gi, match => {
    return htmlEntityMap[match.toLowerCase()] || match
  })

  return converted
}

// 通用执行包装函数
const executeConversion = (convertFn, successMsg) => {
  const isLeftActive = activePane.value === 'left'
  const sourceText = isLeftActive ? leftText.value : rightText.value

  if (!sourceText) {
    ElMessage.warning('请输入需要转换的内容')
    return
  }

  try {
    const result = convertFn(sourceText)
    if (isLeftActive) {
      rightText.value = result
    } else {
      leftText.value = result
    }
    ElMessage.success(successMsg)
  } catch (error) {
    ElMessage.error(error.message || '转换过程中出现错误')
  }
}

const handleTextToUnicode = () => executeConversion(textToUnicodeStr, '文本已成功转为 Unicode 转义序列')
const handleUnicodeToText = () => executeConversion(unicodeToTextStr, 'Unicode 转义序列已成功还原为文本')
const handleTextToHtmlEntity = () => executeConversion(textToHtmlEntityStr, '文本已成功转为 HTML 字符实体')
const handleHtmlEntityToText = () => executeConversion(htmlEntityToTextStr, 'HTML 字符实体已成功还原为文本')
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
