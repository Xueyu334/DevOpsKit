export const TOOL_USAGE_STORAGE_KEY = 'devopskit-tool-usage'

export function parseToolUsage(raw, toolIds) {
  try {
    const value = JSON.parse(raw)
    if (value?.version !== 1 || !value.tools || typeof value.tools !== 'object' || Array.isArray(value.tools)) return {}
    return Object.fromEntries(
      toolIds.flatMap(id => {
        const record = value.tools[id]
        if (
          !record ||
          !Number.isSafeInteger(record.count) ||
          record.count <= 0 ||
          !Number.isSafeInteger(record.lastVisitedAt) ||
          record.lastVisitedAt <= 0
        )
          return []
        return [[id, { count: record.count, lastVisitedAt: record.lastVisitedAt }]]
      })
    )
  } catch {
    return {}
  }
}

export function incrementToolUsage(records, toolId, timestamp) {
  return {
    ...records,
    [toolId]: {
      count: Math.min((records[toolId]?.count || 0) + 1, Number.MAX_SAFE_INTEGER),
      lastVisitedAt: timestamp
    }
  }
}

export function rankFrequentTools(tools, records, limit = 4) {
  return tools
    .filter(tool => records[tool.id]?.count > 0)
    .map(tool => ({ ...tool, visitCount: records[tool.id].count, lastVisitedAt: records[tool.id].lastVisitedAt }))
    .sort((a, b) => b.visitCount - a.visitCount || b.lastVisitedAt - a.lastVisitedAt || a.id.localeCompare(b.id))
    .slice(0, limit)
}
