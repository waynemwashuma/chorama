/** @import { WebGLBindGroup } from "../webgl/bindgroup.js" */
/** @import { WebGLBindGroupLayout } from "./bindgroup.js" */

export class WebGLPipelineLayout {
  /**
   * @readonly
   * @type {string | undefined}
   */
  label

  /**
   * @readonly
   * @type {readonly WebGLBindGroupLayout[]}
   */
  bindGroupLayouts

  /**
   * @param {WebGLPipelineLayoutDescriptor} descriptor
   */
  constructor({ label, bindGroupLayouts }) {
    this.label = label
    this.bindGroupLayouts = [...bindGroupLayouts]
  }

  /**
   * @param {number} index
   */
  getBindGroupLayout(index) {
    return this.bindGroupLayouts[index]
  }

  /**
   * @param {number} index
   * @param {WebGLBindGroup} bindGroup
   */
  isBindGroupCompatible(index, bindGroup) {
    const layout = this.getBindGroupLayout(index)

    return layout ? layout.compatibleWith(bindGroup.layout) : false
  }
}

/**
 * @typedef WebGLPipelineLayoutDescriptor
 * @property {string} [label]
 * @property {WebGLBindGroupLayout[]} bindGroupLayouts
 */
