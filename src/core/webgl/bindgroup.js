/** @import { WebGLBindGroupDescriptor, WebGLBindGroupEntry, WebGLBindGroupLayoutDescriptor, WebGLBindGroupLayoutEntry } from "./descriptors.js" */
import { assert } from "../../utils/index.js"

export class WebGLBindGroupLayout {
  /**
   * @readonly
   * @type {string | undefined}
   */
  label

  /**
   * @readonly
   * @type {readonly WebGLBindGroupLayoutEntry[]}
   */
  entries

  /**
   * @private
   * @type {Map<number, WebGLBindGroupLayoutEntry>}
   */
  entryMap = new Map()

  /**
   * @param {WebGLBindGroupLayoutDescriptor} descriptor
   */
  constructor({ label, entries }) {
    this.label = label
    this.entries = [...entries]

    for (const entry of entries) {
      assert(!this.entryMap.has(entry.binding) ? {} : undefined, `Duplicate bind group layout binding ${entry.binding}`)
      this.entryMap.set(entry.binding, entry)
    }
  }

  /**
   * @param {number} binding
   */
  getEntry(binding) {
    return this.entryMap.get(binding)
  }
}

export class WebGLBindGroup {
  /**
   * @readonly
   * @type {string | undefined}
   */
  label

  /**
   * @readonly
   * @type {WebGLBindGroupLayout}
   */
  layout

  /**
   * @readonly
   * @type {readonly WebGLBindGroupEntry[]}
   */
  entries

  /**
   * @private
   * @type {Map<number, WebGLBindGroupEntry>}
   */
  entryMap = new Map()

  /**
   * @param {WebGLBindGroupDescriptor} descriptor
   */
  constructor({ label, layout, entries }) {
    this.label = label
    this.layout = layout
    this.entries = [...entries]

    for (const entry of entries) {
      assert(!this.entryMap.has(entry.binding) ? {} : undefined, `Duplicate bind group binding ${entry.binding}`)
      this.entryMap.set(entry.binding, entry)
    }
  }

  /**
   * @param {number} binding
   */
  getEntry(binding) {
    return this.entryMap.get(binding)
  }
}
