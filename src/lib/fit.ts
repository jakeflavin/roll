/**
 * How big the picked value is set.
 *
 * Two rules, and they answer different questions. A slot on its own is sized to what it
 * is showing, because there is nothing on screen for it to disagree with. Slots sharing
 * a stage are sized together, from the longest value their pools could produce — set
 * individually they read as a heading and a footnote, and set from the current values
 * they resized against each other on every roll.
 *
 * Both stop at the same floor. Without one the type kept shrinking until the value fitted
 * on a single line, which put a 43-character name on screen at 8px, under its own label.
 * Past the floor the value wraps instead.
 */

/** Values up to this many characters render at full size; longer ones scale down. */
export const FULL_SIZE_CHARS = 5

/** The widest a line gets before the value wraps rather than shrinking further. */
export const MAX_LINE_CHARS = 14

const MIN_FIT = FULL_SIZE_CHARS / MAX_LINE_CHARS

/** A length that can be divided by. The result of this goes into a CSS calc(), where
 *  NaN is not a number the browser will take — it drops the whole declaration. */
const usable = (chars: number) => (Number.isFinite(chars) ? Math.max(chars, 1) : 1)

export function fitScale(chars: number) {
  return Math.min(1, Math.max(MIN_FIT, FULL_SIZE_CHARS / usable(chars)))
}

/** How many lines a value of this length needs once the floor has stopped the shrinking. */
export function lineCount(chars: number) {
  return Math.max(1, Math.ceil(usable(chars) / MAX_LINE_CHARS))
}

/** Length in characters as a reader counts them, so an emoji is one and not two. */
export const charCount = (value: string) => [...value].length
