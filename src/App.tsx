import { useEffect, useState } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import { Picker } from './components/Picker'
import { SettingsDialog } from './components/SettingsDialog'
import { themeById } from './themes'
import { useSettings } from './useSettings'

export default function App() {
  const [settings, setSettings] = useSettings()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const theme = themeById(settings.themeId)

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--background', theme.background)
    root.style.setProperty('--text', theme.text)
    root.style.setProperty('--muted', theme.muted)
    root.style.setProperty('--surface', theme.surface)
    root.style.setProperty('--border', theme.border)
  }, [theme])

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Roll</h1>
        <button
          className="icon-button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Open settings"
        >
          <SettingsIcon size={20} />
        </button>
      </header>

      <main className="app-main">
        <Picker
          min={settings.min}
          max={settings.max}
          theme={theme}
          animation={settings.animationId}
        />
      </main>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={setSettings}
      />
    </div>
  )
}
