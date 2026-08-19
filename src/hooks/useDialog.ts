import { useEffect, useRef, type MouseEvent } from 'react'

/**
 * Drives a native `<dialog>` from a boolean, and offers a backdrop-click handler.
 *
 * A modal dialog is opened imperatively rather than by rendering, so every dialog in
 * the app needs the same effect to keep the element in step with its prop. Backdrop
 * clicks are dispatched on the dialog element itself, so telling "clicked the backdrop"
 * from "clicked inside" needs a hit test against its box — the element's own padding
 * would otherwise count as outside.
 */
export function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  const onBackdropClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target !== ref.current) return
    const { top, right, bottom, left } = ref.current.getBoundingClientRect()
    const outside =
      e.clientX < left || e.clientX > right || e.clientY < top || e.clientY > bottom
    if (outside) onClose()
  }

  return { ref, onBackdropClick }
}
