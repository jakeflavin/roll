import { shortcuts } from '@/lib/shortcuts'

/** The cheat sheet. Reached from the settings page, and from the help shortcut directly. */
export function ShortcutsPage() {
  return (
    <ul className="shortcut-list">
      {shortcuts.map((shortcut) => (
        <li key={shortcut.label}>
          <span>{shortcut.label}</span>
          <span className="shortcut-keys">
            {shortcut.keys.map((key) => (
              <kbd key={key}>{key}</kbd>
            ))}
          </span>
        </li>
      ))}
    </ul>
  )
}
