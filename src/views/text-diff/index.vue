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
                <el-input v-model="data.prevText" :autosize="{ minRows: 10, maxRows: 10 }"
                          :maxlength="MAX_TEXT_LENGTH" class="text-input" show-word-limit type="textarea"/>
              </el-form-item>
            </el-col>
            <el-col :md="12" :xs="24">
              <el-form-item label="右侧内容" prop="currText">
                <el-input v-model="data.currText" :autosize="{ minRows: 10, maxRows: 10 }"
                          :maxlength="MAX_TEXT_LENGTH" class="text-input" show-word-limit type="textarea"/>
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
    <div>
      <VueDiff :current="data.currText" :folding="data.folding"
               :input-delay="data.inputDelay" :language="data.language"
               :mode="data.diffMode" :prev="data.prevText"
               :theme="data.theme" :virtual-scroll="virtualScroll"/>
    </div>
  </div>
</template>

<script setup>
// 定义全局文本最大长度限制常量
import {text1, text2} from "@/views/text-diff/ext.js";

const MAX_TEXT_LENGTH = 1000000;
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

onMounted(() => {
  if (!data.prevText.trim() && !data.currText.trim()) {
    data.prevText = text1
    data.currText = text2
  }
})

const virtualScroll = computed(() => {
  return {
    // 差异视图的可视区域高度，单位为 px
    // 这里比 .diff-viewer 的 max-height 略小，给组件边框和内部结构预留空间，避免底部显示不全
    height: 460,
    // 每一行的最小高度，影响行间距和虚拟滚动的计算精度
    // 适当降低一点，兼顾可读性和同屏显示的行数
    lineMinHeight: 28,
    // 滚动或容器尺寸变化后的重新渲染延迟，单位为毫秒
    // 略微缩短延迟，让滚动反馈更顺滑
    delay: 80
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

.language-select,
.text-input {
  width: 100%;
}

.language-select {
  max-width: 240px;
}

.text-input {
  max-width: 600px;
}

:deep(.diff-form .el-form-item) {
  margin-bottom: 10px;
}

:deep(.text-input .el-textarea__inner) {
  line-height: 1.45;
}
</style>
