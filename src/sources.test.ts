import { describe, expect, it } from 'vitest'
import { animals } from './data'
import { createSource, resolveSourceId, sourceKeyFor } from './sources'

const config = { sourceId: 'number', min: 1, max: 10, bothCases: false }

describe('number source', () => {
  it('only ever picks inside the range, whichever way round it is given', () => {
    const source = createSource({ ...config, min: 10, max: 1 })
    for (let i = 0; i < 200; i++) {
      const n = Number(source.pick())
      expect(n).toBeGreaterThanOrEqual(1)
      expect(n).toBeLessThanOrEqual(10)
    }
  })

  it('vets a value against the range, which is what a URL value is checked with', () => {
    const source = createSource(config)
    expect(source.has('5')).toBe(true)
    expect(source.has('11')).toBe(false)
    expect(source.has('Nebraska')).toBe(false)
    expect(source.has('5.5')).toBe(false)
  })

  it('works through the whole range without repeating, then reports it is spent', () => {
    const source = createSource({ ...config, min: 1, max: 5 })
    const drawn = new Set<string>()
    for (let i = 0; i < 5; i++) {
      const value = source.pickExcluding(drawn)
      expect(value).not.toBeNull()
      expect(drawn.has(value!)).toBe(false)
      drawn.add(value!)
    }
    expect(source.pickExcluding(drawn)).toBeNull()
  })

  it('finds the last free value rather than giving up on a nearly spent range', () => {
    // Retrying at random fails often here, so it has to fall back to listing what is
    // left; returning null would wrongly report the pool as spent.
    const source = createSource({ ...config, min: 1, max: 60 })
    const drawn = new Set(Array.from({ length: 59 }, (_, i) => String(i + 1)))
    for (let attempt = 0; attempt < 50; attempt++) {
      expect(source.pickExcluding(drawn)).toBe('60')
    }
  })

  it('still finds a free value in a range too large to enumerate', () => {
    const source = createSource({ ...config, min: 1, max: 5_000_000 })
    const drawn = new Set(['1', '2', '3'])
    const value = source.pickExcluding(drawn)
    expect(value).not.toBeNull()
    expect(drawn.has(value!)).toBe(false)
  })
})

describe('list sources', () => {
  it('draws from the pool and reports its size', () => {
    const source = createSource({ ...config, sourceId: 'animal' })
    expect(source.size).toBe(animals.length)
    expect(animals).toContain(source.pick())
  })

  it('offers every letter case only when asked', () => {
    const upper = createSource({ ...config, sourceId: 'letter', bothCases: false })
    const both = createSource({ ...config, sourceId: 'letter', bothCases: true })
    expect(upper.size).toBe(26)
    expect(both.size).toBe(52)
    expect(upper.has('a')).toBe(false)
    expect(both.has('a')).toBe(true)
  })
})

describe('custom lists', () => {
  const lists = [{ id: 'custom:a', name: 'Roster', items: ['Ada', 'Grace'] }]

  it('draws from the named list', () => {
    const source = createSource({ ...config, sourceId: 'custom:a' }, lists)
    expect(['Ada', 'Grace']).toContain(source.pick())
    expect(source.size).toBe(2)
  })

  it('reports empty rather than throwing when the list has nothing in it', () => {
    const source = createSource({ ...config, sourceId: 'custom:b' }, [
      { id: 'custom:b', name: 'Empty', items: [] },
    ])
    expect(source.size).toBe(0)
    expect(source.pickExcluding(new Set())).toBeNull()
  })

  it('reports empty for a list this browser has never seen', () => {
    expect(createSource({ ...config, sourceId: 'custom:missing' }, lists).size).toBe(0)
  })
})

describe('sourceKeyFor', () => {
  it('keys a number pool by its range', () => {
    expect(sourceKeyFor({ ...config, min: 1, max: 10 })).toBe('number:1:10')
    expect(sourceKeyFor({ ...config, min: 10, max: 1 })).toBe('number:1:10')
  })

  it('ignores settings that do not shape the pool, so history is not orphaned', () => {
    // Editing a range while on animals must not reset the animals' history, and
    // editing a custom list's entries must not reset its own.
    const a = sourceKeyFor({ sourceId: 'animal', min: 1, max: 10, bothCases: false })
    const b = sourceKeyFor({ sourceId: 'animal', min: 4, max: 99, bothCases: true })
    expect(a).toBe(b)
    expect(sourceKeyFor({ ...config, sourceId: 'custom:a' })).toBe('custom:a')
  })

  it('keys letters by their casing, which does change the pool', () => {
    expect(sourceKeyFor({ ...config, sourceId: 'letter', bothCases: false })).toBe('letter:false')
    expect(sourceKeyFor({ ...config, sourceId: 'letter', bothCases: true })).toBe('letter:true')
  })
})

describe('resolveSourceId', () => {
  const lists = [{ id: 'custom:a', name: 'Roster', items: ['Ada'] }]

  it('keeps ids that exist and falls back for ones that do not', () => {
    expect(resolveSourceId('animal', lists)).toBe('animal')
    expect(resolveSourceId('custom:a', lists)).toBe('custom:a')
    expect(resolveSourceId('custom:gone', lists)).toBe('number')
    expect(resolveSourceId('nonsense', lists)).toBe('number')
  })
})
