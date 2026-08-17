import { useEffect, useRef } from 'react'

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
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

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
