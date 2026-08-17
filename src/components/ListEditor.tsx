import { useRef, useState } from 'react'
import { Plus, Upload, X } from 'lucide-react'
import { parseCsv, type CustomList } from '../lists'

type Props = {
  list: CustomList
  onUpdate: (patch: Partial<Omit<CustomList, 'id'>>) => void
  onDelete: () => void
}

export function ListEditor({ list, onUpdate, onDelete }: Props) {
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const addItems = (raw: string) => {
    // Commas and newlines both separate, so a pasted block of names lands as a block
    // rather than as one long entry.
    const parts = raw
      .split(/[\n,]/)
      .map((part) => part.trim())
      .filter(Boolean)
    if (!parts.length) return
    onUpdate({ items: [...list.items, ...parts] })
    setDraft('')
    setStatus(null)
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const items = parseCsv(await file.text())
      if (!items.length) {
        setStatus('No entries found in that file.')
      } else {
        onUpdate({ items: [...list.items, ...items] })
        setStatus(`Added ${items.length} from ${file.name}.`)
      }
    } catch {
      setStatus("That file couldn't be read.")
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      <fieldset className="settings-group">
        <legend>Name</legend>
        <input
          className="text-input"
          value={list.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          onBlur={() => !list.name.trim() && onUpdate({ name: 'My list' })}
        />
      </fieldset>

      <fieldset className="settings-group">
        <legend>Add entries</legend>
        <div className="backup-row">
          <input
            className="text-input"
            value={draft}
            placeholder="Ada Lovelace"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addItems(draft)
              }
            }}
          />
          <button
            className="icon-button"
            onClick={() => addItems(draft)}
            aria-label="Add entry"
          >
            <Plus size={18} />
          </button>
        </div>

        <button className="outline-button is-wide" onClick={() => fileRef.current?.click()}>
          <Upload size={15} aria-hidden="true" />
          Upload CSV
        </button>
        <input
          ref={fileRef}
          className="visually-hidden"
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={(e) => onFile(e.target.files?.[0])}
        />

        <p className="settings-hint">
          {status ?? 'One entry per row, from the first column. Duplicates are skipped.'}
        </p>
      </fieldset>

      <fieldset className="settings-group">
        <legend>
          {list.items.length} {list.items.length === 1 ? 'entry' : 'entries'}
        </legend>
        {list.items.length === 0 ? (
          <p className="settings-hint">Nothing here yet. Add entries or upload a CSV.</p>
        ) : (
          <ul className="entry-list">
            {list.items.map((item) => (
              <li key={item}>
                <span>{item}</span>
                <button
                  className="entry-remove"
                  onClick={() => onUpdate({ items: list.items.filter((i) => i !== item) })}
                  aria-label={`Remove ${item}`}
                >
                  <X size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <button className="danger-button" onClick={onDelete}>
        Delete list
      </button>
    </>
  )
}
