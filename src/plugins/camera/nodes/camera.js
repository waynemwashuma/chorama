import { RenderGraph } from "../../../renderer/graph/index.js"
import { OpaquePassNode } from "./opaquepass.js"

export class CameraNode {
  /**
   * @private
   * @type {RenderGraph}
   */
  graph = new RenderGraph()

  constructor() {
    this.graph.addNode(OpaquePassNode.name, new OpaquePassNode())
  }

  /**
   * @param {import("../../../renderer/graph/index.js").RenderGraphContext} context
   */
  execute(context) {
    this.graph.execute(context)
  }

  subgraph() {
    return this.graph
  }
}
