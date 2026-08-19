export type Shortcut = {
  keys: string[]
  label: string
}

export const shortcuts: Shortcut[] = [
  { keys: ['Space', 'Enter'], label: 'Roll' },
  { keys: ['S'], label: 'Open settings' },
  { keys: ['H'], label: 'Open session' },
  { keys: ['?'], label: 'Show these shortcuts' },
  { keys: ['Esc'], label: 'Close a drawer' },
]

/** Narrows an event target to an element; keydown can also target window or document,
 *  which have none of the element methods a guard would want to call. */
export function targetElement(target: EventTarget | null) {
  return target instanceof HTMLElement ? target : null
}

/** True while the keystroke belongs to something the user is typing into. */
export function isTypingTarget(target: EventTarget | null) {
  const el = targetElement(target)
  if (!el) return false
  return (
    el.isContentEditable ||
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT'
  )
}

/** A modal drawer takes over the keyboard; shortcuts behind it would act unseen. */
export function isDrawerOpen() {
  return document.querySelector('dialog[open]') !== null
}
