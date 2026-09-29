import { useUniversalSearch } from '@/composables/useUniversalSearch'

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

export const useNginxReferenceSearch = sectionsSource => {
  const flatItems = computed(() =>
    (unref(sectionsSource) || []).flatMap(section => section.items.map(item => ({ ...item })))
  )

  const { keyword, hasKeyword, matchedIds, highlightText, clearKeyword } = useUniversalSearch(flatItems, {
    fuseOptions: referenceFuseOptions,
    highlightClass: 'nginx-highlight'
  })

  const typeFilter = ref('all') // 'all' | 'command' | 'config'

  const filteredSections = computed(() => {
    const sections = unref(sectionsSource) || []

    return sections
      .map(section => ({
        ...section,
        items: section.items.filter(item => {
          const matchesKeyword = matchedIds.value.has(item.id)
          const matchesType = typeFilter.value === 'all' || item.type === typeFilter.value
          return matchesKeyword && matchesType
        })
      }))
      .filter(section => section.items.length > 0)
  })

  const totalItemCount = computed(() =>
    (unref(sectionsSource) || []).reduce((total, section) => total + section.items.length, 0)
  )

  const totalCommandCount = computed(() => flatItems.value.filter(item => item.type === 'command').length)

  const totalConfigCount = computed(() => flatItems.value.filter(item => item.type === 'config').length)

  const filteredItemCount = computed(() =>
    filteredSections.value.reduce((total, section) => total + section.items.length, 0)
  )

  const hasResults = computed(() => filteredItemCount.value > 0)

  const hasActiveFilters = computed(() => hasKeyword.value || typeFilter.value !== 'all')

  const resetFilters = () => {
    clearKeyword()
    typeFilter.value = 'all'
  }

  return {
    keyword,
    hasKeyword,
    typeFilter,
    hasActiveFilters,
    hasResults,
    filteredSections,
    totalItemCount,
    totalCommandCount,
    totalConfigCount,
    filteredItemCount,
    clearKeyword,
    resetFilters,
    highlightText
  }
}
