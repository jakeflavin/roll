import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { animationById, animationDuration, type AnimationId } from '../animations'
import type { PickSource } from '../sources'
import type { Theme } from '../themes'
import { isDrawerOpen, isTypingTarget, targetElement } from '../shortcuts'
import { PickedValue } from './PickedValue'

/** One pool on the stage. A roll takes a value from each. */
export type Slot = {
  sourceId: string
  sourceKey: string
  name: string
  source: PickSource
  /** Already used this cycle, owned by the session. */
  drawn: Set<string>
}

/** Type shrinks as slots are added, so three values still fit the stage. */
const SCALES = [1, 0.5, 0.36, 0.28]

type Props = {
  slots: Slot[]
  theme: Theme
  animation: AnimationId
  allowRepeat: boolean
  onPick: (sourceId: string, value: string) => void
  onStartOver: (sourceKeys: string[]) => void
  leadingAction?: ReactNode
  trailingAction?: ReactNode
  /** Values carried in from the URL, one per slot, used only where they still fit. */
  initialValues?: string[]
  onSettle?: (values: string[]) => void
}

export function Picker({
  slots,
  theme,
  animation,
  allowRepeat,
  onPick,
  onStartOver,
  leadingAction,
  trailingAction,
  initialValues = [],
  onSettle,
}: Props) {
  const [runId, setRunId] = useState(0)
  const [targets, setTargets] = useState<Array<string | null>>([])
  const [busy, setBusy] = useState(false)
  const [exhausted, setExhausted] = useState<boolean[]>([])

  const timer = useRef(0)
  const settledRef = useRef<string[]>([])
  const onSettleRef = useRef(onSettle)
  onSettleRef.current = onSettle
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick

  // A slot's seed is whatever fits: the value from the URL if it belongs to this pool,
  // otherwise a fresh pick. Seeds are not draws, so they are never recorded.
  const slotKey = slots.map((s) => s.sourceKey).join('|')
  const seedsRef = useRef<string[]>([])
  const lastSlotKey = useRef<string | null>(null)
  if (lastSlotKey.current !== slotKey) {
    lastSlotKey.current = slotKey
    seedsRef.current = slots.map((slot, i) => {
      const carried = initialValues[i]
      return carried && slot.source.has(carried) ? carried : slot.source.pick()
    })
    settledRef.current = seedsRef.current
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  // Report the seeds once so the URL carries them before anything is rolled.
  useEffect(() => {
    onSettleRef.current?.(seedsRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotKey])

  const roll = useCallback(() => {
    if (busy) return

    const allSpent = exhausted.length > 0 && exhausted.every(Boolean)
    if (allSpent) onStartOver(slots.map((s) => s.sourceKey))

    const nextTargets = slots.map((slot) => {
      if (allowRepeat) return slot.source.pick()
      // A fresh cycle has just started, so nothing is excluded on this roll.
      if (allSpent) return slot.source.pick()
      return slot.source.pickExcluding(slot.drawn)
    })

    setTargets(nextTargets)
    setExhausted(nextTargets.map((target) => target === null))
    setRunId((id) => id + 1)

    // Only run the clock if something is actually animating.
    if (nextTargets.every((target) => target === null)) return
    setBusy(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setBusy(false), animationDuration(animation))
  }, [busy, exhausted, slots, allowRepeat, animation, onStartOver])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'Enter') return
      if (isDrawerOpen() || isTypingTarget(e.target)) return
      // A focused button already activates on Space and Enter; handling it here as
      // well would roll twice for one press.
      if (targetElement(e.target)?.closest('button')) return
      e.preventDefault()
      roll()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [roll])

  const onSlotSettled = (index: number, value: string) => {
    onPickRef.current(slots[index].sourceId, value)
    const next = [...settledRef.current]
    next[index] = value
    settledRef.current = next
    onSettleRef.current?.(next)
  }

  const meta = animationById(animation)
  const everySlotSpent = exhausted.length > 0 && exhausted.every(Boolean)
  const scale = SCALES[Math.min(slots.length, SCALES.length) - 1]

  return (
    <div className="picker">
      <div className="picker-slots">
        {slots.map((slot, i) => (
          <PickedValue
            key={slot.sourceKey}
            target={targets[i] ?? null}
            runId={runId}
            seed={seedsRef.current[i]}
            source={slot.source}
            theme={theme}
            animation={animation}
            scale={scale}
            label={slots.length > 1 ? slot.name : undefined}
            onSettled={(value) => onSlotSettled(i, value)}
          />
        ))}
      </div>

      <div className="picker-actions">
        {leadingAction}
        <button className="roll-button" onClick={roll} disabled={busy}>
          {busy ? meta.busyLabel : everySlotSpent ? 'Start over' : meta.name}
        </button>
        {trailingAction}
      </div>
    </div>
  )
}
