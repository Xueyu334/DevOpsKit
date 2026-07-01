<template>
  <div class="regex-tester-container">
    <el-card shadow="never" class="main-card">
      <template #header>
        <div class="card-header">
          <span>正则表达式测试</span>
          <div>
            <el-link href="https://any-rule.vercel.app/" target="_blank" type="primary">
              推荐参考：正则表达式大全 (any-rule)
            </el-link>
          </div>
        </div>
      </template>

      <el-form label-position="left" label-suffix=":">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="正则表达式">
              <div style="display: flex; gap: 12px; width: 100%; align-items: flex-start">
                <el-input v-model="regexString" placeholder="请输入正则表达式，例如：\d+" clearable style="flex: 1">
                  <template #prepend>/</template>
                  <template #append>/{{ flags.join('') }}</template>
                </el-input>
                <div style="flex-shrink: 0">
                  <el-dropdown split-button @click="handleCopyRegex('raw')" @command="handleCopyRegex">
                    复制正则
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="raw">复制纯表达式 (例: \d+)</el-dropdown-item>
                        <el-dropdown-item command="js">复制 JS 字面量 (例: /\d+/g)</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
              <div class="common-regex-list" style="margin-top: 8px">
                <span class="common-label">常用：</span>
                <el-tag
                  v-for="item in commonRegexList"
                  :key="item.label"
                  class="common-tag"
                  @click="handleUseCommon(item.value)"
                  size="small"
                  type="info"
                  effect="plain"
                >
                  {{ item.label }}
                </el-tag>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="修饰符">
              <el-checkbox-group v-model="flags">
                <el-checkbox label="g">全局搜索 (g)</el-checkbox>
                <el-checkbox label="i">忽略大小写 (i)</el-checkbox>
                <el-checkbox label="m">多行匹配 (m)</el-checkbox>
                <el-checkbox label="s">允许.匹配换行符 (s)</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="待匹配文本">
              <el-input v-model="sourceText" type="textarea" :rows="5" placeholder="请输入待匹配的文本" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="action-row">
          <el-button type="primary" @click="handleMatch">进行匹配</el-button>
          <el-button @click="handleClear">清空</el-button>
        </div>

        <el-divider />

        <div class="result-section">
          <h3>
            匹配结果
            <el-tag v-if="matchResult !== null" type="info" size="small" style="margin-left: 8px">
              共找到 {{ matchCount }} 处匹配
            </el-tag>
          </h3>

          <div class="result-view-area">
            <el-scrollbar max-height="350px">
              <div class="result-scroll-content">
                <div v-if="errorMsg" class="error-msg">
                  <el-alert :title="errorMsg" type="error" :closable="false" show-icon />
                </div>
                <div v-else-if="matchResult !== null && matchCount === 0" class="empty-result">
                  <el-empty description="未找到匹配项" :image-size="60" />
                </div>

                <div v-else-if="matchResult && matchCount > 0" class="match-list">
                  <div v-for="(item, index) in matchResult" :key="index" class="match-item">
                    <div class="match-index">
                      <el-text type="info" size="small">匹配项 #{{ index + 1 }}</el-text>
                    </div>
                    <div class="match-content">
                      <el-text type="primary">{{ item.match }}</el-text>
                    </div>
                    <div v-if="item.groups && item.groups.length > 0" class="match-groups">
                      <div v-for="(group, gIndex) in item.groups" :key="gIndex" class="group-item">
                        <el-text type="info" size="small" class="group-label">分组 {{ gIndex + 1 }}:</el-text>
                        <el-text>{{ group }}</el-text>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="empty-result">
                  <el-empty description="请在上方的表单中输入正则表达式和待匹配文本进行测试" :image-size="60" />
                </div>
              </div>
            </el-scrollbar>
          </div>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useClipboard } from '@vueuse/core'

const { copy, isSupported } = useClipboard()

