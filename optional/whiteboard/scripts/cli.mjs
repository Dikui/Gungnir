import { readFile, realpath, rename, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { delimiter, dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

// Injected into the upstream server, where elements and geometry helpers exist.
function rerouteBoundArrows(movedId, previousElement) {
  const rerouted = []
  const moved = elements.get(movedId)
  elements.forEach(el => {
    if (el.type !== 'arrow' && el.type !== 'line') return
    const startRef = el.startBinding?.elementId ? { id: el.startBinding.elementId } : el.start
    const endRef = el.endBinding?.elementId ? { id: el.endBinding.elementId } : el.end
    if (startRef?.id !== movedId && endRef?.id !== movedId) return
    if (el.points?.length > 2 && previousElement) {
      const points = el.points.map(([x, y]) => [el.x + x, el.y + y])
      for (const [index, ref, binding] of [[0, startRef, el.startBinding], [points.length - 1, endRef, el.endBinding]]) {
        if (ref?.id !== movedId) continue
        if (moved.width === previousElement.width && moved.height === previousElement.height) {
          points[index] = [points[index][0] + moved.x - previousElement.x, points[index][1] + moved.y - previousElement.y]
        } else {
          const adjacent = points[index === 0 ? 1 : points.length - 2]
          const edge = computeEdgePoint(moved, adjacent[0], adjacent[1])
          const dx = adjacent[0] - edge.x
          const dy = adjacent[1] - edge.y
          const distance = Math.hypot(dx, dy) || 1
          const gap = binding?.gap ?? 8
          points[index] = [edge.x + dx / distance * gap, edge.y + dy / distance * gap]
        }
      }
      el.x = points[0][0]
      el.y = points[0][1]
      el.points = points.map(([x, y]) => [x - el.x, y - el.y])
    } else {
      const routed = { ...el, start: startRef, end: endRef }
      resolveArrowBindings([routed])
      el.x = routed.x
      el.y = routed.y
      el.points = routed.points
    }
    const xs = el.points.map(point => point[0])
    const ys = el.points.map(point => point[1])
    el.width = Math.max(...xs) - Math.min(...xs)
    el.height = Math.max(...ys) - Math.min(...ys)
    el.updatedAt = new Date().toISOString()
    el.version = (el.version || 0) + 1
    rerouted.push(el)
  })
  return rerouted
}

export function patchServerSource(source) {
  const start = source.indexOf('function rerouteBoundArrows(')
  const end = source.indexOf('\n// Batch create elements', start)
  if (start < 0 || end < 0) throw new Error('Unsupported canvas server: rerouting function not found')
  const block = source.slice(start, end)
  const replacement = `${rerouteBoundArrows.toString()}\n`
  // Published 2.1.2 and the previous Gungnir binding fix are the only upgrade inputs.
  const supported = ['82665bec7d6cc79f7a9e4cfd6d507180aaf5435f0d294e961c64f28dabb73937', '6c1facf17e618cf62dc057342e6f99ebabdb5e3a74027f30b082b784811ea55f']
  if (block !== replacement && !supported.includes(createHash('sha256').update(block).digest('hex'))) throw new Error('Unsupported canvas server: rerouting code changed')
  const oldCall = 'rerouteBoundArrows(id)'
  const newCall = 'rerouteBoundArrows(id, existingElement)'
  if (!source.includes(oldCall) && !source.includes(newCall)) throw new Error('Unsupported canvas server: geometry update caller changed')
  return (source.slice(0, start) + replacement + source.slice(end)).replace(oldCall, newCall)
}

export async function patchRuntime(runtime) {
  const pkg = JSON.parse(await readFile(join(runtime, 'package.json'), 'utf8'))
  if (pkg.name !== 'mcp-excalidraw-server' || pkg.version !== '2.1.2') throw new Error('Whiteboard requires mcp-excalidraw-server@2.1.2')
  const server = join(runtime, 'dist/server.js')
  const original = await readFile(server, 'utf8')
  const patched = patchServerSource(original)
  if (patched !== original) {
    const pending = `${server}.gungnir-${process.pid}`
    await writeFile(pending, patched)
    await rename(pending, server)
  }
  return join(runtime, 'dist/bin.js')
}

async function findRuntime() {
  for (const directory of (process.env.PATH ?? '').split(delimiter)) {
    let bin
    try { bin = await realpath(join(directory, 'mcp-excalidraw-server')) }
    catch (error) { if (error.code === 'ENOENT') continue; throw error }
    return dirname(dirname(bin))
  }
  throw new Error('Run with npx -y --package=mcp-excalidraw-server@2.1.2 -- node <skill>/scripts/cli.mjs <command>')
}

const entrypoint = process.argv[1] && await realpath(process.argv[1]).catch(() => null)
if (entrypoint && pathToFileURL(entrypoint).href === import.meta.url) {
  try {
    if (process.argv.length < 3) throw new Error('A whiteboard CLI command is required')
    const bin = await patchRuntime(await findRuntime())
    process.env.EXCALIDRAW_NO_AUTOSTART = '1'
    await import(pathToFileURL(bin).href)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
