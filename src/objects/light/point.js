import { Color, Vector3 } from '../../math/index.js'
import { Object3D } from '../object3d.js'
import { SpotLightShadow } from './shadow/index.js'

export class PointLight extends Object3D {
  color = new Color()
  radius = 1.0
  decay = 2
  intensity = 1.0

  /**
   * @type {SpotLightShadow | undefined}
   */
  shadow

  pack() {
    const worldPosition = new Vector3(
      this.transform.world.x,
      this.transform.world.y,
      this.transform.world.z
    )
    return [
      ...this.color,
      ...worldPosition,
      this.intensity,
      Math.max(0, this.radius),
      this.decay,
      0,
      0
    ]
  }
}