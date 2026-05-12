declare module "*.glsl" {
  const source: string;

  export default source;
}

// Assisted by ChatGPT 5.3 Codex
declare module "@examples/rendergraph_gui" {
  export function addRenderGraphGuiAddon(options: {
    gui: import("dat.gui").GUI
    renderer: import("chorama").WebGLRenderer
    title?: string
    position?: { x: number; y: number }
    width?: number
  }): {
    refresh: () => void
    dispose: () => void
  }
}
