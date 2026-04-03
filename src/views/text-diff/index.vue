<template>
  <div class="app-container text-diff-page">
    <el-form :model="data" class="diff-form" label-position="right" label-suffix=":" label-width="auto" size="default">
      <el-row :gutter="12" justify="start">
        <el-col v-bind="{ xs: 24, sm: 24, md: 8, lg: 6, xl: 4 }">
          <el-form-item label="差异比对模式" prop="diffMode">
            <el-radio-group v-model="data.diffMode">
              <el-radio size="default" value="split">并排</el-radio>
              <el-radio size="default" value="unified">统一</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col v-bind="{ xs: 24, sm: 24, md: 8, lg: 6, xl: 6 }">
          <el-form-item label="是否折叠未变更段" prop="folding">
            <el-radio-group v-model="data.folding">
              <el-radio :value="true" size="default">是</el-radio>
              <el-radio :value="false" size="default">否</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col v-bind="{ xs: 24, sm: 24, md: 8, lg: 6, xl: 6 }">
          <el-form-item label="主题" prop="theme">
            <el-radio-group v-model="data.theme">
              <el-radio size="default" value="light">纯白</el-radio>
              <el-radio size="default" value="dark">暗黑</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col v-bind="{ xs: 24, sm: 24, md: 8, lg: 6, xl: 6 }">
          <el-form-item label="语言" prop="language">
            <el-select v-model="data.language" class="language-select" placeholder="请选择语言">
              <el-option v-for="option in languageOptions" :key="option.value" :label="option.label"
                :value="option.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-row :gutter="12">
            <el-col :md="12" :xs="24">
              <el-form-item label="左侧内容" prop="prevText">
                <el-input v-model="data.prevText" :autosize="{ minRows: 10, maxRows: 10 }" :maxlength="MAX_TEXT_LENGTH"
                  class="text-input" show-word-limit type="textarea" />
              </el-form-item>
            </el-col>
            <el-col :md="12" :xs="24">
              <el-form-item label="右侧内容" prop="currText">
                <el-input v-model="data.currText" :autosize="{ minRows: 10, maxRows: 10 }" :maxlength="MAX_TEXT_LENGTH"
                  class="text-input" show-word-limit type="textarea" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-col>
      </el-row>
    </el-form>
    <div class="diff-toolbar">
      <div class="diff-toolbar__title">
        <h3 class="diff-title">内容对比</h3>
        <!-- 使用 element-plus 自带的 fade-in 加上简单转场动画 -->
        <transition name="el-fade-in">
          <el-tag v-if="isIdentical" effect="light" round size="large" type="success">✨ 内容完全一致</el-tag>
        </transition>
      </div>
      <div class="diff-toolbar__actions">
        <el-button plain type="primary" @click="handleSwapText">左右对调</el-button>
        <el-button plain type="danger" @click="handleClearText">一键清空</el-button>
      </div>
    </div>
    <div class="diff-viewer-wrapper">
      <VueDiff :current="data.currText" :folding="data.folding" :input-delay="data.inputDelay" :language="data.language"
        :mode="data.diffMode" :prev="data.prevText" :theme="data.theme" :virtual-scroll="virtualScroll" />
    </div>
  </div>
</template>

<script setup>
import { text1, text2 } from "@/views/text-diff/ext.js"

// 定义全局文本最大长度限制常量
const MAX_TEXT_LENGTH = 1000000;
const languageOptions = [
  { label: '纯文本', value: 'plaintext' },
  { label: 'JSON', value: 'json' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'XML / HTML', value: 'xml' },
  { label: 'CSS', value: 'css' },
  { label: 'Markdown', value: 'markdown' }
]

const data = reactive({
  diffMode: 'split',
  folding: false,
  theme: 'dark',
  language: 'plaintext',
  inputDelay: 500,
  prevText: '',
  currText: ''
})

onMounted(() => {
  if (!data.prevText.trim() && !data.currText.trim()) {
    data.prevText = text1
    data.currText = text2
  }
})

const virtualScroll = computed(() => {
  // 核心修复：使用固定高度，彻底避免高度计算死循环导致的页面崩溃
  return {
    height: 580,
    lineMinHeight: 30,
    delay: 60
  }
})

// 计算两个框内的文本是否输入了对应内容且完全一致
const isIdentical = computed(() => {
  return data.prevText === data.currText && data.prevText.trim() !== ''
})

// 左右文本对调
const handleSwapText = () => {
  const temp = data.prevText
  data.prevText = data.currText
  data.currText = temp
}

// 一键清空左右对别文本
const handleClearText = () => {
  data.prevText = ''
  data.currText = ''
}

