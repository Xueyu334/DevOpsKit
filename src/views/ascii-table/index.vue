<script setup>
import AsciiLookupPanel from './components/AsciiLookupPanel.vue'
import AsciiMatrix from './components/AsciiMatrix.vue'
import { useAsciiLookup } from './composables/useAsciiLookup'

const { activeCode, featuredItem, hasQuery, highlightedCodes, matchedItems, query, selectCode, tableRows } =
  useAsciiLookup()
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
  margin: 10px auto;
  position: relative;
  min-height: 100%;
  padding: 10px 24px 28px;
  background-color: var(--el-bg-color-page);
}

.ascii-page > * {
  position: relative;
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
  font-size: clamp(24px, 3.5vw, 32px);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}
</style>
