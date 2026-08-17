import { useCallback, useEffect, useMemo, useState } from 'react'
import { History, Settings as SettingsIcon } from 'lucide-react'
import { Picker } from './components/Picker'
import { SettingsDialog } from './components/SettingsDialog'
import { SessionDialog } from './components/SessionDialog'
import { ShareButton } from './components/ShareButton'
import { themeById } from './themes'
import { allSources, createSource, resolveSourceId, sourceKeyFor } from './sources'
import { buildShareUrl, readInitialValue, settingsToParams } from './shareUrl'
import { useSettings } from './useSettings'
import { useSession } from './useSession'
import { useLists } from './useLists'
import { drawnFor } from './session'

export default function App() {
  const [settings, setSettings] = useSettings()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sessionOpen, setSessionOpen] = useState(false)
  const [result, setResult] = useState(readInitialValue)
  const { session, record, startOver, clear, replace } = useSession()
  const {
    lists,
    create: createList,
    update: updateList,
    remove: removeList,
    replace: replaceLists,
  } = useLists()
  const theme = themeById(settings.themeId)

  const { min, max, bothCases } = settings
  // A list can be deleted, or arrive from a link that this browser has never seen, so
  // the id is resolved against what actually exists before anything uses it.
  const sourceId = resolveSourceId(settings.sourceId, lists)
  const sourceKey = sourceKeyFor({ sourceId, min, max, bothCases })
  const source = useMemo(
    () => createSource({ sourceId, min, max, bothCases }, lists),
    [sourceId, min, max, bothCases, lists],
  )

  // Derived from the session rather than held separately, so the history shown and the
  // history used for no-repeat can never disagree.
  const drawn = useMemo(() => drawnFor(session, sourceKey), [session, sourceKey])

  const sourceName = allSources(lists).find((s) => s.id === sourceId)?.name
  const onPick = useCallback(
    (value: string) => record({ value, sourceId, sourceName, sourceKey, at: Date.now() }),
    [record, sourceId, sourceName, sourceKey],
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
        onRestore={(nextSettings, nextSession, nextLists) => {
          replaceLists(nextLists)
          replace(nextSession)
          setSettings(nextSettings)
        }}
        lists={lists}
        onCreateList={() => {
          // Selecting the new list immediately is the point of making one.
          const list = createList('My list')
          setSettings((current) => ({ ...current, sourceId: list.id }))
        }}
        onUpdateList={updateList}
        onDeleteList={(id) => {
          removeList(id)
          setSettings((current) =>
            current.sourceId === id ? { ...current, sourceId: 'number' } : current,
          )
        }}
      />
    </div>
  )
}
