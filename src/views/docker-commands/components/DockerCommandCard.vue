<script setup>
import {useCopyText} from '@/composables/useCopyText'

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

const {copyText} = useCopyText({
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
                <IconEpDocumentCopy/>
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
          <el-empty v-else :image-size="72" description="暂无参数说明"/>
        </el-collapse-item>
      </el-collapse>
    </div>
  </el-card>
</template>

<style scoped>
.command-card {
  height: 100%;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}

.command-card:hover {
  transform: translateY(-2px);
  border-color: var(--el-color-primary-light-5);
}

.command-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.command-card__heading {
  min-width: 0;
}

.command-card__title {
  margin: 0 0 2px;
  color: var(--el-text-color-primary);
  font-size: 15px;
  line-height: 1.25;
}

.command-card__desc {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.command-card__actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
}

.command-card__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}

.command-snippet {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
  background: color-mix(in srgb, var(--el-color-primary) 4%, var(--el-bg-color));
}

.command-snippet__label {
  padding: 6px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-regular);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  background: var(--el-fill-color-light);
}

.command-snippet__code {
  margin: 0;
  padding: 8px 10px;
  color: var(--el-text-color-primary);
  font: 500 12px/1.45 'Consolas', 'Monaco', monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.command-scene {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.command-scene__label {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  min-height: 18px;
}

.command-scene__text {
  margin: 0;
  padding-top: 1px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.55;
}

.command-collapse {
  border-top: 1px solid var(--el-border-color-lighter);
  border-bottom: 0;
}

.command-collapse__title {
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

:deep(.docker-highlight) {
  padding: 0 2px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--el-color-warning) 24%, transparent);
  color: inherit;
}

html.dark .command-card {
  background-color: var(--el-bg-color-overlay);
  border-color: var(--el-border-color-darker);
}

html.dark .command-card:hover {
  border-color: var(--el-color-primary-light-3);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.3);
}

html.dark .command-snippet {
  background: color-mix(in srgb, var(--el-color-primary) 8%, var(--el-bg-color-overlay));
}
</style>
