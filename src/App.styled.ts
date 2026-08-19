import { styled } from 'styled-components'

export const Shell = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  /* Installed on a phone the app runs under the status bar and the home indicator, so
     each edge takes whichever is larger: the app's own padding or the safe area. */
  padding: max(24px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right))
    max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));
`

export const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
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
`
