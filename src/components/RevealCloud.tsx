import { useEffect, useRef } from 'react'
import { RevealCanvas } from './Picker.styled'

const DISPERSE = 0.34
const DRIFT_UNTIL = 0.6
const MAX_PARTICLES = 5000

type RevealCloudProps = {
  /** The value on screen when the roll started. */
  from: string
  /** The value that reassembles when the cloud clears. */
  to: string
  /** Canvas-ready shorthand, e.g. `600 220px "JetBrains Mono"`. */
  font: string
  letterSpacing: string
  color: string
  width: number
  height: number
  durationMs: number
  /** Set for the tail of the run, while the real text fades in underneath. */
  fadingOut: boolean
  fadeMs: number
  onDone: () => void
}

type Particle = {
  fromX: number
  fromY: number
  toX: number
  toY: number
  scatterX: number
  scatterY: number
  /** Per-particle phase so the drift never looks like one rigid mass. */
  phase: number
  speed: number
  alpha: number
  fromColor: string
  toColor: string
}

const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)

export function RevealCloud({
  from,
  to,
  font,
  letterSpacing,
  color,
  width,
  height,
  durationMs,
  fadingOut,
  fadeMs,
  onDone,
}: RevealCloudProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  // Kept in a ref so a re-render mid-run never restarts the animation.
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

    // Rasterize the glyphs offscreen, then keep the pixels that landed on ink —
    // that is what turns a number into a cloud of particles shaped like the number.
    const samplePoints = (text: string) => {
      const off = document.createElement('canvas')
      off.width = canvas.width
      off.height = canvas.height
      const empty = { points: [] as Array<[number, number, string]>, multicolor: false }
      const octx = off.getContext('2d', { willReadFrequently: true })
      if (!octx) return empty

      octx.scale(dpr, dpr)
      octx.font = font
      if ('letterSpacing' in octx) octx.letterSpacing = letterSpacing
      octx.textAlign = 'center'
      octx.textBaseline = 'middle'
      // Painted in the real display color, so plain text samples back as itself and
      // emoji — which ignore fillStyle — sample back in their own colors.
      octx.fillStyle = color
      octx.fillText(text, width / 2, height / 2)

      const data = octx.getImageData(0, 0, off.width, off.height).data
      const step = Math.max(2, Math.round(2.5 * dpr))
      const points: Array<[number, number, string]> = []
      let multicolor = false
      let first = ''
      for (let y = 0; y < off.height; y += step) {
        for (let x = 0; x < off.width; x += step) {
          const i = (y * off.width + x) * 4
          // getImageData is RGBA, so the stride keeps these in range; the fallbacks are
          // for the checker rather than a change in behaviour.
          if ((data[i + 3] ?? 0) <= 128) continue
          const rgb = `rgb(${data[i] ?? 0},${data[i + 1] ?? 0},${data[i + 2] ?? 0})`
          if (!first) first = rgb
          else if (rgb !== first) multicolor = true
          points.push([x, y, rgb])
        }
      }
      return { points, multicolor }
    }

    const fromSample = samplePoints(from)
    const toSample = samplePoints(to)
    const a = fromSample.points
    const b = toSample.points
    if (!a.length || !b.length) {
      done.current()
      return
    }

    // Per-particle fill costs a canvas state change each draw, so it is only paid
    // when the glyphs actually carry their own colors, as emoji do.
    const multicolor = fromSample.multicolor || toSample.multicolor

    const count = Math.min(Math.max(a.length, b.length), MAX_PARTICLES)
    const spreadX = canvas.width * 0.34
    const spreadY = canvas.height * 0.3
    const particles: Particle[] = []
    for (let i = 0; i < count; i++) {
      const from = a[i % a.length]
      const to = b[i % b.length]
      if (!from || !to) continue
      const [fx, fy, fromColor] = from
      const [tx, ty, toColor] = to
      const angle = Math.random() * Math.PI * 2
      const radius = Math.sqrt(Math.random())
      particles.push({
        fromX: fx,
        fromY: fy,
        toX: tx,
        toY: ty,
        scatterX: canvas.width / 2 + Math.cos(angle) * radius * spreadX,
        scatterY: canvas.height / 2 + Math.sin(angle) * radius * spreadY,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 0.9,
        alpha: 0.45 + Math.random() * 0.55,
        fromColor,
        toColor,
      })
    }

    const size = Math.max(1, Math.round(1.6 * dpr))
    const wobble = 9 * dpr
    const start = performance.now()
    let frame = 0

    const draw = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (!multicolor) ctx.fillStyle = color

      // As the digits reform, particles grow and go opaque so the glyphs read solid
      // by the time the real text takes over — otherwise the handoff snaps visibly.
      const reformed = t < DRIFT_UNTIL ? 0 : (t - DRIFT_UNTIL) / (1 - DRIFT_UNTIL)
      // Deliberately fractional: rounding makes the particles jump a whole pixel at a
      // time as they grow, which reads as a stutter right at the handoff.
      const grown = size * (1 + 1.2 * reformed)

      for (const p of particles) {
        let x: number
        let y: number

        if (t < DISPERSE) {
          const e = easeOut(t / DISPERSE)
          x = p.fromX + (p.scatterX - p.fromX) * e
          y = p.fromY + (p.scatterY - p.fromY) * e
        } else if (t < DRIFT_UNTIL) {
          x = p.scatterX
          y = p.scatterY
        } else {
          const e = easeInOut((t - DRIFT_UNTIL) / (1 - DRIFT_UNTIL))
          x = p.scatterX + (p.toX - p.scatterX) * e
          y = p.scatterY + (p.toY - p.scatterY) * e
        }

        // Drift is strongest while scattered and settles to nothing as the digits reform.
        const loose =
          t < DISPERSE
            ? t / DISPERSE
            : t < DRIFT_UNTIL
              ? 1
              : 1 - (t - DRIFT_UNTIL) / (1 - DRIFT_UNTIL)
        const drift = ((now - start) / 1000) * p.speed
        x += Math.cos(drift + p.phase) * wobble * loose
        y += Math.sin(drift * 0.8 + p.phase) * wobble * loose

        // Particles carry the old glyph's colors out and the new one's back in.
        if (multicolor) ctx.fillStyle = t < DRIFT_UNTIL ? p.fromColor : p.toColor
        ctx.globalAlpha = p.alpha + (1 - p.alpha) * reformed
        ctx.fillRect(x, y, grown, grown)
      }

      ctx.globalAlpha = 1

      if (t < 1) frame = requestAnimationFrame(draw)
      else done.current()
    }

    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [from, to, font, letterSpacing, color, width, height, durationMs])

  return (
    <RevealCanvas
      ref={ref}
        aria-hidden="true"
      style={{
        width,
        height,
        opacity: fadingOut ? 0 : 1,
        transition: `opacity ${fadeMs}ms linear`,
      }}
    />
  )
}
