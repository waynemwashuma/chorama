/**@import { WebGLRenderPipelineDescriptor } from '../core/index.js' */
/**@import { WebGLAtttributeParams } from '../function.js' */

import { CanvasTarget, ImageRenderTarget, RenderTarget } from "../rendertarget/index.js"
import { Texture } from "../texture/index.js"
import { Attribute, Mesh } from "../mesh/index.js"
import { FrameBuffer, GPUMesh, GPUTexture, MeshVertexLayout, WebGLRenderDevice, WebGLRenderPipeline } from "../core/index.js"
import { UniformBuffers } from "./uniformbuffers.js"
import { BufferType, BufferUsage } from "../constants/others.js"
import { getFramebufferAttachment, mapToIndicesType, mapVertexFormatToWebGL } from "../function.js"
import { assert } from "../utils/index.js"
import { getVertexFormatComponentNumber, getVertexFormatComponentSize } from "../constants/mesh.js"
import { TextureType } from "../constants/texture.js"

export class Caches {
  uniformBuffers = new UniformBuffers()
  /**
   * @type {Map<Mesh, GPUMesh>}
   */
  meshes = new Map()
  /**
   * @type {Map<Texture, GPUTexture>}
   */
  textures = new Map()
  /**
   * @type {WebGLRenderPipeline[]}
   */
  renderpipelines = []

  /**
   * @type {Map<RenderTarget, FrameBuffer>}
   */
  renderTargets = new Map()

  /**
   * @type {MeshVertexLayout[]}
   */
  meshLayouts = []