const regexString = ref('[\\u4e00-\\u9fa5]+')
const flags = ref(['g'])
const sourceText = ref('Hello, 欢迎使用 DevOpsKit 正则表达式测试工具！123')
const matchResult = ref(null)
const matchCount = ref(0)
const errorMsg = ref('')

const commonRegexList = [
  { label: '中文', value: '[\\u4e00-\\u9fa5]+' },
  { label: '数字', value: '\\d+' },
  { label: '英文字母', value: '[a-zA-Z]+' },
  { label: '手机号(中国)', value: '(?:(?:\\+|00)86)?1(?:3\\d|4[5-79]|5[0-35-9]|6[5-7]|7[0-8]|8\\d|9[0-35-9])\\d{8}' },
  { label: '邮箱', value: '\\w+([-+.]\\w+)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*' },
  { label: '身份证号(18位)', value: '[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dX]' },
  {
    label: 'IP地址(IPv4)',
    value: '(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)'
  },
  { label: 'URL', value: 'https?:\\/\\/([\\w-]+\\.)+[\\w-]+(\\/[\\w-./?%&=]*)?' }
]

const handleUseCommon = regex => {
  regexString.value = regex
}

const handleMatch = () => {
  errorMsg.value = ''
  matchResult.value = null
  matchCount.value = 0

  if (!regexString.value) {
    ElMessage.warning('请输入正则表达式')
    return
  }

  if (!sourceText.value) {
    ElMessage.warning('请输入待匹配文本')
    return
  }

  try {
    const flagStr = flags.value.join('')
    const regex = new RegExp(regexString.value, flagStr)

    const results = []

    if (flagStr.includes('g')) {
      let match
      // Reset lastIndex just in case
      regex.lastIndex = 0
      while ((match = regex.exec(sourceText.value)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (match.index === regex.lastIndex) {
          regex.lastIndex++
        }

        results.push({
          match: match[0],
          groups: match.slice(1)
        })
      }
    } else {
      const match = regex.exec(sourceText.value)
      if (match) {
        results.push({
          match: match[0],
          groups: match.slice(1)
        })
      }
    }

    matchResult.value = results
    matchCount.value = results.length
  } catch (err) {
    errorMsg.value = err.message || '正则表达式语法错误'
  }
}

const handleClear = () => {
  regexString.value = ''
  sourceText.value = ''
  matchResult.value = null
  matchCount.value = 0
  errorMsg.value = ''
}

const handleCopyRegex = async (format = 'raw') => {
  if (!isSupported.value) {
    ElMessage.error('当前浏览器环境不支持复制')
    return
  }
  if (!regexString.value) {
    ElMessage.warning('正则表达式为空')
    return
  }

  try {
    let textToCopy = regexString.value
    if (format === 'js') {
      textToCopy = `/${regexString.value}/${flags.value.join('')}`
    }

    await copy(textToCopy)
    ElMessage.success(format === 'js' ? '已复制 JS 正则字面量' : '已复制纯正则表达式')
  } catch (err) {
    ElMessage.error('复制失败')
  }
}

onMounted(() => {
  handleMatch()
})
</script>

<style scoped>
.regex-tester-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.action-row,
.result-section {
  margin-top: 20px;
}

.result-section h3 {
  display: flex;
  align-items: center;
  margin-top: 0;
  margin-bottom: 20px;
  color: var(--el-text-color-primary);
}

.result-view-area {
  min-height: 200px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background-color: var(--el-bg-color-page);
}

.result-scroll-content {
  padding: 16px;
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.match-item {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  padding: 12px;
  background-color: var(--el-fill-color-light);
}

.match-index {
  margin-bottom: 8px;
}

.match-content {
  font-family: monospace;
  word-break: break-all;
  background: var(--el-bg-color);
  padding: 8px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
}

.match-groups {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.group-item {
  font-family: monospace;
  padding: 4px 8px;
  background: var(--el-bg-color);
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
  word-break: break-all;
}

.group-label {
  margin-right: 4px;
  user-select: none;
}

.common-regex-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.common-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.common-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.common-tag:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
</style>
