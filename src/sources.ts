import {
  animals,
  bodyParts,
  colors,
  emoji,
  feelings,
  lowerLetters,
  states,
  upperLetters,
} from './data'

export type SourceId =
  | 'number'
  | 'emoji'
  | 'animal'
  | 'color'
  | 'letter'
  | 'bodyPart'
  | 'state'
  | 'feeling'

export type Source = {
  id: SourceId
  name: string
  /**
   * The pool, for sources whose contents are worth browsing. Left off where the
   * options are already obvious from the name — numbers, letters, and US states.
   */
  options?: string[]
}

export const sources: Source[] = [
  { id: 'number', name: 'Number' },
  { id: 'letter', name: 'Letter' },
  { id: 'emoji', name: 'Emoji', options: emoji },
  { id: 'color', name: 'Color', options: colors },
  { id: 'animal', name: 'Animal', options: animals },
  { id: 'feeling', name: 'Feeling', options: feelings },
  { id: 'bodyPart', name: 'Body part', options: bodyParts },
  { id: 'state', name: 'US state' },
]

export const defaultSource = sources[0]

export function sourceById(id: SourceId): Source {
  return sources.find((s) => s.id === id) ?? defaultSource
}

export type SourceConfig = {
  sourceId: SourceId
  min: number
  max: number
  bothCases: boolean
}

/**
 * What the picker actually draws from. `pick` is the value itself; `scrambleChar`
 * feeds the Scramble animation so it churns through characters that belong to the
 * source rather than always through digits.
 */
export type PickSource = {
  pick: () => string
  scrambleChar: () => string
  /** Whether a value belongs to this pool — used to vet a value restored from a URL. */
  has: (value: string) => boolean
}

const sample = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]

function fromList(list: string[]): PickSource {
  // Scrambling uses letters from the list itself, so the churn looks like the words.
  const chars = [...new Set(list.join('').replace(/[^A-Za-z]/g, '').split(''))]
  return {
    pick: () => sample(list),
    scrambleChar: () => sample(chars.length ? chars : list),
    has: (value) => list.includes(value),
  }
}

export function createSource({ sourceId, min, max, bothCases }: SourceConfig): PickSource {
  switch (sourceId) {
    case 'emoji':
      // Emoji have no smaller parts to churn through, so Scramble swaps whole glyphs.
      return {
        pick: () => sample(emoji),
        scrambleChar: () => sample(emoji),
        has: (value) => emoji.includes(value),
      }
    case 'letter': {
      const letters = bothCases ? [...upperLetters, ...lowerLetters] : upperLetters
      return {
        pick: () => sample(letters),
        scrambleChar: () => sample(letters),
        has: (value) => letters.includes(value),
      }
    }
    case 'animal':
      return fromList(animals)
    case 'color':
      return fromList(colors)
    case 'bodyPart':
      return fromList(bodyParts)
    case 'state':
      return fromList(states)
    case 'feeling':
      return fromList(feelings)
    case 'number':
    default: {
      const lo = Math.min(min, max)
      const hi = Math.max(min, max)
      return {
        pick: () => String(Math.floor(Math.random() * (hi - lo + 1)) + lo),
        scrambleChar: () => String(Math.floor(Math.random() * 10)),
        has: (value) => {
          const n = Number(value)
          return /^-?\d+$/.test(value) && n >= lo && n <= hi
        },
      }
    }
  }
}
