import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, History, Keyboard, X } from 'lucide-react'
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
  const [primary, ...extras] = settings.sourceIds
  const source = available.find((s) => s.id === primary) ?? available[0]
  const editingList = lists.find((l) => l.id === primary)
  const unused = available.filter((s) => !settings.sourceIds.includes(s.id))

  const setPrimary = (id: SourceId) =>
    onChange({ ...settings, sourceIds: [id, ...extras.filter((e) => e !== id)] })

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
            {/* The native arrow sits hard against the control's edge and cannot be
                moved, so it is replaced by one we can place and theme. */}
            <div className="select-wrap">
              <select
                className="select"
                value={primary}
                onChange={(e) => setPrimary(e.target.value as SourceId)}
              >
                <optgroup label="Built in">
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
                {lists.length > 0 && (
                  <optgroup label="Your lists">
                    {lists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <ChevronDown className="select-arrow" size={16} aria-hidden="true" />
            </div>

            {/* Each extra group is a dropdown of its own, so it can be changed rather
                than only removed. Its own id stays in the options; the rest of the
                selection is filtered out so a group cannot be chosen twice. */}
            {extras.map((id, i) => (
              <div className="group-row" key={id}>
                <div className="select-wrap">
                  <select
                    className="select"
                    value={id}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        sourceIds: settings.sourceIds.map((sid, index) =>
                          index === i + 1 ? (e.target.value as SourceId) : sid,
                        ),
                      })
                    }
                  >
                    {available
                      .filter((s) => s.id === id || !settings.sourceIds.includes(s.id))
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="select-arrow" size={16} aria-hidden="true" />
                </div>
                <button
                  className="icon-button"
                  onClick={() =>
                    onChange({
                      ...settings,
                      sourceIds: settings.sourceIds.filter((_, index) => index !== i + 1),
                    })
                  }
                  aria-label={`Remove ${available.find((s) => s.id === id)?.name}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            {unused.length > 0 && (
              <div className="select-wrap add-group">
                <select
                  className="select"
                  value=""
                  onChange={(e) =>
                    e.target.value &&
                    onChange({ ...settings, sourceIds: [...settings.sourceIds, e.target.value] })
                  }
                >
                  <option value="">+ Add another group</option>
                  {unused.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="select-arrow" size={16} aria-hidden="true" />
              </div>
            )}

            <div className="button-grid">
              {isCustomId(primary) ? (
                <button className="outline-button" onClick={() => setPage('list')}>
                  Edit this list
                </button>
              ) : (
                source.options && (
                  <button className="outline-button" onClick={() => setPage('options')}>
                    See all {source.options.length}
                  </button>
                )
              )}
              <button className="outline-button" onClick={onCreateList}>
                New list
              </button>
            </div>
          </fieldset>

          {/* Options belong to a single source, so they appear only with that source. */}
          {settings.sourceIds.includes('number') && (
            <fieldset className="settings-group">
              <legend>Number range</legend>
              <div className="range-row">
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
              </div>
            </fieldset>
          )}

          {settings.sourceIds.includes('letter') && (
            <fieldset className="settings-group">
              <legend>Letter case</legend>
              {/* Associated by id rather than nested: a checkbox inside its own label gets
                  the click twice — once directly, once forwarded — and lands back where
                  it started. */}
              <div className="switch-row">
                <label htmlFor="both-cases">Include lowercase</label>
                <input
                  id="both-cases"
                  type="checkbox"
                  role="switch"
                  checked={settings.bothCases}
                  onChange={(e) => onChange({ ...settings, bothCases: e.target.checked })}
                />
              </div>
            </fieldset>
          )}

          <fieldset className="settings-group">
            <legend>Repeat picks</legend>
            <div className="switch-row">
              <label htmlFor="repeat">Allow the same answer twice</label>
              <input
                id="repeat"
                type="checkbox"
                role="switch"
                checked={settings.repeat}
                onChange={(e) => onChange({ ...settings, repeat: e.target.checked })}
              />
            </div>
          </fieldset>

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
            <p className="settings-hint">
              {animations.find((a) => a.id === settings.animationId)?.description}
            </p>
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
