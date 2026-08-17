import { useEffect, useState } from 'react'
import { defaultTheme } from './themes'

export type Settings = {
  min: number
  max: number
  themeId: string
}

const STORAGE_KEY = 'roll.settings'

export const defaultSettings: Settings = {
  min: 1,
  max: 100,
  themeId: defaultTheme.id,
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
