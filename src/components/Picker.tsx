import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import type { Theme } from '../themes'
import { animationById, type AnimationId } from '../animations'
import type { PickSource } from '../sources'
import { RevealCloud } from './RevealCloud'

const ROLL_MS = 1500
const SCRAMBLE_MS = 1100
const FLIP_MS = 1250
const FLIP_COUNT = 3
// Long enough to read as disperse → drift → reform.
const REVEAL_MS = 1600
// The tail of the reveal, where the canvas cross-fades into the real text.
const HANDOFF_MS = 260

/**
 * One flip is 0 → -90 (edge-on) → +90 → 0. The jump across the edge-on instant is
 * invisible, which is what turns a tip-and-return into a continuous card turn.
 */
function flipKeyframes(count: number) {
  const values = [0]
  const times = [0]
  const ease: Array<'easeIn' | 'linear' | 'easeOut'> = []

  for (let i = 0; i < count; i++) {
    const mid = (i + 0.5) / count
    values.push(-90, 90, 0)
    times.push(mid, mid + 0.0005, (i + 1) / count)
    ease.push('easeIn', 'linear', 'easeOut')
  }

  return { values, times, ease }
}

const FLIP_FRAMES = flipKeyframes(FLIP_COUNT)

/** Shown in place of a value once the whole pool has been used. */
const EXHAUSTED_TEXT = 'All picked'

/** Values up to this many characters render at full size; longer ones scale down. */
const FULL_SIZE_CHARS = 5

function fitScale(value: string) {
  return Math.min(1, FULL_SIZE_CHARS / Math.max([...value].length, 1))
}

type Props = {
  source: PickSource
  /** Changes whenever the source or its options change, which reseeds the value. */
  sourceKey: string
  theme: Theme
  animation: AnimationId
  /** When false, values are drawn without replacement until the pool runs dry. */
  allowRepeat: boolean
  /** Already used this cycle, owned by the session so it survives source switches. */
  drawn: Set<string>
  /** A value that stuck, and so counts as used. */
  onPick: (value: string) => void
  /** Begin a fresh cycle for this pool, once everything has been used. */
  onStartOver: () => void
  /** Sit either side of the roll button, on the same bottom row. */
  leadingAction?: ReactNode
  trailingAction?: ReactNode
  /** A value carried in from the URL, used only if it belongs to the current source. */
  initialValue?: string
  /** Fires for values that stick, never for the frames an animation passes through. */
  onSettle?: (value: string) => void
}

