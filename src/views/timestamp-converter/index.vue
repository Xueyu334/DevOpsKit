<template>
  <div class="timestamp-converter-container">
    <!-- 当前时间展示看板 -->
    <el-card class="now-card">
      <div class="now-content">
        <div class="header-info">
          <el-icon class="timer-icon">
            <IconEpTimer />
          </el-icon>
          <span class="label">当前时间 ({{ currentTzLabel }})</span>
          <el-select v-model="selectedTz" size="small" placeholder="切换时区" style="width: 180px; margin-left: 10px;">
            <el-option v-for="tz in tzList" :key="tz.value" :label="tz.label" :value="tz.value" />
          </el-select>
        </div>
        <div class="time-display">{{ currentTimeStr }}</div>
        <div class="timestamp-display">
          <div class="ts-item" @click="copy(currentSeconds)">
            <span class="unit">秒 (s):</span>
            <span class="val">{{ currentSeconds }}</span>
          </div>
          <el-divider direction="vertical" />
          <div class="ts-item" @click="copy(currentMillis)">
            <span class="unit">毫秒 (ms):</span>
            <span class="val">{{ currentMillis }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20" class="main-row">
      <!-- 时间戳 转 时间 -->
      <el-col :xs="24" :md="12">
        <el-card class="convert-card">
          <template #header>
            <div class="card-header">
              <span>时间戳 <el-icon>
                  <IconEpRight />
                </el-icon> 时间</span>
            </div>
          </template>

          <el-form label-position="top">
            <el-form-item label="输入时间戳">
              <el-input v-model="tsToTime.input" placeholder="例如: 1712304000" clearable>
                <template #append>
                  <el-select v-model="tsToTime.unit" style="width: 85px">
                    <el-option label="秒" value="s" />
                    <el-option label="毫秒" value="ms" />
                  </el-select>
                </template>
              </el-input>
            </el-form-item>

            <div class="action-bar">
              <el-button type="primary" @click="doTsToTime">立即转换</el-button>
              <el-button @click="resetTsToTime">重置</el-button>
            </div>

            <el-form-item label="转换结果" class="result-item">
              <el-input v-model="tsToTime.output" readonly placeholder="转换后的本地时间">
                <template #append>
                  <el-button @click="copy(tsToTime.output)" :disabled="!tsToTime.output">复制</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 时间 转 时间戳 -->
      <el-col :xs="24" :md="12">
        <el-card class="convert-card">
          <template #header>
            <div class="card-header">
              <span>时间 <el-icon>
                  <IconEpRight />
                </el-icon> 时间戳</span>
            </div>
          </template>

          <el-form label-position="top">
            <el-form-item label="选择或输入日期时间">
              <el-date-picker v-model="timeToTs.input" type="datetime" placeholder="YYYY-MM-DD HH:mm:ss"
                format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
            </el-form-item>

            <div class="action-bar">
              <el-button type="primary" @click="doTimeToTs">立即转换</el-button>
              <el-button @click="resetTimeToTs">重置</el-button>
            </div>

            <el-form-item label="转换结果" class="result-item">
              <el-input v-model="timeToTs.output" readonly placeholder="转换后的时间戳">
                <template #prepend>
                  <el-select v-model="timeToTs.unit" style="width: 85px">
                    <el-option label="秒" value="s" />
                    <el-option label="毫秒" value="ms" />
                  </el-select>
                </template>
                <template #append>
                  <el-button @click="copy(timeToTs.output)" :disabled="!timeToTs.output">复制</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import dayjs from 'dayjs'

const { copy: toClipboard } = useClipboard({ legacy: true })

// 用户提供的大时区数据源
/**
 * 常用全球时区数据源 (共27项)
 * 为什么全球时区多于24个？
 * 1. 国际日期变更线的曲折：部分国家如基里巴斯为对齐贸易伙伴，设置了 UTC+13 和 UTC+14 时区；
 * 2. 覆盖完整时间线：从最早进入新一天的 UTC+14 到最后进入新一天的 UTC-12，全量覆盖共需 27 个整时区；
 * 3. 业务需求：作为 DevOps 工具，支持完整的 UTC 偏移量（-12 ~ +14）可确保全球日志和系统时间戳转换的准确性。
 */
const commonTimezones = {
  'UTC+14': { label: '基里巴斯/圣诞岛', value: 'Pacific/Kiritimati' },
  'UTC+13': { label: '萨摩亚/汤加', value: 'Pacific/Apia' },
  'UTC+12': { label: '奥克兰/斐济', value: 'Pacific/Auckland' },
  'UTC+11': { label: '马加丹', value: 'Asia/Magadan' },
  'UTC+10': { label: '悉尼/堪培拉', value: 'Australia/Sydney' },
  'UTC+9': { label: '东京/首尔', value: 'Asia/Tokyo' },
  'UTC+8': { label: '北京/上海/中国', value: 'Asia/Shanghai' },
  'UTC+7': { label: '曼谷/雅加达/胡志明', value: 'Asia/Bangkok' },
  'UTC+6': { label: '达卡', value: 'Asia/Dhaka' },
  'UTC+5': { label: '卡拉奇/塔什干', value: 'Asia/Karachi' },
  'UTC+4': { label: '迪拜/阿布扎比', value: 'Asia/Dubai' },
  'UTC+3': { label: '莫斯科/伊斯坦布尔', value: 'Europe/Moscow' },
  'UTC+2': { label: '开罗/约翰内斯堡', value: 'Africa/Cairo' },
  'UTC+1': { label: '巴黎/柏林/罗马', value: 'Europe/Paris' },
  'UTC+0': { label: '伦敦/UTC', value: 'Europe/London' },
  'UTC-1': { label: '亚速尔群岛', value: 'Atlantic/Azores' },
  'UTC-2': { label: '南乔治亚', value: 'Atlantic/South_Georgia' },
  'UTC-3': { label: '巴西利亚/布宜诺斯艾利斯', value: 'America/Sao_Paulo' },
  'UTC-4': { label: '圣地亚哥', value: 'America/Santiago' },
  'UTC-5': { label: '纽约/华盛顿/多伦多', value: 'America/New_York' },
  'UTC-6': { label: '芝加哥/墨西哥城', value: 'America/Chicago' },
  'UTC-7': { label: '丹佛', value: 'America/Denver' },
  'UTC-8': { label: '洛杉矶/温哥华', value: 'America/Los_Angeles' },
  'UTC-9': { label: '阿拉斯加', value: 'America/Anchorage' },
  'UTC-10': { label: '夏威夷', value: 'Pacific/Honolulu' },
  'UTC-11': { label: '中途岛/美属萨摩亚', value: 'Pacific/Pago_Pago' },
  'UTC-12': { label: '贝克岛/豪兰岛', value: 'Pacific/Baker' }
}

const generateTzList = () => {
  const browserTz = dayjs.tz.guess()
  const list = [
    { label: `本地 (浏览器: ${browserTz})`, value: browserTz }
  ]

  Object.entries(commonTimezones).forEach(([offset, info]) => {
    list.push({
      label: `${offset} - ${info.label}`,
      value: info.value,
      offset: offset
    })
  })
  return list
}

const tzList = generateTzList()

const selectedTz = ref(dayjs.tz.guess())
const currentTzLabel = computed(() => {
  const found = tzList.find(t => t.value === selectedTz.value)
  if (!found) return '未知时区'
  if (found.value === dayjs.tz.guess() && found.label.startsWith('本地')) return '本地'
  return found.offset || found.label.split(' ')[0]
})

// 当前时间逻辑
const currentSeconds = ref(0)
const currentMillis = ref(0)
const currentTimeStr = ref('')

/**
 * 格式化时间，支持指定时区
 */
const formatDate = (date, tz = selectedTz.value) => {
  return dayjs(date).tz(tz).format('YYYY-MM-DD HH:mm:ss')
}

const updateTime = () => {
  const now = dayjs()
  currentMillis.value = now.valueOf()
  currentSeconds.value = now.unix()
  currentTimeStr.value = now.tz(selectedTz.value).format('YYYY-MM-DD HH:mm:ss')
}

let timer
onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  // 为 "时间转时间戳" 赋初值
  timeToTs.input = currentTimeStr.value
})

