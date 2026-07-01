import { Camera } from "../../../objects/index.js"
import { RenderItem, Views } from "../../../renderer/index.js"
import { assert } from "../../../utils/index.js"
import { Affine3 } from "../../../math/index.js"

/**
 * @param {import("../../../renderer/index.js").View} view
 * @param {import("../../../core/index.js").WebGLRenderDevice} device
 * @param {import("../../../renderer/renderer.js").WebGLRenderer} renderer
 */
function renderItems(view, device, renderer) {
  const { renderStage, renderTarget } = view
  const opaquePhase = renderStage.opaque

  const context = device.context
  const caches = renderer.caches
  const { clearColor, clearDepth, clearStencil, viewport, scissor } = renderTarget

  const framebuffer = caches.getFrameBuffer(device, renderTarget)
  framebuffer.setViewport(context, viewport, scissor || viewport)
  framebuffer.clear(context, clearColor, clearDepth, clearStencil)

  if (!opaquePhase) {
    return
  }

  const pass = device.beginRenderPass()
  for (let i = 0; i < opaquePhase.length; i++) {
    // SAFETY: List is dense
    const { pipelineId, mesh, bindGroup, transform } = /**@type {RenderItem}*/(opaquePhase[i])
    const pipeline = caches.getRenderPipeline(pipelineId)

    if (!pipeline) {
      continue
    }

    const modelInfo = pipeline.uniforms.get("model")
    const transformMatrix = Affine3.toMatrix4(transform)

    pass.setPipeline(pipeline)

    if (modelInfo) {
      context.uniformMatrix4fv(modelInfo.location, false, new Float32Array(transformMatrix))
    }

    if (bindGroup) {
      pass.setBindGroup(0, bindGroup)
    }
    pass.draw(mesh)
  }
  pass.end()
}

export class CameraOpaquePassNode {
  subgraph() {
    return undefined
  }

  /**
   * @param {import("../../../renderer/graph/index.js").RenderGraphContext} context
   */
  execute(context) {
    const { renderer, renderDevice } = context
    const views = renderer.getResource(Views)

    assert(views, "Views resource missing")

    for (const view of views.items()) {
      if (view.tag !== Camera.name) {
        continue
      }

      renderer.updateUBO(renderDevice.context, view.getData())
      renderItems(view, renderDevice, renderer)
    }
  }
}
