import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { themes } from '../themes'
import { animations } from '../animations'
import { sources } from '../sources'
import type { Settings } from '../useSettings'

type Props = {
  open: boolean
  onClose: () => void
  settings: Settings
  onChange: (next: Settings) => void
}

export function SettingsDialog({ open, onClose, settings, onChange }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
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

  return (
    <dialog ref={ref} className="settings" onClose={onClose} onClick={onDialogClick}>
      <div className="settings-header">
        <h2>Settings</h2>
        <button className="icon-button" onClick={onClose} aria-label="Close settings">
          <X size={18} />
        </button>
      </div>

      <fieldset className="settings-group">
        <legend>Pick from</legend>
        <div className="source-grid">
          {sources.map((s) => (
            <button
              key={s.id}
              className={`chip${s.id === settings.sourceId ? ' is-active' : ''}`}
              onClick={() => onChange({ ...settings, sourceId: s.id })}
              aria-pressed={s.id === settings.sourceId}
            >
              {s.name}
            </button>
          ))}
        </div>
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
    </dialog>
  )
}
