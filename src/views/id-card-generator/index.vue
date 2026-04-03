<script setup>
import { computed, reactive, shallowRef, useTemplateRef } from 'vue'
import { ElMessage } from 'element-plus'
import areaData from 'china-area-data'
import { useCopyText } from '@/composables/useCopyText'

const form = reactive({
  regionCode: '',
  birthday: '',
  gender: 'male'
})

const generatedId = shallowRef('')
const formRef = useTemplateRef('formRef')
const { copyText } = useCopyText({
  errorMessage: '复制失败，请手动复制结果'
})

const REGION_SEARCH_LIMIT = 20

const normalizeRegionSegment = segment => {
  if (!segment || segment === '市辖区' || segment === '县') {
    return ''
  }
  return segment
}

const buildRegionPath = (provinceName, cityName, districtName) => {
  return [provinceName, normalizeRegionSegment(cityName), districtName].filter(Boolean).join(' / ')
}

const buildRegionMeta = (provinceName, cityName) => {
  return [provinceName, normalizeRegionSegment(cityName)].filter(Boolean).join(' / ')
}

const buildRegionOption = (code, provinceName, cityName, districtName) => {
  const normalizedCityName = normalizeRegionSegment(cityName)
  const label = districtName || normalizedCityName || provinceName
  const meta = districtName ? buildRegionMeta(provinceName, cityName) : provinceName

  return {
    value: code,
    label,
    meta,
    path: buildRegionPath(provinceName, cityName, districtName || label)
  }
}

const buildRegionCodeOptions = () => {
  const provinces = areaData['86'] ?? {}
  const options = []

  Object.entries(provinces).forEach(([provinceCode, provinceName]) => {
    const cities = areaData[provinceCode] ?? {}
    const cityEntries = Object.entries(cities)

    if (!cityEntries.length) {
      options.push(buildRegionOption(provinceCode, provinceName, '', ''))
      return
    }

    cityEntries.forEach(([cityCode, cityName]) => {
      const districts = areaData[cityCode] ?? {}
      const districtEntries = Object.entries(districts)

      if (!districtEntries.length) {
        options.push(buildRegionOption(cityCode, provinceName, cityName, ''))
        return
      }

      districtEntries.forEach(([districtCode, districtName]) => {
        options.push(buildRegionOption(districtCode, provinceName, cityName, districtName))
      })
    })
  })

  return options
}

const regionCodeOptions = shallowRef(buildRegionCodeOptions())

/**
 * 性别选项列表。
 * 包含用于表示性别的标签和对应的值。
 *
 * 属性:
 * - label: 显示给用户的性别标签。
 * - value: 性别的实际值，通常用于后端交互或数据存储。
 */
const genderOptions = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' }
]

/**
 * 表单验证规则对象，用于定义各个字段的验证规则。
 *
 * @typedef {Object} formRules
 * @property {Array<Object>} regionCode 区域码的验证规则
 * @property {Array<Object>} birthday 生日的验证规则
 * @property {Array<Object>} gender 性别的验证规则
 */
const formRules = {
  regionCode: [
    { required: true, message: '请输入区域码', trigger: 'change' },
    { pattern: /^[0-9]{6}$/, message: '区域码必须为 6 位数字', trigger: 'change' }
  ],
  birthday: [{ required: true, message: '请选择生日', trigger: 'change' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }]
}

/**
 * 计算属性 `canGenerate` 用于判断是否可以生成某些内容。
 *
 * 条件:
 * 1. `form.regionCode` 必须是一个长度为6的数字字符串。
 * 2. `form.birthday` 必须是一个有效的值（非空或非假值）。
 *
 */
const canGenerate = computed(() => /^[0-9]{6}$/.test(form.regionCode) && Boolean(form.birthday))

/**
 * 计算属性，用于生成由特定长度子字符串组成的数组。
 *
 * 当 `generatedId` 值不存在时，将返回一个空数组。
 * 否则，将根据以下分段逻辑生成数组：
 * - 索引 0 到 6（不包含 6）
 * - 索引 6 到 14（不包含 14）
 * - 索引 14 到 17（不包含 17）
 * - 索引 17 到末尾
 *
 * @type {import('vue').ComputedRef<string[]>}
 */
const resultSegments = computed(() => {
  if (!generatedId.value) {
    return []
  }
  return [
    generatedId.value.slice(0, 6),
    generatedId.value.slice(6, 14),
    generatedId.value.slice(14, 17),
    generatedId.value.slice(17)
  ]
})

/**
 * 清理并标准化地区代码。
 *
 * 该函数会从表单对象的 `regionCode` 属性中移除所有非数字字符，
 * 并截取其前六个字符，确保地区代码符合预期的格式。
 *
 * 注意：
 * - 如果地区代码包含非数字字符，这些字符将被移除。
 * - 如果地区代码长度超过6个字符，仅保留前6位。
 *
 * 无返回值，操作直接修改 `form.regionCode` 的值。
 */
