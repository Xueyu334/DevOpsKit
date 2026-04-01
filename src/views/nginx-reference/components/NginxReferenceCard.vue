<script setup>
import {useCopyText} from '@/composables/useCopyText'

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

const {copyText} = useCopyText({
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
const detailTitle = computed(() =>
    `${detailLabel.value}（点击${isExpanded.value ? '收起' : '展开'}）`
)

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
                <IconEpDocumentCopy/>
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
          <el-empty v-else :image-size="72" description="暂无补充说明"/>
        </el-collapse-item>
      </el-collapse>
    </div>
  </el-card>
</template>

<style scoped>
.reference-card {
  height: 100%;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}

.reference-card:hover {
  transform: translateY(-2px);
  border-color: var(--el-color-primary-light-5);
}

.reference-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.reference-card__heading {
  min-width: 0;
}

.reference-card__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.reference-card__title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 15px;
  line-height: 1.25;
}

.reference-card__desc {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.reference-card__actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
}

.reference-card__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}

.reference-snippet {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
  background: color-mix(in srgb, var(--el-color-primary) 4%, var(--el-bg-color));
}

.reference-snippet__label {
  padding: 6px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-regular);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  background: var(--el-fill-color-light);
}

.reference-snippet__code {
  margin: 0;
  padding: 8px 10px;
  color: var(--el-text-color-primary);
  font: 500 12px/1.45 'Consolas', 'Monaco', monospace;
  white-space: pre-wrap;
  word-break: break-word;
}

.reference-scene {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.reference-scene__label {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  min-height: 18px;
}

.reference-scene__text {
  margin: 0;
  padding-top: 1px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.55;
}

.reference-collapse {
  border-top: 1px solid var(--el-border-color-lighter);
  border-bottom: 0;
}

.reference-collapse__title {
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 600;
}

.option-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.option-item__key {
  flex-shrink: 0;
}

.option-item__desc {
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.5;
}

:deep(.el-card__header) {
  padding: 12px 14px 10px;
}

:deep(.el-card__body) {
  padding: 0 14px 12px;
}

:deep(.el-collapse-item__header) {
  height: auto;
  min-height: 30px;
  padding: 0;
  border-bottom: 0;
  background-color: transparent;
}

:deep(.el-collapse-item__wrap) {
  border-bottom: 0;
}

:deep(.el-collapse-item__content) {
  padding-bottom: 0;
}

:deep(.nginx-highlight) {
  padding: 0 2px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--el-color-warning) 24%, transparent);
  color: inherit;
}

html.dark .reference-card {
  background-color: var(--el-bg-color-overlay);
  border-color: var(--el-border-color-darker);
}

html.dark .reference-card:hover {
  border-color: var(--el-color-primary-light-3);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.3);
}

html.dark .reference-snippet {
  background: color-mix(in srgb, var(--el-color-primary) 8%, var(--el-bg-color-overlay));
}


</style>
