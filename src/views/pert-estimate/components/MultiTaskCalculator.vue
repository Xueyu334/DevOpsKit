<template>
  <div class="multi-task-calculator">
    <!-- 头部工具介绍与全局配置面板 -->
    <el-card class="header-card" shadow="hover">
      <div class="header-content">
        <div class="header-title-box">
          <div class="title-row">
            <h2 class="main-title">多任务项目评估 (PERT WBS)</h2>
            <el-tag type="primary" effect="dark" round>Beta & 三角分布</el-tag>
            <el-tag type="success" effect="plain" round>方差合成法则</el-tag>
          </div>
          <p class="subtitle">
            结合 PERT（Program Evaluation and Review Technique）进行工时与工作量估算。输入乐观值 (O)、最可能值
            (M)、悲观值 (P)，科学计算期望值 T<sub>e</sub>、衡量风险敞口的标准差 &sigma; 与用于多任务串联汇总的方差 V。
          </p>
        </div>

        <div class="global-settings-box">
          <div class="setting-item">
            <span class="setting-label">工作量单位:</span>
            <el-select v-model="currentUnit" size="default" style="width: 120px">
              <el-option label="人天 (d)" value="人天 (d)" />
              <el-option label="人时 (h)" value="人时 (h)" />
              <el-option label="故事点 (SP)" value="故事点 (SP)" />
              <el-option label="天" value="天" />
              <el-option label="小时" value="小时" />
            </el-select>
          </div>

          <div class="setting-item">
            <span class="setting-label">计算精度:</span>
            <el-select v-model="currentPrecision" size="default" style="width: 90px">
              <el-option label="1 位" :value="1" />
              <el-option label="2 位" :value="2" />
              <el-option label="3 位" :value="3" />
            </el-select>
          </div>

          <div class="setting-item">
            <span class="setting-label">全局 M 权重模式:</span>
            <el-select v-model="defaultWeightMode" size="default" style="width: 190px">
              <el-option label="经典 PERT (加权 4x)" value="beta" />
              <el-option label="算术平均 (三角分布 1x)" value="triangular" />
              <el-option label="自定义 M 权重" value="custom" />
            </el-select>
          </div>

          <div v-if="defaultWeightMode === 'custom'" class="setting-item">
            <span class="setting-label">自定义倍数:</span>
            <el-input-number
              v-model="defaultCustomWeight"
              :min="1"
              :max="10"
              size="default"
              style="width: 90px"
              controls-position="right"
            />
          </div>
        </div>
      </div>
    </el-card>

    <!-- 顶部核心指标 KPI 看板 -->
    <el-row :gutter="16" class="kpi-row">
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="kpi-card total-tasks" shadow="hover">
          <div class="kpi-icon-wrap">
            <el-icon><Tickets /></el-icon>
          </div>
          <div class="kpi-info">
            <div class="kpi-label">有效任务数 / 总任务</div>
            <div class="kpi-value font-mono">
              {{ aggregate.validCount }} <span class="sub-num">/ {{ aggregate.totalCount }}</span>
            </div>
            <div class="kpi-tag-row">
              <el-tag size="small" type="success" v-if="aggregate.highRiskCount.low > 0"
                >低 {{ aggregate.highRiskCount.low }}</el-tag
              >
              <el-tag size="small" type="warning" v-if="aggregate.highRiskCount.medium > 0"
                >中 {{ aggregate.highRiskCount.medium }}</el-tag
              >
              <el-tag size="small" type="danger" v-if="aggregate.highRiskCount.high > 0"
                >高 {{ aggregate.highRiskCount.high }}</el-tag
              >
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="kpi-card total-te" shadow="hover">
          <div class="kpi-icon-wrap">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="kpi-info">
            <div class="kpi-label">汇总期望总工作量 (T<sub>total</sub>)</div>
            <div class="kpi-value font-mono highlight">
              {{ formatNum(aggregate.totalTe, currentPrecision) }}
              <span class="kpi-unit">{{ currentUnit }}</span>
            </div>
            <div class="kpi-sub-text">公式: &sum; T<sub>e, i</sub></div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="kpi-card total-sd" shadow="hover">
          <div class="kpi-icon-wrap">
            <el-icon><Histogram /></el-icon>
          </div>
          <div class="kpi-info">
            <div class="kpi-label">
              汇总标准差 (&sigma;<sub>total</sub>)
              <el-tooltip content="多任务合成标准差：由各任务方差累加后开平方获得" placement="top">
                <el-icon class="help-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
            <div class="kpi-value font-mono warning">
              {{ formatNum(aggregate.totalSd, currentPrecision) }}
              <span class="kpi-unit">{{ currentUnit }}</span>
            </div>
            <div class="kpi-sub-text">&radic;&sum;V 变异度: {{ formatNum(aggregate.overallCv, 1) }}%</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="kpi-card total-variance" shadow="hover">
          <div class="kpi-icon-wrap">
            <el-icon><Operation /></el-icon>
          </div>
          <div class="kpi-info">
            <div class="kpi-label">
              汇总总方差 (V<sub>total</sub>)
              <el-tooltip content="多任务方差可直接相加：V_total = sum(V_i)" placement="top">
                <el-icon class="help-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
            <div class="kpi-value font-mono info">
              {{ formatNum(aggregate.totalVariance, currentPrecision) }}
              <span class="kpi-unit">{{ currentUnit }}²</span>
            </div>
            <div class="kpi-sub-text">
              直接相加&sum;&sigma;比对: {{ formatNum(aggregate.directSdSum, currentPrecision) }}
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 表格操作工具栏 -->
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="addTask"> 添加任务 </el-button>
        <el-dropdown @command="loadDemo">
          <el-button>
            <el-icon><DocumentAdd /></el-icon>
            加载示例项目
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="(item, idx) in demoProjectCases" :key="idx" :command="idx">
                {{ item.name }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-popconfirm
          title="确定要清空所有任务吗？清空后不可恢复"
          confirm-button-text="清空"
          cancel-button-text="取消"
          confirm-button-type="danger"
          :icon="WarningFilled"
          icon-color="#f56c6c"
          :width="220"
          :disabled="tasks.length === 0"
          @confirm="clearAllTasks"
        >
          <template #reference>
            <el-button type="danger" plain :icon="Delete" :disabled="tasks.length === 0"> 清空 </el-button>
          </template>
        </el-popconfirm>
      </div>

      <div class="toolbar-right">
        <el-button :icon="CopyDocument" @click="copyMarkdownTable"> 复制 Markdown 表格 </el-button>
        <el-button :icon="Download" @click="exportCsv"> 导出 CSV </el-button>
        <el-button type="success" plain :icon="DocumentCopy" @click="copyFullReport"> 复制评估总结报告 </el-button>
      </div>
    </div>

    <!-- 多任务可编辑数据表格 -->
    <el-table :data="aggregate.computedTasks" border stripe class="tasks-table" row-key="id" style="width: 100%">
      <el-table-column label="#" width="50" align="center">
        <template #default="{ $index }">
          <span class="row-index">{{ $index + 1 }}</span>
        </template>
      </el-table-column>

      <el-table-column label="任务事项名称 / 描述" min-width="220">
        <template #default="{ row }">
          <el-input
            v-model="row.name"
            placeholder="输入任务名称"
            clearable
            @input="val => handleTaskFieldChange(row, 'name', val)"
          />
        </template>
      </el-table-column>

      <el-table-column label="乐观工时 (O)" width="140" align="center">
        <template #header>
          <div class="col-header-with-tip">
            <span>乐观 (O)</span>
            <el-tooltip content="一切顺利、无任何意外阻碍时的最短可能耗时" placement="top">
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <div class="column-unit">{{ currentUnit }}</div>
        </template>
        <template #default="{ row }">
          <el-input-number
            v-model="row.o"
            :value-on-clear="0"
            :min="0"
            :step="0.5"
            :precision="currentPrecision"
            controls-position="right"
            style="width: 100%"
            @change="val => handleTaskFieldChange(row, 'o', val)"
          />
        </template>
      </el-table-column>

      <el-table-column label="最可能工时 (M)" width="140" align="center">
        <template #header>
          <div class="col-header-with-tip">
            <span>最可能 (M)</span>
            <el-tooltip content="正常工作节奏、按常规实际情况出现频率最高的耗时" placement="top">
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <div class="column-unit">{{ currentUnit }}</div>
        </template>
        <template #default="{ row }">
          <el-input-number
            v-model="row.m"
            :value-on-clear="0"
            :min="0"
            :step="0.5"
            :precision="currentPrecision"
            controls-position="right"
            style="width: 100%"
            @change="val => handleTaskFieldChange(row, 'm', val)"
          />
        </template>
      </el-table-column>

      <el-table-column label="悲观工时 (P)" width="140" align="center">
        <template #header>
          <div class="col-header-with-tip">
            <span>悲观 (P)</span>
            <el-tooltip content="遭遇各种困难、技术阻塞等最坏情况下的耗时" placement="top">
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <div class="column-unit">{{ currentUnit }}</div>
        </template>
        <template #default="{ row }">
          <el-input-number
            v-model="row.p"
            :value-on-clear="0"
            :min="0"
            :step="0.5"
            :precision="currentPrecision"
            controls-position="right"
            style="width: 100%"
            @change="val => handleTaskFieldChange(row, 'p', val)"
          />
        </template>
      </el-table-column>

      <el-table-column label="期望工时 (Te)" width="130" align="center">
        <template #header>
          <div class="col-header-with-tip">
            <span class="highlight-header">期望 (Te)</span>
            <el-tooltip content="综合 O、M、P 与权重计算出的期望完成工时" placement="top">
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <div class="column-unit">{{ currentUnit }}</div>
        </template>
        <template #default="{ row }">
          <span class="calc-text te-text font-mono">
            {{ formatNum(row.te, currentPrecision) }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="标准差 (σ)" width="115" align="center">
        <template #header>
          <div class="col-header-with-tip">
            <span>标准差 (&sigma;)</span>
            <el-tooltip content="&sigma; = (P - O) / 6，衡量单任务不确定性风险敞口" placement="top">
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <div class="column-unit">{{ currentUnit }}</div>
        </template>
        <template #default="{ row }">
          <span class="calc-text sd-text font-mono">
            {{ formatNum(row.sd, currentPrecision) }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="方差 (V)" width="115" align="center">
        <template #header>
          <div class="col-header-with-tip">
            <span>方差 (V)</span>
            <el-tooltip content="V = &sigma;²，多任务汇总时不能加标准差，必须相加方差！" placement="top">
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <div class="column-unit">{{ currentUnit }}²</div>
        </template>
        <template #default="{ row }">
          <span class="calc-text var-text font-mono">
            {{ formatNum(row.variance, currentPrecision) }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="风险评估" width="110" align="center">
        <template #default="{ row }">
          <template v-if="row.isValid && row.isValuesEntered">
            <el-tooltip :content="`${row.riskDescription} (变异系数 CV: ${formatNum(row.cv, 1)}%)`" placement="top">
              <el-tag :type="row.riskTagType" size="small" round>
                {{ row.riskLabel }}
              </el-tag>
            </el-tooltip>
          </template>
          <template v-else-if="!row.isValid">
            <el-tooltip :content="row.validationMessage" placement="top">
              <el-tag type="danger" size="small" effect="dark"> 数值异常 </el-tag>
            </el-tooltip>
          </template>
          <template v-else>
            <el-tag type="info" size="small" effect="plain">-</el-tag>
          </template>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="150" align="center" fixed="right">
        <template #default="{ $index }">
          <div class="row-actions">
            <el-tooltip content="复制任务" placement="top">
              <el-button link type="primary" :icon="CopyDocument" @click="duplicateTask($index)" />
            </el-tooltip>
            <el-tooltip content="上移" placement="top">
              <el-button link :icon="Top" :disabled="$index === 0" @click="moveTask($index, -1)" />
            </el-tooltip>
            <el-tooltip content="下移" placement="top">
              <el-button link :icon="Bottom" :disabled="$index === tasks.length - 1" @click="moveTask($index, 1)" />
            </el-tooltip>
            <el-tooltip content="删除任务" placement="top">
              <el-button link type="danger" :icon="Delete" @click="removeTask($index)" />
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <TaskEstimateCharts :aggregate="aggregate" :unit="currentUnit" :precision="currentPrecision" />

    <!-- 多任务串联置信区间与承诺概率预测看板 -->
    <ConfidenceIntervalCard :aggregate="aggregate" :unit="currentUnit" :precision="currentPrecision" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  Tickets,
  TrendCharts,
  Histogram,
  Operation,
  Plus,
  Delete,
  CopyDocument,
  Download,
  DocumentCopy,
  DocumentAdd,
  ArrowDown,
  Top,
  Bottom,
  QuestionFilled,
  WarningFilled
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ConfidenceIntervalCard from './ConfidenceIntervalCard.vue'
import TaskEstimateCharts from './TaskEstimateCharts.vue'
import { calculateAggregate, formatNum, demoProjectCases } from '../utils/pert'

const props = defineProps({
  unit: {
    type: String,
    default: '人天 (d)'
  },
  precision: {
    type: Number,
    default: 2
  }
})

const emit = defineEmits(['update:unit', 'update:precision'])

const currentUnit = computed({
  get: () => props.unit,
  set: val => emit('update:unit', val)
})

const currentPrecision = computed({
  get: () => props.precision,
  set: val => emit('update:precision', val)
})

const defaultWeightMode = ref('beta')
const defaultCustomWeight = ref(4)

// 初始默认任务列表（载入第一个经典案例）
let nextId = 10
const tasks = ref(JSON.parse(JSON.stringify(demoProjectCases[0].tasks)))

// 输入不允许是空，如果输入是空或被清空则置为 0
watch(
  tasks,
  newTasks => {
    newTasks.forEach(row => {
      if (row.o === null || row.o === undefined || row.o === '') {
        row.o = 0
      }
      if (row.m === null || row.m === undefined || row.m === '') {
        row.m = 0
      }
      if (row.p === null || row.p === undefined || row.p === '') {
        row.p = 0
      }
    })
  },
  { deep: true }
)

const globalOptions = computed(() => ({
  defaultWeightMode: defaultWeightMode.value,
  defaultCustomWeight: defaultCustomWeight.value
}))

// 多任务汇总计算结果
const aggregate = computed(() => {
  return calculateAggregate(tasks.value, globalOptions.value)
})

// 同步修改原始 tasks 数据，确保双向绑定和响应式重新计算正常触发
const handleTaskFieldChange = (row, field, val) => {
  const target = tasks.value.find(t => t.id === row.id)
  if (target) {
    target[field] = val ?? (field === 'name' ? '' : 0)
  }
}

// 添加任务
const addTask = () => {
  tasks.value.push({
    id: nextId++,
    name: `新增任务事项 #${tasks.value.length + 1}`,
    o: 1,
    m: 2,
    p: 4
  })
  ElMessage.success('已添加新任务')
}

// 复制任务
const duplicateTask = index => {
  const target = tasks.value[index]
  tasks.value.splice(index + 1, 0, {
    ...JSON.parse(JSON.stringify(target)),
    id: nextId++,
    name: `${target.name} (副本)`
  })
  ElMessage.success('已复制任务')
}

// 移动任务
const moveTask = (index, delta) => {
  const newIndex = index + delta
  if (newIndex < 0 || newIndex >= tasks.value.length) return
  const item = tasks.value.splice(index, 1)[0]
  tasks.value.splice(newIndex, 0, item)
}

// 删除任务
const removeTask = index => {
  tasks.value.splice(index, 1)
  ElMessage.info('已移除任务')
}

// 清空所有任务
const clearAllTasks = () => {
  tasks.value = []
  ElMessage.success('已清空任务列表')
}

// 加载示例数据集
const loadDemo = async caseIdx => {
  const selectedCase = demoProjectCases[caseIdx]
  if (!selectedCase) return

  try {
    await ElMessageBox.confirm(
      `加载“${selectedCase.name}”将覆盖当前所有任务数据，覆盖后不可恢复。是否继续？`,
      '确认加载示例项目',
      {
        confirmButtonText: '覆盖并加载',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  tasks.value = JSON.parse(JSON.stringify(selectedCase.tasks))
  ElMessage.success(`已载入示例项目：${selectedCase.name}`)
}

// 复制 Markdown 表格
const copyMarkdownTable = () => {
  const rows = aggregate.value.computedTasks
  if (!rows || rows.length === 0) {
    ElMessage.warning('暂无任务可导出')
    return
  }

  let md = `### PERT 工作量评估清单\n\n`
  md += `| 序号 | 任务名称 | 乐观工时 (O) | 最可能工时 (M) | 悲观工时 (P) | 期望工时 (Te) | 标准差 (σ) | 方差 (V) | 风险等级 |\n`
  md += `| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`

  rows.forEach((r, idx) => {
    md += `| ${idx + 1} | ${r.name || '未命名任务'} | ${formatNum(r.o, currentPrecision.value)} | ${formatNum(r.m, currentPrecision.value)} | ${formatNum(r.p, currentPrecision.value)} | ${formatNum(r.te, currentPrecision.value)} | ${formatNum(r.sd, currentPrecision.value)} | ${formatNum(r.variance, currentPrecision.value)} | ${r.riskLabel || '-'} |\n`
  })

  md += `\n**汇总统计 (${currentUnit.value})**：\n`
  md += `- 任务总数：${aggregate.value.validCount} 个有效任务\n`
  md += `- 期望总工时 (Te Total)：${formatNum(aggregate.value.totalTe, currentPrecision.value)} ${currentUnit.value}\n`
  md += `- 汇总标准差 (σ Total = √∑V)：${formatNum(aggregate.value.totalSd, currentPrecision.value)} ${currentUnit.value}\n`
  md += `- 汇总总方差 (V Total)：${formatNum(aggregate.value.totalVariance, currentPrecision.value)}\n`
  md += `- 68.27% 置信区间 (±1σ)：${formatNum(aggregate.value.confidenceIntervals.oneSigma.min, currentPrecision.value)} ~ ${formatNum(aggregate.value.confidenceIntervals.oneSigma.max, currentPrecision.value)} ${currentUnit.value}\n`
  md += `- 95.45% 置信区间 (±2σ)：${formatNum(aggregate.value.confidenceIntervals.twoSigma.min, currentPrecision.value)} ~ ${formatNum(aggregate.value.confidenceIntervals.twoSigma.max, currentPrecision.value)} ${currentUnit.value}\n`

  navigator.clipboard.writeText(md).then(() => {
    ElMessage.success('Markdown 表格已复制到剪贴板')
  })
}

// 导出 CSV 文件
const exportCsv = () => {
  const rows = aggregate.value.computedTasks
  if (!rows || rows.length === 0) {
    ElMessage.warning('暂无任务可导出')
    return
  }

  const header = [
    '序号',
    '任务名称',
    `乐观工时 (O) [${currentUnit.value}]`,
    `最可能工时 (M) [${currentUnit.value}]`,
    `悲观工时 (P) [${currentUnit.value}]`,
    `期望工时 (Te) [${currentUnit.value}]`,
    `标准差 (σ)`,
    `方差 (V)`,
    '风险评级'
  ]
  const csvLines = [header.join(',')]

  rows.forEach((r, idx) => {
    const row = [
      idx + 1,
      `"${(r.name || '').replace(/"/g, '""')}"`,
      formatNum(r.o, currentPrecision.value),
      formatNum(r.m, currentPrecision.value),
      formatNum(r.p, currentPrecision.value),
      formatNum(r.te, currentPrecision.value),
      formatNum(r.sd, currentPrecision.value),
      formatNum(r.variance, currentPrecision.value),
      `"${r.riskLabel || ''}"`
    ]
    csvLines.push(row.join(','))
  })

  // 汇总行
  csvLines.push('')
  csvLines.push(
    [
      '汇总总计',
      '',
      '',
      '',
      '',
      formatNum(aggregate.value.totalTe, currentPrecision.value),
      formatNum(aggregate.value.totalSd, currentPrecision.value),
      formatNum(aggregate.value.totalVariance, currentPrecision.value),
      ''
    ].join(',')
  )

  const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `PERT工作量评估表_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  ElMessage.success('CSV 导出成功')
}

// 复制完整评估总结报告
const copyFullReport = () => {
  const agg = aggregate.value
  let report = `========================================\n`
  report += `📊 PERT 工作量三点估算与项目风险分析报告\n`
  report += `========================================\n`
  report += `生成时间: ${new Date().toLocaleString()}\n`
  report += `工时单位: ${currentUnit.value}\n`
  report += `评估任务数: ${agg.validCount} 个（低风险: ${agg.highRiskCount.low}, 中风险: ${agg.highRiskCount.medium}, 高风险: ${agg.highRiskCount.high}）\n\n`
  report += `【核心估算指标】\n`
  report += `1. 汇总期望工作量 (Te Total): ${formatNum(agg.totalTe, currentPrecision.value)} ${currentUnit.value}\n`
  report += `2. 汇总总方差 (V Total = ∑Vi): ${formatNum(agg.totalVariance, currentPrecision.value)}\n`
  report += `3. 科学汇总标准差 (σ Total = √∑Vi): ${formatNum(agg.totalSd, currentPrecision.value)} ${currentUnit.value}\n`
  report += `   (注: 直接累加标准差为 ${formatNum(agg.directSdSum, currentPrecision.value)}，因任务独立抵消效应，方差合成节省了 ${formatNum(agg.sdOverestimate, currentPrecision.value)} ${currentUnit.value} 虚高缓冲)\n\n`
  report += `【交付工期置信度预测 (中心极限定理)】\n`
  report += `• 68.27% 置信区间 (±1σ): ${formatNum(agg.confidenceIntervals.oneSigma.min, currentPrecision.value)} ~ ${formatNum(agg.confidenceIntervals.oneSigma.max, currentPrecision.value)} ${currentUnit.value} (单侧达成率 84.1%)\n`
  report += `• 95.45% 置信区间 (±2σ): ${formatNum(agg.confidenceIntervals.twoSigma.min, currentPrecision.value)} ~ ${formatNum(agg.confidenceIntervals.twoSigma.max, currentPrecision.value)} ${currentUnit.value} (单侧达成率 97.7%)\n`
  report += `• 99.73% 置信区间 (±3σ): ${formatNum(agg.confidenceIntervals.threeSigma.min, currentPrecision.value)} ~ ${formatNum(agg.confidenceIntervals.threeSigma.max, currentPrecision.value)} ${currentUnit.value} (单侧达成率 99.9%)\n\n`
  report += `【各任务明细简述】\n`
  agg.computedTasks.forEach((r, idx) => {
    report += `${idx + 1}. ${r.name || '未命名'} [O:${r.o}, M:${r.m}, P:${r.p}] => Te=${formatNum(r.te, currentPrecision.value)}, σ=${formatNum(r.sd, currentPrecision.value)} (${r.riskLabel})\n`
  })
  report += `========================================\n`

  navigator.clipboard.writeText(report).then(() => {
    ElMessage.success('完整项目评估报告已复制到剪贴板')
  })
}
</script>

<style scoped>
.header-card {
  margin-bottom: 16px;
  border-radius: 8px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
}

.header-title-box {
  flex: 1;
  min-width: 300px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.main-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.global-settings-box {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

/* KPI 看板样式 */
.kpi-row {
  margin-bottom: 16px;
}

.kpi-card {
  border-radius: 8px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.kpi-card:hover {
  transform: translateY(-2px);
}

.kpi-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 14px;
}

.kpi-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.total-tasks .kpi-icon-wrap {
  background: var(--el-color-info-light-9);
  color: var(--el-color-info);
}

.total-te .kpi-icon-wrap {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.total-sd .kpi-icon-wrap {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}

.total-variance .kpi-icon-wrap {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.kpi-info {
  flex: 1;
  min-width: 0;
}

.kpi-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.help-icon {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
}

.kpi-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}

.kpi-value.highlight {
  color: var(--el-color-primary);
}

.kpi-value.warning {
  color: var(--el-color-warning);
}

.kpi-value.info {
  color: var(--el-color-success);
}

.kpi-unit {
  font-size: 12px;
  font-weight: normal;
  color: var(--el-text-color-secondary);
  margin-left: 2px;
}

.sub-num {
  font-size: 14px;
  font-weight: normal;
  color: var(--el-text-color-placeholder);
}

.kpi-tag-row {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.kpi-sub-text {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.tasks-table {
  border-radius: 6px;
  overflow: hidden;
}

.row-index {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.col-header-with-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 13px;
  line-height: 18px;
  white-space: nowrap;
}

.highlight-header {
  color: var(--el-color-primary);
  font-weight: bold;
}

.column-unit {
  font-size: 11px;
  font-weight: normal;
  line-height: 14px;
  color: var(--el-text-color-secondary);
}

.calc-text {
  font-weight: 700;
  font-size: 14px;
}

.te-text {
  color: var(--el-color-primary);
}

.sd-text {
  color: var(--el-color-warning);
}

.var-text {
  color: var(--el-color-success);
}

.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.font-mono {
  font-family: monospace;
}
</style>
