export class UniformBufferLayout {
  name
  fields
  size
  /**
   * @param {string} name
   * @param {number} size
   * @param {Map<string, UniformBufferField>} fields
   */
  constructor(name, size, fields) {
    this.name = name
    this.size = size
    this.fields = fields
  }
}

/**
 * @typedef UniformBufferField
 * @property {number} type
 * @property {number} size
 * @property {number} offset
 * @property {number} stride
 */
