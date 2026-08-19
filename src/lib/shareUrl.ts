import { animations, type AnimationId } from './animations'
import type { SourceId } from './sources'
import { CUSTOM_THEME_ID, isThemeId, sanitizeCustomTheme, type CustomTheme } from './themes'
// Type-only, so this module and useSettings do not form a runtime import cycle.
import type { Settings } from '../hooks/useSettings'

/**
 * Only the options that apply to the chosen source are written, so a shared emoji
 * link does not carry a number range that has no effect on it.
 */
export function settingsToParams(settings: Settings, values: string[] = []) {
  const params = new URLSearchParams()
  // Repeated rather than joined: a value like "Nguyen, Anh" would not survive being
  // split back out of a comma-separated list.
  for (const id of settings.sourceIds) params.append('pick', id)
  // The results ride along, so a refresh or a shared link keeps them on screen.
  for (const value of values) params.append('v', value)
  if (settings.sourceIds.includes('number')) {
    params.set('min', String(settings.min))
    params.set('max', String(settings.max))
  }
  // Written as an explicit 1/0 rather than omitted when off: an absent flag falls back
  // to the recipient's own default, which would flip a shared "off" back on.
  if (settings.sourceIds.includes('letter')) params.set('lower', settings.bothCases ? '1' : '0')
  params.set('repeat', settings.repeat ? '1' : '0')
  params.set('theme', settings.themeId)
  // A gradient is four short values, so it travels. An uploaded image would be
  // hundreds of kilobytes of URL, so it stays on the device that chose it and the
  // link falls back to the gradient underneath it.
  if (settings.themeId === CUSTOM_THEME_ID) {
    const { from, to, angle, ink } = settings.customTheme
    params.set('bg', [from.slice(1), to.slice(1), angle, ink].join('-'))
  }
  params.set('anim', settings.animationId)
  return params
}

function readInt(raw: string | null, fallback: number) {
  // An empty param is absent, not zero — Number('') is 0, which would silently
  // rewrite the range.
  if (raw === null || raw.trim() === '') return fallback
  const value = Number(raw)
  return Number.isFinite(value) ? Math.trunc(value) : fallback
}

/** Anything unrecognized falls back, so a hand-edited link can never break the app. */
export function settingsFromParams(params: URLSearchParams, base: Settings): Settings {
  const picks = params.getAll('pick').filter(Boolean)
  const theme = params.get('theme')
  const anim = params.get('anim')

  return {
    // Custom ids are kept as-is here; whether the list actually exists is resolved
    // against the stored lists once those are loaded.
    sourceIds: picks.length ? (picks as SourceId[]) : base.sourceIds,
    min: readInt(params.get('min'), base.min),
    max: readInt(params.get('max'), base.max),
    bothCases: params.has('lower') ? params.get('lower') === '1' : base.bothCases,
    repeat: params.has('repeat') ? params.get('repeat') === '1' : base.repeat,
    themeId: isThemeId(theme) ? theme! : base.themeId,
    customTheme: customFromParam(params.get('bg'), base.customTheme),
    animationId: animations.some((a) => a.id === anim) ? (anim as AnimationId) : base.animationId,
  }
}

/** `from-to-angle-ink`, with the hexes stripped of their # so the link stays readable. */
function customFromParam(raw: string | null, base: CustomTheme): CustomTheme {
  if (!raw) return base
  const [from, to, angle, ink] = raw.split('-')
  // Only the four values the link actually carries are taken. Mode and image are left
  // as this device has them: the app reflects its own settings into the URL, so a
  // reload reads back a link that never had room for the image, and taking mode from
  // it would throw the picture away every time the page was refreshed.
  return sanitizeCustomTheme(
    { mode: base.mode, image: base.image, from: `#${from}`, to: `#${to}`, angle, ink },
    base,
  )
}

export function hasShareParams(params: URLSearchParams) {
  return ['pick', 'theme', 'anim', 'min', 'max', 'lower', 'repeat'].some((key) => params.has(key))
}

export function readInitialSettings(stored: Settings): Settings {
  const params = new URLSearchParams(window.location.search)
  return hasShareParams(params) ? settingsFromParams(params, stored) : stored
}

export function readInitialValues() {
  return new URLSearchParams(window.location.search).getAll('v')
}

export function buildShareUrl(settings: Settings, values: string[] = []) {
  const url = new URL(window.location.href)
  url.search = settingsToParams(settings, values).toString()
  url.hash = ''
  return url.toString()
}
