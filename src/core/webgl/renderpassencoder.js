/** @import { GPUMesh } from "../resources/index.js" */
/** @import { WebGLBindGroup } from "./bindgroup.js" */
import { assert } from "../../utils/index.js"
import { assertTrue } from "../../utils/index.js"

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
   * @private
   * @type {Map<number, WebGLBindGroup>}
   */
  bindGroups = new Map()

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
    retainCompatibleBindGroups(pipeline, this.bindGroups)
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
   * @param {number} index
   * @param {WebGLBindGroup} bindGroup
   */
  setBindGroup(index, bindGroup) {
    assertTrue(Number.isInteger(index) && index >= 0, `Invalid bind group index ${index}`)

    if (this.pipeline) {
      validateBindGroupCompatibility(this.pipeline, index, bindGroup)
      bindGroup.apply(this.context, this.pipeline)
    }

    this.bindGroups.set(index, bindGroup)
  }

  /**
   * @param {GPUMesh} mesh
   */
  draw(mesh) {
    assert(this.pipeline, "No active pipeline set on render pass encoder")
    validateRequiredBindGroups(this.pipeline, this.bindGroups)

    this.context.bindVertexArray(mesh.inner)
    if (mesh.indexType !== undefined) {
      this.context.drawElements(this.pipeline.topology, mesh.count, mesh.indexType, 0)
      return
    }
    this.context.drawArrays(this.pipeline.topology, 0, mesh.count)
  }

  /**
   * Draws a non-indexed primitive stream without binding a mesh.
   * @param {number} count
   * @param {number} [first=0]
   */
  drawArrays(count, first = 0) {
    assert(this.pipeline, "No active pipeline set on render pass encoder")
    validateRequiredBindGroups(this.pipeline, this.bindGroups)

    this.context.bindVertexArray(null)
    this.context.drawArrays(this.pipeline.topology, first, count)
  }

  end() {
    this.pipeline = undefined
    this.bindGroups.clear()
    this.context.bindVertexArray(null)
  }
}

/**
 * @param {import("./renderpipeline.js").WebGLRenderPipeline} pipeline
 * @param {number} index
 * @param {WebGLBindGroup} bindGroup
 */
function validateBindGroupCompatibility(pipeline, index, bindGroup) {
  const expectedLayout = pipeline.layout.getBindGroupLayout(index)

  assert(expectedLayout, `Pipeline does not declare bind group ${index}`)
  assertTrue(expectedLayout.compatibleWith(bindGroup.layout), `Bind group ${index} is not compatible with the active pipeline layout`)
}

/**
 * Keeps only bind groups that still match the active pipeline layout at the same index.
 * @param {import("./renderpipeline.js").WebGLRenderPipeline} pipeline
 * @param {Map<number, WebGLBindGroup>} bindGroups
 */
function retainCompatibleBindGroups(pipeline, bindGroups) {
  for (const [index, bindGroup] of bindGroups) {
    const expectedLayout = pipeline.layout.getBindGroupLayout(index)

    if (!expectedLayout || !expectedLayout.compatibleWith(bindGroup.layout)) {
      bindGroups.delete(index)
    }
  }
}

/**
 * @param {import("./renderpipeline.js").WebGLRenderPipeline} pipeline
 * @param {ReadonlyMap<number, WebGLBindGroup>} bindGroups
 */
function validateRequiredBindGroups(pipeline, bindGroups) {
  for (let i = 0; i < pipeline.layout.bindGroupLayouts.length; i++) {
    const layout = pipeline.layout.bindGroupLayouts[i]

    if (!layout || layout.entries.length === 0) {
      continue
    }

    const bindGroup = bindGroups.get(i)

    assert(bindGroup, `Pipeline requires bind group ${i}`)
  }
}
