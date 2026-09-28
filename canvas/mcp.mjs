import { realpath } from 'node:fs/promises'
import { resolve } from 'node:path'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { startCanvas } from './server.mjs'
import { patchSchema, importSchema } from './state.mjs'

const server = new McpServer({ name: 'canvas', version: '1.0.0' }), canvases = new Map()
const canvasId = z.string().min(1), revision = z.number().int().nonnegative()
const result = value => ({ content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] })
const guarded = fn => async input => { try { return result(await fn(input)) } catch (e) { return { ...result(e.message), isError: true } } }
async function call(id, path, body) {
  const canvas = canvases.get(id)
  if (!canvas) throw new Error('请先调用 canvas_open_project 打开当前项目')
  const response = await fetch(canvas.base + path, { method: body ? 'POST' : 'GET', headers: { 'x-canvas-token': canvas.token, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error)
  return path === '/api/architecture' ? data.text : data
}

server.registerTool('canvas_open_project', {
  description: 'Open a project canvas from its architecture Markdown, starting the local UI service automatically. Return canvasId and browser URL. Missing Markdown opens an empty page. Use the project absolute path, never the plugin directory. Reopening reloads external Markdown changes only if there are no unsaved canvas changes.',
  inputSchema: { projectPath: z.string().min(1), architecturePath: z.string().default('docs/architecture.md') },
}, guarded(async ({ projectPath, architecturePath }) => {
  const root = await realpath(projectPath), file = resolve(root, architecturePath)
  for (const [id, canvas] of canvases) if (canvas.projectPath === root && canvas.architecturePath === file) {
    const info = await call(id, '/api/reload', {})
    return { canvasId: id, url: canvas.url, ...info }
  }
  const canvas = await startCanvas(root, architecturePath), id = canvas.token
  canvases.set(id, canvas)
  return { canvasId: id, url: canvas.url, projectPath: canvas.projectPath, architecturePath: canvas.architecturePath, hasDraft: canvas.hasDraft }
}))
server.registerTool('canvas_get_context', { description: 'Read latest revision, selection, structured shapes and bindings before editing.', inputSchema: { canvasId } }, guarded(({ canvasId }) => call(canvasId, '/api/context')))
server.registerTool('canvas_read_architecture', { description: 'Export the current canvas as Mermaid Markdown. Snapshot IDs are not editable shape IDs. This does not save the project file.', inputSchema: { canvasId } }, guarded(({ canvasId }) => call(canvasId, '/api/architecture')))
server.registerTool('canvas_import_markdown', { description: 'Append one rectangle-and-arrow Mermaid diagram. Never import a whole diagram again to update existing shapes.', inputSchema: { canvasId, ...importSchema.shape } }, guarded(({ canvasId, ...input }) => call(canvasId, '/api/import', input)))
server.registerTool('canvas_apply_patch', { description: 'Atomically modify selected canvas using its latest baseRevision. Preserve unrelated human edits.', inputSchema: { canvasId, ...patchSchema.shape } }, guarded(({ canvasId, ...input }) => call(canvasId, '/api/patch', input)))
server.registerTool('canvas_undo', { description: 'Undo one transaction without overwriting later edits to its objects.', inputSchema: { canvasId, transactionId: z.string(), baseRevision: revision } }, guarded(({ canvasId, ...input }) => call(canvasId, '/api/undo', input)))
server.registerTool('canvas_save_project', { description: 'Required at the end of the Canvas skill: export latest canvas into the registered project Markdown, preserve surrounding prose, verify saved contents. Reject external Markdown changes or stale revisions. Report errors instead of overwriting conflicts.', inputSchema: { canvasId, baseRevision: revision } }, guarded(({ canvasId, ...input }) => call(canvasId, '/api/save', input)))

const transport = new StdioServerTransport()
await server.connect(transport)
const onclose = transport.onclose
transport.onclose = () => { onclose?.(); void shutdown() }
let stopping = false
async function shutdown() {
  if (stopping) return
  stopping = true
  await Promise.allSettled([...canvases.values()].map(canvas => canvas.close()))
  process.exit(0)
}
process.once('SIGTERM', shutdown)
process.once('SIGINT', shutdown)
