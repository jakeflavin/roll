import { describe, expect, it } from 'vitest'
import { BACKUP_VERSION, BackupError, backupFilename, buildBackup, parseBackup } from './backup'
import { emptySession } from './session'
import { defaultSettings } from './useSettings'

const base = defaultSettings

const file = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    app: 'roll',
    version: BACKUP_VERSION,
    settings: { ...base, sourceIds: ['animal'], themeId: 'ember' },
    session: emptySession,
    lists: [],
    ...over,
  })

describe('parseBackup rejections', () => {
  it('refuses anything that is not JSON', () => {
    expect(() => parseBackup('not json', base)).toThrow(BackupError)
  })

  it('refuses another app’s export', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'other', version: 1 }), base)).toThrow(
      /isn't a Roll export/,
    )
  })

  it('refuses a file from a newer version it cannot understand', () => {
    expect(() => parseBackup(file({ version: BACKUP_VERSION + 1 }), base)).toThrow(/newer version/)
  })
})

describe('parseBackup coercion', () => {
  it('reads a well-formed file', () => {
    const parsed = parseBackup(file(), base)
    expect(parsed.settings.sourceIds).toEqual(['animal'])
    expect(parsed.settings.themeId).toBe('ember')
  })

  it('understands a file written before multi-pick, which had a single source', () => {
    const legacy = file({ settings: { ...base, sourceId: 'feeling', sourceIds: undefined } })
    expect(parseBackup(legacy, base).settings.sourceIds).toEqual(['feeling'])
  })

  it('keeps a selection naming one of the file’s own custom lists', () => {
    const withList = file({
      settings: { ...base, sourceIds: ['custom:a'] },
      lists: [{ id: 'custom:a', name: 'Roster', items: ['Ada'] }],
    })
    const parsed = parseBackup(withList, base)
    expect(parsed.settings.sourceIds).toEqual(['custom:a'])
    expect(parsed.lists).toHaveLength(1)
  })

  it('falls back for a theme or animation this build does not have', () => {
    const odd = file({ settings: { ...base, themeId: 'nope', animationId: 'nope' } })
    const parsed = parseBackup(odd, base)
    expect(parsed.settings.themeId).toBe(base.themeId)
    expect(parsed.settings.animationId).toBe(base.animationId)
  })

  it('keeps the readable entries and drops only the damaged ones', () => {
    const messy = file({
      session: {
        entries: [
          { value: '1', sourceId: 'number', sourceKey: 'number:1:10', at: 1 },
          // A custom list's entry is valid even though it matches no built-in source.
          { value: 'Ada', sourceId: 'custom:a', sourceKey: 'custom:a', at: 2 },
          { value: 'x', sourceId: 'not-a-source', sourceKey: 'k', at: 3 },
          { nonsense: true },
          null,
        ],
        cycleStart: { 'number:1:10': 5, bad: 'nope' },
      },
    })
    const parsed = parseBackup(messy, base)
    expect(parsed.session.entries.map((e) => e.value)).toEqual(['1', 'Ada'])
    expect(parsed.session.cycleStart).toEqual({ 'number:1:10': 5 })
  })

  it('survives a file with no session or lists at all', () => {
    const bare = JSON.stringify({ app: 'roll', version: BACKUP_VERSION })
    const parsed = parseBackup(bare, base)
    expect(parsed.session.entries).toEqual([])
    expect(parsed.lists).toEqual([])
  })
})

describe('buildBackup', () => {
  it('carries settings, session, and lists together', () => {
    const lists = [{ id: 'custom:a', name: 'Roster', items: ['Ada'] }]
    const backup = buildBackup(base, emptySession, lists)
    expect(backup.app).toBe('roll')
    expect(backup.lists).toEqual(lists)
  })

  it('round-trips through parse unchanged', () => {
    const lists = [{ id: 'custom:a', name: 'Roster', items: ['Ada', 'Grace'] }]
    const session = { entries: [], cycleStart: { animal: 12 } }
    const backup = buildBackup({ ...base, sourceIds: ['custom:a'] }, session, lists)
    const parsed = parseBackup(JSON.stringify(backup), base)
    expect(parsed.settings.sourceIds).toEqual(['custom:a'])
    expect(parsed.lists).toEqual(lists)
    expect(parsed.session.cycleStart).toEqual({ animal: 12 })
  })
})

describe('backupFilename', () => {
  it('is dated, so successive exports do not collide', () => {
    expect(backupFilename(new Date('2026-08-17T12:00:00Z'))).toBe('roll-2026-08-17.json')
  })
})
