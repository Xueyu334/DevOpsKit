<script setup>
import {computed} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {toolCategories} from '../config/tool-categories'

const router = useRouter()
const route = useRoute()
const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: 'light',
  storageKey: 'devopskit-color-mode'
})
const themeTooltip = computed(() => isDark.value ? '切换为浅色模式' : '切换为深色模式')

const menuCategories = computed(() =>
    toolCategories
        .map(category => ({
          ...category,
          tools: category.tools.filter(tool => tool.route)
        }))
        .filter(category => category.tools.length > 0)
)

const handleSelect = (key) => {
  router.push(key)
}
</script>

<template>
  <el-container class="layout-wrapper">
    <!-- 全局头部 -->
    <el-header class="app-header">
      <div class="logo">DevOpsKit</div>
      <el-menu :default-active="route.path" :ellipsis="false" class="header-menu" mode="horizontal"
               @select="handleSelect">
        <el-menu-item index="/home">首页</el-menu-item>
        <el-sub-menu v-for="category in menuCategories" :key="category.menuKey" :index="category.menuKey">
          <template #title>{{ category.name }}</template>
          <el-menu-item v-for="tool in category.tools" :key="tool.id" :index="tool.route">
            {{ tool.menuTitle || tool.name }}
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
      <div class="header-actions">
        <el-tooltip :content="themeTooltip" placement="bottom">
          <el-switch v-model="isDark" class="theme-switch" inline-prompt>
            <template #active-action>
              <IconEpMoon/>
            </template>
            <template #inactive-action>
              <IconEpSunny/>
            </template>
          </el-switch>
        </el-tooltip>
      </div>
    </el-header>

    <!-- 中间主要内容区域（路由页面） -->
    <el-main class="app-main" style="--el-main-padding: 0;">
      <router-view v-slot="{ Component }">
        <transition mode="out-in" name="fade">
          <component :is="Component"/>
        </transition>
      </router-view>
    </el-main>

    <!-- 全局底部 -->
    <!-- 清除 el-footer 自带的 20px 左右 padding 和高度限制 -->
    <el-footer class="app-footer" style="--el-footer-padding: 0; height: auto;padding-bottom: 10px;">
      <p>&copy; {{ new Date().getFullYear() }} DevOpsKit. All rights reserved.</p>
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
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color);
}

.logo {
  font-size: 22px;
  font-weight: bold;
  color: var(--el-color-primary);
  margin-right: 40px;
  letter-spacing: 1px;
}

.header-menu {
  flex: 1;
  border-bottom: none;
  background-color: transparent;
}

.header-actions {
  display: flex;
  align-items: center;
  margin-left: 16px;
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
  height: 60px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.app-footer p {
  margin: 0;
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
