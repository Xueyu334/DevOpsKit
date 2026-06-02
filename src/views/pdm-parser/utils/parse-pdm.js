const XML_PARSER_ERROR_TAG = 'parsererror'

export function parsePdmXml(xmlText) {
  const document = new DOMParser().parseFromString(xmlText, 'application/xml')

  if (document.getElementsByTagName(XML_PARSER_ERROR_TAG).length > 0) {
    throw new Error('PDM 文件不是有效的 XML 格式')
  }

  const tables = getAllByTag(document, 'o:Table').filter(tableNode => hasDirectChild(tableNode, 'c:Columns'))
  const tableById = new Map()
  const columnById = new Map()

  const parsedTables = tables.map((tableNode, index) => {
    const table = parseTable(tableNode, index)
    tableById.set(table.id, table)
    table.columns.forEach(column => columnById.set(column.id, column))
    return table
  })

  const relations = parseRelations(document, tableById, columnById)
  const meta = parseModelMeta(document, parsedTables.length, relations.length)
  const groups = parseGroups(document, tableById)

  return {
    meta,
    tables: parsedTables,
    groups,
    relations
  }
}

function parseModelMeta(document, tableCount, relationCount) {
  const modelNode = getAllByTag(document, 'o:Model')[0] || document.documentElement

  return {
    name: getText(modelNode, 'a:Name') || '未命名模型',
    code: getText(modelNode, 'a:Code'),
    comment: getText(modelNode, 'a:Comment'),
    tableCount,
    relationCount
  }
}

function parseTable(tableNode, index) {
  const id = getNodeId(tableNode) || `table-${index}`
  const keyColumns = getPrimaryKeyColumnIds(tableNode)
  const columns = getDirectContainerChildren(tableNode, 'c:Columns', 'o:Column').map((columnNode, columnIndex) =>
    parseColumn(columnNode, columnIndex, keyColumns)
  )

  return {
    id,
    name: getText(tableNode, 'a:Name') || getText(tableNode, 'a:Code') || id,
    code: getText(tableNode, 'a:Code') || getText(tableNode, 'a:Name') || id,
    comment: getText(tableNode, 'a:Comment'),
    columns
  }
}

function parseColumn(columnNode, index, keyColumns) {
  const id = getNodeId(columnNode) || `column-${index}`
  const code = getText(columnNode, 'a:Code') || getText(columnNode, 'a:Name') || id
  const dataType = getText(columnNode, 'a:DataType')

  return {
    id,
    name: getText(columnNode, 'a:Name') || code,
    code,
    dataType,
    length: getText(columnNode, 'a:Length'),
    precision: getText(columnNode, 'a:Precision'),
    mandatory: isTruthyFlag(getText(columnNode, 'a:Mandatory')),
    primaryKey: keyColumns.has(id),
    comment: getText(columnNode, 'a:Comment')
  }
}

function getPrimaryKeyColumnIds(tableNode) {
  const primaryKeyRef = getFirstRef(getDirectContainerChildren(tableNode, 'c:PrimaryKey', 'o:Key')[0])
  if (!primaryKeyRef) return new Set()

  const keys = getDirectContainerChildren(tableNode, 'c:Keys', 'o:Key')
  const primaryKey = keys.find(key => getNodeId(key) === primaryKeyRef)
  if (!primaryKey) return new Set()

  return new Set(
    getDirectContainerChildren(primaryKey, 'c:Key.Columns', 'o:Column')
      .map(columnRefNode => getFirstRef(columnRefNode))
      .filter(Boolean)
  )
}

function parseGroups(document, tableById) {
  const modelNode = getAllByTag(document, 'o:Model')[0] || document.documentElement
  const assignedTableIds = new Set()

  const groups = getDirectContainerChildren(modelNode, 'c:Packages', 'o:Package')
    .map((packageNode, index) => parsePackageGroup(packageNode, tableById, assignedTableIds, `package-${index}`))
    .filter(group => group.children.length > 0)

  const ungroupedTables = Array.from(tableById.values()).filter(table => !assignedTableIds.has(table.id))
  if (ungroupedTables.length > 0) {
    groups.push({
      id: 'ungrouped',
      name: '未分组',
      code: '',
      type: 'group',
      tableCount: ungroupedTables.length,
      children: ungroupedTables.map(table => ({
        ...pickTableRef(table),
        type: 'table',
        columnCount: table.columns.length
      }))
    })
  }

  return groups
}

