<script setup>
import { computed } from 'vue'

const props = defineProps({
  activeCode: {
    type: Number,
    required: true
  },
  highlightedCodes: {
    type: Array,
    required: true
  },
  rows: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['select'])

const highlightedCodeSet = computed(() => new Set(props.highlightedCodes))

const getCellClass = item => ({
  'ascii-cell': true,
  'ascii-cell--active': item.dec === props.activeCode,
  'ascii-cell--match': highlightedCodeSet.value.has(item.dec)
})

const handleSelect = code => {
  emit('select', code)
}
</script>

<template>
  <div class="matrix-shell">
    <div class="matrix-header">
      <div>
        <h2 class="matrix-title">完整 0-127 ASCII 对照表</h2>
      </div>
      <p class="matrix-tip">点击任意字符即可联动上方焦点，快速完成 ASCII 对照定位。</p>
    </div>

    <div class="matrix-table-wrap">
      <table class="ascii-table">
        <thead>
          <tr>
            <template v-for="blockStart in [0, 32, 64, 96]" :key="blockStart">
              <th class="ascii-header ascii-header--value">ASCII值</th>
              <th class="ascii-header ascii-header--label">
                {{ blockStart < 32 ? '控制字符' : '字符 / 含义' }}
              </th>
            </template>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.rowIndex">
            <template v-for="item in row.cells" :key="item.dec">
              <td class="ascii-value-cell">{{ item.dec }}</td>
              <td class="ascii-label-cell">
                <button :class="getCellClass(item)" type="button" @click="handleSelect(item.dec)">
                  <span class="ascii-cell-main">{{ item.displayLabel }}</span>
                  <span class="ascii-cell-meta">{{ item.hex }}</span>
                </button>
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.matrix-shell {
  padding: 22px 20px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 10%, var(--el-border-color-light));
  border-radius: 26px;
  background: var(--el-bg-color);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.06);
}

.matrix-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.matrix-title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 24px;
  font-weight: 700;
}

.matrix-tip {
  max-width: 420px;
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
  text-align: right;
}

.matrix-table-wrap {
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 20px;
}

.ascii-table {
  width: 100%;
  min-width: 980px;
  border-collapse: separate;
  border-spacing: 0;
  background: var(--el-bg-color);
}

.ascii-header,
.ascii-value-cell,
.ascii-label-cell {
  border-right: 1px solid var(--el-border-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.ascii-header:last-child,
.ascii-label-cell:last-child {
  border-right: 0;
}

.ascii-header {
  padding: 12px 10px;
  background: color-mix(in srgb, var(--el-fill-color-light) 72%, white);
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 700;
  text-align: left;
}

.ascii-header--value {
  width: 84px;
}

.ascii-header--label {
  width: 180px;
}

.ascii-value-cell {
  padding: 12px 10px;
  color: var(--el-text-color-regular);
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  white-space: nowrap;
}

.ascii-label-cell {
  padding: 0;
}

.ascii-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  background: transparent;
  color: var(--el-text-color-primary);
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
}

.ascii-cell:hover {
  background: color-mix(in srgb, var(--el-color-primary) 8%, white);
}

.ascii-cell--match {
  background: color-mix(in srgb, var(--el-color-warning) 14%, white);
}

.ascii-cell--active {
  background: linear-gradient(135deg, color-mix(in srgb, var(--el-color-primary) 18%, white), transparent);
  box-shadow: inset 3px 0 0 var(--el-color-primary);
}

.ascii-cell-main {
  font-size: 14px;
  font-weight: 600;
}

.ascii-cell-meta {
  color: var(--el-text-color-secondary);
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
}

html.dark .matrix-shell {
  border-color: color-mix(in srgb, var(--el-color-primary) 18%, var(--el-border-color));
  background: var(--el-bg-color-overlay);
  box-shadow: 0 24px 60px rgba(2, 6, 23, 0.34);
}

html.dark .matrix-table-wrap {
  border-color: var(--el-border-color);
}

html.dark .ascii-header {
  background: color-mix(in srgb, var(--el-fill-color) 90%, #0f172a);
}

html.dark .ascii-cell:hover {
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

html.dark .ascii-cell--match {
  background: color-mix(in srgb, var(--el-color-warning) 20%, transparent);
}
</style>
