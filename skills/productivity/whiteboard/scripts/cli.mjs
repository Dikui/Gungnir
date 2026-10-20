import { readFile, realpath, rename, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { delimiter, dirname, join, resolve } from 'node:path'
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
  let patched = (source.slice(0, start) + replacement + source.slice(end)).replace(oldCall, newCall)
  if (!patched.includes('// Gungnir whiteboard lifecycle')) {
    const anchor = 'const clients = new Set();'
    if (!patched.includes(anchor) || !patched.includes('pid: process.pid\n')) throw new Error('Unsupported canvas server: lifecycle anchors changed')
    patched = `import { installWhiteboard } from './gungnir-lifecycle.mjs';\nimport { expandElementsForExport } from './core/expand-elements.js';\n${patched}`
    patched = patched.replace(anchor, `${anchor}\n// Gungnir whiteboard lifecycle\nconst whiteboard = installWhiteboard({ wss, elements, files, expandElementsForExport, logger });`)
    patched = patched.replace('pid: process.pid\n', 'pid: process.pid,\n        whiteboard\n')
  }
  return patched
}

function patchFrontend(source) {
  const installed = source.includes('/* Gungnir immediate sync */')
  if (!installed && createHash('sha256').update(source).digest('hex') !== 'c86362e68fc33bcfe8d197ea28e0c11ae5134b08575c9a89d93679571186f16d') throw new Error('Unsupported canvas frontend: bundle changed')
  const start = installed ? source.search(/H=async\([^)]*\)=>\{\/\* Gungnir immediate sync \*\//) : source.indexOf('H=async(B={})=>')
  const end = source.indexOf(',X=async()=>', start)
  if (start < 0 || end < 0) throw new Error('Unsupported canvas frontend: sync anchors changed')
  // WebSocket frames stay ordered and drain before a normal page close.
  const sync = `H=async(B={})=>{/* Gungnir immediate sync */
    if(!P()||!n.current)return;
    const api=n.current,scene=api.getSceneElements().filter(el=>!el.isDeleted);
    const ids=new Set(scene.filter(el=>el.type==="image").map(el=>el.fileId));
    const images=Object.values(api.getFiles()).filter(image=>ids.has(image.id)&&!w.current.has(image.id));
    const payload=JSON.stringify({type:"gungnir_scene",elements:scene,files:images});
    if(B.baseline){U.current=payload;return}
    if(U.current===payload)return;U.current=payload;
    a.current.send(payload);
    l("syncing")
  },G=()=>{if(P()&&e&&v.current&&y.current===0)void H()}`
  source = (source.slice(0, start) + sync + source.slice(end))
    .replace('case"elements_synced":console.log(', 'case"elements_synced":f(new Date),l("idle"),console.log(')
  if (!source.includes('/* Gungnir remote baseline */')) {
    const anchor = 'k.current="ready",S("ready")};'
    if (!source.includes(anchor)) throw new Error('Unsupported canvas frontend: scene load anchor changed')
    source = source.replace(anchor, 'k.current="ready",S("ready"),H({baseline:!0})/* Gungnir remote baseline */};')
  }
  if (!source.includes('/* Gungnir close sync */')) {
    const anchor = ';return m.jsxs("div",{className:"app"'
    if (!source.includes(anchor)) throw new Error('Unsupported canvas frontend: close hook anchor changed')
    source = source.replace(anchor, `;A.useEffect(()=>{/* Gungnir close sync */
      const flush=()=>{if(v.current&&k.current==="ready")void H()};
      window.addEventListener("pagehide",flush);
      return()=>window.removeEventListener("pagehide",flush)
    },[]);return m.jsxs("div",{className:"app"`)
  }
  return source
}

async function replaceRuntimeFile(file, source) {
  const original = await readFile(file, 'utf8').catch(error => { if (error.code !== 'ENOENT') throw error })
  if (original === source) return
  const pending = `${file}.gungnir-${process.pid}`
  await writeFile(pending, source)
  await rename(pending, file)
}

export async function patchRuntime(runtime) {
  const pkg = JSON.parse(await readFile(join(runtime, 'package.json'), 'utf8'))
  if (pkg.name !== 'mcp-excalidraw-server' || pkg.version !== '2.1.2') throw new Error('Whiteboard requires mcp-excalidraw-server@2.1.2')
  const server = join(runtime, 'dist/server.js')
  const frontend = join(runtime, 'dist/frontend/assets/index-D9q52cJ-.js')
  const patched = patchServerSource(await readFile(server, 'utf8'))
  const browser = patchFrontend(await readFile(frontend, 'utf8'))
  await replaceRuntimeFile(join(runtime, 'dist/gungnir-lifecycle.mjs'), await readFile(new URL('./lifecycle.mjs', import.meta.url), 'utf8'))
  await replaceRuntimeFile(frontend, browser)
  await replaceRuntimeFile(server, patched)
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
    const runtime = await findRuntime()
    const bin = await patchRuntime(runtime)
    process.env.EXCALIDRAW_NO_AUTOSTART = '1'
    const args = process.argv.slice(2)
    for (let index = 0; index < args.length; index++) {
      if (args[index] === '--url') {
        process.env.EXPRESS_SERVER_URL = args[index + 1]
        args.splice(index, 2)
        break
      }
      if (args[index].startsWith('--url=')) {
        process.env.EXPRESS_SERVER_URL = args[index].slice(6)
        args.splice(index, 1)
        break
      }
    }
    if (args[0] === 'start') {
      const { parseArgs } = await import(pathToFileURL(join(runtime, 'dist/cli/args.js')).href)
      const { flags, positionals } = parseArgs(args.slice(1), { file: { takesValue: true } })
      if (positionals.length) throw new Error('Usage: start [--file <archive.excalidraw>]')
      process.env.GUNGNIR_WHITEBOARD_FILE = resolve(flags.file || 'whiteboard.excalidraw')
      const { ensureCanvasRunning } = await import(pathToFileURL(join(runtime, 'dist/core/spawn.js')).href)
      const { getHealth } = await import(pathToFileURL(join(runtime, 'dist/core/canvas-client.js')).href)
      const result = await ensureCanvasRunning({ force: true })
      const health = await getHealth()
      if (!health.whiteboard) throw new Error('Existing canvas needs a one-time upgrade: export its scene, stop it, then start through this launcher and reload browser pages.')
      if (flags.file && health.whiteboard.file !== process.env.GUNGNIR_WHITEBOARD_FILE) throw new Error(`Current canvas uses ${health.whiteboard.file}; requested archive was not loaded`)
      console.log(JSON.stringify({ running: true, ...result, pid: health.pid, file: health.whiteboard.file }))
    } else {
      await import(pathToFileURL(bin).href)
    }
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
