import { useCallback, useEffect, useState } from 'react'
import { cleanItems, loadLists, newListId, saveLists, type CustomList } from './lists'

export function useLists() {
  const [lists, setLists] = useState(loadLists)

  useEffect(() => {
    saveLists(lists)
  }, [lists])

  const create = useCallback((name: string, items: string[] = []) => {
    const list: CustomList = { id: newListId(), name: name.trim() || 'My list', items: cleanItems(items) }
    setLists((current) => [...current, list])
    return list
  }, [])

  const update = useCallback((id: string, patch: Partial<Omit<CustomList, 'id'>>) => {
    setLists((current) =>
      current.map((list) =>
        list.id === id
          ? { ...list, ...patch, items: patch.items ? cleanItems(patch.items) : list.items }
          : list,
      ),
    )
  }, [])

  const remove = useCallback((id: string) => {
    setLists((current) => current.filter((list) => list.id !== id))
  }, [])

  const replace = useCallback((next: CustomList[]) => setLists(next), [])

  return { lists, create, update, remove, replace }
}
