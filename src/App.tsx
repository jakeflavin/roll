import { useCallback, useEffect, useMemo, useState } from 'react'
import { History, Settings as SettingsIcon } from 'lucide-react'
import { Picker } from './components/Picker'
import { SettingsDialog } from './components/SettingsDialog'
import { SessionDialog } from './components/SessionDialog'
import { ShareButton } from './components/ShareButton'
import { resolveTheme } from './lib/themes'
import {
  allSources,
  createSource,
  defaultSource,
  resolveSourceId,
  sourceKeyFor,
} from './lib/sources'
import { buildShareUrl, readInitialValues, settingsToParams } from './lib/shareUrl'
import { useSettings } from './hooks/useSettings'
import { useSession } from './hooks/useSession'
import { useLists } from './hooks/useLists'
import { isDrawerOpen, isTypingTarget } from './lib/shortcuts'
import { drawnFor } from './lib/session'

export default function App() {
  const [settings, setSettings] = useSettings()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsPage, setSettingsPage] = useState<'main' | 'shortcuts'>('main')
  const [sessionOpen, setSessionOpen] = useState(false)
  const [results, setResults] = useState<string[]>(readInitialValues)
  const { session, record, startOver, clear, replace: replaceSession } = useSession()
  const {
    lists,
    create: createList,
    update: updateList,
    remove: removeList,
    replace: replaceLists,
  } = useLists()
  const theme = resolveTheme(settings.themeId, settings.customTheme)

  const { min, max, bothCases } = settings

  // Built once rather than per slot: it concatenates the built-ins with every custom
  // list, and slots would otherwise rebuild it for each of them.
  const available = useMemo(() => allSources(lists), [lists])
  const nameOf = useCallback(
    (id: string) => available.find((s) => s.id === id)?.name,
    [available],
  )

  // A list can be deleted, or arrive from a link that this browser has never seen, so
  // ids are resolved against what actually exists before anything uses them.
  const sourceIds = useMemo(
    () => settings.sourceIds.map((id) => resolveSourceId(id, lists)),
    [settings.sourceIds, lists],
  )

  // The pools themselves, which only change when what they draw from changes. Building
  // one walks its whole list, so this is deliberately kept off the session's path.
  const pools = useMemo(
    () =>
      sourceIds.map((sourceId) => ({
        sourceId,
        sourceKey: sourceKeyFor({ sourceId, min, max, bothCases }),
        name: nameOf(sourceId) ?? 'Pick',
        source: createSource({ sourceId, min, max, bothCases }, lists),
      })),
    [sourceIds, min, max, bothCases, lists, nameOf],
  )

  // What each pool has already given out. Derived from the session rather than held
  // separately, so the history shown and the history used for no-repeat cannot disagree.
  const slots = useMemo(
    () => pools.map((pool) => ({ ...pool, drawn: drawnFor(session, pool.sourceKey) })),
    [pools, session],
  )

  const onPick = useCallback(
    (sourceId: string, value: string) => {
      const sourceKey = sourceKeyFor({ sourceId, min, max, bothCases })
      record({ value, sourceId, sourceName: nameOf(sourceId), sourceKey, at: Date.now() })
    },
    [record, min, max, bothCases, nameOf],
  )

  // An empty custom list picks an empty string, which would leave the theme swatches
  // blank, so the fallback covers empty rather than only missing.
  const sample = results[0] || '42'
  const shareUrl = useMemo(() => buildShareUrl(settings, results), [settings, results])

  const onStartOver = useCallback(
    (keys: string[]) => keys.forEach((key) => startOver(key)),
    [startOver],
  )

  // Shortcuts for the app's own chrome. Rolling is handled by the picker, which owns
  // the action; these only open things.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target) || isDrawerOpen()) return

      if (e.key === '?') {
        e.preventDefault()
        setSettingsPage('shortcuts')
        setSettingsOpen(true)
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault()
        setSettingsPage('main')
        setSettingsOpen(true)
      } else if (e.key.toLowerCase() === 'h') {
        e.preventDefault()
        setSessionOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Keeping the address bar in step means the URL is always shareable as it stands,
  // survives a refresh, and never describes state the app has moved on from.
  useEffect(() => {
    const params = settingsToParams(settings, results)
    window.history.replaceState(null, '', `${window.location.pathname}?${params}`)
  }, [settings, results])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--bg', theme.background)
    root.style.setProperty('--text', theme.text)
    root.style.setProperty('--dim', theme.muted)
    root.style.setProperty('--surface', theme.surface)
    root.style.setProperty('--line', theme.border)
  }, [theme])

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Hat</h1>
        <button
          className="icon-button"
          onClick={() => {
            setSettingsPage('main')
            setSettingsOpen(true)
          }}
          aria-label="Open settings"
        >
          <SettingsIcon size={20} />
        </button>
      </header>

      <main className="app-main">
        <Picker
          slots={slots}
          theme={theme}
          animation={settings.animationId}
          allowRepeat={settings.repeat}
          onPick={onPick}
          onStartOver={onStartOver}
          initialValues={results}
          onSettle={setResults}
          tools={
            <>
              <ShareButton url={shareUrl} />
              <button
                className="icon-button"
                onClick={() => setSessionOpen(true)}
                aria-label="View this session"
              >
                <History size={18} />
              </button>
            </>
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
        openTo={settingsPage}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={setSettings}
        onOpenSession={() => {
          setSettingsOpen(false)
          setSessionOpen(true)
        }}
        sample={sample}
        session={session}
        onRestore={(nextSettings, nextSession, nextLists) => {
          replaceLists(nextLists)
          replaceSession(nextSession)
          setSettings(nextSettings)
        }}
        lists={lists}
        onCreateList={() => {
          // The new list takes the first slot and keeps the rest of the selection —
          // making a list should not silently discard the other groups.
          const list = createList('My list')
          setSettings((current) => ({
            ...current,
            sourceIds: [list.id, ...current.sourceIds.slice(1)],
          }))
        }}
        onUpdateList={updateList}
        onDeleteList={(id) => {
          removeList(id)
          setSettings((current) => {
            const remaining = current.sourceIds.filter((sid) => sid !== id)
            return {
              ...current,
              sourceIds: remaining.length ? remaining : [defaultSource.id],
            }
          })
        }}
      />
    </div>
  )
}
