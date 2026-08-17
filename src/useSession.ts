import { useCallback, useEffect, useState } from 'react'
import {
  addEntry,
  emptySession,
  loadSession,
  saveSession,
  startCycle,
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

  return { session, record, startOver, clear }
}
