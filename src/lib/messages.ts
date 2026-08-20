/**
 * What the stage says when it has no value to show.
 *
 * These are the app talking, not the hat answering, and the distinction matters beyond
 * how they are set. A message must never travel the way a value does: not into the
 * session history, not into the share link, and not into the theme swatches, all of
 * which take whatever the picker settles on. Keeping them here, apart from the pools,
 * is what makes "is this a value?" a question with one answer.
 */

/** The pool has nothing in it — a custom list that has not been filled in yet. */
export const EMPTY_TEXT = 'No entries yet'

/** The pool had something, and every bit of it has now been drawn. */
export const EXHAUSTED_TEXT = 'All picked'
