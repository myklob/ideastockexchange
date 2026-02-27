/**
 * build.js — bundles src/cli.js into dist/cli.js
 *
 * No external bundler required: just copies the file and marks it executable.
 * For a production build with tree-shaking, replace this with esbuild:
 *   npx esbuild src/cli.js --bundle --platform=node --outfile=dist/cli.js
 */
const fs = require('fs')
const path = require('path')

const src = path.join(__dirname, 'src', 'cli.js')
const dist = path.join(__dirname, 'dist')
const out = path.join(dist, 'cli.js')

if (!fs.existsSync(dist)) fs.mkdirSync(dist, { recursive: true })
fs.copyFileSync(src, out)
fs.chmodSync(out, 0o755)

console.log(`Built: ${out}`)
