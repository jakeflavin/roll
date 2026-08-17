import { useEffect, useState } from 'react'
import { defaultTheme } from './themes'
import { defaultAnimation, type AnimationId } from './animations'
import { defaultSource, type SourceId } from './sources'
import { readInitialSettings } from './shareUrl'

export type Settings = {
  sourceId: SourceId
  min: number
  max: number
  /** Letter source only: include a–z alongside A–Z. */
  bothCases: boolean
  /** Allow the same value to come up again; off draws without replacement. */
  repeat: boolean
  themeId: string
  animationId: AnimationId
}

const STORAGE_KEY = 'roll.settings'

export const defaultSettings: Settings = {
  sourceId: defaultSource.id,
  min: 1,
  max: 100,
  bothCases: false,
  repeat: false,
  themeId: defaultTheme.id,
  animationId: defaultAnimation.id,
}

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultSettings
    return { ...defaultSettings, ...JSON.parse(raw) }
  } catch {
    return defaultSettings
  }
}

export function useSettings() {
  // A shared link's options win over what this browser had stored.
  const [settings, setSettings] = useState<Settings>(() => readInitialSettings(load()))

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  return [settings, setSettings] as const
}
