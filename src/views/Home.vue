<template>
  <div class="home-container">
    <!-- 欢迎区 -->
    <div class="hero-section">
      <h1 class="hero-title">DevOpsKit</h1>
      <p class="hero-subtitle">您的专属研发与运维效率工具箱</p>

      <!-- 搜索框 -->
      <div class="search-bar">
        <el-input v-model="searchQuery" clearable placeholder="搜索您需要的工具，例如：文本比对..." size="large">
          <template #prefix>
            <el-icon class="search-prefix-icon">
              <IconEpSearch />
            </el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 工具分类展示区 -->
    <div class="tools-section">
      <el-scrollbar class="tools-scrollbar">
        <div class="tools-scroll-content">
          <div v-for="(category, index) in filteredCategories" :key="index" class="category-block">
            <h2 v-if="category.tools.length > 0" class="category-title">
              {{ category.name }}
            </h2>
            <el-row :gutter="16">
              <el-col
                v-for="tool in category.tools"
                :key="tool.id"
                class="tool-col"
                v-bind="{ xs: 24, sm: 12, md: 8, lg: 6, xl: 6 }"
              >
                <div class="tool-card" @click="handleNavigate(tool.route)">
                  <div :style="{ background: tool.color + '1A', color: tool.color }" class="card-icon">
                    <component :is="toolIconMap[tool.icon] || IconEpTools" class="tool-icon" />
                  </div>
                  <div class="card-content">
                    <div class="card-header">
                      <h3 class="tool-title">{{ tool.name }}</h3>
                      <el-tooltip
                        v-if="tool.tag"
                        :content="tool.tagTip || tagTypeHints[tool.tagType || '']"
                        placement="top"
                      >
                        <el-tag effect="light" round size="small" v-bind="tool.tagType ? { type: tool.tagType } : {}">
                          {{ tool.tag }}
                        </el-tag>
                      </el-tooltip>
                    </div>
                    <p :title="tool.desc" class="tool-desc">{{ tool.desc }}</p>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>

          <!-- 搜索无结果时的空状态 -->
          <el-empty v-if="hasNoResults" description="未找到相关工具，请尝试其他关键词">
            <template #image>
              <el-icon class="empty-icon">
                <IconEpSearch />
              </el-icon>
            </template>
          </el-empty>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup>
import IconEpCreditCard from '~icons/ep/credit-card'
import IconEpDocumentCopy from '~icons/ep/document-copy'
import IconEpKey from '~icons/ep/key'
import IconEpLink from '~icons/ep/link'
import IconEpPostcard from '~icons/ep/postcard'
import IconEpTickets from '~icons/ep/tickets'
import IconEpTimer from '~icons/ep/timer'
import IconEpTools from '~icons/ep/tools'
import IconEpMenu from '~icons/ep/menu'
import Fuse from 'fuse.js'
import { tagTypeHints, toolCategories } from '../config/tool-categories'

const router = useRouter()

const searchQuery = ref('')

const toolIconMap = {
  CreditCard: IconEpCreditCard,
  DocumentCopy: IconEpDocumentCopy,
  Key: IconEpKey,
  Link: IconEpLink,
  Postcard: IconEpPostcard,
  Tickets: IconEpTickets,
  Timer: IconEpTimer,
  Menu: IconEpMenu
}

const flatTools = computed(() =>
  toolCategories.flatMap(category =>
    category.tools.map(tool => ({
      ...tool,
      categoryName: category.name
    }))
  )
)

const toolsFuse = computed(
  () =>
    new Fuse(flatTools.value, {
      includeScore: true,
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
      keys: [
        { name: 'name', weight: 0.5 },
        { name: 'desc', weight: 0.3 },
        { name: 'keywords', weight: 0.2 }
      ]
    })
)

// 过滤搜索逻辑，支持模糊搜索和关键词别名
const filteredCategories = computed(() => {
  const query = searchQuery.value.trim()
  if (!query) {
    return toolCategories
  }

  const matchedToolIds = new Set(toolsFuse.value.search(query).map(result => result.item.id))

  return toolCategories.map(category => ({
    ...category,
    tools: category.tools.filter(tool => matchedToolIds.has(tool.id))
  }))
})

const hasNoResults = computed(() => filteredCategories.value.every(cat => cat.tools.length === 0))

// 卡片点击跳转逻辑
const handleNavigate = route => {
  if (!route) {
    ElMessage({
      message: '该工具功能还在努力开发中，敬请期待！',
      type: 'info',
      plain: true,
      grouping: true
    })
    return
  }
  router.push(route)
}
</script>

