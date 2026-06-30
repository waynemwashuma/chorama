import Stats from "stats.js";
import {
  MeshMaterial3D,
  BasicMaterial,
  Quaternion,
  WebGLRenderer,
  TextureLoader,
  PerspectiveProjection,
  Camera,
  WebGLRenderDevice,
  PlaneMeshBuilder,
  Circle3DMeshBuilder,
  CuboidMeshBuilder,
  UVSphereMeshBuilder,
  CylinderMeshBuilder,
  MeshMaterialPlugin,
  CanvasTarget,
  CameraPlugin
} from "chorama"

// performance monitor
const stats = new Stats()
stats.showPanel(1)
document.body.append(stats.dom)
stats.dom.removeAttribute('style')
stats.dom.classList.add('performance-monitor')

const canvas = document.createElement('canvas')
const renderDevice = new WebGLRenderDevice(canvas,{
  depth:true
})
const renderTarget = new CanvasTarget(canvas)
const renderer = new WebGLRenderer({
  plugins:[
    new CameraPlugin(),
    new MeshMaterialPlugin(),
  ]
})
const camera = new Camera(renderTarget)

const textureLoader = new TextureLoader()
const texture = textureLoader.load({
  paths: ["/images/uv.jpg"],
  flipY: true
})
const material = new BasicMaterial({
  mainTexture: texture
})

const meshes = [
  new PlaneMeshBuilder().build(),
  new Circle3DMeshBuilder().build(),
  new CuboidMeshBuilder(). build(),
  new UVSphereMeshBuilder().build(),
  new CylinderMeshBuilder().build(),
]

//create objects
const objects = meshes.map(mesh => new MeshMaterial3D(mesh, material))

//transform objects to thier positions
objects.forEach((object, i) => {
  const stepX = 1.6
  const stepY = 2
  const startX = -1.6
  const startY = 1.6
  const number = 3

  object.transform.position.x = startX + stepX * (i % number)
  object.transform.position.y = startY - Math.floor(i / number) * stepY
})

//set up the camera
camera.transform.position.z = 5
if (camera.projection instanceof PerspectiveProjection) {
  camera.projection.fov = Math.PI / 180 * 120
  camera.projection.aspect = innerWidth / innerHeight
}


const rotation = Quaternion.fromEuler(Math.PI / 1000, Math.PI / 1000, 0)

document.body.append(canvas)
addEventListener("resize", updateView)
updateView()
requestAnimationFrame(update)

function update() {
  stats.begin()
  objects.forEach(object => object.transform.orientation.multiply(rotation))
  renderer.render([...objects, camera],renderDevice)
  stats.end()

  requestAnimationFrame(update)
}

function updateView() {
  canvas.style.width = innerWidth + "px"
  canvas.style.height = innerHeight + "px"
  canvas.width = innerWidth * devicePixelRatio
  canvas.height = innerHeight * devicePixelRatio

  if (camera.projection instanceof PerspectiveProjection) {
    camera.projection.aspect = innerWidth / innerHeight
  }
}