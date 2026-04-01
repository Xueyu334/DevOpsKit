<script setup>
import {computed} from 'vue'
import {useRoute, useRouter} from 'vue-router'

const router = useRouter()
const route = useRoute()

const missingPath = computed(() => {
  const pathMatch = route.params.pathMatch
  const normalizedPath = Array.isArray(pathMatch) ? pathMatch.join('/') : pathMatch
  return normalizedPath ? `/${normalizedPath}` : route.fullPath
})

const goHome = () => {
  router.push('/home')
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <section class="not-found-page">
    <div class="glow glow-left"></div>
    <div class="glow glow-right"></div>

    <div class="not-found-card">
      <p class="eyebrow">Page Missing</p>
      <div class="code-row" aria-hidden="true">
        <span class="digit">4</span>
        <span class="digit zero">0</span>
        <span class="digit">4</span>
      </div>

      <h1 class="title">页面走丢了，但工具箱还在。</h1>
      <p class="desc">
        当前访问的地址不存在，可能已被删除、改名，或者链接写错了。
      </p>

      <div class="path-box">
        <span class="path-label">当前路径</span>
        <code class="path-value">{{ missingPath }}</code>
      </div>

      <div class="actions">
        <el-button type="primary" size="large" round @click="goHome">
          返回首页
        </el-button>
        <el-button size="large" round @click="goBack">
          返回上一页
        </el-button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.not-found-page {
  position: relative;
  min-height: calc(100vh - 120px);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  background: radial-gradient(circle at top left, rgba(64, 158, 255, 0.18), transparent 34%),
  radial-gradient(circle at bottom right, rgba(103, 194, 58, 0.16), transparent 30%),
  linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.96));
}

.glow {
  position: absolute;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.45;
  pointer-events: none;
}

.glow-left {
  top: -60px;
  left: -80px;
  background: rgba(64, 158, 255, 0.28);
}

.glow-right {
  right: -100px;
  bottom: -80px;
  background: rgba(103, 194, 58, 0.24);
}

.not-found-card {
  position: relative;
  z-index: 1;
  width: min(720px, 100%);
  padding: 40px 32px;
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 28px;
  text-align: center;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(14px);
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.08);
}

.eyebrow {
  margin: 0 0 12px;
  color: var(--el-color-primary);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.code-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}

.digit {
  font-size: clamp(72px, 16vw, 148px);
  line-height: 1;
  font-weight: 900;
  color: #0f172a;
  text-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
}

.zero {
  background: linear-gradient(135deg, var(--el-color-primary), #36d1dc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
}

.title {
  margin: 0 0 12px;
  color: var(--el-text-color-primary);
  font-size: clamp(26px, 4vw, 38px);
  font-weight: 800;
}

.desc {
  max-width: 520px;
  margin: 0 auto;
  color: var(--el-text-color-regular);
  font-size: 15px;
  line-height: 1.8;
}

.path-box {
  margin: 28px auto 0;
  max-width: 520px;
  padding: 14px 16px;
  border: 1px dashed var(--el-border-color);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.6);
}

.path-label {
  display: block;
  margin-bottom: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.path-value {
  color: var(--el-color-danger);
  font-size: 14px;
  word-break: break-all;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 28px;
  flex-wrap: wrap;
}

html.dark .not-found-page {
  background: radial-gradient(circle at top left, rgba(64, 158, 255, 0.2), transparent 34%),
  radial-gradient(circle at bottom right, rgba(103, 194, 58, 0.18), transparent 30%),
  linear-gradient(180deg, rgba(12, 18, 30, 0.96), rgba(15, 23, 42, 0.98));
}

html.dark .not-found-card {
  background: rgba(15, 23, 42, 0.72);
  border-color: rgba(148, 163, 184, 0.18);
  box-shadow: 0 24px 80px rgba(2, 6, 23, 0.42);
}

html.dark .digit {
  color: #e5eefb;
}

html.dark .path-box {
  background: rgba(15, 23, 42, 0.48);
  border-color: rgba(148, 163, 184, 0.28);
}
</style>
