import { OptionsCount } from './drawer.styled'
import { Options } from './SessionDialog.styled'
type SourceOptionsPageProps = {
  options: string[]
  /** Emoji need their own grid; everything else reads as a list. */
  isEmoji: boolean
}

/** The whole pool of a built-in group, for when the summary line is not enough. */
export function SourceOptionsPage({ options, isEmoji }: SourceOptionsPageProps) {
  return (
    <>
      <OptionsCount>{options.length} options</OptionsCount>
      <Options $emoji={isEmoji}>
        {options.map((option) => (
          <li key={option}>{option}</li>
        ))}
      </Options>
    </>
  )
}
