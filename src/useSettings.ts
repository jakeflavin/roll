import { useEffect, useState } from 'react'
import { defaultTheme } from './themes'
import { defaultAnimation, type AnimationId } from './animations'
import { defaultSource, type SourceId } from './sources'

export type Settings = {
  sourceId: SourceId
  min: number
  max: number
  /** Letter source only: include a–z alongside A–Z. */
  bothCases: boolean
  themeId: string
  animationId: AnimationId
}

const STORAGE_KEY = 'roll.settings'

export const defaultSettings: Settings = {
  sourceId: defaultSource.id,
  min: 1,
  max: 100,
  bothCases: false,
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
  const [settings, setSettings] = useState<Settings>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  return [settings, setSettings] as const
}
