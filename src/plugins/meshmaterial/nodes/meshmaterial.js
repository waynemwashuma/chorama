import { assert } from "../../../utils/index.js"
import { Camera, Object3D } from "../../../objects/index.js"
import { Views } from "../../../renderer/index.js"
import { MeshMaterialPipelines } from "../resources/index.js"
import { createMeshMaterialRenderItem } from "../meshmaterial.js"

export class MeshMaterialNode {
  subgraph() {
    return undefined
  }

  /**
   * @param {import("../../../renderer/graph/index.js").RenderGraphContext} context
   */
  execute(context) {
    const { renderer, renderDevice, objects } = context
    const views = renderer.getResource(Views)
    const pipelines = renderer.getResource(MeshMaterialPipelines)

    assert(views, "Views resource missing")
    assert(pipelines, "MeshMaterialPipelines resource missing")

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
          const item = createMeshMaterialRenderItem(child, renderDevice, renderer, pipelines)

          if (item) {
            opaqueStage.push(item)
          }
          return true
        })
      }
    }
  }
}
