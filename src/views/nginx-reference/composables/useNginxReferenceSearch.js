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

  const filteredSections = computed(() => {
    const sections = unref(sectionsSource) || []

    return sections
      .map(section => ({
        ...section,
        items: section.items.filter(item => matchedIds.value.has(item.id))
      }))
      .filter(section => section.items.length > 0)
  })

  const totalItemCount = computed(() =>
    (unref(sectionsSource) || []).reduce((total, section) => total + section.items.length, 0)
  )

  const filteredItemCount = computed(() =>
    filteredSections.value.reduce((total, section) => total + section.items.length, 0)
  )

  const hasResults = computed(() => filteredItemCount.value > 0)

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
