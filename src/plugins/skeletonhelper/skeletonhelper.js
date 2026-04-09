/**@import { WebGLRenderPipelineDescriptor } from '../../core/index.js' */
import { CompareFunction, MeshVertexLayout, Shader, WebGLRenderDevice } from "../../core/index.js";
import { Affine3 } from "../../math/index.js";
import { PrimitiveTopology, TextureFormat } from "../../constants/index.js";
import { Bone3D, Object3D, SkeletonHelper } from "../../objects/index.js";
import { Plugin, WebGLRenderer } from "../../renderer/index.js";
import { skeletonFragment, skeletonVertex } from "../../shader/index.js";
import { Texture } from "../../texture/index.js";

export class SkeletonHelperPlugin extends Plugin {

  /**
   * @override
   */
  preprocess() { }

  /**
   * @type {number | undefined}
   */
  pipelineId
  /**
   * @param {Object3D} object
   * @param {WebGLRenderDevice} device
   * @param {WebGLRenderer} renderer
   */
  renderObject3D(object, device, renderer) {
    if (!(object instanceof SkeletonHelper) || !object.skinnedMesh.skin) {
      return
    }
    const { caches } = renderer
    const { bones, boneTexture } = object.skinnedMesh.skin
    const pipeline = this.getRenderPipeline(device, renderer)
    const transformsInfo = pipeline.uniforms.get("transforms")
    const modelInfo = pipeline.uniforms.get("model")
    const parentInfo = pipeline.uniforms.get("parent_index")
    const childInfo = pipeline.uniforms.get("child_index")
    const pass = device.beginRenderPass()
    pass.setPipeline(pipeline)

    if (
      !transformsInfo || transformsInfo.texture_unit === undefined ||
      !modelInfo || !parentInfo || !childInfo) {
      console.warn("uniforms are not set up correctly in shader")
      return
    }

    updateDataTexture(boneTexture, bones.map((bone) => bone.transform.world))

    const transformsTexture = caches.getTexture(device, boneTexture)


    device.context.activeTexture(WebGL2RenderingContext.TEXTURE0 + transformsInfo.texture_unit)
    device.context.bindTexture(boneTexture.type, transformsTexture.inner)

    device.context.uniformMatrix4fv(modelInfo.location, false, [...Affine3.toMatrix4(object.skinnedMesh.transform.world)])
    device.context.bindVertexArray(null)

    object.rootBone.traverseBFS((parent) => {
      if (parent instanceof Bone3D) {
        for (let i = 0; i < parent.children.length; i++) {
          const child = parent.children[i]
          if (child instanceof Bone3D) {
            const childIndex = child.index
            const parentIndex = parent.index
            device.context.uniform1ui(parentInfo.location, parentIndex)
            device.context.uniform1ui(childInfo.location, childIndex)
            device.context.drawArrays(PrimitiveTopology.Lines, 0, 2)
          }
        }
      }
      return true
    })
    pass.end()
  }

  /**
 * @param {WebGLRenderDevice} device
 * @param {WebGLRenderer} renderer
 */
  getRenderPipeline(device, renderer) {
    const { caches, includes, defines: globalDefines } = renderer
    if (this.pipelineId) {
      const pipeline = caches.getRenderPipeline(this.pipelineId)

      if (pipeline) {
        return pipeline
      }
    }

    /**
     * @type {WebGLRenderPipelineDescriptor}
     */
    const descriptor = {
      depthWrite: false,
      depthCompare: CompareFunction.Always,
      topology: PrimitiveTopology.Lines,
      vertexLayout: new MeshVertexLayout([]),
      vertex: new Shader({
        source: skeletonVertex
      }),
      fragment: {
        source: new Shader({
          source: skeletonFragment
        }),
        targets: [{
          format: TextureFormat.RGBA8Unorm
        }]
      }
    }

    for (const [name, value] of globalDefines) {
      descriptor.vertex.defines.set(name, value)
      descriptor.fragment?.source?.defines?.set(name, value)
    }
    for (const [name, value] of includes) {
      descriptor.vertex.includes.set(name, value)
      descriptor.fragment?.source?.includes?.set(name, value)
    }
    const [newRenderPipeline, newId] = caches.createRenderPipeline(device, descriptor)

    this.pipelineId = newId
    return newRenderPipeline
  }
}

// NOTE: This could be expanded to pack numbers, vectors, matrices and affines
/**
 * @param {Texture} texture
 * @param {Affine3[]} items
 */
function updateDataTexture(texture, items) {
  const data = new Float32Array(items.length * 16)

  for (let i = 0; i < items.length; i++) {
    const offset = i * 16
    const world = /**@type {Affine3} */(items[i])

    data[offset + 0] = world.a
    data[offset + 1] = world.b
    data[offset + 2] = world.c
    data[offset + 3] = 0
    data[offset + 4] = world.d
    data[offset + 5] = world.e
    data[offset + 6] = world.f
    data[offset + 7] = 0
    data[offset + 8] = world.g
    data[offset + 9] = world.h
    data[offset + 10] = world.i
    data[offset + 11] = 0
    data[offset + 12] = world.x
    data[offset + 13] = world.y
    data[offset + 14] = world.z
    data[offset + 15] = 1
  }

  // TODO: Use the entire dimensions of the texture to pack values
  texture.width = 4
  texture.height = items.length
  texture.data = data.buffer
}
