import { useState } from 'react'
import { DayGroup, DayLabel, PickMeta, PickValue, Picks } from './SessionDialog.styled'
import { Drawer, DrawerHeader, Hint, LinkButton, OptionsCount } from './drawer.styled'
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
    <Drawer ref={ref} onClose={onClose} onClick={onBackdropClick}>
      <DrawerHeader>
        <h2>Session</h2>
        <IconButton onClick={onClose} aria-label="Close session">
          <X size={18} />
        </IconButton>
      </DrawerHeader>

      {days.length === 0 ? (
        <Hint>Nothing picked yet. Your picks will collect here.</Hint>
      ) : (
        <>
          <OptionsCount>
            {session.entries.length} {session.entries.length === 1 ? 'pick' : 'picks'}
          </OptionsCount>

          {days.map((day) => (
            <DayGroup key={day.label}>
              <DayLabel>{day.label}</DayLabel>
              <Picks>
                {day.entries.map((entry) => (
                  <li key={`${entry.at}-${entry.value}`}>
                    <PickValue>{entry.value}</PickValue>
                    <PickMeta>
                      <span>{entry.sourceName ?? sourceById(entry.sourceId).name}</span>
                      {/* Two identical rows are otherwise indistinguishable, and look
                          like a bug rather than two separate rolls. */}
                      <time dateTime={new Date(entry.at).toISOString()}>
                        {new Date(entry.at).toLocaleTimeString(undefined, {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </time>
                    </PickMeta>
                  </li>
                ))}
              </Picks>
            </DayGroup>
          ))}

          {/* Quiet by default: it destroys the history and the no-repeat memory with
              it, so it should not compete with reading the list. */}
          <LinkButton $danger onClick={() => setConfirming(true)}>
            Clear session
          </LinkButton>

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
    </Drawer>
  )
}
