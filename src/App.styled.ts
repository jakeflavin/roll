import { styled } from 'styled-components'

export const Shell = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  /* Installed on a phone the app runs under the status bar and the home indicator, so
     each edge takes whichever is larger: the app's own padding or the safe area. */
  padding: max(24px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right))
    max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));

  /* The page supplies its own margins, and there is no notch on a sheet of paper. */
  @media print {
    height: auto;
    padding: 0;
  }
`

export const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media print {
    color: #000;
  }
`

export const Title = styled.h1`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.02em;
`

export const Main = styled.main`
  display: flex;
  flex: 1;
  min-height: 0;

  /* A sheet of paper has no viewport to fill, so the stage takes the height its
     contents need and the rest of the page stays blank. */
  @media print {
    flex: none;
    min-height: auto;
  }
`
