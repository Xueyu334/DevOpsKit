<script setup>
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
  <section class="not-found-container">
    <!-- Animated background accents -->
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>

    <div class="minimal-wrapper">
      <!-- High-impact minimalist 404 visual -->
      <div class="error-visual">
        <h1 class="digit-404">404</h1>
        <div class="visual-accent"></div>
      </div>

      <div class="content">
        <h2 class="title">页面在云端走丢了</h2>

        <!-- Subtle path info: Provides context without noise -->
        <div class="path-indicator">
          <span class="label">当前请求路径：</span>
          <code>{{ missingPath }}</code>
        </div>

        <p class="description">虽然没找到您要的内容，但工具箱里还有很多利器等着您。</p>

        <div class="actions">
          <el-button type="primary" size="large" class="btn-primary" @click="goHome">
            <template #icon><icon-ep-home-filled /></template>
            返回首页
          </el-button>
          <el-button size="large" class="btn-back" text @click="goBack">
            <template #icon><icon-ep-back /></template>
            返回上一页
          </el-button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.not-found-container {
  position: relative;
  width: 100%;
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  overflow: hidden;
}

/* Background Gradients */
.blob {
  position: absolute;
  width: 600px;
  height: 600px;
  filter: blur(120px);
  opacity: 0.12;
  z-index: 0;
  border-radius: 50%;
  animation: move 18s infinite alternate ease-in-out;
}

.blob-1 {
  background: var(--el-color-primary);
  top: -10%;
  right: -5%;
}

.blob-2 {
  background: #67c23a;
  bottom: -10%;
  left: -5%;
  animation-delay: -6s;
}

@keyframes move {
  0% {
    transform: scale(1) translate(0, 0);
  }

  100% {
    transform: scale(1.15) translate(60px, 40px);
  }
}

.minimal-wrapper {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 540px;
  padding: 0 24px;
}

/* 404 Visual */
.error-visual {
  position: relative;
  display: inline-block;
  margin-bottom: 2.5rem;
}

.digit-404 {
  font-size: clamp(6rem, 15vw, 9rem);
  font-weight: 900;
  line-height: 1;
  margin: 0;
  background: linear-gradient(135deg, #0f172a 0%, #475569 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -6px;
}

.visual-accent {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 48px;
  height: 6px;
  background: var(--el-color-primary);
  border-radius: 3px;
  opacity: 0.8;
}

/* Typography */
.title {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 1rem;
}

.path-indicator {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  background: #f1f5f9;
  border-radius: 10px;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
}

.path-indicator .label {
  color: #64748b;
}

.path-indicator code {
  color: var(--el-color-primary);
  font-weight: 600;
  margin-left: 4px;
  font-family: 'Fira Code', 'Roboto Mono', monospace;
}

.description {
  color: #64748b;
  font-size: 1.1rem;
  margin-bottom: 3rem;
  line-height: 1.6;
}

/* Buttons */
.actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.btn-primary {
  width: 220px;
  height: 52px !important;
  font-size: 1.05rem !important;
  font-weight: 600 !important;
  border-radius: 14px !important;
  box-shadow: 0 10px 25px -5px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease !important;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px -5px rgba(64, 158, 255, 0.4);
}

.btn-back {
  font-size: 1rem !important;
  color: #64748b !important;
  transition: color 0.3s ease !important;
}

.btn-back:hover {
  color: var(--el-color-primary) !important;
}

/* Dark Mode Implementation */
:deep(html.dark) .not-found-container {
  background-color: #020617;
}

:deep(html.dark) .digit-404 {
  background: linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

:deep(html.dark) .title {
  color: #f1f5f9;
}

:deep(html.dark) .path-indicator {
  background: #1e293b;
  border-color: #334155;
}

:deep(html.dark) .path-indicator .label {
  color: #94a3b8;
}

:deep(html.dark) .description {
  color: #94a3b8;
}

:deep(html.dark) .blob {
  opacity: 0.08;
}

@media (max-width: 640px) {
  .digit-404 {
    font-size: 5rem;
  }

  .title {
    font-size: 1.5rem;
  }

  .minimal-wrapper {
    padding: 0 32px;
  }
}
</style>
