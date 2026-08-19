import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SourceSettings } from './SourceSettings'
import { defaultSettings, type Settings } from '@/hooks/useSettings'

const props = (over: Partial<Settings> = {}) => ({
  settings: { ...defaultSettings, ...over },
  onChange: vi.fn(),
  lists: [],
  onCreateList: vi.fn(),
  onEditList: vi.fn(),
  onViewOptions: vi.fn(),
})

describe('SourceSettings', () => {
  it('shows the range fields for the number group and not for others', async () => {
    const p = props({ sourceIds: ['number'] })
    const { rerender } = render(<SourceSettings {...p} />)
    expect(screen.getByLabelText('Min')).toBeInTheDocument()

    rerender(<SourceSettings {...props({ sourceIds: ['letter'] })} />)
    expect(screen.queryByLabelText('Min')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Include lowercase')).toBeInTheDocument()
  })

  it('orders a reversed range on commit rather than on every keystroke', async () => {
    // Typing "5" into a min of 1 with a max of 100 must not swap mid-edit.
    const p = props({ sourceIds: ['number'], min: 90, max: 10 })
    render(<SourceSettings {...p} />)
    await userEvent.click(screen.getByLabelText('Max'))
    await userEvent.tab()
    expect(p.onChange).toHaveBeenCalledWith(expect.objectContaining({ min: 10, max: 90 }))
  })

  it('leaves an already-ordered range alone', async () => {
    const p = props({ sourceIds: ['number'], min: 1, max: 100 })
    render(<SourceSettings {...p} />)
    await userEvent.click(screen.getByLabelText('Max'))
    await userEvent.tab()
    expect(p.onChange).not.toHaveBeenCalled()
  })

  it('offers no remove button while a single group is the only one', () => {
    render(<SourceSettings {...props({ sourceIds: ['number'] })} />)
    expect(screen.queryByRole('button', { name: /^Remove/ })).not.toBeInTheDocument()
  })

  it('can remove a group once there are two', async () => {
    const p = props({ sourceIds: ['number', 'letter'] })
    render(<SourceSettings {...p} />)
    const buttons = screen.getAllByRole('button', { name: /^Remove/ })
    expect(buttons).toHaveLength(2)
    await userEvent.click(buttons[0]!)
    expect(p.onChange).toHaveBeenCalledWith(expect.objectContaining({ sourceIds: ['letter'] }))
  })

  it('sends a built-in group to its pool rather than to the list editor', async () => {
    const p = props({ sourceIds: ['emoji'] })
    render(<SourceSettings {...p} />)
    await userEvent.click(screen.getByRole('button', { name: /See all/ }))
    expect(p.onViewOptions).toHaveBeenCalledWith('emoji')
    expect(p.onEditList).not.toHaveBeenCalled()
  })

  it('opens the editor straight away when a custom list is created', async () => {
    const p = props()
    render(<SourceSettings {...p} />)
    await userEvent.click(screen.getByRole('button', { name: 'Custom list' }))
    expect(p.onCreateList).toHaveBeenCalledOnce()
    // A new list is empty, so staying put would look like nothing happened.
    expect(p.onEditList).toHaveBeenCalledWith(null)
  })

  it('toggles repeat picks', async () => {
    const p = props({ repeat: false })
    render(<SourceSettings {...p} />)
    await userEvent.click(screen.getByRole('switch', { name: 'Repeat picks' }))
    expect(p.onChange).toHaveBeenCalledWith(expect.objectContaining({ repeat: true }))
  })
})
