import { build } from 'vite'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('.', import.meta.url))
await build({ root, cacheDir: root + 'node_modules/.vite', build: { outDir: 'dist/web' } })
// Vite already depends on esbuild; reuse it to ship a server with no runtime npm dependencies.
const { build: bundle } = createRequire(import.meta.resolve('vite'))('esbuild')
await bundle({ entryPoints: [root + 'mcp.mjs'], outfile: root + 'dist/mcp.mjs', bundle: true, platform: 'node', format: 'esm', target: 'node22',
  banner: { js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);" },
})
