/** @import { Camera } from "../../../objects/index.js" */
/** @import { Texture } from "../../../texture/index.js" */
/** @import { Texture2DPool } from "../RenderTarget2DPool.js" */

export class CameraColorTargets {
  /**
   * @type {Map<Camera, CameraColorTarget>}
   */
  targets = new Map()

  /**
   * @param {Camera} camera
   * @param {Texture | undefined} target
   * @param {Texture | undefined} depthTexture
   * @param {number} layer
   * @param {boolean} original
   */
  getOrSet(camera, target, depthTexture, layer = 0, original = false) {
    const existing = this.targets.get(camera)
    if (existing) {
      return existing
    }

    const cameraColorTarget = new CameraColorTarget(target, depthTexture, layer, original)
    this.targets.set(camera, cameraColorTarget)
    return cameraColorTarget
  }

  /**
   * @param {Camera} camera
   * @returns {CameraColorTarget | undefined}
   */
  get(camera) {
    return this.targets.get(camera)
  }
}

export class CameraColorTarget {
  /**
   * @type {Texture | undefined}
   */
  target

  /**
   * @type {Texture | undefined}
   */
  depthTexture

  /**
   * @type {number}
   */
  layer

  /**
   * True when the target is the camera's original color target.
   * @type {boolean}
   */
  original

  /**
   * @param {Texture | undefined} target
   * @param {Texture | undefined} depthTexture
   * @param {number} layer
   * @param {boolean} original
   */
  constructor(target, depthTexture, layer, original) {
    this.target = target
    this.depthTexture = depthTexture
    this.layer = layer
    this.original = original
  }

  /**
   * Replaces the tracked color target, recycling the previous temporary color.
   * @param {Texture2DPool} targetPool
   * @param {Texture | undefined} target
   * @param {number} layer
   * @param {boolean} original
   */
  setColor(targetPool, target, layer = 0, original = false) {
    const previous = this.target
    const previousOriginal = this.original

    this.target = target
    this.layer = layer
    this.original = original

    if (previous && previous !== target && !previousOriginal) {
      targetPool.recycle(previous)
    }
  }
}
