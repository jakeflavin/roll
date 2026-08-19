export type Theme = {
  id: string
  name: string
  /** Layered gradients painted on the page background. */
  background: string
  /** Text and chrome colors that sit on top of the background. */
  text: string
  muted: string
  /** Surface used for the settings dialog and buttons. */
  surface: string
  border: string
  /** Font stack for the big picked value. */
  displayFont: string
  displayWeight: number
  displayTracking: string
}

export const themes: Theme[] = [
  {
    id: 'noir',
    name: 'Noir',
    background:
      'radial-gradient(90% 70% at 50% 12%, #2a2a35 0%, transparent 60%),' +
      'radial-gradient(80% 60% at 15% 90%, #1d2b3a 0%, transparent 62%),' +
      'radial-gradient(80% 60% at 90% 80%, #33203a 0%, transparent 62%),' +
      'linear-gradient(180deg, #0d0d11 0%, #08080b 100%)',
    text: '#eceaf2',
    muted: 'rgba(236, 234, 242, 0.5)',
    surface: 'rgba(20, 20, 26, 0.9)',
    border: 'rgba(236, 234, 242, 0.14)',
    displayFont: '"JetBrains Mono", ui-monospace, monospace',
    displayWeight: 600,
    displayTracking: '-0.03em',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    background:
      'radial-gradient(120% 90% at 15% 10%, #5b2ea8 0%, transparent 55%),' +
      'radial-gradient(100% 80% at 85% 25%, #1e7f8f 0%, transparent 60%),' +
      'radial-gradient(110% 100% at 50% 100%, #2c1b6b 0%, transparent 65%),' +
      'linear-gradient(160deg, #140f30 0%, #1b1147 55%, #0d1a33 100%)',
    text: '#f4f1ff',
    muted: 'rgba(244, 241, 255, 0.62)',
    surface: 'rgba(24, 18, 54, 0.82)',
    border: 'rgba(244, 241, 255, 0.16)',
    displayFont: '"Inter", system-ui, sans-serif',
    displayWeight: 700,
    displayTracking: '-0.04em',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    background:
      'radial-gradient(100% 80% at 20% 15%, #ffd08a 0%, transparent 58%),' +
      'radial-gradient(110% 90% at 85% 20%, #ff8a6b 0%, transparent 60%),' +
      'radial-gradient(120% 100% at 60% 100%, #d94f8c 0%, transparent 65%),' +
      'linear-gradient(155deg, #ffb27a 0%, #f4739a 50%, #8e3c93 100%)',
    text: '#3a1024',
    muted: 'rgba(58, 16, 36, 0.62)',
    surface: 'rgba(255, 244, 238, 0.86)',
    border: 'rgba(58, 16, 36, 0.16)',
    displayFont: '"Inter", system-ui, sans-serif',
    displayWeight: 800,
    displayTracking: '-0.05em',
  },
  {
    id: 'mint',
    name: 'Mint',
    background:
      'radial-gradient(100% 80% at 25% 10%, #d9f5e6 0%, transparent 60%),' +
      'radial-gradient(110% 90% at 80% 30%, #cfe6ff 0%, transparent 62%),' +
      'radial-gradient(120% 100% at 50% 100%, #f6e9d8 0%, transparent 60%),' +
      'linear-gradient(150deg, #eef7f2 0%, #e2eef8 55%, #f7f1e8 100%)',
    text: '#17332c',
    muted: 'rgba(23, 51, 44, 0.55)',
    surface: 'rgba(255, 255, 255, 0.88)',
    border: 'rgba(23, 51, 44, 0.14)',
    displayFont: '"Instrument Serif", Georgia, serif',
    displayWeight: 400,
    displayTracking: '-0.02em',
  },
  {
    id: 'ember',
    name: 'Ember',
    background:
      'radial-gradient(90% 70% at 50% 105%, #f0632a 0%, transparent 55%),' +
      'radial-gradient(80% 60% at 15% 80%, #a8231f 0%, transparent 60%),' +
      'radial-gradient(70% 55% at 85% 15%, #3d2418 0%, transparent 62%),' +
      'linear-gradient(180deg, #17100d 0%, #2a1410 60%, #491c12 100%)',
    text: '#ffeade',
    muted: 'rgba(255, 234, 222, 0.58)',
    surface: 'rgba(38, 20, 16, 0.88)',
    border: 'rgba(255, 234, 222, 0.16)',
    displayFont: '"Inter", system-ui, sans-serif',
    displayWeight: 700,
    displayTracking: '-0.045em',
  },
  {
    id: 'bloom',
    name: 'Bloom',
    background:
      'radial-gradient(95% 75% at 20% 10%, #ffe3f0 0%, transparent 60%),' +
      'radial-gradient(105% 85% at 85% 25%, #e6ddff 0%, transparent 62%),' +
      'radial-gradient(115% 95% at 50% 100%, #fff1dd 0%, transparent 60%),' +
      'linear-gradient(150deg, #fdeef6 0%, #f0eaff 55%, #fff6ea 100%)',
    text: '#43254a',
    muted: 'rgba(67, 37, 74, 0.55)',
    surface: 'rgba(255, 255, 255, 0.85)',
    border: 'rgba(67, 37, 74, 0.14)',
    displayFont: '"Instrument Serif", Georgia, serif',
    displayWeight: 400,
    displayTracking: '-0.02em',
  },
  {
    id: 'paper',
    name: 'Paper',
    background:
      'radial-gradient(90% 70% at 50% 0%, #ffffff 0%, transparent 60%),' +
      'radial-gradient(80% 60% at 10% 100%, #e8e3d6 0%, transparent 62%),' +
      'linear-gradient(170deg, #faf7f0 0%, #f2ede1 100%)',
    text: '#16150f',
    muted: 'rgba(22, 21, 15, 0.55)',
    surface: 'rgba(255, 255, 255, 0.9)',
    border: 'rgba(22, 21, 15, 0.16)',
    displayFont: '"JetBrains Mono", ui-monospace, monospace',
    displayWeight: 600,
    displayTracking: '-0.03em',
  },
]

