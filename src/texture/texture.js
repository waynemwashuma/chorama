import { TextureFormat, TextureType } from "../constants/index.js"

export class Texture {

  /**
   * Tracks if the texture has changed since last checked.
   * @type {boolean}
   */
  #changed = false

  /**
   * The raw pixel data for the texture.
   * @type {ArrayBuffer | undefined}
   */
  #data

  /**
   * The width of the texture in pixels.
   * @type {number}
   */
  #width

  /**
   * The height of the texture in pixels.
   * @type {number}
   */
  #height

  /**
   * The depth of the texture, used for 3D textures or texture arrays.
   * @type {number}
   */
  #depth

  /**
   * The texture format of this texture.
   * @type {TextureFormat}
   */
  #format

  /**
   * Whether mipmaps should be automatically generated for this texture.
   * @type {boolean}
   */
  #generateMipmaps

  /**
   * The type of texture (e.g., Texture2D, TextureCube, etc.).
   * @type {TextureType}
   */
  #type

  /**
   * @param {TextureSettings & { data?: ArrayBuffer, type: TextureType }} settings
   */
  constructor({
    data,
    type,
    format = Texture.defaultSettings.format,
    generateMipmaps = Texture.defaultSettings.generateMipmaps,
    width = Texture.defaultSettings.width,
    height = Texture.defaultSettings.height,
    depth = Texture.defaultSettings.depth,
  }) {
    this.#data = data
    this.#type = type
    this.#width = width
    this.#height = height
    this.#depth = depth
    this.#format = format
    this.#generateMipmaps = generateMipmaps
  }

  /**
   * @package
   * @returns {boolean}
   * This is an internal property, do not use!
   */
  get changed() {
    const previous = this.#changed
    this.#changed = false
    return previous
  }

  /** @type {ArrayBuffer | undefined} */
  get data() { return this.#data }
  set data(value) {
    this.#data = value
    this.#changed = true
  }

  /** @type {number} */
  get width() { return this.#width }
  set width(value) {
    this.#width = value
    this.#changed = true
  }

  /** @type {number} */
  get height() { return this.#height }
  set height(value) {
    this.#height = value
    this.#changed = true
  }

  /** @type {number} */
  get depth() { return this.#depth }
  set depth(value) {
    this.#depth = value
    this.#changed = true
  }

  /** @type {TextureFormat} */
  get format() { return this.#format }
  set format(value) {
    this.#format = value
    this.#changed = true
  }

  /** @type {boolean} */
  get generateMipmaps() { return this.#generateMipmaps }
  set generateMipmaps(value) {
    this.#generateMipmaps = value
    this.#changed = true
  }

  /** @type {TextureType} */
  get type() { return this.#type }
  set type(value) {
    this.#type = value
    this.#changed = true
  }

  /**
   * Applies a new set of texture settings.
   * @param {TextureSettings} settings
   */
  apply({
    format = Texture.defaultSettings.format,
    generateMipmaps = Texture.defaultSettings.generateMipmaps,
    width = Texture.defaultSettings.width,
    height = Texture.defaultSettings.height,
    depth = Texture.defaultSettings.depth,
  }) {
    this.width = width
    this.height = height
    this.depth = depth
    this.format = format
    this.generateMipmaps = generateMipmaps
  }

  /**
   * Copies the values from another texture into this one.
   * @param {this} other
   * @returns {this}
   */
  copy(other) {
    this.data = other.data ? other.data.slice() : undefined
    this.format = other.format
    this.width = other.width
    this.height = other.height
    this.depth = other.depth
    this.type = other.type
    this.generateMipmaps = other.generateMipmaps
    return this
  }

  /**
   * Creates a new texture that is a copy of this one.
   * @returns {this}
   */
  clone() {
    return new /** @type {new (...args:any[]) => this} */(this.constructor)({}).copy(this)
  }

  /**
   * Creates a default 1×1 white texture.
   * @returns {Texture}
   */
  static default() {
    const width = 1
    const height = 1
    const pixel = new Uint8Array([255, 255, 255, 255])
    const texture = new Texture({
      width,
      height,
      data: pixel.buffer,
      type: TextureType.Texture2D,
    })
    return texture
  }

  /**
   * Default texture settings.
   * @readonly
   * @type {Readonly<Required<TextureSettings>>}
   */
  static defaultSettings = {
    format: TextureFormat.RGBA8Unorm,
    generateMipmaps: false,
    width: 0,
    height: 0,
    depth: 1,
  }
}

/**
 * @typedef TextureSettings
 * @property {boolean} [generateMipmaps=true]
 * @property {TextureFormat} [format]
 * @property {number} [width]
 * @property {number} [height]
 * @property {number} [depth]
 */
