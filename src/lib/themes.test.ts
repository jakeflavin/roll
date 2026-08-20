import { describe, expect, it } from 'vitest'
import {
  buildCustomTheme,
  CUSTOM_THEME_ID,
  defaultCustomTheme,
  defaultTheme,
  isThemeId,
  resolveTheme,
  sanitizeCustomTheme,
  themes,
} from './themes'

const custom = defaultCustomTheme

describe('sanitizeCustomTheme', () => {
  it('keeps values it recognises', () => {
    const clean = sanitizeCustomTheme({
      mode: 'image',
      from: '#AABBCC',
      to: '#123456',
      angle: 45,
      image: 'data:image/jpeg;base64,abc',
      ink: 'dark',
    })
    expect(clean).toEqual({
      mode: 'image',
      from: '#AABBCC',
      to: '#123456',
      angle: 45,
      image: 'data:image/jpeg;base64,abc',
      ink: 'dark',
    })
  })

  it('refuses colours that are not hex, so nothing unparseable reaches the CSS', () => {
    const clean = sanitizeCustomTheme({ from: 'red; background: url(x)', to: '#fff' })
    expect(clean.from).toBe(custom.from)
    expect(clean.to).toBe(custom.to)
  })

  it('refuses an image from anywhere but this device', () => {
    expect(sanitizeCustomTheme({ image: 'https://example.com/a.png' }).image).toBeNull()
    expect(sanitizeCustomTheme({ image: 'javascript:alert(1)' }).image).toBeNull()
  })

  it('wraps the angle rather than letting it out of range', () => {
    expect(sanitizeCustomTheme({ angle: 400 }).angle).toBe(40)
    expect(sanitizeCustomTheme({ angle: -20 }).angle).toBe(340)
    expect(sanitizeCustomTheme({ angle: 'sideways' }).angle).toBe(custom.angle)
  })
})

describe('buildCustomTheme', () => {
  it('paints the gradient the user chose', () => {
    const theme = buildCustomTheme({ ...custom, from: '#000000', to: '#ffffff', angle: 90 })
    expect(theme.background).toBe('linear-gradient(90deg, #000000 0%, #ffffff 100%)')
  })

  it('keeps the gradient underneath an image, so a slow decode is never a blank page', () => {
    const theme = buildCustomTheme({ ...custom, mode: 'image', image: 'data:image/jpeg;base64,a' })
    expect(theme.background).toContain('url("data:image/jpeg;base64,a")')
    expect(theme.background).toContain(`linear-gradient(${custom.angle}deg`)
  })

  it('falls back to the gradient when image mode has no image yet', () => {
    const theme = buildCustomTheme({ ...custom, mode: 'image', image: null })
    expect(theme.background).not.toContain('url(')
  })

  it('flips the chrome with the ink', () => {
    expect(buildCustomTheme({ ...custom, ink: 'light' }).text).not.toBe(
      buildCustomTheme({ ...custom, ink: 'dark' }).text,
    )
  })
})

describe('resolveTheme', () => {
  it('builds the custom theme and looks up every other one', () => {
    expect(resolveTheme(CUSTOM_THEME_ID, custom).background).toBe(
      buildCustomTheme(custom).background,
    )
    expect(resolveTheme('ember', custom).name).toBe('Ember')
    expect(resolveTheme('nonsense', custom)).toBe(defaultTheme)
  })

  it('accepts custom as a theme id, which is what a link and an export are checked with', () => {
    expect(isThemeId(CUSTOM_THEME_ID)).toBe(true)
    expect(isThemeId('paper')).toBe(true)
    expect(isThemeId('nonsense')).toBe(false)
  })
})

type Rgb = [number, number, number]

/** sRGB relative luminance, as WCAG defines it. */
function luminance([r, g, b]: Rgb) {
  const channel = (v: number) => {
    const n = v / 255
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrast(a: Rgb, b: Rgb) {
  const hi = Math.max(luminance(a), luminance(b))
  const lo = Math.min(luminance(a), luminance(b))
  return (hi + 0.05) / (lo + 0.05)
}

/** `rgb()`, `rgba()` or `#rrggbb` as channels, with any alpha kept separate. */
function parse(color: string): { rgb: Rgb; alpha: number } {
  if (color.startsWith('#')) {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16))
    return { rgb: [r ?? 0, g ?? 0, b ?? 0], alpha: 1 }
  }
  const parts = color
    .slice(color.indexOf('(') + 1, color.indexOf(')'))
    .split(',')
    .map(Number)
  const [r, g, b, a] = parts
  return { rgb: [r ?? 0, g ?? 0, b ?? 0], alpha: a ?? 1 }
}

/** What a translucent ink actually looks like once it is painted onto a ground. */
function over(ink: string, ground: string): Rgb {
  const top = parse(ink)
  const bottom = parse(ground)
  const mix = (i: number) => top.alpha * top.rgb[i]! + (1 - top.alpha) * bottom.rgb[i]!
  return [mix(0), mix(1), mix(2)]
}

describe('colour scheme', () => {
  it('tells the browser which way each theme goes', () => {
    // Everything the browser draws itself — number spinners, the select popup, the
    // caret, scrollbars — reads this and nothing else, and four of these are light.
    for (const theme of themes) {
      const expected = luminance(parse(theme.text).rgb) > 0.5 ? 'dark' : 'light'
      expect(theme.scheme, theme.id).toBe(expected)
    }
  })

  it('takes the custom scheme from the ink the user chose', () => {
    expect(buildCustomTheme({ ...custom, ink: 'light' }).scheme).toBe('dark')
    expect(buildCustomTheme({ ...custom, ink: 'dark' }).scheme).toBe('light')
  })
})

describe('the quiet ink', () => {
  it('carries small text past 4.5:1 on the surface it sits on', () => {
    // The alpha is set per theme rather than shared: dark ink at half opacity on a pale
    // ground loses far more contrast than light ink at half opacity on a dark one, and
    // this token carries 11px labels and 12px timestamps.
    for (const theme of [...themes, buildCustomTheme(custom)]) {
      expect(
        contrast(over(theme.muted, theme.surface), parse(theme.surface).rgb),
        theme.id,
      ).toBeGreaterThanOrEqual(4.5)
    }
  })
})
