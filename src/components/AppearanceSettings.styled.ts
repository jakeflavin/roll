import { styled } from 'styled-components'

export const ThemeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`

export const ThemeOption = styled.button<{ $active?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  font: inherit;
  color: var(--text);
  text-align: left;
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 12px;
  cursor: pointer;

  ${(props) => props.$active && 'outline: 2px solid var(--text); outline-offset: 1px;'}
`

export const ThemeSwatch = styled.span`
  display: grid;
  place-items: center;
  height: 56px;
  /* The swatch previews the theme's own border colour, not the active theme's. */
  border: 1px solid transparent;
  border-radius: 8px;
`

export const ThemePreview = styled.span`
  max-width: 100%;
  padding: 0 8px;
  font-size: 26px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  /* The sample is whatever is on screen, which can be a long word. */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const ThemeName = styled.span`
  font-size: 13px;
`

export const AnimationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`

export const AnimationOption = styled.button<{ $active?: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-height: 44px;
  padding: 10px 12px;
  font: inherit;
  color: var(--text);
  text-align: left;
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 12px;
  cursor: pointer;

  ${(props) => props.$active && 'outline: 2px solid var(--text); outline-offset: 1px;'}
`

export const AnimationName = styled.span`
  font-size: 14px;
  font-weight: 500;
`
