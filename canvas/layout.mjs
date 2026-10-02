import { plainText } from './architecture.mjs'

const boxesOf = records => Object.values(records).filter(r => r.typeName === 'shape' && r.type === 'geo' && r.props.geo === 'rectangle')
const arrowsOf = records => Object.values(records).filter(r => r.typeName === 'shape' && r.type === 'arrow')
const bindingsOf = records => {
  const endpoints = new Map()
  for (const r of Object.values(records)) if (r.typeName === 'binding' && r.type === 'arrow') {
    if (!endpoints.has(r.fromId)) endpoints.set(r.fromId, {})
    endpoints.get(r.fromId)[r.props.terminal] = r
  }
  return endpoints
}
const labelHeight = text => text.split('\n').reduce((n, line) => n + Math.max(1, Math.ceil(textWidth(line) / 480)), 0) * 28
const textWidth = text => Math.max(0, ...text.split('\n').map(line => [...line].reduce((n, c) => n + (c.codePointAt(0) > 255 ? 22 : 12), 0)))

// Geometry only: tldraw owns elbow routing, including routes outside self-bound boxes.
export function arrangeRecords(input) {
  const records = structuredClone(input), boxes = boxesOf(records), endpoints = bindingsOf(records)
  for (const parent of new Set(boxes.map(r => r.parentId))) {
    const nodes = boxes.filter(r => r.parentId === parent).sort((a, b) => a.id.localeCompare(b.id)), byId = new Map(nodes.map(r => [r.id, r]))
    const edges = arrowsOf(records).map(arrow => ({ arrow, ...endpoints.get(arrow.id) })).filter(e => byId.has(e.start?.toId) && byId.has(e.end?.toId))
    const adjacency = new Map(nodes.map(r => [r.id, []]))
    for (const edge of edges) {
      let from = edge.start.toId, to = edge.end.toId
      if (edge.arrow.props.arrowheadStart !== 'none' && edge.arrow.props.arrowheadEnd === 'none') [from, to] = [to, from]
      edge.from = from; edge.to = to
      adjacency.get(from).push(edge)
    }
    const visiting = new Set(), visited = new Set(), order = [], rank = new Map(nodes.map(r => [r.id, 0]))
    const visit = id => {
      if (visited.has(id)) return
      visiting.add(id)
      for (const edge of adjacency.get(id)) {
        edge.feedback = visiting.has(edge.to)
        if (!edge.feedback) visit(edge.to)
      }
      visiting.delete(id); visited.add(id); order.push(id)
    }
    for (const node of nodes) visit(node.id)
    for (const id of order.reverse()) for (const edge of adjacency.get(id)) if (!edge.feedback) rank.set(edge.to, Math.max(rank.get(edge.to), rank.get(id) + 1))
    const columns = new Map()
    for (const node of nodes) {
      const level = rank.get(node.id)
      if (!columns.has(level)) columns.set(level, [])
      columns.get(level).push(node)
      const width = Math.max(240, node.props.w ?? 240), text = plainText(node.props.richText)
      // ponytail: estimated wrapping; use measured browser text only if font-dependent clipping recurs.
      const lines = text.split('\n').reduce((n, line) => n + Math.max(1, Math.ceil(textWidth(line) / (width - 40))), 0)
      Object.assign(node.props, { w: width, h: Math.max(110, lines * 28 + 40), growY: 0 })
    }
    let x = 70
    for (const [level, column] of [...columns].sort(([a], [b]) => a - b)) {
      let y = 70
      for (const node of column) {
        node.x = x; node.y = y
        const labels = edges.filter(e => e.from === node.id || e.to === node.id).map(e => labelHeight(plainText(e.arrow.props.richText)))
        y += node.props.h + Math.max(100, ...labels.map(h => h + 60))
      }
      const labelWidth = Math.max(0, ...edges.filter(e => rank.get(e.from) === level).map(e => textWidth(plainText(e.arrow.props.richText))))
      x += Math.max(...column.map(n => n.props.w)) + Math.max(160, Math.min(labelWidth + 80, 560))
    }
    const anchors = new Map()
    const add = (edge, binding, side) => {
      const key = binding.toId + ':' + side
      if (!anchors.has(key)) anchors.set(key, [])
      anchors.get(key).push({edge, binding, side})
    }
    for (const edge of edges) {
      const from = byId.get(edge.from), to = byId.get(edge.to)
      let fromSide = 'right', toSide = 'left'
      if (from.id === to.id) { fromSide = 'right'; toSide = 'top' }
      else if (to.x <= from.x) { fromSide = 'top'; toSide = 'top' }
      const forward = edge.start.toId === edge.from
      add(edge, edge.start, forward ? fromSide : toSide)
      add(edge, edge.end, forward ? toSide : fromSide)
    }
    for (const entries of anchors.values()) entries.forEach(({binding, side}, i) => {
      const position = (i + 1) / (entries.length + 1)
      Object.assign(binding.props, { normalizedAnchor: side === 'top' ? {x: position, y: 0} : {x: side === 'left' ? 0 : 1, y: position}, isExact: true, isPrecise: true, snap: 'edge-point' })
    })
    for (const {arrow, start, end} of edges) {
      const from = byId.get(start.toId), to = byId.get(end.toId), a = start.props.normalizedAnchor, b = end.props.normalizedAnchor
      arrow.x = from.x; arrow.y = from.y; arrow.rotation = 0
      Object.assign(arrow.props, {kind: 'elbow', bend: 0, elbowMidPoint: 0.5, start: {x: a.x * from.props.w, y: a.y * from.props.h}, end: {x: to.x - from.x + b.x * to.props.w, y: to.y - from.y + b.y * to.props.h}})
    }
  }
  return records
}

