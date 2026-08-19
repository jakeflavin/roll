import { useRef, useState } from 'react'
import { FieldLabel, FieldValue, GroupField, Hint, ImageThumb, OutlineButton, SegmentButton, Segmented as SegmentedRow, VisuallyHidden } from './drawer.styled'
import { IconButton } from './buttons.styled'
import { ImagePlus, Trash2 } from 'lucide-react'
import type { CustomTheme } from '@/lib/themes'
import { ImageError, readBackgroundImage } from '@/lib/image'

type CustomThemeControlsProps = {
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
    <SegmentedRow $inline>
      {options.map((option) => (
        <SegmentButton
          key={option.id}
          $active={option.id === value}
          aria-pressed={option.id === value}
          onClick={() => onPick(option.id)}
        >
          {option.label}
        </SegmentButton>
      ))}
    </SegmentedRow>
  )
}

/**
 * The rows that build the custom theme, shown inside its card once it is the selected
 * theme. The page behind the drawer is the preview: every change lands on it live.
 */
export function CustomThemeControls({ custom, onChange }: CustomThemeControlsProps) {
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
      <GroupField $wrap>
        <Segmented
          value={custom.mode}
          options={[
            { id: 'gradient', label: 'Gradient' },
            { id: 'image', label: 'Image' },
          ]}
          onPick={(mode) => onChange({ mode })}
        />
      </GroupField>

      {custom.mode === 'gradient' ? (
        <>
          {/* The swatches carry their own colour, so a label beside them would only
              repeat what is already visible. The names live on the accessible label. */}
          <GroupField $wrap>
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
          </GroupField>
          <GroupField>
            <FieldLabel as="label" htmlFor="angle">
              Angle
            </FieldLabel>
            <input
              id="angle"
              type="range"
              min={0}
              max={359}
              value={custom.angle}
              onChange={(e) => onChange({ angle: Number(e.target.value) })}
            />
            <FieldValue>{custom.angle}&deg;</FieldValue>
          </GroupField>
        </>
      ) : (
        <>
          <GroupField $wrap>
            {custom.image && (
              <ImageThumb
                style={{ backgroundImage: `url("${custom.image}")` }}
                aria-hidden="true"
              />
            )}
            <OutlineButton
              onClick={() => fileRef.current?.click()}
              disabled={working}
            >
              <ImagePlus size={15} aria-hidden="true" />
              {working ? 'Working…' : custom.image ? 'Replace' : 'Choose image'}
            </OutlineButton>
            {custom.image && (
              <IconButton
                $quiet
                onClick={() => {
                  onChange({ image: null })
                  setError(null)
                }}
                aria-label="Remove image"
              >
                <Trash2 size={16} />
              </IconButton>
            )}
            <VisuallyHidden
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </GroupField>
          {!custom.image && !error && (
            <Hint $inset>
              Pictures stay on this device. A shared link carries the gradient instead.
            </Hint>
          )}
        </>
      )}

      {error && <Hint $inset $error>{error}</Hint>}

      <GroupField $wrap>
        <Segmented
          value={custom.ink}
          options={[
            { id: 'light', label: 'Light' },
            { id: 'dark', label: 'Dark' },
          ]}
          onPick={(ink) => onChange({ ink })}
        />
      </GroupField>
    </>
  )
}
