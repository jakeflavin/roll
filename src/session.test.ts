import { describe, expect, it } from 'vitest'
import { addEntry, drawnFor, emptySession, groupByDay, startCycle } from './session'
import type { SessionEntry } from './session'

const entry = (over: Partial<SessionEntry> = {}): SessionEntry => ({
  value: 'Fox',
  sourceId: 'animal',
  sourceKey: 'animal',
  at: 1_000,
  ...over,
})

describe('addEntry', () => {
  it('appends without touching the original', () => {
    const before = emptySession
    const after = addEntry(before, entry())
    expect(after.entries).toHaveLength(1)
    expect(before.entries).toHaveLength(0)
  })

  it('keeps a long session bounded', () => {
    let session = emptySession
    for (let i = 0; i < 520; i++) session = addEntry(session, entry({ value: `v${i}` }))
    expect(session.entries).toHaveLength(500)
    // The oldest fall away, so the most recent are what remain.
    expect(session.entries.at(-1)?.value).toBe('v519')
    expect(session.entries[0]?.value).toBe('v20')
  })
})

describe('drawnFor', () => {
  const session = {
    entries: [
      entry({ value: 'Fox', sourceKey: 'animal', at: 100 }),
      entry({ value: 'Elk', sourceKey: 'animal', at: 200 }),
      entry({ value: 'Red', sourceKey: 'color', sourceId: 'color', at: 300 }),
    ],
    cycleStart: {},
  }

  it('only counts the pool asked about, so pools do not exclude each other', () => {
    expect(drawnFor(session, 'animal')).toEqual(new Set(['Fox', 'Elk']))
    expect(drawnFor(session, 'color')).toEqual(new Set(['Red']))
    expect(drawnFor(session, 'state')).toEqual(new Set())
  })

  it('counts only the current cycle, so starting over frees the pool again', () => {
    const restarted = { ...session, cycleStart: { animal: 150 } }
    expect(drawnFor(restarted, 'animal')).toEqual(new Set(['Elk']))
  })

  it('leaves the entries in place when a cycle restarts, since they are the history', () => {
    const restarted = startCycle(session, 'animal')
    expect(restarted.entries).toHaveLength(3)
    expect(drawnFor(restarted, 'animal')).toEqual(new Set())
  })
})

describe('groupByDay', () => {
  const now = new Date('2026-08-17T12:00:00').getTime()
  const day = 86_400_000

  it('labels today and yesterday, newest day first', () => {
    const days = groupByDay(
      [
        entry({ value: 'Old', at: now - day * 2 }),
        entry({ value: 'New', at: now }),
        entry({ value: 'Mid', at: now - day }),
      ],
      now,
    )
    expect(days.map((d) => d.label).slice(0, 2)).toEqual(['Today', 'Yesterday'])
    expect(days).toHaveLength(3)
    expect(days[0]?.entries[0]?.value).toBe('New')
  })

  it('orders newest first inside a day', () => {
    const [today] = groupByDay(
      [entry({ value: 'First', at: now - 5_000 }), entry({ value: 'Second', at: now })],
      now,
    )
    expect(today?.entries.map((e) => e.value)).toEqual(['Second', 'First'])
  })

  it('returns nothing for an empty session', () => {
    expect(groupByDay([], now)).toEqual([])
  })
})
