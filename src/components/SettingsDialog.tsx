import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, X } from 'lucide-react'
import { themes } from '../themes'
import { animations } from '../animations'
import { sourceById, sources, type SourceId } from '../sources'
import type { Settings } from '../useSettings'

type Props = {
  open: boolean
  onClose: () => void
  settings: Settings
  onChange: (next: Settings) => void
}

export function SettingsDialog({ open, onClose, settings, onChange }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  // The drawer has two pages: the settings themselves, and the pool of the selected
  // source. Kept here rather than in app state — it is drawer-local navigation.
  const [showingOptions, setShowingOptions] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
    // Reopening should land on the settings, never on whatever page was last seen.
    if (open) setShowingOptions(false)
  }, [open])

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

  const source = sourceById(settings.sourceId)

  return (
    <dialog ref={ref} className="settings" onClose={onClose} onClick={onDialogClick}>
      {showingOptions && source.options ? (
        <>
          <div className="settings-header">
            <button
              className="icon-button"
              onClick={() => setShowingOptions(false)}
              aria-label="Back to settings"
            >
              <ChevronLeft size={18} />
            </button>
            <h2>{source.name}</h2>
            <button className="icon-button" onClick={onClose} aria-label="Close settings">
              <X size={18} />
            </button>
          </div>

          <p className="options-count">{source.options.length} options</p>
          <ul className={`options-list${source.id === 'emoji' ? ' is-emoji' : ''}`}>
            {source.options.map((option) => (
              <li key={option}>{option}</li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <div className="settings-header">
            <h2>Settings</h2>
            <button className="icon-button" onClick={onClose} aria-label="Close settings">
              <X size={18} />
            </button>
          </div>

          <fieldset className="settings-group">
            <legend>Pick from</legend>
            {/* The native arrow sits hard against the control's edge and cannot be
                moved, so it is replaced by one we can place and theme. */}
            <div className="select-wrap">
              <select
                className="select"
                value={settings.sourceId}
                onChange={(e) =>
                  onChange({ ...settings, sourceId: e.target.value as SourceId })
                }
              >
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="select-arrow" size={16} aria-hidden="true" />
            </div>

            {source.options && (
              <button className="link-button" onClick={() => setShowingOptions(true)}>
                View all {source.options.length} options
              </button>
            )}
          </fieldset>

          {/* Options belong to a single source, so they appear only with that source. */}
          {settings.sourceId === 'number' && (
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

          {settings.sourceId === 'letter' && (
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
                      42
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
                  <span className="animation-description">{a.description}</span>
                </button>
              ))}
            </div>
          </fieldset>
        </>
      )}
    </dialog>
  )
}
