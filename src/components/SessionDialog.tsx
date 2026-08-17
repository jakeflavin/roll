import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { groupByDay, type Session } from '../session'
import { sourceById } from '../sources'
import { ConfirmDialog } from './ConfirmDialog'

type Props = {
  open: boolean
  onClose: () => void
  session: Session
  onClear: () => void
}

export function SessionDialog({ open, onClose, session, onClear }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  // Backdrop clicks are dispatched on the dialog itself, so a hit test against its box
  // is what separates "clicked the backdrop" from "clicked inside the drawer".
  const onDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target !== ref.current) return
    const { top, right, bottom, left } = ref.current.getBoundingClientRect()
    const outside =
      e.clientX < left || e.clientX > right || e.clientY < top || e.clientY > bottom
    if (outside) onClose()
  }

  const days = groupByDay(session.entries)

  return (
    <dialog
      ref={ref}
      className="drawer drawer-session"
      onClose={onClose}
      onClick={onDialogClick}
    >
      <div className="settings-header">
        <h2>Session</h2>
        <button className="icon-button" onClick={onClose} aria-label="Close session">
          <X size={18} />
        </button>
      </div>

      {days.length === 0 ? (
        <p className="settings-hint">Nothing picked yet. Your picks will collect here.</p>
      ) : (
        <>
          <p className="options-count">
            {session.entries.length} {session.entries.length === 1 ? 'pick' : 'picks'}
          </p>

          {days.map((day) => (
            <section key={day.label} className="session-day">
              <h3 className="session-day-label">{day.label}</h3>
              <ul className="session-list">
                {day.entries.map((entry) => (
                  <li key={`${entry.at}-${entry.value}`}>
                    <span className="session-value">{entry.value}</span>
                    <span className="session-meta">
                      <span>{entry.sourceName ?? sourceById(entry.sourceId).name}</span>
                      {/* Two identical rows are otherwise indistinguishable, and look
                          like a bug rather than two separate rolls. */}
                      <time dateTime={new Date(entry.at).toISOString()}>
                        {new Date(entry.at).toLocaleTimeString(undefined, {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </time>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {/* Quiet by default: it destroys the history and the no-repeat memory with
              it, so it should not compete with reading the list. */}
          <button className="link-button is-danger" onClick={() => setConfirming(true)}>
            Clear session
          </button>

          <ConfirmDialog
            open={confirming}
            title="Clear this session?"
            body={`${session.entries.length} past ${
              session.entries.length === 1 ? 'pick' : 'picks'
            } will be forgotten, and every group starts repeating from the top.`}
            confirmLabel="Clear"
            onConfirm={() => {
              setConfirming(false)
              onClear()
            }}
            onCancel={() => setConfirming(false)}
          />
        </>
      )}
    </dialog>
  )
}
