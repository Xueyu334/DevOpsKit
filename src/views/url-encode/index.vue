<template>
  <div class="app-container">
    <div class="panel-container">
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
          placeholder="在此粘贴需要 URL编码/解码 的内容"
          spellcheck="false"
          @focus="activePane = 'left'"
          @input="activePane = 'left'"
        ></textarea>
        <div v-if="leftText" class="panel-footer">{{ leftStats }}</div>
      </div>

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
          placeholder="处理结果将在此处显示，也可在此粘贴进行逆向操作"
          spellcheck="false"
          @focus="activePane = 'right'"
          @input="activePane = 'right'"
        ></textarea>
        <div v-if="rightText" class="panel-footer">{{ rightStats }}</div>
      </div>
    </div>

    <div class="action-bar mb-4">
      <el-tooltip
        content="仅编码/解码包含的特定组件敏感字符(如 ? & =)，取消勾选则进行整个完整 URL 的低强度编解码"
        placement="top"
      >
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
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useCopyText } from '@/composables/useCopyText'

const leftText = ref('')
const rightText = ref('')
const activePane = ref('left') // Tracks which pane is currently being used
const { copyText } = useCopyText()

const options = reactive({
  multiLine: false,
  encodeComponent: true
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
}

const encodeUrl = str => {
  return options.encodeComponent ? encodeURIComponent(str) : encodeURI(str)
}

const decodeUrl = str => {
  return options.encodeComponent ? decodeURIComponent(str) : decodeURI(str)
}

const processAction = action => {
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
      result = sourceText
        .split('\n')
        .map(line => {
          if (!line.trim()) return ''
          try {
            return action === 'encode' ? encodeUrl(line) : decodeUrl(line)
          } catch (e) {
            hasError = true
            return line
          }
        })
        .join('\n')

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
