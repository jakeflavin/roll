import { animations, type AnimationId } from './animations'
import { isCustomId, isList, type CustomList } from './lists'
import { emptySession, type Session, type SessionEntry } from './session'
import { sources, type SourceId } from './sources'
import { isThemeId, sanitizeCustomTheme } from './themes'
import type { Settings } from './useSettings'

/** Bumped only if the shape changes in a way an older file cannot satisfy. */
export const BACKUP_VERSION = 1

export type Backup = {
  app: 'hat'
  version: number
  exportedAt: string
  settings: Settings
  session: Session
  /** Custom lists travel with the backup, so nothing has to be re-entered. */
  lists: CustomList[]
}

export function buildBackup(
  settings: Settings,
  session: Session,
  lists: CustomList[],
): Backup {
  return {
    app: 'hat',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    session,
    lists,
  }
}

export function backupFilename(now = new Date()) {
  const date = now.toISOString().slice(0, 10)
  return `hat-${date}.json`
}

type Raw = Record<string, unknown>

const asInt = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : fallback

const asBool = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback

/** Every field is checked against what this build knows, so an edited or older file
 *  degrades to defaults rather than putting the app into a state it cannot render. */
function coerceSettings(raw: unknown, base: Settings, lists: CustomList[] = []): Settings {
  const r = (raw ?? {}) as Raw
  const knows = (id: unknown) =>
    typeof id === 'string' &&
    (lists.some((l) => l.id === id) || sources.some((s) => s.id === id))

  // Files written before multi-pick carry a single `sourceId` instead of a list.
  const rawIds = Array.isArray(r.sourceIds)
    ? r.sourceIds
    : r.sourceId !== undefined
      ? [r.sourceId]
      : []
  const sourceIds = rawIds.filter(knows) as SourceId[]

  return {
    sourceIds: sourceIds.length ? sourceIds : base.sourceIds,
    min: asInt(r.min, base.min),
    max: asInt(r.max, base.max),
    bothCases: asBool(r.bothCases, base.bothCases),
    repeat: asBool(r.repeat, base.repeat),
    themeId: isThemeId(r.themeId) ? (r.themeId as string) : base.themeId,
    customTheme: sanitizeCustomTheme(r.customTheme, base.customTheme),
    animationId: animations.some((a) => a.id === r.animationId)
      ? (r.animationId as AnimationId)
      : base.animationId,
  }
}

function isEntry(value: unknown): value is SessionEntry {
  const e = (value ?? {}) as Raw
  return (
    typeof e.value === 'string' &&
    typeof e.sourceKey === 'string' &&
    typeof e.at === 'number' &&
    Number.isFinite(e.at) &&
    typeof e.sourceId === 'string' &&
    // Custom lists have generated ids, so an entry from one is valid even though it
    // matches no built-in source.
    (isCustomId(e.sourceId) || sources.some((s) => s.id === e.sourceId))
  )
}

/** Unreadable entries are dropped rather than failing the whole import — one bad row
 *  should not cost someone the rest of their history. */
function coerceSession(raw: unknown): Session {
  const r = (raw ?? {}) as Raw
  const entries = Array.isArray(r.entries) ? r.entries.filter(isEntry) : []

  const cycleStart: Record<string, number> = {}
  const rawCycles = (r.cycleStart ?? {}) as Raw
  for (const [key, value] of Object.entries(rawCycles)) {
    if (typeof value === 'number' && Number.isFinite(value)) cycleStart[key] = value
  }

  return { entries, cycleStart }
}

export type ParsedBackup = {
  settings: Settings
  session: Session
  lists: CustomList[]
}

export class BackupError extends Error {}

export function parseBackup(text: string, base: Settings): ParsedBackup {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new BackupError("That file isn't valid JSON.")
  }

  const data = (raw ?? {}) as Raw
  // 'roll' is what the app was called before it was Hat; those files still load.
  if (data.app !== 'hat' && data.app !== 'roll') {
    throw new BackupError("That file isn't a Hat export.")
  }
  if (typeof data.version !== 'number' || data.version > BACKUP_VERSION) {
    throw new BackupError('That export came from a newer version of Hat.')
  }

  const lists = Array.isArray(data.lists) ? data.lists.filter(isList) : []
  return {
    // Validated against the incoming lists, so a backup whose source is one of its own
    // custom lists keeps that selection instead of falling back.
    settings: coerceSettings(data.settings, base, lists),
    session: data.session ? coerceSession(data.session) : emptySession,
    lists,
  }
}

export function downloadBackup(backup: Backup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = backupFilename()
  link.click()
  // Revoking immediately can cancel the download in some browsers, so it waits a tick.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
