<script setup>
import { useCopyText } from '@/composables/useCopyText'

const props = defineProps({
  command: {
    type: Object,
    required: true
  },
  highlightText: {
    type: Function,
    required: true
  }
})

const { copyText } = useCopyText({
  successMessage: '命令已复制',
  errorMessage: '复制失败，请手动复制命令'
})

const activePanels = ref([])
const detailPanelName = 'details'

const isExpanded = computed(() => activePanels.value.includes(detailPanelName))

const handleToggleDetails = () => {
  activePanels.value = isExpanded.value ? [] : [detailPanelName]
}

const handleCopyCommand = () => {
  copyText(props.command.command)
}
</script>

<template>
  <el-card class="command-card" shadow="hover">
    <template #header>
      <div class="command-card__header">
        <div class="command-card__heading">
          <h3 class="command-card__title" v-html="highlightText(command.name)"></h3>
          <p class="command-card__desc" v-html="highlightText(command.desc)"></p>
        </div>
        <div class="command-card__actions">
          <el-button plain size="small" type="primary" @click="handleCopyCommand">
            <template #icon>
              <el-icon>
                <IconEpDocumentCopy />
              </el-icon>
            </template>
            复制命令
          </el-button>
          <el-button size="small" text @click="handleToggleDetails">
            {{ isExpanded ? '收起详情' : '展开详情' }}
          </el-button>
        </div>
      </div>
    </template>
    <div class="command-card__body">
      <div class="command-snippet">
        <div class="command-snippet__label">命令示例</div>
        <pre class="command-snippet__code"><code v-html="highlightText(command.command)"></code></pre>
      </div>

      <div class="command-scene">
        <div class="command-scene__label">
          <el-tag effect="light" round size="small" type="info">使用场景</el-tag>
        </div>
        <p class="command-scene__text" v-html="highlightText(command.scene)"></p>
      </div>

      <el-collapse v-model="activePanels" class="command-collapse">
        <el-collapse-item :name="detailPanelName">
          <template #title>
            <span class="command-collapse__title">
              {{ isExpanded ? '参数说明（点击收起）' : '参数说明（点击展开）' }}
            </span>
          </template>

          <div v-if="command.options?.length" class="option-list">
            <div v-for="option in command.options" :key="option.key" class="option-item">
              <el-tag class="option-item__key" effect="plain" size="small">
                <span v-html="highlightText(option.key)"></span>
              </el-tag>
              <span class="option-item__desc" v-html="highlightText(option.desc)"></span>
            </div>
          </div>
          <el-empty v-else :image-size="72" description="暂无参数说明" />
        </el-collapse-item>
      </el-collapse>
    </div>
  </el-card>
</template>

<style scoped>
.command-card {
  height: 100%;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  background: var(--el-bg-color);
}

.command-card:hover {
  transform: translateY(-4px);
  border-color: var(--el-color-primary);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
}

.command-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.command-card__heading {
  min-width: 0;
}

.command-card__title {
  margin: 0 0 6px;
  color: var(--el-text-color-primary);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.25;
}

.command-card__desc {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.55;
}

.command-card__actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
}

.command-card__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 6px;
}

.command-snippet {
  position: relative;
  background: #1e1e1e;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.command-snippet__label {
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

.command-snippet__label::before {
  content: "";
  width: 8px;
  height: 8px;
  background: #ff5f56;
  border-radius: 50%;
  box-shadow: 12px 0 0 #ffbd2e, 24px 0 0 #27c93f;
  margin-right: 28px;
  /* 为影阴保留空间 */
  flex-shrink: 0;
}

.command-snippet__code {
  margin: 0;
  padding: 14px 16px;
  color: #dcdcdc;
  font: 500 13px/1.6 'Fira Code', 'Consolas', 'Monaco', monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.command-snippet__code :deep(.docker-highlight) {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  padding: 0 4px;
  border-radius: 3px;
}

.command-scene {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 12px;
  background: var(--el-fill-color-extra-light);
  border-radius: 8px;
  border-left: 3px solid var(--el-color-info-light-5);
}

.command-scene__text {
  margin: 0;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.6;
}

.command-collapse {
  border-top: 1px solid var(--el-border-color-lighter);
  border-bottom: 0;
}

.command-collapse__title {
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

:deep(.docker-highlight) {
  padding: 0 2px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--el-color-warning) 30%, transparent);
  color: var(--el-text-color-primary);
  font-weight: 600;
}

html.dark .command-card {
  background-color: var(--el-bg-color-overlay);
  border-color: var(--el-border-color-darker);
}

html.dark .command-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
}

html.dark .command-scene {
  background: rgba(255, 255, 255, 0.03);
}

html.dark .option-item {
  background: rgba(255, 255, 255, 0.05);
}

html.dark .option-item:hover {
  background: rgba(255, 255, 255, 0.08);
}
</style>
