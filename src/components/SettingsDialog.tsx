import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { themes } from '../themes'
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

  return (
    <dialog ref={ref} className="settings" onClose={onClose}>
      <div className="settings-header">
        <h2>Settings</h2>
        <button className="icon-button" onClick={onClose} aria-label="Close settings">
          <X size={18} />
        </button>
      </div>

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

      <fieldset className="settings-group">
        <legend>Background</legend>
        <div className="theme-row">
          {themes.map((t) => (
            <button
              key={t.id}
              className={`theme-swatch${t.id === settings.themeId ? ' is-active' : ''}`}
              style={{ background: t.background }}
              onClick={() => onChange({ ...settings, themeId: t.id })}
              aria-label={t.name}
              aria-pressed={t.id === settings.themeId}
            />
          ))}
        </div>
      </fieldset>
    </dialog>
  )
}
