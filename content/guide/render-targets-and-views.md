---
title: "Render Targets and Views"
---

# Render Targets and Views

This guide assumes you already have a scene rendering from [First Scene](/guide/first-scene).
Here, we focus on where the camera renders and how to split output.

## What You Will Add

- a canvas render target
- an offscreen image render target
- viewport/scissor based view layouts

## Step 1: Import Render Target APIs

```js
import {
  CanvasTarget,
  ImageRenderTarget,
  ViewRectangle,
  Texture,
  TextureType,
  TextureFormat,
  Camera
} from "chorama";
```

Use `CanvasTarget` for on-screen output.
Use `ImageRenderTarget` for offscreen passes.

## Step 2: Create a Canvas Target (Most Common)

```js
const canvasTarget = new CanvasTarget(canvas);
const camera = new Camera(canvasTarget);
```

This is the default path for rendering directly to the page.

## Step 3: Render a Scene to the Canvas Target

```js
renderer.render([object, camera], device);
```

If your scene is blank, first confirm the camera uses the expected target.

## Step 4: Create an Offscreen Image Target

```js
const imageTarget = new ImageRenderTarget({
  width: 1024,
  height: 1024,
  color: [
    new Texture({
      type: TextureType.Texture2D,
      format: TextureFormat.RGBA8Unorm,
      width: 1024,
      height: 1024
    })
  ],
  internalDepthStencil: TextureFormat.Depth24PlusStencil8
});
```

This creates a texture-backed target you can render into.

## Step 5: Render Offscreen with a Dedicated Camera

```js
const offscreenCamera = new Camera(imageTarget);
renderer.render([offscreenObject, offscreenCamera], device);
```

Use a separate camera when offscreen pass framing differs from main pass.

## Step 6: Use Offscreen Output as a Texture

```js
const screenObject = new MeshMaterial3D(
  mesh,
  new BasicMaterial({ mainTexture: imageTarget.color[0] })
);

renderer.render([screenObject, camera], device);
```

This is the core pattern for mirrors, portals, and postprocessing chains.

## Step 7: Split Canvas with Viewports

Use multiple `CanvasTarget` instances on the same canvas.

```js
const leftTarget = new CanvasTarget(canvas);
const rightTarget = new CanvasTarget(canvas);

leftTarget.viewport.offset.set(0, 0);
leftTarget.viewport.size.set(0.5, 1);

rightTarget.viewport.offset.set(0.5, 0);
rightTarget.viewport.size.set(0.5, 1);
```

Viewport values are normalized (0 to 1) relative to full canvas size.

## Step 8: Bind Cameras to Each View and Render

```js
const leftCamera = new Camera(leftTarget);
const rightCamera = new Camera(rightTarget);

renderer.render([scene, leftCamera], device);
renderer.render([scene, rightCamera], device);
```

This gives independent camera views in a single canvas.

## Step 9: Use Scissor for Hard Split/Masking

```js
leftTarget.scissor = new ViewRectangle();
rightTarget.scissor = new ViewRectangle();

leftTarget.scissor.offset.set(0, 0);
leftTarget.scissor.size.set(0.5, 1);

rightTarget.scissor.offset.set(0.5, 0);
rightTarget.scissor.size.set(0.5, 1);
```

Scissor restricts actual draw area, useful for editor layouts and split bars.

## Resize Rule for Multi-View Scenes

Keep canvas size and camera projection in sync on resize.
For split views, compute aspect per view region (not full canvas).

## Reference Examples

- [Basic Canvas Target](/examples/rendertarget/basic_canvas)
- [Image Target](/examples/rendertarget/image_target)
- [Split Screen](/examples/rendertarget/split_screen)
- [Multiple Views](/examples/rendertarget/multiple_views)
- [Split View](/examples/rendertarget/split_view)
