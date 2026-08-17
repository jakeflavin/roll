import { useEffect, useRef, useState } from 'react'
import { Check, Share } from 'lucide-react'

type Props = {
  /** Built by the app so the shared link always matches what is on screen. */
  url: string
}

export function ShareButton({ url }: Props) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)

  useEffect(() => () => clearTimeout(timer.current), [])

  const share = async () => {
    // Where the platform has a share sheet, that is what people expect from a share
    // button; the clipboard is the fallback everywhere else.
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Roll', url })
        return
      } catch {
        // Dismissing the sheet rejects, and is not a failure worth reporting.
        return
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be refused; leaving the icon unchanged says as much.
    }
  }

  return (
    <button
      className="icon-button"
      onClick={share}
      aria-label={copied ? 'Link copied' : 'Share these settings'}
    >
      {copied ? <Check size={18} /> : <Share size={18} />}
    </button>
  )
}
