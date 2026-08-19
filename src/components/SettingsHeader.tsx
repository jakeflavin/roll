import { ChevronLeft, X } from 'lucide-react'
import { DrawerHeader } from './drawer.styled'
import { IconButton } from './buttons.styled'

type SettingsHeaderProps = {
  title: string
  onClose: () => void
  /** Given only on a sub-page; its absence is what makes this the top level. */
  onBack?: () => void
}

/** The bar every page of the drawer wears, so a sub-page cannot drift from the main one. */
export function SettingsHeader({ title, onClose, onBack }: SettingsHeaderProps) {
  return (
    <DrawerHeader>
      {onBack && (
        <IconButton onClick={onBack} aria-label="Back to settings">
          <ChevronLeft size={18} />
        </IconButton>
      )}
      <h2>{title}</h2>
      <IconButton onClick={onClose} aria-label="Close settings">
        <X size={18} />
      </IconButton>
    </DrawerHeader>
  )
}
