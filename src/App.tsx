import { useCallback, useEffect, useMemo, useState } from 'react'
import { History, Settings as SettingsIcon } from 'lucide-react'
import { Picker } from './components/Picker'
import { SettingsDialog } from './components/SettingsDialog'
import { SessionDialog } from './components/SessionDialog'
import { ShareButton } from './components/ShareButton'
import { themeById } from './themes'
import { createSource } from './sources'
import { buildShareUrl, readInitialValue, settingsToParams } from './shareUrl'
import { useSettings } from './useSettings'
import { useSession } from './useSession'
import { drawnFor } from './session'

export default function App() {
  const [settings, setSettings] = useSettings()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sessionOpen, setSessionOpen] = useState(false)
  const [result, setResult] = useState(readInitialValue)
  const { session, record, startOver, clear, replace } = useSession()
  const theme = themeById(settings.themeId)

  const { sourceId, min, max, bothCases } = settings
  // Only the options that actually define the pool, so changing the theme or the
  // animation does not reseed the value on screen.
  const sourceKey = `${sourceId}:${min}:${max}:${bothCases}`
  const source = useMemo(
    () => createSource({ sourceId, min, max, bothCases }),
    [sourceId, min, max, bothCases],
  )

  // Derived from the session rather than held separately, so the history shown and the
  // history used for no-repeat can never disagree.
  const drawn = useMemo(() => drawnFor(session, sourceKey), [session, sourceKey])

  const onPick = useCallback(
    (value: string) => record({ value, sourceId, sourceKey, at: Date.now() }),
    [record, sourceId, sourceKey],
  )
  const onStartOver = useCallback(() => startOver(sourceKey), [startOver, sourceKey])

  // Keeping the address bar in step means the URL is always shareable as it stands,
  // survives a refresh, and never describes state the app has moved on from.
  useEffect(() => {
    const params = settingsToParams(settings, result)
    window.history.replaceState(null, '', `${window.location.pathname}?${params}`)
  }, [settings, result])

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
          source={source}
          sourceKey={sourceKey}
          theme={theme}
          animation={settings.animationId}
          allowRepeat={settings.repeat}
          drawn={drawn}
          onPick={onPick}
          onStartOver={onStartOver}
          initialValue={result}
          onSettle={setResult}
          leadingAction={<ShareButton url={buildShareUrl(settings, result)} />}
          trailingAction={
            <button
              className="icon-button"
              onClick={() => setSessionOpen(true)}
              aria-label="View this session"
            >
              <History size={18} />
            </button>
          }
        />
      </main>

      <SessionDialog
        open={sessionOpen}
        onClose={() => setSessionOpen(false)}
        session={session}
        onClear={clear}
      />

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={setSettings}
        session={session}
        onRestore={(nextSettings, nextSession) => {
          setSettings(nextSettings)
          replace(nextSession)
        }}
      />
    </div>
  )
}
