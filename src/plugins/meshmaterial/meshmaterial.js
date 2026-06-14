/**@import { Brand } from '../../utils/index.js' */
/**@import { Defaults } from '../../renderer/index.js' */
/**@import { GPUTexture, WebGLRenderPipeline, WebGLRenderPipelineDescriptor } from '../../core/index.js' */
import { assert } from '../../utils/index.js'
import { MeshVertexLayout, Shader, Uniform, WebGLRenderDevice } from "../../core/index.js";
import { Mesh, Attribute } from "../../mesh/index.js";
import { MeshMaterial3D, Object3D } from "../../objects/index.js";
import { Plugin, RenderItem, SortViewsNode, WebGLRenderer } from "../../renderer/index.js";
import { Sampler, Texture } from "../../texture/index.js";
import { PrimitiveTopology, TextureFilter, TextureFormat } from '../../constants/index.js';
import { Caches } from '../../caches/index.js';
import { ShadowMap } from '../shadow/index.js';
import { CameraViewNode } from '../camera/index.js';
import { MeshMaterialNode } from './nodes/index.js';
import { MeshMaterialPipelines } from './resources/index.js';

export class MeshMaterialPlugin extends Plugin {
  /**
   * @override
   * @param {WebGLRenderer} renderer
   */
  init(renderer) {
    renderer.setResource(new MeshMaterialPipelines())
    renderer.uniformBinders.set(MeshMaterial3D.name, uploadUniforms)
    renderer.renderGraph.addNode(MeshMaterialNode.name, new MeshMaterialNode())
    renderer.renderGraph.addDependency(CameraViewNode.name, MeshMaterialNode.name)
    renderer.renderGraph.addDependency(MeshMaterialNode.name, SortViewsNode.name)
  }
}

/**
 * @param {Object3D} object
 * @param {WebGLRenderDevice} device
 * @param {WebGLRenderer} renderer
 * @param {MeshMaterialPipelines} pipelines
 * @returns {RenderItem | undefined}
 */
export function createMeshMaterialRenderItem(object, device, renderer, pipelines) {
  if (!(object instanceof MeshMaterial3D)) {
    return
  }

  const { caches, attributes } = renderer
  const { material, mesh, transform } = object
  const gpuMesh = caches.getMesh(device, mesh, attributes)
  const meshBits = createPipelineBitsFromMesh(mesh, object)
  const materialBits = material.getPipelineBits()
  const pipelineKey = createPipelineKey(gpuMesh.layoutHash, meshBits, materialBits)
  const materialName = material.constructor.name
  const pipelineId = pipelines.getOrSetCompute(materialName, pipelineKey, () => {
      const keyMeshBits = pipelineKey >> GeneralPipelineKeyShiftBits.MeshBits
      const meshLayout = caches.getMeshVertexLayout(gpuMesh.layoutHash)
      const { defines, includes } = renderer
      assert(meshLayout, "Mesh layout not available")
      const shaderdefs = getShaderDefs(meshLayout, keyMeshBits, defines)
      /**
       * @type {WebGLRenderPipelineDescriptor}
       */
      const descriptor = {
        topology: mesh.topology,
        vertexLayout: meshLayout,
        vertex: new Shader({
          source: material.vertex()
        }),
        fragment: {
          source: new Shader({
            source: material.fragment()
          }),
          targets: [{
            format: TextureFormat.RGBA8Unorm
          }]
        }
      }

      for (const shaderdef of shaderdefs) {
        descriptor.vertex.defines.set(shaderdef[0], shaderdef[1])
        descriptor.fragment?.source?.defines?.set(shaderdef[0], shaderdef[1])
      }
      for (const [name, value] of includes) {
        descriptor.vertex.includes.set(name, value)
        descriptor.fragment?.source?.includes?.set(name, value)
      }

      material.specialize(descriptor)

      const [_, newId] = caches.createRenderPipeline(device, descriptor)

      return newId
    })

  const uniforms = new MaterialBindGroup({
    textures: object.material.getTextures(),
    data: material.getData(),
  })

  if (object.skin) {
    object.skin.bindMatrix.copy(object.transform.world)
    object.skin.inverseBindMatrix.copy(object.skin.bindMatrix).invert()
    object.skin.updateTexture()
    const texture = caches.getTexture(device, object.skin.boneTexture)

    uniforms.boneTransforms = texture
  }
  const item = new RenderItem({
    uniforms,
    mesh: gpuMesh,
    pipelineId,
    tag: MeshMaterial3D.name,
    transform: transform.world
  })

  return item
}

class MaterialBindGroup {
  /**
   * @type {GPUTexture | undefined} 
   */
  boneTransforms

  /**
   * @type {[string, number, Texture | undefined, Sampler | undefined][]}
   */
  textures
  /**
   * @type {ArrayBuffer}
   */
  data
  /**
   * @param {MaterialBindGroupOptions} options 
   */
  constructor({
    textures,
    data,
    boneTransforms
  }) {
    this.boneTransforms = boneTransforms
    this.data = data
    this.textures = textures
  }
}

