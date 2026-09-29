<script setup>
import NginxReferenceCard from './NginxReferenceCard.vue'
import { useNginxReferenceSearch } from '../composables/useNginxReferenceSearch'

const props = defineProps({
  sections: {
    type: Array,
    required: true
  }
})

const {
  keyword,
  hasKeyword,
  typeFilter,
  hasActiveFilters,
  hasResults,
  filteredSections,
  totalItemCount,
  totalCommandCount,
  totalConfigCount,
  filteredItemCount,
  clearKeyword,
  resetFilters,
  highlightText
} = useNginxReferenceSearch(toRef(props, 'sections'))

const activeCategoryKey = shallowRef('')
const scrollbarRef = ref(null)
const contentRootRef = ref(null)

const forceExpand = ref(null)
const isAllExpanded = ref(false)

const toggleExpandAll = () => {
  isAllExpanded.value = !isAllExpanded.value
  forceExpand.value = isAllExpanded.value
}

watch(
  filteredSections,
  sections => {
    if (!sections.length) {
      activeCategoryKey.value = ''
      return
    }

    const hasActiveCategory = sections.some(section => section.key === activeCategoryKey.value)
    if (!hasActiveCategory) {
      activeCategoryKey.value = sections[0].key
    }
  },
  { immediate: true }
)

let isManualScrolling = false
let manualScrollTimer = null

const scrollToCategory = async categoryKey => {
  activeCategoryKey.value = categoryKey
  isManualScrolling = true
  if (manualScrollTimer) clearTimeout(manualScrollTimer)
  manualScrollTimer = setTimeout(() => {
    isManualScrolling = false
  }, 800)

  await nextTick()

  const target =
    contentRootRef.value?.querySelector(`[data-category="${categoryKey}"]`) ||
    document.querySelector(`[data-category="${categoryKey}"]`)
  if (!target) {
    return
  }

  const wrapEl =
    scrollbarRef.value?.wrapRef?.value ||
    scrollbarRef.value?.wrapRef ||
    scrollbarRef.value?.$el?.querySelector('.el-scrollbar__wrap') ||
    document.querySelector('.catalog-sections__scrollbar .el-scrollbar__wrap')

  if (wrapEl && wrapEl.scrollHeight > wrapEl.clientHeight) {
    const targetTop = target.getBoundingClientRect().top - wrapEl.getBoundingClientRect().top + wrapEl.scrollTop - 8

    const nextTop = Math.max(0, targetTop)

    if (scrollbarRef.value && typeof scrollbarRef.value.scrollTo === 'function') {
      scrollbarRef.value.scrollTo({
        top: nextTop,
        behavior: 'smooth'
      })
    } else if (wrapEl && typeof wrapEl.scrollTo === 'function') {
      wrapEl.scrollTo({
        top: nextTop,
        behavior: 'smooth'
      })
    } else if (scrollbarRef.value && typeof scrollbarRef.value.setScrollTop === 'function') {
      scrollbarRef.value.setScrollTop(nextTop)
    } else if (wrapEl) {
      wrapEl.scrollTop = nextTop
    }
  } else {
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }
}

const handleContentScroll = () => {
  if (isManualScrolling) return

  const wrapEl =
    scrollbarRef.value?.wrapRef?.value ||
    scrollbarRef.value?.wrapRef ||
    scrollbarRef.value?.$el?.querySelector('.el-scrollbar__wrap') ||
    document.querySelector('.catalog-sections__scrollbar .el-scrollbar__wrap')

  const container = contentRootRef.value || document.querySelector('.catalog-sections__viewport')
  if (!container || !wrapEl) return

  const categoryElements = container.querySelectorAll('[data-category]')
  if (!categoryElements.length) return

  const wrapTop = wrapEl.getBoundingClientRect().top

  let currentKey = ''
  for (let i = 0; i < categoryElements.length; i++) {
    const el = categoryElements[i]
    const relativeTop = el.getBoundingClientRect().top - wrapTop
    if (relativeTop <= 60) {
      currentKey = el.getAttribute('data-category')
    } else {
      break
    }
  }

  if (currentKey && currentKey !== activeCategoryKey.value) {
    activeCategoryKey.value = currentKey
  }
}

const handleSelectCategory = categoryKey => {
  scrollToCategory(categoryKey)
}

