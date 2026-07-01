/**@import { WebGLRenderDevice } from "../../../core/index.js" */
import { Camera } from "../../../objects/index.js"
import { View, Views } from "../../../renderer/index.js"
import { CanvasTarget, ImageRenderTarget } from "../../../rendertarget/index.js"
import { CompareFunction, MeshVertexLayout, Shader } from "../../../core/index.js"
import { CullFace, PrimitiveTopology, TextureFormat } from "../../../constants/index.js"
import { assert } from "../../../utils/index.js"
import { RenderTarget2DPool } from "../RenderTarget2DPool.js"
import { CanvasBlitPipeline } from "../resources/index.js"
import { blitFragment, fullscreenVertex } from "../../../shader/index.js"

export class CanvasBlitNode {
  subgraph() {
    return undefined
  }
  /**
   * @param {import("../../../renderer/graph/index.js").RenderGraphContext} context
   */
  execute(context) {
    const { renderer, renderDevice } = context
    const views = renderer.getResource(Views)
    const targetPool = renderer.getResource(RenderTarget2DPool)
    const pipelineState = renderer.getResource(CanvasBlitPipeline)

    assert(views, "Views resource missing")
    assert(targetPool, "Render target pool resource missing")
    assert(pipelineState, "CanvasBlitPipeline resource missing")

    const actualViews = views.items()
    const pipeline = getCanvasBlitPipeline(renderDevice, renderer, pipelineState)
    const mainTextureInfo = pipeline.uniforms.get("mainTexture")
    const textureUnit = mainTextureInfo?.texture_unit

    assert(mainTextureInfo, "Canvas blit pipeline is missing the mainTexture uniform")
    if (textureUnit === undefined) {
      throw "Canvas blit pipeline is missing a mainTexture texture unit"
    }

    for (let i = 0; i < actualViews.length; i++) {
      const view = /**@type {View} */(actualViews[i])

      if (!(view.object instanceof Camera)) {
        continue
      }

      if (!(view.object.target instanceof CanvasTarget) || !(view.renderTarget instanceof ImageRenderTarget)) {
        continue
      }

      const canvasTarget = /**@type {CanvasTarget} */ (view.object.target)
      const colorSource = view.renderTarget.color[0]

      if (!colorSource) {
        targetPool.recycle(view.renderTarget)
        continue
      }

      const source = renderer.caches.getTexture(renderDevice, colorSource)
      canvasTarget.changed()

      const pass = renderDevice.beginRenderPass({
        width: canvasTarget.width,
        height: canvasTarget.height,
        defaultFramebuffer: true,
        colorAttachments: [{
          loadOp: "load",
          storeOp: "store"
        }],
        viewport: canvasTarget.viewport,
        scissor: canvasTarget.scissor || canvasTarget.viewport
      })

      pass.setPipeline(pipeline)
      renderDevice.context.activeTexture(WebGL2RenderingContext.TEXTURE0 + textureUnit)
      renderDevice.context.bindTexture(source.type, source.inner)
      pass.draw(3)
      pass.end()
      targetPool.recycle(view.renderTarget)
    }
  }
}

/**
 * @param {WebGLRenderDevice} device
 * @param {import("../../../renderer/renderer.js").WebGLRenderer} renderer
 * @param {CanvasBlitPipeline} pipelineState
 */
function getCanvasBlitPipeline(device, renderer, pipelineState) {
  if (pipelineState.pipelineId !== undefined) {
    const pipeline = renderer.caches.getRenderPipeline(pipelineState.pipelineId)
    if (pipeline) {
      return pipeline
    }
    pipelineState.pipelineId = undefined
  }

  /**
   * @type {import("../../../core/index.js").WebGLRenderPipelineDescriptor}
   */
  const descriptor = {
    depthWrite: false,
    depthCompare: CompareFunction.Always,
    cullFace: CullFace.None,
    topology: PrimitiveTopology.Triangles,
    vertexLayout: new MeshVertexLayout([]),
    vertex: new Shader({
      source: fullscreenVertex
    }),
    fragment: {
      source: new Shader({
        source: blitFragment
      }),
      targets: [{
        format: TextureFormat.RGBA8Unorm
      }]
    }
  }

  for (const [name, value] of renderer.defines) {
    descriptor.vertex.defines.set(name, value)
    descriptor.fragment?.source?.defines?.set(name, value)
  }
  for (const [name, value] of renderer.includes) {
    descriptor.vertex.includes.set(name, value)
    descriptor.fragment?.source?.includes?.set(name, value)
  }

  const [pipeline, newId] = renderer.caches.createRenderPipeline(device, descriptor)
  pipelineState.pipelineId = newId
  return pipeline
}