export function layoutDiagnostics(records) {
  const boxes = boxesOf(records), endpoints = bindingsOf(records), diagnostics = []
  const rect = box => ({x: box.x, y: box.y, w: box.props.w, h: box.props.h + (box.props.growY ?? 0)})
  const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  // ponytail: pairwise checks suit architecture diagrams; use a spatial index only for large canvases.
  for (let i = 0; i < boxes.length; i++) for (const other of boxes.slice(i + 1)) if (boxes[i].parentId === other.parentId && overlaps(rect(boxes[i]), rect(other))) diagnostics.push({id: boxes[i].id, ids: [boxes[i].id, other.id], type: 'overlap', message: '方框重叠'})
  for (const arrow of arrowsOf(records)) {
    const {start, end} = endpoints.get(arrow.id) ?? {}, from = records[start?.toId], to = records[end?.toId]
    if (!boxes.includes(from) || !boxes.includes(to)) { diagnostics.push({id: arrow.id, type: 'unbound', message: '连线未连接到两个方框'}); continue }
    const a = start.props.normalizedAnchor, b = end.props.normalizedAnchor
    if (!a || !b || from === to || from.rotation || to.rotation || arrow.rotation) continue
    const p = {x: from.x + a.x * from.props.w, y: from.y + a.y * from.props.h}, q = {x: to.x + b.x * to.props.w, y: to.y + b.y * to.props.h}
    // Only straight aligned segments are known without tldraw's runtime router.
    const horizontal = Math.abs(p.y - q.y) < 1 && ((a.x === 1 && b.x === 0 && q.x > p.x) || (a.x === 0 && b.x === 1 && q.x < p.x))
    const vertical = Math.abs(p.x - q.x) < 1 && ((a.y === 1 && b.y === 0 && q.y > p.y) || (a.y === 0 && b.y === 1 && q.y < p.y))
    if (!horizontal && !vertical) continue
    const line = {x: Math.min(p.x, q.x) - 1, y: Math.min(p.y, q.y) - 1, w: Math.abs(p.x - q.x) + 2, h: Math.abs(p.y - q.y) + 2}
    const text = plainText(arrow.props.richText), width = Math.min(textWidth(text), 480), height = labelHeight(text), position = arrow.props.labelPosition ?? 0.5
    const label = {x: p.x + (q.x - p.x) * position - width / 2, y: p.y + (q.y - p.y) * position - height / 2, w: width, h: height}
    const blocked = boxes.find(box => box !== from && box !== to && box.parentId === from.parentId && (overlaps(line, rect(box)) || (text && overlaps(label, rect(box)))))
    if (blocked) diagnostics.push({id: arrow.id, ids: [arrow.id, blocked.id], type: 'obstruction', message: '直线或标签可能遮挡方框'})
  }
  return diagnostics
}
