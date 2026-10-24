<script setup>
import PatternControls from './components/PatternControls.vue'
import PatternPreview from './components/PatternPreview.vue'
import PatternMaterials from './components/PatternMaterials.vue'
import {useBeadPattern} from './composables/useBeadPattern.js'

const {
  source,
  pattern,
  options,
  loading,
  generating,
  exporting,
  error,
  stale,
  clear,
  loadFile,
  exportPng,
  exportCsv
} = useBeadPattern()

const materialsVisible = ref(false)

watch(pattern, value => {
  if (!value) materialsVisible.value = false
})

function updateOptions(value) {
  Object.assign(options, value)
}
</script>

<template>
  <div class="bead-pattern-page">
    <el-alert v-if="error" class="error-note" :title="error" type="error" show-icon :closable="false"/>
    <el-row :gutter="20">
      <el-col :xs="24" :lg="8" class="controls-column">
        <PatternControls
            :source="source"
            :options="options"
            :loading="loading"
            :generating="generating"
            @update:options="updateOptions"
            @upload="loadFile"
            @clear="clear"
        />
      </el-col>
      <el-col :xs="24" :lg="16">
        <PatternPreview
            :pattern="pattern"
            :stale="stale"
            :busy="generating || loading"
            :exporting="exporting"
            @export-png="exportPng"
            @show-materials="materialsVisible = true"
        />
      </el-col>
    </el-row>
    <PatternMaterials
        v-model="materialsVisible"
        :pattern="pattern"
        :busy="generating || loading"
        :stale="stale"
        @export-csv="exportCsv"
    />
    <p class="source-note">
      参考
      <el-link href="https://github.com/AsZer0s/PinDouStudio" target="_blank" rel="noopener noreferrer" type="primary"
      >PinDouStudio
      </el-link
      >
      的色卡与配色思路，依照 MIT 许可改编。照片可先降低网格尺寸检查构图，再提高精度。
    </p>
  </div>
</template>

<style scoped>
.bead-pattern-page {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 12px;
}

.bead-pattern-page :deep(.el-empty) {
  padding: 16px 0;
}

.bead-pattern-page :deep(.el-empty__image) {
  max-width: 100px;
}

.error-note {
  margin-bottom: 16px;
}

.source-note {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.8;
  margin: 12px 0 0;
}

.source-note .el-link {
  font-size: inherit;
  vertical-align: baseline;
}

@media (max-width: 1199px) {
  .controls-column {
    margin-bottom: 16px;
  }
}
</style>
