import { useCallback, useEffect, useState } from 'react'
import {
  addEntry,
  emptySession,
  loadSession,
  saveSession,
  startCycle,
  type Session,
  type SessionEntry,
} from './session'

export function useSession() {
  const [session, setSession] = useState(loadSession)

  useEffect(() => {
    saveSession(session)
  }, [session])

  const record = useCallback((entry: SessionEntry) => {
    setSession((current) => addEntry(current, entry))
  }, [])

  const startOver = useCallback((sourceKey: string) => {
    setSession((current) => startCycle(current, sourceKey))
  }, [])

  const clear = useCallback(() => setSession(emptySession), [])

  const replace = useCallback((next: Session) => setSession(next), [])

  return { session, record, startOver, clear, replace }
}
