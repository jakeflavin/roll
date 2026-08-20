import { describe, expect, it } from 'vitest'
import { charCount, fitScale, lineCount, MAX_LINE_CHARS } from './fit'

describe('fitScale', () => {
  it('leaves short values at full size', () => {
    expect(fitScale(1)).toBe(1)
    expect(fitScale(5)).toBe(1)
  })

  it('scales a longer value down in proportion to its length', () => {
    expect(fitScale(10)).toBeCloseTo(0.5)
  })

  it('stops shrinking at the floor, however long the value is', () => {
    // The reason the floor exists: a 43-character entry used to resolve to 0.116, which
    // put it on screen smaller than the 11px label naming it.
    const floor = fitScale(MAX_LINE_CHARS)
    expect(fitScale(43)).toBe(floor)
    expect(fitScale(400)).toBe(floor)
    expect(floor).toBeGreaterThan(0.3)
  })

  it('never returns something a font size cannot use', () => {
    for (const chars of [0, -1, Number.NaN]) {
      expect(fitScale(chars)).toBeGreaterThan(0)
      expect(fitScale(chars)).toBeLessThanOrEqual(1)
    }
  })
})

describe('lineCount', () => {
  it('keeps anything up to a full line on one line', () => {
    expect(lineCount(1)).toBe(1)
    expect(lineCount(MAX_LINE_CHARS)).toBe(1)
  })

  it('adds the lines a value past the floor has to wrap onto', () => {
    expect(lineCount(MAX_LINE_CHARS + 1)).toBe(2)
    expect(lineCount(43)).toBe(4)
  })
})

describe('charCount', () => {
  it('counts an emoji as the one character a reader sees', () => {
    expect(charCount('🦊')).toBe(1)
    expect(charCount('Bo')).toBe(2)
  })
})
