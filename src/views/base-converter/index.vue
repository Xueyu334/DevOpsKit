<script setup>
import { ref, watch, computed } from 'vue'
import Big from 'big.js'
import { CopyDocument, Refresh, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const bases = [
  { label: '二进制 (Binary)', value: 2, prefix: '0b' },
  { label: '八进制 (Octal)', value: 8, prefix: '0o' },
  { label: '十进制 (Decimal)', value: 10, prefix: '' },
  { label: '十六进制 (Hexadecimal)', value: 16, prefix: '0x' }
]

const values = ref({
  2: '',
  8: '',
  10: '',
  16: ''
})

const useSeparator = ref(true)

// 格式化数字，支持十进制千分符，其他进制按位分组（二进制 4 位，八进制/十六进制不常用分组但可以做）
const formatNumber = (val, base) => {
  if (!val) return ''
  if (!useSeparator.value) return val

  if (base === 10) {
    try {
      // 使用 Big.js 处理大数显示并添加千分符
      const parts = val.split('.')
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      return parts.join('.')
    } catch (e) {
      return val
    }
  } else if (base === 2) {
    // 二进制按 4 位加空格或分隔符
    return val.replace(/\B(?=(\w{4})+(?!\w))/g, ' ')
  } else if (base === 16) {
    // 十六进制按 4 位加空格
    return val.replace(/\B(?=(\w{4})+(?!\w))/g, ' ')
  }
  return val
}

// 清理非数字字符（逗号、空格、前缀等）
const cleanInput = (val, base) => {
  let cleaned = val.replace(/[, ]/g, '')
  if (base === 16 && cleaned.toLowerCase().startsWith('0x')) cleaned = cleaned.slice(2)
  if (base === 8 && cleaned.toLowerCase().startsWith('0o')) cleaned = cleaned.slice(2)
  if (base === 2 && cleaned.toLowerCase().startsWith('0b')) cleaned = cleaned.slice(2)
  return cleaned
}

const updateValues = (sourceBase, newVal) => {
  const cleaned = cleanInput(newVal, sourceBase)
  if (!cleaned) {
    Object.keys(values.value).forEach(k => (values.value[k] = ''))
    return
  }

  try {
    let decimalValue
    if (sourceBase === 10) {
      decimalValue = BigInt(new Big(cleaned).toFixed(0)) // 只处理整数部分的精确转换
    } else {
      decimalValue = BigInt(`${bases.find(b => b.value === sourceBase).prefix}${cleaned}`)
    }

    Object.keys(values.value).forEach(k => {
      const b = parseInt(k)
      if (b !== sourceBase) {
        values.value[b] = decimalValue.toString(b).toUpperCase()
      } else {
        values.value[b] = cleaned.toUpperCase()
      }
    })
  } catch (e) {
    // 允许正在输入时不报错，只在转换完全失败时重置（或者保持现状）
    console.warn('Conversion failed', e)
  }
}

const handleInput = base => {
  const val = values.value[base]
  updateValues(base, val)
}

const copyToClipboard = text => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('复制成功')
  })
}

const clearAll = () => {
  Object.keys(values.value).forEach(k => (values.value[k] = ''))
}

// 模拟数据初始化
values.value[10] = '1024'
updateValues(10, '1024')

// 常用常数参考数据
const commonValues = [
  { name: 'Byte Max', dec: '255', oct: '377', hex: 'FF', bin: '1111 1111' },
  { name: 'Word Max (16-bit)', dec: '65535', oct: '177777', hex: 'FFFF', bin: '1111 1111 1111 1111' },
  { name: 'DWord Max (32-bit)', dec: '4294967295', oct: '37777777777', hex: 'FFFF FFFF', bin: '... FFFF' },
  { name: '1 KB (Binary)', dec: '1024', oct: '2000', hex: '400', bin: '0100 0000 0000' },
  { name: 'Int32 Max', dec: '2147483647', oct: '17777777777', hex: '7FFF FFFF', bin: '0111 1111 ... 1111' }
]
</script>

