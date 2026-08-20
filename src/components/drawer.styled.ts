import { css, styled } from 'styled-components'

/**
 * The shell both drawers wear — settings and session — and the spacing scale their
 * contents lay out on: --gap-row between stacked controls, --gap-block between groups
 * and around a rule.
 *
 * A sheet pinned to the right, inset to match the app's own padding. The blur is what
 * keeps it reading as glass over the theme's backdrop.
 */
export const Drawer = styled.dialog`
  --gap-row: 10px;
  --gap-block: 24px;

  position: fixed;
  inset: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right))
    max(12px, env(safe-area-inset-bottom)) auto;
  margin: 0;
  width: min(360px, calc(100vw - 24px));
  /* The dialog UA stylesheet sets height: fit-content, which would ignore the bottom
     inset — auto lets the top/bottom insets size the drawer instead. */
  height: auto;
  max-width: none;
  max-height: none;
  padding: 24px;
  overflow-y: auto;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 20px;
  backdrop-filter: blur(20px);

  &[open] {
    animation: drawer-in 260ms cubic-bezier(0.32, 0.72, 0, 1);
  }

  @keyframes drawer-in {
    from {
      transform: translateX(24px);
      opacity: 0;
    }
  }

  &::backdrop {
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(3px);
    animation: backdrop-in 260ms ease;
  }

  @keyframes backdrop-in {
    from {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &[open],
    &::backdrop {
      animation: none;
    }
  }
`

export const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--gap-block);

  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
`

export const Group = styled.fieldset<{ $row?: boolean }>`
  margin: 0 0 var(--gap-block);
  padding: 0;
  border: 0;

  /* Every stacked child is spaced by the same rule, so nothing depends on a margin
     declared somewhere else. A row lays out horizontally instead. */
  ${(props) => !props.$row && '& > * + * { margin-top: var(--gap-row); }'}

  /*
   * A standalone setting sits on the outer column with the section titles rather than
   * indented with a card's contents, and stands as tall as the controls it sits among
   * instead of collapsing to the height of the switch.
   */
  ${(props) =>
    props.$row &&
    `
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 40px;
    font-size: 14px;

    & > label {
      padding-left: 1px;
      cursor: pointer;
    }
  `}

  &:last-child {
    margin-bottom: 0;
  }

  /* The controls below each title sit inside a 1px border, so the title needs the same
     inset to line up with their contents rather than with their outer edge. */
  legend {
    padding: 0 0 0 1px;
    font-size: 13px;
    color: var(--dim);
  }
`

export const SelectWrap = styled.div<{ $add?: boolean }>`
  position: relative;
  display: flex;
  ${(props) => props.$add && 'flex: 1; min-width: 0;'}
`

export const Select = styled.select<{ $bare?: boolean; $add?: boolean }>`
  width: 100%;
  min-height: 44px;
  padding: 10px 38px 10px 12px;
  font: inherit;
  font-size: 15px;
  color: var(--text);
  appearance: none;
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 10px;
  cursor: pointer;

  /* The popup list is drawn by the OS, so its options need a readable background of
     their own rather than the drawer's translucent surface. */
  option {
    color: #1c1c1e;
    background: #fff;
  }

  /* The card already draws the border, so the control inside must not draw another. */
  ${(props) => props.$bare && 'font-weight: 500; background: transparent; border: 0; border-radius: 0;'}

  ${(props) =>
    props.$add &&
    `
    min-height: 44px;
    padding: 9px 12px 9px 32px;
    font-size: 14px;
    color: var(--dim);
    border-style: dashed;
  `}
`

export const LinkButton = styled.button<{ $danger?: boolean }>`
  /* Reads as a link, but is sized as something a thumb has to hit: the underline sits
     on the text while the padding gives the control its own height. */
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 2px;
  font: inherit;
  font-size: 13px;
  color: var(--dim);
  text-decoration: underline;
  text-underline-offset: 3px;
  background: none;
  border: 0;
  cursor: pointer;

  &:hover {
    color: var(--text);
  }

  ${(props) =>
    props.$danger &&
    `
    display: flex;
    justify-content: center;
    width: 100%;
    margin: var(--gap-block) 0 0;
    text-align: center;
  `}
`

export const Divider = styled.hr`
  height: 0;
  /* Matches the group spacing it collapses against, so the gaps above and below it stay
     equal. */
  margin: var(--gap-block) 0;
  border: 0;
  border-top: 1px solid var(--line);
