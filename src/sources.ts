import { isCustomId, type CustomList } from './lists'
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

export type BuiltInSourceId =
  | 'number'
  | 'emoji'
  | 'animal'
  | 'color'
  | 'letter'
  | 'bodyPart'
  | 'state'
  | 'feeling'

/** Built-in ids, plus `custom:*` for a user's own list. */
export type SourceId = BuiltInSourceId | string

export type Source = {
  id: SourceId
  name: string
  /**
   * The pool, for sources whose contents are worth browsing. Left off where the
   * options are already obvious from the name — numbers, letters, and US states.
   */
  options?: string[]
}

/** Non-empty by construction, so the default below is a Source rather than a maybe. */
export const sources: [Source, ...Source[]] = [
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

/** Every source the picker can offer right now, built-ins first. */
export function allSources(lists: CustomList[]): Source[] {
  return [
    ...sources,
    ...lists.map((list) => ({ id: list.id, name: list.name, options: list.items })),
  ]
}

/**
 * Identity of the pool a value was drawn from, which keys the no-repeat history. Only
 * the options that actually shape the pool are included: editing a custom list's items
 * must not orphan its history, and changing the number range must not reset the
 * animals'.
 */
export function sourceKeyFor({ sourceId, min, max, bothCases }: SourceConfig) {
  if (sourceId === 'number') return `number:${Math.min(min, max)}:${Math.max(min, max)}`
  if (sourceId === 'letter') return `letter:${bothCases}`
  return sourceId
}

/** Falls back when a shared link or an old setting names a list that is not here. */
export function resolveSourceId(sourceId: SourceId, lists: CustomList[]): SourceId {
  if (isCustomId(sourceId)) {
    return lists.some((list) => list.id === sourceId) ? sourceId : defaultSource.id
  }
  return sources.some((s) => s.id === sourceId) ? sourceId : defaultSource.id
}

/**
 * What the picker actually draws from. `pick` is the value itself; `scrambleChar`
 * feeds the Scramble animation so it churns through characters that belong to the
 * source rather than always through digits.
 */
export type PickSource = {
  /** How many values the pool holds; zero means there is nothing to pick. */
  size: number
  pick: () => string
  /** A value not in `drawn`, or null when the pool has nothing left to give. */
  pickExcluding: (drawn: Set<string>) => string | null
  scrambleChar: () => string
  /** Whether a value belongs to this pool — used to vet a value restored from a URL. */
  has: (value: string) => boolean
}

/**
 * A random member. Indexed reads are checked, and every caller here already knows its list
 * is non-empty — so the impossible case throws rather than widening the return to a maybe
 * and pushing a null check onto each of them.
 */
const sample = <T,>(list: T[]): T => {
  const value = list[Math.floor(Math.random() * list.length)]
  if (value === undefined) throw new Error('sample called with an empty list')
  return value
}

function fromList(list: string[]): PickSource {
  // Scrambling uses letters from the list itself, so the churn looks like the words.
  const chars = [...new Set(list.join('').replace(/[^A-Za-z]/g, '').split(''))]
  return {
    size: list.length,
    pick: () => sample(list),
    pickExcluding: (drawn) => {
      const left = list.filter((value) => !drawn.has(value))
      return left.length ? sample(left) : null
    },
    scrambleChar: () => sample(chars.length ? chars : list),
    has: (value) => list.includes(value),
  }
}

export function createSource(
  { sourceId, min, max, bothCases }: SourceConfig,
  lists: CustomList[] = [],
): PickSource {
  if (isCustomId(sourceId)) {
    const list = lists.find((l) => l.id === sourceId)
    // An empty list has nothing to give, so it reports as spent rather than crashing.
    if (!list || list.items.length === 0) {
      return {
        size: 0,
        pick: () => '',
        pickExcluding: () => null,
        scrambleChar: () => ' ',
        has: () => false,
      }
    }
    return fromList(list.items)
  }

  switch (sourceId) {
    case 'emoji':
      // Emoji have no smaller parts to churn through, so Scramble swaps whole glyphs,
      // which fromList already does for single-character entries.
      return fromList(emoji)
    case 'letter': {
      const letters = bothCases ? [...upperLetters, ...lowerLetters] : upperLetters
      // fromList already churns through the letters themselves here.
      return fromList(letters)
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
      const size = hi - lo + 1
      const draw = () => String(Math.floor(Math.random() * size) + lo)
      return {
        size,
        pick: draw,
        pickExcluding: (drawn) => {
          if (drawn.size >= size) return null

          // Drawing at random and retrying is far cheaper than listing the range, and
          // succeeds on the first go for anything but a nearly spent pool. Listing a
          // range of 100,000 on every roll to skip a handful of used values was the
          // alternative.
          for (let i = 0; i < 40; i++) {
            const value = draw()
            if (!drawn.has(value)) return value
          }

          // Retrying has become unreliable, so the pool must be nearly spent: list what
          // is actually left. Reaching here needs the drawn set to cover most of the
          // range, which only a small range can manage.
          const left: string[] = []
          for (let n = lo; n <= hi; n++) {
            const value = String(n)
            if (!drawn.has(value)) left.push(value)
          }
          return left.length ? sample(left) : null
        },
        scrambleChar: () => String(Math.floor(Math.random() * 10)),
        has: (value) => {
          const n = Number(value)
          return /^-?\d+$/.test(value) && n >= lo && n <= hi
        },
      }
    }
  }
}
