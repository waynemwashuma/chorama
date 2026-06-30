import { Affine3, Matrix4 } from "../../math/index.js"
import { Object3D } from "../object3d.js"
import { RenderTarget } from "../../rendertarget/index.js"
import { PerspectiveProjection, Projection } from "./projection.js"

export class ReinhardToneMapping {
	/**
	 * @type {number}
	 */
	exposure

	/**
	 * @param {ReinhardToneMappingOptions} [options]
	 */
	constructor({ exposure = 1 } = {}) {
		this.exposure = exposure
	}
}

export class Camera extends Object3D {
	near = 0.1
	
	far = 2000

	/**
	 * @type {RenderTarget}
	 */
	target
	/**
	 * @type {Projection}
	 */
	projection = new PerspectiveProjection()

	/**
	 * Undefined means no camera tone mapping.
	 * @type {ReinhardToneMapping | undefined}
	 */
	toneMapping = new ReinhardToneMapping()

	/**
	 * @type {Matrix4}
	 */
	view = new Matrix4()
	
	/**
	 * @param {RenderTarget} target
	 */
	constructor(target){
		super()
		this.target = target
	}
	/**
	 * @override
	 */
	update() {
		super.update()
		const inverseTransform = Affine3.toMatrix4(
			Affine3.invert(this.transform.world)
		)
		this.view.copy(inverseTransform)
	}
	
	getData() {
		const { near, far } = this
		return {
			name: "CameraBlock",
			data: new Float32Array([
				...this.view,
				...this.projection.asProjectionMatrix(near, far),
				...this.transform.position,
				this.near,
				this.far
			]).buffer
		}
	}
}

/**
 * @typedef ReinhardToneMappingOptions
 * @property {number} [exposure]
 */
