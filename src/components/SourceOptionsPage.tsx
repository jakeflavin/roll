type SourceOptionsPageProps = {
  options: string[]
  /** Emoji need their own grid; everything else reads as a list. */
  isEmoji: boolean
}

/** The whole pool of a built-in group, for when the summary line is not enough. */
export function SourceOptionsPage({ options, isEmoji }: SourceOptionsPageProps) {
  return (
    <>
      <p className="options-count">{options.length} options</p>
      <ul className={`options-list${isEmoji ? ' is-emoji' : ''}`}>
        {options.map((option) => (
          <li key={option}>{option}</li>
        ))}
      </ul>
    </>
  )
}
