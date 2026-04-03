import Fuse from 'fuse.js'

const referenceFuseOptions = {
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
  keys: [
    { name: 'name', weight: 0.28 },
    { name: 'example', weight: 0.28 },
    { name: 'desc', weight: 0.14 },
    { name: 'scene', weight: 0.14 },
    { name: 'options.key', weight: 0.1 },
    { name: 'options.desc', weight: 0.06 }
  ]
}

const escapeHtml = (value = '') =>
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

const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const normalizeText = (value = '') => String(value).trim().toLowerCase()

const createHighlightHtml = (value, keyword) => {
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
        ? `<mark class="nginx-highlight">${escapeHtml(part)}</mark>`
        : escapeHtml(part)
    })
    .join('')
}

export const useNginxReferenceSearch = sectionsSource => {
  const keyword = shallowRef('')
  const normalizedKeyword = computed(() => normalizeText(keyword.value))

  const flatItems = computed(() =>
    (unref(sectionsSource) || []).flatMap(section => section.items.map(item => ({ ...item })))
  )

  const referencesFuse = computed(() => new Fuse(flatItems.value, referenceFuseOptions))

  const matchedItemIds = computed(() => {
    const currentKeyword = keyword.value.trim()

    if (!currentKeyword) {
      return new Set(flatItems.value.map(item => item.id))
    }

    return new Set(referencesFuse.value.search(currentKeyword).map(result => result.item.id))
  })

  const filteredSections = computed(() => {
    const sections = unref(sectionsSource) || []

    return sections
      .map(section => ({
        ...section,
        items: section.items.filter(item => matchedItemIds.value.has(item.id))
      }))
      .filter(section => section.items.length > 0)
  })

  const totalItemCount = computed(() =>
    (unref(sectionsSource) || []).reduce((total, section) => total + section.items.length, 0)
  )

  const filteredItemCount = computed(() =>
    filteredSections.value.reduce((total, section) => total + section.items.length, 0)
  )

  const hasKeyword = computed(() => Boolean(keyword.value.trim()))
  const hasResults = computed(() => filteredItemCount.value > 0)

  const clearKeyword = () => {
    keyword.value = ''
  }

  const highlightText = value => createHighlightHtml(value, normalizedKeyword.value)

  return {
    keyword,
    hasKeyword,
    hasResults,
    filteredSections,
    totalItemCount,
    filteredItemCount,
    clearKeyword,
    highlightText
  }
}
