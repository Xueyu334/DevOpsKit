<script setup>
import { useCopyText } from '@/composables/useCopyText'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  highlightText: {
    type: Function,
    required: true
  },
  forceExpand: {
    type: Boolean,
    default: null
  }
})

const { copyText } = useCopyText({
  successMessage: '示例已复制',
  errorMessage: '复制失败，请手动复制内容'
})

const isCopied = ref(false)
const isExpanded = ref(false)

watch(
  () => props.forceExpand,
  val => {
    if (val !== null) {
      isExpanded.value = val
    }
  }
)

const isConfigItem = computed(() => props.item.type === 'config')
const snippetLanguage = computed(() => (isConfigItem.value ? 'nginx.conf' : 'bash'))
const copyLabel = computed(() => (isConfigItem.value ? '复制配置' : '复制命令'))
const detailLabel = computed(() => (isConfigItem.value ? '关键项说明' : '参数说明'))

const handleToggleDetails = () => {
  isExpanded.value = !isExpanded.value
}

const handleCopySnippet = () => {
  copyText(props.item.example)
  isCopied.value = true
  setTimeout(() => {
    isCopied.value = false
  }, 1800)
}
</script>

<template>
  <el-card class="reference-card" :class="isConfigItem ? 'is-config' : 'is-command'" shadow="hover">
    <template #header>
      <div class="reference-card__header">
        <div class="reference-card__heading">
          <div class="reference-card__title-row">
            <h3 class="reference-card__title" v-html="highlightText(item.name)"></h3>
            <span class="type-badge" :class="isConfigItem ? 'type-badge--conf' : 'type-badge--cli'">
              <span class="type-dot"></span>
              {{ isConfigItem ? 'Conf 指令' : 'CLI 命令' }}
            </span>
          </div>
          <p class="reference-card__desc" v-html="highlightText(item.desc)"></p>
        </div>
        <div class="reference-card__actions">
          <el-button
            :type="isConfigItem ? 'success' : 'primary'"
            plain
            round
            size="small"
            class="header-copy-btn"
            @click="handleCopySnippet"
          >
            <template #icon>
              <el-icon v-if="isCopied" class="copy-success-icon"><IconEpCheck /></el-icon>
              <el-icon v-else><IconEpDocumentCopy /></el-icon>
            </template>
            {{ isCopied ? '已复制' : copyLabel }}
          </el-button>
        </div>
      </div>
    </template>

    <div class="reference-card__body">
      <!-- 代码示例窗口 -->
      <div class="reference-snippet">
        <div class="reference-snippet__header">
          <div class="terminal-dots">
            <span class="dot dot-close"></span>
            <span class="dot dot-minimize"></span>
            <span class="dot dot-zoom"></span>
          </div>
          <span class="reference-snippet__lang">{{ snippetLanguage }}</span>
          <button class="snippet-copy-btn" type="button" :title="copyLabel" @click="handleCopySnippet">
            <el-icon v-if="isCopied" class="copy-success-icon"><IconEpCheck /></el-icon>
            <el-icon v-else><IconEpDocumentCopy /></el-icon>
            <span>{{ isCopied ? '已复制' : '复制' }}</span>
          </button>
        </div>
        <pre class="reference-snippet__code"><code v-html="highlightText(item.example)"></code></pre>
      </div>

      <!-- 应用场景说明 -->
      <div class="reference-scene">
        <div class="reference-scene__badge">
          <el-icon class="scene-icon"><IconEpPosition /></el-icon>
          <span>使用场景</span>
        </div>
        <p class="reference-scene__text" v-html="highlightText(item.scene)"></p>
      </div>

      <!-- 参数 / 关键项详情折叠区 -->
      <div class="reference-options">
        <button
          type="button"
          class="options-toggle-btn"
          :class="{ 'is-open': isExpanded }"
          @click="handleToggleDetails"
        >
          <span class="options-toggle-label">
            <el-icon class="options-icon"><IconEpOperation /></el-icon>
            <span>{{ detailLabel }}</span>
            <span v-if="item.options?.length" class="options-count-badge">
              {{ item.options.length }}
            </span>
          </span>
          <span class="options-toggle-action">
            <span>{{ isExpanded ? '收起详情' : '展开说明' }}</span>
            <el-icon class="options-arrow" :class="{ 'is-rotated': isExpanded }">
              <IconEpArrowDown />
            </el-icon>
          </span>
        </button>

        <el-collapse-transition>
          <div v-show="isExpanded" class="options-body">
            <div v-if="item.options?.length" class="option-list">
              <div v-for="option in item.options" :key="option.key" class="option-item">
                <div class="option-item__key">
                  <code><span v-html="highlightText(option.key)"></span></code>
                </div>
                <div class="option-item__desc" v-html="highlightText(option.desc)"></div>
              </div>
            </div>
            <div v-else class="option-empty">暂无补充参数说明</div>
          </div>
        </el-collapse-transition>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.reference-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: var(--el-bg-color);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
}

