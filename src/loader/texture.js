/** @import { TextureSettings } from '../texture/index.js' */

import { TextureFormat, TextureType, getTextureFormatSize } from '../constants/index.js';
import { Texture } from '../texture/index.js';
import { assert } from '../utils/index.js';
import { Loader, OnAssetLoadedStrategy } from './loader.js';

/**
 * @extends {Loader<Texture,TextureLoadSettings>}
 */
export class TextureLoader extends Loader {

  constructor() {
    super(Texture)
    this.strategy = OnAssetLoadedStrategy.Original
  }

  /**
   * @override
   * @param {ArrayBuffer[]} buffers
   * @param {Texture} destination
   * @param {{ mimeType?: string }} [settings]
   */
  async parse(buffers, destination, settings = {}) {
    let width = 0, height = 0
    const data = buffers.map(async (buffer) => {
      const blob = new Blob(
        [buffer],
        settings.mimeType ? { type: settings.mimeType } : undefined
      )
      const bitmap = await createImageBitmap(blob)
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
      const ctx = canvas.getContext('2d')

      assert(ctx, "Could not sreate context to load image.")
      ctx.drawImage(bitmap, 0, 0)
      width = bitmap.width
      height = bitmap.height

      return ctx.getImageData(0, 0, bitmap.width, bitmap.height, {
        colorSpace: "srgb"
      }).data.buffer
    })
    const textureFormat = TextureFormat.RGBA8Unorm
    const images = await Promise.all(data)
    const depth = images.length
    const sliceSize = getTextureFormatSize(textureFormat) * width * height
    const buffer = new ArrayBuffer(
      sliceSize * depth
    )
    images.forEach((image, i) => {
      const sourceView = new Uint8Array(image)
      const destView = new Uint8Array(buffer, sliceSize * i, sliceSize)
      destView.set(sourceView)
    })
    destination.data = buffer
    destination.format = textureFormat,
    destination.width = width
    destination.height = height
    destination.depth = depth
  }

  /**
   * @override
   * @param {TextureLoadSettings} settings
   */
  default(settings) {
    const pixel = new Uint8Array(
      settings.paths.flatMap(()=>[255, 0, 255, 255])
    )
    const texture = new Texture({
      ...(settings.textureSettings || {}),
      data: pixel.buffer,
      type: settings.type || TextureType.Texture2D,
      width: 1,
      height: 1,
      depth: settings.paths.length
    })

    return texture
  }
}

/**
 * @typedef TextureLoadSettings
 * @property {string[]} paths
 * @property {TextureType} [type]
 * @property {string} [mimeType]
 * @property {TextureSettings} [textureSettings]
 */
