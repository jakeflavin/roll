import { useDialog } from '@/hooks/useDialog'
import { ButtonRow, Confirm, OutlineButton } from './drawer.styled'

type ConfirmDialogProps = {
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
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Cancelling is the safe outcome, so dismissing by any means cancels.
  const { ref } = useDialog(open, onCancel)

  return (
    <Confirm ref={ref} onClose={onCancel}>
      <h2>{title}</h2>
      <p>{body}</p>
      <ButtonRow>
        <OutlineButton onClick={onCancel}>
          Cancel
        </OutlineButton>
        <OutlineButton $danger onClick={onConfirm}>
          {confirmLabel}
        </OutlineButton>
      </ButtonRow>
    </Confirm>
  )
}
