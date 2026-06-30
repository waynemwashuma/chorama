import { Plugin, SortViewsNode, WebGLRenderer } from "../../renderer/index.js";
import { CameraOpaquePassNode, CameraViewNode, CanvasBlitNode } from "./nodes/index.js";
import { RenderTarget2DPool } from "./RenderTarget2DPool.js";
import { CanvasBlitPipeline } from "./resources/index.js";

export class CameraPlugin extends Plugin {
  /**
   * @override
   * @param {WebGLRenderer} renderer
   */
  init(renderer) {
    renderer.setResource(new RenderTarget2DPool())
    renderer.setResource(new CanvasBlitPipeline())
    renderer.renderGraph.addNode(CameraViewNode.name, new CameraViewNode())
    renderer.renderGraph.addNode(CanvasBlitNode.name, new CanvasBlitNode())
    renderer.renderGraph.addNode(CameraOpaquePassNode.name, new CameraOpaquePassNode())
    renderer.renderGraph.addDependency(CameraViewNode.name, SortViewsNode.name)
    renderer.renderGraph.addDependency(SortViewsNode.name, CameraOpaquePassNode.name)
    renderer.renderGraph.addDependency(CameraOpaquePassNode.name, CanvasBlitNode.name)
  }
}
