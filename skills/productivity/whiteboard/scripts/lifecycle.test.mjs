import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { chmod, copyFile, mkdir, mkdtemp, readFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { delimiter, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

assert.ok(process.argv[2] && process.argv[3], 'Usage: node lifecycle.test.mjs <runtime> <playwright/index.mjs>')
const runtime = resolve(process.argv[2])
const { chromium } = await import(pathToFileURL(resolve(process.argv[3])).href)
const temp = await mkdtemp(join(tmpdir(), 'whiteboard-lifecycle-'))
const probe = createServer()
await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve))
const url = `http://127.0.0.1:${probe.address().port}`
await new Promise(resolve => probe.close(resolve))
const execute = promisify(execFile)
const env = { ...process.env, LOG_FILE_PATH: join(temp, 'runtime.log'), PATH: `${join(runtime, '../.bin')}${delimiter}${process.env.PATH}` }
const cli = async (...args) => {
  const { stdout } = await execute(process.execPath, [fileURLToPath(new URL('./cli.mjs', import.meta.url)), '--url', url, ...args], { cwd: temp, env })
  return JSON.parse(stdout)
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const waitForExit = async () => {
  const deadline = Date.now() + 5000
  while (Date.now() < deadline) {
    try { await cli('status') }
    catch (error) {
      assert.equal(error.code, 3)
      assert.equal(JSON.parse(error.stdout).running, false)
      return
    }
    await pause(300)
  }
  assert.fail('current whiteboard must exit after clicking Close')
}
const browser = await chromium.launch({ channel: 'chromium', headless: true })
const context = await browser.newContext({ viewport: { width: 1200, height: 800 } })
const open = async () => {
  const page = await context.newPage()
  await page.goto(url)
  await page.getByRole('button', { name: 'Sync to Backend', exact: true }).waitFor()
  await page.waitForFunction(() => !document.querySelector('.sync-controls button').disabled)
  return page
}

try {
  assert.equal((await cli('start')).spawned, true)
  const first = await open()
  const second = await open()
  await first.close()
  await second.reload()
  await second.waitForFunction(() => !document.querySelector('.sync-controls button').disabled)
  await second.close()
  await pause(10500)
  assert.equal((await cli('status')).running, true, 'closing every browser page must leave the service running')
  const page = await open()
  const another = await open()
  for (const [canvas, tool, x] of [[page, 'Rectangle', 500], [another, 'Ellipse', 800]]) {
    await canvas.locator('label').filter({ has: canvas.getByRole('radio', { name: tool, exact: true }) }).click()
    await canvas.mouse.move(x, 300)
    await canvas.mouse.down()
    await canvas.mouse.move(x + 100, 450)
    await canvas.mouse.up()
    if (canvas === page) await canvas.close()
  }
  const observer = await open()
  await another.getByRole('button', { name: 'Close', exact: true }).click()
  await waitForExit()
  await observer.getByRole('status').filter({ hasText: 'Service closed' }).waitFor()
  assert.equal(await observer.getByRole('button', { name: 'Closed', exact: true }).isDisabled(), true)
  const archive = join(temp, 'whiteboard.excalidraw')
  const saved = JSON.parse(await readFile(archive, 'utf8'))
  assert.equal(saved.type, 'excalidraw')
  assert.equal(saved.elements.filter(element => element.type === 'rectangle').length, 1)
  assert.equal(saved.elements.filter(element => element.type === 'ellipse').length, 1, 'both pages must edit the same diagram')
  const continued = join(temp, 'continued.excalidraw')
  await copyFile(archive, continued)
  await cli('start', '--file', continued)
  assert.equal((await cli('start')).spawned, false, 'continue using the current service and its archive')
  const id = saved.elements.find(element => element.type === 'rectangle').id
  const restored = await cli('get', id)
  assert.equal(restored.type, 'rectangle')
  await cli('update', id, '--set', '{"x":999}')
  const continuedPage = await open()
  await continuedPage.setViewportSize({ width: 375, height: 700 })
  const close = continuedPage.getByRole('button', { name: 'Close', exact: true })
  const bounds = await close.boundingBox()
  assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 375, 'Close must remain visible on a narrow viewport')
  await close.focus()
  await continuedPage.keyboard.press('Enter')
  await waitForExit()
  await cli('start', '--file', continued)
  assert.equal((await cli('get', id)).x, 999, 'the next iteration must update and restore the same file')
  await cli('stop')
  console.log('PASS: closing tabs keeps the service running; Close saves, exits and restores; keyboard and narrow viewport work')

  // One critical failure path: an unwritable directory must not destroy the old archive.
  const locked = join(temp, 'locked')
  await mkdir(locked)
  const previous = join(locked, 'previous.excalidraw')
  await copyFile(continued, previous)
  const before = await readFile(previous, 'utf8')
  try {
    await cli('start', '--file', previous)
    await cli('update', id, '--set', '{"x":444}')
    const page = await open()
    await chmod(locked, 0o500)
    await page.getByRole('button', { name: 'Close', exact: true }).click()
    await waitForExit()
    await page.getByRole('alert').filter({ hasText: 'previous archive was kept' }).waitFor()
    assert.equal(await readFile(previous, 'utf8'), before, 'failed saving must preserve the previous archive byte for byte')
    assert.match(await readFile(join(temp, 'runtime.log'), 'utf8'), /Whiteboard save failed; keeping previous archive/)
  } finally {
    await chmod(locked, 0o700)
  }
  await cli('start', '--file', previous)
  assert.equal((await cli('get', id)).x, 999, 'the last good archive must still recover after a failed save')
  console.log('PASS: save failure still exits, logs the error, and leaves the previous archive recoverable')
} finally {
  await context.close()
  await browser.close()
  await cli('stop').catch(() => {})
}
