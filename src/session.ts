import type { SourceId } from './sources'

export type SessionEntry = {
  value: string
  sourceId: SourceId
  /** Captured at pick time, so a row stays labelled after its list is renamed or
   *  deleted. */
  sourceName?: string
  /** Pool identity, including range and casing, so exclusion is per pool. */
  sourceKey: string
  at: number
}

export type Session = {
  entries: SessionEntry[]
  /**
   * Per pool, the moment its current cycle began. Starting a pool over moves this
   * marker forward instead of deleting entries — the history is the point of the
   * session view, so it survives, while exclusion only looks at the current cycle.
   */
  cycleStart: Record<string, number>
}

export const emptySession: Session = { entries: [], cycleStart: {} }

/** Bounded so a long-running session cannot grow without limit. */
const MAX_ENTRIES = 500

const STORAGE_KEY = 'hat.session'

export function loadSession(): Session {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptySession
    const parsed = JSON.parse(raw) as Partial<Session>
    return {
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      cycleStart: parsed.cycleStart ?? {},
    }
  } catch {
    return emptySession
  }
}

export function saveSession(session: Session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // A full or blocked store should not break picking.
  }
}

export function addEntry(session: Session, entry: SessionEntry): Session {
  return {
    ...session,
    entries: [...session.entries, entry].slice(-MAX_ENTRIES),
  }
}

export function startCycle(session: Session, sourceKey: string): Session {
  return {
    ...session,
    cycleStart: { ...session.cycleStart, [sourceKey]: Date.now() },
  }
}

/** What the current cycle has already used, which is what no-repeat excludes. */
export function drawnFor(session: Session, sourceKey: string): Set<string> {
  const since = session.cycleStart[sourceKey] ?? 0
  const values = session.entries
    .filter((e) => e.sourceKey === sourceKey && e.at >= since)
    .map((e) => e.value)
  return new Set(values)
}

const startOfDay = (ms: number) => {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export type SessionDay = {
  label: string
  entries: SessionEntry[]
}

/** Newest first, within newest-first days, which is how the history gets read. */
export function groupByDay(entries: SessionEntry[], now = Date.now()): SessionDay[] {
  const today = startOfDay(now)
  const dayMs = 86_400_000
  const byDay = new Map<number, SessionEntry[]>()

  for (const entry of entries) {
    const day = startOfDay(entry.at)
    const list = byDay.get(day)
    if (list) list.push(entry)
    else byDay.set(day, [entry])
  }

  return [...byDay.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([day, list]) => ({
      label:
        day === today
          ? 'Today'
          : day === today - dayMs
            ? 'Yesterday'
            : new Date(day).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              }),
      entries: [...list].sort((a, b) => b.at - a.at),
    }))
}