  /**
   * @param {WebGLRenderDevice} device
   * @param {RenderTarget} target
   * @returns {FrameBuffer}
   */
  getFrameBuffer(device, target) {
    const current = this.renderTargets.get(target)
    if (current) {
      if (!renderTargetChanged(device, this, target, current)) {
        return current
      }
      if (target instanceof CanvasTarget) {
        current.width = target.width
        current.height = target.height
        return current
      }
    }

    // Flush out any change detection that happened when the target was created
    target.changed()

    if (target instanceof ImageRenderTarget) {
      const framebuffer = device.context.createFramebuffer()
      const colorAttachments = []
      const drawBuffers = target.color.map((texture, offset) => {
        if (texture) {
          return WebGL2RenderingContext.COLOR_ATTACHMENT0 + offset
        }
        return WebGL2RenderingContext.NONE
      })
      let depthBuffer

      device.context.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, framebuffer)

      for (let i = 0; i < target.color.length; i++) {
        const color = /**@type {Texture}*/ (target.color[i])
        const texture = this.getTexture(device, color)
        bindTextureToAttachment(device, texture, i, target.layer)
        colorAttachments[i] = texture
      }

      if (target.depthTexture) {
        const texture = this.getTexture(device, target.depthTexture)

        bindTextureToAttachment(device, texture, 0, target.layer)
        depthBuffer = texture
      }

      const newTarget = new FrameBuffer(
        framebuffer,
        colorAttachments,
        drawBuffers,
        depthBuffer,
        target.width,
        target.height
      )

      // TODO: Dispose off the previous frame buffers
      this.renderTargets.set(target, newTarget)
      return newTarget
    } else if (target instanceof CanvasTarget) {
      const frameBuffer = new FrameBuffer(
        null,
        [],
        [WebGL2RenderingContext.BACK],
        undefined,
        target.width,
        target.height
      )

      this.renderTargets.set(target, frameBuffer)
      return frameBuffer
    } else {
      throw 'Unsupported render target'
    }
  }

  /**
   * @param {WebGLRenderDevice} device
   * @param {Mesh} mesh
   * @param {ReadonlyMap<string, Attribute>} attributes
   */
  getMesh(device, mesh, attributes) {
    const gpuMesh = this.meshes.get(mesh)
    if (gpuMesh && !mesh.changed) {
      return gpuMesh
    }

    const [layout, layoutId] = this.getLayout(mesh, attributes)
    const vao = device.context.createVertexArray()
    const newMesh = new GPUMesh(vao, 0, layoutId)

    // Flush out any change detection that happened when the mesh was creates
    mesh.changed
    // TODO: Stop leaking memory, delete old gpu buffers
    device.context.bindVertexArray(vao)
    updateVAO(device, layout, mesh, newMesh)
    this.meshes.set(mesh, newMesh)

    return newMesh
  }

  /**
   * @param {Mesh} mesh
   * @param {ReadonlyMap<string, Attribute>} attributes
   * @returns {[MeshVertexLayout, number]}
   */
  getLayout(mesh, attributes) {
    for (let i = 0; i < this.meshLayouts.length; i++) {
      const layout = /**@type {MeshVertexLayout} */(this.meshLayouts[i])
      if (layout.compatibleWithMesh(mesh)) {
        return [layout, i]
      }
    }
    const layout = MeshVertexLayout.fromMesh(mesh, attributes)
    const newId = this.meshLayouts.length

    this.meshLayouts.push(layout)

    return [layout, newId]
  }

  /**
   * @param {WebGLRenderDevice} device
   * @param {Texture} texture
   * @returns {GPUTexture}
   */
  getTexture(device, texture) {
    const gpuTexture = this.textures.get(texture)

    if (gpuTexture) {
      if (texture.changed) {
        if (
          texture.type === gpuTexture.type &&
          texture.format === gpuTexture.actualFormat &&
          texture.width === gpuTexture.width &&
          texture.height === gpuTexture.height &&
          texture.depth === gpuTexture.depth
        ) {
          // non-structural change, no need to create new gpu texture

          if (texture.data) {
            device.writeTexture({
              texture: gpuTexture,
              data: texture.data
            })
          }
          return gpuTexture
        }
      } else {
        return gpuTexture
      }
    }

    // TODO: Stop leaking memory, delete old gpu textures
    const newTex = device.createTexture({
      type: texture.type,
      format: texture.format,
      width: texture.width,
      height: texture.height,
      depth: texture.depth,

    })

    if (texture.data) {
      device.writeTexture({
        texture: newTex,
        data: texture.data
      })
    }

    if (texture.generateMipmaps) {
      device.context.generateMipmap(texture.type)
    }

    // Flush out any change detection that happened when the image was creates
    texture.changed
    this.textures.set(texture, newTex)
    return newTex
  }

  /**
   * @param {WebGLRenderDevice} device
   * @param {WebGLRenderPipelineDescriptor} descriptor
   * @returns {[WebGLRenderPipeline, number]}
   */
  createRenderPipeline(device, descriptor) {
    const id = this.renderpipelines.length
    const pipeline = device.createRenderPipeline(descriptor)

    for (const [name, uboLayout] of pipeline.uniformBlocks) {
      const ubo = this.uniformBuffers.getorSet(device, name, uboLayout)
      const index = device.context.getUniformBlockIndex(pipeline.program, name)

      device.context.uniformBlockBinding(pipeline.program, index, ubo.point)
    }
    this.renderpipelines[id] = pipeline
    return [pipeline, id]
  }

  /**
   * @param {number} id
   * @returns {WebGLRenderPipeline | undefined}
   */
  getRenderPipeline(id) {
    return this.renderpipelines[id]
  }

  /**
   * @param {number} id
   */
  getMeshVertexLayout(id) {
    return this.meshLayouts[id]
  }
}

/**
 * @param {WebGLRenderDevice} device
 * @param {MeshVertexLayout} layout
 * @param {Mesh} mesh
 * @param {GPUMesh} gpuMesh
 */
