import { assertTrue } from "../../utils/index.js"

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
      validateLayoutEntry(entry)
      assertTrue(!this.entryMap.has(entry.binding), `Duplicate bind group layout binding ${entry.binding}`)
      this.entryMap.set(entry.binding, entry)
    }
  }

  /**
   * @param {number} binding
   */
  getEntry(binding) {
    return this.entryMap.get(binding)
  }

  /**
   * @param {WebGLBindGroupLayout} other
   */
  compatibleWith(other) {
    if (this === other) {
      return true
    }

    if (this.entries.length !== other.entries.length) {
      return false
    }

    for (const entry of this.entries) {
      const otherEntry = other.getEntry(entry.binding)

      if (!otherEntry || !layoutEntriesCompatible(entry, otherEntry)) {
        return false
      }
    }

    return true
  }
}

/**
 * @typedef WebGLBindGroupLayoutDescriptor
 * @property {string} [label]
 * @property {WebGLBindGroupLayoutEntry[]} entries
 */

/**
 * @typedef WebGLBindGroupLayoutEntry
 * @property {number} binding
 * @property {string} [name]
 * @property {number} visibility
 * @property {WebGLBufferBindingLayout} [buffer]
 * @property {WebGLSamplerBindingLayout} [sampler]
 * @property {WebGLTextureBindingLayout} [texture]
 */

/**
 * @typedef WebGLBufferBindingLayout
 * @property {"uniform"} [type]
 * @property {boolean} [hasDynamicOffset]
 * @property {number} [minBindingSize]
 */

/**
 * @typedef WebGLSamplerBindingLayout
 * @property {"filtering" | "non-filtering" | "comparison"} [type]
 */

/**
 * @typedef WebGLTextureBindingLayout
 * @property {"float" | "unfilterable-float" | "depth" | "sint" | "uint"} [sampleType]
 * @property {"1d" | "2d" | "2d-array" | "cube" | "cube-array" | "3d"} [viewDimension]
 * @property {boolean} [multisampled]
 */

/**
 * @param {WebGLBindGroupLayoutEntry} entry
 */
function validateLayoutEntry(entry) {
  assertTrue(Number.isInteger(entry.binding) && entry.binding >= 0, `Invalid bind group layout binding ${entry.binding}`)
  assertTrue(Number.isInteger(entry.visibility) && entry.visibility >= 0, `Invalid bind group layout visibility for binding ${entry.binding}`)

  if (
    (entry.buffer !== undefined ? 1 : 0) +
    (entry.sampler !== undefined ? 1 : 0) +
    (entry.texture !== undefined ? 1 : 0) !== 1
  ) {
    throw `Bind group layout binding ${entry.binding} must declare exactly one resource type`
  }
}

/**
 * @param {WebGLBindGroupLayoutEntry} a
 * @param {WebGLBindGroupLayoutEntry} b
 */
function layoutEntriesCompatible(a, b) {
  if (a.binding !== b.binding || a.visibility !== b.visibility || a.name !== b.name) {
    return false
  }

  if (a.buffer !== undefined) {
    return b.buffer !== undefined && bufferLayoutsCompatible(a.buffer, b.buffer)
  }
  if (a.sampler !== undefined) {
    return b.sampler !== undefined && samplerLayoutsCompatible(a.sampler, b.sampler)
  }

  return b.texture !== undefined && textureLayoutsCompatible(a.texture, b.texture)
}

/**
 * @param {WebGLBufferBindingLayout | undefined} a
 * @param {WebGLBufferBindingLayout | undefined} b
 */
function bufferLayoutsCompatible(a, b) {
  return (
    (a?.type ?? "uniform") === (b?.type ?? "uniform") &&
    (a?.hasDynamicOffset ?? false) === (b?.hasDynamicOffset ?? false) &&
    (a?.minBindingSize ?? 0) === (b?.minBindingSize ?? 0)
  )
}

/**
 * @param {WebGLSamplerBindingLayout | undefined} a
 * @param {WebGLSamplerBindingLayout | undefined} b
 */
function samplerLayoutsCompatible(a, b) {
  return (a?.type ?? "filtering") === (b?.type ?? "filtering")
}

/**
 * @param {WebGLTextureBindingLayout | undefined} a
 * @param {WebGLTextureBindingLayout | undefined} b
 */
function textureLayoutsCompatible(a, b) {
  return (
    (a?.sampleType ?? "float") === (b?.sampleType ?? "float") &&
    (a?.viewDimension ?? "2d") === (b?.viewDimension ?? "2d") &&
    (a?.multisampled ?? false) === (b?.multisampled ?? false)
  )
}
