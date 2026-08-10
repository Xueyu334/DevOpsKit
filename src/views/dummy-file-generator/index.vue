<template>
  <div class="dummy-file-generator-container">
    <el-row :gutter="20">
      <!-- 配置参数区 -->
      <el-col :lg="12" :xs="24">
        <el-card class="config-card">
          <template #header>
            <div class="card-header">
              <span>配置参数</span>
              <el-button link type="info" @click="resetForm">重置</el-button>
            </div>
          </template>

          <el-form label-position="top">
            <el-form-item label="生成文件大小与单位">
              <el-row :gutter="10" style="width: 100%">
                <el-col :span="14">
                  <el-input-number
                    v-model="form.sizeValue"
                    :min="0.001"
                    :max="10000"
                    :precision="3"
                    :step="1"
                    placeholder="请输入数值"
                    style="width: 100%"
                  />
                </el-col>
                <el-col :span="10">
                  <el-select v-model="form.unit" style="width: 100%">
                    <el-option label="Byte (B)" value="B" />
                    <el-option label="KB (千字节)" value="KB" />
                    <el-option label="MB (兆字节)" value="MB" />
                    <el-option label="GB (吉字节)" value="GB" />
                  </el-select>
                </el-col>
              </el-row>
            </el-form-item>

            <el-form-item label="计算换算基准">
              <el-radio-group v-model="form.unitBase">
                <el-radio-button :value="1024">二进制基准 (1 KB = 1024 Bytes)</el-radio-button>
                <el-radio-button :value="1000">十进制基准 (1 KB = 1000 Bytes)</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="填充内容模式">
              <el-radio-group
                v-model="form.contentType"
                style="margin-bottom: 12px; display: flex; flex-wrap: wrap; gap: 8px"
              >
                <el-radio-button value="repeat-char">重复单一字符</el-radio-button>
                <el-radio-button value="custom-text">自定义文本块</el-radio-button>
                <el-radio-button value="numbered-lines">按行带行号文本</el-radio-button>
                <el-radio-button value="random-ascii">随机 ASCII 字符</el-radio-button>
              </el-radio-group>

              <!-- 依据不同模式展现辅助输入框 -->
              <template v-if="form.contentType === 'repeat-char'">
                <el-input v-model="form.fillChar" maxlength="1" placeholder="请输入单个填充字符，例如 0 或 A">
                  <template #prepend>填充字符</template>
                </el-input>
              </template>

              <template v-else-if="form.contentType === 'custom-text'">
                <el-input
                  v-model="form.customText"
                  :rows="2"
                  placeholder="请输入用于循环填充的字符串，例如：DevOpsKit Test Data "
                  type="textarea"
                />
              </template>

              <template v-else-if="form.contentType === 'numbered-lines'">
                <el-input v-model="form.linePrefix" placeholder="前缀文本，例如：Test Line ">
                  <template #prepend>每行前缀</template>
                </el-input>
              </template>
            </el-form-item>

            <el-form-item label="保存文件名">
              <el-input v-model="form.fileName" placeholder="自动根据大小生成，如 test-file-10MB.txt">
                <template #append>.txt</template>
              </el-input>
            </el-form-item>

            <el-form-item>
              <el-button
                :loading="generating"
                class="download-btn"
                size="large"
                type="primary"
                @click="generateAndDownload"
              >
                <el-icon class="el-icon--left"><IconEpDownload /></el-icon>
                {{ generating ? '正在生成中...' : '生成并下载文件' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 规格说明与信息预览区 -->
      <el-col :lg="12" :xs="24">
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span>文件规格预览</span>
              <el-tag :type="sizeAlertTagType">{{ sizeAlertText }}</el-tag>
            </div>
          </template>

          <div class="preview-metrics">
            <div class="metric-item">
              <div class="metric-label">设定目标大小</div>
              <div class="metric-value primary">{{ form.sizeValue }} {{ form.unit }}</div>
            </div>

            <div class="metric-item">
              <div class="metric-label">换算精确 Byte 字节数</div>
              <div class="metric-value font-mono">{{ calculatedBytes.toLocaleString() }} Bytes</div>
            </div>

            <div class="metric-item">
              <div class="metric-label">导出文件名</div>
              <div class="metric-value font-mono">{{ finalFileName }}</div>
            </div>
          </div>

          <el-divider>模式解析与安全策略</el-divider>

          <el-alert
            v-if="calculatedBytes > 2 * 1024 * 1024 * 1024"
            :closable="false"
            description="文件大小已超过 2GB，受限于浏览器内存（RAM）与 Blob 存储限制，下载极可能触发 Out of Memory 错误。建议分批生成或控制在 1.5GB 以内。"
            show-icon
            style="margin-bottom: 16px"
            title="容量警示"
            type="warning"
          />

          <div class="tech-tips">
            <div class="tip-title">
              <el-icon><IconEpInfoFilled /></el-icon> 客户端极速生成技术特点：
            </div>
            <ul>
              <li>
                <strong>纯前端内存复用</strong>：采用分块（Chunk Reuse）Blob 算法，无需后端服务器交互，保障隐私安全。
              </li>
              <li>
                <strong>零卡顿零占用</strong>：即使生成 1GB 大小的测试文件，也可以在数毫秒内组装完成，内存占用极小。
              </li>
              <li><strong>常用场景</strong>：适合带宽下载测速、网络上传组件极限测试、存储配额测试及日志模拟等。</li>
            </ul>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
const form = reactive({
  sizeValue: 10,
  unit: 'MB',
  unitBase: 1024,
  contentType: 'repeat-char',
  fillChar: '0',
  customText: 'DevOpsKit-Test-File-',
  linePrefix: 'Line ',
  fileName: ''
})

const generating = ref(false)

const resetForm = () => {
  form.sizeValue = 10
  form.unit = 'MB'
  form.unitBase = 1024
  form.contentType = 'repeat-char'
  form.fillChar = '0'
  form.customText = 'DevOpsKit-Test-File-'
  form.linePrefix = 'Line '
  form.fileName = ''
}

// 自动计算精确字节数
const calculatedBytes = computed(() => {
  const val = Number(form.sizeValue) || 0
  if (val <= 0) return 0

  const base = Number(form.unitBase) || 1024
  switch (form.unit) {
    case 'B':
      return Math.round(val)
    case 'KB':
      return Math.round(val * base)
    case 'MB':
      return Math.round(val * base * base)
    case 'GB':
      return Math.round(val * base * base * base)
    default:
      return Math.round(val)
  }
})

// 自动推导文件名并进行安全字符过滤
const finalFileName = computed(() => {
  let name = form.fileName.trim()
  if (name) {
    // 移除系统非法文件名字符: \ / : * ? " < > |
    name = name.replace(/[\\/:*?"<>|]/g, '_')
    return name.endsWith('.txt') ? name : `${name}.txt`
  }
  return `test-file-${form.sizeValue}${form.unit}.txt`
})

// 大小告警状态 Tag
const sizeAlertTagType = computed(() => {
  const bytes = calculatedBytes.value
  const gb = 1024 * 1024 * 1024
  if (bytes > 2 * gb) return 'danger'
  if (bytes > 500 * 1024 * 1024) return 'warning'
  return 'success'
})

const sizeAlertText = computed(() => {
  const bytes = calculatedBytes.value
  const gb = 1024 * 1024 * 1024
  if (bytes > 2 * gb) return '超大容量 (需谨慎)'
  if (bytes > 500 * 1024 * 1024) return '大文件 (直接下载)'
  return '安全范围'
})

/**
 * 极速生成并下载文件核心逻辑
 */
const generateAndDownload = () => {
  const totalBytes = calculatedBytes.value
  if (totalBytes <= 0) {
    ElMessage.warning('请输入有效的生成文件大小！')
    return
  }

  if (totalBytes > 2 * 1024 * 1024 * 1024) {
    ElMessage.warning('文件尺寸超过 2GB，受限于浏览器内存限制可能导致下载失败。')
  }

  generating.value = true

  // 使用 requestAnimationFrame 让 UI 渲染 Loading 状态
  requestAnimationFrame(() => {
    setTimeout(() => {
      try {
        const blob = buildBlob(totalBytes)
        downloadBlob(blob, finalFileName.value)
        ElMessage.success(`成功生成并开始下载 ${finalFileName.value}`)
      } catch (err) {
        console.error('File generation failed:', err)
        ElMessage.error(`生成失败: ${err.message || '内存不足或浏览器限制'}`)
      } finally {
        generating.value = false
      }
    }, 50)
  })
}

/**
 * 根据目标字节数与模式高效构建 Blob
 */
const buildBlob = targetBytes => {
  const encoder = new TextEncoder()

  // 1. 重复单个字符模式（最高效）
  if (form.contentType === 'repeat-char') {
    const char = form.fillChar || '0'
    const charBuf = encoder.encode(char)
    return buildChunkedBlob(charBuf, targetBytes)
  }

  // 2. 自定义文本块循环模式
  if (form.contentType === 'custom-text') {
    const text = form.customText || 'DevOpsKit '
    const textBuf = encoder.encode(text)
    return buildChunkedBlob(textBuf, targetBytes)
  }

  // 3. 随机 ASCII 模式
  if (form.contentType === 'random-ascii') {
    // 预先构造一个 64KB 的随机 ASCII 块，然后循环复用
    const chunkSize = 64 * 1024
    const sampleSize = Math.min(targetBytes, chunkSize)
    const randomBuf = new Uint8Array(sampleSize)
    const printableChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?\n'
    for (let i = 0; i < sampleSize; i++) {
      randomBuf[i] = printableChars.charCodeAt(Math.floor(Math.random() * printableChars.length))
    }
    return buildChunkedBlob(randomBuf, targetBytes)
  }

  // 4. 按行带行号模式
  if (form.contentType === 'numbered-lines') {
    return buildNumberedLinesBlob(targetBytes, encoder)
  }

  // 默认后备
  const fallbackBuf = encoder.encode('0')
  return buildChunkedBlob(fallbackBuf, targetBytes)
}

/**
 * 分块引用构造 Blob 优化核心算法
 * @param {Uint8Array} patternBuf 基础 pattern 字节数组
 * @param {number} targetBytes 目标总字节数
 */
const buildChunkedBlob = (patternBuf, targetBytes) => {
  if (patternBuf.length === 0) {
    patternBuf = new Uint8Array([48]) // '0'
  }

  // 构建约 1MB 大小的基准 ChunkBuffer 以减少 Blob 碎片
  const targetChunkSize = 1024 * 1024 // 1MB
  let chunkBuf = patternBuf

  if (patternBuf.length < targetChunkSize && targetBytes >= targetChunkSize) {
    const repeatCount = Math.ceil(targetChunkSize / patternBuf.length)
    const largeBuf = new Uint8Array(repeatCount * patternBuf.length)
    for (let i = 0; i < repeatCount; i++) {
      largeBuf.set(patternBuf, i * patternBuf.length)
    }
    chunkBuf = largeBuf
  }

  const chunks = []
  let remainingBytes = targetBytes

  while (remainingBytes > 0) {
    if (remainingBytes >= chunkBuf.length) {
      chunks.push(chunkBuf)
      remainingBytes -= chunkBuf.length
    } else {
      // 尾部剩余不足一个完整 Chunk，切片放入
      chunks.push(chunkBuf.subarray(0, remainingBytes))
      remainingBytes = 0
    }
  }

  return new Blob(chunks, { type: 'text/plain;charset=utf-8' })
}

/**
 * 构造按行带行号文本 Blob
 */
const buildNumberedLinesBlob = (targetBytes, encoder) => {
  const prefix = form.linePrefix || 'Line '
  const chunks = []
  let currentBytes = 0
  let lineNumber = 1

  // 批处理缓冲提升性能
  let batchText = ''

  while (currentBytes < targetBytes) {
    const line = `${prefix}${lineNumber}: Dummy test content for row verification.\n`
    const lineBytes = encoder.encode(line).length

    if (currentBytes + lineBytes <= targetBytes) {
      batchText += line
      currentBytes += lineBytes
      lineNumber++
    } else {
      const needed = targetBytes - currentBytes
      const padding = 'X'.repeat(needed)
      batchText += padding
      break
    }

    // 每 500KB 攒成一个 Blob Chunk 提交，避免字符串过于庞大
    if (batchText.length > 500000) {
      chunks.push(encoder.encode(batchText))
      batchText = ''
    }
  }

  if (batchText) {
    chunks.push(encoder.encode(batchText))
  }

  return new Blob(chunks, { type: 'text/plain;charset=utf-8' })
}

/**
 * 触发浏览器 Blob 下载
 */
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // 延时 10 秒释放 ObjectURL，保障大文件下载启动过程
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 10000)
}
</script>

<style scoped>
.dummy-file-generator-container {
  max-width: 1200px;
  margin: 10px auto;
}

.config-card,
.info-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.download-btn {
  width: 100%;
  margin-top: 10px;
  font-weight: bold;
}

.preview-metrics {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: var(--el-fill-color-light);
  padding: 18px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-label {
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.metric-value {
  font-size: 16px;
  font-weight: 600;
}

.metric-value.primary {
  color: var(--el-color-primary);
  font-size: 18px;
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
}

.tech-tips {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.tip-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tech-tips ul {
  padding-left: 20px;
  margin: 0;
}

.tech-tips li {
  margin-bottom: 4px;
}
</style>
