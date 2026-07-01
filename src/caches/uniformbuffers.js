/** @import { WebGLRenderDevice } from "../core/index.js" */
/** @import { GPUBuffer } from "../core/resources/index.js" */
import { BufferType, BufferUsage } from "../constants/index.js"
import { UniformBufferLayout } from "../core/layouts/uniformbuffer.js"

export class UniformBufferPointAllocator {
  number = 0

  reserve() {
    const id = this.number
    this.number++

    return id
  }
}

export class UniformBuffers {
  /**
   * @type {Map<string,UniformBuffer>}
   */
  list = new Map()

  allocator = new UniformBufferPointAllocator()

  /**
   * @param {WebGLRenderDevice} device
   * @param {string} name
   * @param {UniformBufferLayout} layout
   * @returns {UniformBuffer}
   */
  set(device, name, layout) {
    const index = this.allocator.reserve()
    return this.setAtPoint(device, name, index, layout)
  }

  /**
   * @param {WebGLRenderDevice} device
   * @param {string} name
   * @param {number} index
   * @param {UniformBufferLayout} layout
   * @returns {UniformBuffer}
   */
  setAtPoint(device, name, index, layout) {
    const buffer = device.createBuffer({
      type: BufferType.Uniform,
      usage: BufferUsage.Dynamic,
      size: layout.size
    })
    const ubo = new UniformBuffer(device, index, buffer)
    this.list.set(name, ubo)

    return ubo
  }

  /**
   * @param {string} name
   */
  get(name) {
    return this.list.get(name)
  }

  /**
   * @param {WebGLRenderDevice} device
   * @param {string} name
   * @param {UniformBufferLayout} layout
   * @returns {UniformBuffer}
   */
  getorSet(device, name, layout) {
    const ubo = this.get(name)

    if (ubo) {
      if (ubo.size >= layout.size) {
        return ubo
      }

      // TODO: Delete the old buffer, we are leaking gpu memory here
      return this.setAtPoint(device, name, ubo.point, layout)
    }

    return this.set(device, name, layout)
  }
}

export class UniformBuffer {
  /**
   * @readonly
   * @type {number}
   */
  point

  /**
   * @readonly
   * @type {GPUBuffer}
   */
  buffer

  /**
   * @readonly
   * @type {number}
   */
  size

  /**
   * @param {WebGLRenderDevice} device
   * @param {number} point
   * @param {GPUBuffer} buffer
   */
  constructor(device, point, buffer) {
    this.point = point
    this.buffer = buffer
    this.size = buffer.size

    device.context.bindBufferBase(buffer.type, point, buffer.inner)
  }

  /**
   * @param {WebGL2RenderingContext} gl
   * @param {ArrayBuffer} data
   */
  update(gl, data) {
    gl.bindBuffer(this.buffer.type, this.buffer.inner)
    gl.bufferSubData(this.buffer.type, 0, data)
    gl.bindBuffer(this.buffer.type, null)
    return this
  }
}
