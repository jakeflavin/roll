import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import {
  animationDuration,
  isCelebration,
  type AnimationId,
} from '../lib/animations'
import type { PickSource } from '../lib/sources'
import type { Theme } from '../lib/themes'
import { isDrawerOpen, isTypingTarget, targetElement } from '../lib/shortcuts'
import { Celebration } from './Celebration'
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

/** Shown where a pool has nothing in it, rather than leaving the slot blank. */
const EMPTY_TEXT = 'No entries yet'

/**
 * Type steps down as slots are added, but gently — the old curve halved it at two
 * slots, which was far smaller than it needed to be. The hard limit on fitting is
 * handled in CSS, which can see the stage's real height.
 */
function slotScale(count: number) {
  return count <= 1 ? 1 : Math.max(0.34, 1 / (1 + 0.45 * (count - 1)))
}

type PickerProps = {
  slots: Slot[]
  theme: Theme
  animation: AnimationId
  allowRepeat: boolean
  onPick: (sourceId: string, value: string) => void
  onStartOver: (sourceKeys: string[]) => void
  /** Secondary controls, grouped opposite the roll button. */
  tools?: ReactNode
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
  tools,
  initialValues = [],
  onSettle,
}: PickerProps) {
  const [runId, setRunId] = useState(0)
  const [targets, setTargets] = useState<Array<string | null>>([])
  const [busy, setBusy] = useState(false)
  const [exhausted, setExhausted] = useState<boolean[]>([])
  // Confetti and fireworks play across the whole stage rather than over one value, so
  // the picker owns them: sized to a slot's own box, the pieces left the canvas at once.
  const [party, setParty] = useState<{
    width: number
    height: number
    originX: number
    originY: number
    run: number
  } | null>(null)

  const stageRef = useRef<HTMLDivElement>(null)
  const partyTimer = useRef(0)
  const timer = useRef(0)
  const settledRef = useRef<string[]>([])
  const onSettleRef = useRef(onSettle)
  onSettleRef.current = onSettle
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick

  // A slot's seed is whatever fits: the value from the URL if it belongs to this pool,
  // otherwise a fresh pick. Seeds are not draws, so they are never recorded.
  //
  // Emptiness belongs in the key because a pool's identity does not change when its
  // entries do: filling an empty custom list would otherwise leave "No entries yet" on
  // screen until the next roll.
  const slotKey = slots.map((s) => `${s.sourceKey}:${s.source.size === 0 ? 0 : 1}`).join('|')
  const seedsRef = useRef<string[]>([])
  const lastSlotKey = useRef<string | null>(null)
  if (lastSlotKey.current !== slotKey) {
    lastSlotKey.current = slotKey
    seedsRef.current = slots.map((slot, i) => {
      if (slot.source.size === 0) return EMPTY_TEXT
      const carried = initialValues[i]
      return carried && slot.source.has(carried) ? carried : slot.source.pick()
    })
    settledRef.current = seedsRef.current
  }

  useEffect(
    () => () => {
      clearTimeout(timer.current)
      clearTimeout(partyTimer.current)
    },
    [],
  )

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
    const id = runId + 1
    setRunId(id)

    // Only run the clock if something is actually animating.
    if (nextTargets.every((target) => target === null)) return
    setBusy(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setBusy(false), animationDuration(animation))

    // Starts with the run: the celebration is the cover the value changes behind.
    clearTimeout(partyTimer.current)
    if (isCelebration(animation)) {
      // Sized to the window rather than to the stage: pieces thrown from the value need
      // somewhere to travel, and a canvas that stopped at the stage clipped them off at
      // the top and bottom.
      const stage = stageRef.current?.getBoundingClientRect()
      if (stage) {
        setParty({
          width: window.innerWidth,
          height: window.innerHeight,
          originX: stage.left + stage.width / 2,
          originY: stage.top + stage.height / 2,
          run: id,
        })
      }
    }
  }, [busy, runId, exhausted, slots, allowRepeat, animation, onStartOver])

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
    const slot = slots[index]
    if (!slot) return
    onPickRef.current(slot.sourceId, value)
    const next = [...settledRef.current]
    next[index] = value
    settledRef.current = next
    onSettleRef.current?.(next)
  }

  const everySlotSpent = exhausted.length > 0 && exhausted.every(Boolean)
  const scale = slotScale(slots.length)

  return (
    <div className="picker">
      {/* --slots lets the stylesheet cap each value against the stage's own height, so
          adding groups shrinks the type rather than pushing any of it out of view. */}
      <div
        className="picker-slots"
        ref={stageRef}
        style={{ '--slots': slots.length } as CSSProperties}
      >
        {slots.map((slot, i) => (
          <PickedValue
            key={slot.sourceKey}
            target={targets[i] ?? null}
            emptyLabel={slot.source.size === 0 ? EMPTY_TEXT : undefined}
            runId={runId}
            seed={seedsRef.current[i] ?? ''}
            source={slot.source}
            theme={theme}
            animation={animation}
            scale={scale}
            label={slots.length > 1 ? slot.name : undefined}
            onSettled={(value) => onSlotSettled(i, value)}
          />
        ))}

        {party && (
          <Celebration
            key={party.run}
            kind={animation === 'fireworks' ? 'fireworks' : 'confetti'}
            width={party.width}
            height={party.height}
            originX={party.originX}
            originY={party.originY}
            durationMs={animationDuration(animation)}
            onDone={() => setParty(null)}
          />
        )}
      </div>

      {/* Opposite corners: the secondary controls to one side, the roll button to the
          other. Neither is centred, and the button is sized to its label rather than to
          the window — a full-width one became a 700px target on a desktop. */}
      <div className="picker-actions">
        <div className="picker-tools">{tools}</div>
        <button className="roll-button" onClick={roll} disabled={busy}>
          {busy ? 'Rolling…' : everySlotSpent ? 'Start over' : 'Roll'}
        </button>
      </div>
    </div>
  )
}
