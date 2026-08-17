import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { groupByDay, type Session } from '../session'
import { sourceById } from '../sources'

type Props = {
  open: boolean
  onClose: () => void
  session: Session
  onClear: () => void
}

export function SessionDialog({ open, onClose, session, onClear }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

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
                    <span className="session-source">{sourceById(entry.sourceId).name}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <button className="danger-button" onClick={onClear}>
            Clear session
          </button>
        </>
      )}
    </dialog>
  )
}
