<script setup>
import {ElMessage} from 'element-plus'
import {useCopyText} from '@/composables/useCopyText'
import {defaultHashAlgorithms, hashAlgorithmOptions, useHashGenerator} from './useHashGenerator'

const form = reactive({
  text: '',
  algorithms: [...defaultHashAlgorithms]
})

const {copyText} = useCopyText()

const {
  results,
  loading,
  errorMessage,
  calculateHashes,
  resetResults
} = useHashGenerator()

const canGenerate = computed(() => Boolean(form.text.trim()) && form.algorithms.length > 0)

const inputStats = computed(() => {
  const chars = form.text.length
  const bytes = new Blob([form.text]).size

  return [
    {label: '字符数:', value: chars},
    {label: '字节数:', value: bytes},
    {label: '已选算法:', value: form.algorithms.length}
  ]
})

const resultText = computed(() => {
  return results.value
      .map((item) => `${item.label}: ${item.digest}`)
      .join('\n')
})

watch(
    () => [form.text, form.algorithms.join('|')],
    () => {
      resetResults()
    }
)

const handleGenerate = async () => {
  if (!form.text.trim()) {
    ElMessage.warning('请输入需要计算摘要的文本')
    return
  }

  if (!form.algorithms.length) {
    ElMessage.warning('请至少选择一种摘要算法')
    return
  }

  const isSuccess = await calculateHashes({
    text: form.text,
    algorithms: form.algorithms
  })

  if (isSuccess) {
    ElMessage.success('摘要计算完成')
  } else if (errorMessage.value) {
    ElMessage.error(errorMessage.value)
  }
}

const handleClear = () => {
  form.text = ''
  form.algorithms = [...defaultHashAlgorithms]
  resetResults()
}
</script>

<template>
  <div class="app-container hash-page">
    <el-alert
        :closable="false"
        class="notice-banner"
        show-icon
        title="摘要计算在浏览器本地完成，不会上传输入文本。MD5 / SHA-1 适合兼容与校验场景，不建议用于新的安全设计。"
        type="info"
    />
    <el-row :gutter="6" class="top-row">
      <el-col :lg="12" :xs="24">
        <el-card class="editor-card" shadow="never">
          <template #header>
            <div class="section-head">
              <div>
                <h2 class="section-title">待计算文本</h2>
                <p class="section-subtitle">输入任意文本，按需生成多个常见信息摘要。</p>
              </div>
              <el-button link type="danger" @click="handleClear">清空</el-button>
            </div>
          </template>

          <el-input
              v-model="form.text"
              :rows="12"
              class="hash-input"
              clearable
              placeholder="请输入需要计算摘要的文本，例如配置内容、接口签名原文或待校验字符串"
              resize="none"
              type="textarea"
          />

          <div class="stats-row">
            <div
                v-for="item in inputStats"
                :key="item.label"
                class="stat-chip"
            >
              <span class="stat-chip-label">{{ item.label }}</span>
              <span class="stat-chip-value">{{ item.value }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :lg="12" :xs="24">
        <el-card class="config-card" shadow="never">
          <template #header>
            <div class="section-head">
              <div>
                <h2 class="section-title">摘要选项</h2>
                <p class="section-subtitle">至少选择一种算法，可一次输出多种结果。</p>
              </div>
            </div>
          </template>

          <el-form label-position="top">
            <el-form-item label="算法选择">
              <el-checkbox-group v-model="form.algorithms" class="algorithm-grid">
                <el-checkbox-button
                    v-for="option in hashAlgorithmOptions"
                    :key="option.value"
                    :value="option.value"
                >
                  <span class="algorithm-option">
                    <span class="algorithm-option-text">{{ option.label }}</span>
                    <el-tooltip
                        :content="`${option.description} · ${option.digestSize} bit`"
                        placement="top"
                    >
                      <el-icon class="algorithm-option-tip">
                        <IconEpInfoFilled/>
                      </el-icon>
                    </el-tooltip>
                  </span>
                </el-checkbox-button>
              </el-checkbox-group>
            </el-form-item>
          </el-form>

          <div class="selected-algorithms">
            <span class="selected-algorithms-label">当前选择</span>
            <div class="selected-algorithms-list">
              <el-tag
                  v-for="option in hashAlgorithmOptions.filter(item => form.algorithms.includes(item.value))"
                  :key="option.value"
                  effect="light"
                  round
              >
                {{ option.label }}
              </el-tag>
            </div>
          </div>

          <div class="action-panel">
            <el-button
                :disabled="!canGenerate"
                :loading="loading"
                class="action-button"
                type="primary"
                @click="handleGenerate"
            >
              计算摘要
            </el-button>
            <el-button
                :disabled="!results.length"
                class="action-button"
                @click="copyText(resultText, { successMessage: '全部摘要已复制' })"
            >
              复制全部
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-card class="result-card" shadow="never">
      <template #header>
        <div class="section-head">
          <div>
            <h2 class="section-title">摘要结果</h2>
            <p class="section-subtitle">每项结果均可单独复制，默认输出十六进制摘要。</p>
          </div>
        </div>
      </template>

      <div v-if="results.length" class="result-panel">
        <el-scrollbar class="result-scrollbar">
          <el-row :gutter="14" class="result-list">
            <el-col v-for="item in results"
                    :key="item.algorithm" :lg="12" :xs="24">
              <article class="result-item">
                <div class="result-item-head">
                  <div class="result-item-summary">
                    <span class="result-algorithm">{{ item.label }}</span>
                    <span class="result-bit">{{ item.digestSize }} bit</span>
                    <span class="result-dot">·</span>
                    <span class="result-description">{{ item.description }}</span>
                  </div>
                  <el-button class="result-copy-button" link
                             type="primary"
                             @click="copyText(item.digest, { successMessage: `${item.label} 已复制` })">
                    复制
                  </el-button>
                </div>
                <div class="digest-box">{{ item.digest }}</div>
              </article>
            </el-col>
          </el-row>
        </el-scrollbar>
      </div>

      <el-empty
          v-else
          class="result-empty"
          description="输入文本并点击“计算摘要”后，在这里查看结果"
      />
    </el-card>
  </div>
</template>

<style scoped>
.hash-page {
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: hidden;
}

.top-row {
  flex: 0 0 auto;
}

.result-card {
  flex: 1;
  min-height: 0;
}

.notice-banner {
  border-radius: 12px;
}

.notice-banner :deep(.el-alert) {
  padding: 6px 10px;
}

.notice-banner :deep(.el-alert__content) {
  padding-right: 4px;
}

:deep(.notice-banner .el-alert__title) {
  font-size: 12px;
  line-height: 1.45;
}

:is(.editor-card, .config-card, .result-card) {
  border-radius: 16px;
}

:is(.editor-card, .config-card, .result-card) {
  height: 100%;
}

:deep(.editor-card .el-card__body),
:deep(.config-card .el-card__body) {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}

:deep(.result-card .el-card__body) {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

:deep(.editor-card .el-card__header),
:deep(.config-card .el-card__header),
:deep(.result-card .el-card__header) {
  padding-top: 10px;
  padding-bottom: 8px;
}

:deep(.editor-card .el-card__body),
:deep(.config-card .el-card__body),
:deep(.result-card .el-card__body) {
  padding-top: 10px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.section-title {
  margin: 0;
  font-weight: 700;
  font-size: 15px;
  color: var(--el-text-color-primary);
}

.section-subtitle,
.result-description {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.section-subtitle {
  margin: 2px 0 0;
}

.hash-input :deep(.el-textarea__inner) {
  min-height: 188px;
  border-radius: 14px;
  padding: 9px 11px;
  font-family: 'Consolas', 'Monaco', monospace;
  line-height: 1.45;
}

.stats-row,
.selected-algorithms-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.stats-row {
  margin-top: 8px;
  align-items: center;
}

.stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  padding: 5px 9px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-fill-color-light) 76%, white);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.stat-chip-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.stat-chip-value {
  display: inline-flex;
  align-items: center;
  padding-left: 6px;
  border-left: 1px solid var(--el-border-color-light);
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1;
}

.algorithm-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
}

.algorithm-grid :deep(.el-checkbox-button__inner) {
  width: 100%;
  border-radius: 10px;
  padding: 7px 10px;
}

.algorithm-option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
}

