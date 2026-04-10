import { ASCII_BLOCK_STARTS, ASCII_ITEMS, ASCII_ROW_COUNT } from '../ascii-data'

const ASCII_MAP = new Map(ASCII_ITEMS.map(item => [item.dec, item]))

const resolveAsciiCode = query => {
  if (/^\d{1,3}$/.test(query)) {
    const code = Number.parseInt(query, 10)
    return code >= 0 && code <= 127 ? code : null
  }

  if (/^(0x)?[0-9a-f]{1,2}$/i.test(query)) {
    const normalized = query.toLowerCase().startsWith('0x') ? query.slice(2) : query
    const code = Number.parseInt(normalized, 16)
    return code >= 0 && code <= 127 ? code : null
  }

  if (/^(0b)?[01]{1,7}$/i.test(query)) {
    const normalized = query.toLowerCase().startsWith('0b') ? query.slice(2) : query
    const code = Number.parseInt(normalized, 2)
    return code >= 0 && code <= 127 ? code : null
  }

  return null
}

const getMatchScore = (item, rawQuery, normalizedQuery, matchedCode) => {
  if (matchedCode !== null && item.dec === matchedCode) {
    return 0
  }

  if (rawQuery.length === 1 && item.char === rawQuery) {
    return 0
  }

  if (item.escape && item.escape.toLowerCase() === normalizedQuery) {
    return 1
  }

  if (item.name.toLowerCase() === normalizedQuery || item.displayLabel.toLowerCase() === normalizedQuery) {
    return 1
  }

  if (item.searchTokens.some(token => token === normalizedQuery)) {
    return 2
  }

  if (item.searchTokens.some(token => token.startsWith(normalizedQuery))) {
    return 3
  }

  if (item.searchText.includes(normalizedQuery)) {
    return 4
  }

  return null
}

export const useAsciiLookup = () => {
  const query = shallowRef('')
  const activeCode = shallowRef(65)

  const hasQuery = computed(() => Boolean(query.value.trim()))

  const matchedItems = computed(() => {
    const rawQuery = query.value.trim()
    if (!rawQuery) {
      return []
    }

    const normalizedQuery = rawQuery.toLowerCase()
    const matchedCode = resolveAsciiCode(rawQuery)

    const matches = ASCII_ITEMS.map(item => ({
      item,
      score: getMatchScore(item, rawQuery, normalizedQuery, matchedCode)
    }))
      .filter(entry => entry.score !== null)
      .sort((left, right) => left.score - right.score || left.item.dec - right.item.dec)
      .slice(0, 16)
      .map(entry => entry.item)

    // 如果搜索结果包含当前选中的 activeCode，则保持现状；
    // 如果不包含且搜索结果非空，我们可以考虑是否自动切换到搜索结果的第一项。
    // 但为了避免输入过程中的频繁跳动，这里我们仅在搜索结果发生变化且 activeCode 不在结果中时，
    // 不主动切换 activeCode，除非用户明确点击。
    // 但是，为了解决用户提到的“没有对应上”，我们可以在 matchedItems 更新时，
    // 如果发现第一个结果得分极高（比如是 0，即精确匹配），则自动设为 activeCode。
    if (matches.length > 0) {
      const bestMatch = matches[0]
      const rawNormalized = rawQuery.toLowerCase()
      // 如果输入完全匹配某个项的显示标签、十六进制、十进制或预览标签
      if (
        bestMatch.displayLabel.toLowerCase() === rawNormalized ||
        bestMatch.previewLabel.toLowerCase() === rawNormalized ||
        bestMatch.dec.toString() === rawQuery ||
        bestMatch.hex.toLowerCase() === rawNormalized ||
        bestMatch.binary === rawQuery ||
        (bestMatch.name && bestMatch.name.toLowerCase() === rawNormalized)
      ) {
        if (activeCode.value !== bestMatch.dec) {
          activeCode.value = bestMatch.dec
        }
      }
    }

    return matches
  })

  const featuredItem = computed(() => ASCII_MAP.get(activeCode.value) ?? ASCII_ITEMS[65])

  const highlightedCodes = computed(() => {
    const codes = [activeCode.value]
    if (matchedItems.value.length > 0) {
      codes.push(...matchedItems.value.map(item => item.dec))
    }
    return [...new Set(codes)]
  })

  const tableRows = computed(() =>
    Array.from({ length: ASCII_ROW_COUNT }, (_, rowIndex) => ({
      rowIndex,
      cells: ASCII_BLOCK_STARTS.map(blockStart => ASCII_MAP.get(blockStart + rowIndex))
    }))
  )

  const selectCode = code => {
    if (ASCII_MAP.has(code)) {
      activeCode.value = code
    }
  }

  return {
    activeCode,
    featuredItem,
    hasQuery,
    highlightedCodes,
    matchedItems,
    query,
    selectCode,
    tableRows
  }
}
