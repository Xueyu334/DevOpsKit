<template>
  <div ref="pageRef" class="app-container text-diff-page">
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
              <el-option
                  v-for="option in languageOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-row :gutter="12">
            <el-col :md="12" :xs="24">
              <el-form-item label="左侧内容" prop="prevText">
                <el-input v-model="data.prevText" :autosize="{ minRows: 4, maxRows: 10 }"
                          :maxlength="MAX_TEXT_LENGTH" class="text-input" show-word-limit type="textarea"/>
              </el-form-item>
            </el-col>
            <el-col :md="12" :xs="24">
              <el-form-item label="右侧内容" prop="currText">
                <el-input v-model="data.currText" :autosize="{ minRows: 4, maxRows: 10 }"
                          :maxlength="MAX_TEXT_LENGTH" class="text-input" show-word-limit type="textarea"/>
              </el-form-item>
            </el-col>
          </el-row>
        </el-col>
      </el-row>
    </el-form>
    <div class="diff-toolbar">
      <div class="diff-toolbar__title">
        <h2 class="diff-title">内容对比</h2>
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
    <el-row ref="viewerRowRef" class="diff-viewer-row" style=" margin-bottom: 20px;">
      <el-col :span="24">
        <VueDiff :current="data.currText" :folding="data.folding" :input-delay="data.inputDelay"
                 :language="data.language" :mode="data.diffMode" :prev="data.prevText" :theme="data.theme"
                 :virtual-scroll="resolvedVirtualScrollOptions"/>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
// 定义全局文本最大长度限制常量
import {text1, text2} from "@/views/text-diff/ext.js";

const MAX_TEXT_LENGTH = 1000000;
const pageRef = useTemplateRef('pageRef')
const viewerRowRef = useTemplateRef('viewerRowRef')
const languageOptions = [
  {label: '纯文本', value: 'plaintext'},
  {label: 'JSON', value: 'json'},
  {label: 'JavaScript', value: 'javascript'},
  {label: 'TypeScript', value: 'typescript'},
  {label: 'XML / HTML', value: 'xml'},
  {label: 'CSS', value: 'css'},
  {label: 'Markdown', value: 'markdown'}
]

const data = reactive({
  // 差异比对模式：'split'（并排）或 'unified'（统一）
  diffMode: 'split',
  // 是否折叠未变更段
  folding: false,
  // 主题：'light'、'dark' 或自定义
  theme: 'dark',
  // 语言类型（高亮用）
  language: 'plaintext',
  // 输入延迟时间（毫秒），用于降低大文本输入时的频繁重算
  inputDelay: 500,
  //历史版本文本 左侧
  prevText: '',
  // 当前版本文本 右侧
  currText: ''
})
// 虚拟滚动配置，用于大文本场景提升性能
const virtualScrollOptions = ref({
  height: 420,         // 滚动区域高度
  lineMinHeight: 24,   // 每行最小高度（影响行数渲染）
  delay: 100           // 滚动延迟时间，避免频繁计算
});

const resolvedVirtualScrollOptions = computed(() => ({
  height: virtualScrollOptions.value.height,
  lineMinHeight: virtualScrollOptions.value.lineMinHeight,
  delay: virtualScrollOptions.value.delay
}))

onMounted(() => {
  if (!data.prevText.trim() && !data.currText.trim()) {
    data.prevText = text1
    data.currText = text2
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

const updateDiffHeight = () => {
  const pageRect = pageRef.value?.getBoundingClientRect()
  const viewerRect = viewerRowRef.value?.getBoundingClientRect()
  const pageStyle = pageRef.value ? window.getComputedStyle(pageRef.value) : null
  const paddingBottom = Number.parseFloat(pageStyle?.paddingBottom ?? '0')
  const footerGap = 8

  if (!pageRect || !viewerRect) {
    return
  }

  const availableHeight = pageRect.bottom - viewerRect.top - paddingBottom - footerGap
  virtualScrollOptions.value.height = Math.max(280, Math.floor(availableHeight))
}

onMounted(() => {
  nextTick(updateDiffHeight)
  window.addEventListener('resize', updateDiffHeight)
})

watch(
    () => [data.prevText, data.currText, data.diffMode, data.folding],
    () => nextTick(updateDiffHeight),
    {flush: 'post'}
)

onUnmounted(() => {
  window.removeEventListener('resize', updateDiffHeight)
})
</script>

<style scoped>
.text-diff-page {
  min-height: 100%;
  height: 100%;
  padding: 12px 16px 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
}

.diff-form {
  flex-shrink: 0;
}

.diff-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  flex-shrink: 0;
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
  font-size: 28px;
  line-height: 1.1;
}

.diff-viewer-row {
  flex: 1;
  min-height: 0;
  margin-top: 12px;
}

.language-select {
  width: 100%;
  max-width: 240px;
}

.text-input {
  width: 100%;
  max-width: 600px;
}

:deep(.diff-form .el-form-item) {
  margin-bottom: 10px;
}

:deep(.text-input .el-textarea__inner) {
  line-height: 1.45;
}

:deep(.vue-diff-wrapper) {
  height: 100%;
}

:deep(.vue-diff-viewer) {
  box-sizing: border-box;
  height: 100% !important;
  padding: 0 !important;
}

:deep(.vue-diff-viewer-inner) {
  min-height: 100% !important;
}

@media (max-width: 767px) {
  .text-diff-page {
    padding: 10px 12px 8px;
  }

  .diff-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .diff-toolbar__title,
  .diff-toolbar__actions {
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .diff-title {
    font-size: 24px;
  }
}
</style>
