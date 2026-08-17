import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { Theme } from '../themes'

const SPIN_MS = 1500

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

type Props = {
  min: number
  max: number
  theme: Theme
}

export function Picker({ min, max, theme }: Props) {
  const [value, setValue] = useState(() => randomInt(min, max))
  const [spinning, setSpinning] = useState(false)
  // Bumping this key restarts the settle animation even when the same value repeats.
  const [settleKey, setSettleKey] = useState(0)
  const frame = useRef(0)

  // A range change makes the showing value stale, so reseed inside the new range.
  useEffect(() => {
    setValue(randomInt(min, max))
  }, [min, max])

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const roll = useCallback(() => {
    if (spinning) return
    setSpinning(true)

    const start = performance.now()
    let lastSwap = 0

    const tick = (now: number) => {
      const t = (now - start) / SPIN_MS
      if (t >= 1) {
        setValue(randomInt(min, max))
        setSettleKey((k) => k + 1)
        setSpinning(false)
        return
      }
      // Swaps start fast and stretch out cubically, so the reel reads as slowing down.
      if (now - lastSwap >= 40 + 300 * t ** 3) {
        lastSwap = now
        setValue(randomInt(min, max))
      }
      frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
  }, [spinning, min, max])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        const target = e.target as HTMLElement
        if (target.closest('input, button, dialog')) return
        e.preventDefault()
        roll()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [roll])

  return (
    <div className="picker">
      <motion.div
        key={settleKey}
        className="picker-value"
        aria-live="polite"
        animate={spinning ? { scale: 1, filter: 'blur(1.5px)' } : { scale: [1.12, 1], filter: 'blur(0px)' }}
        transition={{ type: 'spring', stiffness: 380, damping: 18 }}
        style={{
          fontFamily: theme.displayFont,
          fontWeight: theme.displayWeight,
          letterSpacing: theme.displayTracking,
        }}
      >
        {value}
      </motion.div>

      <button className="roll-button" onClick={roll} disabled={spinning}>
        {spinning ? 'Rolling…' : 'Roll'}
      </button>
    </div>
  )
}
