import { Plugin, WebGLRenderer } from "../../renderer/index.js";
import { SortViewsNode } from "../../renderer/graph/index.js";
import { LightNode } from "./nodes/index.js";

export class LightPlugin extends Plugin {
  /**
   * @override
   * @param {WebGLRenderer} renderer
   */
  init(renderer) {
    renderer.defines
      .set("MAX_DIRECTIONAL_LIGHTS", "10")
      .set("MAX_POINT_LIGHTS", "10")
      .set("MAX_SPOT_LIGHTS", "10")

    renderer.renderGraph.addNode(LightNode.name, new LightNode())
    renderer.renderGraph.addDependency(LightNode.name, SortViewsNode.name)
  }
}
