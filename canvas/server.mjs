import http from 'node:http'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve, sep, extname } from 'node:path'
import { openProject } from './project.mjs'
import { exportArchitecture } from './architecture.mjs'

export async function startCanvas(projectPath, architecturePath) {
  const project = await openProject(projectPath, architecturePath)
  const { state } = project, peers = new Set(), token = randomUUID()
  const webRoot = resolve(fileURLToPath(new URL('./web/', import.meta.url)))
  let mutation = Promise.resolve(), port
  const broadcast = () => { for (const peer of peers) peer.write(`data: ${JSON.stringify({ ...state.data, ...project.info() })}\n\n`) }
  const server = http.createServer(async (req, res) => {
    const send = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)) }
    const allowed = new Set([`localhost:${port}`, `127.0.0.1:${port}`])
    if (!allowed.has(req.headers.host)) return send(403, { error: 'Invalid host' })
    if (req.headers.origin && ![...allowed].some(host => req.headers.origin === `http://${host}`)) return send(403, { error: 'Invalid origin' })
    let url
    try { url = new URL(req.url, `http://127.0.0.1:${port}`) } catch { return send(400, { error: 'Invalid URL' }) }
    if (!url.pathname.startsWith('/api/')) {
      if (req.method !== 'GET') return send(405, { error: 'Method not allowed' })
      try {
        const file = resolve(webRoot, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname))
        if (!file.startsWith(webRoot + sep)) return send(403, { error: 'Invalid path' })
        const content = await readFile(file)
        res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' })[extname(file)] ?? 'application/octet-stream' })
        return res.end(content)
      } catch { return send(404, { error: 'Not found' }) }
    }
    if (req.headers['x-canvas-token'] !== token && url.searchParams.get('token') !== token) return send(403, { error: 'Invalid session' })
    if (url.pathname === '/api/events' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' })
      res.write(`data: ${JSON.stringify({ ...state.data, ...project.info() })}\n\n`); peers.add(res)
      req.on('close', () => peers.delete(res))
      return
    }
    if (req.method === 'GET') {
      if (url.pathname === '/api/context') return send(200, { ...state.context(), ...project.info() })
      if (url.pathname === '/api/state') return send(200, { ...state.data, ...project.info() })
      if (url.pathname === '/api/architecture') {
        try { return send(200, { text: exportArchitecture(state.data.records) }) }
        catch (e) { return send(409, { error: e.message }) }
      }
      return send(404, { error: 'Not found' })
    }
    if (req.method !== 'POST') return send(405, { error: 'Method not allowed' })
    try {
      let body = ''
      for await (const chunk of req) { body += chunk; if (body.length > 8_000_000) throw new Error('请求过大') }
      const input = JSON.parse(body)
      mutation = mutation.catch(() => {}).then(async () => {
        if (url.pathname === '/api/save') { const result = await project.save(input.baseRevision); broadcast(); return send(200, result) }
        if (url.pathname === '/api/reload') { await project.reload(); broadcast(); return send(200, project.info()) }
        if (url.pathname === '/api/selection') {
          state.selection = Array.isArray(input.ids) ? input.ids.filter(id => state.data.records[id]?.typeName === 'shape').slice(0, 500) : []
          return send(200, { ok: true })
        }
        const before = structuredClone(state.data)
        try {
          let transaction
          if (url.pathname === '/api/document') transaction = state.commit(input.records, input.baseRevision, 'human', '编辑项目画布')
          else if (url.pathname === '/api/import') transaction = state.importMarkdown(input)
          else if (url.pathname === '/api/patch') transaction = state.patch(input)
          else if (url.pathname === '/api/undo') transaction = state.undo(input.transactionId, input.baseRevision)
          else return send(404, { error: 'Not found' })
          await project.persist(); broadcast(); send(200, { ...state.data, ...project.info(), transaction })
        } catch (e) { state.data = before; throw e }
      })
      await mutation
    } catch (e) { if (!res.headersSent) send(409, { error: e.message }) }
  })
  try {
    await new Promise((ok, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', ok) })
    port = server.address().port
    return { ...project.info(), token, base: `http://127.0.0.1:${port}`, url: `http://127.0.0.1:${port}/#${token}`,
      async close() { for (const peer of peers) peer.end(); await mutation.catch(() => {}); await new Promise(ok => server.close(ok)); await project.close() },
    }
  } catch (e) { await project.close(); throw e }
}