export const defaultTheme = themes.find((t) => t.id === 'noir')!

export function themeById(id: string): Theme {
  return themes.find((t) => t.id === id) ?? defaultTheme
}

export const CUSTOM_THEME_ID = 'custom'

/**
 * The one theme the user builds themselves: either a two-colour gradient or a photo
 * of their own. Stored as its ingredients rather than as finished CSS, so it can be
 * edited, validated and put in a link.
 */
export type CustomTheme = {
  mode: 'gradient' | 'image'
  from: string
  to: string
  /** Degrees, in CSS terms: 0 points up, 90 points right. */
  angle: number
  /** A downscaled data URL. Images are never shared or put in a link. */
  image: string | null
  /** Which way the text goes, since neither a photo nor a free gradient implies it. */
  ink: 'light' | 'dark'
}

export const defaultCustomTheme: CustomTheme = {
  mode: 'gradient',
  from: '#3d2f8f',
  to: '#0f8f9e',
  angle: 160,
  image: null,
  ink: 'light',
}

/** Chrome for each ink, plus the wash laid over a photo so text stays readable on it. */
const INK = {
  light: {
    text: '#f6f5fb',
    muted: 'rgba(246, 245, 251, 0.62)',
    surface: 'rgba(16, 16, 22, 0.8)',
    border: 'rgba(246, 245, 251, 0.2)',
    scrim: 'rgba(8, 8, 11, 0.45)',
  },
  dark: {
    text: '#17161d',
    muted: 'rgba(23, 22, 29, 0.6)',
    surface: 'rgba(255, 255, 255, 0.86)',
    border: 'rgba(23, 22, 29, 0.18)',
    scrim: 'rgba(255, 255, 255, 0.45)',
  },
} as const

const HEX = /^#[0-9a-f]{6}$/i

/** Guards every field, so a hand-edited link or an old export cannot produce CSS the
 *  page has to try to render. */
export function sanitizeCustomTheme(
  raw: unknown,
  base: CustomTheme = defaultCustomTheme,
): CustomTheme {
  const r = (raw ?? {}) as Record<string, unknown>
  const hex = (value: unknown, fallback: string) =>
    typeof value === 'string' && HEX.test(value) ? value : fallback
  const angle = Number(r.angle)

  return {
    mode: r.mode === 'image' ? 'image' : 'gradient',
    from: hex(r.from, base.from),
    to: hex(r.to, base.to),
    angle: Number.isFinite(angle) ? ((Math.round(angle) % 360) + 360) % 360 : base.angle,
    // Only a data URL: a remote one would let a shared link fetch from another host.
    image: typeof r.image === 'string' && r.image.startsWith('data:image/') ? r.image : null,
    ink: r.ink === 'dark' ? 'dark' : 'light',
  }
}

export function buildCustomTheme(custom: CustomTheme): Theme {
  const ink = INK[custom.ink]
  const usingImage = custom.mode === 'image' && custom.image
  const background = usingImage
    ? `linear-gradient(${ink.scrim}, ${ink.scrim}), url("${custom.image}") center / cover no-repeat, ` +
      `linear-gradient(${custom.angle}deg, ${custom.from} 0%, ${custom.to} 100%)`
    : `linear-gradient(${custom.angle}deg, ${custom.from} 0%, ${custom.to} 100%)`

  return {
    id: CUSTOM_THEME_ID,
    name: 'Custom',
    background,
    text: ink.text,
    muted: ink.muted,
    surface: ink.surface,
    border: ink.border,
    displayFont: '"Inter", system-ui, sans-serif',
    displayWeight: 700,
    displayTracking: '-0.04em',
  }
}

export function isThemeId(id: unknown): id is string {
  return id === CUSTOM_THEME_ID || themes.some((t) => t.id === id)
}

/** The theme actually painted, which for the custom id has to be built from settings. */
export function resolveTheme(id: string, custom: CustomTheme): Theme {
  return id === CUSTOM_THEME_ID ? buildCustomTheme(custom) : themeById(id)
}
