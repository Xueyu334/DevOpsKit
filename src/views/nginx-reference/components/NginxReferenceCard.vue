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
  }
})

const { copyText } = useCopyText({
  successMessage: '示例已复制',
  errorMessage: '复制失败，请手动复制内容'
})

const activePanels = ref([])
const detailPanelName = 'details'

const isConfigItem = computed(() => props.item.type === 'config')
const isExpanded = computed(() => activePanels.value.includes(detailPanelName))
const snippetLabel = computed(() => (isConfigItem.value ? '配置示例' : '命令示例'))
const copyLabel = computed(() => (isConfigItem.value ? '复制配置' : '复制命令'))
const detailLabel = computed(() => (isConfigItem.value ? '关键项说明' : '参数说明'))
const detailTitle = computed(() => `${detailLabel.value}（点击${isExpanded.value ? '收起' : '展开'}）`)

const handleToggleDetails = () => {
  activePanels.value = isExpanded.value ? [] : [detailPanelName]
}

const handleCopySnippet = () => {
  copyText(props.item.example)
}
</script>

<template>
  <el-card class="reference-card" shadow="hover">
    <template #header>
      <div class="reference-card__header">
        <div class="reference-card__heading">
          <div class="reference-card__title-row">
            <h3 class="reference-card__title" v-html="highlightText(item.name)"></h3>
            <el-tag effect="plain" round size="small" :type="isConfigItem ? 'success' : 'primary'">
              {{ isConfigItem ? 'Conf' : 'CLI' }}
            </el-tag>
          </div>
          <p class="reference-card__desc" v-html="highlightText(item.desc)"></p>
        </div>
        <div class="reference-card__actions">
          <el-button plain size="small" type="primary" @click="handleCopySnippet">
            <template #icon>
              <el-icon>
                <IconEpDocumentCopy />
              </el-icon>
            </template>
            {{ copyLabel }}
          </el-button>
          <el-button size="small" text @click="handleToggleDetails">
            {{ isExpanded ? '收起详情' : '展开详情' }}
          </el-button>
        </div>
      </div>
    </template>

    <div class="reference-card__body">
      <div class="reference-snippet">
        <div class="reference-snippet__label">{{ snippetLabel }}</div>
        <pre class="reference-snippet__code"><code v-html="highlightText(item.example)"></code></pre>
      </div>

      <div class="reference-scene">
        <div class="reference-scene__label">
          <el-tag effect="light" round size="small" type="info">使用场景</el-tag>
        </div>
        <p class="reference-scene__text" v-html="highlightText(item.scene)"></p>
      </div>

      <el-collapse v-model="activePanels" class="reference-collapse">
        <el-collapse-item :name="detailPanelName">
          <template #title>
            <span class="reference-collapse__title">{{ detailTitle }}</span>
          </template>

          <div v-if="item.options?.length" class="option-list">
            <div v-for="option in item.options" :key="option.key" class="option-item">
              <el-tag class="option-item__key" effect="plain" size="small">
                <span v-html="highlightText(option.key)"></span>
              </el-tag>
              <span class="option-item__desc" v-html="highlightText(option.desc)"></span>
            </div>
          </div>
          <el-empty v-else :image-size="72" description="暂无补充说明" />
        </el-collapse-item>
      </el-collapse>
    </div>
  </el-card>
</template>

<style scoped>
.reference-card {
  height: 100%;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  background: var(--el-bg-color);
}

.reference-card:hover {
  transform: translateY(-4px);
  border-color: var(--el-color-primary);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
}

.reference-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.reference-card__heading {
  min-width: 0;
}

.reference-card__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.reference-card__title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.25;
}

.reference-card__desc {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.55;
}

.reference-card__actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
}

.reference-card__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 6px;
}

.reference-snippet {
  position: relative;
  background: #1e1e1e;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.reference-snippet__label {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: #888888;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  gap: 6px;
}

.reference-snippet__label::before {
  content: '';
  width: 8px;
  height: 8px;
  background: #ff5f56;
  border-radius: 50%;
  box-shadow:
    12px 0 0 #ffbd2e,
    24px 0 0 #27c93f;
  margin-right: 28px;
  flex-shrink: 0;
}

.reference-snippet__code {
  margin: 0;
  padding: 14px 16px;
  color: #dcdcdc;
  font:
    500 13px/1.6 'Fira Code',
    'Consolas',
    'Monaco',
    monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.reference-snippet__code :deep(.nginx-highlight) {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  padding: 0 4px;
  border-radius: 3px;
}

.reference-scene {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 12px;
  background: var(--el-fill-color-extra-light);
  border-radius: 8px;
  border-left: 3px solid var(--el-color-info-light-5);
}

.reference-scene__text {
  margin: 0;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.6;
}

.reference-collapse {
  border-top: 1px solid var(--el-border-color-lighter);
  border-bottom: 0;
}

.reference-collapse__title {
  color: var(--el-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.option-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  transition: background 0.2s ease;
}

.option-item:hover {
  background: var(--el-fill-color-light);
}

.option-item__key {
  flex-shrink: 0;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-weight: 600;
}

.option-item__desc {
  color: var(--el-text-color-regular);
  font-size: 12.5px;
  line-height: 1.5;
}

:deep(.el-card__header) {
  padding: 16px 20px 12px;
}

:deep(.el-card__body) {
  padding: 0 20px 16px;
}

:deep(.el-collapse-item__header) {
  height: 40px;
  padding: 0;
  border-bottom: 0;
  background-color: transparent;
}

:deep(.el-collapse-item__wrap) {
  border-bottom: 0;
  background-color: transparent;
}

:deep(.el-collapse-item__content) {
  padding-bottom: 8px;
}

:deep(.nginx-highlight) {
  padding: 0 2px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--el-color-warning) 30%, transparent);
  color: var(--el-text-color-primary);
  font-weight: 600;
}

html.dark .reference-card {
  background-color: var(--el-bg-color-overlay);
  border-color: var(--el-border-color-darker);
}

html.dark .reference-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
}

html.dark .reference-scene {
  background: rgba(255, 255, 255, 0.03);
}

html.dark .option-item {
  background: rgba(255, 255, 255, 0.05);
}

html.dark .option-item:hover {
  background: rgba(255, 255, 255, 0.08);
}
</style>
