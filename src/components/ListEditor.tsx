import { useRef, useState } from 'react'
import { Entries } from './SessionDialog.styled'
import { BareInput, GhostButton, Group, GroupCard, GroupField, GroupHead, GroupLink, Hint, LinkButton, PlainInput, VisuallyHidden } from './drawer.styled'
import { Plus, Upload, X } from 'lucide-react'
import { cleanItems, parseCsv, type CustomList } from '@/lib/lists'
import { ConfirmDialog } from './ConfirmDialog'

type ListEditorProps = {
  list: CustomList
  onUpdate: (patch: Partial<Omit<CustomList, 'id'>>) => void
  onDelete: () => void
}

export function ListEditor({ list, onUpdate, onDelete }: ListEditorProps) {
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
      <GroupCard>
        <GroupHead>
          <BareInput
            value={list.name}
            aria-label="List name"
            onChange={(e) => onUpdate({ name: e.target.value })}
            onBlur={() => !list.name.trim() && onUpdate({ name: 'My list' })}
          />
        </GroupHead>

        <GroupField>
          <PlainInput
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
          <GhostButton onClick={() => addItems(draft)} aria-label="Add entry">
            <Plus size={18} />
          </GhostButton>
        </GroupField>

        <GroupLink onClick={() => fileRef.current?.click()}>
          Upload CSV
          <Upload size={15} aria-hidden="true" />
        </GroupLink>
        <VisuallyHidden
          ref={fileRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </GroupCard>

      {/* Only speaks when there is something to report. */}
      {status && <Hint>{status}</Hint>}

      <Group>
        <legend>
          {list.items.length} {list.items.length === 1 ? 'entry' : 'entries'}
        </legend>
        {list.items.length === 0 ? (
          <Hint>Nothing here yet.</Hint>
        ) : (
          <Entries>
            {list.items.map((item) => (
              <li key={item}>
                <span>{item}</span>
                <GhostButton $small
                  onClick={() => onUpdate({ items: list.items.filter((i) => i !== item) })}
                  aria-label={`Remove ${item}`}
                >
                  <X size={15} />
                </GhostButton>
              </li>
            ))}
          </Entries>
        )}
      </Group>

      {/* Quiet, like clearing a session: destructive, so it should not look like the
          ordinary actions above it. */}
      <LinkButton $danger onClick={() => setConfirming(true)}>
        Delete list
      </LinkButton>

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
