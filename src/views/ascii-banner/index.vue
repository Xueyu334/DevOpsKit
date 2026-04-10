<script setup>
import { ref, onMounted, watch } from 'vue'
import figlet from 'figlet'
import { ElMessage } from 'element-plus'
import progress from '@/utils/nprogress'

const inputText = ref('DevOps Kit')
const resultText = ref('')
const selectedFont = ref('Standard')
const horizontalLayout = ref('default')
const verticalLayout = ref('default')
const loading = ref(false)

// 点阵模式控制
const dotMatrixMode = ref(false)
const dotChar = ref('#')
const dotSize = ref(14)

const fontOptions = [
  { label: 'Standard', value: 'Standard' },
  { label: 'Slant', value: 'Slant' },
  { label: 'Big', value: 'Big' },
  { label: 'Small', value: 'Small' },
  { label: 'Shadow', value: 'Shadow' },
  { label: 'Script', value: 'Script' },
  { label: 'Block', value: 'Block' },
  { label: 'Bubble', value: 'Bubble' },
  { label: 'Digital', value: 'Digital' },
  { label: 'Banner', value: 'Banner' },
  { label: 'Mini', value: 'Mini' },
  { label: 'Ivrit', value: 'Ivrit' },
  { label: 'Lean', value: 'Lean' }
]

const layoutOptions = [
  { label: '默认', value: 'default' },
  { label: '全宽', value: 'full' },
  { label: '紧凑', value: 'fitted' },
  { label: '强制层叠', value: 'controlled smushing' },
  { label: '强制合并', value: 'universal smushing' }
]

// 点阵生成逻辑 (支持中文)
const generateDotMatrix = () => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const text = inputText.value
  if (!text) return ''

  // 1. 设置合理的画布大小
  const fontSize = dotSize.value * 2 // 内部渲染大一点，再采样提高精度
  ctx.font = `bold ${fontSize}px "Microsoft YaHei", "PingFang SC", "SimSun", sans-serif`
  const metrics = ctx.measureText(text)

  canvas.width = Math.ceil(metrics.width) + 10
  canvas.height = fontSize * 1.5

  // 2. 绘制文本
  ctx.font = `bold ${fontSize}px "Microsoft YaHei", "PingFang SC", "SimSun", sans-serif`
  ctx.fillStyle = 'black'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 0, canvas.height / 2)

  // 3. 采样
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  let result = ''

  // 步进值决定采样率
  const step = 2
  for (let y = 0; y < canvas.height; y += step * 2) {
    let row = ''
    for (let x = 0; x < canvas.width; x += step) {
      const alpha = imgData[(y * canvas.width + x) * 4 + 3]
      row += alpha > 100 ? dotChar.value : ' '
    }
    if (row.trim()) {
      result += row + '\n'
    }
  }
  return result
}

const generateBanner = () => {
  if (!inputText.value) {
    resultText.value = ''
    return
  }

  if (dotMatrixMode.value) {
    resultText.value = generateDotMatrix()
    return
  }

  loading.value = true
  progress.start() // 开始加载进度条

  // figlet.text is asynchronous when loading fonts
  figlet.text(
    inputText.value,
    {
      font: selectedFont.value,
      horizontalLayout: horizontalLayout.value,
      verticalLayout: verticalLayout.value,
      width: 80,
      whitespaceBreak: true
    },
    (err, data) => {
      loading.value = false
      progress.done() // 结束进度条
      if (err) {
        console.error('Figlet error:', err)
        ElMessage.error('生成失败: ' + err.message)
        resultText.value = 'Error generating ASCII art'
        return
      }
      resultText.value = data
    }
  )
}

// Set up font path for figlet
onMounted(() => {
  // We need to tell figlet where to find the .flf files in the browser
  // Use the base URL if the app is hosted on a subpath
  const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  figlet.defaults({ fontPath: `${baseUrl}/fonts/ascii` })
  generateBanner()
})

watch([inputText, selectedFont, horizontalLayout, verticalLayout, dotMatrixMode, dotChar, dotSize], () => {
  generateBanner()
})

