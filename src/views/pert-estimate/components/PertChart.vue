<script setup>
import { init, use } from 'echarts/core'
import { BarChart, CustomChart, LineChart, ScatterChart } from 'echarts/charts'
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TooltipComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([
  BarChart,
  CustomChart,
  LineChart,
  ScatterChart,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TooltipComponent,
  CanvasRenderer
])

const props = defineProps({
  option: { type: Object, required: true },
  label: { type: String, required: true }
})
const container = useTemplateRef('container')
let chart
let resizeObserver
let themeObserver

function renderChart() {
  const element = container.value
  // 多任务 Tab 初始隐藏，等容器有实际尺寸后再初始化。
  if (!element?.clientWidth || !element.clientHeight) return
  if (!chart) chart = init(element)
  const styles = getComputedStyle(element)
  const textColor = styles.getPropertyValue('--el-text-color-regular').trim()
  const borderColor = styles.getPropertyValue('--el-border-color-light').trim()
  const axis = value => ({
    ...value,
    nameTextStyle: { color: textColor },
    axisLabel: { ...value.axisLabel, color: textColor },
    axisLine: { lineStyle: { color: borderColor } },
    splitLine: { ...value.splitLine, lineStyle: { color: borderColor } }
  })
  chart.setOption(
    {
      ...props.option,
      textStyle: { color: textColor },
      legend: { ...props.option.legend, textStyle: { color: textColor } },
      tooltip: {
        ...props.option.tooltip,
        renderMode: 'richText',
        confine: true,
        backgroundColor: styles.getPropertyValue('--el-bg-color-overlay').trim(),
        borderColor,
        textStyle: { color: textColor }
      },
      series: props.option.series.map(series => ({
        ...series,
        label: { ...series.label, color: textColor, textBorderWidth: 0 },
        ...(series.markLine
          ? {
              markLine: {
                ...series.markLine,
                label: { ...series.markLine.label, color: textColor, textBorderWidth: 0 }
              }
            }
          : {})
      })),
      xAxis: axis(props.option.xAxis),
      yAxis: axis(props.option.yAxis)
    },
    { notMerge: true }
  )
  chart.resize()
}

watch(() => props.option, renderChart, { flush: 'post' })
onMounted(() => {
  resizeObserver = new ResizeObserver(renderChart)
  resizeObserver.observe(container.value)
  themeObserver = new MutationObserver(renderChart)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  renderChart()
})
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  themeObserver?.disconnect()
  chart?.dispose()
})
</script>

<template>
  <div ref="container" class="pert-chart" role="img" :aria-label="label" />
</template>

<style scoped>
.pert-chart {
  width: 100%;
  height: 360px;
  min-width: 0;
}
</style>
