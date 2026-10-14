import { calculateDeliveryProbability, formatNum } from './pert'

const riskColors = { low: '#67c23a', medium: '#e6a23c', high: '#f56c6c' }
const primaryColor = '#409eff'

export function getChartTasks(aggregate) {
  return aggregate.computedTasks.filter(task => task.isValid && task.isValuesEntered)
}

function taskAxes(tasks, unit) {
  return {
    animation: false,
    grid: { left: 12, right: 54, top: 48, bottom: 42, containLabel: true },
    xAxis: { type: 'value', min: 0, name: unit, nameLocation: 'middle', nameGap: 28 },
    yAxis: {
      type: 'category',
      inverse: true,
      data: tasks.map(task => `${task.index}. ${task.name || '未命名任务'}`),
      axisLabel: { width: 115, overflow: 'truncate' },
      axisTick: { show: false },
      splitLine: { show: false }
    },
    dataZoom:
      tasks.length > 8
        ? [
            { type: 'slider', yAxisIndex: 0, right: 4, startValue: 0, endValue: 7, filterMode: 'weakFilter' },
            { type: 'inside', yAxisIndex: 0, startValue: 0, endValue: 7, filterMode: 'weakFilter' }
          ]
        : []
  }
}

export function createEstimateOption(tasks, unit, precision) {
  const axes = taskAxes(tasks, unit)
  return {
    ...axes,
    xAxis: { ...axes.xAxis, axisLabel: { formatter: value => formatNum(value, precision) } },
    legend: { data: ['O～P 区间', '最可能 M', '期望 Te'], top: 0 },
    tooltip: {
      trigger: 'item',
      formatter: params => {
        const task = tasks[params.dataIndex]
        return `${task.index}. ${task.name || '未命名任务'}\n乐观 O：${formatNum(task.o, precision)} ${unit}\n最可能 M：${formatNum(task.m, precision)} ${unit}\n悲观 P：${formatNum(task.p, precision)} ${unit}\n期望 Te：${formatNum(task.te, precision)} ${unit}\n${task.riskLabel} · CV ${formatNum(task.cv, 1)}%`
      }
    },
    series: [
      {
        name: 'O～P 区间',
        type: 'custom',
        itemStyle: { color: '#909399' },
        encode: { x: [1, 2], y: 0 },
        data: tasks.map((task, index) => [index, Number(task.o), Number(task.p)]),
        renderItem: (params, api) => {
          const start = api.coord([api.value(1), api.value(0)])
          const end = api.coord([api.value(2), api.value(0)])
          const color = riskColors[tasks[params.dataIndex].riskLevel]
          return {
            type: 'group',
            children: [
              {
                type: 'line',
                shape: { x1: start[0], y1: start[1], x2: end[0], y2: end[1] },
                style: { stroke: color, lineWidth: 5 }
              },
              ...[start, end].map(point => ({
                type: 'line',
                shape: { x1: point[0], y1: point[1] - 6, x2: point[0], y2: point[1] + 6 },
                style: { stroke: color, lineWidth: 2 }
              }))
            ]
          }
        }
      },
      {
        name: '最可能 M',
        type: 'scatter',
        symbol: 'diamond',
        symbolSize: 12,
        itemStyle: { color: '#e6a23c' },
        data: tasks.map((task, index) => [Number(task.m), index])
      },
      {
        name: '期望 Te',
        type: 'scatter',
        symbolSize: 10,
        itemStyle: { color: primaryColor },
        data: tasks.map((task, index) => [task.te, index])
      }
    ]
  }
}

export function createVarianceOption(tasks, totalVariance, unit, precision) {
  const ranked = [...tasks].sort((a, b) => b.variance - a.variance)
  const axes = taskAxes(ranked, `${unit}²`)
  return {
    ...axes,
    xAxis: { ...axes.xAxis, axisLabel: { formatter: value => formatNum(value, precision) } },
    tooltip: {
      trigger: 'item',
      formatter: params => {
        const task = ranked[params.dataIndex]
        const contribution = totalVariance > 0 ? (task.variance / totalVariance) * 100 : 0
        return `${task.index}. ${task.name || '未命名任务'}\n方差：${formatNum(task.variance, precision)} ${unit}²\n方差贡献：${formatNum(contribution, 1)}%\n标准差：${formatNum(task.sd, precision)} ${unit}\n期望：${formatNum(task.te, precision)} ${unit}\nCV：${formatNum(task.cv, 1)}%`
      }
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 24,
        data: ranked.map(task => ({
          value: task.variance,
          itemStyle: { color: riskColors[task.riskLevel], borderRadius: [0, 4, 4, 0] }
        })),
        label: {
          show: true,
          position: 'right',
          formatter: params => `${formatNum(totalVariance > 0 ? (params.value / totalVariance) * 100 : 0, 1)}%`
        }
      }
    ]
  }
}

export function createProbabilityOption(aggregate, targetEffort, unit, precision) {
  const { totalTe, totalSd } = aggregate
  const target = Math.max(0, Number(targetEffort) || 0)
  const span = totalSd > 0 ? 4 * totalSd : Math.max(totalTe * 0.2, 1)
  const min = Math.max(0, Math.min(totalTe - span, target))
  const max = Math.max(totalTe + span, target, 1)
  const probability = budget => calculateDeliveryProbability(totalTe, totalSd, budget).probability
  const budgets = Array.from({ length: 161 }, (_, index) => min + ((max - min) * index) / 160)
  budgets.push(totalTe, target)
  // 无估算波动时使用阶跃图，避免除以零或绘制虚假的平滑曲线。
  const data = [...new Set(budgets)].sort((a, b) => a - b).map(budget => [budget, probability(budget)])
  const references = [
    [80, 0.8416212335729143],
    [90, 1.2815515655446004],
    [95, 1.6448536269514722]
  ]
  return {
    animation: false,
    grid: { left: 12, right: 32, top: 65, bottom: 45, containLabel: true },
    legend: { top: 0, data: ['达成概率', '当前预算', '概率参考点'] },
    xAxis: {
      type: 'value',
      min,
      max,
      name: `工作量预算 (${unit})`,
      nameLocation: 'middle',
      nameGap: 28,
      axisLabel: { formatter: value => formatNum(value, precision) }
    },
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
    tooltip: {
      trigger: 'item',
      formatter: params =>
        `预算：${formatNum(params.value[0], precision)} ${unit}\n达成概率：${formatNum(params.value[1], 1)}%`
    },
    series: [
      {
        name: '达成概率',
        type: 'line',
        showSymbol: false,
        step: totalSd === 0 ? 'end' : false,
        itemStyle: { color: primaryColor },
        areaStyle: { opacity: 0.08 },
        data,
        markLine: {
          symbol: 'none',
          silent: true,
          lineStyle: { color: '#909399', type: 'dashed' },
          label: { formatter: `期望 ${formatNum(totalTe, precision)}`, position: 'insideEndTop' },
          data: [{ xAxis: totalTe }]
        }
      },
      {
        name: '当前预算',
        type: 'scatter',
        symbolSize: 14,
        itemStyle: { color: '#f56c6c' },
        data: [[target, probability(target)]],
        label: { show: true, position: 'bottom', formatter: params => `当前 ${formatNum(params.value[1], 1)}%` }
      },
      {
        name: '概率参考点',
        type: 'scatter',
        symbolSize: 9,
        itemStyle: { color: '#67c23a' },
        data: totalSd > 0 ? references.map(([percent, z]) => [totalTe + z * totalSd, percent]) : [],
        label: { show: true, position: 'top', formatter: params => `${params.value[1]}%` }
      }
    ]
  }
}
