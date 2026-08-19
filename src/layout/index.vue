<script setup>
import { toolCategories } from '../config/tool-categories'

const router = useRouter()
const route = useRoute()
const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: 'light',
  storageKey: 'devopskit-color-mode'
})
const themeTooltip = computed(() => (isDark.value ? '切换为浅色模式' : '切换为深色模式'))

const toggleTheme = event => {
  const isAppearanceTransition =
    document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!isAppearanceTransition || !event) {
    isDark.value = !isDark.value
    return
  }

  const x = event.clientX
  const y = event.clientY

  const transition = document.startViewTransition(async () => {
    isDark.value = !isDark.value
    await nextTick()

    // 确保 View Transition 捕获新快照前，html.dark 已同步更新。
    // 某些响应式更新时序下，仅等待 nextTick 仍可能晚于快照捕获时机。
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  })

  transition.ready
    .then(() => {
      const width = window.innerWidth
      const height = window.innerHeight

      const xPercent = (x / width) * 100
      const yPercent = (y / height) * 100

      const maxDistance = Math.hypot(Math.max(x, width - x), Math.max(y, height - y))

      // CSS circle() 规范中 100% 半径对应的标准化对角线：sqrt(width^2 + height^2) / sqrt(2)
      const normalizedDiagonal = Math.hypot(width, height) / Math.SQRT2
      const radiusPercent = (maxDistance / normalizedDiagonal) * 100

      const clipPath = [
        `circle(0% at ${xPercent}% ${yPercent}%)`,
        `circle(${radiusPercent}% at ${xPercent}% ${yPercent}%)`
      ]

      const clipPathToUse = isDark.value ? [...clipPath].reverse() : clipPath
      const pseudoElementToUse = isDark.value ? '::view-transition-old(root)' : '::view-transition-new(root)'

      document.documentElement.animate(
        {
          clipPath: clipPathToUse
        },
        {
          duration: 400,
          easing: 'ease-in',
          pseudoElement: pseudoElementToUse
        }
      )
    })
    .catch(err => {
      console.error('[Theme Toggle] transition.ready Promise rejected:', err)
    })
}

const menuCategories = computed(() =>
  toolCategories
    .map(category => ({
      ...category,
      tools: category.tools.filter(tool => tool.route)
    }))
    .filter(category => category.tools.length > 0)
)

const handleSelect = key => {
  router.push(key)
}

const handleLogoClick = () => {
  router.push('/')
}
</script>

<template>
  <el-container class="layout-wrapper">
    <!-- 全局头部 -->
    <el-header class="app-header">
      <el-row align="middle" class="header-row">
        <el-col :lg="3" :md="4" :sm="0" :xl="2" :xs="0">
          <div class="logo" @click="handleLogoClick">DevOpsKit</div>
        </el-col>
        <el-col :lg="17" :md="16" :sm="20" :xl="18" :xs="20">
          <el-menu
            :default-active="route.path"
            :ellipsis="true"
            class="header-menu"
            mode="horizontal"
            @select="handleSelect"
          >
            <el-menu-item index="/home">首页</el-menu-item>
            <el-sub-menu v-for="category in menuCategories" :key="category.id" :index="category.menuKey">
              <template #title>{{ category.name }}</template>
              <el-menu-item v-for="tool in category.tools" :key="tool.id" :index="tool.route">
                {{ tool.menuTitle || tool.name }}
              </el-menu-item>
            </el-sub-menu>
          </el-menu>
        </el-col>
        <el-col :lg="4" :md="4" :sm="4" :xl="4" :xs="4" class="header-actions">
          <el-tooltip :content="themeTooltip" placement="bottom">
            <el-switch
              :before-change="() => false"
              :model-value="isDark"
              class="theme-switch"
              inline-prompt
              @click="toggleTheme"
            >
              <template #active-action>
                <IconEpMoon />
              </template>
              <template #inactive-action>
                <IconEpSunny />
              </template>
            </el-switch>
          </el-tooltip>
        </el-col>
      </el-row>
    </el-header>

    <!-- 中间主要内容区域（路由页面） -->
    <el-main class="app-main" style="--el-main-padding: 0">
      <router-view v-slot="{ Component }">
        <transition mode="out-in" name="fade">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>

    <!-- 全局底部：极简风格 -->
    <el-footer class="app-footer">
      <div class="footer-inner">
        <span>© {{ new Date().getFullYear() }} DevOpsKit</span>
        <span class="divider">/</span>
        <a class="footer-link" href="https://github.com/Xueyu334/DevOpsKit" target="_blank">GitHub</a>
        <span class="divider">/</span>
        <a class="footer-link" href="https://github.com/Xueyu334/DevOpsKit/blob/main/LICENSE" target="_blank">
          许可证
        </a>
        <span class="divider">/</span>
        <a class="footer-link" href="https://github.com/Xueyu334/DevOpsKit/issues" target="_blank">问题反馈</a>
      </div>
    </el-footer>
  </el-container>
</template>

<style scoped>
.layout-wrapper {
  height: 100vh;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color-page);
}

.app-main {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.app-header {
  padding: 0 24px;
  border-bottom: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color);
}

.header-row {
  height: 100%;
  flex-wrap: nowrap;
}

.logo {
  font-size: 22px;
  font-weight: bold;
  color: var(--el-color-primary);
  letter-spacing: 1px;
  cursor: pointer;
  white-space: nowrap;
  padding-right: 4px;
}

.header-menu {
  --el-menu-horizontal-height: 58px;
  border-bottom: none;
  background-color: transparent;
}

.header-menu :deep(.el-menu-item),
.header-menu :deep(.el-sub-menu__title) {
  height: var(--el-menu-horizontal-height);
  line-height: var(--el-menu-horizontal-height);
}

.header-actions {
  text-align: right;
}

.theme-switch {
  --el-switch-on-color: var(--el-color-primary);
  --el-switch-off-color: var(--el-border-color-dark);
}

.theme-switch :deep(.el-switch__action) {
  font-size: 14px;
}

.app-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 30px !important;
  border-top: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color);
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}

.footer-inner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.footer-link {
  color: var(--el-text-color-secondary);
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: var(--el-color-primary);
}

.divider {
  color: var(--el-border-color);
  font-style: normal;
}

/* 简单的路由切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
