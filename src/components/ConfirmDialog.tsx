import { useDialog } from '../hooks/useDialog'

type Props = {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Sits above whichever drawer raised it. Destructive actions here take away things the
 * app cannot rebuild — a session is also the memory that prevents repeats — so they
 * ask first.
 */
export function ConfirmDialog({ open, title, body, confirmLabel, onConfirm, onCancel }: Props) {
  // Cancelling is the safe outcome, so dismissing by any means cancels.
  const { ref } = useDialog(open, onCancel)

  return (
    <dialog ref={ref} className="confirm" onClose={onCancel}>
      <h2>{title}</h2>
      <p>{body}</p>
      <div className="confirm-actions">
        <button className="outline-button" onClick={onCancel}>
          Cancel
        </button>
        <button className="outline-button is-danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
