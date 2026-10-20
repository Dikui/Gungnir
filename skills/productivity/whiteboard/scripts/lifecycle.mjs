import { readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

export function installWhiteboard({ wss, elements, files, expandElementsForExport, logger }) {
  const file = resolve(process.env.GUNGNIR_WHITEBOARD_FILE || 'whiteboard.excalidraw')
  let archive
  try { archive = JSON.parse(readFileSync(file, 'utf8')) }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  if (archive !== undefined) {
    if (!archive || archive.type !== 'excalidraw' || !Array.isArray(archive.elements) ||
        !archive.elements.every(element => element && typeof element.id === 'string')) {
      throw new Error(`Invalid whiteboard archive: ${file}`)
    }
    for (const element of archive.elements) elements.set(element.id, element)
    for (const [id, image] of Object.entries(archive.files || {})) files.set(id, image)
  }

  const pages = new Set()
  let closing = false
  const close = () => {
    closing = true
    const pending = `${file}.gungnir-${process.pid}.tmp`
    let saved = false
    try {
      const scene = {
        type: 'excalidraw', version: 2, source: 'gungnir-whiteboard',
        elements: expandElementsForExport([...elements.values()], { deterministic: true }),
        appState: { viewBackgroundColor: '#ffffff', gridSize: null },
        files: Object.fromEntries(files)
      }
      writeFileSync(pending, JSON.stringify(scene, null, 2), { mode: 0o600 })
      renameSync(pending, file)
      saved = true
      logger.info(`Whiteboard saved: ${file}`)
    } catch (error) {
      logger.error(`Whiteboard save failed; keeping previous archive: ${error.message}`)
    } finally {
      try { unlinkSync(pending) } catch { /* renamed or never created */ }
    }
    try {
      for (const page of pages) {
        if (page.readyState !== 1) continue
        page.send(JSON.stringify({ type: 'gungnir_closed', saved, file }))
        page.close(1000, 'Whiteboard closed')
      }
    } finally {
      process.kill(process.pid, 'SIGTERM')
    }
  }
  wss.on('connection', (ws, request) => {
    pages.add(ws)
    ws.on('message', raw => {
      try {
        const scene = JSON.parse(raw.toString())
        if (closing || !['gungnir_scene', 'gungnir_close'].includes(scene.type)) return
        if (scene.type === 'gungnir_close' && (!request.headers.origin || new URL(request.headers.origin).host !== request.headers.host)) {
          throw new Error('Close must be requested from the whiteboard page')
        }
        if (!Array.isArray(scene.elements) || !Array.isArray(scene.files) ||
            !scene.elements.every(element => element && typeof element.id === 'string') ||
            !scene.files.every(image => image && typeof image.id === 'string' && typeof image.dataURL === 'string')) {
          throw new Error('Invalid browser scene')
        }
        elements.clear()
        for (const element of scene.elements) elements.set(element.id, element)
        for (const image of scene.files) files.set(image.id, image)
        const update = JSON.stringify({ type: 'initial_elements', elements: scene.elements, files: Object.fromEntries(files) })
        for (const page of pages) {
          if (page !== ws && page.readyState === 1) page.send(update)
        }
        ws.send(JSON.stringify({ type: 'files_added', files: scene.files }))
        ws.send(JSON.stringify({ type: 'elements_synced', count: elements.size }))
        if (scene.type === 'gungnir_close') close()
      } catch (error) {
        logger.error(`Whiteboard sync failed: ${error.message}`)
      }
    })
    ws.once('close', () => pages.delete(ws))
  })
  return { file, closeMode: 'manual' }
}