<template>
  <div class="base-converter-container">
    <el-card class="converter-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-info">
            <h2 class="card-title">进制转换 (Base Converter)</h2>
            <p class="card-subtitle">支持 2、8、10、16 进制之间的实时互转，支持超大数字与千分符格式化。</p>
          </div>
          <div class="header-actions">
            <el-checkbox v-model="useSeparator" label="启用格式化分隔符" />
            <el-button type="danger" link :icon="Delete" @click="clearAll">清空全部</el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="24" class="converter-row">
        <el-col v-for="base in bases" :key="base.value" :xs="24" :sm="24" :md="12" :lg="12" :xl="12" class="base-col">
          <div class="base-input-item">
            <div class="input-label">
              <span class="label-text">{{ base.label }}</span>
              <el-tag size="small" :type="base.value === 10 ? 'primary' : 'info'" effect="plain">
                Base {{ base.value }}
              </el-tag>
            </div>

            <div class="input-wrapper">
              <el-input
                v-model="values[base.value]"
                :placeholder="`请输入 ${base.value} 进制数值`"
                spellcheck="false"
                @input="handleInput(base.value)"
              >
                <template #append>
                  <el-button :icon="CopyDocument" @click="copyToClipboard(values[base.value])" />
                </template>
              </el-input>

              <div v-if="useSeparator && values[base.value]" class="preview-text">
                <span class="preview-label">格式化预览:</span>
                <span class="preview-val">{{ formatNumber(values[base.value], base.value) }}</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <div class="tool-tips">
        <el-alert type="info" :closable="false" show-icon>
          <template #title>
            <span class="tip-title">使用说明:</span>
            <span class="tip-content"
              >直接在任意框内输入；支持超大整数 (BigInt)；支持十进制千分符与二/十六进制分段预览。</span
            >
          </template>
        </el-alert>
      </div>
    </el-card>

    <!-- 常用常数参考 -->
    <div class="reference-section">
      <h3 class="section-title">常见数值参考 (Cheat Sheet)</h3>
      <el-table :data="commonValues" border stripe style="width: 100%" class="modern-table">
        <el-table-column prop="name" label="名称" width="180" align="center" />
        <el-table-column prop="dec" label="十进制 (Dec)" align="center" />
        <el-table-column prop="oct" label="八进制 (Oct)" align="center" />
        <el-table-column prop="hex" label="十六进制 (Hex)" align="center" />
        <el-table-column prop="bin" label="二进制 (Bin)" width="300" align="center" />
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.base-converter-container {
  max-width: 1100px;
  margin: 10px auto;
}

.converter-card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-info {
  flex: 1;
}

.card-title {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.card-subtitle {
  margin: 0;
  font-size: 14px;
  color: #64748b;
  font-weight: normal;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-top: 4px;
}

.converter-row {
  margin-bottom: 8px;
}

.base-col {
  margin-bottom: 20px;
}

.base-input-item {
  background: #f8fafc;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.base-input-item:focus-within {
  border-color: #409eff;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
}

.input-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.label-text {
  font-weight: 600;
  color: #334155;
  font-size: 15px;
}

:deep(.el-input-group__append) {
  padding: 0;
  overflow: hidden;
}

:deep(.el-input-group__append .el-button) {
  border: none;
  border-radius: 0;
  margin: 0;
  height: 100%;
  padding: 0 16px;
  transition: all 0.2s;
}

:deep(.el-input-group__append .el-button:hover) {
  background-color: #f1f5f9;
  color: #409eff;
}

:deep(.el-input-group__append .el-button:active) {
  background-color: #e2e8f0;
}

.preview-text {
  margin-top: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  color: #64748b;
  display: flex;
  gap: 8px;
  word-break: break-all;
}

.preview-label {
  color: #94a3b8;
  white-space: nowrap;
}

.preview-val {
  color: #409eff;
  font-weight: 600;
}

.tool-tips {
  margin-top: 0;
}

.tip-title {
  font-weight: 600;
  margin-right: 8px;
  font-size: 13px;
}

.tip-content {
  font-size: 13px;
  color: #64748b;
}

:deep(.el-alert) {
  padding: 8px 16px;
}

:deep(.el-alert__description) {
  margin: 0;
}

.reference-section {
  margin-top: 10px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 10px;
  padding-left: 12px;
  border-left: 4px solid #409eff;
}

.modern-table {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

:deep(.el-table th) {
  background-color: #f8fafc !important;
  color: #475569;
  font-weight: 600;
}
</style>
