export type CustomList = {
  id: string
  name: string
  items: string[]
}

const STORAGE_KEY = 'hat.lists'

/** Prefix marks an id as belonging to a user list rather than a built-in source. */
export const CUSTOM_PREFIX = 'custom:'

export const isCustomId = (id: string) => id.startsWith(CUSTOM_PREFIX)

export function newListId() {
  return `${CUSTOM_PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

export function loadLists(): CustomList[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isList) : []
  } catch {
    return []
  }
}

export function saveLists(lists: CustomList[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
  } catch {
    // A full or blocked store should not break picking.
  }
}

export function isList(value: unknown): value is CustomList {
  const l = (value ?? {}) as Record<string, unknown>
  return (
    typeof l.id === 'string' &&
    typeof l.name === 'string' &&
    Array.isArray(l.items) &&
    l.items.every((item) => typeof item === 'string')
  )
}

/** Trimmed, empties dropped, first occurrence wins — a roster should not gain a
 *  duplicate just because a spreadsheet had one. */
export function cleanItems(items: string[]) {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of items) {
    const item = raw.trim()
    if (!item || seen.has(item)) continue
    seen.add(item)
    out.push(item)
  }
  return out
}

/**
 * Splits CSV into rows of cells, honouring quoted fields so a name like
 * "Nguyen, Anh" survives as one cell rather than becoming two.
 */
function splitRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else quoted = false
      } else cell += char
      continue
    }

    if (char === '"') quoted = true
    else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += char
  }

  row.push(cell)
  rows.push(row)
  return rows
}

/**
 * One item per row, taken from the first column. Rosters exported from a spreadsheet
 * routinely carry extra columns like id or email, and pulling those in as pickable
 * options would be noise.
 */
export function parseCsv(text: string): string[] {
  return cleanItems(splitRows(text).map((row) => row[0] ?? ''))
}