.algorithm-option-text {
  line-height: 1;
}

.algorithm-option-tip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: color-mix(in srgb, currentColor 12%, transparent);
  font-size: 12px;
  line-height: 1;
}

.selected-algorithms {
  margin-top: 0;
  padding: 7px 9px;
  border-radius: 12px;
  background: var(--el-fill-color-extra-light);
  border: 1px solid var(--el-border-color-lighter);
}

.selected-algorithms-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.selected-algorithms :deep(.el-tag) {
  height: 22px;
  padding: 0 8px;
}

.config-card :deep(.el-form-item) {
  margin-bottom: 8px;
}

.action-panel {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 8px;
}

.action-button {
  flex: 1;
}

.result-list {
  width: 100%;
  margin: 0;
  row-gap: 14px;
}

.result-panel {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.result-scrollbar {
  height: 100%;
}

.result-scrollbar :deep(.el-scrollbar__view) {
  box-sizing: border-box;
  width: 100%;
  padding: 0 6px 14px 0;
}

.result-scrollbar :deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
}

.result-empty {
  min-height: 164px;
  padding: 2px 0 0;
}

.result-empty :deep(.el-empty__image) {
  width: 76px;
}

.result-empty :deep(.el-empty__description) {
  margin-top: 8px;
}

.result-empty :deep(.el-empty__description p) {
  font-size: 12px;
  line-height: 1.5;
}

.result-item {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color-page);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.result-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.result-item-summary {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  flex: 1;
}

.result-algorithm {
  font-weight: 700;
  font-size: 14px;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}

.result-bit {
  font-size: 11px;
  line-height: 1;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  flex: 0 0 auto;
}

.result-dot {
  font-size: 12px;
  line-height: 1;
  color: var(--el-text-color-placeholder);
  flex: 0 0 auto;
}

.result-description {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0;
  min-width: 0;
  flex: 1;
}

.result-copy-button {
  padding: 0;
  min-height: auto;
  font-size: 13px;
  line-height: 1;
}

.digest-box {
  padding: 9px 11px;
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.45;
  color: var(--el-text-color-primary);
  word-break: break-all;
}
</style>
