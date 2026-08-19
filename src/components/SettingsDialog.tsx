import { useEffect, useState } from 'react'
import { allSources, type SourceId } from '@/lib/sources'
import type { CustomList } from '@/lib/lists'
import type { Session } from '@/lib/session'
import type { Settings } from '@/hooks/useSettings'
import { useDialog } from '@/hooks/useDialog'
import { AppearanceSettings } from './AppearanceSettings'
import { ListEditor } from './ListEditor'
import { SettingsHeader } from './SettingsHeader'
import { ShortcutsPage } from './ShortcutsPage'
import { SourceOptionsPage } from './SourceOptionsPage'
import { SourceSettings } from './SourceSettings'

type SettingsDialogProps = {
  open: boolean
  /** Which page to land on when opened; the shortcut for help jumps straight in. */
  openTo?: 'main' | 'shortcuts'
  onClose: () => void
  settings: Settings
  onChange: (next: Settings) => void
  session: Session
  onRestore: (settings: Settings, session: Session, lists: CustomList[]) => void
  lists: CustomList[]
  onCreateList: () => void
  onOpenSession: () => void
  /** The value on screen, previewed in the theme swatches. */
  sample: string
  onUpdateList: (id: string, patch: Partial<Omit<CustomList, 'id'>>) => void
  onDeleteList: (id: string) => void
}

/**
 * The settings drawer: a shell that owns which page is showing and hands the work to
 * the four that render one. Splitting on the app's own seam — what gets picked, versus
 * how it looks — is what keeps each of them readable in one screen.
 */
export function SettingsDialog({
  open,
  openTo = 'main',
  onClose,
  settings,
  onChange,
  session,
  onRestore,
  lists,
  onCreateList,
  onOpenSession,
  sample,
  onUpdateList,
  onDeleteList,
}: SettingsDialogProps) {
  const { ref, onBackdropClick } = useDialog(open, onClose)
  // The drawer has several pages: the settings themselves, a custom list's entries, and
  // the pool of a built-in group. Kept here rather than in app state — it is drawer-local
  // navigation, and nothing outside the drawer can see it.
  const [page, setPage] = useState<'main' | 'options' | 'list' | 'shortcuts'>('main')
  // Which group a sub-page is about, now that any row can open one.
  const [editing, setEditing] = useState<SourceId | null>(null)
  const [viewing, setViewing] = useState<SourceId | null>(null)
  // Touch devices get no shortcut list; there is nothing to press.
  const hasKeyboard = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches

  // Reopening should land where the caller asked, never on whatever page was last seen.
  useEffect(() => {
    if (open) setPage(openTo)
  }, [open, openTo])

  const available = allSources(lists)
  const editingList = lists.find((l) => l.id === (editing ?? settings.sourceIds[0]))
  const source = available.find((s) => s.id === (viewing ?? settings.sourceIds[0])) ?? available[0]

  const back = () => setPage('main')

  return (
    <dialog ref={ref} className="drawer drawer-settings" onClose={onClose} onClick={onBackdropClick}>
      {page === 'shortcuts' ? (
        <>
          <SettingsHeader title="Shortcuts" onClose={onClose} onBack={back} />
          <ShortcutsPage />
        </>
      ) : page === 'list' && editingList ? (
        <>
          <SettingsHeader title={editingList.name} onClose={onClose} onBack={back} />
          <ListEditor
            list={editingList}
            onUpdate={(patch) => onUpdateList(editingList.id, patch)}
            onDelete={() => {
              onDeleteList(editingList.id)
              back()
            }}
          />
        </>
      ) : page === 'options' && source?.options ? (
        <>
          <SettingsHeader title={source.name} onClose={onClose} onBack={back} />
          <SourceOptionsPage options={source.options} isEmoji={source.id === 'emoji'} />
        </>
      ) : (
        <>
          <SettingsHeader title="Settings" onClose={onClose} />

          <SourceSettings
            settings={settings}
            onChange={onChange}
            lists={lists}
            onCreateList={onCreateList}
            onEditList={(id) => {
              setEditing(id)
              setPage('list')
            }}
            onViewOptions={(id) => {
              setViewing(id)
              setPage('options')
            }}
          />

          {/* Everything above changes what gets picked; everything below changes how it
              looks. The rule keeps the two from reading as one long list. */}
          <hr className="settings-divider" />

          <AppearanceSettings
            settings={settings}
            onChange={onChange}
            session={session}
            lists={lists}
            onRestore={onRestore}
            onOpenSession={onOpenSession}
            onOpenShortcuts={() => setPage('shortcuts')}
            sample={sample}
            hasKeyboard={hasKeyboard}
          />
        </>
      )}
    </dialog>
  )
}
