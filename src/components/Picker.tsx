import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { Theme } from '../themes'
import { animationById, type AnimationId } from '../animations'

const ROLL_MS = 1500
const SCRAMBLE_MS = 1100
const FLIP_MS = 620

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDigit() {
  return String(Math.floor(Math.random() * 10))
}

type Props = {
  min: number
  max: number
  theme: Theme
  animation: AnimationId
}

export function Picker({ min, max, theme, animation }: Props) {
  const [display, setDisplay] = useState(() => String(randomInt(min, max)))
  const [busy, setBusy] = useState(false)
  // Reveal keeps the picked value on screen but obscured until the user uncovers it.
  const [covered, setCovered] = useState(false)
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
  }

  const after = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms))
  }

  // A range change makes the showing value stale, so reseed inside the new range.
  useEffect(() => {
    stop()
    setDisplay(String(randomInt(min, max)))
    setBusy(false)
    setCovered(false)
  }, [min, max])

  // Switching animations mid-cover would strand the number behind a cover that the
  // other animations have no way to lift.
  useEffect(() => {
    stop()
    setBusy(false)
    setCovered(false)
  }, [animation])

  useEffect(() => stop, [])

  const settle = useCallback((final: number) => {
    setDisplay(String(final))
    setSettleKey((k) => k + 1)
    setBusy(false)
  }, [])

  const runRoll = useCallback(() => {
    const start = performance.now()
    let lastSwap = 0

    const tick = (now: number) => {
      const t = (now - start) / ROLL_MS
      if (t >= 1) return settle(randomInt(min, max))
      // Swaps start fast and stretch out cubically, so the reel reads as slowing down.
      if (now - lastSwap >= 40 + 300 * t ** 3) {
        lastSwap = now
        setDisplay(String(randomInt(min, max)))
      }
      frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
  }, [min, max, settle])

  const runScramble = useCallback(() => {
    const final = randomInt(min, max)
    const chars = String(final).split('')
    const start = performance.now()

    const tick = (now: number) => {
      const t = (now - start) / SCRAMBLE_MS
      if (t >= 1) return settle(final)
      // Each column locks at its own point in the run, left to right, so the number
      // resolves progressively instead of all at once.
      const next = chars.map((c, i) => (t >= (i + 1) / (chars.length + 1) ? c : randomDigit()))
      setDisplay(next.join(''))
      frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
  }, [min, max, settle])

  const runFlip = useCallback(() => {
    const final = randomInt(min, max)
    setFlipping(true)
    // Swapping at the midpoint keeps the old number hidden until the card is edge-on.
    after(FLIP_MS / 2, () => setDisplay(String(final)))
    after(FLIP_MS, () => {
      setFlipping(false)
      setBusy(false)
    })
  }, [min, max])

  const roll = useCallback(() => {
    if (busy) return

    if (animation === 'reveal') {
      setDisplay(String(randomInt(min, max)))
      setCovered(true)
      return
    }

    setBusy(true)
    setCovered(false)
    if (animation === 'scramble') runScramble()
    else if (animation === 'flip') runFlip()
    else runRoll()
  }, [busy, animation, min, max, runRoll, runScramble, runFlip])

  const uncover = useCallback(() => {
    setCovered(false)
    setSettleKey((k) => k + 1)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'Enter') return
      const target = e.target as HTMLElement
      if (target.closest('input, button, dialog')) return
      e.preventDefault()
      if (covered) uncover()
      else roll()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [roll, uncover, covered])

  const spinning = busy && animation === 'roll'
  const meta = animationById(animation)

  // Each animation owns both its motion target and the timing that sells it, so they
  // are resolved together rather than as nested ternaries in the JSX.
  const { animate, transition } = (() => {
    if (covered) {
      return {
        animate: { scale: 1, filter: 'blur(0.16em)' },
        transition: { duration: 0.18, ease: 'easeOut' as const },
      }
    }
    if (flipping) {
      return {
        animate: { rotateX: [0, -90, -90, 0], scale: [1, 0.94, 0.94, 1] },
        transition: {
          duration: FLIP_MS / 1000,
          times: [0, 0.45, 0.55, 1],
          ease: 'easeInOut' as const,
        },
      }
    }
    if (spinning) {
      return {
        animate: { scale: 1, filter: 'blur(1.5px)' },
        transition: { type: 'spring' as const, stiffness: 380, damping: 18 },
      }
    }
    // Flip resolves on the card turn itself, so it skips the settle pop.
    if (animation === 'flip') {
      return {
        animate: { rotateX: 0, scale: 1, filter: 'blur(0px)' },
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
          key={settleKey}
          className="picker-value"
          aria-live="polite"
          animate={animate}
          transition={transition}
          style={{
            fontFamily: theme.displayFont,
            fontWeight: theme.displayWeight,
            letterSpacing: theme.displayTracking,
          }}
        >
          {covered ? <span aria-hidden="true">{display}</span> : display}
        </motion.div>

        {covered && (
          <button className="reveal-cover" onClick={uncover}>
            <span className="reveal-hint">Tap to reveal</span>
          </button>
        )}
      </div>

      <button className="roll-button" onClick={roll} disabled={busy}>
        {busy ? meta.busyLabel : meta.name}
      </button>
    </div>
  )
}
