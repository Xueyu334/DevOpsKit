<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
        <el-col :lg="2" :md="0" :sm="0" :xl="2" :xs="0">
          <div class="logo" @click="handleLogoClick">DevOpsKit</div>
        </el-col>
        <el-col :lg="18" :md="22" :sm="22" :xl="18" :xs="22">
          <el-menu
            :default-active="route.path"
            :ellipsis="true"
            class="header-menu"
            mode="horizontal"
            @select="handleSelect"
          >
            <el-menu-item index="/home">首页</el-menu-item>
            <el-sub-menu v-for="category in menuCategories" :key="category.menuKey" :index="category.menuKey">
              <template #title>{{ category.name }}</template>
              <el-menu-item v-for="tool in category.tools" :key="tool.id" :index="tool.route">
                {{ tool.menuTitle || tool.name }}
              </el-menu-item>
            </el-sub-menu>
          </el-menu>
        </el-col>
        <el-col :lg="4" :md="2" :sm="2" :xl="4" :xs="2" class="header-actions">
          <el-tooltip :content="themeTooltip" placement="bottom">
            <el-switch v-model="isDark" class="theme-switch" inline-prompt>
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
        <a href="https://github.com/Xueyu334/DevOpsKit" target="_blank" class="footer-link">GitHub</a>
        <span class="divider">/</span>
        <a href="https://github.com/Xueyu334/DevOpsKit/issues" target="_blank" class="footer-link">问题反馈</a>
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
