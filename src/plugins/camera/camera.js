import { Plugin, SortViewsNode, WebGLRenderer } from "../../renderer/index.js";
import { CameraOpaquePassNode, CameraViewNode } from "./nodes/index.js";

export class CameraPlugin extends Plugin {
  /**
   * @override
   * @param {WebGLRenderer} renderer
   */
  init(renderer){
    renderer.renderGraph.addNode(CameraViewNode.name, new CameraViewNode())
    renderer.renderGraph.addNode(CameraOpaquePassNode.name, new CameraOpaquePassNode())
    renderer.renderGraph.addDependency(CameraViewNode.name, SortViewsNode.name)
    renderer.renderGraph.addDependency(SortViewsNode.name, CameraOpaquePassNode.name)
  }
  /**
   * @override
   */
  preprocess() {}
}
