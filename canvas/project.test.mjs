import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { richText } from './state.mjs'

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'gungnir-canvas-test-')), project = join(root, 'project')
  await mkdir(join(project, 'docs'), { recursive: true })
  const client = new Client({ name: 'canvas-project-test', version: '1.0.0' })
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [process.env.CANVAS_TEST_ENTRY ?? fileURLToPath(new URL('./launch.mjs', import.meta.url))], env: { ...process.env, CANVAS_DATA_DIR: join(root, 'data') } }))
  t.after(() => client.close())
  const raw = (name, args) => client.callTool({ name, arguments: args })
  const call = async (name, args) => { const r = await raw(name, args); assert.ok(!r.isError, r.content[0].text); try { return JSON.parse(r.content[0].text) } catch { return r.content[0].text } }
  return { root, project, call, raw }
}

test('installed MCP starts project canvas, preserves human edits, saves prose and reloads external Markdown', async t => {
  const { root, project, call } = await fixture(t)
  const path = join(project, 'docs/architecture.md')
  await writeFile(path, '# 项目说明\n\n```mermaid\nflowchart LR\nA["预约"] -->|"成功后"| B["通知"]\n```\n\n保留这段人工说明。\n')
  const opened = await call('canvas_open_project', { projectPath: project })
  const { canvasId } = opened, url = new URL(opened.url)
  const page = await fetch(opened.url)
  assert.equal(page.status, 200)
  assert.match(await page.text(), /<div id="root">/)
  const headers = { 'Content-Type': 'application/json', 'x-canvas-token': url.hash.slice(1) }
  const before = await call('canvas_get_context', { canvasId })
  assert.equal(before.shapes.filter(s => s.type === 'geo').length, 2)
  const state = await (await fetch(url.origin + '/api/state', { headers })).json()
  const notification = before.shapes.find(s => s.text === '通知').id
  state.records[notification].props.richText = richText('通知：仅站内信')
  state.records[notification].y += 20
  const human = await fetch(url.origin + '/api/document', { method: 'POST', headers, body: JSON.stringify({ baseRevision: state.revision, records: state.records }) })
  assert.equal(human.status, 200)
  const context = await call('canvas_get_context', { canvasId })
  const booking = context.shapes.find(s => s.text === '预约').id
  await call('canvas_apply_patch', { canvasId, baseRevision: context.revision, label: '明确职责', operations: [{ op: 'update', id: booking, text: '预约：校验名额' }] })
  const updated = await call('canvas_get_context', { canvasId })
  assert.deepEqual(updated.shapes.find(s => s.id === notification), context.shapes.find(s => s.id === notification))
  await call('canvas_save_project', { canvasId, baseRevision: updated.revision })
  const saved = await readFile(path, 'utf8')
  assert.match(saved, /^# 项目说明/); assert.match(saved, /保留这段人工说明/)
  assert.match(saved, /通知：仅站内信/); assert.match(saved, /预约：校验名额/)
  const reopened = await call('canvas_open_project', { projectPath: project })
  assert.equal(reopened.canvasId, canvasId)
  await writeFile(path, saved.replace('预约：校验名额', '预约：检查剩余名额'))
  await call('canvas_open_project', { projectPath: project })
  assert.match(await call('canvas_read_architecture', { canvasId }), /检查剩余名额/)
  const blankProject = join(root, 'blank'); await mkdir(blankProject)
  const blank = await call('canvas_open_project', { projectPath: blankProject })
  assert.equal((await call('canvas_get_context', { canvasId: blank.canvasId })).shapes.length, 0)
  assert.notEqual(blank.url, opened.url)
})

test('external file edits and stale revisions cannot be overwritten', async t => {
  const { project, call, raw } = await fixture(t)
  const { canvasId } = await call('canvas_open_project', { projectPath: project })
  await call('canvas_import_markdown', { canvasId, baseRevision: 0, markdown: 'flowchart LR\nA["初版"]' })
  const stale = await raw('canvas_save_project', { canvasId, baseRevision: 0 })
  assert.ok(stale.isError)
  const path = join(project, 'docs/architecture.md'), external = '```mermaid\nflowchart LR\nB["外部修改"]\n```\n'
  await writeFile(path, external)
  const conflict = await raw('canvas_save_project', { canvasId, baseRevision: 1 })
  assert.ok(conflict.isError); assert.match(conflict.content[0].text, /外部修改/)
  assert.equal(await readFile(path, 'utf8'), external)
  assert.ok((await raw('canvas_open_project', { projectPath: project })).isError)
  assert.match(await call('canvas_read_architecture', { canvasId }), /初版/)
})
