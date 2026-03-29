<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const handleSelect = (key) => {
  router.push(key)
}
</script>

<template>
  <el-container class="layout-wrapper">
    <!-- 全局头部 -->
    <el-header class="app-header">
      <div class="logo">DevOpsKit</div>
      <el-menu :default-active="route.path" mode="horizontal" @select="handleSelect" class="header-menu"
        :ellipsis="false">
        <el-menu-item index="/home">首页</el-menu-item>

        <el-sub-menu index="text-and-code">
          <template #title>文本与代码处理</template>
          <el-menu-item index="/text-diff">文本比对</el-menu-item>
          <el-menu-item index="/json-tools">JSON 工具</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="crypto">
          <template #title>编解码与加密</template>
          <el-menu-item index="/base64">Base64 编解码</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="network">
          <template #title>网络与其它配置</template>
          <el-menu-item index="/url-encode">URL 编解码</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-header>

    <!-- 中间主要内容区域（路由页面） -->
    <el-main style="--el-main-padding: 0;">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
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
