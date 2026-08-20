export type AnimationId = 'roll' | 'reveal' | 'scramble' | 'flip' | 'confetti' | 'fireworks'

export type Animation = {
  id: AnimationId
  /** Shown on its card in settings; the roll button's label never changes. */
  name: string
  description: string
}

/** Non-empty by construction, so the default below is an Animation rather than a maybe. */
export const animations: [Animation, ...Animation[]] = [
  {
    id: 'roll',
    name: 'Roll',
    description: 'Flicks past, slows to a stop.',
  },
  {
    id: 'reveal',
    name: 'Reveal',
    description: 'Scatters to dust, reforms.',
  },
  {
    id: 'scramble',
    name: 'Scramble',
    description: 'Locks in one spot at a time.',
  },
  {
    id: 'flip',
    name: 'Flip',
    description: 'The card turns over.',
  },
  {
    id: 'confetti',
    name: 'Confetti',
    description: 'Lands, then throws confetti.',
  },
  {
    id: 'fireworks',
    name: 'Fireworks',
    description: 'Lands, then sets off fireworks.',
  },
]

export const defaultAnimation = animations[0]

export function animationById(id: AnimationId): Animation {
  return animations.find((a) => a.id === id) ?? defaultAnimation
}

/** Run lengths, kept beside the animations they belong to. */
export const ROLL_MS = 1500
export const SCRAMBLE_MS = 1100
export const FLIP_MS = 1250
export const FLIP_COUNT = 3
// Long enough to read as disperse → drift → reform.
export const REVEAL_MS = 1600
/** The tail of a reveal, where the canvas cross-fades into the real text. */
export const HANDOFF_MS = 260

/**
 * A celebration hides the value the way Reveal does: it fills the stage, the value
 * changes underneath, and the new one is uncovered as the effect clears.
 */
export const CONFETTI_MS = 2000
export const FIREWORKS_MS = 2200
// How long the value takes to fade behind a celebration is owned by the stylesheet,
// on .value-cover — motion would not honour an opacity target set beside a transform.
/** The value changes here, while nothing can be read through the cover. */
export const CELEBRATION_SWAP_MS = 620
/** Where in the run the new value is uncovered. */
export const CELEBRATION_SHOW_AT = 0.58

/** How long a roll takes, so a caller knows when everything has landed. */
export function animationDuration(animation: AnimationId) {
  if (animation === 'scramble') return SCRAMBLE_MS
  if (animation === 'flip') return FLIP_MS
  if (animation === 'reveal') return REVEAL_MS
  if (animation === 'confetti') return CONFETTI_MS
  if (animation === 'fireworks') return FIREWORKS_MS
  return ROLL_MS
}

/** When the new value is uncovered, in milliseconds from the start of the run. */
export function celebrationShowAt(animation: AnimationId) {
  return animationDuration(animation) * CELEBRATION_SHOW_AT
}

/** Whether the animation covers the value with a celebration rather than moving it. */
export function isCelebration(animation: AnimationId) {
  return animation === 'confetti' || animation === 'fireworks'
}
