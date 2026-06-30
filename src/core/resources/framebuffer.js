import { hasDepthComponent, hasStencilComponent } from "../../constants/texture.js"
import { Color } from "../../math/index.js"
import { ViewRectangle } from "../../utils/index.js"
import { GPUTexture } from "./gputexture.js"

export class FrameBuffer {
  /**
   * @type {number}
   */
  width
  /**
   * @type {number}
   */
  height
  /**
   * @type {WebGLFramebuffer | null}
   */
  buffer

  /**
   * @type {GPUTexture[]}
   */
  colorAttachments

  /**
   * @type {GLenum[]}
   */
  drawBuffers

  /**
   * @type {GPUTexture | undefined}
   */
  depthBuffer

  /**
   * @param {WebGLFramebuffer | null} frameBuffer
   * @param {GPUTexture[]} colorAttachments
   * @param {GLenum[]} drawBuffers
   * @param {GPUTexture | undefined} depthBuffer
   * @param {number} width
   * @param {number} height
   */
  constructor(frameBuffer, colorAttachments, drawBuffers, depthBuffer, width, height) {
    this.buffer = frameBuffer
    this.colorAttachments = colorAttachments
    this.depthBuffer = depthBuffer
    this.drawBuffers = drawBuffers
    this.width = width
    this.height = height
  }

  /**
   * @param {WebGL2RenderingContext} context
   * @param {Color | undefined} clearColor
   * @param {number | undefined} clearDepth
   * @param {number | undefined} clearStencil
   */
  clear(context, clearColor, clearDepth, clearStencil) {
    let bit = 0
    context.stencilMask(0xFF);

    if (clearColor) {
      const { r, g, b, a } = clearColor
      bit |= context.COLOR_BUFFER_BIT
      context.colorMask(true, true, true, true)
      context.clearColor(r, g, b, a)
    }
    if (clearDepth !== undefined) {
      bit |= context.DEPTH_BUFFER_BIT
      context.depthRange(0, 1)
      context.depthMask(true)
      context.clearDepth(clearDepth)
    }
    if (clearStencil !== undefined) {
      bit |= context.STENCIL_BUFFER_BIT
      context.stencilMask(0xFF)
      context.clearStencil(clearStencil)
    }
    context.clear(bit)
  }

  /**
   * @param {WebGL2RenderingContext} context
   * @param {ViewRectangle} viewport
   * @param {ViewRectangle} scissors
   */
  setViewport(context, viewport, scissors) {
    const { width, height } = this

    context.bindFramebuffer(context.FRAMEBUFFER, this.buffer)
    context.drawBuffers(this.drawBuffers)
    context.enable(context.SCISSOR_TEST)
    context.scissor(
      scissors.offset.x * width,
      scissors.offset.y * height,
      scissors.size.x * width,
      scissors.size.y * height
    )
    context.viewport(
      viewport.offset.x * width,
      viewport.offset.y * height,
      viewport.size.x * width,
      viewport.size.y * height
    )

    if(this.buffer){
      if(this.depthBuffer){
        if(hasDepthComponent(this.depthBuffer.actualFormat)){
          context.enable(WebGL2RenderingContext.DEPTH_TEST)
        } else {
          context.disable(WebGL2RenderingContext.DEPTH_TEST)
        }
        if(hasStencilComponent(this.depthBuffer.actualFormat)){
          context.enable(WebGL2RenderingContext.STENCIL_TEST)
        }else {
          context.disable(WebGL2RenderingContext.STENCIL_TEST)
        }
      } else {
        context.disable(WebGL2RenderingContext.DEPTH_TEST)
        context.disable(WebGL2RenderingContext.STENCIL_TEST)
      }
    } else {
      context.disable(WebGL2RenderingContext.DEPTH_TEST)
      context.disable(WebGL2RenderingContext.STENCIL_TEST)
    }
  }
}