function parsePackageGroup(packageNode, tableById, assignedTableIds, fallbackId) {
  const tableChildren = getDirectContainerChildren(packageNode, 'c:Tables', 'o:Table')
    .map(tableNode => tableById.get(getNodeId(tableNode) || getFirstRef(tableNode)))
    .filter(Boolean)

  tableChildren.forEach(table => assignedTableIds.add(table.id))

  const nestedGroups = getDirectContainerChildren(packageNode, 'c:Packages', 'o:Package')
    .map((childPackageNode, index) =>
      parsePackageGroup(childPackageNode, tableById, assignedTableIds, `${fallbackId}-${index}`)
    )
    .filter(group => group.children.length > 0)

  const children = [
    ...nestedGroups,
    ...tableChildren.map(table => ({
      ...pickTableRef(table),
      type: 'table',
      columnCount: table.columns.length
    }))
  ]

  return {
    id: getNodeId(packageNode) || fallbackId,
    name: getText(packageNode, 'a:Name') || getText(packageNode, 'a:Code') || '未命名分组',
    code: getText(packageNode, 'a:Code'),
    type: 'group',
    tableCount: children.reduce((count, child) => count + (child.type === 'table' ? 1 : child.tableCount || 0), 0),
    children
  }
}

function parseRelations(document, tableById, columnById) {
  return getAllByTag(document, 'o:Reference').map((referenceNode, index) => {
    const parentTable = tableById.get(
      getFirstRef(getDirectContainerChildren(referenceNode, 'c:ParentTable', 'o:Table')[0])
    )
    const childTable = tableById.get(
      getFirstRef(getDirectContainerChildren(referenceNode, 'c:ChildTable', 'o:Table')[0])
    )
    const joins = getDirectContainerChildren(referenceNode, 'c:Joins', 'o:ReferenceJoin').map(joinNode => ({
      parentColumn: columnById.get(getFirstRef(getDirectContainerChildren(joinNode, 'c:Object1', 'o:Column')[0])),
      childColumn: columnById.get(getFirstRef(getDirectContainerChildren(joinNode, 'c:Object2', 'o:Column')[0]))
    }))

    return {
      id: getNodeId(referenceNode) || `relation-${index}`,
      name: getText(referenceNode, 'a:Name') || getText(referenceNode, 'a:Code') || `关系 ${index + 1}`,
      code: getText(referenceNode, 'a:Code'),
      parentTable: parentTable ? pickTableRef(parentTable) : null,
      childTable: childTable ? pickTableRef(childTable) : null,
      joins: joins
        .filter(join => join.parentColumn || join.childColumn)
        .map(join => ({
          parentColumn: join.parentColumn ? pickColumnRef(join.parentColumn) : null,
          childColumn: join.childColumn ? pickColumnRef(join.childColumn) : null
        }))
    }
  })
}

function getDirectContainerChildren(node, containerTag, childTag) {
  const container = getDirectChildren(node, containerTag)[0]
  if (!container) return []
  return getDirectChildren(container, childTag)
}

function getText(node, tagName) {
  const child = getDirectChildren(node, tagName)[0]
  return child?.textContent?.trim() || ''
}

function hasDirectChild(node, tagName) {
  return getDirectChildren(node, tagName).length > 0
}

function getDirectChildren(node, tagName) {
  return Array.from(node?.childNodes || []).filter(child => isElementTag(child, tagName))
}

function getAllByTag(node, tagName) {
  return Array.from(node.getElementsByTagName(tagName))
}

function isElementTag(node, tagName) {
  if (node.nodeType !== Node.ELEMENT_NODE) return false

  const localName = tagName.includes(':') ? tagName.split(':')[1] : tagName
  return node.nodeName === tagName || node.localName === localName
}

function getNodeId(node) {
  return node?.getAttribute('Id') || ''
}

function getFirstRef(node) {
  return node?.getAttribute('Ref') || ''
}

function isTruthyFlag(value) {
  return value === '1' || value.toLowerCase() === 'true'
}

function pickTableRef(table) {
  return {
    id: table.id,
    name: table.name,
    code: table.code
  }
}

function pickColumnRef(column) {
  return {
    id: column.id,
    name: column.name,
    code: column.code
  }
}
