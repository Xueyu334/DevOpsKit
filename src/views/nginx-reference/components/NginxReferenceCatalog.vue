<script setup>
import NginxReferenceCard from './NginxReferenceCard.vue'
import {useNginxReferenceSearch} from '../composables/useNginxReferenceSearch'

const props = defineProps({
  sections: {
    type: Array,
    required: true
  }
})

const {
  keyword,
  hasKeyword,
  hasResults,
  filteredSections,
  totalItemCount,
  filteredItemCount,
  clearKeyword,
  highlightText
} = useNginxReferenceSearch(toRef(props, 'sections'))

const activeCategoryKey = shallowRef('')
const scrollbarRef = useTemplateRef('scrollbar')
const contentRootRef = useTemplateRef('contentRoot')

watch(
    filteredSections,
    (sections) => {
      if (!sections.length) {
        activeCategoryKey.value = ''
        return
      }

      const hasActiveCategory = sections.some((section) => section.key === activeCategoryKey.value)
      if (!hasActiveCategory) {
        activeCategoryKey.value = sections[0].key
      }
    },
    {immediate: true}
)

const scrollToCategory = async (categoryKey) => {
  activeCategoryKey.value = categoryKey
  await nextTick()

  const target = contentRootRef.value?.querySelector(`[data-category="${categoryKey}"]`)
  if (!target) {
    return
  }

  const nextTop = Math.max(target.offsetTop - 4, 0)
  const wrapEl = scrollbarRef.value?.wrapRef

  if (wrapEl?.scrollTo) {
    wrapEl.scrollTo({
      top: nextTop,
      behavior: 'smooth'
    })
    return
  }

  scrollbarRef.value?.setScrollTop(nextTop)
}

const handleSelectCategory = (categoryKey) => {
  scrollToCategory(categoryKey)
}

const handleClearSearch = () => {
  clearKeyword()
  if (filteredSections.value.length > 0) {
    scrollToCategory(filteredSections.value[0].key)
  }
}
</script>

<template>
  <div class="nginx-catalog-layout">
    <el-row :gutter="16" class="catalog-grid">
      <el-col v-bind="{ xs: 24, sm: 24, md: 7, lg: 6, xl: 5 }">
        <el-card class="catalog-nav" shadow="never">
          <template #header>
            <div class="catalog-nav__header">
              <div>
                <h2 class="catalog-nav__title">分类导航</h2>
                <p class="catalog-nav__subtitle">按命令与 conf 场景拆分，点击可快速定位。</p>
              </div>
              <el-tag effect="light" round>{{ filteredSections.length }}</el-tag>
            </div>
          </template>
          <el-menu
              v-if="filteredSections.length"
              :default-active="activeCategoryKey"
              class="catalog-nav__menu"
              @select="handleSelectCategory"
          >
            <el-menu-item v-for="section in filteredSections" :key="section.key" :index="section.key">
              <span class="catalog-nav__label">{{ section.label }}</span>
              <el-tag effect="plain" round size="small">{{ section.items.length }}</el-tag>
            </el-menu-item>
          </el-menu>
          <div v-else class="catalog-nav__empty">
            <el-text type="info">暂无匹配分类</el-text>
          </div>
        </el-card>
      </el-col>
      <el-col v-bind="{ xs: 24, sm: 24, md: 17, lg: 18, xl: 19 }">
        <el-card class="catalog-content" shadow="never">
          <template #header>
            <div class="catalog-toolbar">
              <div class="catalog-toolbar__copy">
                <h2 class="catalog-toolbar__title">命令与配置列表</h2>
                <p class="catalog-toolbar__subtitle">
                  支持按命令名、配置项、示例、参数说明和使用场景进行模糊搜索。
                </p>
              </div>
              <div class="catalog-toolbar__actions">
                <el-input
                    v-model="keyword"
                    class="catalog-search"
                    clearable
                    placeholder="搜索：reload / proxy_pass / gzip / server_name"
                    size="large"
                    @clear="handleClearSearch"
                >
                  <template #prefix>
                    <el-icon>
                      <IconEpSearch/>
                    </el-icon>
                  </template>
                </el-input>
              </div>
            </div>
          </template>

          <div class="catalog-summary">
            <el-tag effect="light" round type="primary">条目 {{ filteredItemCount }} / {{ totalItemCount }}</el-tag>
            <el-tag effect="light" round type="info">分类 {{ filteredSections.length }}</el-tag>
            <el-tag v-if="hasKeyword" effect="light" round type="success">
              关键词：{{ keyword.trim() }}
            </el-tag>
          </div>

          <div class="catalog-sections">
            <template v-if="hasResults">
              <el-scrollbar ref="scrollbar" class="catalog-sections__scrollbar">
                <div ref="contentRoot" class="catalog-sections__viewport">
                  <section
                      v-for="section in filteredSections"
                      :key="section.key"
                      :data-category="section.key"
                      class="reference-section"
                  >
                    <div class="reference-section__header">
                      <div class="reference-section__heading">
                        <h3 class="reference-section__title">{{ section.title }}</h3>
                        <p class="reference-section__desc">{{ section.description }}</p>
                      </div>
                      <el-tag effect="light" round>{{ section.items.length }} 项</el-tag>
                    </div>

                    <el-row :gutter="16">
                      <el-col
                          v-for="item in section.items"
                          :key="item.id"
                          class="reference-section__col"
                          v-bind="{ xs: 24, sm: 24, md: 24, lg: 12, xl: 12 }"
                      >
                        <NginxReferenceCard :item="item" :highlight-text="highlightText"/>
                      </el-col>
                    </el-row>
                  </section>
                </div>
              </el-scrollbar>
            </template>
            <el-empty v-else class="catalog-empty" description="未找到匹配的 Nginx 条目">
              <template #image>
                <el-icon class="catalog-empty__icon">
                  <IconEpSearch/>
                </el-icon>
              </template>
            </el-empty>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.nginx-catalog-layout {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.catalog-grid {
  height: 100%;
  min-height: 0;
}

.catalog-grid > :deep(.el-col) {
  display: flex;
  min-height: 0;
}

.catalog-nav {
  position: sticky;
  top: 12px;
  width: 100%;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: color-mix(in srgb, var(--el-bg-color) 96%, var(--el-color-primary) 4%);
}

.catalog-content {
  display: flex;
  flex: 1;
  width: 100%;
  min-height: 0;
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-bg-color);
}

