import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { Theme } from '../lib/themes'
import {
  CELEBRATION_SWAP_MS,
  celebrationShowAt,
  EXHAUSTED_TEXT,
  FLIP_COUNT,
  FLIP_MS,
  HANDOFF_MS,
  isCelebration,
  REVEAL_MS,
  ROLL_MS,
  SCRAMBLE_MS,
  type AnimationId,
} from '../lib/animations'
import type { PickSource } from '../lib/sources'
import { RevealCloud } from './RevealCloud'

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

/** Values up to this many characters render at full size; longer ones scale down. */
const FULL_SIZE_CHARS = 5

function fitScale(value: string) {
  return Math.min(1, FULL_SIZE_CHARS / Math.max([...value].length, 1))
}

type PickedValueProps = {
  /** The value to land on. Null means this pool is spent, so nothing animates. */
  target: string | null
  /** Changes to start a run; unchanged means nothing to animate. */
  runId: number
  seed: string
  source: PickSource
  theme: Theme
  animation: AnimationId
  /** Shrinks the type when several values share the stage. */
  scale: number
  /** Set when the pool is empty, which reads differently from having used it all up. */
  emptyLabel?: string
  label?: string
  onSettled?: (value: string) => void
}

export function PickedValue({
  target,
  runId,
  seed,
  source,
  theme,
  animation,
  scale,
  emptyLabel,
  label,
  onSettled,
}: PickedValueProps) {
  const [display, setDisplay] = useState(seed)
  const [cloud, setCloud] = useState<{ from: string; to: string } | null>(null)
  const [handoff, setHandoff] = useState(false)
  const [settleKey, setSettleKey] = useState(0)
  const [flipping, setFlipping] = useState(false)
  // True only while a run is in flight. Deriving this from the run counter instead
  // left the blur applied for good once the first roll had happened.
  const [running, setRunning] = useState(false)
  // Hidden behind a celebration, the way the cloud hides a value during a reveal.
  const [covered, setCovered] = useState(false)
  const [metrics, setMetrics] = useState({
    font: '',
    letterSpacing: '',
    color: '',
    box: [0, 0] as [number, number],
  })

  const valueRef = useRef<HTMLDivElement>(null)
  const frame = useRef(0)
  const timers = useRef<number[]>([])
  const sourceRef = useRef(source)
  sourceRef.current = source
  const settledRef = useRef(onSettled)
  settledRef.current = onSettled

  const stop = useCallback(() => {
    cancelAnimationFrame(frame.current)
    timers.current.forEach(clearTimeout)
    timers.current = []
    setFlipping(false)
    setCloud(null)
    setHandoff(false)
    setRunning(false)
    setCovered(false)
  }, [])

  const after = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms))
  }

  useEffect(() => stop, [stop])

  // Reseeding is driven by the parent handing over a new seed, which happens when the
  // pool behind this slot changes.
  useEffect(() => {
    stop()
    setDisplay(seed)
  }, [seed, stop])

  // Only an actual new run animates. Without this, swapping a slot's group remounts
  // this component, whose effect would then replay the previous run's target and
  // record it against the group that just replaced it.
  const lastRun = useRef(runId)
  useEffect(() => {
    if (lastRun.current === runId) return
    lastRun.current = runId
    stop()

    if (target === null) {
      // An empty pool never had anything to give, which is not the same as having
      // worked through everything it had.
      setDisplay(emptyLabel ?? EXHAUSTED_TEXT)
      return
    }

    setRunning(true)

    const settle = (final: string) => {
      setDisplay(final)
      setSettleKey((k) => k + 1)
      setRunning(false)
      settledRef.current?.(final)
    }

    if (animation === 'roll') {
      const start = performance.now()
      let lastSwap = 0
      const tick = (now: number) => {
        const t = (now - start) / ROLL_MS
        if (t >= 1) return settle(target)
        // Swaps start fast and stretch out cubically, so the reel reads as slowing down.
        if (now - lastSwap >= 40 + 300 * t ** 3) {
          lastSwap = now
          setDisplay(sourceRef.current.pick())
        }
        frame.current = requestAnimationFrame(tick)
      }
      frame.current = requestAnimationFrame(tick)
      return
    }

    if (animation === 'scramble') {
      const chars = [...target]
      const start = performance.now()
      const tick = (now: number) => {
        const t = (now - start) / SCRAMBLE_MS
        if (t >= 1) return settle(target)
        // Each column locks at its own point in the run, left to right, so the value
        // resolves progressively instead of all at once.
        const next = chars.map((c, i) =>
          // Spaces stay put; churning them just makes the word jitter in width.
          t >= (i + 1) / (chars.length + 1) || c === ' ' ? c : sourceRef.current.scrambleChar(),
        )
        setDisplay(next.join(''))
        frame.current = requestAnimationFrame(tick)
      }
      frame.current = requestAnimationFrame(tick)
      return
    }

    if (isCelebration(animation)) {
      // The picker draws the celebration across the whole stage; this hides the value
      // behind it, changes it where nothing can be read, and brings the new one back as
      // the cover clears.
      setCovered(true)
      after(CELEBRATION_SWAP_MS, () => setDisplay(target))
      after(celebrationShowAt(animation), () => {
        setCovered(false)
        setSettleKey((k) => k + 1)
        setRunning(false)
        settledRef.current?.(target)
      })
      return
    }

    if (animation === 'flip') {
      setFlipping(true)
      // The turns before the last are just for show, so they are drawn freely rather
      // than consumed from the pool.
      for (let i = 0; i < FLIP_COUNT - 1; i++) {
        const next = sourceRef.current.pick()
        after((FLIP_MS * (i + 0.5)) / FLIP_COUNT, () => setDisplay(next))
      }
      after((FLIP_MS * (FLIP_COUNT - 0.5)) / FLIP_COUNT, () => setDisplay(target))
      after(FLIP_MS, () => {
        setFlipping(false)
        setRunning(false)
        settledRef.current?.(target)
      })
      return
    }

    // Reveal
    const el = valueRef.current
    if (!el) return
    const style = getComputedStyle(el)
    const rect = el.getBoundingClientRect()
    const stage = el.closest('.picker-stage')?.getBoundingClientRect()
    setMetrics({
      // Canvas font shorthand needs weight and size baked in; the DOM is the source of
      // truth so the particles match the rendered glyphs exactly.
      font: `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      letterSpacing: style.letterSpacing === 'normal' ? '0px' : style.letterSpacing,
      color: style.color,
      // Room around the glyphs to scatter into, but never past the stage — an oversized
      // canvas spills off screen and makes the page scrollable.
      box: [
        Math.min(rect.width * 2, stage?.width ?? rect.width),
        Math.min(rect.height * 1.9, stage?.height ?? rect.height),
      ],
    })
    setCloud({ from: display, to: target })
    // Swap in the real text while the particles are all but home, then let the two
    // cross-fade — cutting from canvas to text at the very end reads as a jump.
    after(REVEAL_MS - HANDOFF_MS, () => {
      setDisplay(target)
      setHandoff(true)
      setRunning(false)
      settledRef.current?.(target)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  const spinning = running && animation === 'roll'

  const { animate, transition } = (() => {
    if (isCelebration(animation)) {
      // Uncovered: the new value arrives with the settle pop rather than simply being
      // switched back on.
      return {
        animate: { opacity: 1, scale: [1.14, 1], filter: 'blur(0px)' },
        transition: { type: 'spring' as const, stiffness: 360, damping: 17 },
      }
    }
    if (cloud) {
      return {
        animate: { opacity: handoff ? 1 : 0, scale: 1, filter: 'blur(0px)' },
        transition: {
          duration: handoff ? HANDOFF_MS / 1000 : 0,
          ease: 'linear' as const,
        },
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
    // Flip and Reveal resolve within their own animation, so a settle pop on top would
    // be a second, competing motion.
    if (animation === 'flip' || animation === 'reveal') {
      return {
        animate: { rotateX: 0, opacity: 1, scale: 1, filter: 'blur(0px)' },
        transition: { duration: 0 },
      }
    }
    return {
      animate: { scale: [1.12, 1], filter: 'blur(0px)' },
      transition: { type: 'spring' as const, stiffness: 380, damping: 18 },
    }
  })()

  return (
    <div className="picker-slot">
      {label && <p className="picker-label">{label}</p>}
      <div className="picker-stage">
        {/* The cover is the wrapper's opacity rather than the value's own: motion owns
            the value's style for scale and blur, and quietly dropped an opacity target
            set alongside them. */}
        <div className="value-cover" data-covered={covered || undefined}>
          <motion.div
            ref={valueRef}
            key={settleKey}
            className="picker-value"
            aria-live="polite"
            animate={animate}
            transition={transition}
            style={{
              fontFamily: theme.displayFont,
              fontWeight: theme.displayWeight,
              letterSpacing: theme.displayTracking,
              // Three caps, whichever is smallest: the base size, a reduction for long
              // values, and the share of the stage's height this slot can occupy — the
              // last is what keeps every slot on screen however many there are.
              fontSize: `min(calc(var(--display-size) * ${(fitScale(display) * scale).toFixed(3)}), calc(42cqh / var(--slots)))`,
            }}
          >
            {display}
          </motion.div>
        </div>

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
            onDone={() => {
              setCloud(null)
              setHandoff(false)
            }}
          />
        )}
      </div>
    </div>
  )
}