`

export const OptionsCount = styled.p`
  margin: 0 0 var(--gap-row);
  padding-left: 1px;
  font-size: 13px;
  color: var(--dim);
`

/** Raised above a drawer, so it is centred rather than pinned to an edge. */
export const Confirm = styled.dialog`
  width: min(320px, calc(100vw - 48px));
  padding: 22px;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  backdrop-filter: blur(20px);

  &::backdrop {
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(3px);
  }

  h2 {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 600;
  }
`

export const ButtonRow = styled.div`
  display: flex;
  gap: var(--gap-row);
`

export const OutlineButton = styled.button<{ $danger?: boolean; $wide?: boolean }>`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 44px;
  padding: 11px 12px;
  font: inherit;
  font-size: 14px;
  color: var(--text);
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 10px;
  cursor: pointer;

  &:hover {
    background: color-mix(in srgb, var(--text) 8%, transparent);
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }

  ${(props) => props.$wide && 'width: 100%;'}

  ${(props) =>
    props.$danger &&
    `
    color: #ff8080;
    border-color: color-mix(in srgb, #ff8080 45%, transparent);

    &:hover {
      background: color-mix(in srgb, #ff8080 14%, transparent);
    }
  `}
`

/**
 * A group is a card: the dropdown names it, the rows beneath configure it. Without the
 * card, a dropdown and its settings were indistinguishable from the next group's.
 */
export const GroupCard = styled.div`
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 12px;

  /* On the list editor the card stands on its own rather than inside a group, so it
     carries the block spacing a group would otherwise have given it. */
  ${Drawer} > & {
    margin-bottom: var(--gap-block);
  }
`

export const GroupHead = styled.div`
  display: flex;
  align-items: center;

  ${SelectWrap} {
    flex: 1;
    min-width: 0;
  }
`

/** Sits in a card row, so its own border would be a box inside a box. */
export const PlainInput = styled.input`
  flex: 1;
  /* The row is tall enough already; this is about where a tap actually lands, which is
     the input itself and not the padding around it. */
  min-height: 44px;
  min-width: 0;
  padding: 0;
  font: inherit;
  font-size: 14px;
  color: var(--text);
  background: transparent;
  border: 0;

  &::placeholder {
    color: var(--dim);
  }

  &:focus-visible {
    outline: 0;
  }
`

/** The card already draws the border, so the control inside must not draw another. */
export const BareInput = styled.input`
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  color: var(--text);
  background: transparent;
  border: 0;
  border-radius: 0;

  &:focus-visible {
    outline: 2px solid var(--text);
    outline-offset: -2px;
  }
`

/**
 * `$small` shrinks what is drawn, not what can be hit: inside a dense list of entries
 * the glyph wants to be quiet, but the target still has to be findable with a thumb.
 */
export const GhostButton = styled.button<{ $small?: boolean }>`
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-right: ${(props) => (props.$small ? '-6px' : '4px')};
  color: var(--dim);
  background: transparent;
  border: 0;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    color: var(--text);
    background: color-mix(in srgb, var(--text) 10%, transparent);
  }

  /* Drawn at the size the row wants, while the button keeps its full 44. */
  ${(props) =>
    props.$small &&
    css`
      &:hover {
        background: none;
      }

      svg {
        padding: 6px;
        box-sizing: content-box;
        border-radius: 8px;
      }

      &:hover svg {
        background: color-mix(in srgb, var(--text) 10%, transparent);
      }
    `}
`

/**
 * The switch, drawn from a checkbox so it keeps the control's own behaviour.
 *
 * The element is a finger-sized box; the pill and its knob are drawn inside it. Sizing
 * the element to the pill instead gave a 26px-tall target and no way to grow it, since
 * margin is not something you can hit.
 */
export const Switch = styled.input`
  position: relative;
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  margin: 0;
  appearance: none;
  background: transparent;
  border: 0;
  cursor: pointer;

  /* The track. */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    width: 44px;
    height: 26px;
    border: 1px solid var(--line);
    border-radius: 999px;
    transform: translateY(-50%);
    transition: background 150ms ease;
  }

  /* The knob. */
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 4px;
    width: 18px;
    height: 18px;
    background: var(--text);
    border-radius: 50%;
    opacity: 0.55;
    transform: translateY(-50%);
    transition:
      left 150ms ease,
      opacity 150ms ease;
  }

  &:checked::before {
    background: color-mix(in srgb, var(--text) 20%, transparent);
  }

  &:checked::after {
    left: 22px;
    opacity: 1;
  }
