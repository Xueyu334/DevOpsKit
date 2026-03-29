<template>
  <div class="home-container">
    <!-- 欢迎区 -->
    <div class="hero-section">
      <h1 class="hero-title">DevOpsKit</h1>
      <p class="hero-subtitle">您的专属研发与运维效率工具箱</p>

      <!-- 搜索框 -->
      <div class="search-bar">
        <el-input v-model="searchQuery" placeholder="搜索您需要的工具，例如：文本比对..." size="large" clearable>
          <template #prefix>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 工具分类展示区 -->
    <div class="tools-section">
      <div v-for="(category, index) in filteredCategories" :key="index" class="category-block">
        <h2 class="category-title" v-if="category.tools.length > 0">
          {{ category.name }}
        </h2>

        <el-row :gutter="24">
          <el-col v-for="tool in category.tools" :key="tool.id" v-bind="{ xs: 24, sm: 12, md: 8, lg: 6, xl: 6 }"
            class="tool-col">
            <div class="tool-card" @click="handleNavigate(tool.route)">
              <div class="card-icon" :style="{ background: tool.color + '1A', color: tool.color }"
                v-html="tool.svgIcon">
              </div>
              <div class="card-content">
                <div class="card-header">
                  <h3 class="tool-title">{{ tool.name }}</h3>
                  <el-tag v-if="tool.tag" size="small" :type="tool.tagType" effect="light" round>
                    {{ tool.tag }}
                  </el-tag>
                </div>
                <p class="tool-desc" :title="tool.desc">{{ tool.desc }}</p>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 搜索无结果时的空状态 -->
      <el-empty v-if="hasNoResults" description="未找到相关工具，请尝试其他关键词">
        <template #image>
          <svg style="width: 120px; height: 120px; color: var(--el-text-color-placeholder)" viewBox="0 0 1024 1024"
            xmlns="http://www.w3.org/2000/svg" data-v-ea893728="">
            <path fill="currentColor"
              d="M512 896a384 384 0 1 0 0-768 384 384 0 0 0 0 768zm0 64a448 448 0 1 1 0-896 448 448 0 0 1 0 896z">
            </path>
            <path fill="currentColor"
              d="M363.84 517.248l-45.248-45.248L512 278.592l193.408 193.408-45.248 45.248L512 369.088z"></path>
            <path fill="currentColor" d="M512 302.272V736h-64V302.272z"></path>
          </svg>
        </template>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchQuery = ref('')

// 工具分类数据
const toolCategories = ref([
  {
    name: '文本与代码处理',
    tools: [
      {
        id: 'text-diff',
        name: '文本比对 (Text Diff)',
        desc: '支持大文本、多语言的代码和普通文本差异对比，提供并排和统一模式。',
        route: '/text-diff',
        svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="13" x2="12" y2="17"/><line x1="10" y1="15" x2="14" y2="15"/></svg>',
        color: '#409EFF',
        tag: 'Hot',
        tagType: 'danger'
      },
      {
        id: 'json-tools',
        name: 'JSON 工具',
        desc: 'JSON 格式化、压缩、转译、解析以及结构校验。',
        route: '/json-tools', // 预留
        svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/></svg>',
        color: '#67C23A',
        tag: 'Dev',
        tagType: 'info'
      }
    ]
  },
  {
    name: '编解码与加密',
    tools: [
      {
        id: 'base64',
        name: 'Base64 编解码',
        desc: '快速进行 Base64 字符串的编码与解码转换。',
        route: '',
        svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
        color: '#E6A23C',
        tag: '',
        tagType: ''
      },
      {
        id: 'hash-gen',
        name: 'Hash 生成器',
        desc: '计算文本的 MD5, SHA1, SHA256 等常见信息摘要。',
        route: '',
        svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>',
        color: '#F56C6C',
        tag: '',
        tagType: ''
      }
    ]
  },
  {
    name: '网络与其它配置',
    tools: [
      {
        id: 'url-encode',
        name: 'URL 编解码',
        desc: '对 URI 字符串中的特殊字符进行批量转义处理。',
        route: '',
        svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
        color: '#909399',
        tag: '',
        tagType: ''
      },
      {
        id: 'cron',
        name: 'Cron 表达式',
        desc: '在线生成、反解析以及测试 Cron 定时任务执行时间表。',
        route: '',
        svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        color: '#8E44AD',
        tag: '',
        tagType: ''
      }
    ]
  }
])

