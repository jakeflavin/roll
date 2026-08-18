import { describe, expect, it } from 'vitest'
import { hasShareParams, settingsFromParams, settingsToParams } from './shareUrl'
import { defaultSettings } from './useSettings'

const base = defaultSettings
const parse = (query: string) => settingsFromParams(new URLSearchParams(query), base)

describe('settingsToParams', () => {
  it('writes one pick per group, in order', () => {
    const params = settingsToParams({ ...base, sourceIds: ['animal', 'color'] })
    expect(params.getAll('pick')).toEqual(['animal', 'color'])
  })

  it('writes each result separately, so a value with a comma survives', () => {
    const params = settingsToParams({ ...base, sourceIds: ['custom:a'] }, ['Nguyen, Anh'])
    expect(params.getAll('v')).toEqual(['Nguyen, Anh'])
    expect(parse(params.toString())).toBeTruthy()
    expect(new URLSearchParams(params.toString()).getAll('v')).toEqual(['Nguyen, Anh'])
  })

  it('only carries the range when a number group is in play', () => {
    expect(settingsToParams({ ...base, sourceIds: ['animal'] }).has('min')).toBe(false)
    expect(settingsToParams({ ...base, sourceIds: ['number'] }).get('min')).toBe('1')
  })

  it('states repeat explicitly, since an absent flag would take the reader’s default', () => {
    expect(settingsToParams({ ...base, repeat: false }).get('repeat')).toBe('0')
    expect(settingsToParams({ ...base, repeat: true }).get('repeat')).toBe('1')
  })
})

describe('settingsFromParams', () => {
  it('reads several groups back', () => {
    expect(parse('pick=animal&pick=color').sourceIds).toEqual(['animal', 'color'])
  })

  it('falls back when no group is named', () => {
    expect(parse('theme=noir').sourceIds).toEqual(base.sourceIds)
  })

  it('treats an empty value as absent rather than as zero', () => {
    // "?max=" once parsed as 0 and silently rewrote the range.
    expect(parse('min=&max=').max).toBe(base.max)
    expect(parse('min=abc').min).toBe(base.min)
    expect(parse('min=4&max=9').min).toBe(4)
  })

  it('truncates a fractional range to whole numbers', () => {
    expect(parse('min=2.7&max=9.9').min).toBe(2)
  })

  it('ignores a theme or animation it does not know', () => {
    expect(parse('theme=nope').themeId).toBe(base.themeId)
    expect(parse('anim=nope').animationId).toBe(base.animationId)
    expect(parse('theme=ember').themeId).toBe('ember')
  })

  it('reads an explicit off, not just an explicit on', () => {
    expect(parse('repeat=1').repeat).toBe(true)
    expect(parse('repeat=0').repeat).toBe(false)
  })
})

describe('round trip', () => {
  it('survives being written and read back', () => {
    const settings = {
      ...base,
      sourceIds: ['number', 'letter'],
      min: 3,
      max: 30,
      bothCases: true,
      repeat: true,
      themeId: 'mint',
      animationId: 'flip' as const,
    }
    expect(parse(settingsToParams(settings).toString())).toEqual(settings)
  })
})

describe('hasShareParams', () => {
  it('recognises a link that carries settings, and one that does not', () => {
    expect(hasShareParams(new URLSearchParams('pick=animal'))).toBe(true)
    expect(hasShareParams(new URLSearchParams('v=Fox'))).toBe(false)
    expect(hasShareParams(new URLSearchParams(''))).toBe(false)
  })
})

describe('custom theme in a link', () => {
  const custom = { ...base.customTheme, from: '#112233', to: '#445566', angle: 200, ink: 'dark' as const }

  it('carries the gradient when the custom theme is the one selected', () => {
    const params = settingsToParams({ ...base, themeId: 'custom', customTheme: custom })
    expect(params.get('theme')).toBe('custom')
    expect(params.get('bg')).toBe('112233-445566-200-dark')
  })

  it('leaves the gradient out of every other theme’s link', () => {
    expect(settingsToParams({ ...base, themeId: 'ember' }).has('bg')).toBe(false)
  })

  it('reads the gradient back out of a link', () => {
    const params = settingsToParams({ ...base, themeId: 'custom', customTheme: custom })
    expect(settingsFromParams(params, base).customTheme).toEqual(custom)
  })

  it('leaves this device’s own image alone, since a refresh reads back its own link', () => {
    const mine = {
      ...base,
      customTheme: { ...base.customTheme, mode: 'image' as const, image: 'data:image/jpeg;base64,a' },
    }
    const params = settingsToParams({ ...mine, themeId: 'custom' })
    const read = settingsFromParams(params, mine)
    expect(read.customTheme.mode).toBe('image')
    expect(read.customTheme.image).toBe('data:image/jpeg;base64,a')
  })

  it('ignores a hand-edited gradient that is not a colour', () => {
    const params = new URLSearchParams('theme=custom&bg=red-blue-9-light')
    const read = settingsFromParams(params, base)
    expect(read.customTheme.from).toBe(base.customTheme.from)
    expect(read.customTheme.angle).toBe(9)
  })
})