const handleClearSearch = () => {
  clearKeyword()
  if (filteredSections.value.length > 0) {
    scrollToCategory(filteredSections.value[0].key)
  }
}

const scrollToTop = () => {
  isManualScrolling = true
  if (manualScrollTimer) clearTimeout(manualScrollTimer)
  manualScrollTimer = setTimeout(() => {
    isManualScrolling = false
  }, 800)

  if (scrollbarRef.value && typeof scrollbarRef.value.scrollTo === 'function') {
    scrollbarRef.value.scrollTo({ top: 0, behavior: 'smooth' })
  } else {
    const wrapEl =
      scrollbarRef.value?.wrapRef?.value ||
      scrollbarRef.value?.wrapRef ||
      document.querySelector('.catalog-sections__scrollbar .el-scrollbar__wrap')
    if (wrapEl) {
      wrapEl.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (filteredSections.value.length > 0) {
    activeCategoryKey.value = filteredSections.value[0].key
  }
}
</script>

<template>
  <div class="nginx-catalog-layout">
    <el-row :gutter="14" class="catalog-row">
      <!-- 左侧分类导航 -->
      <el-col v-bind="{ xs: 24, sm: 24, md: 7, lg: 6, xl: 5 }" class="catalog-col-nav">
        <el-card class="catalog-nav" shadow="never">
          <template #header>
            <div class="catalog-nav__header">
              <div class="catalog-nav__title-wrap">
                <el-icon class="catalog-nav__main-icon"><IconEpGuide /></el-icon>
                <div>
                  <h2 class="catalog-nav__title">分类导航</h2>
                  <p class="catalog-nav__subtitle">点击平滑定位至对应分类</p>
                </div>
              </div>
              <span class="catalog-nav__badge">{{ filteredSections.length }} 组</span>
            </div>
          </template>

          <div class="catalog-nav__body">
            <el-scrollbar class="catalog-nav__scrollbar">
              <ul v-if="filteredSections.length" class="category-menu">
                <li
                  v-for="section in filteredSections"
                  :key="section.key"
                  class="category-menu__item"
                  :class="{ 'is-active': activeCategoryKey === section.key }"
                  @click="handleSelectCategory(section.key)"
                >
                  <div class="category-menu__label-box">
                    <el-icon class="category-menu__icon">
                      <IconEpMonitor v-if="section.key === 'command-basic'" />
                      <IconEpCpu v-else-if="section.key === 'command-control'" />
                      <IconEpDocument v-else-if="section.key === 'command-diagnose'" />
                      <IconEpSetting v-else-if="section.key === 'conf-main'" />
                      <IconEpConnection v-else-if="section.key === 'conf-server'" />
                      <IconEpSwitch v-else-if="section.key === 'conf-proxy'" />
                      <IconEpLock v-else-if="section.key === 'conf-https-security'" />
                      <IconEpTimer v-else-if="section.key === 'conf-performance'" />
                      <IconEpCollectionTag v-else />
                    </el-icon>
                    <span class="category-menu__label">{{ section.label }}</span>
                  </div>
                  <span class="category-menu__count">{{ section.items.length }}</span>
                </li>
              </ul>
              <div v-else class="catalog-nav__empty">
                <el-text type="info">暂无匹配分类</el-text>
              </div>
            </el-scrollbar>

            <!-- 底部快速置顶 -->
            <div class="catalog-nav__footer">
              <button type="button" class="back-top-btn" @click="scrollToTop">
                <el-icon><IconEpTop /></el-icon>
                <span>回到顶部</span>
              </button>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧主内容与卡片列表 -->
      <el-col v-bind="{ xs: 24, sm: 24, md: 17, lg: 18, xl: 19 }" class="catalog-col-content">
        <el-card class="catalog-content" shadow="never">
          <template #header>
            <div class="catalog-toolbar">
              <div class="catalog-toolbar__top">
                <div class="catalog-toolbar__copy">
                  <h2 class="catalog-toolbar__title">命令与配置列表</h2>
                  <p class="catalog-toolbar__subtitle">
                    支持按命令名、配置项、语法示例、参数说明及应用场景进行快速模糊搜索。
                  </p>
                </div>
                <div class="catalog-toolbar__search-box">
                  <el-input
                    v-model="keyword"
                    class="catalog-search"
                    clearable
                    placeholder="搜索：reload / proxy_pass / gzip / server_name"
                    size="large"
                    @clear="handleClearSearch"
                  >
                    <template #prefix>
                      <el-icon class="search-icon"><IconEpSearch /></el-icon>
                    </template>
                  </el-input>
                </div>
              </div>

              <!-- 筛选器与操作栏 -->
              <div class="catalog-toolbar__controls">
                <div class="type-segmented">
                  <button
                    type="button"
                    class="type-tab-btn"
                    :class="{ 'is-active': typeFilter === 'all' }"
                    @click="typeFilter = 'all'"
                  >
                    全部 ({{ totalItemCount }})
                  </button>
                  <button
                    type="button"
                    class="type-tab-btn"
                    :class="{ 'is-active': typeFilter === 'command' }"
                    @click="typeFilter = 'command'"
                  >
                    命令 CLI ({{ totalCommandCount }})
                  </button>
                  <button
                    type="button"
                    class="type-tab-btn"
                    :class="{ 'is-active': typeFilter === 'config' }"
                    @click="typeFilter = 'config'"
                  >
                    配置 Conf ({{ totalConfigCount }})
                  </button>
                </div>

                <div class="toolbar-actions">
                  <el-button size="default" plain round class="expand-toggle-btn" @click="toggleExpandAll">
                    <template #icon>
                      <el-icon>
                        <IconEpArrowUp v-if="isAllExpanded" />
                        <IconEpArrowDown v-else />
                      </el-icon>
                    </template>
                    {{ isAllExpanded ? '收起所有参数' : '展开所有参数' }}
                  </el-button>
                </div>
              </div>

              <!-- 筛选状态汇总 -->
              <div v-if="hasActiveFilters" class="catalog-summary">
                <div class="summary-tags">
                  <span class="summary-label">已生效筛选:</span>
                  <el-tag
                    v-if="hasKeyword"
                    closable
                    effect="light"
                    round
                    type="success"
                    size="small"
                    @close="clearKeyword"
                  >
                    关键词: {{ keyword.trim() }}
                  </el-tag>
                  <el-tag
                    v-if="typeFilter !== 'all'"
                    closable
                    effect="light"
                    round
                    type="primary"
                    size="small"
                    @close="typeFilter = 'all'"
                  >
                    类型: {{ typeFilter === 'command' ? 'CLI 命令' : 'Conf 配置' }}
                  </el-tag>
                  <span class="summary-count">
                    共找到 <strong>{{ filteredItemCount }}</strong> 条结果
                  </span>
                </div>
                <button type="button" class="reset-filter-btn" @click="resetFilters">
                  <el-icon><IconEpRefreshRight /></el-icon>
                  <span>重置全部条件</span>
                </button>
              </div>
            </div>
          </template>

          <!-- 分组卡片列表 -->
          <div class="catalog-sections">
            <template v-if="hasResults">
              <el-scrollbar ref="scrollbarRef" class="catalog-sections__scrollbar" @scroll="handleContentScroll">
                <div ref="contentRootRef" class="catalog-sections__viewport">
                  <section
                    v-for="section in filteredSections"
                    :key="section.key"
                    :data-category="section.key"
                    class="reference-section"
                  >
                    <div class="reference-section__header">
                      <div class="reference-section__heading">
                        <div class="reference-section__title-row">
                          <span class="reference-section__icon-box">
                            <el-icon>
                              <IconEpMonitor v-if="section.key === 'command-basic'" />
                              <IconEpCpu v-else-if="section.key === 'command-control'" />
                              <IconEpDocument v-else-if="section.key === 'command-diagnose'" />
                              <IconEpSetting v-else-if="section.key === 'conf-main'" />
                              <IconEpConnection v-else-if="section.key === 'conf-server'" />
                              <IconEpSwitch v-else-if="section.key === 'conf-proxy'" />
                              <IconEpLock v-else-if="section.key === 'conf-https-security'" />
                              <IconEpTimer v-else-if="section.key === 'conf-performance'" />
                              <IconEpCollectionTag v-else />
                            </el-icon>
                          </span>
                          <h3 class="reference-section__title">{{ section.title }}</h3>
                        </div>
                        <p class="reference-section__desc">{{ section.description }}</p>
                      </div>
                      <span class="reference-section__count-tag">{{ section.items.length }} 项</span>
                    </div>

                    <el-row :gutter="14" class="reference-section__grid">
                      <el-col
                        v-for="item in section.items"
                        :key="item.id"
                        class="reference-section__col"
                        v-bind="{ xs: 24, sm: 24, md: 24, lg: 12, xl: 12 }"
                      >
                        <NginxReferenceCard :item="item" :force-expand="forceExpand" :highlight-text="highlightText" />
                      </el-col>
                    </el-row>
                  </section>
                </div>
              </el-scrollbar>
            </template>

            <!-- 空状态 -->
            <div v-else class="catalog-empty">
              <div class="catalog-empty__icon-wrap">
                <el-icon class="catalog-empty__icon"><IconEpSearch /></el-icon>
              </div>
              <h4 class="catalog-empty__title">未找到匹配的 Nginx 条目</h4>
              <p class="catalog-empty__desc">未检索到与当前关键词或类型相符的内容，请尝试重置筛选。</p>
              <el-button type="primary" round plain class="catalog-empty__btn" @click="resetFilters">
                <template #icon
                  ><el-icon><IconEpRefreshRight /></el-icon
                ></template>
                清空筛选条件
              </el-button>
            </div>
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
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.catalog-row {
  height: 100%;
  flex: 1;
  min-height: 0;
}

.catalog-col-nav,
.catalog-col-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.catalog-nav,
.catalog-content {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 18px;
  background: var(--el-bg-color);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.catalog-nav:hover,
.catalog-content:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

/* 左侧导航样式 */
.catalog-nav__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.catalog-nav__title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.catalog-nav__main-icon {
  font-size: 20px;
  color: #059669;
}

.catalog-nav__title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.2;
}

.catalog-nav__subtitle {
  margin: 2px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 11.5px;
  line-height: 1.4;
}

.catalog-nav__badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 9999px;
  background: rgba(5, 150, 105, 0.1);
  color: #059669;
  font-size: 11.5px;
  font-weight: 700;
}

.catalog-nav__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.catalog-nav__scrollbar {
  flex: 1;
  min-height: 0;
}

.category-menu {
  list-style: none;
  margin: 0;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-menu__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 3px solid transparent;
  user-select: none;
}

.category-menu__label-box {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.category-menu__icon {
  font-size: 15px;
  color: var(--el-text-color-secondary);
  transition: color 0.2s ease;
  flex-shrink: 0;
}

.category-menu__label {
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-menu__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 9999px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.category-menu__item:hover {
  background: var(--el-fill-color-light);
}

.category-menu__item:hover .category-menu__label {
  color: var(--el-text-color-primary);
}

.category-menu__item:hover .category-menu__icon {
  color: #059669;
}

.category-menu__item.is-active {
  background: rgba(5, 150, 105, 0.08);
  border-left-color: #059669;
}

.category-menu__item.is-active .category-menu__label {
  color: #059669;
  font-weight: 700;
}

.category-menu__item.is-active .category-menu__icon {
  color: #059669;
}

.category-menu__item.is-active .category-menu__count {
  background: #059669;
  color: #ffffff;
}

.catalog-nav__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 140px;
}

.catalog-nav__footer {
  padding: 8px 10px 4px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.back-top-btn {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-top-btn:hover {
  background: var(--el-fill-color);
  color: #059669;
  border-color: rgba(5, 150, 105, 0.3);
}

/* 右侧内容区样式 */
.catalog-toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.catalog-toolbar__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.catalog-toolbar__copy {
  min-width: 0;
}

.catalog-toolbar__title {
  margin: 0 0 4px;
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.25;
}

.catalog-toolbar__subtitle {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 12.5px;
  line-height: 1.5;
}

.catalog-toolbar__search-box {
  flex-shrink: 0;
}

.catalog-search {
  width: min(420px, 42vw);
}

.catalog-search :deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05) inset;
}

.search-icon {
  color: var(--el-text-color-placeholder);
}

/* 筛选与操作栏 */
.catalog-toolbar__controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.type-segmented {
  display: inline-flex;
  align-items: center;
  padding: 3px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  gap: 4px;
}

.type-tab-btn {
  border: none;
  background: transparent;
  padding: 5px 12px;
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.type-tab-btn:hover {
  color: var(--el-text-color-primary);
}

.type-tab-btn.is-active {
  background: var(--el-bg-color);
  color: #059669;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.toolbar-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.expand-toggle-btn {
  font-size: 12px;
  font-weight: 500;
}

/* 筛选生效状态栏 */
.catalog-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(5, 150, 105, 0.05);
  border: 1px dashed rgba(5, 150, 105, 0.25);
  gap: 10px;
  flex-wrap: wrap;
}

.summary-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.summary-label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 500;
}

.summary-count {
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.summary-count strong {
  color: #059669;
}

.reset-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  color: var(--el-color-primary);
  font-size: 12px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: opacity 0.2s ease;
}

.reset-filter-btn:hover {
  opacity: 0.8;
  text-decoration: underline;
}

/* 列表展示滚动区 */
.catalog-sections {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.catalog-sections__scrollbar {
  height: 100%;
  flex: 1;
  min-height: 0;
}

.catalog-sections__viewport {
  position: relative;
  padding-right: 6px;
}

.reference-section {
  scroll-margin-top: 10px;
  margin-bottom: 24px;
}

.reference-section:last-child {
  margin-bottom: 8px;
}

.reference-section__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.reference-section__heading {
  min-width: 0;
}

.reference-section__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 3px;
}

.reference-section__icon-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: rgba(5, 150, 105, 0.1);
  color: #059669;
  font-size: 13px;
}