function updateVAO(device, layout, mesh, gpuMesh) {
  const { indices, attributes } = mesh
  let attrCount

  // TODO: Delete the old buffers if present, probably leaking memory here
  if (indices !== undefined) {
    const buffer = device.createBuffer({
      type: BufferType.ElementArray,
      usage: BufferUsage.Static,
      size: indices.byteLength
    })
    device.writeBuffer(buffer, indices)
    gpuMesh.indexType = mapToIndicesType(indices)
    gpuMesh.indexBuffer = buffer
  }

  for (const vertexLayout of layout.layouts) {
    const attribute = vertexLayout.attributes[0]

    assert(attribute, "The mesh vertex layout is incorrectly set up for the provided mesh.")

    const data = attributes.get(attribute.name)

    assert(data, `The provided mesh does not have the vertex attribute ${attribute.name}`)

    // This only works for separate buffers for each vertex attribute.
    const buffer = device.createBuffer({
      type: BufferType.Array,
      size: data.byteLength,
      usage: BufferUsage.Static
    })
    const params = mapVertexFormatToWebGL(attribute.format)
    const count = data.byteLength / (getVertexFormatComponentSize(attribute.format) * getVertexFormatComponentNumber(attribute.format))

    device.writeBuffer(buffer, data)
    setVertexAttribute(device.context, attribute.id, params)
    gpuMesh.attributeBuffers.push(buffer)

    if (attrCount) {
      if (count < attrCount) {
        attrCount = count
      }
    } else {
      attrCount = count
    }
  }

  if (indices) {
    gpuMesh.count = indices.length
  } else if (attrCount !== undefined) {
    gpuMesh.count = attrCount
  } else {
    gpuMesh.count = 0
  }
}

/**
 * @param {WebGL2RenderingContext} context
 * @param {number} index
 * @param {WebGLAtttributeParams} params
 * @param {number} [stride = 0]
 * @param {number} [offset = 0]
 */
function setVertexAttribute(context, index, params, stride = 0, offset = 0) {
  const { type, size, normalized } = params
  context.enableVertexAttribArray(index)
  switch (type) {
    case WebGL2RenderingContext.FLOAT:
      context.vertexAttribPointer(index, size, type, normalized, stride, offset);
      break;
    case WebGL2RenderingContext.BYTE:
    case WebGL2RenderingContext.UNSIGNED_BYTE:
    case WebGL2RenderingContext.SHORT:
    case WebGL2RenderingContext.UNSIGNED_SHORT:
    case WebGL2RenderingContext.INT:
    case WebGL2RenderingContext.UNSIGNED_INT:
      if (normalized) {
        context.vertexAttribPointer(index, size, type, normalized, stride, offset);
      } else {
        context.vertexAttribIPointer(index, size, type, stride, offset);
      }
      break;
    default:
      throw new Error(`Unsupported GlDataType: ${type.toString()}`);
  }
}

/**
 * @param {WebGLRenderDevice} device
 * @param {GPUTexture} gpuTexture
 * @param {number} offset
 * @param {number} layer
 */
function bindTextureToAttachment(device, gpuTexture, offset, layer) {
  const attachment = getFramebufferAttachment(gpuTexture.actualFormat) + offset
  switch (gpuTexture.type) {
    case TextureType.Texture2D:
      device.context.framebufferTexture2D(
        WebGL2RenderingContext.FRAMEBUFFER,
        attachment,
        WebGL2RenderingContext.TEXTURE_2D,
        gpuTexture.inner,
        0
      )
      break;
    case TextureType.Texture2DArray:
      device.context.framebufferTextureLayer(
        WebGL2RenderingContext.FRAMEBUFFER,
        attachment,
        gpuTexture.inner,
        0,
        layer
      )
      break;
    default:
      break;
  }
}

/**
 * @param {WebGLRenderDevice} device
 * @param {Caches} caches
 * @param {RenderTarget} target
 * @param {FrameBuffer} frameBuffer
 */
function renderTargetChanged(device, caches, target, frameBuffer) {
  if (target instanceof ImageRenderTarget) {
    const colorLength = Math.max(target.color.length, frameBuffer.colorAttachments.length)
    for (let i = 0; i < colorLength; i++) {
      const texture = target.color[i]
      const attachment = frameBuffer.colorAttachments[i]
      if (texture) {
        const current = caches.getTexture(device, texture)

        if (current !== attachment) {
          return true
        }
      } else {
        if (attachment) {
          return true
        }
      }
    }

    if (target.depthTexture) {
      const current = caches.getTexture(device, target.depthTexture)

      if (current !== frameBuffer.depthBuffer) {
        return true
      }
    } else {
      if (frameBuffer.depthBuffer && !target.depth) {
        return true
      }
    }
  }

  return target.changed()
}
