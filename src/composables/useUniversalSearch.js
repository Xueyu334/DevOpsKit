import { computed, shallowRef, unref } from 'vue'
import Fuse from 'fuse.js'
import { normalizeText, createHighlightHtml } from '@/utils/text'

/**
 * 通用的模糊搜索 Hook。
 *
 * @param {import('vue').Ref<any[]> | any[]} dataSource - 原始数据源。
 * @param {Object} options - 配置选项。
 * @param {Object} options.fuseOptions - Fuse.js 的配置。
 * @param {string} options.highlightClass - 高亮显示的 CSS 类名。
 * @param {function} options.filterPredicate - 自定义过滤谓词（可选）。
 * @returns {Object} 包含搜索状态和结果的对象。
 */
export const useUniversalSearch = (dataSource, options = {}) => {
  const { fuseOptions = {}, highlightClass = 'text-highlight' } = options

  const keyword = shallowRef('')
  const normalizedKeyword = computed(() => normalizeText(keyword.value))

  const flatData = computed(() => {
    const data = unref(dataSource) || []
    return data.map(item => ({ ...item }))
  })

  const fuse = computed(() => new Fuse(flatData.value, fuseOptions))

  const matchedIds = computed(() => {
    const kw = keyword.value.trim()
    if (!kw) {
      return new Set(flatData.value.map(item => item.id))
    }
    return new Set(fuse.value.search(kw).map(result => result.item.id))
  })

  const hasKeyword = computed(() => Boolean(keyword.value.trim()))

  const highlightText = (value, customKeyword) => {
    return createHighlightHtml(value, customKeyword ?? normalizedKeyword.value, highlightClass)
  }

  const clearKeyword = () => {
    keyword.value = ''
  }

  return {
    keyword,
    normalizedKeyword,
    hasKeyword,
    matchedIds,
    highlightText,
    clearKeyword,
    // 原始数据供外部进一步处理（如分组过滤）
    flatData
  }
}
