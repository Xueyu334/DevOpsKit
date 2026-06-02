<script setup>
import { parsePdmXml } from './utils/parse-pdm'

const parsedModel = ref(null)
const fileInfo = reactive({
  name: '',
  size: 0
})
const keyword = ref('')
const activeTab = ref('tables')
const selectedTableId = ref('')
const loading = ref(false)
const treeRef = ref(null)

const { copy } = useClipboard({ legacy: true })

const hasModel = computed(() => !!parsedModel.value)

const filteredTables = computed(() => {
  const tables = parsedModel.value?.tables || []
  const query = keyword.value.trim().toLowerCase()
  if (!query) return tables

  return tables.filter(table => {
    const tableMatched = [table.name, table.code, table.comment].some(value => value.toLowerCase().includes(query))
    const columnMatched = table.columns.some(column =>
      [column.name, column.code, column.dataType, column.comment].some(value => value.toLowerCase().includes(query))
    )
    return tableMatched || columnMatched
  })
})

const selectedTable = computed(() => {
  const tables = filteredTables.value
  if (!tables.length) return null
  return tables.find(table => table.id === selectedTableId.value) || tables[0]
})

const treeData = computed(() => {
  if (!parsedModel.value) return []

  const matchedTableIds = new Set(filteredTables.value.map(table => table.id))
  const groups = parsedModel.value.groups || []

  if (groups.length === 0) {
    return filteredTables.value.map(table => buildTableTreeNode(table))
  }

  return groups.map(group => buildGroupTreeNode(group, matchedTableIds)).filter(Boolean)
})

const expandedTreeKeys = computed(() => {
  const selectedId = selectedTable.value?.id
  if (!selectedId) return []

  const findPath = (nodes, path = []) => {
    for (const node of nodes) {
      if (node.type === 'table' && node.id === selectedId) return path
      if (node.type === 'group') {
        const matchedPath = findPath(node.children, [...path, node.id])
        if (matchedPath) return matchedPath
      }
    }
    return null
  }

  return findPath(treeData.value) || []
})

const treeRenderKey = computed(() => `${keyword.value.trim()}-${selectedTable.value?.id || ''}`)

const buildGroupTreeNode = (group, matchedTableIds) => {
  const children = group.children
    .map(child => {
      if (child.type === 'group') return buildGroupTreeNode(child, matchedTableIds)
      return matchedTableIds.has(child.id) ? buildTableTreeNode(child) : null
    })
    .filter(Boolean)

  if (children.length === 0) return null

  return {
    id: group.id,
    label: group.name,
    code: group.code,
    tableCount: children.reduce((count, child) => count + (child.type === 'table' ? 1 : child.tableCount || 0), 0),
    type: 'group',
    children
  }
}

const buildTableTreeNode = table => ({
  id: table.id,
  label: table.name,
  code: table.code,
  columnCount: table.columnCount || table.columns?.length || 0,
  type: 'table',
  tableId: table.id
})

const buildTableMarkdown = table => {
  if (!table) return ''

  const lines = [`# ${table.name} (${table.code})`, '']
  if (table.comment) lines.push(table.comment, '')
  lines.push('| 字段名 | 字段代码 | 类型 | 长度 | 必填 | 主键 | 备注 |')
  lines.push('| --- | --- | --- | --- | --- | --- | --- |')
  table.columns.forEach(column => {
    lines.push(
      `| ${escapeMarkdownCell(column.name)} | ${escapeMarkdownCell(column.code)} | ${escapeMarkdownCell(column.dataType)} | ${escapeMarkdownCell(column.length)} | ${column.mandatory ? '是' : '否'} | ${column.primaryKey ? '是' : '否'} | ${escapeMarkdownCell(column.comment)} |`
    )
  })
  return lines.join('\n')
}

const selectedTableMarkdownOutput = computed(() => buildTableMarkdown(selectedTable.value))

const selectedTableJsonOutput = computed(() =>
  selectedTable.value ? JSON.stringify(selectedTable.value, null, 2) : ''
)

