import { useUniversalSearch } from '@/composables/useUniversalSearch'

const commandFuseOptions = {
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
  keys: [
    { name: 'name', weight: 0.3 },
    { name: 'command', weight: 0.25 },
    { name: 'desc', weight: 0.15 },
    { name: 'scene', weight: 0.15 },
    { name: 'options.key', weight: 0.1 },
    { name: 'options.desc', weight: 0.05 }
  ]
}

export const useDockerCommandSearch = sectionsSource => {
  const flatCommands = computed(() =>
    (unref(sectionsSource) || []).flatMap(section => section.commands.map(command => ({ ...command })))
  )

  const { keyword, hasKeyword, matchedIds, highlightText, clearKeyword } = useUniversalSearch(flatCommands, {
    fuseOptions: commandFuseOptions,
    highlightClass: 'docker-highlight'
  })

  const filteredSections = computed(() => {
    const sections = unref(sectionsSource) || []

    return sections
      .map(section => ({
        ...section,
        commands: section.commands.filter(command => matchedIds.value.has(command.id))
      }))
      .filter(section => section.commands.length > 0)
  })

  const totalCommandCount = computed(() =>
    (unref(sectionsSource) || []).reduce((total, section) => total + section.commands.length, 0)
  )

  const filteredCommandCount = computed(() =>
    filteredSections.value.reduce((total, section) => total + section.commands.length, 0)
  )

  const hasResults = computed(() => filteredCommandCount.value > 0)

  return {
    keyword,
    hasKeyword,
    hasResults,
    filteredSections,
    totalCommandCount,
    filteredCommandCount,
    highlightText,
    clearKeyword
  }
}
