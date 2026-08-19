import { useEffect, useRef } from 'react'
import { CelebrationCanvas } from './Picker.styled'

/** Festive on purpose: these read as celebration, so they ignore the theme's palette. */
const CONFETTI_COLORS = ['#ff5f6d', '#ffc371', '#47d7ac', '#4facfe', '#c471f5', '#f9f871']
const FIREWORK_COLORS = ['#ffd166', '#ef476f', '#06d6a0', '#4cc9f0', '#b388ff']

type Piece = {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  spin: number
  w: number
  h: number
  color: string
  /** Confetti tumbles, so its width is scaled by a wave to fake a third dimension. */
  wobble: number
}

type Spark = {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  born: number
  life: number
}

type CelebrationProps = {
  kind: 'confetti' | 'fireworks'
  width: number
  height: number
  /** Where the value sits, in the same space as width and height. */
  originX: number
  originY: number
  durationMs: number
  onDone: () => void
}

const rand = (min: number, max: number) => min + Math.random() * (max - min)
/** A random member. Throws on an empty list rather than widening every call site. */
const pick = <T,>(list: T[]): T => {
  const value = list[Math.floor(Math.random() * list.length)]
  if (value === undefined) throw new Error('pick called with an empty list')
  return value
}

/**
 * The celebration that plays over a settled value. Drawn on a canvas rather than as
 * elements: a few hundred pieces as DOM nodes would cost a layout pass every frame.
 */
export function Celebration({
  kind,
  width,
  height,
  originX: originCssX,
  originY: originCssY,
  durationMs,
  onDone,
}: CelebrationProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const originX = originCssX * dpr
    const originY = originCssY * dpr

    // Thrown from the middle so it sweeps across the value and hides it, then falls
    // away to uncover whatever the value has become.
    const pieces: Piece[] = []
    if (kind === 'confetti') {
      for (let i = 0; i < 320; i++) {
        const angle = rand(-Math.PI * 0.98, -Math.PI * 0.02)
        const speed = rand(5, 18) * dpr
        pieces.push({
          x: originX + rand(-w * 0.22, w * 0.22),
          y: originY + rand(-h * 0.06, h * 0.1),
          vx: Math.cos(angle) * speed * 1.35,
          vy: Math.sin(angle) * speed,
          rot: rand(0, Math.PI * 2),
          spin: rand(-0.32, 0.32),
          w: rand(7, 13) * dpr,
          h: rand(10, 18) * dpr,
          color: pick(CONFETTI_COLORS),
          wobble: rand(0, Math.PI * 2),
        })
      }
    }

    // Bursts land over the value early, so it is covered while it changes, and the last
    // of them has faded by the time it is uncovered.
    const bursts = [
      { at: 0, x: originX, y: originY },
      { at: 70, x: originX - w * 0.26, y: originY - h * 0.16 },
      { at: 140, x: originX + w * 0.27, y: originY + h * 0.04 },
      { at: 220, x: originX - w * 0.1, y: originY + h * 0.2 },
      { at: 300, x: originX + w * 0.12, y: originY - h * 0.24 },
      { at: 380, x: originX - w * 0.33, y: originY + h * 0.12 },
      { at: 460, x: originX + w * 0.35, y: originY - h * 0.12 },
      { at: 540, x: originX - w * 0.18, y: originY - h * 0.28 },
      { at: 620, x: originX + w * 0.04, y: originY + h * 0.3 },
      { at: 700, x: originX - w * 0.38, y: originY - h * 0.04 },
      { at: 780, x: originX + w * 0.22, y: originY + h * 0.26 },
    ]
    const sparks: Spark[] = []
    let nextBurst = 0

    // Light enough that the pieces are still on screen when the value is uncovered —
    // a heavier fall dropped them past the bottom edge within a second, leaving a bare
    // screen for the rest of the run.
    const gravity = 0.11 * dpr
    const start = performance.now()
    let frame = 0

    const draw = (now: number) => {
      const elapsed = now - start
      const t = Math.min(elapsed / durationMs, 1)
      ctx.clearRect(0, 0, w, h)

      if (kind === 'confetti') {
        for (const p of pieces) {
          p.vy += gravity
          // Air drag, so a piece settles into a drift rather than accelerating away.
          p.vy *= 0.985
          p.vx *= 0.99
          p.x += p.vx
          p.y += p.vy
          p.rot += p.spin
          p.wobble += 0.15

          // Holds while the value is covered, then thins out as it is uncovered.
          ctx.globalAlpha = t < 0.58 ? 1 : Math.max(0, 1 - (t - 0.58) / 0.42)
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rot)
          ctx.fillStyle = p.color
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w * Math.abs(Math.cos(p.wobble)), p.h)
          ctx.restore()
        }
      } else {
        // The burst is read before it is tested, so the queue position and the value
        // cannot disagree about whether there is one.
        while (nextBurst < bursts.length) {
          const burst = bursts[nextBurst]
          if (!burst || elapsed < burst.at) break
          nextBurst++
          const color = pick(FIREWORK_COLORS)
          const count = 54
          for (let i = 0; i < count; i++) {
            // An even ring with a little jitter, so it reads as a burst rather than a
            // scatter, and a varied speed so the ring has depth.
            const angle = (i / count) * Math.PI * 2 + rand(-0.06, 0.06)
            const speed = rand(3, 9) * dpr
            sparks.push({
              x: burst.x,
              y: burst.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              color,
              born: elapsed,
              life: rand(560, 900),
            })
          }
        }

        for (const s of sparks) {
          const age = elapsed - s.born
          if (age < 0 || age > s.life) continue
          s.vy += gravity * 0.9
          s.vx *= 0.976
          s.vy *= 0.976
          s.x += s.vx
          s.y += s.vy

          const fade = 1 - age / s.life
          ctx.globalAlpha = fade * fade
          ctx.fillStyle = s.color
          ctx.beginPath()
          ctx.arc(s.x, s.y, 2.4 * dpr, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      ctx.globalAlpha = 1
      if (t < 1) frame = requestAnimationFrame(draw)
      else done.current()
    }

    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [kind, width, height, originCssX, originCssY, durationMs])

  return (
    <CelebrationCanvas ref={ref} aria-hidden="true" style={{ width, height }} />
  )
}
