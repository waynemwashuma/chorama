---
title: "Scene Graph and Transforms"
---

# Scene Graph and Transforms

This guide assumes you already have a running scene from [First Scene](/guide/first-scene).
Here, we focus on parent-child relationships and transform behavior.

## What You Will Add

- a parent object
- one or more child objects
- local transforms per node
- frame updates that propagate through hierarchy

## Step 1: Import What You Need

```js
import { Object3D, MeshMaterial3D, Quaternion } from "chorama";
```

Use `Object3D` for grouping and transform hierarchy.
Use `MeshMaterial3D` when the node should be renderable.

## Step 2: Create Parent and Child Nodes

```js
const root = new Object3D();
const parent = new MeshMaterial3D(mesh, material);
const child = new MeshMaterial3D(mesh, material);
```

`root` is a logical container.
`parent` and `child` are visible mesh nodes.

## Step 3: Build the Hierarchy

```js
root.add(parent);
parent.add(child);
```

Now `child` inherits `parent` transform changes.
If parent rotates or moves, child follows automatically.

## Step 4: Set Local Transforms

```js
parent.transform.position.x = 0;
child.transform.position.x = 1;
```

`child.transform.position.x = 1` means "one unit from parent", not world origin.
Think in local space first when building hierarchies.

## Step 5: Animate the Parent

```js
const stepRotation = Quaternion.fromEuler(0.01, 0.01, 0.0);

function updateScene() {
  parent.transform.orientation.multiply(stepRotation);
}
```

Rotating the parent creates orbital motion for the child due to inheritance.
This is the simplest way to verify propagation is working.

## Step 6: Render the Hierarchy

```js
function frame() {
  updateScene();
  renderer.render([root, camera], device);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
```

You can render the root and let traversal include descendants.
You do not need to pass every child separately if already attached.

## Traverse the Graph for Bulk Operations

```js
root.traverseDFS((node) => {
  // Example: debug flags, tagging, filtering, or custom updates
  return true;
});
```

Use traversal when you need one operation across many descendants.
Return `true` to continue deeper traversal.

## Reparent Safely

```js
const newParent = new Object3D();
root.add(newParent);
newParent.add(child);
parent.remove(child);
```

Reparenting changes which transform chain affects the object.

## Reference Examples

- [Transform Propagation](/examples/transform/propagation)
- [Skinning](/examples/mesh/skinning)

After this works, continue with [Render Targets and Views](/guide/render-targets-and-views)