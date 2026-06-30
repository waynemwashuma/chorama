import { hash } from "hash-it";
import { TextureFormat, TextureType } from "../../constants";
import { ImageRenderTarget } from "../../rendertarget";
import { Texture } from "../../texture";
import { assertTrue } from "../../utils";


export class RenderTarget2DPool {
  /**
   * @type {Map<number, [RenderTarget2DPoolDescriptor, ImageRenderTarget[]]>}
   */
  map = new Map();

  /**
   * @private
   * @param {number} id
   * @param {RenderTarget2DPoolDescriptor} descriptor
   */
  getInternal(id, descriptor) {
    const item = this.map.get(id);

    if (item) {
      return item;
    }
    const newItem = /**@type {[RenderTarget2DPoolDescriptor, ImageRenderTarget[]]} */ ([descriptor, []]);
    this.map.set(id, newItem);
    return newItem;
  }
  /**
   * @param {RenderTarget2DPoolDescriptor} descriptor
   */
  get(descriptor) {
    const id = hash(descriptor);
    const item = this.map.get(id);

    if (item && item[1].length) {
      return /**@type {ImageRenderTarget} */ (item[1].pop());
    }
    const rendertarget = new ImageRenderTarget({
      width: descriptor.width,
      height: descriptor.height,
      color: descriptor.color.map((format) => new Texture({
        format,
        type: TextureType.Texture2D
      })),
      depthTexture: descriptor.depth ? new Texture({
        format: descriptor.depth,
        type: TextureType.Texture2D
      }) : undefined
    });

    return rendertarget;
  }

  /**
   * @param {ImageRenderTarget} renderTarget
   */
  recycle(renderTarget) {
    const descriptor = descriptorFromRenderTarget(renderTarget);
    const id = hash(descriptor);

    const item = this.getInternal(id, descriptor);

    item[1].push(renderTarget);
  }
}

/**
* @param {ImageRenderTarget} renderTarget
* @returns {RenderTarget2DPoolDescriptor}
*/
export function descriptorFromRenderTarget(renderTarget) {
  const descriptor = {
    color: renderTarget.color.map(t => t?.format),
    depth: renderTarget.depthTexture?.format,
    width: renderTarget.width,
    height: renderTarget.height
  }

  renderTarget.color.forEach((t) => {
    assertTrue(t.type === TextureType.Texture2D, "Invalid render target for the pool")
  })
  
  if(renderTarget.depthTexture){
    assertTrue(renderTarget.depthTexture.type === TextureType.Texture2D, "Invalid render target for the pool")
  }
  return descriptor
}

/**
 * @typedef {Object} RenderTarget2DPoolDescriptor
 * @property {TextureFormat[]} color
 * @property {TextureFormat | undefined} depth
 * @property {number} width
 * @property {number} height
 */