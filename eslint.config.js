import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import configPrettier from 'eslint-config-prettier'
import pluginPrettier from 'eslint-plugin-prettier'
import fs from 'fs'

// 读取 unplugin-auto-import 生成的全局变量配置
let autoImportGlobals = { globals: {} }
try {
  const content = fs.readFileSync(new URL('./.eslintrc-auto-import.json', import.meta.url), 'utf-8')
  autoImportGlobals = JSON.parse(content)
} catch (e) {
  console.warn('Warning: .eslintrc-auto-import.json not found. Run dev or build to generate it.', e)
}

export default [
  // 1. 全局配置
  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...autoImportGlobals.globals
      },
      ecmaVersion: 'latest',
      sourceType: 'module'
    }
  },

  // 2. 基础规则及 Vue 扩展
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  // 3. Prettier 规则集成
  {
    plugins: {
      prettier: pluginPrettier
    },
    rules: {
      'prettier/prettier': 'error',
      'vue/multi-word-component-names': 'off', // 工具类库通常组件名比较精简
      'no-unused-vars': 'warn',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      'preserve-caught-error': 'off'
    }
  },

  // 4. 关闭与 Prettier 冲突的规则（必须放在数组最后）
  configPrettier
]
