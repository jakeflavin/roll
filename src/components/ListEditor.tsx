import { useRef, useState } from 'react'
import { Plus, Upload, X } from 'lucide-react'
import { cleanItems, parseCsv, type CustomList } from '../lib/lists'
import { ConfirmDialog } from './ConfirmDialog'

type Props = {
  list: CustomList
  onUpdate: (patch: Partial<Omit<CustomList, 'id'>>) => void
  onDelete: () => void
}

export function ListEditor({ list, onUpdate, onDelete }: Props) {
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
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
      // What the file held is not what gets added: entries already in the list are
      // skipped, so reporting the parsed count would overstate it.
      const added = cleanItems([...list.items, ...items]).length - list.items.length
      if (!items.length) {
        setStatus('No entries found in that file.')
      } else {
        onUpdate({ items: [...list.items, ...items] })
        setStatus(
          added === 0
            ? `Everything in ${file.name} was already here.`
            : `Added ${added} from ${file.name}.`,
        )
      }
    } catch {
      setStatus("That file couldn't be read.")
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      {/* The list is its own card, the way a group is on the settings page: its name
          sits bare at the top, and the ways of filling it are rows beneath. */}
      <div className="group-card">
        <div className="group-head">
          <input
            className="bare-input"
            value={list.name}
            aria-label="List name"
            onChange={(e) => onUpdate({ name: e.target.value })}
            onBlur={() => !list.name.trim() && onUpdate({ name: 'My list' })}
          />
        </div>

        <div className="group-field">
          <input
            className="plain-input"
            value={draft}
            placeholder="Add an entry"
            aria-label="Add an entry"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addItems(draft)
              }
            }}
          />
          <button className="ghost-button" onClick={() => addItems(draft)} aria-label="Add entry">
            <Plus size={18} />
          </button>
        </div>

        <button className="group-link" onClick={() => fileRef.current?.click()}>
          Upload CSV
          <Upload size={15} aria-hidden="true" />
        </button>
        <input
          ref={fileRef}
          className="visually-hidden"
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>

      {/* Only speaks when there is something to report. */}
      {status && <p className="settings-hint">{status}</p>}

      <fieldset className="settings-group">
        <legend>
          {list.items.length} {list.items.length === 1 ? 'entry' : 'entries'}
        </legend>
        {list.items.length === 0 ? (
          <p className="settings-hint">Nothing here yet.</p>
        ) : (
          <ul className="entry-list">
            {list.items.map((item) => (
              <li key={item}>
                <span>{item}</span>
                <button
                  className="ghost-button is-small"
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

      {/* Quiet, like clearing a session: destructive, so it should not look like the
          ordinary actions above it. */}
      <button className="link-button is-danger" onClick={() => setConfirming(true)}>
        Delete list
      </button>

      <ConfirmDialog
        open={confirming}
        title={`Delete ${list.name}?`}
        body={`Its ${list.items.length} ${
          list.items.length === 1 ? 'entry goes' : 'entries go'
        } with it. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          setConfirming(false)
          onDelete()
        }}
        onCancel={() => setConfirming(false)}
      />
    </>
  )
}
