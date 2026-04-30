import { Transform3D } from "../math/index.js"

export class Object3D {
  /**
   * @type {string}
   */
  name = ''

  transform = new Transform3D()

  /**
   * @type {Object3D | undefined}
   */
  parent
  /**
   * @type {Object3D[]}
   */
  children = []

  renderMask = new RenderMask()
  update() {
    this.transform.updateMatrix(this.parent?.transform)
  }

  /**
   * @param {Object3D[]} children
   */
  add(...children) {
    this.children.push(...children)
    children.forEach(child => child.parent = this)
  }

  /**
   * @param {Object3D[]} children
   */
  remove(...children) {
    for (let i = 0; i < children.length; i++) {
      const child = /**@type {Object3D}*/(children[i]);

      const index = this.children.indexOf(child)
      if (index === -1) continue

      child.parent = undefined
      this.children.splice(index, 1)
    }
  }
  /**
   * @param {Traverser} func
   */
  traverseBFS(func) {
    /**@type {Object3D[]} */
    const queue = [this]

    while (queue.length) {
      const object = /**@type {Object3D}*/ (queue.shift())
      const visible = func(object)

      if (!visible) continue
      queue.push(...object.children)
    }
  }

  /**
   * @param {Traverser} func
   */
  traverseDFS(func) {
    const visible = func(this)

    if (!visible) return
    for (let i = 0; i < this.children.length; i++) {
      const child = /**@type {Object3D}*/ (this.children[i])

      child.traverseDFS(func);
    }
  }

  /**
   * @param {this} object
   * @param {Map<Object3D,Object3D>} [entityMap] 
   */
  copy(object, entityMap) {
    this.transform.copy(object.transform)
    this.name = object.name
    this.renderMask.copy(object.renderMask)
    this.add(...object.children.map(child => {
      const childClone = child.clone(entityMap)

      if (entityMap) {
        entityMap.set(child, childClone)
      }

      return childClone
    }))

    if (entityMap) {
      entityMap.set(object, this)
    }
    return this
  }

  /**
   * @param {Map<Object3D, Object3D>} [entityMap]
   */
  clone(entityMap) {
    return new /**@type {new (...arg:any) => this}*/(this.constructor)().copy(this, entityMap)
  }
}

/**
 * @callback Traverser
 * @param {Object3D} object
 * @returns {boolean}
 */


export class RenderMask {
  inner = -1

  /**
   * Test against a mask (any overlap).
   * @param {RenderMask} mask
   */
  test(mask) {
    return (this.inner & mask.inner) !== 0
  }

  /**
   * Copy another render mask.
   * @param {RenderMask} mask
   */
  copy(mask) {
    this.inner = mask.inner
    return this
  }

  clear() {
    this.inner = 0
    return this
  }

  /**
   * Enable a bit by index.
   * @param {number} index
   */
  on(index) {
    this.inner |= (1 << index)
    return this
  }

  /**
   * Disable a bit by index.
   * @param {number} index
   */
  off(index) {
    this.inner &= ~(1 << index)
    return this
  }

  /**
   * Toggle a bit by index.
   * @param {number} index
   */
  toggle(index) {
    this.inner ^= (1 << index)
    return this
  }
}
