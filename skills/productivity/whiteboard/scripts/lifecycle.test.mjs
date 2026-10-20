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
  const deadline = Date.now() + 14000
  while (Date.now() < deadline) {
    try { await cli('status') }
    catch (error) {
      assert.equal(error.code, 3)
      assert.equal(JSON.parse(error.stdout).running, false)
      return
    }
    await pause(300)
  }
  assert.fail('current whiteboard must exit after the last page closes')
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
  await pause(10500)
  assert.equal((await cli('status')).running, true, 'a service with no page opened must stay running')
  const first = await open()
  const second = await open()
  await first.close()
  await pause(10500)
  assert.equal((await cli('status')).running, true, 'another open page must keep the service running')
  await second.reload()
  await second.waitForFunction(() => !document.querySelector('.sync-controls button').disabled)
  await second.close()
  await pause(1000)
  const page = await open()
  await pause(10500)
  assert.equal((await cli('status')).running, true, 'reconnecting must cancel the pending exit')
  await page.locator('label').filter({ has: page.getByRole('radio', { name: 'Rectangle', exact: true }) }).click()
  await page.mouse.move(500, 300)
  await page.mouse.down()
  await page.mouse.move(700, 450)
  await page.mouse.up()
  // Close immediately, before the upstream 1.2s sync debounce can run.
  await page.close()
  const closedAt = Date.now()
  await waitForExit()
  assert.ok(Date.now() - closedAt >= 9500, 'exit must allow the 10s reconnect window')
  const archive = join(temp, 'whiteboard.excalidraw')
  const saved = JSON.parse(await readFile(archive, 'utf8'))
  assert.equal(saved.type, 'excalidraw')
  assert.equal(saved.elements.filter(element => element.type === 'rectangle').length, 1)
  const continued = join(temp, 'continued.excalidraw')
  await copyFile(archive, continued)
  await cli('start', '--file', continued)
  assert.equal((await cli('start')).spawned, false, 'continue using the current service and its archive')
  const id = saved.elements.find(element => element.type === 'rectangle').id
  const restored = await cli('get', id)
  assert.equal(restored.type, 'rectangle')
  await cli('update', id, '--set', '{"x":999}')
  await (await open()).close()
  await waitForExit()
  await cli('start', '--file', continued)
  assert.equal((await cli('get', id)).x, 999, 'the next iteration must update and restore the same file')
  await cli('stop')
  console.log('PASS: no-page, multiple pages, refresh, reconnect, immediate close and repeated diagram recovery')

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
    await page.close()
    await waitForExit()
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
