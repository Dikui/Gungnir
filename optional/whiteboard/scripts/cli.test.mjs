import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, symlink, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { delimiter, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { patchRuntime, patchServerSource } from './cli.mjs'

assert.ok(process.argv[2], 'Usage: node cli.test.mjs <path-to-mcp-excalidraw-server>')
const runtime = resolve(process.argv[2])
await patchRuntime(runtime)
const serverSource = await readFile(join(runtime, 'dist/server.js'), 'utf8')
assert.equal(patchServerSource(patchServerSource(serverSource)), patchServerSource(serverSource), 'patch must be idempotent')
assert.throws(() => patchServerSource('unsupported runtime'), /Unsupported canvas server/)
const temp = await mkdtemp(join(tmpdir(), 'whiteboard-bindings-'))
const portProbe = createServer()
await new Promise(resolve => portProbe.listen(0, '127.0.0.1', resolve))
const url = `http://127.0.0.1:${portProbe.address().port}`
await new Promise(resolve => portProbe.close(resolve))
const execute = promisify(execFile)
const env = { ...process.env, EXCALIDRAW_NO_AUTOSTART: '1', LOG_FILE_PATH: join(temp, 'runtime.log') }
const cli = async (...args) => {
  const { stdout } = await execute(process.execPath, [join(runtime, 'dist/bin.js'), '--url', url, ...args], { cwd: temp, env })
  return JSON.parse(stdout)
}

// Browser-synced/imported arrows have native bindings, without CLI start/end refs.
const fixture = join(temp, 'elements.json')
await writeFile(fixture, JSON.stringify([
  { id: 'source', type: 'rectangle', x: 100, y: 100, width: 180, height: 80 },
  { id: 'target', type: 'rectangle', x: 400, y: 100, width: 180, height: 80 },
  { id: 'arrow', type: 'arrow', x: 285, y: 140, width: 107, height: 0, points: [[0, 0], [107, 0]],
    startBinding: { elementId: 'source', focus: 0, gap: 8 }, endBinding: { elementId: 'target', focus: 0, gap: 8 } },
  { id: 'polyline', type: 'arrow', x: 288, y: 140, width: 190, height: 120,
    points: [[0, 0], [80, -120], [190, -120], [104, 0]],
    startBinding: { elementId: 'source', focus: 0, gap: 8 }, endBinding: { elementId: 'target', focus: 0, gap: 8 } }
]))
const absolutePoints = element => element.points.map(([x, y]) => [element.x + x, element.y + y])

let started = false
try {
  const result = await cli('start')
  started = result.spawned
  assert.ok(started, 'test must own its isolated canvas')
  const linkedCli = join(temp, 'linked-cli.mjs')
  await symlink(fileURLToPath(new URL('./cli.mjs', import.meta.url)), linkedCli)
  const { stdout } = await execute(process.execPath, [linkedCli, '--url', url, 'status'], {
    cwd: temp, env: { ...env, PATH: `${join(runtime, '../.bin')}${delimiter}${env.PATH ?? ''}` }
  })
  assert.equal(JSON.parse(stdout).running, true, 'symlink installations must run the launcher')
  await cli('add', fixture)
  assert.equal((await cli('get', 'arrow')).x, 285, 'importing native bindings must preserve existing geometry')
  const originalPolyline = absolutePoints(await cli('get', 'polyline'))
  await cli('update', 'target', '--set', '{"x":450}')
  const arrow = await cli('get', 'arrow')
  assert.equal(arrow.x + arrow.points.at(-1)[0], 442, 'arrow tip must follow target edge with 8px gap')
  assert.equal(arrow.width, 154, 'stored arrow dimensions must match its new points')
  assert.equal(arrow.endBinding.elementId, 'target')
  const movedPolyline = absolutePoints(await cli('get', 'polyline'))
  assert.deepEqual(movedPolyline.slice(1, -1), originalPolyline.slice(1, -1), 'moving the target must preserve both manual bends in canvas coordinates')
  assert.deepEqual(movedPolyline[0], originalPolyline[0], 'stationary source endpoint must stay put')
  assert.deepEqual(movedPolyline.at(-1), [originalPolyline.at(-1)[0] + 50, originalPolyline.at(-1)[1]])

  const patch = join(temp, 'patch.json')
  await writeFile(patch, JSON.stringify({ update: [{ id: 'source', set: { y: 200 } }] }))
  await cli('apply', patch)
  const updated = await cli('get', 'arrow')
  assert.notEqual(updated.y, arrow.y, 'apply must reroute the source endpoint too')
  assert.equal(updated.startBinding.elementId, 'source')
  const polyline = await cli('get', 'polyline')
  const finalPoints = absolutePoints(polyline)
  assert.deepEqual(finalPoints.slice(1, -1), originalPolyline.slice(1, -1), 'moving the source must preserve manual bends after rebasing the origin')
  assert.deepEqual(finalPoints[0], [originalPolyline[0][0], originalPolyline[0][1] + 100])
  assert.deepEqual(finalPoints.at(-1), movedPolyline.at(-1), 'stationary target endpoint must stay put')
  assert.equal(polyline.width, 190, 'width must include all bends')
  assert.equal(polyline.height, 220, 'height must include all bends')
  assert.equal(polyline.startBinding.elementId, 'source')
  assert.equal(polyline.endBinding.elementId, 'target')
  console.log('PASS: update/apply keep manual bends and stationary endpoints; moving endpoints, extents and bindings are correct')
} finally {
  if (started) await cli('stop')
}
