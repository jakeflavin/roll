import {
  defaultCustomTheme,
  defaultTheme,
  sanitizeCustomTheme,
  type CustomTheme,
} from '@/lib/themes'
import { defaultAnimation, type AnimationId } from '@/lib/animations'
import { defaultSource, type SourceId } from '@/lib/sources'
import { readInitialSettings } from '@/lib/shareUrl'
import { usePersistentState } from './usePersistentState'

export type Settings = {
  /** One or more pools; a roll takes one value from each, in this order. */
  sourceIds: SourceId[]
  min: number
  max: number
  /** Letter source only: include a–z alongside A–Z. */
  bothCases: boolean
  /** Allow the same value to come up again; off draws without replacement. */
  repeat: boolean
  themeId: string
  /** The user's own theme, kept whether or not it is the one selected. */
  customTheme: CustomTheme
  animationId: AnimationId
}

const STORAGE_KEY = 'hat.settings'

export const defaultSettings: Settings = {
  sourceIds: [defaultSource.id],
  min: 1,
  max: 100,
  bothCases: false,
  repeat: false,
  themeId: defaultTheme.id,
  customTheme: defaultCustomTheme,
  animationId: defaultAnimation.id,
}

function decode(raw: string | null): Settings {
  try {
    if (!raw) return defaultSettings
    return migrate(JSON.parse(raw))
  } catch {
    return defaultSettings
  }
}

/**
 * Fills in anything missing, and understands settings saved before multi-pick, which
 * carry a single `sourceId`. It reads the stored object rather than one already merged
 * with the defaults, whose `sourceIds` would otherwise mask the older field.
 */
export function migrate(stored: Partial<Settings> & { sourceId?: SourceId }): Settings {
  const { sourceId, ...rest } = stored
  const ids = Array.isArray(rest.sourceIds) ? rest.sourceIds.filter(Boolean) : []
  return {
    ...defaultSettings,
    ...rest,
    sourceIds: ids.length ? ids : [sourceId ?? defaultSource.id],
    customTheme: sanitizeCustomTheme(rest.customTheme),
  }
}

/** Everything that shapes a roll, persisted, with a shared link's options winning. */
export function useSettings() {
  return usePersistentState(STORAGE_KEY, defaultSettings, {
    read: (raw) => readInitialSettings(decode(raw)),
  })
}
