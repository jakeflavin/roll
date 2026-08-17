import { useEffect, useState } from 'react'

/**
 * State that reads itself from storage once and writes itself back whenever it changes.
 *
 * The first write happens on mount, which is deliberate: it stores whatever `load`
 * decided, so anything it migrated or repaired is saved in its corrected form rather
 * than being re-migrated on every visit.
 *
 * `save` is expected to be a stable module-level function; it is read on each change
 * rather than tracked as a dependency.
 */
export function usePersistentState<T>(load: () => T, save: (value: T) => void) {
  const [value, setValue] = useState(load)

  useEffect(() => {
    save(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return [value, setValue] as const
}
