import { BufferUsage, BufferType, TextureType, TextureFormat, CullFace, FrontFaceDirection, PrimitiveTopology } from "../../constants/index.js";
import { Vector3 } from "../../math/index.js";
import { CompareFunction } from "../constants.js";
import { MeshVertexLayout } from "../layouts/index.js";
import { BlendParams, GPUTexture } from "../resources/index.js";
import { Shader } from "../shader.js";

/**
 * @typedef WebGLBindGroupLayoutDescriptor
 * @property {string} [label]
 * @property {WebGLBindGroupLayoutEntry[]} entries
 */

/**
 * @typedef WebGLBindGroupLayoutEntry
 * @property {number} binding
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
 * @typedef WebGLBindGroupDescriptor
 * @property {string} [label]
 * @property {import("./bindgroup.js").WebGLBindGroupLayout} layout
 * @property {WebGLBindGroupEntry[]} entries
 */

/**
 * @typedef WebGLBindGroupEntry
 * @property {number} binding
 * @property {any} resource
 */

/**
 * @typedef WebGLBufferDescriptor
 * @property {number} size
 * @property {BufferUsage} usage
 * @property {BufferType} type
 */

/**
 * @typedef WebGLTextureDescriptor
 * @property {TextureType} type
 * @property {TextureFormat} format
 * @property {number} width
 * @property {number} height
 * @property {number} [depth = 1]
 * @property {number} [mipmapCount = 1]
 */

/**
 * @typedef WebGLWriteTextureDescriptor
 * @property {GPUTexture} texture
 * @property {ArrayBufferLike} data
 * @property {number} [mipmapLevel]
 * @property {Vector3} [offset]
 * @property {Vector3} [size]
 */

/**
 * @typedef WebGLRenderPipelineDescriptor
 * @property {Shader} vertex
 * @property {{ source: Shader, targets:RenderTargetDescriptor[]}} [fragment]
 * @property {MeshVertexLayout} vertexLayout
 * @property {PrimitiveTopology} topology
 * @property {CullFace} [cullFace]
 * @property {boolean} [depthWrite]
 * @property {CompareFunction} [depthCompare]
 * @property {FrontFaceDirection} [frontFace]
 */

/**
 * @typedef RenderTargetDescriptor
 * @property {TextureFormat} format
 * @property {BlendDescriptor} [blend]
 */

/**
 * @typedef BlendDescriptor
 * @property {BlendParams} color
 * @property {BlendParams} alpha
 */
export default {}
