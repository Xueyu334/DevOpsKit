<script setup>
import NginxReferenceCatalog from './NginxReferenceCatalog.vue'
import { nginxReferenceSections } from '../nginx-reference'

const sectionCount = computed(() => nginxReferenceSections.length)
const itemCount = computed(() => nginxReferenceSections.reduce((total, section) => total + section.items.length, 0))
</script>

<template>
  <div class="nginx-reference-view">
    <el-card class="hero-card" shadow="never">
      <div class="hero-card__content">
        <div class="hero-card__copy">
          <div class="hero-card__badge">
            <span class="badge-dot"></span>
            <span>NGINX CHEATSHEET</span>
          </div>
          <h1 class="hero-card__title">Nginx 命令与配置大全</h1>
          <p class="hero-card__desc">
            收录 CLI 核心运维命令、进程控制、日志排障以及生产级 nginx.conf
            核心指令，支持分类直达、场景速查与代码一键复制。
          </p>
        </div>
        <div class="hero-card__metrics">
          <div class="metric-card">
            <div class="metric-card__icon-box">
              <el-icon><IconEpFolder /></el-icon>
            </div>
            <div class="metric-card__info">
              <span class="metric-card__label">分类模块</span>
              <strong class="metric-card__value">{{ sectionCount }}</strong>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-card__icon-box">
              <el-icon><IconEpTickets /></el-icon>
            </div>
            <div class="metric-card__info">
              <span class="metric-card__label">条目总数</span>
              <strong class="metric-card__value">{{ itemCount }}</strong>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-card__icon-box">
              <el-icon><IconEpCpu /></el-icon>
            </div>
            <div class="metric-card__info">
              <span class="metric-card__label">涵盖类型</span>
              <strong class="metric-card__value">CLI + Conf</strong>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <NginxReferenceCatalog :sections="nginxReferenceSections" />
  </div>
</template>

<style scoped>
.nginx-reference-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 14px;
  padding: 14px 20px 18px;
  box-sizing: border-box;
  overflow: hidden;
}

.hero-card {
  flex-shrink: 0;
  border: none;
  border-radius: 18px;
  background: linear-gradient(135deg, #047857 0%, #059669 40%, #0d9488 100%);
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 28px -6px rgba(5, 150, 105, 0.35);
  transition: all 0.3s ease;
}

.hero-card::before {
  content: '';
  position: absolute;
  top: -60%;
  right: -8%;
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0) 70%);
  border-radius: 50%;
  pointer-events: none;
}

.hero-card::after {
  content: '';
  position: absolute;
  bottom: -40%;
  left: 30%;
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgba(20, 184, 166, 0.25) 0%, rgba(20, 184, 166, 0) 75%);
  border-radius: 50%;
  pointer-events: none;
}

.hero-card__content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.hero-card__copy {
  max-width: 720px;
}

.hero-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 8px #34d399;
  animation: pulse-glow 2s infinite ease-in-out;
}

@keyframes pulse-glow {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.85);
  }
}

.hero-card__title {
  margin: 0 0 8px;
  color: #ffffff;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.hero-card__desc {
  margin: 0;
  color: rgba(255, 255, 255, 0.92);
  font-size: 13.5px;
  line-height: 1.6;
}

.hero-card__metrics {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  min-width: 110px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.metric-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.35);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.metric-card__icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-size: 18px;
  flex-shrink: 0;
}

.metric-card__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-card__label {
  color: rgba(255, 255, 255, 0.82);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.metric-card__value {
  color: #ffffff;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.nginx-reference-view :deep(.nginx-catalog-layout) {
  flex: 1;
  min-height: 0;
}

:deep(.hero-card .el-card__body) {
  padding: 20px 26px;
}

/* 深色模式适配 */
html.dark .hero-card {
  background: linear-gradient(135deg, #064e3b 0%, #062b24 55%, #0f172a 100%);
  border: 1px solid rgba(16, 185, 129, 0.28);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
}

html.dark .hero-card::before {
  background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%);
}

html.dark .hero-card::after {
  background: radial-gradient(circle, rgba(45, 212, 191, 0.12) 0%, transparent 75%);
}

html.dark .hero-card__badge {
  background: rgba(16, 185, 129, 0.16);
  border-color: rgba(16, 185, 129, 0.35);
  color: #a7f3d0;
}

html.dark .metric-card {
  background: rgba(15, 23, 42, 0.45);
  border-color: rgba(16, 185, 129, 0.2);
}

html.dark .metric-card:hover {
  background: rgba(15, 23, 42, 0.65);
  border-color: rgba(16, 185, 129, 0.4);
}

html.dark .metric-card__icon-box {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

/* 响应式断点 */
@media (max-width: 991px) {
  .nginx-reference-view {
    height: auto;
    overflow: visible;
    padding: 12px 14px;
  }

  .hero-card__content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .hero-card__metrics {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .metric-card {
    flex: 1 1 120px;
  }
}
</style>
