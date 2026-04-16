import { Plugin, SortViewsNode, WebGLRenderer } from "../../renderer/index.js";
import { ShadowMap, ShadowPipelines } from "./resources/index.js";
import { ShadowOccluderNode, ShadowOpaquePassNode, ShadowViewNode } from "./nodes/index.js";
import { CameraOpaquePassNode } from "../camera/index.js";

export class ShadowPlugin extends Plugin {
  /**
   * @override
   * @param {WebGLRenderer} renderer
   */
  init(renderer) {
    const maxShadows = 10
    renderer.setResource(new ShadowMap(maxShadows))
    renderer.setResource(new ShadowPipelines())
    renderer.defines.set('MAX_SHADOW_CASTERS', maxShadows.toString())

    renderer.renderGraph.addNode(ShadowViewNode.name, new ShadowViewNode())
    renderer.renderGraph.addNode(ShadowOccluderNode.name, new ShadowOccluderNode())
    renderer.renderGraph.addNode(ShadowOpaquePassNode.name, new ShadowOpaquePassNode())
    renderer.renderGraph.addDependency(ShadowViewNode.name, ShadowOccluderNode.name)
    renderer.renderGraph.addDependency(ShadowOccluderNode.name, SortViewsNode.name)
    renderer.renderGraph.addDependency(SortViewsNode.name, ShadowOpaquePassNode.name)
    renderer.renderGraph.addDependency(ShadowOpaquePassNode.name, CameraOpaquePassNode.name)
    
  }

  /**
   * @override
   */
  preprocess() {}
}