</script>

<style scoped>
.text-diff-page {
  /* 恢复为稳定的流式布局 */
  min-height: 100%;
  padding: 16px 20px 40px;
  box-sizing: border-box;
  background-color: var(--el-bg-color);
  overflow-y: auto;
}

.diff-form {
  flex-shrink: 0;
  background: var(--el-bg-color-overlay);
  padding: 12px 16px;
  /* 压缩内边距 */
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  margin-bottom: 12px;
  /* 压缩外边距 */
}

.diff-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  /* 增加分割线 */
  padding-bottom: 8px;
}

.diff-toolbar__title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.diff-toolbar__actions {
  display: flex;
  gap: 12px;
}

.diff-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.language-select,
.text-input {
  width: 100%;
}

.language-select {
  max-width: 240px;
}

:deep(.diff-form .el-form-item) {
  margin-bottom: 8px;
  /* 压缩项间距 */
}

:deep(.diff-form .el-form-item__label) {
  font-size: 13px;
  font-weight: 600;
}

:deep(.text-input .el-textarea__inner) {
  line-height: 1.6;
  font-family: 'Fira Code', 'Roboto Mono', monospace;
  font-size: 13px;
  background: var(--el-bg-color);
  border-radius: 8px;
  transition: all 0.2s ease;
  border: 1px solid var(--el-border-color-light);
}

:deep(.text-input .el-textarea__inner:focus) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

/* VueDiff 包装容器 */
.diff-viewer-wrapper {
  margin-top: 20px;
  min-height: 580px;
  /* 与 JS 中的虚拟高度一致，确保容器稳固 */
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-overlay);
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
  transition: box-shadow 0.3s ease;
}

.diff-viewer-wrapper:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* 深度定制 VueDiff 内部样式 */
:deep(.vue-diff-container) {
  border: none !important;
  font-family: 'Fira Code', 'Roboto Mono', monospace !important;
}

:deep(.d-code-line-number) {
  width: 54px !important;
  text-align: center !important;
  color: var(--el-text-color-placeholder) !important;
  background: var(--el-fill-color-light) !important;
  border-right: 1px solid var(--el-border-color-lighter) !important;
  font-size: 12px !important;
  user-select: none;
}

/* 差异高亮色：使用现代、柔和的语义化配色 */
:deep(.d-diff-row-add) {
  background-color: rgba(103, 194, 58, 0.12) !important;
}

:deep(.d-diff-row-add .d-code-line) {
  background-color: transparent !important;
}

:deep(.d-diff-row-add .d-code-inside) {
  background-color: rgba(103, 194, 58, 0.28) !important;
  border-radius: 3px;
}

:deep(.d-diff-row-del) {
  background-color: rgba(245, 108, 108, 0.1) !important;
}

:deep(.d-diff-row-del .d-code-line) {
  background-color: transparent !important;
}

:deep(.d-diff-row-del .d-code-inside) {
  background-color: rgba(245, 108, 108, 0.22) !important;
  border-radius: 3px;
}

/* 虚线分隔符美化 */
:deep(.d-code-placeholder) {
  background: var(--el-fill-color-lighter) !important;
}

/* 针对分栏模式的中间分隔线微调 */
:deep(.vue-diff-split .d-diff-row-add .d-code-line-number),
:deep(.vue-diff-split .d-diff-row-del .d-code-line-number) {
  border-right-color: var(--el-border-color-light) !important;
}

/* 滚动条美化 */
:deep(.vue-diff-row::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:deep(.vue-diff-row::-webkit-scrollbar-thumb) {
  background: var(--el-border-color);
  border-radius: 10px;
}

:deep(.vue-diff-row::-webkit-scrollbar-track) {
  background: transparent;
}

/* Dark 模式深度适配 */
:deep(html.dark .d-code-line-number) {
  background: #0f172a !important;
  border-color: #1e293b !important;
  color: #64748b !important;
}

:deep(html.dark .d-diff-row-add) {
  background-color: rgba(103, 194, 58, 0.08) !important;
}

:deep(html.dark .d-diff-row-add .d-code-inside) {
  background-color: rgba(103, 194, 58, 0.2) !important;
}

:deep(html.dark .d-diff-row-del) {
  background-color: rgba(245, 108, 108, 0.08) !important;
}

:deep(html.dark .d-diff-row-del .d-code-inside) {
  background-color: rgba(245, 108, 108, 0.18) !important;
}

:deep(html.dark .vue-diff-row::-webkit-scrollbar-thumb) {
  background: #334155;
}
</style>
