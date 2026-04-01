<script setup>
import DockerCommandCatalog from './DockerCommandCatalog.vue'
import {dockerCommandSections} from '../docker-commands'

const sectionCount = computed(() => dockerCommandSections.length)
const commandCount = computed(() =>
  dockerCommandSections.reduce((total, section) => total + section.commands.length, 0)
)
</script>

<template>
  <div class="docker-command-view">
    <el-card class="hero-card" shadow="never">
      <div class="hero-card__content">
        <div class="hero-card__copy">
          <div class="hero-card__badge">Docker Cheat Sheet</div>
          <h1 class="hero-card__title">Docker 命令大全备查</h1>
          <p class="hero-card__desc">
            按镜像、容器、网络、数据卷、系统与 Docker Compose 分类整理，支持搜索、高亮、复制和详情展开。
          </p>
        </div>

        <div class="hero-card__metrics">
          <div class="metric-card">
            <span class="metric-card__label">分类</span>
            <strong class="metric-card__value">{{ sectionCount }}</strong>
          </div>
          <div class="metric-card">
            <span class="metric-card__label">命令</span>
            <strong class="metric-card__value">{{ commandCount }}</strong>
          </div>
          <div class="metric-card">
            <span class="metric-card__label">范围</span>
            <strong class="metric-card__value">Docker + Compose</strong>
          </div>
        </div>
      </div>
    </el-card>

    <DockerCommandCatalog :sections="dockerCommandSections"/>
  </div>
</template>

<style scoped>
.docker-command-view {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px 20px 20px;
}

.docker-command-view::before {
  content: '';
  position: absolute;
  top: -140px;
  left: 50%;
  z-index: 0;
  width: min(1120px, 94vw);
  height: 440px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(
      circle,
      color-mix(in srgb, var(--el-color-primary) 14%, white) 0%,
      color-mix(in srgb, var(--el-color-primary) 7%, transparent) 42%,
      transparent 76%
  );
  filter: blur(18px);
  pointer-events: none;
}

.hero-card,
.docker-command-view :deep(.catalog-nav),
.docker-command-view :deep(.catalog-content) {
  position: relative;
  z-index: 1;
}

.hero-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 22px;
  overflow: hidden;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--el-color-primary) 8%, transparent), transparent 60%),
    var(--el-bg-color);
}

.hero-card__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 8px 4px;
}

.hero-card__copy {
  max-width: 760px;
}

.hero-card__badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 30%, transparent);
  border-radius: 999px;
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
}

.hero-card__title {
  margin: 14px 0 10px;
  color: var(--el-text-color-primary);
  font-size: 34px;
  line-height: 1.15;
}

.hero-card__desc {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 1.8;
}

.hero-card__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(120px, 1fr));
  gap: 12px;
  min-width: 360px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 18px;
  background: color-mix(in srgb, var(--el-bg-color) 92%, var(--el-color-primary) 8%);
}

.metric-card__label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.metric-card__value {
  color: var(--el-text-color-primary);
  font-size: 22px;
  line-height: 1.2;
}

:deep(.hero-card .el-card__body) {
  padding: 22px 24px;
}

html.dark .docker-command-view::before {
  background: radial-gradient(
      circle,
      color-mix(in srgb, var(--el-color-primary) 18%, transparent) 0%,
      color-mix(in srgb, var(--el-color-primary) 10%, transparent) 40%,
      transparent 76%
  );
}

html.dark .hero-card {
  border-color: var(--el-border-color-darker);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--el-color-primary) 12%, transparent), transparent 60%),
    var(--el-bg-color-overlay);
}

html.dark .metric-card {
  border-color: var(--el-border-color-darker);
  background: color-mix(in srgb, var(--el-bg-color-overlay) 90%, var(--el-color-primary) 10%);
}

@media (max-width: 1199px) {
  .hero-card__content {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-card__metrics {
    min-width: 0;
  }
}

@media (max-width: 767px) {
  .docker-command-view {
    padding: 12px 16px 16px;
  }

  .hero-card__title {
    font-size: 28px;
  }

  .hero-card__metrics {
    grid-template-columns: 1fr;
  }
}
</style>