const copyToClipboard = async () => {
  if (!resultText.value) return
  try {
    await navigator.clipboard.writeText(resultText.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

const downloadAscii = () => {
  if (!resultText.value) return
  const blob = new Blob([resultText.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `banner-${selectedFont.value}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success('已开始下载')
}
</script>

<template>
  <div class="app-container">
    <div class="tool-header">
      <div class="tool-title">
        <span class="icon-ascii">A</span>
        ASCII 艺术字生成
        <span class="subtitle">Spring Boot Banner 在线预览</span>
      </div>
    </div>

    <div class="panel-container">
      <div class="panel left-panel">
        <div class="panel-header">
          <div class="panel-title">配置选项</div>
        </div>
        <div class="options-form">
          <el-form label-position="top">
            <el-form-item label="输入文本 (建议英文/数字/符号)">
              <el-input
                v-model="inputText"
                type="textarea"
                :rows="3"
                maxlength="200"
                show-word-limit
                placeholder="请输入要转换的内容..."
                @input="generateBanner"
              />
            </el-form-item>

            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="生成模式">
                  <el-radio-group v-model="dotMatrixMode">
                    <el-radio :label="false">标准模式 (FIGfont)</el-radio>
                    <el-radio :label="true">点阵模式 (支持中文)</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>

            <template v-if="!dotMatrixMode">
              <el-row :gutter="20">
                <el-col :span="24">
                  <el-form-item label="选择字体">
                    <el-select v-model="selectedFont" placeholder="请选择字体" style="width: 100%">
                      <el-option
                        v-for="item in fontOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item>
                    <template #label>
                      水平布局
                      <el-tooltip content="控制字符之间的水平间距和层叠方式" placement="top">
                        <el-icon class="help-icon"><IconEpQuestionFilled /></el-icon>
                      </el-tooltip>
                    </template>
                    <el-select v-model="horizontalLayout" placeholder="水平布局" style="width: 100%">
                      <el-option
                        v-for="item in layoutOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item>
                    <template #label>
                      垂直布局
                      <el-tooltip content="控制字符在垂直方向上的层叠和间距" placement="top">
                        <el-icon class="help-icon"><IconEpQuestionFilled /></el-icon>
                      </el-tooltip>
                    </template>
                    <el-select v-model="verticalLayout" placeholder="垂直布局" style="width: 100%">
                      <el-option
                        v-for="item in layoutOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </template>

            <template v-else>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item>
                    <template #label>
                      填充字符
                      <el-tooltip content="在预览中用于绘制点阵的单个字符" placement="top">
                        <el-icon class="help-icon"><IconEpQuestionFilled /></el-icon>
                      </el-tooltip>
                    </template>
                    <el-input v-model="dotChar" maxlength="1" placeholder="例如 #" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item>
                    <template #label>
                      字号大小
                      <el-tooltip content="数值越大点阵越精细，细节还原度越高，生成的字符画也越大" placement="top">
                        <el-icon class="help-icon"><IconEpQuestionFilled /></el-icon>
                      </el-tooltip>
                    </template>
                    <el-input-number v-model="dotSize" :min="8" :max="30" style="width: 100%" />
                  </el-form-item>
                </el-col>
              </el-row>
            </template>

            <div class="tips-box">
              <p>💡 <strong>提示:</strong></p>
              <ul>
                <li>标准模式暂不支持中文，建议使用“点阵模式”。</li>
                <li>点阵模式下通过 Canvas 采样，能完美呈现各种中文字体。</li>
                <li>
                  Spring Boot 用户可将结果保存为 <code>banner.txt</code> 放在 <code>src/main/resources</code> 下。
                </li>
              </ul>
            </div>
          </el-form>
        </div>
      </div>

      <div class="panel right-panel">
        <div class="panel-header">
          <div class="panel-title">预览结果</div>
          <div class="panel-actions">
            <el-button type="primary" size="small" @click="copyToClipboard">
              <el-icon>
                <IconEpDocumentCopy />
              </el-icon>
              复制
            </el-button>
            <el-button type="success" size="small" @click="downloadAscii">
              <el-icon>
                <IconEpDownload />
              </el-icon>
              下载
            </el-button>
          </div>
        </div>
        <div v-loading="loading" class="result-container">
          <pre class="ascii-output">{{ resultText || '等待输入...' }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  padding: 10px 24px;
  box-sizing: border-box;
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
  font-size: 20px;
  font-weight: 700;
}

.help-icon {
  margin-left: 4px;
  vertical-align: middle;
  color: var(--el-text-color-secondary);
  cursor: help;
}

.icon-ascii {
  padding: 4px 12px;
  border-radius: 6px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font:
    700 20px/1 'Courier New',
    monospace;
}

.subtitle {
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  font-size: 13px;
  font-weight: 500;
}

.panel-container {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 20px;
}

.panel {
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.left-panel {
  flex: 0 0 350px;
}

.right-panel {
  flex: 1;
}

.panel-header {
  height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-light);
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.panel-actions {
  display: flex;
  gap: 8px;
}

.options-form {
  padding: 20px;
  overflow-y: auto;
}

.result-container {
  flex: 1;
  padding: 20px;
  background: #1e1e1e;
  /* Dark background for better ASCII visibility */
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.ascii-output {
  margin: 0;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.2;
  color: #00ff00;
  /* Matrix-like green or Spring Boot Green */
  white-space: pre;
}

.tips-box {
  margin-top: 20px;
  padding: 12px;
  background: var(--el-color-info-light-9);
  border-radius: 6px;
  border-left: 4px solid var(--el-color-info);
}

.tips-box p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.tips-box ul {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.tips-box li {
  margin-bottom: 4px;
}

/* Dark mode adjustments */
html.dark .panel-header {
  background: var(--el-fill-color-darker);
}

html.dark .ascii-output {
  color: #4ade80;
}
</style>
