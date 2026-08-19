import { css, styled } from 'styled-components'

/**
 * The two buttons that sit on the theme's backdrop. Both are glass: the blur is what
 * keeps a label legible over a gradient without a solid plate behind it.
 */
const glass = css`
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 999px;
  cursor: pointer;
  backdrop-filter: blur(12px);
`

export const RollButton = styled.button`
  ${glass}
  /* Sized to its label on a wide screen, where stretching it made a target the width of
     the window. A phone has no room to spare, so below the breakpoint it takes what is
     left of the row. */
  flex: 0 0 auto;
  min-width: 148px;
  padding: 15px 40px;
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  transition:
    transform 120ms ease,
    opacity 120ms ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }

  @media (max-width: 600px) {
    flex: 1;
  }
`

/** Same surface, border and blur as the roll button, just round instead of a pill. */
export const IconButton = styled.button<{ $quiet?: boolean }>`
  ${glass}
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  transition: transform 120ms ease;

  &:hover {
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.94);
  }

  /* Inside a drawer there is no backdrop to sit on, so the glass comes off. */
  ${(props) =>
    props.$quiet &&
    css`
      width: 34px;
      height: 34px;
      color: var(--dim);
      background: transparent;
      backdrop-filter: none;

      &:hover {
        color: var(--text);
        background: color-mix(in srgb, var(--text) 10%, transparent);
      }
    `}
`

/** Beside the roll button these are larger, because that row is what a thumb reaches for. */
export const rowIconSize = css`
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
`
