<template>
  <div class="app-container">
    <div class="panel-container">
      <div class="panel left-panel" :class="{ 'is-active': activePane === 'left' }">
        <div class="panel-toolbar" v-if="leftText">
          <el-tooltip content="复制全部" placement="top">
            <el-button link class="copy-btn" @click="handleCopy(leftText)">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </el-button>
          </el-tooltip>
        </div>
        <textarea v-model="leftText" class="editor-area" spellcheck="false" placeholder="在此粘贴需要 URL编码/解码 的内容"
          @focus="activePane = 'left'" @input="activePane = 'left'"></textarea>
        <div class="panel-footer" v-if="leftText">{{ leftStats }}</div>
      </div>

      <div class="panel right-panel" :class="{ 'is-active': activePane === 'right' }">
        <div class="panel-toolbar" v-if="rightText">
          <el-tooltip content="复制全部" placement="top">
            <el-button link class="copy-btn" @click="handleCopy(rightText)">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </el-button>
          </el-tooltip>
        </div>
        <textarea v-model="rightText" class="editor-area" spellcheck="false" placeholder="处理结果将在此处显示，也可在此粘贴进行逆向操作"
          @focus="activePane = 'right'" @input="activePane = 'right'"></textarea>
        <div class="panel-footer" v-if="rightText">{{ rightStats }}</div>
      </div>
    </div>

    <div class="action-bar mb-4">
      <el-tooltip content="仅编码/解码包含的特定组件敏感字符(如 ? & =)，取消勾选则进行整个完整 URL 的低强度编解码" placement="top">
        <el-checkbox v-model="options.encodeComponent">强转义模式 (URIComponent)</el-checkbox>
      </el-tooltip>
      <el-tooltip content="勾选后将按行执行，独立的解析异常不会影响其它行" placement="top">
        <el-checkbox v-model="options.multiLine">多行模式</el-checkbox>
      </el-tooltip>
      <el-button type="primary" @click="handleEncode">URL编码</el-button>
      <el-button type="primary" @click="handleDecode">URL解码</el-button>
      <el-button link type="danger" @click="handleClear">清空结果</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'

const leftText = ref('')
const rightText = ref('')
const activePane = ref('left') // Tracks which pane is currently being used

const options = reactive({
  multiLine: false,
  encodeComponent: true
})

const formatSize = (bytes) => {
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

const handleCopy = async (text) => {
  if (!text) return
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      ElMessage.success('已复制到剪贴板')
    } else {
      const textArea = document.createElement("textarea")
      textArea.value = text
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      textArea.style.top = "-999999px"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
      ElMessage.success('已复制到剪贴板')
    }
  } catch (err) {
    ElMessage.error('复制失败')
  }
}

const handleClear = () => {
  leftText.value = ''
  rightText.value = ''
}

const encodeUrl = (str) => {
  return options.encodeComponent ? encodeURIComponent(str) : encodeURI(str)
}

const decodeUrl = (str) => {
  return options.encodeComponent ? decodeURIComponent(str) : decodeURI(str)
}

const processAction = (action) => {
  const isLeftActive = activePane.value === 'left'
  const sourceText = isLeftActive ? leftText.value : rightText.value
  
  if (!sourceText) {
    ElMessage.warning('请输入需要处理的内容')
    return
  }

  try {
    let result = ''
    if (options.multiLine) {
      let hasError = false
      result = sourceText.split('\n').map(line => {
        if (!line.trim()) return ''
        try {
          return action === 'encode' ? encodeUrl(line) : decodeUrl(line)
        } catch (e) {
          hasError = true
          return line
        }
      }).join('\n')
      
      if (hasError && action === 'decode') {
        ElMessage.warning('部分行 URL 解码失败，已保留原内容')
      } else {
        ElMessage.success(action === 'encode' ? '编码完成' : '解码完成')
      }
    } else {
      result = action === 'encode' ? encodeUrl(sourceText) : decodeUrl(sourceText)
      ElMessage.success(action === 'encode' ? '编码完成' : '解码完成')
    }

    // Output strictly to the INACTIVE or the OTHER pane to prevent overwriting user input
    if (isLeftActive) {
      rightText.value = result
    } else {
      leftText.value = result
    }
  } catch (error) {
    if (action === 'decode') {
      ElMessage.error('URL 解码失败，可能含有非法转义字符格式 (URI malformed)')
    } else {
      ElMessage.error('编码失败: ' + error.message)
    }
  }
}

const handleEncode = () => processAction('encode')
const handleDecode = () => processAction('decode')
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
  font-family: inherit;
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
  font-family: inherit;
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
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>