export function Picker({
  source,
  sourceKey,
  theme,
  animation,
  allowRepeat,
  drawn,
  onPick,
  onStartOver,
  leadingAction,
  trailingAction,
  initialValue,
  onSettle,
}: Props) {
  const [display, setDisplay] = useState(() =>
    initialValue && source.has(initialValue) ? initialValue : source.pick(),
  )
  const [exhausted, setExhausted] = useState(false)
  // Held in a ref so the animation callbacks are not rebuilt, and mid-run timers are
  // not stranded, every time the source object's identity changes.
  const sourceRef = useRef(source)
  sourceRef.current = source
  const settleRef = useRef(onSettle)
  settleRef.current = onSettle
  const allowRepeatRef = useRef(allowRepeat)
  allowRepeatRef.current = allowRepeat
  const drawnRef = useRef(drawn)
  drawnRef.current = drawn
  const pickRef = useRef(onPick)
  pickRef.current = onPick

  // The next value to land on, or null when the pool has nothing left. Recording is
  // left to the caller: only a value that sticks counts, never the frames an animation
  // passes through, and a seeded value is not a pick at all.
  const nextValue = () => {
    if (allowRepeatRef.current) return sourceRef.current.pick()
    return sourceRef.current.pickExcluding(drawnRef.current)
  }

  const [busy, setBusy] = useState(false)
  // While set, the value is drawn as a particle cloud on canvas instead of as text.
  const [cloud, setCloud] = useState<{ from: string; to: string } | null>(null)
  // The final stretch of the reveal, where text and canvas overlap and cross-fade.
  const [handoff, setHandoff] = useState(false)
  const valueRef = useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = useState({ font: '', letterSpacing: '', color: '', box: [0, 0] })
  // Bumping this key restarts the settle animation even when the same value repeats.
  const [settleKey, setSettleKey] = useState(0)
  // Drives the card turn; the value swaps while the card is edge-on.
  const [flipping, setFlipping] = useState(false)
  const frame = useRef(0)
  const timers = useRef<number[]>([])

  const stop = () => {
    cancelAnimationFrame(frame.current)
    timers.current.forEach(clearTimeout)
    timers.current = []
    setFlipping(false)
    setCloud(null)
    setHandoff(false)
  }

  const after = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms))
  }

  // A different source makes the showing value stale, so reseed from the new one.
  // Tracking which source the current value came from — rather than "is this the first
  // run" — means StrictMode's repeated effects cannot discard a restored value.
  const seededFor = useRef(sourceKey)
  useEffect(() => {
    if (seededFor.current === sourceKey) {
      settleRef.current?.(display)
      return
    }
    seededFor.current = sourceKey
    stop()
    // History is not cleared here: switching pools and coming back must still exclude
    // what that pool already gave out, which is the whole point of the session.
    setExhausted(false)
    const next = sourceRef.current.pick()
    setDisplay(next)
    settleRef.current?.(next)
    setBusy(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey])

  // Switching animations mid-cover would strand the number behind a cover that the
  // other animations have no way to lift.
  useEffect(() => {
    stop()
    setBusy(false)
  }, [animation])

  // Toggling the mode starts a fresh run rather than inheriting a history the user
  // could not see being collected. Only an actual change counts, so StrictMode's
  // repeated effects cannot wipe a run in progress.
  const lastAllowRepeat = useRef(allowRepeat)
  useEffect(() => {
    if (lastAllowRepeat.current === allowRepeat) return
    lastAllowRepeat.current = allowRepeat
    setExhausted(false)
  }, [allowRepeat])

  // Clearing the session from its own view must lift an exhausted state here too.
  useEffect(() => {
    if (drawn.size === 0) setExhausted(false)
  }, [drawn])

  useEffect(() => stop, [])

  const settle = useCallback((final: string) => {
    setDisplay(final)
    setSettleKey((k) => k + 1)
    setBusy(false)
    settleRef.current?.(final)
    pickRef.current(final)
  }, [])

  const runRoll = useCallback((final: string) => {
    const start = performance.now()
    let lastSwap = 0

    const tick = (now: number) => {
      const t = (now - start) / ROLL_MS
      if (t >= 1) return settle(final)
      // Swaps start fast and stretch out cubically, so the reel reads as slowing down.
      if (now - lastSwap >= 40 + 300 * t ** 3) {
        lastSwap = now
        setDisplay(sourceRef.current.pick())
      }
      frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
  }, [settle])

  const runScramble = useCallback((final: string) => {
    const chars = [...final]
    const start = performance.now()

    const tick = (now: number) => {
      const t = (now - start) / SCRAMBLE_MS
      if (t >= 1) return settle(final)
      // Each column locks at its own point in the run, left to right, so the number
      // resolves progressively instead of all at once.
      const next = chars.map((c, i) =>
        // Spaces stay put; churning them just makes the word jitter in width.
        t >= (i + 1) / (chars.length + 1) || c === ' ' ? c : sourceRef.current.scrambleChar(),
      )
      setDisplay(next.join(''))
      frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
  }, [settle])

  const runFlip = useCallback((final: string) => {
    setFlipping(true)
    // A value swap per flip, each while the card is edge-on, so the card is never seen
    // changing. The turns before the last are just for show, so they are drawn freely
    // rather than consumed from the pool.
    for (let i = 0; i < FLIP_COUNT - 1; i++) {
      const next = sourceRef.current.pick()
      after((FLIP_MS * (i + 0.5)) / FLIP_COUNT, () => setDisplay(next))
    }
    after((FLIP_MS * (FLIP_COUNT - 0.5)) / FLIP_COUNT, () => setDisplay(final))
    after(FLIP_MS, () => {
      setFlipping(false)
      setBusy(false)
      settleRef.current?.(final)
      pickRef.current(final)
    })
  }, [])

  const runReveal = useCallback((to: string) => {
    const el = valueRef.current
    if (!el) return
    const style = getComputedStyle(el)
    const rect = el.getBoundingClientRect()
    const stage = el.parentElement?.getBoundingClientRect()
    setMetrics({
      // Canvas font shorthand needs weight and size baked in; the DOM is the source
      // of truth so the particles match the rendered glyphs exactly.
      font: `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      letterSpacing: style.letterSpacing === 'normal' ? '0px' : style.letterSpacing,
      color: style.color,
      // Room around the glyphs for the particles to scatter into, but never past the
      // stage — an oversized canvas spills off screen and makes the page scrollable.
      box: [
        Math.min(rect.width * 2, stage?.width ?? rect.width),
        Math.min(rect.height * 1.9, stage?.height ?? rect.height),
      ],
    })
    setCloud({ from: display, to })
    // Swap in the real text while the particles are all but home, then let the two
    // cross-fade — cutting from canvas to text at the very end reads as a jump.
    after(REVEAL_MS - HANDOFF_MS, () => {
      setDisplay(to)
      setHandoff(true)
      settleRef.current?.(to)
      pickRef.current(to)
    })
  }, [display])

  const onCloudDone = useCallback(() => {
    setCloud(null)
    setHandoff(false)
    setBusy(false)
  }, [])

  const roll = useCallback(() => {
    if (busy) return

    let final: string | null
    if (exhausted) {
      // Starting over begins a fresh cycle and rolls in the same press, rather than
      // clearing the message and making the user press again to see a value.
      onStartOver()
      setExhausted(false)
      final = sourceRef.current.pick()
    } else {
      final = nextValue()
    }

    if (final === null) {
      // Nothing left to pick, so the display says so instead of showing a value.
      setExhausted(true)
      setDisplay(EXHAUSTED_TEXT)
      return
    }

    setBusy(true)
    if (animation === 'scramble') runScramble(final)
    else if (animation === 'flip') runFlip(final)
    else if (animation === 'reveal') runReveal(final)
    else runRoll(final)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, exhausted, animation, onStartOver, runRoll, runScramble, runFlip, runReveal])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'Enter') return
      const target = e.target as HTMLElement
      if (target.closest('input, button, dialog')) return
      e.preventDefault()
      roll()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [roll])

  const spinning = busy && animation === 'roll'
  const meta = animationById(animation)

  // Each animation owns both its motion target and the timing that sells it, so they
  // are resolved together rather than as nested ternaries in the JSX.
  const { animate, transition } = (() => {
    if (cloud) {
      return {
        animate: { opacity: handoff ? 1 : 0, scale: 1, filter: 'blur(0px)' },
        transition: { duration: handoff ? HANDOFF_MS / 1000 : 0, ease: 'linear' as const },
      }
    }
    if (flipping) {
      return {
        animate: { rotateX: FLIP_FRAMES.values, opacity: 1 },
        transition: {
          duration: FLIP_MS / 1000,
          times: FLIP_FRAMES.times,
          ease: FLIP_FRAMES.ease,
        },
      }
    }
    if (spinning) {
      return {
        animate: { scale: 1, filter: 'blur(1.5px)' },
        transition: { type: 'spring' as const, stiffness: 380, damping: 18 },
      }
    }
    // Flip and Reveal both resolve within their own animation, so a settle pop on top
    // would be a second, competing motion.
    if (animation === 'flip') {
      return {
        animate: { rotateX: 0, scale: 1, filter: 'blur(0px)' },
        transition: { duration: 0 },
      }
    }
    if (animation === 'reveal') {
      return {
        animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
        transition: { duration: 0 },
      }
    }
    return {
      animate: { scale: [1.12, 1], filter: 'blur(0px)' },
      transition: { type: 'spring' as const, stiffness: 380, damping: 18 },
    }
  })()

  return (
    <div className="picker">
      <div className="picker-stage">
        <motion.div
          ref={valueRef}
          key={settleKey}
          className="picker-value"
          aria-live="polite"
          animate={animate}
          transition={transition}
          // Opacity rather than visibility, so the text can cross-fade with the canvas
          // while staying in flow and holding the stage's size.
          style={{
            fontFamily: theme.displayFont,
            fontWeight: theme.displayWeight,
            letterSpacing: theme.displayTracking,
            // Long values (state names, "Embarrassed") would run off screen at the
            // size a two-digit number wants, so the type shrinks as the value grows.
            fontSize: `calc(var(--display-size) * ${fitScale(display)})`,
          }}
        >
          {display}
        </motion.div>

        {cloud && (
          <RevealCloud
            from={cloud.from}
            to={cloud.to}
            font={metrics.font}
            letterSpacing={metrics.letterSpacing}
            color={metrics.color}
            width={metrics.box[0]}
            height={metrics.box[1]}
            durationMs={REVEAL_MS}
            fadingOut={handoff}
            fadeMs={HANDOFF_MS}
            onDone={onCloudDone}
          />
        )}
      </div>

      <div className="picker-actions">
        {leadingAction}
        <button className="roll-button" onClick={roll} disabled={busy}>
          {busy ? meta.busyLabel : exhausted ? 'Start over' : meta.name}
        </button>
        {trailingAction}
      </div>
    </div>
  )
}
