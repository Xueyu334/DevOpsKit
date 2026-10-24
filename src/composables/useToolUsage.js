import { toolCategories } from '@/config/tool-categories'
import { TOOL_USAGE_STORAGE_KEY, parseToolUsage, incrementToolUsage, rankFrequentTools } from '@/utils/tool-usage'

const tools = toolCategories.flatMap(category => category.tools).filter(tool => tool.route)
const toolIds = tools.map(tool => tool.id)
const toolsByPath = new Map(tools.map(tool => [tool.route, tool]))
let storageAvailable = true

function readUsage() {
  if (!storageAvailable) return null
  try {
    return parseToolUsage(window.localStorage.getItem(TOOL_USAGE_STORAGE_KEY), toolIds)
  } catch {
    storageAvailable = false
    return null
  }
}

const usage = shallowRef(readUsage() || {})

function saveUsage() {
  if (!storageAvailable) return
  try {
    window.localStorage.setItem(TOOL_USAGE_STORAGE_KEY, JSON.stringify({ version: 1, tools: usage.value }))
  } catch {
    storageAvailable = false
    // 存储不可用时继续使用本次会话的记录，不影响导航。
  }
}

export function recordToolVisit(path) {
  const tool = toolsByPath.get(path.replace(/\/+$/, '') || '/')
  if (!tool) return
  usage.value = incrementToolUsage(readUsage() ?? usage.value, tool.id, Date.now())
  saveUsage()
}

export function useToolUsage() {
  const frequentTools = computed(() => rankFrequentTools(tools, usage.value))

  // 返回首页或其他标签页修改记录时，读取最新本地数据。
  onMounted(() => {
    usage.value = readUsage() ?? usage.value
  })
  useEventListener(window, 'storage', event => {
    if (event.key === TOOL_USAGE_STORAGE_KEY || event.key === null) usage.value = readUsage() ?? usage.value
  })

  function clearUsage() {
    usage.value = {}
    saveUsage()
  }

  return { frequentTools, clearUsage }
}