const sanitizeRegionCode = (value = form.regionCode) => {
  const sanitizedValue = String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 6)
  if (sanitizedValue !== form.regionCode) {
    form.regionCode = sanitizedValue
  }
  return sanitizedValue
}

const querySearchRegionCode = (queryString, callback) => {
  const sanitizedQuery = sanitizeRegionCode(queryString)

  if (!sanitizedQuery) {
    callback([])
    return
  }

  const suggestions = regionCodeOptions.value
    .filter(({ value }) => value.startsWith(sanitizedQuery))
    .slice(0, REGION_SEARCH_LIMIT)

  callback(suggestions)
}

const handleRegionCodeSelect = item => {
  form.regionCode = item.value
}

/**
 * 根据前17位身份证号码计算校验码。
 *
 * @param {string} id17 - 身份证号码的前17位，由数字字符组成。
 * @returns {string|null} - 返回计算得到的校验码，可能是数字或字母'X'；如果输入无效则返回null。
 */
const computeCheckCode = id17 => {
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const codes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
  let sum = 0
  for (let index = 0; index < id17.length; index += 1) {
    const digit = Number.parseInt(id17.charAt(index), 10)
    if (Number.isNaN(digit)) {
      return null
    }
    sum += digit * weights[index]
  }
  return codes[sum % 11]
}

/**
 * 生成一个格式化的序列号，根据性别不同可能返回奇数或偶数。
 *
 * 此方法会生成一个随机的基础值，并根据性别决定是否返回奇数或偶数的序列号。
 * 如果性别为男性（`form.gender === 'male'`），则生成的序列号为奇数；
 * 如果性别为女性，则生成的序列号为偶数。
 * 最终返回的序列号会被填充至至少三位。
 *
 * @function
 * @returns {string} 返回一个格式化的三位数序列号。
 */
const generateSequence = () => {
  const randomBase = Math.floor(Math.random() * 450) * 2
  const sequence = form.gender === 'male' ? randomBase + 1 : randomBase
  return String(sequence).padStart(3, '0')
}

/**
 * 异步生成身份证号码的方法。
 *
 * 此方法通过表单验证、区域码验证、生日验证以及校验位计算，生成符合规则的身份证号码。
 * 如果验证失败或生成过程中出现错误，将通过提示信息反馈给用户。
 *
 * 验证逻辑：
 * 1. 验证表单的整体有效性，如果验证未通过，则停止操作。
 * 2. 检查区域码是否为 6 位数字，如果不符合规范则终止操作，并显示警告信息。
 * 3. 验证生日是否填写，如果未填写则终止操作，并显示警告信息。
 * 4. 将生日格式化为不含短横线的纯数字字符串，并检查其格式是否为 8 位数字，如不符合规范则显示警告信息并停止操作。
 * 5. 生成编码序列和校验码，并拼接生成完整的身份证号码。
 * 6. 如果校验码计算失败，则显示错误信息并停止操作。
 *
 * 成功生成身份证号码后：
 * 1. 设置 `generatedId` 的值为生成的身份证号码。
 * 2. 显示成功消息。
 * 3. 将结果区域滚动到视图中，使其可见。
 *
 * 注意事项:
 * - 本方法依赖 `formRef`、`form` 与 `generatedId` 等外部变量。
 * - 调用 `formRef` 的验证方法时，可能会抛出异常，异常情况下将视为验证失败。
 */
const handleGenerate = async () => {
  const isValid = await formRef.value?.validate().catch(() => false)
  if (!isValid) {
    return
  }
  if (!/^[0-9]{6}$/.test(form.regionCode)) {
    ElMessage.warning('区域码必须为 6 位数字')
    return
  }
  if (!form.birthday) {
    ElMessage.warning('请选择生日')
    return
  }
  const birthday = form.birthday.replace(/-/g, '')
  if (!/^[0-9]{8}$/.test(birthday)) {
    ElMessage.warning('生日格式不正确')
    return
  }
  const sequence = generateSequence()
  const partial = `${form.regionCode}${birthday}${sequence}`
  const checkCode = computeCheckCode(partial)
  if (!checkCode) {
    ElMessage.error('计算校验位出错')
    return
  }
  generatedId.value = `${partial}${checkCode}`
  ElMessage.success('身份证号码已生成')
}

/**
 * 异步函数，用于处理复制操作。
 *
 * 该函数会检查 `generatedId` 的值是否存在，如果存在，则尝试将其复制到剪贴板。
 * 如果复制成功，显示成功消息；如果复制失败，显示错误提示。
 *
 * 注意：该函数依赖外部方法 `toClipboard` 和 `ElMessage`，需要确保这些方法已正确定义并导入。
 */
