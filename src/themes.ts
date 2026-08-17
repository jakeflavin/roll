export type Theme = {
  id: string
  name: string
  /** Layered gradients painted on the page background. */
  background: string
  /** Text and chrome colors that sit on top of the background. */
  text: string
  muted: string
  /** Surface used for the settings dialog and buttons. */
  surface: string
  border: string
  /** Font stack for the big picked value. */
  displayFont: string
  displayWeight: number
  displayTracking: string
}

export const themes: Theme[] = [
  {
    id: 'aurora',
    name: 'Aurora',
    background:
      'radial-gradient(120% 90% at 15% 10%, #5b2ea8 0%, transparent 55%),' +
      'radial-gradient(100% 80% at 85% 25%, #1e7f8f 0%, transparent 60%),' +
      'radial-gradient(110% 100% at 50% 100%, #2c1b6b 0%, transparent 65%),' +
      'linear-gradient(160deg, #140f30 0%, #1b1147 55%, #0d1a33 100%)',
    text: '#f4f1ff',
    muted: 'rgba(244, 241, 255, 0.62)',
    surface: 'rgba(24, 18, 54, 0.82)',
    border: 'rgba(244, 241, 255, 0.16)',
    displayFont: '"Inter", system-ui, sans-serif',
    displayWeight: 700,
    displayTracking: '-0.04em',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    background:
      'radial-gradient(100% 80% at 20% 15%, #ffd08a 0%, transparent 58%),' +
      'radial-gradient(110% 90% at 85% 20%, #ff8a6b 0%, transparent 60%),' +
      'radial-gradient(120% 100% at 60% 100%, #d94f8c 0%, transparent 65%),' +
      'linear-gradient(155deg, #ffb27a 0%, #f4739a 50%, #8e3c93 100%)',
    text: '#3a1024',
    muted: 'rgba(58, 16, 36, 0.62)',
    surface: 'rgba(255, 244, 238, 0.86)',
    border: 'rgba(58, 16, 36, 0.16)',
    displayFont: '"Inter", system-ui, sans-serif',
    displayWeight: 800,
    displayTracking: '-0.05em',
  },
  {
    id: 'mint',
    name: 'Mint',
    background:
      'radial-gradient(100% 80% at 25% 10%, #d9f5e6 0%, transparent 60%),' +
      'radial-gradient(110% 90% at 80% 30%, #cfe6ff 0%, transparent 62%),' +
      'radial-gradient(120% 100% at 50% 100%, #f6e9d8 0%, transparent 60%),' +
      'linear-gradient(150deg, #eef7f2 0%, #e2eef8 55%, #f7f1e8 100%)',
    text: '#17332c',
    muted: 'rgba(23, 51, 44, 0.55)',
    surface: 'rgba(255, 255, 255, 0.88)',
    border: 'rgba(23, 51, 44, 0.14)',
    displayFont: '"Instrument Serif", Georgia, serif',
    displayWeight: 400,
    displayTracking: '-0.02em',
  },
  {
    id: 'noir',
    name: 'Noir',
    background:
      'radial-gradient(90% 70% at 50% 12%, #2a2a35 0%, transparent 60%),' +
      'radial-gradient(80% 60% at 15% 90%, #1d2b3a 0%, transparent 62%),' +
      'radial-gradient(80% 60% at 90% 80%, #33203a 0%, transparent 62%),' +
      'linear-gradient(180deg, #0d0d11 0%, #08080b 100%)',
    text: '#eceaf2',
    muted: 'rgba(236, 234, 242, 0.5)',
    surface: 'rgba(20, 20, 26, 0.9)',
    border: 'rgba(236, 234, 242, 0.14)',
    displayFont: '"JetBrains Mono", ui-monospace, monospace',
    displayWeight: 600,
    displayTracking: '-0.03em',
  },
]

export const defaultTheme = themes[0]

export function themeById(id: string): Theme {
  return themes.find((t) => t.id === id) ?? defaultTheme
}
