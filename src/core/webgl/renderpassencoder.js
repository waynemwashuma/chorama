/** @import { GPUMesh } from "../resources/index.js" */
import { assert } from "../../utils/index.js"

export class WebGLRenderPassEncoder {
  /**
   * @private
   * @type {WebGL2RenderingContext}
   */
  context
  /**
   * @private
   * @type {import("./renderpipeline.js").WebGLRenderPipeline | undefined}
   */
  pipeline

  /**
   * @param {WebGL2RenderingContext} context
   */
  constructor(context) {
    this.context = context
  }

  /**
   * WebGPU-like API: selects the active render pipeline.
   * @param {import("./renderpipeline.js").WebGLRenderPipeline} pipeline
   */
  setPipeline(pipeline) {
    this.pipeline = pipeline
    this.context.useProgram(pipeline.program)

    // culling
    if (pipeline.cullMode) {
      this.context.enable(this.context.CULL_FACE)
      this.context.cullFace(pipeline.cullMode)
    } else {
      this.context.disable(this.context.CULL_FACE)
    }

    // depth
    this.context.depthFunc(pipeline.depthCompare)
    this.context.depthMask(pipeline.depthWrite)

    // blending
    // NOTE: webgl does not have ability to blend differently on
    // different render targets since state is global.
    const target = pipeline.targets[0]
    if (target && target.blend) {
      const { color, alpha } = target.blend

      this.context.enable(this.context.BLEND)
      this.context.blendEquationSeparate(color.operation, alpha.operation)
      this.context.blendFuncSeparate(
        color.source,
        color.destination,
        alpha.source,
        alpha.destination
      )
    } else {
      this.context.disable(this.context.BLEND)
    }
  }

  /**
   * Makeshift bind-group entry point for future expansion.
   * @param {number} _index
   * @param {any} _bindGroup
   */
  setBindGroup(_index, _bindGroup) { }

  /**
   * @param {GPUMesh} mesh
   */
  draw(mesh) {
    assert(this.pipeline, "No active pipeline set on render pass encoder")

    this.context.bindVertexArray(mesh.inner)
    if (mesh.indexType !== undefined) {
      this.context.drawElements(this.pipeline.topology, mesh.count, mesh.indexType, 0)
      return
    }
    this.context.drawArrays(this.pipeline.topology, 0, mesh.count)
  }

  end() {
    this.pipeline = undefined
    this.context.bindVertexArray(null)
  }
}
