import { motion } from 'motion/react'
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

  /* Controls do nothing on paper. */
  @media print {
    display: none;
  }

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

export const Slots = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* Gaps give way before the type does. */
  gap: clamp(6px, 3cqh, 28px);
  min-height: 0;
  width: 100%;
  /* Makes the stage a query container, so a value can be sized against the height it
     actually has rather than against the viewport. Every cqh below resolves here. */
  container-type: size;

  /* A printed page has no fixed height to fit into, and a container query with none
     resolves every cqh to zero. */
  @media print {
    container-type: normal;
    flex: none;
    gap: 28px;
    padding: 24pt 0;
  }
`

export const Slot = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(2px, 1cqh, 6px);
  min-width: 0;
  max-width: 100%;
`

export const Label = styled.p`
  margin: 0;
  font-size: 11px;
  font-weight: 500;
  color: var(--dim);
  letter-spacing: 0.14em;
  text-transform: uppercase;

  @media print {
    font-size: 10pt;
    color: #444;
  }
`

export const SlotStage = styled.div`
  position: relative;
  display: grid;
  place-items: center;
  min-height: 0;
  min-width: 0;
  /* Without perspective the flip's rotateX reads as a flat vertical squash. */
  perspective: 1200px;
`

/** Fades the value behind a celebration, and back once it has changed. */
export const ValueCover = styled.div`
  transition: opacity 220ms ease;

  &[data-covered] {
    opacity: 0;
  }
`

/**
 * Threads draws its spoiler as particles on a canvas rather than a panel over the text,
 * so Reveal does the same: the glyphs disperse into drifting dust and reform as the new
 * number.
 */
export const RevealCanvas = styled.canvas`
  position: absolute;
  pointer-events: none;
`

/**
 * Covers the window rather than the stage, so nothing thrown from the value is clipped at
 * an edge. Above everything on the page, but it never takes a click.
 */
export const CelebrationCanvas = styled.canvas`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 5;
  pointer-events: none;
`

/**
 * The value itself. Wraps motion's element rather than a plain div, because motion owns
 * this element's transform and opacity while it settles — the size and the numerals are
 * all that belong to CSS.
 */
export const Value = styled(motion.div)`
  --display-size: clamp(6rem, 26vw, 18rem);
  font-size: var(--display-size);
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  text-align: center;
  text-wrap: balance;
  user-select: none;
  /* The stage stops shrinking type at a readable floor, so anything longer than that
     floor allows has to wrap. Anywhere rather than break-word, because a single
     unbroken 40-character entry has no space to break at. */
  max-width: 100%;
  overflow-wrap: anywhere;

  /* Paper has no theme: the ground does not print, so the ink must not be the ground's
     ink. Sized to the page rather than to a screen the printer cannot see. */
  @media print {
    font-size: 48pt !important;
    color: #000;
  }
`

/**
 * What the stage says when it has no value: an empty pool, or one that is used up.
 *
 * Set as the app's own voice rather than in the display face. Dressed as a result it
 * was read as one — "All picked" looks like the thing that got picked — and the
 * treatment is the only thing on screen that can say otherwise.
 */
export const Message = styled.p`
  margin: 0;
  max-width: 100%;
  font-size: clamp(15px, 4cqh, 22px);
  font-weight: 500;
  color: var(--dim);
  text-align: center;
  text-wrap: balance;
  user-select: none;

  @media print {
    color: #000;
  }
`
