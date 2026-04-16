import { OrthographicProjection } from "../../camera/index.js"

export class PCFShadowFilter {
  /**
   * Percentage-closer filtering radius in texels.
   * @type {number}
   */
  radius = 1
}

export class PCSSShadowFilter {
  /**
   * Base filter radius in texels.
   * @type {number}
   */
  radius = 1
  /**
   * Blocker search radius in texels.
   * @type {number}
   */
  searchRadius = 2
  /**
   * Penumbra scale factor.
   * @type {number}
   */
  penumbra = 1
}

export class Shadow {
  /**
   * @type {number}
   */
  bias = 0.001
  /**
   * @type {number}
   */
  normalBias = 0
  /**
   * @type {ShadowFilteringModes}
   */
  filterMode = new PCFShadowFilter()
}
export class OrthographicShadow extends Shadow {
  /**
   * @type {number}
   */
  near = 0.1
  /**
   * @type {number}
   */
  far = 1000
  /**
   * @type {OrthographicProjection}
   */
  projection = new OrthographicProjection()
}

export class SpotLightShadow extends Shadow {
  /**
   * @type {number}
   */
  near = 0.1
}

/**
 * @typedef {PCFShadowFilter | PCSSShadowFilter | undefined} ShadowFilteringModes
 */
