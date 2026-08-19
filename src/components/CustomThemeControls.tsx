import { useRef, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import type { CustomTheme } from '../lib/themes'
import { ImageError, readBackgroundImage } from '../lib/image'

type Props = {
  custom: CustomTheme
  onChange: (patch: Partial<CustomTheme>) => void
}

/** A pair of choices drawn as one control, for the rows that have exactly two. */
function Segmented<T extends string>({
  value,
  options,
  onPick,
}: {
  value: T
  options: { id: T; label: string }[]
  onPick: (id: T) => void
}) {
  return (
    <div className="segmented is-inline">
      {options.map((option) => (
        <button
          key={option.id}
          className={`segment-button${option.id === value ? ' is-active' : ''}`}
          aria-pressed={option.id === value}
          onClick={() => onPick(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/**
 * The rows that build the custom theme, shown inside its card once it is the selected
 * theme. The page behind the drawer is the preview: every change lands on it live.
 */
export function CustomThemeControls({ custom, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setWorking(true)
    setError(null)
    try {
      // Choosing a picture is also choosing to use it; leaving the gradient up would
      // make the upload look as though it had failed.
      onChange({ image: await readBackgroundImage(file), mode: 'image' })
    } catch (e) {
      setError(e instanceof ImageError ? e.message : 'That image could not be read.')
    } finally {
      setWorking(false)
      // Cleared so choosing the same file again still fires a change event.
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      <div className="group-field is-kinds">
        <Segmented
          value={custom.mode}
          options={[
            { id: 'gradient', label: 'Gradient' },
            { id: 'image', label: 'Image' },
          ]}
          onPick={(mode) => onChange({ mode })}
        />
      </div>

      {custom.mode === 'gradient' ? (
        <>
          {/* The swatches carry their own colour, so a label beside them would only
              repeat what is already visible. The names live on the accessible label. */}
          <div className="group-field is-colors">
            <input
              type="color"
              aria-label="Gradient start"
              value={custom.from}
              onChange={(e) => onChange({ from: e.target.value })}
            />
            <input
              type="color"
              aria-label="Gradient end"
              value={custom.to}
              onChange={(e) => onChange({ to: e.target.value })}
            />
          </div>
          <div className="group-field">
            <label className="field-label" htmlFor="angle">
              Angle
            </label>
            <input
              id="angle"
              type="range"
              min={0}
              max={359}
              value={custom.angle}
              onChange={(e) => onChange({ angle: Number(e.target.value) })}
            />
            <span className="field-value">{custom.angle}&deg;</span>
          </div>
        </>
      ) : (
        <>
          <div className="group-field is-image">
            {custom.image && (
              <span
                className="image-thumb"
                style={{ backgroundImage: `url("${custom.image}")` }}
                aria-hidden="true"
              />
            )}
            <button
              className="outline-button"
              onClick={() => fileRef.current?.click()}
              disabled={working}
            >
              <ImagePlus size={15} aria-hidden="true" />
              {working ? 'Working…' : custom.image ? 'Replace' : 'Choose image'}
            </button>
            {custom.image && (
              <button
                className="icon-button is-quiet"
                onClick={() => {
                  onChange({ image: null })
                  setError(null)
                }}
                aria-label="Remove image"
              >
                <Trash2 size={16} />
              </button>
            )}
            <input
              ref={fileRef}
              className="visually-hidden"
              type="file"
              accept="image/*"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </div>
          {!custom.image && !error && (
            <p className="settings-hint is-inset">
              Pictures stay on this device. A shared link carries the gradient instead.
            </p>
          )}
        </>
      )}

      {error && <p className="settings-hint is-inset is-error">{error}</p>}

      <div className="group-field is-kinds">
        <Segmented
          value={custom.ink}
          options={[
            { id: 'light', label: 'Light' },
            { id: 'dark', label: 'Dark' },
          ]}
          onPick={(ink) => onChange({ ink })}
        />
      </div>
    </>
  )
}
