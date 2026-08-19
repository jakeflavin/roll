import { useCallback } from 'react'
import { cleanItems, LISTS_KEY, newListId, readLists, type CustomList } from '../lib/lists'
import { usePersistentState } from './usePersistentState'

/** The user's own pools, which sit alongside the built-in ones. */
export function useLists() {
  const [lists, setLists] = usePersistentState<CustomList[]>(LISTS_KEY, [], {
    read: readLists,
  })

  /** Returns the new list, so a caller can select it straight away. */
  const create = useCallback(
    (name: string, items: string[] = []) => {
      const list: CustomList = {
        id: newListId(),
        name: name.trim() || 'My list',
        items: cleanItems(items),
      }
      setLists((current) => [...current, list])
      return list
    },
    [setLists],
  )

  /** Entries are always cleaned, so duplicates cannot enter by any route. */
  const update = useCallback(
    (id: string, patch: Partial<Omit<CustomList, 'id'>>) => {
      setLists((current) =>
        current.map((list) =>
          list.id === id
            ? { ...list, ...patch, items: patch.items ? cleanItems(patch.items) : list.items }
            : list,
        ),
      )
    },
    [setLists],
  )

  const remove = useCallback(
    (id: string) => {
      setLists((current) => current.filter((list) => list.id !== id))
    },
    [setLists],
  )

  /** Swaps in lists wholesale, which is what importing a backup does. */
  const replace = useCallback((next: CustomList[]) => setLists(next), [setLists])

  return { lists, create, update, remove, replace }
}
