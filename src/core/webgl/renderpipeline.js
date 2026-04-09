/**@import { RenderTargetDescriptor } from './descriptors.js' */
import { CullFace, FrontFaceDirection, PrimitiveTopology } from "../../constants/index.js";
import { CompareFunction } from "../constants.js";
import { MeshVertexLayout, UniformBufferLayout, Uniform } from "../layouts/index.js";

export class WebGLRenderPipeline {
  /**
   * @param {WebGLRenderPipelineOptions} descriptor
   */
  constructor({
    program,
    targets,
    uniforms,
    uniformBlocks,
    topology,
    vertexLayout,
    depthCompare,
    depthWrite,
    cullFace,
    frontFace
  }) {
    this.program = program
    this.uniforms = uniforms
    this.uniformBlocks = uniformBlocks
    this.vertexLayout = vertexLayout
    this.topology = topology
    this.cullMode = cullFace
    this.depthCompare = depthCompare
    this.depthWrite = depthWrite
    this.frontFace = frontFace
    this.targets = targets
  }

  /**
   * @param {WebGL2RenderingContext} gl
   */
  dispose(gl) {
    gl.deleteProgram(this.program)
  }
}

/**
 * @typedef WebGLRenderPipelineOptions
 * @property {WebGLProgram} program
 * @property {Map<string, Uniform>} uniforms
 * @property {Map<string, UniformBufferLayout>} uniformBlocks
 * @property {RenderTargetDescriptor[]} targets
 * @property {MeshVertexLayout} vertexLayout
 * @property {PrimitiveTopology} topology
 * @property {CullFace} cullFace
 * @property {boolean} depthWrite
 * @property {CompareFunction} depthCompare
 * @property {FrontFaceDirection} frontFace
 */
