import { ChevronLeft, X } from 'lucide-react'

type SettingsHeaderProps = {
  title: string
  onClose: () => void
  /** Given only on a sub-page; its absence is what makes this the top level. */
  onBack?: () => void
}

/** The bar every page of the drawer wears, so a sub-page cannot drift from the main one. */
export function SettingsHeader({ title, onClose, onBack }: SettingsHeaderProps) {
  return (
    <div className="settings-header">
      {onBack && (
        <button className="icon-button" onClick={onBack} aria-label="Back to settings">
          <ChevronLeft size={18} />
        </button>
      )}
      <h2>{title}</h2>
      <button className="icon-button" onClick={onClose} aria-label="Close settings">
        <X size={18} />
      </button>
    </div>
  )
}
