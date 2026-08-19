/** The longest edge a stored background is allowed to have. */
const MAX_EDGE = 1600
/** Roughly the point where one image would crowd everything else out of localStorage. */
export const MAX_STORED_BYTES = 2_000_000

export class ImageError extends Error {}

/**
 * Turns a chosen file into a data URL small enough to keep in localStorage.
 *
 * A phone photo is several megabytes and localStorage holds about five in total, so
 * the image is drawn into a canvas at a sane size and re-encoded as JPEG rather than
 * being stored as picked.
 */
export async function readBackgroundImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new ImageError('That file is not an image.')

  const source = await loadImage(URL.createObjectURL(file), true)
  const scale = Math.min(1, MAX_EDGE / Math.max(source.width, source.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(source.width * scale))
  canvas.height = Math.max(1, Math.round(source.height * scale))

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new ImageError('This browser could not read that image.')
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)

  // Quality is stepped down rather than fixed, so a large photo still fits instead of
  // being refused outright.
  for (const quality of [0.82, 0.7, 0.55, 0.4]) {
    const url = canvas.toDataURL('image/jpeg', quality)
    if (url.length <= MAX_STORED_BYTES) return url
  }
  throw new ImageError('That image is too large to store. Try a smaller one.')
}

function loadImage(src: string, revoke = false) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      if (revoke) URL.revokeObjectURL(src)
      resolve(img)
    }
    img.onerror = () => {
      if (revoke) URL.revokeObjectURL(src)
      reject(new ImageError('That image could not be read.'))
    }
    img.src = src
  })
}
