/** @import { WebGLBindGroupDescriptor, WebGLBindGroupEntry } from "./descriptors.js" */
/** @import { WebGLBindGroupLayout, WebGLBindGroupLayoutEntry } from "../layouts/bindgroup.js" */
import { BufferType, TextureType } from "../../constants/index.js"
import { GPUBuffer, GPUTexture } from "../resources/index.js"
import { assert } from "../../utils/index.js"
import { assertTrue } from "../../utils/index.js"

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
      assertTrue(Number.isInteger(entry.binding) && entry.binding >= 0, `Invalid bind group binding ${entry.binding}`)
      assertTrue(!this.entryMap.has(entry.binding), `Duplicate bind group binding ${entry.binding}`)
      const layoutEntry = layout.getEntry(entry.binding)

      assert(layoutEntry, `Bind group entry ${entry.binding} is not declared in the layout`)
      validateBindGroupResource(entry, layoutEntry)
      this.entryMap.set(entry.binding, entry)
    }

    for (const layoutEntry of layout.entries) {
      assertTrue(this.entryMap.has(layoutEntry.binding), `Bind group is missing binding ${layoutEntry.binding}`)
    }
  }

  /**
   * @param {number} binding
   */
  getEntry(binding) {
    return this.entryMap.get(binding)
  }
}

/**
 * @param {WebGLBindGroupEntry} entry
 * @param {WebGLBindGroupLayoutEntry} layoutEntry
 */
function validateBindGroupResource(entry, layoutEntry) {
  if (layoutEntry.buffer !== undefined) {
    validateBufferResource(entry.resource, layoutEntry)
    return
  }

  if (layoutEntry.texture !== undefined) {
    validateTextureResource(entry.resource, layoutEntry)
    return
  }

  validateSamplerResource(entry.resource, layoutEntry)
}

/**
 * @param {unknown} resource
 * @param {WebGLBindGroupLayoutEntry} layoutEntry
 */
function validateBufferResource(resource, layoutEntry) {
  const buffer = getBufferResource(resource)
  const layout = layoutEntry.buffer

  if (!(buffer instanceof GPUBuffer)) {
    throw `Bind group binding ${layoutEntry.binding} expects a GPUBuffer resource`
  }

  if ((layout?.type ?? "uniform") === "uniform") {
    assertTrue(buffer.type === BufferType.Uniform, `Bind group binding ${layoutEntry.binding} expects a uniform buffer`)
  }

  const offset = getOptionalNumber(resource, "offset") ?? 0
  const size = getOptionalNumber(resource, "size") ?? (buffer.size - offset)

  assertTrue(offset >= 0 && Number.isInteger(offset), `Bind group binding ${layoutEntry.binding} has an invalid buffer offset`)
  assertTrue(size >= 0 && Number.isInteger(size), `Bind group binding ${layoutEntry.binding} has an invalid buffer size`)
  assertTrue(offset + size <= buffer.size, `Bind group binding ${layoutEntry.binding} range exceeds the buffer size`)

  if (layout?.minBindingSize !== undefined) {
    assertTrue(size >= layout.minBindingSize, `Bind group binding ${layoutEntry.binding} is smaller than the layout minimum size`)
  }
}

/**
 * @param {unknown} resource
 */
function getBufferResource(resource) {
  if (resource instanceof GPUBuffer) {
    return resource
  }

  const buffer = isObject(resource) ? resource["buffer"] : undefined
  return buffer instanceof GPUBuffer ? buffer : undefined
}

/**
 * @param {unknown} resource
 * @param {WebGLBindGroupLayoutEntry} layoutEntry
 */
function validateTextureResource(resource, layoutEntry) {
  const texture = getTextureResource(resource)

  if (!(texture instanceof GPUTexture)) {
    throw `Bind group binding ${layoutEntry.binding} expects a GPUTexture resource`
  }

  assertTrue(textureDimensionMatches(texture, layoutEntry.texture), `Bind group binding ${layoutEntry.binding} texture dimension does not match the layout`)
}

/**
 * @param {unknown} resource
 */
function getTextureResource(resource) {
  if (resource instanceof GPUTexture) {
    return resource
  }

  const texture = isObject(resource) ? resource["texture"] : undefined
  return texture instanceof GPUTexture ? texture : undefined
}

/**
 * @param {GPUTexture} texture
 * @param {import("../layouts/bindgroup.js").WebGLTextureBindingLayout | undefined} layout
 */
function textureDimensionMatches(texture, layout) {
  switch (layout?.viewDimension ?? "2d") {
    case "2d":
      return texture.type === TextureType.Texture2D
    case "2d-array":
      return texture.type === TextureType.Texture2DArray
    case "cube":
      return texture.type === TextureType.TextureCubeMap
    case "3d":
      return texture.type === TextureType.Texture3D
    default:
      return false
  }
}

/**
 * @param {unknown} resource
 * @param {WebGLBindGroupLayoutEntry} layoutEntry
 */
function validateSamplerResource(resource, layoutEntry) {
  assertTrue(isObject(resource), `Bind group binding ${layoutEntry.binding} expects a sampler resource`)
}

/**
 * @param {unknown} value
 * @param {string} key
 */
function getOptionalNumber(value, key) {
  if (!isObject(value)) {
    return undefined
  }

  const item = value[key]
  return typeof item === "number" ? item : undefined
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isObject(value) {
  return typeof value === "object" && value !== null
}
