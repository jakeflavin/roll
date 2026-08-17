import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  History,
  Keyboard,
  Plus,
  X,
} from 'lucide-react'
import { themes } from '../themes'
import { animations } from '../animations'
import { allSources, sources, type SourceId } from '../sources'
import { isCustomId, type CustomList } from '../lists'
import type { Session } from '../session'
import type { Settings } from '../useSettings'
import { shortcuts } from '../shortcuts'
import { BackupControls } from './BackupControls'
import { ListEditor } from './ListEditor'

type Props = {
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
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  // The drawer has two pages: the settings themselves, and the pool of the selected
  // source. Kept here rather than in app state — it is drawer-local navigation.
  const [page, setPage] = useState<'main' | 'options' | 'list' | 'shortcuts'>('main')
  // Which group a sub-page is about, now that any row can open one.
  const [editing, setEditing] = useState<SourceId | null>(null)
  const [viewing, setViewing] = useState<SourceId | null>(null)
  // Touch devices get no shortcut list; there is nothing to press.
  const hasKeyboard = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
    // Reopening should land where the caller asked, never on whatever page was last
    // seen.
    if (open) setPage(openTo)
  }, [open, openTo])

  // Clamp on commit rather than on every keystroke, so a half-typed number stays editable.
  const commitRange = () => {
    const min = Math.min(settings.min, settings.max)
    const max = Math.max(settings.min, settings.max)
    if (min !== settings.min || max !== settings.max) onChange({ ...settings, min, max })
  }

  // Backdrop clicks are dispatched on the dialog itself, so a hit test against its
  // box is what separates "clicked the backdrop" from "clicked inside the drawer".
  const onDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target !== ref.current) return
    const { top, right, bottom, left } = ref.current.getBoundingClientRect()
    const outside =
      e.clientX < left || e.clientX > right || e.clientY < top || e.clientY > bottom
    if (outside) onClose()
  }

  const available = allSources(lists)
  const unused = available.filter((s) => !settings.sourceIds.includes(s.id))
  const editingList = lists.find((l) => l.id === (editing ?? settings.sourceIds[0]))
  const source =
    available.find((s) => s.id === (viewing ?? settings.sourceIds[0])) ?? available[0]

  /** A group's own settings, as rows inside that group's card. They read as belonging
   *  to the group above them rather than as more controls in a flat stack. */
  const groupRows = (id: SourceId) => {
    const group = available.find((s) => s.id === id)
    const rows = []

    if (id === 'number') {
      rows.push(
        <div className="group-field" key="range">
          <label>
            Min
            <input
              type="number"
              value={settings.min}
              onChange={(e) => onChange({ ...settings, min: Number(e.target.value) })}
              onBlur={commitRange}
            />
          </label>
          <label>
            Max
            <input
              type="number"
              value={settings.max}
              onChange={(e) => onChange({ ...settings, max: Number(e.target.value) })}
              onBlur={commitRange}
            />
          </label>
        </div>,
      )
    }

    if (id === 'letter') {
      rows.push(
        // Associated by id rather than nested: a checkbox inside its own label gets the
        // click twice — once directly, once forwarded — and lands back where it started.
        <div className="group-field is-switch" key="case">
          <label htmlFor="both-cases">Include lowercase</label>
          <input
            id="both-cases"
            type="checkbox"
            role="switch"
            checked={settings.bothCases}
            onChange={(e) => onChange({ ...settings, bothCases: e.target.checked })}
          />
        </div>,
      )
    }

    // Navigation, so it reads as a link with somewhere to go, not as another control
    // carrying the same weight as the group's own dropdown.
    if (isCustomId(id)) {
      rows.push(
        <button
          className="group-link"
          key="edit"
          onClick={() => {
            setEditing(id)
            setPage('list')
          }}
        >
          Edit entries
          <ChevronRight size={15} aria-hidden="true" />
        </button>,
      )
    } else if (group?.options) {
      rows.push(
        <button
          className="group-link"
          key="see"
          onClick={() => {
            setViewing(id)
            setPage('options')
          }}
        >
          See all {group.options.length}
          <ChevronRight size={15} aria-hidden="true" />
        </button>,
      )
    }

    return rows
  }

  const header = (title: string, onBack?: () => void) => (
    <div className="settings-header">
      {onBack && (
        <button className="icon-button" onClick={onBack} aria-label="Back to settings">
          <ChevronLeft size={18} />
        </button>
      )}
      <h2>{title}</h2>
      <button className="icon-button" onClick={onClose} aria-label="Close settings">
        <X size={18} />
      </button>
    </div>
  )

  return (
    <dialog
      ref={ref}
      className="drawer drawer-settings"
      onClose={onClose}
      onClick={onDialogClick}
    >
      {page === 'shortcuts' ? (
        <>
          {header('Shortcuts', () => setPage('main'))}
          <ul className="shortcut-list">
            {shortcuts.map((shortcut) => (
              <li key={shortcut.label}>
                <span>{shortcut.label}</span>
                <span className="shortcut-keys">
                  {shortcut.keys.map((key) => (
                    <kbd key={key}>{key}</kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : page === 'list' && editingList ? (
        <>
          {header(editingList.name, () => setPage('main'))}
          <ListEditor
            list={editingList}
            onUpdate={(patch) => onUpdateList(editingList.id, patch)}
            onDelete={() => {
              onDeleteList(editingList.id)
              setPage('main')
            }}
          />
        </>
      ) : page === 'options' && source.options ? (
        <>
          {header(source.name, () => setPage('main'))}

          <p className="options-count">{source.options.length} options</p>
          <ul className={`options-list${source.id === 'emoji' ? ' is-emoji' : ''}`}>
            {source.options.map((option) => (
              <li key={option}>{option}</li>
            ))}
          </ul>
        </>
      ) : (
        <>
          {header('Settings')}

          <fieldset className="settings-group">
            <legend>Pick from</legend>
            {/* One card per group: the dropdown chooses it, the rows beneath belong
                to it. Cards keep several groups from reading as one flat stack of
                identical boxes. */}
            {settings.sourceIds.map((id, i) => (
              <div className="group-card" key={`${id}-${i}`}>
                <div className="group-head">
                  <div className="select-wrap">
                    <select
                      className="select is-bare"
                      value={id}
                      onChange={(e) =>
                        onChange({
                          ...settings,
                          sourceIds: settings.sourceIds.map((sid, index) =>
                            index === i ? (e.target.value as SourceId) : sid,
                          ),
                        })
                      }
                    >
                      <optgroup label="Built in">
                        {sources
                          .filter((s) => s.id === id || !settings.sourceIds.includes(s.id))
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                      </optgroup>
                      {lists.length > 0 && (
                        <optgroup label="Your lists">
                          {lists
                            .filter((l) => l.id === id || !settings.sourceIds.includes(l.id))
                            .map((list) => (
                              <option key={list.id} value={list.id}>
                                {list.name}
                              </option>
                            ))}
                        </optgroup>
                      )}
                    </select>
                    <ChevronDown className="select-arrow" size={16} aria-hidden="true" />
                  </div>
                  {settings.sourceIds.length > 1 && (
                    <button
                      className="ghost-button"
                      onClick={() =>
                        onChange({
                          ...settings,
                          sourceIds: settings.sourceIds.filter((_, index) => index !== i),
                        })
                      }
                      aria-label={`Remove ${available.find((s) => s.id === id)?.name}`}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                {groupRows(id)}
              </div>
            ))}

            <div className="add-row">
              {unused.length > 0 && (
                <div className="select-wrap is-add">
                  <select
                    className="select is-add"
                    value=""
                    onChange={(e) =>
                      e.target.value &&
                      onChange({ ...settings, sourceIds: [...settings.sourceIds, e.target.value] })
                    }
                  >
                    <option value="">Add a group</option>
                    {unused.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <Plus className="select-arrow is-left" size={15} aria-hidden="true" />
                </div>
              )}
              <button
                className="link-button"
                onClick={() => {
                  onCreateList()
                  // The new list takes the first slot, and is what the editor shows.
                  setEditing(null)
                  // Straight into the editor: a new list is empty, so leaving the user
                  // here makes the button look like it did nothing.
                  setPage('list')
                }}
              >
                Custom list
              </button>
            </div>
          </fieldset>

          {/* A row rather than a titled group: the label on the switch says the whole
              thing, so a heading above it would only repeat itself. */}
          <div className="settings-group switch-row">
            <label htmlFor="repeat">Repeat picks</label>
            <input
              id="repeat"
              type="checkbox"
              role="switch"
              checked={settings.repeat}
              onChange={(e) => onChange({ ...settings, repeat: e.target.checked })}
            />
          </div>

          {/* Everything above changes what gets picked; everything below changes how it
              looks. The rule keeps the two from reading as one long list. */}
          <hr className="settings-divider" />

          <fieldset className="settings-group">
            <legend>Theme</legend>
            <div className="theme-grid">
              {themes.map((t) => (
                <button
                  key={t.id}
                  className={`theme-option${t.id === settings.themeId ? ' is-active' : ''}`}
                  onClick={() => onChange({ ...settings, themeId: t.id })}
                  aria-pressed={t.id === settings.themeId}
                >
                  <span
                    className="theme-swatch"
                    style={{ background: t.background, borderColor: t.border }}
                  >
                    {/* Two digits so the preview shows the theme's tracking, not just its face. */}
                    <span
                      className="theme-preview"
                      style={{
                        fontFamily: t.displayFont,
                        fontWeight: t.displayWeight,
                        letterSpacing: t.displayTracking,
                        color: t.text,
                      }}
                    >
                      {sample}
                    </span>
                  </span>
                  <span className="theme-name">{t.name}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="settings-group">
            <legend>Animation</legend>
            <div className="animation-grid">
              {animations.map((a) => (
                <button
                  key={a.id}
                  className={`animation-option${a.id === settings.animationId ? ' is-active' : ''}`}
                  onClick={() => onChange({ ...settings, animationId: a.id })}
                  aria-pressed={a.id === settings.animationId}
                >
                  <span className="animation-name">{a.name}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <hr className="settings-divider" />

          <fieldset className="settings-group">
            <legend>Session and backup</legend>
            <div className="button-grid">
              <button className="outline-button" onClick={onOpenSession}>
                <History size={15} aria-hidden="true" />
                Past picks
              </button>
              {/* A shortcut list is no use without a keyboard to press. */}
              {hasKeyboard && (
                <button className="outline-button" onClick={() => setPage('shortcuts')}>
                  <Keyboard size={15} aria-hidden="true" />
                  Shortcuts
                </button>
              )}
            </div>
            <BackupControls
              settings={settings}
              session={session}
              lists={lists}
              onRestore={onRestore}
            />
          </fieldset>

        </>
      )}
    </dialog>
  )
}
