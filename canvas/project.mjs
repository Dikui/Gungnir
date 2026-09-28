import { createHash, randomUUID } from 'node:crypto'
import { homedir } from 'node:os'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { mkdir, open, readFile, realpath, rename, rm, stat, writeFile } from 'node:fs/promises'
import { createTLSchema } from '@tldraw/tlschema'
import { CanvasState } from './state.mjs'
import { architectureRecords, exportArchitecture, parseArchitecture } from './architecture.mjs'

const hash = text => createHash('sha256').update(text ?? '\0missing').digest('hex')
const readOptional = async path => { try { return await readFile(path, 'utf8') } catch (e) { if (e.code === 'ENOENT') return null; throw e } }
const blocks = /^[ \t]*```mermaid[^\S\r\n]*\r?\n[\s\S]*?^[ \t]*```[^\S\r\n]*(?:\r?\n|$)/gmi

// Resolve existing symlinks before allowing writes, including a not-yet-created docs directory.
async function projectFile(root, path) {
  let existing = resolve(root, path), suffix = []
  while (true) {
    try { existing = await realpath(existing); break }
    catch (e) { if (e.code !== 'ENOENT') throw e; suffix.unshift(existing.split(/[\\/]/).at(-1)); existing = dirname(existing) }
  }
  const target = join(existing, ...suffix), rel = relative(root, target)
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw new Error('框架图必须位于当前项目内')
  return target
}

async function atomicWrite(path, text) {
  await mkdir(dirname(path), { recursive: true })
  const temp = `${path}.${randomUUID()}.tmp`
  let mode = 0o600
  try { mode = (await stat(path)).mode } catch (e) { if (e.code !== 'ENOENT') throw e }
  try { await writeFile(temp, text, { mode }); await rename(temp, path) }
  finally { await rm(temp, { force: true }) }
}

export async function openProject(projectPath, architecturePath = 'docs/architecture.md') {
  const root = await realpath(projectPath)
  if (!(await stat(root)).isDirectory()) throw new Error('项目路径必须是目录')
  const file = await projectFile(root, architecturePath)
  if (!file.endsWith('.md')) throw new Error('项目结构图必须是 Markdown 文件')
  const dataDir = join(process.env.CANVAS_DATA_DIR ?? join(homedir(), '.cache', 'gungnir-canvas'), hash(file))
  await mkdir(dataDir, { recursive: true })
  const lock = join(dataDir, 'session.lock')
  try { const handle = await open(lock, 'wx'); await handle.writeFile(String(process.pid)); await handle.close() }
  catch (e) {
    if (e.code !== 'EEXIST') throw e
    const pid = Number(await readOptional(lock))
    let alive = true
    if (Number.isInteger(pid) && pid > 0) {
      try { process.kill(pid, 0) } catch (error) { if (error.code === 'ESRCH') alive = false }
    }
    if (alive) throw new Error('该项目画布已在其他 MCP 会话中打开，请先结束原会话')
    await rm(lock)
    return openProject(root, architecturePath)
  }
  try {
    let source = await readOptional(file)
    const stored = await readOptional(join(dataDir, 'document.json'))
    const cached = stored ? JSON.parse(stored) : null
    const schema = createTLSchema()
    const validate = records => {
      if (!records || typeof records !== 'object' || Array.isArray(records) || Object.keys(records).length > 5000) throw new Error('无效的画布数据')
      for (const [id, r] of Object.entries(records)) {
        if (id !== r.id || !['shape', 'binding', 'page', 'document', 'asset'].includes(r.typeName)) throw new Error('无效的画布记录')
        schema.types[r.typeName].validate(r)
        if (r.typeName === 'shape' && !records[r.parentId]) throw new Error('图形缺少父页面')
        if (r.typeName === 'binding' && (!records[r.fromId] || !records[r.toId])) throw new Error('连线引用了不存在的图形')
      }
    }
    const fromMarkdown = markdown => {
      const page = schema.types.page.create({ id: 'page:page', name: '项目结构图', index: 'a1' })
      const document = schema.types.document.create({ id: 'document:document', name: '项目结构图' })
      const records = { [page.id]: page, [document.id]: document }
      if (markdown !== null) for (const r of architectureRecords(parseArchitecture(markdown), records)) records[r.id] = r
      return { revision: 0, records, transactions: [] }
    }
    if (cached && cached.sourceHash !== hash(source) && cached.syncedRevision !== cached.state.revision) {
      throw new Error(`Markdown 已变化且存在未同步画布草稿，请先处理 ${join(dataDir, 'document.json')} 中的草稿，未覆盖任何文件`)
    }
    const restored = cached?.sourceHash === hash(source)
    const state = new CanvasState(restored ? cached.state : fromMarkdown(source), validate)
    validate(state.data.records)
    let syncedRevision = restored ? cached.syncedRevision : state.data.revision
    const info = () => ({ projectPath: root, architecturePath: file, hasDraft: syncedRevision !== state.data.revision })
    const persist = () => atomicWrite(join(dataDir, 'document.json'), JSON.stringify({ sourceHash: hash(source), syncedRevision, state: state.data }))
    return {
      state, info, persist,
      async save(baseRevision) {
        if (baseRevision !== state.data.revision) throw new Error('画布已发生变化，请重新读取后保存')
        const currentPath = await projectFile(root, architecturePath)
        if (currentPath !== file || hash(await readOptional(file)) !== hash(source)) throw new Error('项目 Markdown 已被外部修改，未覆盖；请先解决冲突')
        const diagram = exportArchitecture(state.data.records)
        const matches = source === null ? [] : [...source.matchAll(blocks)]
        if (matches.length > 1) throw new Error('存在多个 Mermaid 图，无法确定回写位置')
        const content = matches.length ? source.slice(0, matches[0].index) + diagram + source.slice(matches[0].index + matches[0][0].length) : diagram
        await atomicWrite(file, content)
        source = content
        syncedRevision = state.data.revision
        await persist()
        if (await readOptional(file) !== content) throw new Error('保存后文件再次变化，请检查项目结构图')
        return { ...info(), revision: state.data.revision, saved: true }
      },
      async reload() {
        const currentPath = await projectFile(root, architecturePath)
        if (currentPath !== file) throw new Error('框架图路径已变化，请重新打开项目')
        const current = await readOptional(file)
        if (hash(current) !== hash(source)) {
          if (syncedRevision !== state.data.revision) throw new Error('画布存在未同步修改，请先解决冲突，不自动丢弃草稿')
          const next = fromMarkdown(current)
          next.revision = state.data.revision + 1
          state.data = next
          source = current
          syncedRevision = next.revision
          state.selection = []
          await persist()
        }
        return info()
      },
      close: () => rm(lock, { force: true }),
    }
  } catch (e) { await rm(lock, { force: true }); throw e }
}
