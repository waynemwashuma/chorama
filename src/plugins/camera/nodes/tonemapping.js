/**@import { WebGLRenderDevice } from "../../../core/index.js" */
import { Camera } from "../../../objects/index.js"
import { View, Views } from "../../../renderer/index.js"
import { CanvasTarget, ImageRenderTarget } from "../../../rendertarget/index.js"
import { CompareFunction, MeshVertexLayout, Shader } from "../../../core/index.js"
import { CullFace, PrimitiveTopology, TextureFormat } from "../../../constants/index.js"
import { assert } from "../../../utils/index.js"
import { fullscreenVertex, tonemappingFragment } from "../../../shader/index.js"
import { RenderTarget2DPool } from "../RenderTarget2DPool.js"
import { TonemappingPipeline } from "../resources/index.js"

export class TonemappingNode {
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
    const pipelineState = renderer.getResource(TonemappingPipeline)

    assert(views, "Views resource missing")
    assert(targetPool, "Render target pool resource missing")
    assert(pipelineState, "TonemappingPipeline resource missing")

    const actualViews = views.items()
    const pipeline = getTonemappingPipeline(renderDevice, renderer, pipelineState)
    const pass = renderDevice.beginRenderPass()
    const mainTextureInfo = pipeline.uniforms.get("mainTexture")
    const textureUnit = mainTextureInfo?.texture_unit

    assert(mainTextureInfo, "Tonemapping pipeline is missing the mainTexture uniform")
    if (textureUnit === undefined) {
      throw "Tonemapping pipeline is missing a mainTexture texture unit"
    }

    pass.setPipeline(pipeline)

    for (let i = 0; i < actualViews.length; i++) {
      const view = /**@type {View} */(actualViews[i])

      if (!(view.object instanceof Camera)) {
        continue
      }

      if (!(view.object.target instanceof CanvasTarget) || !(view.renderTarget instanceof ImageRenderTarget)) {
        continue
      }

      const inputTarget = view.renderTarget
      const colorSource = inputTarget.color[0]

      if (!colorSource) {
        continue
      }

      const outputTarget = targetPool.get({
        width: inputTarget.width,
        height: inputTarget.height,
        color: [TextureFormat.RGBA8Unorm],
        depth: undefined,
      })

      outputTarget.viewport.offset.set(0, 0)
      outputTarget.viewport.size.set(1, 1)
      outputTarget.scissor = undefined

      const framebuffer = renderer.caches.getFrameBuffer(renderDevice, outputTarget)
      const source = renderer.caches.getTexture(renderDevice, colorSource)

      framebuffer.setViewport(
        renderDevice.context,
        outputTarget.viewport,
        outputTarget.scissor || outputTarget.viewport
      )

      renderDevice.context.activeTexture(WebGL2RenderingContext.TEXTURE0 + textureUnit)
      renderDevice.context.bindTexture(source.type, source.inner)
      pass.drawArrays(3)

      view.renderTarget = outputTarget
      targetPool.recycle(inputTarget)
    }

    pass.end()
  }
}

/**
 * @param {WebGLRenderDevice} device
 * @param {import("../../../renderer/renderer.js").WebGLRenderer} renderer
 * @param {TonemappingPipeline} pipelineState
 */
function getTonemappingPipeline(device, renderer, pipelineState) {
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
        source: tonemappingFragment
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
