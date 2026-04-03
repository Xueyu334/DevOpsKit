<script setup>
const query = defineModel({
  type: String,
  default: ''
})

defineProps({
  featuredItem: {
    type: Object,
    required: true
  },
  hasQuery: {
    type: Boolean,
    default: false
  },
  matches: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['select'])

const handleSelect = code => {
  emit('select', code)
}
</script>

<template>
  <div class="lookup-shell">
    <div class="lookup-intro">
      <h2 class="lookup-title">可输入十进制、十六进制、二进制、字符或控制符缩写</h2>
      <p class="lookup-tip">例如 `65`、`0x41`、`0b1000001`、`A`、`LF`、`space`</p>
    </div>
    <el-row>
      <el-col :span="24">
        <el-input v-model="query" class="lookup-input" clearable placeholder="搜索 ASCII 值或字符" size="large">
          <template #prefix>
            <el-icon class="lookup-input-icon">
              <IconEpSearch />
            </el-icon>
          </template>
        </el-input>
      </el-col>
    </el-row>
    <el-row :gutter="16">
      <el-col class="lookup-col" v-bind="{ xs: 24, sm: 24, md: 24, lg: 12, xl: 12 }">
        <div class="panel-card focus-card">
          <div class="focus-head">
            <div>
              <p class="focus-label">当前焦点</p>
              <h3 class="focus-symbol">{{ featuredItem.previewLabel }}</h3>
            </div>
            <el-tag :type="featuredItem.tagType" effect="light" round>
              {{ featuredItem.categoryLabel }}
            </el-tag>
          </div>

          <p class="focus-description">{{ featuredItem.description }}</p>

          <div class="focus-metrics">
            <div class="metric-chip">
              <span class="metric-chip-label">Dec</span>
              <strong>{{ featuredItem.dec }}</strong>
            </div>
            <div class="metric-chip">
              <span class="metric-chip-label">Hex</span>
              <strong>{{ featuredItem.hex }}</strong>
            </div>
            <div class="metric-chip">
              <span class="metric-chip-label">Bin</span>
              <strong>{{ featuredItem.binary }}</strong>
            </div>
            <div class="metric-chip">
              <span class="metric-chip-label">Unicode</span>
              <strong>{{ featuredItem.unicode }}</strong>
            </div>
          </div>

          <div class="focus-actions">
            <el-button plain @click="handleSelect(featuredItem.dec)"> 在总表中高亮 </el-button>
            <span v-if="featuredItem.escape" class="focus-escape">{{ featuredItem.escape }}</span>
          </div>
        </div>
      </el-col>

      <el-col class="lookup-col" v-bind="{ xs: 24, sm: 24, md: 24, lg: 12, xl: 12 }">
        <div class="panel-card result-panel">
          <div class="result-panel-header">
            <h3 class="result-title">{{ hasQuery ? `共找到 ${matches.length} 个结果` : '输入关键词后即时筛选' }}</h3>
            <span class="result-caption">点击任意结果可同步定位到总表</span>
          </div>

          <div class="result-panel-body">
            <div v-if="matches.length" class="result-grid">
              <button
                v-for="item in matches"
                :key="item.dec"
                class="result-chip"
                type="button"
                @click="handleSelect(item.dec)"
              >
                <span class="result-chip-code">{{ item.dec }}</span>
                <span class="result-chip-body">
                  <strong class="result-chip-symbol">{{ item.displayLabel }}</strong>
                  <span class="result-chip-meta">{{ item.hex }} · {{ item.description }}</span>
                </span>
              </button>
            </div>

            <el-empty
              v-else
              :description="hasQuery ? '未匹配到对应 ASCII 项' : '输入后将在这里展示匹配结果'"
              class="result-empty"
            >
              <template #image>
                <el-icon class="result-empty-icon">
                  <IconEpSearch />
                </el-icon>
              </template>
            </el-empty>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.lookup-shell {
  --lookup-card-height: min(320px, calc(100vh - 320px));
  margin-bottom: 10px;
  padding: 20px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 12%, var(--el-border-color-light));
  border-radius: 26px;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--el-color-primary) 8%, white) 0%, transparent 42%),
    var(--el-bg-color);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
}

.lookup-intro,
.focus-head,
.focus-actions,
.result-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.lookup-intro {
  margin-bottom: 18px;
}

.lookup-col {
  display: flex;
}

.lookup-title,
.result-title {
  margin: 0;
  color: var(--el-text-color-primary);
}

.lookup-title {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.lookup-tip,
.result-caption {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.panel-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: var(--lookup-card-height);
  border: 1px solid var(--el-border-color-light);
  border-radius: 20px;
  background: color-mix(in srgb, var(--el-fill-color-blank) 86%, white);
}

.lookup-input {
  margin-bottom: 16px;
}

:deep(.lookup-input .el-input__wrapper) {
  min-height: 48px;
  border-radius: 16px;
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 10%, transparent) inset;
}

:deep(.lookup-input .el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px var(--el-color-primary) inset,
    0 10px 24px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}

.lookup-input-icon {
  color: var(--el-text-color-secondary);
  font-size: 18px;
}

.focus-card {
  padding: 18px;
}

.focus-label {
  margin: 0 0 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.focus-symbol {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: clamp(32px, 5vw, 54px);
  font-weight: 800;
  line-height: 1;
}

.focus-description {
  margin: 16px 0 18px;
  color: var(--el-text-color-regular);
  font-size: 14px;
  line-height: 1.6;
}

.focus-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.metric-chip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--el-fill-color-light);
}

.metric-chip strong {
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 700;
}

.metric-chip-label {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.focus-actions {
  margin-top: 16px;
}

.focus-escape {
  padding: 6px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  color: var(--el-color-primary-dark-2);
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  font-weight: 600;
}

.result-panel {
  padding: 18px;
}

.result-panel-header {
  flex: none;
  margin-bottom: 14px;
}

.result-panel-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.result-panel-body::-webkit-scrollbar {
  width: 8px;
}

.result-panel-body::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-text-color-placeholder) 55%, transparent);
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.result-chip {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 16px;
  background: var(--el-bg-color);
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.result-chip:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--el-color-primary) 44%, var(--el-border-color));
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
}

.result-chip-code {
  flex: none;
  min-width: 46px;
  padding: 7px 10px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--el-color-primary) 12%, white);
  color: var(--el-color-primary-dark-2);
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
}

.result-chip-body {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.result-chip-symbol {
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 700;
}

.result-chip-meta {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.result-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-block: 8px 0;
}

.result-empty-icon {
  color: var(--el-text-color-placeholder);
  font-size: 88px;
}

html.dark .lookup-shell {
  border-color: color-mix(in srgb, var(--el-color-primary) 18%, var(--el-border-color));
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--el-color-primary) 16%, transparent) 0%, transparent 40%),
    var(--el-bg-color-overlay);
  box-shadow: 0 24px 70px rgba(2, 6, 23, 0.34);
}

html.dark .panel-card {
  background: color-mix(in srgb, var(--el-fill-color) 90%, #0f172a);
  border-color: var(--el-border-color);
}

html.dark .result-chip {
  background: color-mix(in srgb, var(--el-fill-color-blank) 86%, #0f172a);
}
</style>
