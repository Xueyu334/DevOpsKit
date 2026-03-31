<script setup>
import AsciiLookupPanel from './components/AsciiLookupPanel.vue';
import AsciiMatrix from './components/AsciiMatrix.vue';
import {useAsciiLookup} from './composables/useAsciiLookup';

const {
  activeCode,
  featuredItem,
  hasQuery,
  highlightedCodes,
  matchedItems,
  query,
  selectCode,
  tableRows
} = useAsciiLookup();
</script>

<template>
  <div class="ascii-page">
    <div class="ascii-hero">
      <div class="ascii-hero-copy">
        <h1 class="ascii-hero-title">ASCII码对照表</h1>
      </div>
    </div>

    <AsciiLookupPanel
        v-model="query"
        :featured-item="featuredItem"
        :has-query="hasQuery"
        :matches="matchedItems"
        @select="selectCode"
    />

    <AsciiMatrix
        :active-code="activeCode"
        :highlighted-codes="highlightedCodes"
        :rows="tableRows"
        @select="selectCode"
    />
  </div>
</template>

<style scoped>
.ascii-page {
  position: relative;
  isolation: isolate;
  min-height: 100%;
  padding: 10px 24px 28px;
  overflow: hidden;
  background: radial-gradient(circle at top left, color-mix(in srgb, var(--el-color-primary) 10%, transparent) 0%, transparent 32%),
  radial-gradient(circle at top right, color-mix(in srgb, var(--el-color-warning) 10%, transparent) 0%, transparent 28%),
  var(--el-bg-color-page);
}

.ascii-page::before {
  content: '';
  position: absolute;
  top: -180px;
  right: -90px;
  z-index: 0;
  width: 420px;
  height: 420px;
  border-radius: 28% 72% 63% 37% / 41% 46% 54% 59%;
  background: color-mix(in srgb, var(--el-color-primary) 14%, transparent);
  filter: blur(24px);
  pointer-events: none;
}

.ascii-page > * {
  position: relative;
  z-index: 1;
}

.ascii-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
}

.ascii-hero-copy {
  max-width: 720px;
}

.ascii-hero-title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: clamp(34px, 4.8vw, 52px);
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 0.96;
}

html.dark .ascii-page {
  background: radial-gradient(circle at top left, color-mix(in srgb, var(--el-color-primary) 14%, transparent) 0%, transparent 32%),
  radial-gradient(circle at top right, color-mix(in srgb, var(--el-color-warning) 14%, transparent) 0%, transparent 28%),
  var(--el-bg-color-page);
}

@media (max-width: 991px) {
  .ascii-page {
    padding-inline: 16px;
  }

  .ascii-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
