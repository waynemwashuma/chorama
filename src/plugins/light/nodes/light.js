import { Object3D } from "../../../objects/index.js"
import { AmbientLight, PointLight, SpotLight,DirectionalLight } from "../../../objects/index.js"
import { ShadowMap } from "../../shadow/index.js"

export class LightNode {
  subgraph() {
    return undefined
  }

  /**
   * @param {import("../../../renderer/graph/index.js").RenderGraphContext} context
   */
  execute(context) {
    updateLights(context.objects, context.renderDevice, context.renderer)
  }
}

/**
 * @param {import("../../../objects/index.js").Object3D[]} objects
 * @param {import("../../../core/index.js").WebGLRenderDevice} device
 * @param {import("../../../renderer/index.js").WebGLRenderer} renderer
 */
function updateLights(objects, device, renderer) {
  const shadowMap = renderer.getResource(ShadowMap)
  const directionalLights = new LightQueue()
  const pointLights = new LightQueue()
  const spotLights = new LightQueue()

  for (let i = 0; i < objects.length; i++) {
    const object = /**@type {Object3D}*/(objects[i])

    object.traverseDFS((object) => {
      if (object instanceof DirectionalLight) {
        directionalLights.add(object)
      } else if (object instanceof PointLight) {
        pointLights.add(object)
      } else if (object instanceof SpotLight) {
        spotLights.add(object)
      } else if (object instanceof AmbientLight) {
        renderer.updateUBO(device.context, object.getData())
      }
      return true
    })
  }

  const directionalLightData = directionalLights.getData()
  const spotLightData = spotLights.getData()
  const pointLightData = pointLights.getData()
  const directionalItems = new Int32Array(directionalLightData.buffer)
  const spotItems = new Int32Array(spotLightData.buffer)
  const pointItems = new Int32Array(pointLightData.buffer)

  for (let i = 0; i < directionalLights.lights.length; i++) {
    const offset = (i * 12) + 8 + 4
    const item = shadowMap?.inner.get(/**@type {DirectionalLight}*/(directionalLights.lights[i]))

    if (item?.enabled) {
      directionalItems[offset] = item.spaceIndex
    } else {
      directionalItems[offset] = -1
    }
  }

  for (let i = 0; i < spotLights.lights.length; i++) {
    const offset = (i * 16) + 7 + 4
    const item = shadowMap?.inner.get(/**@type {SpotLight}*/(spotLights.lights[i]))
    if (item?.enabled) {
      spotItems[offset] = item.spaceIndex
    } else {
      spotItems[offset] = -1
    }
  }

  for (let i = 0; i < pointLights.lights.length; i++) {
    const offset = (i * 12) + 10 + 4
    const item = shadowMap?.inner.get(/**@type {PointLight}*/(pointLights.lights[i]))
    if (item?.enabled) {
      pointItems[offset] = item.spaceIndex
    } else {
      pointItems[offset] = -1
    }
  }

  renderer.updateUBO(device.context, {
    name: "DirectionalLightBlock",
    data: directionalLightData
  })

  renderer.updateUBO(device.context, {
    name: "PointLightBlock",
    data: pointLightData
  })

  renderer.updateUBO(device.context, {
    name: "SpotLightBlock",
    data: spotLightData
  })
}

/**
 * @template {{pack:()=>number[]}} T
 */
class LightQueue {
  /**
   * @type {T[]}
   */
  lights = []

  /**
   * @param {T} light
   */
  add(light) {
    this.lights.push(light)
  }

  getData() {
    const buffer = new Float32Array([
      0, 0, 0, 0,
      ...this.lights.flatMap(light => light.pack())
    ])
    const dataView = new Uint32Array(buffer.buffer)

    dataView[0] = this.lights.length

    return buffer
  }
}