/**
 * @typedef MaterialBindGroupOptions
 * @property {[string, number, Texture | undefined, Sampler | undefined][]} textures
 * @property {ArrayBuffer} data
 * @property {GPUTexture} [boneTransforms]
 */

/**
 * @param {WebGLRenderDevice} device
 * @param {WebGLRenderer} renderer
 * @param {WebGLRenderPipeline} pipeline
 * @param {MaterialBindGroup} bindGroup
 */
function uploadUniforms(device, renderer, pipeline, bindGroup) {
  const { caches, defaults } = renderer
  const shadowmap = renderer.getResource(ShadowMap)
  const shadowInfo = pipeline.uniforms.get('shadow_atlas')
  const boneMatricesInfo = pipeline.uniforms.get("bone_transforms")
  const materialBuffer = caches.uniformBuffers.get('MaterialBlock')

  if (shadowmap && shadowInfo && shadowInfo.texture_unit !== undefined) {
    device.context.activeTexture(WebGL2RenderingContext.TEXTURE0 + shadowInfo.texture_unit)

    const texture = caches.getTexture(device, shadowmap.shadowAtlas)
    device.context.bindTexture(shadowmap.shadowAtlas.type, texture.inner)
    updateTextureSampler(device.context, shadowmap.shadowAtlas, shadowmap.sampler)
  }

  if (boneMatricesInfo && boneMatricesInfo.texture_unit !== undefined && bindGroup.boneTransforms) {
    device.context.activeTexture(WebGL2RenderingContext.TEXTURE0 + boneMatricesInfo.texture_unit)

    device.context.bindTexture(bindGroup.boneTransforms.type, bindGroup.boneTransforms.inner)
    device.context.texParameteri(bindGroup.boneTransforms.type, WebGL2RenderingContext.TEXTURE_MIN_FILTER, WebGL2RenderingContext.LINEAR)
  }

  if (materialBuffer) {
    materialBuffer.update(device.context, bindGroup.data)
  }

  uploadTextures(device, bindGroup.textures, pipeline.uniforms, caches, defaults)
}
/**
 * @enum {bigint}
 */
export const MeshKey = /**@type {const}*/({
  TopologyBits: 0b1111111n,
  None: 0n,
  Points: 1n << 0n,
  Lines: 1n << 1n,
  LineLoop: 1n << 2n,
  LineStrip: 1n << 3n,
  Triangles: 1n << 4n,
  TriangleStrip: 1n << 5n,
  TriangleFan: 1n << 6n,
  Skinned: 1n << 7n
})

/**
 * @param {Mesh} mesh 
 * @returns {bigint}
 */
function keyFromTopology(mesh) {
  if (mesh.topology === PrimitiveTopology.Points) {
    return MeshKey.Points
  }
  if (mesh.topology === PrimitiveTopology.Lines) {
    return MeshKey.Lines
  }
  if (mesh.topology === PrimitiveTopology.LineLoop) {
    return MeshKey.LineLoop
  }
  if (mesh.topology === PrimitiveTopology.LineStrip) {
    return MeshKey.LineStrip
  }
  if (mesh.topology === PrimitiveTopology.Triangles) {
    return MeshKey.Triangles
  }
  if (mesh.topology === PrimitiveTopology.TriangleStrip) {
    return MeshKey.TriangleStrip
  }
  if (mesh.topology === PrimitiveTopology.TriangleFan) {
    return MeshKey.TriangleFan
  }

  return MeshKey.Triangles
}

/**
 * @param {Mesh} mesh
 * @param {MeshMaterial3D} object
 * @returns {bigint}
 */
function createPipelineBitsFromMesh(mesh, object) {
  let key = keyFromTopology(mesh)

  if (
    mesh.attributes.has(Attribute.JointIndex.name) &&
    mesh.attributes.has(Attribute.JointWeight.name) &&
    object.skin
  ) {
    key |= MeshKey.Skinned
  }
  return key
}

/**
 * @param {WebGL2RenderingContext} context
 * @param {Texture} texture
 * @param {Sampler} sampler
 */
