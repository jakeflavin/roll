import { styled } from 'styled-components'

import { RuledList } from './drawer.styled'

export const DayGroup = styled.section`
  margin-bottom: var(--gap-block);
`

export const DayLabel = styled.h3`
  margin: 0 0 var(--gap-row) 1px;
  font-size: 13px;
  font-weight: 500;
  color: var(--dim);
`

export const Picks = styled(RuledList)`
  li {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 2px;
  }
`

export const PickValue = styled.span`
  font-size: 15px;
`

export const PickMeta = styled.span`
  display: flex;
  flex: 0 0 auto;
  gap: 10px;
  font-size: 12px;
  color: var(--dim);
`

export const Shortcuts = styled(RuledList)`
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 11px 2px;
    font-size: 14px;
  }
`

export const Keys = styled.span`
  display: flex;
  flex: 0 0 auto;
  gap: 6px;

  kbd {
    padding: 3px 8px;
    font-family: inherit;
    font-size: 12px;
    color: var(--dim);
    border: 1px solid var(--line);
    border-radius: 6px;
  }
`

/** The entries of a custom list, and the pool of a built-in one. */
export const Entries = styled(RuledList)`
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 6px 2px 6px 1px;
    font-size: 14px;
  }
`

export const Options = styled(RuledList)<{ $emoji?: boolean }>`
  li {
    padding: 10px 2px;
    font-size: 14px;
  }

  /* Emoji have no width to speak of, so a row each wastes the drawer — they wrap as
     pills instead, while worded options stay a scannable list. */
  ${(props) =>
    props.$emoji &&
    `
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    li {
      padding: 6px 10px;
      font-size: 22px;
      line-height: 1;
      border: 1px solid var(--line);
      border-radius: 999px;
    }
  `}
`
