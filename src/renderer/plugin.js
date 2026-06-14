/** @import { WebGLRenderer } from "./renderer.js" */
import { abstractClass } from "../utils/index.js";

/**
 * @abstract
 */
export class Plugin {
  constructor() {
    abstractClass(this, Plugin)
  }

  /**
   * @param {WebGLRenderer} _renderer
   */
  init( _renderer){}
}