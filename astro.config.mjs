import { defineConfig } from "astro/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import remarkGfm from "remark-gfm";
import remarkGithubBlockquoteAlert from "remark-github-blockquote-alert";
import remarkLinkBase from "./website/plugins/remark-link-base.js";

function glsl() {
  return {
    name: "glsl",
    enforce: "pre",
    load(id) {
      if (!id.endsWith(".glsl")) {
        return null;
      }

      return `export default ${JSON.stringify(readFileSync(id, "utf8"))}`;
    },
  };
}

export default defineConfig({
  output:'static',
  srcDir: "./website",
  publicDir: "./assets",
  outDir: "./dist/website",
  vite: {
    plugins: [glsl()],
    resolve: {
      alias: {
        "chorama": path.resolve("./src/index.js"),
        "@configs": path.resolve("./website/config"),
        "@layouts": path.resolve("./website/layouts"),
        "@components": path.resolve("./website/components"),
      }
    }
  },
  markdown: {
    remarkPlugins: [
      remarkGfm,
      remarkGithubBlockquoteAlert,
      remarkLinkBase,
    ],
  },
});