.catalog-nav__header,
.catalog-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.catalog-nav__title,
.catalog-toolbar__title {
  margin: 0 0 6px;
  color: var(--el-text-color-primary);
  font-size: 20px;
  line-height: 1.2;
}

.catalog-nav__subtitle,
.catalog-toolbar__subtitle {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.catalog-nav__menu {
  border-right: 0;
  background: transparent;
}

.catalog-nav__menu :deep(.el-menu-item) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
  border-radius: 10px;
}

.catalog-nav__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.catalog-nav__empty {
  display: flex;
  min-height: 120px;
  align-items: center;
  justify-content: center;
}

.catalog-toolbar__copy {
  min-width: 0;
}

.catalog-toolbar__actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
}

.catalog-search {
  width: min(460px, 48vw);
}

.catalog-summary {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
  margin-bottom: 14px;
}

.catalog-sections {
  margin-top: 8px;
}

.catalog-sections__scrollbar {
  min-height: 0;
  height: calc(100vh - 450px);
}

.catalog-sections__viewport {
  padding-right: 8px;
}

.reference-section {
  scroll-margin-top: 12px;
  margin-bottom: 18px;
}

.reference-section__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.reference-section__heading {
  min-width: 0;
}

.reference-section__title {
  margin: 0 0 4px;
  color: var(--el-text-color-primary);
  font-size: 20px;
  line-height: 1.25;
}

.reference-section__desc {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.55;
}

.reference-section__col {
  margin-bottom: 12px;
}

.catalog-empty {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
}

.catalog-empty__icon {
  font-size: 92px;
  color: var(--el-text-color-placeholder);
}

:deep(.catalog-nav .el-card__header),
:deep(.catalog-content .el-card__header) {
  padding: 14px 16px 12px;
}

:deep(.catalog-nav .el-card__body) {
  padding: 0 14px 14px;
}

:deep(.catalog-content .el-card__body) {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  padding: 0 16px 14px;
}

:deep(.catalog-sections__scrollbar .el-scrollbar__wrap) {
  overflow-x: hidden;
}

:deep(.catalog-sections__scrollbar .el-scrollbar__bar.is-horizontal) {
  display: none;
}

html.dark .catalog-nav,
html.dark .catalog-content {
  border-color: var(--el-border-color-darker);
}

html.dark .catalog-nav {
  background: color-mix(in srgb, var(--el-bg-color-overlay) 94%, var(--el-color-primary) 6%);
}

html.dark .catalog-content {
  background: var(--el-bg-color-overlay);
}
</style>
