export type AnimationId = 'roll' | 'reveal' | 'scramble' | 'flip'

export type Animation = {
  id: AnimationId
  /** Also the roll button's label, so the button names the action in play. */
  name: string
  busyLabel: string
  description: string
}

export const animations: Animation[] = [
  {
    id: 'roll',
    name: 'Roll',
    busyLabel: 'Rolling…',
    description: 'Flicks past, slows to a stop.',
  },
  {
    id: 'reveal',
    name: 'Reveal',
    busyLabel: 'Revealing…',
    description: 'Scatters to dust, reforms.',
  },
  {
    id: 'scramble',
    name: 'Scramble',
    busyLabel: 'Scrambling…',
    description: 'Digits lock in one at a time.',
  },
  {
    id: 'flip',
    name: 'Flip',
    busyLabel: 'Flipping…',
    description: 'The card turns over.',
  },
]

export const defaultAnimation = animations[0]

export function animationById(id: AnimationId): Animation {
  return animations.find((a) => a.id === id) ?? defaultAnimation
}
