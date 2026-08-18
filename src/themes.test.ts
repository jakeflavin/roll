import { describe, expect, it } from 'vitest'
import {
  buildCustomTheme,
  CUSTOM_THEME_ID,
  defaultCustomTheme,
  defaultTheme,
  isThemeId,
  resolveTheme,
  sanitizeCustomTheme,
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
