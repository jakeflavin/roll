import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsDialog } from './SettingsDialog'
import { defaultSettings } from '@/hooks/useSettings'
import { emptySession } from '@/lib/session'

/*
 * showModal() and close() come from the shim in the test setup — jsdom has neither, and
 * without it this dialog would render shut and every assertion below would pass for the
 * wrong reason.
 */
const props = () => ({
  open: true,
  onClose: vi.fn(),
  settings: defaultSettings,
  onChange: vi.fn(),
  session: emptySession,
  onRestore: vi.fn(),
  lists: [],
  onCreateList: vi.fn(),
  onOpenSession: vi.fn(),
  sample: '42',
  onUpdateList: vi.fn(),
  onDeleteList: vi.fn(),
})

const heading = () => document.querySelector('.settings-header h2')?.textContent

describe('SettingsDialog', () => {
  it('opens as a modal when told to, and not before', () => {
    const { rerender } = render(<SettingsDialog {...props()} open={false} />)
    const dialog = document.querySelector('dialog') as HTMLDialogElement
    expect(dialog.open).toBe(false)
    rerender(<SettingsDialog {...props()} open />)
    expect(dialog.open).toBe(true)
  })

  it('lands on the settings page by default', () => {
    render(<SettingsDialog {...props()} />)
    expect(heading()).toBe('Settings')
  })

  it('lands on the shortcuts page when the caller asks for it', () => {
    render(<SettingsDialog {...props()} openTo="shortcuts" />)
    expect(heading()).toBe('Shortcuts')
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0)
  })

  it('walks into a group’s pool and back out again', async () => {
    render(<SettingsDialog {...props()} settings={{ ...defaultSettings, sourceIds: ['emoji'] }} />)
    await userEvent.click(screen.getByRole('button', { name: /See all/ }))
    expect(heading()).toBe('Emoji')

    await userEvent.click(screen.getByRole('button', { name: 'Back to settings' }))
    expect(heading()).toBe('Settings')
  })

  it('offers no way back from the settings page, since it is the top one', () => {
    render(<SettingsDialog {...props()} />)
    expect(screen.queryByRole('button', { name: 'Back to settings' })).not.toBeInTheDocument()
  })

  it('closes from any page', async () => {
    const p = props()
    render(<SettingsDialog {...p} openTo="shortcuts" />)
    await userEvent.click(screen.getByRole('button', { name: 'Close settings' }))
    expect(p.onClose).toHaveBeenCalledOnce()
  })

  it('re-lands on the requested page each time it opens, not wherever it was left', async () => {
    const { rerender } = render(<SettingsDialog {...props()} settings={{ ...defaultSettings, sourceIds: ['emoji'] }} />)
    await userEvent.click(screen.getByRole('button', { name: /See all/ }))
    expect(heading()).toBe('Emoji')

    rerender(<SettingsDialog {...props()} open={false} settings={{ ...defaultSettings, sourceIds: ['emoji'] }} />)
    rerender(<SettingsDialog {...props()} open settings={{ ...defaultSettings, sourceIds: ['emoji'] }} />)
    expect(heading()).toBe('Settings')
  })
})
