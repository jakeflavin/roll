import { useState } from 'react'
import { IconButton } from './buttons.styled'
import { X } from 'lucide-react'
import { groupByDay, type Session } from '@/lib/session'
import { sourceById } from '@/lib/sources'
import { useDialog } from '@/hooks/useDialog'
import { ConfirmDialog } from './ConfirmDialog'

type SessionDialogProps = {
  open: boolean
  onClose: () => void
  session: Session
  onClear: () => void
}

export function SessionDialog({ open, onClose, session, onClear }: SessionDialogProps) {
  const { ref, onBackdropClick } = useDialog(open, onClose)
  const [confirming, setConfirming] = useState(false)

  const days = groupByDay(session.entries)

  return (
    <dialog ref={ref} className="drawer drawer-session" onClose={onClose} onClick={onBackdropClick}>
      <div className="settings-header">
        <h2>Session</h2>
        <IconButton onClick={onClose} aria-label="Close session">
          <X size={18} />
        </IconButton>
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