`

/**
 * A group's own settings: a hairline separates them from the choice above, and the label
 * sits quiet so the group's name stays the loudest thing in the card.
 */
export const GroupField = styled.div<{ $switch?: boolean; $wrap?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${(props) => (props.$wrap ? '8px' : '12px')};
  padding: 10px 12px;
  border-top: 1px solid var(--line);
  ${(props) => props.$wrap && 'flex-wrap: wrap;'}
  ${(props) => props.$switch && 'justify-content: space-between;'}

  label {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 5px;
    font-size: 12px;
    color: var(--dim);

    ${(props) =>
      props.$switch &&
      `
      flex-direction: row;
      align-items: center;
      font-size: 14px;
      color: var(--text);
      cursor: pointer;
    `}
  }

  input[type='number'] {
    width: 100%;
    min-height: 44px;
    padding: 7px 10px;
    font: inherit;
    font-size: 14px;
    color: var(--text);
    background: transparent;
    border: 1px solid var(--line);
    border-radius: 8px;
  }

  input[type='number']:focus-visible {
    outline: 2px solid var(--text);
    outline-offset: 1px;
  }

  input[type='color'] {
    flex: 1;
    min-width: 0;
    height: 34px;
    padding: 2px;
    background: transparent;
    border: 1px solid var(--line);
    border-radius: 8px;
    cursor: pointer;
  }

  input[type='range'] {
    flex: 1;
    accent-color: var(--text);
  }

  ${OutlineButton} {
    flex: 1;
    min-height: 40px;
    padding: 6px 12px;
  }
`

/** Navigation, so it reads as a way through rather than as another equal control. */
export const GroupLink = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  font: inherit;
  font-size: 13px;
  color: var(--dim);
  text-align: left;
  background: transparent;
  border: 0;
  border-top: 1px solid var(--line);
  cursor: pointer;

  &:hover {
    color: var(--text);
    background: color-mix(in srgb, var(--text) 6%, transparent);
  }
`

/** Adding is an action, not a group, so it does not wear a group's solid border. */
export const AddRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`

/** `$inset` lines a hint up with a card's own padding rather than the drawer's. */
export const Hint = styled.p<{ $error?: boolean; $inset?: boolean }>`
  margin: 0;
  padding-left: 1px;
  font-size: 12px;
  line-height: 1.4;
  color: ${(props) => (props.$error ? 'var(--text)' : 'var(--dim)')};
  ${(props) => props.$inset && 'padding: 0 12px 10px;'}
`

/** Present to a screen reader, absent to everyone else. */
export const VisuallyHidden = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`

/** A list of rows separated by hairlines, closed off at the bottom. */
export const RuledList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    border-top: 1px solid var(--line);
  }

  li:last-child {
    border-bottom: 1px solid var(--line);
  }
`

export const FieldLabel = styled.span`
  font-size: 12px;
  color: var(--dim);
`

export const FieldValue = styled.span`
  min-width: 42px;
  font-size: 13px;
  color: var(--dim);
  font-variant-numeric: tabular-nums;
  text-align: right;
`

export const ImageThumb = styled.span`
  flex: 0 0 auto;
  width: 44px;
  height: 34px;
  background-position: center;
  background-size: cover;
  border: 1px solid var(--line);
  border-radius: 8px;
`

export const Segmented = styled.div<{ $inline?: boolean }>`
  display: flex;
  gap: 4px;
  padding: ${(props) => (props.$inline ? '3px' : '4px')};
  border: 1px solid var(--line);
  border-radius: 12px;
  ${(props) => props.$inline && 'flex: 1;'}
`

export const SegmentButton = styled.button<{ $active?: boolean }>`
  flex: 1;
  padding: 9px 12px;
  font: inherit;
  font-size: 14px;
  color: ${(props) => (props.$active ? 'var(--text)' : 'var(--dim)')};
  background: ${(props) =>
    props.$active ? 'color-mix(in srgb, var(--text) 12%, transparent)' : 'transparent'};
  border: 0;
  border-radius: 8px;
  cursor: pointer;
`

export const SelectArrow = styled.span<{ $left?: boolean }>`
  position: absolute;
  top: 50%;
  right: ${(props) => (props.$left ? 'auto' : '14px')};
  ${(props) => props.$left && 'left: 12px;'}
  color: var(--dim);
  pointer-events: none;
  transform: translateY(-50%);
`
