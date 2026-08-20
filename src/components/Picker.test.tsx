import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Picker, type Slot } from './Picker'
import { createSource } from '@/lib/sources'
import { defaultTheme } from '@/lib/themes'
import { EMPTY_TEXT, EXHAUSTED_TEXT } from '@/lib/messages'

const config = { min: 1, max: 3, bothCases: false }

function slot(sourceId: string, lists: Parameters<typeof createSource>[1] = []): Slot {
  return {
    sourceId,
    sourceKey: sourceId,
    name: sourceId,
    source: createSource({ ...config, sourceId }, lists),
    drawn: new Set(),
  }
}

const emptyList = [{ id: 'custom:e', name: 'My list', items: [] }]

function setup(slots: Slot[]) {
  const props = {
    slots,
    theme: defaultTheme,
    animation: 'roll' as const,
    allowRepeat: false,
    onPick: vi.fn(),
    onStartOver: vi.fn(),
    onAddEntries: vi.fn(),
    onSettle: vi.fn<(values: string[]) => void>(),
  }
  render(<Picker {...props} />)
  return props
}

describe('a pool with nothing in it', () => {
  it('says so, rather than showing a blank stage', () => {
    setup([slot('custom:e', emptyList)])
    expect(screen.getByText(EMPTY_TEXT)).toBeInTheDocument()
  })

  it('offers the way out instead of a roll that cannot happen', async () => {
    const props = setup([slot('custom:e', emptyList)])
    expect(screen.queryByRole('button', { name: 'Roll' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Add entries' }))
    expect(props.onAddEntries).toHaveBeenCalledOnce()
  })

  it('never records a pick, however many times the button is pressed', async () => {
    // Pressing it used to alternate the label between Roll and Start over for ever,
    // filing a valueless entry into the session on every other press.
    const props = setup([slot('custom:e', emptyList)])
    const button = screen.getByRole('button', { name: 'Add entries' })
    for (let i = 0; i < 4; i++) await userEvent.click(button)

    expect(props.onPick).not.toHaveBeenCalled()
    expect(props.onStartOver).not.toHaveBeenCalled()
    expect(button).toHaveTextContent('Add entries')
  })

  it('settles on nothing, so the placeholder never reaches the URL or the swatches', () => {
    const props = setup([slot('custom:e', emptyList)])
    expect(props.onSettle).toHaveBeenCalledWith([''])
    for (const [values] of props.onSettle.mock.calls) {
      expect(values).not.toContain(EMPTY_TEXT)
    }
  })

  it('still rolls the slots beside it that do have something', async () => {
    const props = setup([slot('custom:e', emptyList), slot('number')])
    // Only every slot being empty takes the button away; one empty group among others
    // must not stop the rest of the stage working.
    await userEvent.click(screen.getByRole('button', { name: 'Roll' }))

    expect(screen.getByText(EMPTY_TEXT)).toBeInTheDocument()
    expect(props.onAddEntries).not.toHaveBeenCalled()
  })
})

describe('a pool that has been used up', () => {
  it('sets its message apart from a value rather than dressed as one', async () => {
    const spent = slot('number')
    spent.drawn = new Set(['1', '2', '3'])
    setup([spent])

    await userEvent.click(screen.getByRole('button', { name: 'Roll' }))

    const message = screen.getByText(EXHAUSTED_TEXT)
    // A paragraph in the quiet ink, not the display face the value wears.
    expect(message.tagName).toBe('P')
    expect(screen.getByRole('button', { name: 'Start over' })).toBeInTheDocument()
  })

  it('does not record the message as a pick', async () => {
    const spent = slot('number')
    spent.drawn = new Set(['1', '2', '3'])
    const props = setup([spent])

    await userEvent.click(screen.getByRole('button', { name: 'Roll' }))
    expect(props.onPick).not.toHaveBeenCalled()
  })
})
