/**@import { GPUTexture, WebGLRenderPipelineDescriptor } from '../../../core/index.js' */
import { CompareFunction, MeshVertexLayout, Shader } from "../../../core/index.js"
import { CullFace, PrimitiveTopology, TextureFormat } from "../../../constants/index.js"
import { Camera, Object3D, SkyBox } from "../../../objects/index.js"
import { RenderItem, Views } from "../../../renderer/index.js"
import { skyboxFragment, skyboxVertex } from "../../../shader/index.js"
import { assert } from "../../../utils/index.js"
import { SkyboxPipeline, SkyBoxMesh } from "../resources/index.js"

export class SkyBoxNode {
  subgraph() {
    return undefined
  }

  /**
   * @param {import("../../../renderer/graph/index.js").RenderGraphContext} context
   */
  execute(context) {
    const { renderer, renderDevice, objects } = context
    const views = renderer.getResource(Views)

    assert(views, "Views resource missing")

    for (const view of views.items()) {
      if (view.tag !== Camera.name) {
        continue
      }

      const opaqueStage = view.renderStage.opaque || []
      view.renderStage.opaque = opaqueStage

      for (let i = 0; i < objects.length; i++) {
        // SAFETY: Asssume the list is dense
        const object = /**@type {Object3D}*/(objects[i])

        object.traverseDFS((child) => {
          if (!child.renderMask.test(view.renderMask)) {
            return true
          }

          if (!(child instanceof SkyBox)) {
            return true
          }
          const item = createSkyboxRenderItem(child, renderDevice, renderer)

          opaqueStage.push(item)

          return true
        })
      }
    }
  }
}

/**
 * @param {SkyBox} object
 * @param {import("../../../core/index.js").WebGLRenderDevice} device
 * @param {import("../../../renderer/index.js").WebGLRenderer} renderer
 * @returns {RenderItem}
 */
function createSkyboxRenderItem(object, device, renderer) {
  const skyboxMesh = renderer.getResource(SkyBoxMesh)

  assert(skyboxMesh, "SkyBoxMesh resource missing")
  const mesh = renderer.caches.getMesh(device, skyboxMesh.cube, renderer.attributes)
  /** @type {{ lerp: number, day: GPUTexture | undefined, night: GPUTexture | undefined }} */
  const uniforms = {
    lerp: object.lerp,
    day: undefined,
    night: undefined
  }

  if (object.day) {
    const dayTex = renderer.caches.getTexture(device, object.day)

    uniforms.day = dayTex
  }
  if (object.night) {
    const nightTex = renderer.caches.getTexture(device, object.night)

    uniforms.night = nightTex
  }
  const item = new RenderItem({
    pipelineId: getSkyboxRenderPipeline(device, renderer),
    uniforms,
    tag: SkyBox.name,
    transform: object.transform.world,
    mesh
  })

  return item
}

/**
 * @param {import("../../../core/index.js").WebGLRenderDevice} device
 * @param {import("../../../renderer/index.js").WebGLRenderer} renderer
 */
function getSkyboxRenderPipeline(device, renderer) {
  const skyboxPipeline = renderer.getResource(SkyboxPipeline)
  const { caches, includes, defines: globalDefines } = renderer

  assert(skyboxPipeline, "SkyboxPipeline resource missing")

  if (skyboxPipeline.pipelineId !== undefined) {
    return skyboxPipeline.pipelineId
  }
  /**
   * @type {WebGLRenderPipelineDescriptor}
   */
  const descriptor = {
    depthWrite: false,
    depthCompare: CompareFunction.Lequal,
    cullFace: CullFace.Front,
    topology: PrimitiveTopology.Triangles,
    vertexLayout: new MeshVertexLayout([]),
    vertex: new Shader({
      source: skyboxVertex
    }),
    fragment: {
      source: new Shader({
        source: skyboxFragment
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

  const [_, newId] = caches.createRenderPipeline(device, descriptor)

  skyboxPipeline.pipelineId = newId

  return newId
}
