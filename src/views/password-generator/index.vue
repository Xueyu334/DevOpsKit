<template>
  <div class="password-generator-container">
    <el-row :gutter="20">
      <!-- 配置参数区 -->
      <el-col :xs="24" :md="8">
        <el-card class="config-card">
          <template #header>
            <div class="card-header">
              <span>配置参数</span>
              <el-button type="info" link @click="resetForm">重置</el-button>
            </div>
          </template>

          <el-form label-position="top">
            <el-form-item label="密码长度">
              <el-input-number v-model="form.length" :min="4" :max="128" />
            </el-form-item>

            <el-form-item label="包含字符">
              <el-checkbox-group v-model="form.chars" class="char-checkbox-group">
                <el-checkbox value="lowercase">小写字母 (a-z)</el-checkbox>
                <el-checkbox value="uppercase">大写字母 (A-Z)</el-checkbox>
                <el-checkbox value="numbers">数字 (0-9)</el-checkbox>
                <el-checkbox value="special">特殊字符 (!@#$%^&*)</el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item>
              <template #label>
                排除字符
                <el-tooltip content="输入想要排除的字符，使用英文字符的逗号分隔。如：1,l,I,O,0" placement="top">
                  <el-icon class="label-info-icon">
                    <IconEpQuestionFilled />
                  </el-icon>
                </el-tooltip>
              </template>
              <el-input v-model="form.excludeChars" placeholder="例如: i,l,1,L,O,0" clearable />
            </el-form-item>

            <el-form-item label="生成条数">
              <div style="display: flex; gap: 15px; width: 100%; align-items: center">
                <el-input-number v-model="form.count" :min="1" :max="50" />
                <el-button type="primary" style="flex: 1" @click="generatePasswords">
                  <el-icon>
                    <IconEpRefresh />
                  </el-icon>
                  立即生成
                </el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 结果展示区 -->
      <el-col :xs="24" :md="16">
        <el-card v-loading="generating" class="result-card" element-loading-text="正在生成安全密码...">
          <template #header>
            <div class="card-header">
              <span>生成结果</span>
              <el-button type="success" size="small" :disabled="!results.length" @click="copyAll"> 复制全部 </el-button>
            </div>
          </template>

          <div v-if="results.length" class="pwd-list">
            <div v-for="(pwd, index) in results" :key="index" class="pwd-item">
              <span class="pwd-text">{{ pwd }}</span>
              <el-button size="small" type="primary" plain @click="copy(pwd)">复制</el-button>
            </div>
          </div>
          <el-empty v-else description="暂无生成的密码，请点击左侧生成按钮" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
const { copy: toClipboard } = useClipboard({ legacy: true })

const form = reactive({
  length: 16,
  chars: ['lowercase', 'uppercase', 'numbers', 'special'],
  excludeChars: '',
  count: 1
})

const resetForm = () => {
  form.length = 16
  form.chars = ['lowercase', 'uppercase', 'numbers', 'special']
  form.excludeChars = ''
  form.count = 1
  results.value = []
}

const results = ref([])
const generating = ref(false)

const generatePasswords = () => {
  if (form.chars.length === 0) {
    ElMessage.warning('请至少选择一种包含字符')
    return
  }

  generating.value = true

  // 使用 setTimeout 模拟微弱生成延迟，增强系统交互反馈感
  setTimeout(() => {
    try {
      const charSets = {
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        numbers: '0123456789',
        special: '!@#$%^&*'
      }

      // Parse excluded characters (support both English and Chinese commas as separators)
      const excluded = form.excludeChars
        .split(/[,，]/)
        .map(c => c.trim())
        .filter(c => c)
      const excludedSet = new Set(excluded)

      // Build the pool and required char pools
      let pool = ''
      const requiredChars = []

      for (const type of form.chars) {
        let availableChars = charSets[type]
          .split('')
          .filter(c => !excludedSet.has(c))
          .join('')

        if (availableChars) {
          pool += availableChars
          // Get at least one char of this type to ensure all selected rules are met
          requiredChars.push(() => availableChars[Math.floor(Math.random() * availableChars.length)])
        } else {
          ElMessage.warning(`选择的字符类型 "${type}" 中的字符已被全部排除，无法生成。`)
          generating.value = false
          return
        }
      }

      if (!pool) {
        ElMessage.warning('没有可用的字符，请检查排除的字符列表。')
        generating.value = false
        return
      }

      if (form.length < requiredChars.length) {
        ElMessage.warning(`密码长度需要至少为 ${requiredChars.length} 以包含所有选中的字符类型。`)
        generating.value = false
        return
      }

      const generated = []
      for (let i = 0; i < form.count; i++) {
        // We must guarantee at least one char for every selected type
        let pwdArray = []

        // Add required characters
        for (const getChar of requiredChars) {
          pwdArray.push(getChar())
        }

        // Fill the rest of the password length
        while (pwdArray.length < form.length) {
          pwdArray.push(pool[Math.floor(Math.random() * pool.length)])
        }

        // Shuffle the array to avoid predictable positions for required characters
        for (let j = pwdArray.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1))
          ;[pwdArray[j], pwdArray[k]] = [pwdArray[k], pwdArray[j]]
        }

        generated.push(pwdArray.join(''))
      }

      results.value = generated
    } finally {
      generating.value = false
    }
  }, 300)
}

const copy = async text => {
  try {
    await toClipboard(text)
    ElMessage.success('复制成功')
  } catch {
    ElMessage.error('复制失败，请手动选择复制')
  }
}

const copyAll = async () => {
  const text = results.value.join('\n')
  try {
    await toClipboard(text)
    ElMessage.success('已全部复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动选择复制')
  }
}
</script>

<style scoped>
.password-generator-container {
  max-width: 1200px;
  margin: 10px auto;
}

.config-card {
  margin-bottom: 20px;
}

.result-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.char-checkbox-group .el-checkbox {
  margin-right: 0;
}

.label-info-icon {
  margin-left: 4px;
  margin-top: 2px;
  cursor: help;
  color: var(--el-text-color-secondary);
}

.generate-btn {
  width: 100%;
  margin-top: 10px;
}

.pwd-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 500px;
  overflow-y: auto;
  padding-right: 4px;
  /* 为滚动条留出一点空间 */
}

.pwd-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--el-fill-color-light);
  padding: 10px 15px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
  font-size: 16px;
  transition: all 0.3s;
}

.pwd-item:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.pwd-text {
  word-break: break-all;
  flex: 1;
  margin-right: 15px;
  letter-spacing: 1px;
}
</style>
