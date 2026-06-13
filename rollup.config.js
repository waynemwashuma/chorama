import { readFileSync } from "fs"
import { resolve } from "path"
import { cwd } from "process"
import nodeResolve from "@rollup/plugin-node-resolve"

const pkg = JSON.parse(readFileSync(resolve(cwd(), "./package.json")).toString())

const input = "src/index.js"
const created = `2023-${new Date().getFullYear()}`
const name = pkg.name.toUpperCase()
  .replace("@", "")
  .replaceAll("/", "_")
  .replaceAll("-", "_")
const banner = `/*
 * @author ${pkg.author}
 * @copyright  ${created} ${pkg.author}
 * {@link ${pkg.repository.url}}
 *
 * @license ${pkg.license}
 * @version ${pkg.version}
 */`

function glsl() {
  return {
    name: "glsl",
    load(id) {
      if (!id.endsWith(".glsl")) {
        return null
      }
      return `export default ${JSON.stringify(readFileSync(id, "utf8"))}`
    }
  }
}

const plugins = [
  glsl(),
  nodeResolve()
]
export default [{

  // UMD
  input,
  plugins,
  output: {
    file: "dist/index.umd.js",
    format: "umd",
    name,
    esModule: false,
    exports: "named",
    sourcemap: true,
    banner
  }
},
{

  // ESM
  input,
  plugins,
  output: {
    file: "dist/index.module.js",
    format: "esm",
    exports: "named",
    sourcemap: true,
    banner
  },
}]
