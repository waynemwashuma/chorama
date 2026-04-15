import { Graph, kahnTopologySort } from "graph-2"
import { assert } from "../../utils/index.js"

/**
 * @typedef RenderGraphNode
 * @property {(context: RenderGraphContext) => void} execute
 * @property {() => RenderGraph | undefined} subgraph
 */

/**
 * @typedef RenderGraphContext
 * @property {import("../renderer.js").WebGLRenderer} renderer
 * @property {import("../../objects/index.js").Object3D[]} objects
 * @property {import("../../core/index.js").WebGLRenderDevice} renderDevice
 */

export class RenderGraph {
  /**
   * @private
   * @type {Graph<RenderGraphNode, undefined>}
   */
  graph = new Graph(true)

  /**
   * @private
   * @type {Map<string, number>}
   */
  nodes = new Map()

  /**
   * @param {string} name
   * @param {RenderGraphNode} node
   * @returns {number}
   */
  addNode(name, node) {
    const current = this.nodes.get(name)

    if (current !== undefined) {
      throw new Error(`Render graph node "${name}" already exists`)
    }

    const id = this.graph.addNode(node)

    this.nodes.set(name, id)
    return id
  }

  /**
   * @param {string} from
   * @param {string} to
   */
  addDependency(from, to) {
    const fromId = this.nodes.get(from)
    const toId = this.nodes.get(to)

    assert(fromId, `Render graph node "${from}" is missing`)
    assert(toId, `Render graph node "${to}" is missing`)

    this.graph.addEdge(fromId, toId, undefined)
  }

  /**
   * @param {RenderGraphContext} context
   */
  execute(context) {
    /** @type {number[] | undefined} */
    const order = kahnTopologySort(this.graph)

    assert(order, "Cycle detected in render graph")

    for (let i = 0; i < order.length; i++) {
      const nodeId = /** @type {number | undefined} */ (order[i])
      assert(nodeId, "Invalid render graph topology output")
      const node = this.graph.getNodeWeight(nodeId)

      assert(node, `Render graph node with id "${nodeId}" is missing`)
      node.execute(context)
    }
  }
}