const markdownOutput = computed(() => {
  if (!parsedModel.value) return ''

  const lines = [`# ${parsedModel.value.meta.name}`, '']
  if (parsedModel.value.meta.comment) {
    lines.push(parsedModel.value.meta.comment, '')
  }

  parsedModel.value.tables.forEach(table => {
    lines.push(buildTableMarkdown(table), '')
  })

  return lines.join('\n')
})

const jsonOutput = computed(() => (parsedModel.value ? JSON.stringify(parsedModel.value, null, 2) : ''))

const tableColumns = [
  { prop: 'name', label: '字段名', minWidth: 150 },
  { prop: 'code', label: '字段代码', minWidth: 150 },
  { prop: 'dataType', label: '类型', minWidth: 140 },
  { prop: 'length', label: '长度', width: 90 },
  { prop: 'precision', label: '精度', width: 90 },
  { prop: 'comment', label: '备注', minWidth: 180 }
]

watch(filteredTables, tables => {
  if (!tables.length) {
    selectedTableId.value = ''
    return
  }

  if (!tables.some(table => table.id === selectedTableId.value)) {
    selectedTableId.value = tables[0].id
  }
})

watch(selectedTable, table => {
  if (!table) return
  nextTick(() => {
    treeRef.value?.setCurrentKey(table.id)
  })
})

const handleFileChange = uploadFile => {
  const file = uploadFile.raw
  if (!file) return

  if (!file.name.toLowerCase().endsWith('.pdm') && !file.name.toLowerCase().endsWith('.xml')) {
    ElMessage.error('请选择 .pdm 或 .xml 文件')
    return
  }

  loading.value = true
  const reader = new FileReader()
  reader.onload = event => {
    try {
      const result = parsePdmXml(event.target.result)
      parsedModel.value = result
      fileInfo.name = file.name
      fileInfo.size = file.size
      selectedTableId.value = result.tables[0]?.id || ''
      activeTab.value = 'tables'
      ElMessage.success(`解析完成，共 ${result.meta.tableCount} 张表`)
    } catch (error) {
      parsedModel.value = null
      selectedTableId.value = ''
      ElMessage.error(error.message || 'PDM 解析失败')
    } finally {
      loading.value = false
    }
  }
  reader.onerror = () => {
    loading.value = false
    ElMessage.error('文件读取失败')
  }
  reader.readAsText(file)
}

const clearAll = () => {
  parsedModel.value = null
  fileInfo.name = ''
  fileInfo.size = 0
  keyword.value = ''
  selectedTableId.value = ''
}

const handleTreeNodeClick = data => {
  if (data.type === 'table' && data.tableId) {
    selectedTableId.value = data.tableId
  }
}

