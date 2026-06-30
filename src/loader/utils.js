/**
 * @param {AllowSharedBufferSource} buffer
 */
export function arrayBufferToJSON(buffer) {
  const decoder = new TextDecoder('utf-8');
  const jsonString = decoder.decode(buffer);
  return JSON.parse(jsonString);
}

/**
 * @param {AllowSharedBufferSource} buffer
 */
export function arrayBufferToText(buffer) {
  const decoder = new TextDecoder('utf-8')
  return decoder.decode(buffer);
}

/**
 * Flips RGBA pixel data horizontally and/or vertically.
 * @param {ArrayBuffer} buffer
 * @param {number} width
 * @param {number} height
 * @param {number} pixelSize
 * @param {{ flipX?: boolean, flipY?: boolean }} [settings]
 * @returns {ArrayBuffer}
 */
export function flipImageData(
  buffer,
  width,
  height,
  pixelSize,
  { flipX = false, flipY = false } = {}
) {
  if (!flipX && !flipY) {
    return buffer
  }

  const source = new Uint8Array(buffer)
  const target = new Uint8Array(source.length)
  const rowSize = width * pixelSize

  for (let y = 0; y < height; y++) {
    const sourceY = flipY ? height - 1 - y : y
    const targetRowOffset = y * rowSize
    const sourceRowOffset = sourceY * rowSize

    for (let x = 0; x < width; x++) {
      const sourceX = flipX ? width - 1 - x : x
      const sourceOffset = sourceRowOffset + sourceX * pixelSize
      const targetOffset = targetRowOffset + x * pixelSize

      for (let i = 0; i < pixelSize; i++) {
        const value = source[sourceOffset + i]
        target[targetOffset + i] = value === undefined ? 0 : value
      }
    }
  }

  return target.buffer
}
