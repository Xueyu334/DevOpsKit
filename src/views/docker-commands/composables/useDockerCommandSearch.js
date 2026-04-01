import Fuse from 'fuse.js'

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

const normalizeText = (value = '') => String(value).trim().toLowerCase()

export const useDockerCommandSearch = (sectionsSource) => {
    const keyword = shallowRef('')
    const normalizedKeyword = computed(() => normalizeText(keyword.value.trim()))
    const flatCommands = computed(() =>
        (unref(sectionsSource) || []).flatMap((section) =>
            section.commands.map((command) => ({
                ...command,
                sectionKey: section.key
            }))
        )
    )

    const commandsFuse = computed(() => new Fuse(flatCommands.value, {
        includeScore: true,
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 2,
        keys: [
            {name: 'name', weight: 0.3},
            {name: 'command', weight: 0.25},
            {name: 'desc', weight: 0.15},
            {name: 'scene', weight: 0.15},
            {name: 'options.key', weight: 0.1},
            {name: 'options.desc', weight: 0.05}
        ]
    }))

    const matchedCommandIds = computed(() => {
        const currentKeyword = keyword.value.trim()

        if (!currentKeyword) {
            return new Set(flatCommands.value.map((command) => command.id))
        }

        return new Set(commandsFuse.value.search(currentKeyword).map((result) => result.item.id))
    })

    const filteredSections = computed(() => {
        const sections = unref(sectionsSource) || []

        return sections
            .map((section) => ({
                ...section,
                commands: section.commands.filter((command) => matchedCommandIds.value.has(command.id))
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