const copyOutput = async output => {
  if (!output) return
  try {
    await copy(output)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

const downloadOutput = (content, extension, baseName = fileInfo.name || 'pdm-schema') => {
  if (!content) return
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${sanitizeFileName(baseName)}.${extension}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

const formatSize = bytes => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`
}

const escapeMarkdownCell = value =>
  String(value || '')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ')

const sanitizeFileName = value =>
  String(value || 'pdm-schema')
    .replace(/\.(pdm|xml)$/i, '')
    .replace(/[\\/:*?"<>|]/g, '_')
</script>

<template>
  <div class="pdm-parser-container">
    <div class="page-header">
      <div class="page-heading">
        <h1 class="page-title">PDM 在线解析</h1>
        <el-tag class="page-desc" effect="plain" type="info">本地解析 .pdm，导出表结构文档</el-tag>
      </div>
      <el-button :disabled="!hasModel" plain type="info" @click="clearAll">清空</el-button>
    </div>

    <el-row :gutter="12">
      <el-col :lg="5" :md="6" :xs="24">
        <el-card v-loading="loading" class="upload-card">
          <template #header>
            <div class="card-header">
              <span>上传 PDM 文件</span>
              <el-tag effect="light" type="success">本地解析</el-tag>
            </div>
          </template>

          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            accept=".pdm,.xml"
            action="#"
            drag
            @change="handleFileChange"
          >
            <el-icon class="el-icon--upload">
              <IconEpUploadFilled />
            </el-icon>
            <div class="el-upload__text">拖拽 .pdm 文件到此处，或 <em>点击上传</em></div>
            <template #tip>
              <div class="upload-tip">文件不会上传到服务器，解析过程仅在浏览器中完成。</div>
            </template>
          </el-upload>

          <el-descriptions v-if="hasModel" :column="1" border class="model-info" size="small">
            <el-descriptions-item label="文件名">{{ fileInfo.name }}</el-descriptions-item>
            <el-descriptions-item label="文件大小">{{ formatSize(fileInfo.size) }}</el-descriptions-item>
            <el-descriptions-item label="模型名">{{ parsedModel.meta.name }}</el-descriptions-item>
            <el-descriptions-item label="模型代码">{{ parsedModel.meta.code || '-' }}</el-descriptions-item>
            <el-descriptions-item label="表数量">{{ parsedModel.meta.tableCount }}</el-descriptions-item>
            <el-descriptions-item label="关系数量">{{ parsedModel.meta.relationCount }}</el-descriptions-item>
          </el-descriptions>

          <el-alert
            :closable="false"
            class="compat-alert"
            show-icon
            title="首版优先支持 PowerDesigner XML 格式 PDM；压缩或二进制 PDM 需要先另存为 XML。"
            type="info"
          />
        </el-card>
      </el-col>

      <el-col :lg="19" :md="18" :xs="24">
        <el-card class="result-card">
          <template #header>
            <div class="card-header result-header">
              <span>解析结果</span>
              <el-input
                v-model="keyword"
                :disabled="!hasModel"
                class="search-input"
                clearable
                placeholder="搜索表名、字段名、类型、备注"
              >
                <template #prefix>
                  <el-icon>
                    <IconEpSearch />
                  </el-icon>
                </template>
              </el-input>
            </div>
          </template>

          <el-empty v-if="!hasModel" description="上传 PDM 文件后查看解析结果" />

          <el-tabs v-else v-model="activeTab">
            <el-tab-pane label="表结构" name="tables">
              <el-row :gutter="16">
                <el-col :md="7" :xs="24">
                  <el-scrollbar class="table-list" height="520px">
                    <el-tree
                      v-if="filteredTables.length > 0"
                      :key="treeRenderKey"
                      ref="treeRef"
                      :current-node-key="selectedTable?.id"
                      :data="treeData"
                      :default-expanded-keys="expandedTreeKeys"
                      class="schema-tree"
                      highlight-current
                      node-key="id"
                      @node-click="handleTreeNodeClick"
                    >
                      <template #default="{ data }">
                        <div :class="['tree-node', `tree-node--${data.type}`]">
                          <span class="tree-node-title">{{ data.label }}</span>
                          <span v-if="data.tableCount || data.columnCount" class="tree-node-meta">
                            {{ data.type === 'group' ? `${data.tableCount} 表` : `${data.columnCount} 字段` }}
                          </span>
                        </div>
                      </template>
                    </el-tree>
                    <el-empty v-if="filteredTables.length === 0" description="无匹配表" />
                  </el-scrollbar>
                </el-col>

                <el-col :md="17" :xs="24">
                  <div v-if="selectedTable" class="table-detail">
                    <div class="detail-title">
                      <div>
                        <h2>{{ selectedTable.name }}</h2>
                        <p>{{ selectedTable.code }}</p>
                      </div>
                      <div class="table-actions">
                        <el-button-group>
                          <el-button size="small" @click="copyOutput(selectedTableMarkdownOutput)"
                            >复制 Markdown</el-button
                          >
                          <el-button
                            size="small"
                            @click="downloadOutput(selectedTableMarkdownOutput, 'md', selectedTable.code)"
                          >
                            下载 Markdown
                          </el-button>
                          <el-button size="small" @click="copyOutput(selectedTableJsonOutput)">复制 JSON</el-button>
                          <el-button
                            size="small"
                            @click="downloadOutput(selectedTableJsonOutput, 'json', selectedTable.code)"
                          >
                            下载 JSON
                          </el-button>
                        </el-button-group>
                        <el-tag>{{ selectedTable.columns.length }} 字段</el-tag>
                      </div>
                    </div>
                    <p v-if="selectedTable.comment" class="table-comment">{{ selectedTable.comment }}</p>

                    <el-table :data="selectedTable.columns" border height="440" size="small">
                      <el-table-column
                        v-for="column in tableColumns"
                        :key="column.prop"
                        :label="column.label"
                        :min-width="column.minWidth"
                        :prop="column.prop"
                        :width="column.width"
                        show-overflow-tooltip
                      />
                      <el-table-column fixed="right" label="约束" width="120">
                        <template #default="{ row }">
                          <el-tag v-if="row.primaryKey" size="small" type="danger">PK</el-tag>
                          <el-tag v-if="row.mandatory" class="ml-1" size="small" type="warning">必填</el-tag>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </el-col>
              </el-row>
            </el-tab-pane>

            <el-tab-pane label="Markdown" name="markdown">
              <div class="output-actions">
                <el-button size="small" type="primary" @click="copyOutput(markdownOutput)">复制 Markdown</el-button>
                <el-button size="small" @click="downloadOutput(markdownOutput, 'md')">下载 Markdown</el-button>
              </div>
              <el-input :model-value="markdownOutput" :rows="22" class="output-textarea" readonly type="textarea" />
            </el-tab-pane>

            <el-tab-pane label="JSON" name="json">
              <div class="output-actions">
                <el-button size="small" type="primary" @click="copyOutput(jsonOutput)">复制 JSON</el-button>
                <el-button size="small" @click="downloadOutput(jsonOutput, 'json')">下载 JSON</el-button>
              </div>
              <el-input :model-value="jsonOutput" :rows="22" class="output-textarea" readonly type="textarea" />
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.pdm-parser-container {
  width: 100%;
  max-width: 1760px;
  margin: 8px auto;
  padding: 0 20px 24px;
  box-sizing: border-box;
}

.page-header,
.card-header,
.result-header,
.detail-title,
.output-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.page-header {
  margin-bottom: 8px;
  padding: 0 2px;
}

.page-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.page-title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 20px;
  line-height: 1.2;
}

.page-desc {
  flex-shrink: 0;
}

.upload-card,
.result-card {
  min-width: 0;
  min-height: 640px;
}

.result-card :deep(.el-card__body) {
  min-width: 0;
  overflow: hidden;
}

.upload-card :deep(.el-card__body) {
  padding: 12px;
}

.upload-card :deep(.el-upload-dragger) {
  min-height: 112px;
  padding: 14px 10px;
}

.upload-card :deep(.el-icon--upload) {
  margin-bottom: 4px;
  font-size: 34px;
}

.upload-card :deep(.el-upload__text) {
  font-size: 13px;
  line-height: 1.4;
}

.upload-tip {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.model-info,
.compat-alert {
  margin-top: 10px;
}

.model-info :deep(.el-descriptions__label) {
  width: 72px;
}

.model-info :deep(.el-descriptions__content) {
  max-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-input {
  max-width: 340px;
}

.table-list {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.table-comment,
.detail-title p {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.schema-tree {
  padding: 8px 4px;
}

.tree-node {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  overflow: hidden;
}

.tree-node-title,
.tree-node-meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-node-title {
  min-width: 0;
  color: var(--el-text-color-primary);
}

.tree-node-meta {
  flex-shrink: 0;
  max-width: 120px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.tree-node--table .tree-node-title {
  font-weight: 600;
}

.tree-node--group .tree-node-title {
  font-weight: 600;
}

.tree-node--group .tree-node-meta {
  color: var(--el-color-primary);
}

.detail-title {
  margin-bottom: 8px;
}

.table-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.table-detail {
  min-width: 0;
  overflow: hidden;
}

.detail-title h2 {
  margin: 0;
  font-size: 20px;
}

.detail-title p {
  margin: 4px 0 0;
}

.table-comment {
  margin: 0 0 12px;
  padding: 8px 10px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
}

.ml-1 {
  margin-left: 4px;
}

.output-actions {
  justify-content: flex-end;
  margin-bottom: 10px;
}

.output-textarea {
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
}

@media (max-width: 992px) {
  .page-header,
  .result-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .page-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .search-input {
    max-width: 100%;
  }

  .upload-card,
  .result-card {
    min-height: auto;
    margin-bottom: 16px;
  }

  .detail-title {
    align-items: flex-start;
    flex-direction: column;
  }

  .table-actions {
    justify-content: flex-start;
  }
}
</style>