// 过滤搜索逻辑，支持忽略大小写
const filteredCategories = computed(() => {
  if (!searchQuery.value) return toolCategories.value

  const query = searchQuery.value.toLowerCase()
  return toolCategories.value.map(category => {
    return {
      ...category,
      tools: category.tools.filter(tool =>
        tool.name.toLowerCase().includes(query) ||
        tool.desc.toLowerCase().includes(query)
      )
    }
  })
})

const hasNoResults = computed(() => {
  return filteredCategories.value.every(cat => cat.tools.length === 0)
})

// 卡片点击跳转逻辑
const handleNavigate = (route) => {
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
  padding: 32px 48px;
  min-height: calc(100vh - 40px);
  background: var(--el-bg-color-page);
  /* 轻微的径向渐变背景增加层次感 */
  background-image: radial-gradient(circle at 50% -20%, var(--el-color-primary-light-9) 0%, transparent 60%);
  background-repeat: no-repeat;
  background-size: 100% 500px;
}

/* 欢迎区样式 */
.hero-section {
  text-align: center;
  padding: 60px 0 70px 0;
  animation: fadeInDown 0.6s ease-out;
}

.hero-title {
  font-size: 48px;
  font-weight: 800;
  margin: 0;
  /* 动态文字渐变 */
  background: linear-gradient(135deg, var(--el-color-primary), #36d1dc, var(--el-color-primary));
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
  letter-spacing: 2px;
  animation: bgPan 6s linear infinite;
}

.hero-subtitle {
  font-size: 18px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
  margin-top: 16px;
  margin-bottom: 40px;
  letter-spacing: 1px;
}

.search-bar {
  max-width: 600px;
  margin: 0 auto;
}

:deep(.search-bar .el-input__wrapper) {
  border-radius: 24px;
  padding: 4px 20px;
  font-size: 16px;
  height: 52px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04) !important;
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  background-color: var(--el-bg-color);
}

:deep(.search-bar .el-input__wrapper:hover) {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06) !important;
}

:deep(.search-bar .el-input__wrapper.is-focus) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary-light-5), 0 8px 24px rgba(64, 158, 255, 0.15) !important;
}

:deep(.search-bar .el-input__prefix) {
  color: var(--el-text-color-secondary);
  margin-right: 12px;
}

/* 分类与卡片样式 */
.tools-section {
  max-width: 1400px;
  margin: 0 auto;
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

.category-block {
  margin-bottom: 48px;
}

.category-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 24px;
  padding-left: 14px;
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
  height: 20px;
  background-color: var(--el-color-primary);
  border-radius: 4px;
}

.tool-col {
  margin-bottom: 24px;
}

/* 漂亮的发光悬浮卡片 */
.tool-card {
  display: flex;
  align-items: flex-start;
  padding: 24px;
  background-color: var(--el-bg-color);
  border-radius: 16px;
  border: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  height: 100%;
  box-sizing: border-box;
}

.tool-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.08);
  border-color: var(--el-color-primary-light-5);
}

.card-icon {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tool-card:hover .card-icon {
  transform: scale(1.15) rotate(-5deg);
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
  margin-bottom: 8px;
  gap: 8px;
}

.tool-title {
  font-size: 16px;
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

.tool-desc {
  font-size: 13px;
  color: var(--el-text-color-regular);
  margin: 0;
  line-height: 1.6;
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

/* 暗色模式适配 */
html.dark .home-container {
  background-image: radial-gradient(circle at 50% -20%, rgba(64, 158, 255, 0.1) 0%, transparent 60%);
}

html.dark .tool-card {
  background-color: var(--el-bg-color-overlay);
  border-color: var(--el-border-color-darker);
}

html.dark .tool-card:hover {
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.4);
  border-color: var(--el-color-primary-light-3);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .home-container {
    padding: 20px 24px;
  }

  .hero-title {
    font-size: 36px;
  }

  .hero-section {
    padding: 40px 0 50px 0;
  }

  .tool-card {
    padding: 18px;
  }

  .card-icon {
    width: 48px;
    height: 48px;
    margin-right: 16px;
  }
}
</style>