.reference-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.08);
}

.reference-card.is-config:hover {
  border-color: rgba(5, 150, 105, 0.45);
}

.reference-card.is-command:hover {
  border-color: rgba(37, 99, 235, 0.45);
}

.reference-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.reference-card__heading {
  min-width: 0;
  flex: 1;
}

.reference-card__title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}

.reference-card__title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 16.5px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.type-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.type-badge--conf {
  background: rgba(5, 150, 105, 0.1);
  color: #059669;
  border: 1px solid rgba(5, 150, 105, 0.22);
}

.type-badge--conf .type-dot {
  background: #059669;
}

.type-badge--cli {
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
  border: 1px solid rgba(37, 99, 235, 0.22);
}

.type-badge--cli .type-dot {
  background: #2563eb;
}

.reference-card__desc {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.55;
}

.reference-card__actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.header-copy-btn {
  font-weight: 500;
}

.copy-success-icon {
  color: #10b981;
}

.reference-card__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

/* 终端样式代码块 */
.reference-snippet {
  position: relative;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
}

.reference-snippet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.terminal-dots {
  display: flex;
  align-items: center;
  gap: 6px;
}

.terminal-dots .dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.dot-close {
  background: #ff5f56;
}

.dot-minimize {
  background: #ffbd2e;
}

.dot-zoom {
  background: #27c93f;
}

.reference-snippet__lang {
  color: #94a3b8;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.snippet-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  color: #cbd5e1;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.snippet-copy-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.25);
}

.reference-snippet__code {
  margin: 0;
  padding: 12px 14px;
  color: #e2e8f0;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 12.5px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-x: auto;
}

/* 使用场景模块 */
.reference-scene {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 9px 12px;
  background: var(--el-fill-color-light);
  border-radius: 10px;
  border: 1px solid var(--el-border-color-extra-light);
}

.reference-scene__badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 6px;
  background: var(--el-fill-color-darker);
  color: var(--el-text-color-regular);
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.scene-icon {
  font-size: 12px;
  color: #059669;
}

.reference-scene__text {
  margin: 0;
  color: var(--el-text-color-regular);
  font-size: 12.5px;
  line-height: 1.55;
}

/* 详情折叠区 */
.reference-options {
  border-top: 1px dashed var(--el-border-color-lighter);
  padding-top: 8px;
}

.options-toggle-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.options-toggle-btn:hover {
  background: var(--el-fill-color-light);
}

.options-toggle-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-primary);
  font-size: 12.5px;
  font-weight: 600;
}

.options-icon {
  font-size: 13px;
  color: var(--el-color-primary);
}

.options-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9999px;
  background: var(--el-fill-color-dark);
  color: var(--el-text-color-secondary);
  font-size: 10.5px;
  font-weight: 700;
}

.options-toggle-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 500;
}

.options-arrow {
  font-size: 12px;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.options-arrow.is-rotated {
  transform: rotate(180deg);
}

.options-body {
  margin-top: 8px;
}

.option-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.option-item {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-extra-light);
  transition: background 0.2s ease;
}

.option-item:hover {
  background: var(--el-fill-color);
}

.option-item__key {
  flex-shrink: 0;
}

.option-item__key code {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 6px;
  background: var(--el-fill-color-dark);
  color: var(--el-color-primary);
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 11.5px;
  font-weight: 600;
  border: 1px solid var(--el-border-color-lighter);
}

.option-item__desc {
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.5;
}

.option-empty {
  padding: 10px;
  text-align: center;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

:deep(.el-card__header) {
  padding: 14px 18px 10px;
}

:deep(.el-card__body) {
  padding: 0 18px 14px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* 搜索高亮 */
:deep(.nginx-highlight) {
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(245, 158, 11, 0.24);
  color: #b45309;
  font-weight: 700;
}

/* 深色模式精修 */
html.dark .reference-card {
  background: var(--el-bg-color-overlay);
  border-color: var(--el-border-color-darker);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

html.dark .reference-card:hover {
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.4);
}

html.dark .type-badge--conf {
  background: rgba(5, 150, 105, 0.18);
  color: #34d399;
  border-color: rgba(5, 150, 105, 0.35);
}

html.dark .type-badge--conf .type-dot {
  background: #34d399;
}

html.dark .type-badge--cli {
  background: rgba(59, 130, 246, 0.18);
  color: #60a5fa;
  border-color: rgba(59, 130, 246, 0.35);
}

html.dark .type-badge--cli .type-dot {
  background: #60a5fa;
}

html.dark .reference-scene {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.06);
}

html.dark .option-item {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.06);
}

html.dark .option-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

html.dark .option-item__key code {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
  color: #60a5fa;
}

html.dark :deep(.nginx-highlight) {
  background: rgba(245, 158, 11, 0.32);
  color: #fde047;
}
</style>
