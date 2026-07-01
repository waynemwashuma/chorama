import { Camera, Object3D } from "../../../objects/index.js"
import { View, Views } from "../../../renderer/index.js"
import { CanvasTarget, ImageRenderTarget } from "../../../rendertarget/index.js"
import { Vector3 } from "../../../math/index.js"
import { assert } from "../../../utils/index.js"
import { Texture2DPool } from "../RenderTarget2DPool.js"
import { TextureFormat } from "../../../constants/index.js"

export class CameraViewNode {
  subgraph() {
    return undefined
  }

  /**
   * @param {import("../../../renderer/graph/index.js").RenderGraphContext} context
   */
  execute(context) {
    const { objects, renderer } = context
    const views = renderer.getResource(Views)
    const targetPool = renderer.getResource(Texture2DPool)

    assert(views, "Views resource missing")
    assert(targetPool, "Render target pool resource missing")

    for (let i = 0; i < objects.length; i++) {
      const camera = /**@type {Object3D} */(objects[i])

      if (!(camera instanceof Camera)) {
        continue
      }

      const position = new Vector3(
        camera.transform.world.x,
        camera.transform.world.y,
        camera.transform.world.z
      )
      const cameraView = new View({
        renderTarget: getTarget(camera, targetPool),
        near: camera.near,
        far: camera.far,
        projection: camera.projection.asProjectionMatrix(camera.near, camera.far),
        view: camera.view,
        position,
        tag: Camera.name,
        object: camera,
        renderMask: camera.renderMask
      })

      views.push(cameraView)
    }
  }
}

/**
 * @param {Camera} camera
 * @param {Texture2DPool} pool
 */
function getTarget(camera, pool) {
  if (camera.target instanceof CanvasTarget) {
    const width = camera.target.canvas.width
    const height = camera.target.canvas.height
    const color = pool.get({
      width,
      height,
      format: TextureFormat.RGBA16Float
    })
    const depthTexture = pool.get({
      width,
      height,
      format: TextureFormat.Depth24Plus
    })

    return new ImageRenderTarget({
      width,
      height,
      color: [color],
      depthTexture
    })
  }

  return camera.target
}
