/** @import { RenderGraphContext } from "./rendergraph.js" */
import { assert } from "../../utils/index.js"
import { Views } from "../views.js"

export class SortViewsNode {
  subgraph() {
    return undefined
  }

  /**
   * @param {RenderGraphContext} context
   */
  execute(context) {
    const views = context.renderer.getResource(Views)

    assert(views, "Views resource missing")

    const sorted = views.items()
      .map((view, index) => ({ view, index }))
      .sort((a, b) => {
        const order = a.view.order - b.view.order

        if (order !== 0) {
          return order
        }

        return a.index - b.index
      })
      .map((entry) => entry.view)

    views.clear()
    views.push(...sorted)
  }
}