.reference-section__title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 19px;
  font-weight: 700;
  line-height: 1.3;
}

.reference-section__desc {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 12.5px;
  line-height: 1.5;
  padding-left: 32px;
}

.reference-section__count-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 9999px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.reference-section__col {
  margin-bottom: 14px;
}

/* 空状态 */
.catalog-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  text-align: center;
}

.catalog-empty__icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--el-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.catalog-empty__icon {
  font-size: 32px;
  color: var(--el-text-color-placeholder);
}

.catalog-empty__title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.catalog-empty__desc {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.catalog-empty__btn {
  font-size: 13px;
}

:deep(.el-card__header) {
  padding: 14px 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.catalog-content :deep(.el-card__body) {
  padding: 0 18px 14px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.catalog-nav :deep(.el-card__body) {
  padding: 0;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* 深色模式适配 */
html.dark .catalog-nav,
html.dark .catalog-content {
  background: var(--el-bg-color-overlay);
  border-color: var(--el-border-color-darker);
}

html.dark .category-menu__item.is-active {
  background: rgba(16, 185, 129, 0.12);
  border-left-color: #34d399;
}

html.dark .category-menu__item.is-active .category-menu__label,
html.dark .category-menu__item.is-active .category-menu__icon {
  color: #34d399;
}

html.dark .category-menu__item.is-active .category-menu__count {
  background: #059669;
  color: #ffffff;
}

html.dark .type-tab-btn.is-active {
  background: var(--el-bg-color-overlay);
  color: #34d399;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

html.dark .catalog-summary {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.25);
}

html.dark .summary-count strong {
  color: #34d399;
}

html.dark .reference-section__icon-box {
  background: rgba(16, 185, 129, 0.16);
  color: #34d399;
}

html.dark .catalog-nav__main-icon {
  color: #34d399;
}

html.dark .catalog-nav__badge {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}

/* 响应式样式适配 */
@media (max-width: 991px) {
  .nginx-catalog-layout {
    height: auto;
    overflow: visible;
  }

  .catalog-row {
    height: auto;
  }

  .catalog-col-nav,
  .catalog-col-content {
    height: auto;
  }

  .catalog-nav {
    height: auto;
    margin-bottom: 14px;
  }

  .catalog-nav__scrollbar {
    max-height: 240px;
  }

  .catalog-content {
    height: auto;
  }

  .catalog-sections__scrollbar {
    height: auto;
    max-height: none;
  }

  .catalog-sections__scrollbar :deep(.el-scrollbar__wrap) {
    height: auto;
    max-height: none;
    overflow: visible;
  }

  .catalog-toolbar__top {
    flex-direction: column;
    align-items: stretch;
  }

  .catalog-search {
    width: 100%;
  }

  .catalog-toolbar__controls {
    flex-direction: column;
    align-items: stretch;
  }

  .type-segmented {
    width: 100%;
    justify-content: space-around;
  }

  .toolbar-actions {
    justify-content: flex-end;
  }
}
</style>
