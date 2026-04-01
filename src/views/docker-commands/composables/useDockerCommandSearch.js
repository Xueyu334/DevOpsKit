const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]))

const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const createHighlightHtml = (value, keyword) => {
  const source = String(value ?? '')

  if (!keyword) {
    return escapeHtml(source)
  }

  const matcher = new RegExp(`(${escapeRegExp(keyword)})`, 'ig')

  return source
    .split(matcher)
    .map((part) => {
      if (!part) {
        return ''
      }

      return part.toLowerCase() === keyword.toLowerCase()
        ? `<mark class="docker-highlight">${escapeHtml(part)}</mark>`
        : escapeHtml(part)
    })
    .join('')
}

const normalizeText = (value = '') => String(value).toLowerCase()

const matchesCommand = (command, keyword) => {
  if (!keyword) {
    return true
  }

  const searchableFields = [
    command.name,
    command.command,
    command.desc,
    command.scene,
    ...(command.options || []).flatMap((option) => [option.key, option.desc])
  ]

  return searchableFields.some((field) => normalizeText(field).includes(keyword))
}

export const useDockerCommandSearch = (sectionsSource) => {
  const keyword = shallowRef('')
  const normalizedKeyword = computed(() => normalizeText(keyword.value.trim()))

  const filteredSections = computed(() => {
    const sections = unref(sectionsSource) || []
    const currentKeyword = normalizedKeyword.value

    return sections
      .map((section) => ({
        ...section,
        commands: section.commands.filter((command) => matchesCommand(command, currentKeyword))
      }))
      .filter((section) => section.commands.length > 0)
  })

  const totalCommandCount = computed(() =>
    (unref(sectionsSource) || []).reduce((total, section) => total + section.commands.length, 0)
  )

  const filteredCommandCount = computed(() =>
    filteredSections.value.reduce((total, section) => total + section.commands.length, 0)
  )

  const hasKeyword = computed(() => Boolean(keyword.value.trim()))
  const hasResults = computed(() => filteredCommandCount.value > 0)

  const highlightText = (value) => createHighlightHtml(value, normalizedKeyword.value)

  const clearKeyword = () => {
    keyword.value = ''
  }

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
