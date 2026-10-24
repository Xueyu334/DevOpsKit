<script setup>
const props = defineProps({
  pattern: { type: Object, default: null },
  busy: Boolean,
  stale: Boolean
})
const visible = defineModel({ type: Boolean, default: false })
defineEmits(['export-csv'])
const sortBy = ref('count')
const materials = computed(() => {
  const rows = props.pattern?.materials || []
  return sortBy.value === 'code' ? [...rows].sort((a, b) => a.code.localeCompare(b.code)) : rows
})
</script>

<template>
  <el-dialog v-model="visible" title="配色与用料清单" width="min(720px, calc(100vw - 32px))" top="10vh" append-to-body>
    <template #header>
      <div class="card-heading">
        <span>配色与用料清单</span>
        <el-radio-group v-model="sortBy" size="small">
          <el-radio-button value="count">按用量</el-radio-button>
          <el-radio-button value="code">按色号</el-radio-button>
        </el-radio-group>
      </div>
    </template>
    <el-alert
      v-if="busy || stale"
      class="update-note"
      :title="busy ? '正在更新用料清单，完成后可导出。' : '用料清单尚未更新，请调整参数重试。'"
      :type="busy ? 'info' : 'warning'"
      :closable="false"
    />
    <p class="palette-note">ARTKAL S 5mm · S01–S64 参考色卡。屏幕色块仅供预览，购买前请核对实物色卡。</p>
    <el-table
      v-if="pattern"
      :data="materials"
      max-height="min(50dvh, 420px)"
      empty-text="没有需要摆放的豆子（图片为透明区域）"
      stripe
    >
      <el-table-column label="颜色" width="64">
        <template #default="{ row }"><span class="color-swatch" :style="{ backgroundColor: row.hex }" /></template>
      </el-table-column>
      <el-table-column prop="code" label="色号" width="80" />
      <el-table-column prop="name" label="名称" min-width="100" />
      <el-table-column prop="hex" label="参考 HEX" min-width="105" />
      <el-table-column prop="count" label="数量（颗）" min-width="100" align="right" />
    </el-table>
    <el-empty v-else :image-size="60" description="生成后显示各色用豆数量" />
    <template #footer>
      <div class="dialog-footer">
        <span v-if="pattern" class="materials-summary">
          {{ pattern.materials.length }} 色 · {{ pattern.total.toLocaleString() }} 颗豆
        </span>
        <el-button @click="visible = false">关闭</el-button>
        <el-button type="primary" :disabled="!pattern || busy || stale" @click="$emit('export-csv')">
          导出用料 CSV
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.update-note {
  margin-bottom: 14px;
}
.dialog-footer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.dialog-footer .el-button + .el-button {
  margin-left: 0;
}
.materials-summary {
  margin-right: auto;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.palette-note {
  font-size: 12px;
  line-height: 1.8;
  color: var(--el-text-color-secondary);
  margin: 0 0 14px;
}
.color-swatch {
  display: block;
  width: 24px;
  height: 24px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}
</style>
