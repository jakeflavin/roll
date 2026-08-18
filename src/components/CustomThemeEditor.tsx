import { useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { buildCustomTheme, type CustomTheme } from '../themes'
import { ImageError, readBackgroundImage } from '../image'

type Props = {
  custom: CustomTheme
  onChange: (patch: Partial<CustomTheme>) => void
  /** The value on screen, so the preview shows a real pick rather than filler. */
  sample: string
}

/** The two halves of a choice, drawn as one pair of buttons. */
function Choice<T extends string>({
  value,
  options,
  onPick,
}: {
  value: T
  options: { id: T; label: string }[]
  onPick: (id: T) => void
}) {
  return (
    <div className="choice-grid">
      {options.map((option) => (
        <button
          key={option.id}
          className={`choice-option${option.id === value ? ' is-active' : ''}`}
          aria-pressed={option.id === value}
          onClick={() => onPick(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/** Builds the one theme that is not shipped with the app: the user's own. */
export function CustomThemeEditor({ custom, onChange, sample }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const theme = buildCustomTheme(custom)

  const chooseImage = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    try {
      // Selecting a picture is the whole intent, so it switches mode too rather than
      // leaving the choice made and nothing on screen.
      onChange({ image: await readBackgroundImage(file), mode: 'image' })
    } catch (e) {
      setError(e instanceof ImageError ? e.message : 'That image could not be read.')
    }
  }

  return (
    <>
      <div
        className="custom-preview"
        style={{ background: theme.background, borderColor: theme.border }}
      >
        <span
          className="custom-preview-value"
          style={{
            color: theme.text,
            fontFamily: theme.displayFont,
            fontWeight: theme.displayWeight,
            letterSpacing: theme.displayTracking,
          }}
        >
          {sample}
        </span>
      </div>

      <fieldset className="settings-group">
        <legend>Background</legend>
        <Choice
          value={custom.mode}
          options={[
            { id: 'gradient', label: 'Gradient' },
            { id: 'image', label: 'Image' },
          ]}
          onPick={(mode) => onChange({ mode })}
        />

        {custom.mode === 'gradient' ? (
          <div className="group-card">
            <div className="group-field">
              <label>
                From
                <input
                  type="color"
                  value={custom.from}
                  onChange={(e) => onChange({ from: e.target.value })}
                />
              </label>
              <label>
                To
                <input
                  type="color"
                  value={custom.to}
                  onChange={(e) => onChange({ to: e.target.value })}
                />
              </label>
            </div>
            <div className="group-field">
              <label htmlFor="angle">Angle</label>
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
          </div>
        ) : (
          <div className="group-card">
            <button className="group-link" onClick={() => fileRef.current?.click()}>
              {custom.image ? 'Replace image' : 'Choose an image'}
              <ImagePlus size={15} aria-hidden="true" />
            </button>
            <input
              ref={fileRef}
              className="visually-hidden"
              type="file"
              accept="image/*"
              onChange={(e) => {
                void chooseImage(e.target.files?.[0])
                // Cleared so choosing the same file twice still fires a change.
                e.target.value = ''
              }}
            />
            {custom.image && (
              <button className="group-link is-danger" onClick={() => onChange({ image: null })}>
                Remove image
              </button>
            )}
          </div>
        )}
        {error && <p className="settings-hint is-error">{error}</p>}
        {custom.mode === 'image' && (
          <p className="settings-hint">
            Images stay on this device. A link you share uses the gradient instead.
          </p>
        )}
      </fieldset>

      <fieldset className="settings-group">
        <legend>Text</legend>
        <Choice
          value={custom.ink}
          options={[
            { id: 'light', label: 'Light' },
            { id: 'dark', label: 'Dark' },
          ]}
          onPick={(ink) => onChange({ ink })}
        />
      </fieldset>
    </>
  )
}