onUnmounted(() => {
  clearInterval(timer)
})

watch(selectedTz, () => {
  updateTime()
  // 切换时区时，同步更新左侧转换器的初值
  timeToTs.input = dayjs().tz(selectedTz.value).format('YYYY-MM-DD HH:mm:ss')
})

// 时间戳转时间逻辑
const tsToTime = reactive({
  input: '',
  unit: 's',
  output: ''
})

const doTsToTime = () => {
  if (!tsToTime.input) {
    ElMessage.warning('请输入时间戳')
    return
  }
  const val = parseInt(tsToTime.input)
  if (isNaN(val)) {
    ElMessage.error('无效的时间戳数值')
    return
  }

  // 简单长度校验
  if (tsToTime.unit === 's' && tsToTime.input.length > 11) {
    ElMessage.info('提示：输入的长度看起来像毫秒，已切换到秒计算，请核对单位。')
  }

  const d = tsToTime.unit === 's' ? dayjs.unix(val) : dayjs(val)
  if (!d.isValid()) {
    ElMessage.error('转换失败，请检查时间戳是否正确')
    return
  }
  tsToTime.output = d.tz(selectedTz.value).format('YYYY-MM-DD HH:mm:ss')
}

const resetTsToTime = () => {
  tsToTime.input = ''
  tsToTime.output = ''
  tsToTime.unit = 's'
}

