import '@testing-library/jest-dom'

/*
 * jsdom understands <dialog> markup and the `open` property, but implements neither
 * showModal() nor close(). Without these a dialog under test silently stays shut, and
 * every assertion about it passes for the wrong reason.
 *
 * Deliberately the smallest thing that makes the contract observable: open/closed state
 * and the close event. The parts jsdom cannot do at all — the top layer, focus trapping,
 * ::backdrop, inertness — are the browser's job, and belong in a browser check.
 */
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement, value?: string) {
    if (!this.open) return
    this.open = false
    if (value !== undefined) this.returnValue = value
    this.dispatchEvent(new Event("close"))
  }
}

/*
 * jsdom has no media queries at all, and every app in this set reads one — the theme
 * hooks watch prefers-color-scheme, and roll asks whether there is a pointer worth
 * showing keyboard shortcuts for. Without this, rendering any of them throws.
 *
 * Nothing matches, which is the honest answer for a headless DOM with no device behind
 * it. A test that needs a query to match overrides this stub.
 */
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}
