<script setup>
import NginxReferenceCatalog from './NginxReferenceCatalog.vue'
import {nginxReferenceSections} from '../nginx-reference'

const sectionCount = computed(() => nginxReferenceSections.length)
const itemCount = computed(() =>
    nginxReferenceSections.reduce((total, section) => total + section.items.length, 0)
)
</script>

<template>
  <div class="nginx-reference-view">
    <el-card class="hero-card" shadow="never">
      <div class="hero-card__content">
        <div class="hero-card__copy">
          <h1 class="hero-card__title">Nginx 命令与配置大全</h1>
          <p class="hero-card__desc">
            覆盖基础命令、进程控制、日志排障以及常见 conf 配置，支持搜索、高亮、复制与详情展开。
          </p>
        </div>
        <div class="hero-card__metrics">
          <div class="metric-card">
            <span class="metric-card__label">分类</span>
            <strong class="metric-card__value">{{ sectionCount }}</strong>
          </div>
          <div class="metric-card">
            <span class="metric-card__label">条目</span>
            <strong class="metric-card__value">{{ itemCount }}</strong>
          </div>
          <div class="metric-card">
            <span class="metric-card__label">范围</span>
            <strong class="metric-card__value">命令 + Conf</strong>
          </div>
        </div>
      </div>
    </el-card>

    <NginxReferenceCatalog :sections="nginxReferenceSections"/>
  </div>
</template>

<style scoped>
.nginx-reference-view {
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
  border: none;
  border-radius: 20px;
  background: linear-gradient(135deg, #009688 0%, #4DB6AC 100%); /* Nginx 品牌风格的深绿色渐变 */
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 150, 136, 0.2);
}

.hero-card::before {
  content: "";
  position: absolute;
  top: -50%;
  right: -10%;
  width: 340px;
  height: 340px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.nginx-reference-view :deep(.nginx-catalog-layout) {
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
  max-width: 760px;
}

.hero-card__title {
  margin: 0 0 10px;
  color: #ffffff;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.hero-card__desc {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  line-height: 1.6;
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
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  transition: transform 0.3s ease, background 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.18);
}

.metric-card__label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-card__value {
  color: #ffffff;
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
}

:deep(.hero-card .el-card__body) {
  padding: 24px 30px;
}

</style>
