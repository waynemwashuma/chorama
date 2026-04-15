declare module "*.glsl" {
  const source: string;

  export default source;
}

// Assisted by ChatGPT 5.2 Codex mini
declare module "graph-2" {
  export type NodeId = number
  export type EdgeId = number

  export class Graph<T = unknown, U = unknown> {
    directed: boolean
    constructor(directed: boolean)
    addNode(weight: T): NodeId
    addEdge(from: NodeId, to: NodeId, weight: U): EdgeId
    getNodeWeight(id: NodeId): T | undefined
  }

  export function kahnTopologySort<T = unknown, U = unknown>(
    graph: Graph<T, U>
  ): NodeId[] | undefined
}

// Assisted by ChatGPT 5.3 Codex
declare module "@examples/rendergraph_gui" {
  export function addRenderGraphGuiAddon(options: {
    gui: import("dat.gui").GUI
    renderer: import("webgllis").WebGLRenderer
    title?: string
    position?: { x: number; y: number }
    width?: number
  }): {
    refresh: () => void
    dispose: () => void
  }
}