const handleCopy = async () => {
  if (!generatedId.value) {
    return
  }
  await copyText(generatedId.value)
}
</script>

<template>
  <div class="app-container">
    <el-card class="content-wrap" shadow="never">
      <template #default>
        <h1 class="page-title">身份证号生成器</h1>
        <el-form ref="formRef" :model="form" :rules="formRules" label-position="top" label-suffix="">
          <el-row :gutter="16">
            <el-col :span="24">
              <el-form-item class="field-item" prop="regionCode">
                <template #label>
                  <span class="field-label">
                    区域码（6位）
                    <el-tooltip content="前6位为行政区划代码（可手动输入）" placement="top">
                      <span class="field-label-tip">?</span>
                    </el-tooltip>
                  </span>
                </template>
                <template #default>
                  <el-autocomplete
                    id="region-code"
                    v-model="form.regionCode"
                    :fetch-suggestions="querySearchRegionCode"
                    :trigger-on-focus="false"
                    clearable
                    highlight-first-item
                    maxlength="6"
                    placeholder="例如：320323"
                    popper-class="region-code-popper"
                    style="width: 70%"
                    @input="sanitizeRegionCode"
                    @select="handleRegionCodeSelect"
                  >
                    <template #default="{ item }">
                      <div class="region-suggestion">
                        <span class="region-suggestion-code">{{ item.value }}</span>
                        <div class="region-suggestion-body">
                          <span class="region-suggestion-title">{{ item.label }}</span>
                          <span :title="item.path" class="region-suggestion-meta">{{ item.meta }}</span>
                        </div>
                      </div>
                    </template>
                  </el-autocomplete>
                </template>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item class="field-item" label="生日" prop="birthday">
                <el-date-picker
                  id="birthday"
                  v-model="form.birthday"
                  format="YYYY/MM/DD"
                  placeholder="年 / 月 / 日"
                  type="date"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item class="field-item" label="性别" prop="gender">
                <el-select id="gender" v-model="form.gender" placeholder="请选择性别" style="width: 50%">
                  <el-option
                    v-for="option in genderOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24" style="margin-top: 12px">
              <el-form-item class="action-item">
                <el-button :disabled="!canGenerate" type="primary" @click="handleGenerate"> 生成身份证号 </el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </template>
      <template v-if="generatedId" #footer>
        <el-alert :closable="false" show-icon title="严格禁止用于任何不正当用途" type="warning">
          <template #default>
            <span>仅用于测试</span>
          </template>
        </el-alert>
        <el-row align="middle" class="result-shell" justify="space-between">
          <el-col :md="20" :sm="18" :xs="24">
            <div class="result-value">
              <span v-for="(segment, index) in resultSegments" :key="`${segment}-${index}`" class="result-segment">
                {{ segment }}
              </span>
            </div>
          </el-col>
          <el-col :md="4" :sm="6" :xs="24" class="copy-col">
            <el-button round type="success" @click="handleCopy">复制</el-button>
          </el-col>
        </el-row>
      </template>
    </el-card>
  </div>
</template>

<style scoped>
.content-wrap {
  max-width: 800px;
  margin: 0 auto;
  border-radius: 14px;
}

:deep(.content-wrap .el-card__body) {
  padding: 14px 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 12px;
}

.field-item {
  margin-bottom: 8px;
}

.field-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.field-label-tip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1;
  cursor: help;
}

.action-item {
  margin-bottom: 4px;
}

.result-shell {
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}

.result-value {
  min-height: 24px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 16px;
}

.result-segment {
  display: inline-flex;
  align-items: center;
}

.copy-col {
  display: flex;
  justify-content: flex-end;
}

.region-suggestion {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  line-height: 1.2;
  overflow: hidden;
}

.region-suggestion-code {
  flex: none;
  min-width: 54px;
  padding: 3px 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-color-primary) 10%, white);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 16%, transparent);
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.1;
  text-align: center;
  color: var(--el-color-primary-dark-2);
}

.region-suggestion-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.region-suggestion-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.region-suggestion-meta {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.region-code-popper.el-popper) {
  border-radius: 14px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.12);
}

:deep(.region-code-popper .el-autocomplete-suggestion__wrap) {
  padding: 6px;
}

:deep(.region-code-popper .el-autocomplete-suggestion__list li) {
  height: auto;
  padding: 10px 12px;
  border-radius: 10px;
  line-height: normal;
}

:deep(.region-code-popper .el-autocomplete-suggestion__list li.highlighted) {
  background: color-mix(in srgb, var(--el-color-primary) 8%, white);
}
</style>
