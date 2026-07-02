import { Camera, Object3D } from "../../../objects/index.js"
import { View, Views } from "../../../renderer/index.js"
import { CanvasTarget, ImageRenderTarget } from "../../../rendertarget/index.js"
import { Vector3 } from "../../../math/index.js"
import { assert } from "../../../utils/index.js"
import { Texture2DPool } from "../RenderTarget2DPool.js"
import { TextureFormat } from "../../../constants/index.js"
import { CameraColorTargets } from "../resources/index.js"

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
    const colorTargets = renderer.getResource(CameraColorTargets)

    assert(views, "Views resource missing")
    assert(targetPool, "Render target pool resource missing")
    assert(colorTargets, "Camera color targets resource missing")

    for (let i = 0; i < objects.length; i++) {
      const camera = /**@type {Object3D} */(objects[i])

      if (!(camera instanceof Camera)) {
        continue
      }

      const original = !(camera.target instanceof CanvasTarget)
      const existingColorTarget = colorTargets.get(camera)
      /** @type {import("../../../texture/index.js").Texture | undefined} */
      let colorTarget
      /** @type {import("../../../texture/index.js").Texture | undefined} */
      let depthTexture
      let layer = 0

      if (camera.target instanceof CanvasTarget) {
        const width = camera.target.canvas.width
        const height = camera.target.canvas.height

        colorTarget = targetPool.get({
          width,
          height,
          format: TextureFormat.RGBA16Float
        })
        depthTexture = existingColorTarget?.depthTexture ?? targetPool.get({
          width,
          height,
          format: TextureFormat.Depth24Plus
        })
      } else if (camera.target instanceof ImageRenderTarget) {
        colorTarget = camera.target.color[0]
        depthTexture = camera.target.depthTexture
        layer = camera.target.layer
      } else {
        continue
      }

      const position = new Vector3(
        camera.transform.world.x,
        camera.transform.world.y,
        camera.transform.world.z
      )
      const cameraColorTarget = colorTargets.getOrSet(
        camera,
        colorTarget,
        depthTexture,
        layer,
        original
      )
      cameraColorTarget.depthTexture = depthTexture
      cameraColorTarget.setColor(targetPool, colorTarget, layer, original)
      const cameraView = new View({
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