// 时间转时间戳逻辑
const timeToTs = reactive({
  input: '',
  unit: 's',
  output: ''
})

const doTimeToTs = () => {
  if (!timeToTs.input) {
    ElMessage.warning('请选择日期时间')
    return
  }

  try {
    const d = dayjs.tz(timeToTs.input, selectedTz.value)
    if (!d.isValid()) {
      throw new Error('Invalid Date')
    }

    const ms = d.valueOf()
    timeToTs.output = timeToTs.unit === 's' ? Math.floor(ms / 1000).toString() : ms.toString()
  } catch (e) {
    ElMessage.error('时间格式无效或时区转换失败')
  }
}

const resetTimeToTs = () => {
  timeToTs.input = dayjs().tz(selectedTz.value).format('YYYY-MM-DD HH:mm:ss')
  timeToTs.output = ''
  timeToTs.unit = 's'
}

const copy = async (text) => {
  if (!text) return
  try {
    await toClipboard(text.toString())
    ElMessage.success('复制到剪贴板')
  } catch (err) {
    ElMessage.error('复制失败')
  }
}
</script>

<style scoped>
.timestamp-converter-container {
  max-width: 1000px;
  margin: 10px auto;
}

.now-card {
  margin-bottom: 24px;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--el-box-shadow-lighter);
  position: relative;
  overflow: hidden;
}

/* 顶部装饰条 */
.now-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--el-color-primary), #67c23a);
  opacity: 0.8;
}

.now-content {
  text-align: center;
  padding: 15px 0;
}

.header-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.timer-icon {
  font-size: 16px;
  color: var(--el-text-color-secondary);
}

.time-display {
  font-size: 38px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  margin-bottom: 12px;
  letter-spacing: -1px;
}

.timestamp-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.ts-item {
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 4px;
  transition: background 0.3s;
}

.ts-item:hover {
  background-color: var(--el-color-primary-light-8);
}

.ts-item .unit {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-right: 6px;
}

.ts-item .val {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.main-row {
  margin-bottom: 20px;
}

.convert-card {
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  font-weight: 600;
}

.card-header .el-icon {
  margin: 0 8px;
  opacity: 0.6;
}

.action-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.action-bar .el-button {
  flex: 1;
}

.result-item {
  margin-bottom: 0;
}

:deep(.result-item .el-input__wrapper) {
  background-color: var(--el-fill-color-light);
}

:deep(.el-input-group__append),
:deep(.el-input-group__prepend) {
  background-color: var(--el-fill-color);
}
</style>
