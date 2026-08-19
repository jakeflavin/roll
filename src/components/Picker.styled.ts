import { styled } from 'styled-components'

import { IconButton, rowIconSize } from './buttons.styled'

/**
 * The picker owns the whole area below the header: the value centres in the space that is
 * left, and the button sits on the bottom edge at the header's width.
 */
export const Stage = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 24px;
  width: 100%;
`

export const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  /* Beside the roll button these are the row a thumb reaches for, so they are larger than
     the same button is anywhere else. Interpolated rather than written as a descendant
     selector, which stops matching the moment the class goes. */
  ${IconButton} {
    ${rowIconSize}
  }
`

export const Tools = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`