<style scoped>
.home-container {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  padding: 12px 20px;
  overflow: hidden;
}

.home-container::before {
  content: '';
  position: absolute;
  top: -180px;
  left: 50%;
  z-index: 0;
  width: min(1200px, 96vw);
  height: 520px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--el-color-primary) 14%, white) 0%,
    color-mix(in srgb, var(--el-color-primary) 8%, transparent) 38%,
    transparent 74%
  );
  filter: blur(16px);
  pointer-events: none;
}

.hero-section,
.tools-section {
  position: relative;
  z-index: 1;
}

/* 欢迎区样式 */
.hero-section {
  flex-shrink: 0;
  text-align: center;
  padding: 8px 0 18px;
  animation: fadeInDown 0.6s ease-out;
}

.hero-title {
  font-size: 32px;
  font-weight: 800;
  margin: 0;
  /* 动态文字渐变 */
  background: linear-gradient(135deg, var(--el-color-primary), #36d1dc, var(--el-color-primary));
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
  letter-spacing: 1px;
  animation: bgPan 6s linear infinite;
}

.hero-subtitle {
  font-size: 14px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
  margin: 8px 0 12px;
  letter-spacing: 0.5px;
}

.search-bar {
  max-width: 600px;
  margin-inline: auto;
}

:deep(.search-bar .el-input__wrapper) {
  border-radius: 20px;
  padding: 4px 16px;
  font-size: 14px;
  height: 40px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04) !important;
  border: 1px solid var(--el-border-color-lighter);
  transition:
    border-color 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
    box-shadow 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  background-color: var(--el-bg-color);
}

:deep(.search-bar .el-input__wrapper:hover) {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06) !important;
}

:deep(.search-bar .el-input__wrapper.is-focus) {
  border-color: var(--el-color-primary);
  box-shadow:
    0 0 0 1px var(--el-color-primary-light-5),
    0 8px 24px rgba(64, 158, 255, 0.15) !important;
}

:deep(.search-bar .el-input__prefix) {
  color: var(--el-text-color-secondary);
  margin-right: 12px;
}

.search-prefix-icon {
  font-size: 18px;
}

.tools-section {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

.tools-scrollbar {
  height: 100%;
}

.tools-scroll-content {
  padding: 2px 20px 16px;
  overflow-x: hidden;
}

:deep(.tools-scrollbar .el-scrollbar__wrap),
:deep(.tools-scrollbar .el-scrollbar__view) {
  overflow-x: hidden;
}

:deep(.tools-scrollbar .el-scrollbar__bar.is-horizontal) {
  display: none;
}

.category-block {
  margin-bottom: 20px;
}

.category-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
  padding-left: 10px;
  position: relative;
  letter-spacing: 0.5px;
}

.category-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background-color: var(--el-color-primary);
  border-radius: 4px;
}

.tool-col {
  margin-bottom: 12px;
}

/* 漂亮的发光悬浮卡片 */
.tool-card {
  display: flex;
  align-items: flex-start;
  padding: 16px 12px;
  background-color: var(--el-bg-color);
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition:
    transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
    border-color 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
    box-shadow 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  height: 100%;
  box-sizing: border-box;
}

.tool-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  border-color: var(--el-color-primary-light-5);
}

.card-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tool-icon {
  width: 28px;
  height: 28px;
}

.tool-card:hover .card-icon {
  transform: scale(1.1) rotate(-5deg);
}

.card-content {
  flex: 1;
  min-width: 0;
  /* 确保文字截断生效 */
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  gap: 6px;
}

.tool-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s;
}

.tool-card:hover .tool-title {
  color: var(--el-color-primary);
}

.empty-icon {
  font-size: 120px;
  color: var(--el-text-color-placeholder);
}

.tool-desc {
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin: 0;
  line-height: 1.5;
  /* 多行文本截断 */
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 动画定义 */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bgPan {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

html.dark .home-container::before {
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--el-color-primary) 20%, transparent) 0%,
    color-mix(in srgb, var(--el-color-primary) 12%, transparent) 36%,
    transparent 74%
  );
  filter: blur(20px);
}

html.dark .tool-card {
  background-color: var(--el-bg-color-overlay);
  border-color: var(--el-border-color-darker);
}

html.dark .tool-card:hover {
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.4);
  border-color: var(--el-color-primary-light-3);
}
</style>
