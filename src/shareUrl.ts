import { animations, type AnimationId } from './animations'
import { sources, type SourceId } from './sources'
import { themes } from './themes'
// Type-only, so this module and useSettings do not form a runtime import cycle.
import type { Settings } from './useSettings'

/**
 * Only the options that apply to the chosen source are written, so a shared emoji
 * link does not carry a number range that has no effect on it.
 */
export function settingsToParams(settings: Settings, value?: string) {
  const params = new URLSearchParams()
  params.set('pick', settings.sourceId)
  // The result rides along, so a refresh or a shared link keeps the value on screen.
  if (value) params.set('v', value)
  if (settings.sourceId === 'number') {
    params.set('min', String(settings.min))
    params.set('max', String(settings.max))
  }
  if (settings.sourceId === 'letter' && settings.bothCases) params.set('lower', '1')
  params.set('theme', settings.themeId)
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
  const pick = params.get('pick')
  const theme = params.get('theme')
  const anim = params.get('anim')

  return {
    sourceId: sources.some((s) => s.id === pick) ? (pick as SourceId) : base.sourceId,
    min: readInt(params.get('min'), base.min),
    max: readInt(params.get('max'), base.max),
    bothCases: params.has('lower') ? params.get('lower') === '1' : base.bothCases,
    themeId: themes.some((t) => t.id === theme) ? theme! : base.themeId,
    animationId: animations.some((a) => a.id === anim) ? (anim as AnimationId) : base.animationId,
  }
}

export function hasShareParams(params: URLSearchParams) {
  return ['pick', 'theme', 'anim', 'min', 'max', 'lower'].some((key) => params.has(key))
}

export function readInitialSettings(stored: Settings): Settings {
  const params = new URLSearchParams(window.location.search)
  return hasShareParams(params) ? settingsFromParams(params, stored) : stored
}

export function readInitialValue() {
  return new URLSearchParams(window.location.search).get('v') ?? undefined
}

export function buildShareUrl(settings: Settings, value?: string) {
  const url = new URL(window.location.href)
  url.search = settingsToParams(settings, value).toString()
  url.hash = ''
  return url.toString()
}
