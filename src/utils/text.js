/**
 * 转义 HTML 敏感字符，防止 XSS。
 *
 * @param {string} value - 待转义的字符串。
 * @returns {string} 转义后的字符串。
 */
export const escapeHtml = (value = '') =>
  String(value).replace(
    /[&<>"']/g,
    char =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[char]
  )

/**
 * 转义正则表达式中的特殊字符。
 *
 * @param {string} value - 待转义的字符串。
 * @returns {string} 转义后的字符串。
 */
export const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * 文本归一化处理（去除两端空格并转换为小写）。
 *
 * @param {string} value - 待处理的字符串。
 * @returns {string} 处理后的字符串。
 */
export const normalizeText = (value = '') => String(value).trim().toLowerCase()

/**
 * 创建高亮 HTML 的通用方法。
 *
 * @param {string} value - 原始文本。
 * @param {string} keyword - 匹配关键字。
 * @param {string} highlightClass - 高亮标签的 CSS 类名。
 * @returns {string} 包含 <mark> 标签的 HTML。
 */
export const createHighlightHtml = (value, keyword, highlightClass = 'text-highlight') => {
  const source = String(value ?? '')

  if (!keyword) {
    return escapeHtml(source)
  }

  const matcher = new RegExp(`(${escapeRegExp(keyword)})`, 'ig')

  return source
    .split(matcher)
    .map(part => {
      if (!part) {
        return ''
      }

      return part.toLowerCase() === keyword.toLowerCase()
        ? `<mark class="${highlightClass}">${escapeHtml(part)}</mark>`
        : escapeHtml(part)
    })
    .join('')
}
