import { animations, type AnimationId } from './animations'
import { emptySession, type Session, type SessionEntry } from './session'
import { sources, type SourceId } from './sources'
import { themes } from './themes'
import type { Settings } from './useSettings'

/** Bumped only if the shape changes in a way an older file cannot satisfy. */
export const BACKUP_VERSION = 1

export type Backup = {
  app: 'roll'
  version: number
  exportedAt: string
  settings: Settings
  session: Session
}

export function buildBackup(settings: Settings, session: Session): Backup {
  return {
    app: 'roll',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    session,
  }
}

export function backupFilename(now = new Date()) {
  const date = now.toISOString().slice(0, 10)
  return `roll-${date}.json`
}

type Raw = Record<string, unknown>

const asInt = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : fallback

const asBool = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback

/** Every field is checked against what this build knows, so an edited or older file
 *  degrades to defaults rather than putting the app into a state it cannot render. */
function coerceSettings(raw: unknown, base: Settings): Settings {
  const r = (raw ?? {}) as Raw
  return {
    sourceId: sources.some((s) => s.id === r.sourceId) ? (r.sourceId as SourceId) : base.sourceId,
    min: asInt(r.min, base.min),
    max: asInt(r.max, base.max),
    bothCases: asBool(r.bothCases, base.bothCases),
    repeat: asBool(r.repeat, base.repeat),
    themeId: themes.some((t) => t.id === r.themeId) ? (r.themeId as string) : base.themeId,
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
    sources.some((s) => s.id === e.sourceId)
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
  if (data.app !== 'roll') throw new BackupError("That file isn't a Roll export.")
  if (typeof data.version !== 'number' || data.version > BACKUP_VERSION) {
    throw new BackupError('That export came from a newer version of Roll.')
  }

  return {
    settings: coerceSettings(data.settings, base),
    session: data.session ? coerceSession(data.session) : emptySession,
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