function updateTextureSampler(context, texture, sampler) {
  const lod = sampler.lod
  const anisotropyExtenstion = context.getExtension("EXT_texture_filter_anisotropic")

  context.texParameteri(texture.type, context.TEXTURE_MAG_FILTER, sampler.magnificationFilter)
  context.texParameteri(texture.type, context.TEXTURE_WRAP_S, sampler.wrapS)
  context.texParameteri(texture.type, context.TEXTURE_WRAP_T, sampler.wrapT)
  context.texParameteri(texture.type, context.TEXTURE_WRAP_R, sampler.wrapR)

  if (lod) {
    context.texParameteri(texture.type, context.TEXTURE_MIN_LOD, lod.min)
    context.texParameteri(texture.type, context.TEXTURE_MAX_LOD, lod.max)
  }

  if (sampler.mipmapFilter !== undefined) {
    if (sampler.minificationFilter === TextureFilter.Linear) {
      if (sampler.mipmapFilter === TextureFilter.Linear) {
        context.texParameteri(texture.type, context.TEXTURE_MIN_FILTER, context.LINEAR_MIPMAP_LINEAR);
      } else if (sampler.mipmapFilter === TextureFilter.Nearest) {
        context.texParameteri(texture.type, context.TEXTURE_MIN_FILTER, context.LINEAR_MIPMAP_NEAREST);
      }
    } else if (sampler.minificationFilter === TextureFilter.Nearest) {
      if (sampler.mipmapFilter === TextureFilter.Linear) {
        context.texParameteri(texture.type, context.TEXTURE_MIN_FILTER, context.NEAREST_MIPMAP_LINEAR);
      } else if (sampler.mipmapFilter === TextureFilter.Nearest) {
        context.texParameteri(texture.type, context.TEXTURE_MIN_FILTER, context.NEAREST_MIPMAP_NEAREST);
      }
    }
  } else {
    if (sampler.minificationFilter === TextureFilter.Nearest) {
      context.texParameteri(texture.type, context.TEXTURE_MIN_FILTER, context.NEAREST)
    } else if (sampler.minificationFilter === TextureFilter.Linear) {
      context.texParameteri(texture.type, context.TEXTURE_MIN_FILTER, context.LINEAR)
    }
  }
  if (anisotropyExtenstion) {
    context.texParameterf(texture.type, anisotropyExtenstion.TEXTURE_MAX_ANISOTROPY_EXT, sampler.anisotropy)
  }

  if (sampler.compare !== undefined) {
    context.texParameteri(texture.type, context.TEXTURE_COMPARE_MODE, context.COMPARE_REF_TO_TEXTURE);
    context.texParameteri(texture.type, context.TEXTURE_COMPARE_FUNC, sampler.compare)
  } else {
    context.texParameteri(texture.type, context.TEXTURE_COMPARE_MODE, context.NONE);
  }
}

/**
 * @param {WebGLRenderDevice} device
 * @param {[string, number, Texture | undefined, Sampler | undefined][]} textures
 * @param {ReadonlyMap<string, Uniform>} uniforms
 * @param {Caches} caches
 * @param {Defaults} defaults
 */
function uploadTextures(device, textures, uniforms, caches, defaults) {
  for (let i = 0; i < textures.length; i++) {
    const [name, _, texture = defaults.texture2D, sampler = defaults.textureSampler] =
    /**@type {[string, number, Texture | undefined, Sampler | undefined]}*/(textures[i])
    const textureInfo = uniforms.get(name)

    if (textureInfo && textureInfo.texture_unit !== undefined) {
      const gpuTexture = caches.getTexture(device, texture)
      device.context.activeTexture(WebGL2RenderingContext.TEXTURE0 + textureInfo.texture_unit)
      device.context.bindTexture(texture.type, gpuTexture.inner)
      updateTextureSampler(device.context, texture, sampler)
    }
  }
}
/**
 * @param {MeshVertexLayout} meshLayout
 * @param {bigint} meshBits
 * @param {ReadonlyMap<string, string>} globalDefines
 */
function getShaderDefs(meshLayout, meshBits, globalDefines) {
  /**@type {[string,string][]} */
  const shaderdefs = []
  if (meshBits & MeshKey.Skinned) {
    shaderdefs.push(["SKINNED", ""])
  }

  if (meshLayout.hasAttribute(Attribute.UV)) {
    shaderdefs.push(['VERTEX_UVS', ''])
  }

  if (meshLayout.hasAttribute(Attribute.Normal)) {
    shaderdefs.push(['VERTEX_NORMALS', ''])
  }

  if (meshLayout.hasAttribute(Attribute.Tangent)) {
    shaderdefs.push(['VERTEX_TANGENTS', ''])
  }

  for (const [name, value] of globalDefines) {
    shaderdefs.push([name, value])
  }

  return shaderdefs
}

/**
 * @enum {bigint}
 */
export const GeneralPipelineKeyShiftBits = /**@type {const}*/({
  LayoutHashBits: 0n,
  MeshBits: 15n,
  MaterialBits: 47n
})
/**
 * @param {number} layoutHash
 * @param {bigint} meshBits
 * @param {bigint} materialBits
 */
function createPipelineKey(layoutHash, meshBits, materialBits) {
  const layoutHashBits = BigInt(layoutHash)
  return /**@type {PipelineKey}*/(
    layoutHashBits << GeneralPipelineKeyShiftBits.LayoutHashBits |
    meshBits << GeneralPipelineKeyShiftBits.MeshBits |
    (materialBits << GeneralPipelineKeyShiftBits.MaterialBits)
  )
}

/**
 * @typedef {Brand<bigint,"PipelineKey">} PipelineKey
 */
