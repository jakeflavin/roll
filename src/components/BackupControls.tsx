import { useRef, useState } from 'react'
import { ButtonRow, Hint, OutlineButton, VisuallyHidden } from './drawer.styled'
import { Download, Upload } from 'lucide-react'
import { BackupError, buildBackup, downloadBackup, parseBackup } from '@/lib/backup'
import type { CustomList } from '@/lib/lists'
import type { Session } from '@/lib/session'
import type { Settings } from '@/hooks/useSettings'

type BackupControlsProps = {
  settings: Settings
  session: Session
  lists: CustomList[]
  onRestore: (settings: Settings, session: Session, lists: CustomList[]) => void
}

export function BackupControls({ settings, session, lists, onRestore }: BackupControlsProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<{ text: string; error: boolean } | null>(null)

  const onExport = () => {
    downloadBackup(buildBackup(settings, session, lists))
    setStatus({ text: 'Exported.', error: false })
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const parsed = parseBackup(await file.text(), settings)
      onRestore(parsed.settings, parsed.session, parsed.lists)
      const picks = parsed.session.entries.length
      const listCount = parsed.lists.length
      setStatus({
        text: `Imported settings, ${picks} ${picks === 1 ? 'pick' : 'picks'}${
          listCount ? `, and ${listCount} ${listCount === 1 ? 'list' : 'lists'}` : ''
        }.`,
        error: false,
      })
    } catch (error) {
      setStatus({
        text: error instanceof BackupError ? error.message : "That file couldn't be read.",
        error: true,
      })
    } finally {
      // Cleared so choosing the same file again still fires a change event.
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      <ButtonRow>
        <OutlineButton onClick={onExport}>
          <Download size={15} aria-hidden="true" />
          Export
        </OutlineButton>
        <OutlineButton onClick={() => fileRef.current?.click()}>
          <Upload size={15} aria-hidden="true" />
          Import
        </OutlineButton>
        <VisuallyHidden
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </ButtonRow>

      {/* Only speaks when there is something to report. */}
      {status && <Hint $error={Boolean(status.error)}>{status.text}</Hint>}
    </>
  )
}
