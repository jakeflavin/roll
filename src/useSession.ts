import { useCallback } from 'react'
import {
  addEntry,
  emptySession,
  loadSession,
  saveSession,
  startCycle,
  type Session,
  type SessionEntry,
} from './session'
import { usePersistentState } from './usePersistentState'

/**
 * The record of what has been picked, and the source of truth for what no-repeat
 * excludes. Kept in local storage so it survives closing the tab, which is what lets
 * someone come back tomorrow and not see yesterday's picks again.
 */
export function useSession() {
  const [session, setSession] = usePersistentState(loadSession, saveSession)

  /** Records a value that stuck. Seeded values are not picks and are not recorded. */
  const record = useCallback((entry: SessionEntry) => {
    setSession((current) => addEntry(current, entry))
  }, [setSession])

  /** Begins a fresh cycle for one pool, without discarding what it has already given. */
  const startOver = useCallback((sourceKey: string) => {
    setSession((current) => startCycle(current, sourceKey))
  }, [setSession])

  /** Forgets everything, including the memory that prevents repeats. */
  const clear = useCallback(() => setSession(emptySession), [setSession])

  /** Swaps in a session wholesale, which is what importing a backup does. */
  const replace = useCallback((next: Session) => setSession(next), [setSession])

  return { session, record, startOver, clear, replace }
}
