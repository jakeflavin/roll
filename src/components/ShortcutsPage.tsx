import { shortcuts } from '@/lib/shortcuts'
import { Keys, Shortcuts } from './SessionDialog.styled'

/** The cheat sheet. Reached from the settings page, and from the help shortcut directly. */
export function ShortcutsPage() {
  return (
    <Shortcuts>
      {shortcuts.map((shortcut) => (
        <li key={shortcut.label}>
          <span>{shortcut.label}</span>
          <Keys>
            {shortcut.keys.map((key) => (
              <kbd key={key}>{key}</kbd>
            ))}
          </Keys>
        </li>
      ))}
    </Shortcuts>
  )
}
