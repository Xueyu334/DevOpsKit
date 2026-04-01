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
          <h1 class="hero-card__title">Docker 命令大全备查</h1>
          <p class="hero-card__desc">
            覆盖镜像、容器、网络、数据卷、系统和 Docker Compose，支持搜索、高亮、复制与详情展开。
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
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 14px;
  padding: 12px 20px 18px;
  box-sizing: border-box;
  overflow: hidden;
}

.hero-card {
  flex-shrink: 0;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.docker-command-view :deep(.catalog-layout) {
  flex: 1;
  min-height: 0;
}

.hero-card__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.hero-card__copy {
  max-width: 720px;
}

.hero-card__title {
  margin: 0 0 6px;
  color: var(--el-text-color-primary);
  font-size: 28px;
  line-height: 1.2;
}

.hero-card__desc {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.65;
}

.hero-card__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(96px, 1fr));
  gap: 10px;
  min-width: 312px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-light);
}

.metric-card__label {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.2;
}

.metric-card__value {
  color: var(--el-text-color-primary);
  font-size: 18px;
  line-height: 1.3;
}

:deep(.hero-card .el-card__body) {
  padding: 16px 20px;
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
    height: auto;
    overflow: visible;
    padding: 12px 16px 16px;
  }

  .hero-card__title {
    font-size: 24px;
  }

  .hero-card__metrics {
    grid-template-columns: 1fr;
    min-width: 0;
  }
}
</style>
