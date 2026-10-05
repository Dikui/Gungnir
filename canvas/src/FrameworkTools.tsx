import React, { useState } from 'react'
import { track, useEditor, type Editor, type TLShapeId } from 'tldraw'
import { framework } from '../architecture.mjs'
import { arrangeRecords, layoutDiagnostics } from '../layout.mjs'

// Use the caller's history group, so a structural edit and its layout undo together.
export function arrangeEditor(editor: Editor) {
  if (editor.getIsReadonly()) return
  editor.store.put(Object.values(arrangeRecords(editor.store.serialize('document'))) as any)
}

type Mode = 'direct' | 'upstream' | 'downstream' | 'path'
export const FrameworkTools = track(function FrameworkTools() {
  const editor = useEditor(), [mode, setMode] = useState<Mode | null>(null)
  const records = editor.store.serialize('document'), graph = framework(records)
  const selected = editor.getSelectedShapeIds().filter(id => graph.nodes.some((node: any) => node.id === id))
  const active = mode && ((mode === 'path' && selected.length === 2) || (mode !== 'path' && selected.length === 1))
  const ids = new Set<string>(), edges = graph.edges.filter((edge: any) => edge.from && edge.to)
  if (active) {
    ids.add(selected[0])
    if (mode === 'direct') {
      for (const edge of edges) if (edge.from === selected[0] || edge.to === selected[0]) {
        ids.add(edge.id); ids.add(edge.from); ids.add(edge.to)
      }
    } else {
      const arcs = edges.flatMap((edge: any) => edge.direction === 'none' ? [] : [
        { from: edge.from, to: edge.to, id: edge.id },
        ...(edge.direction === 'both' ? [{ from: edge.to, to: edge.from, id: edge.id }] : []),
      ])
      const queue: string[] = [selected[0]], seen = new Set(queue), previous = new Map<string, { from: string; id: string }>()
      for (let i = 0; i < queue.length; i++) for (const arc of arcs) {
        const from = mode === 'upstream' ? arc.to : arc.from, to = mode === 'upstream' ? arc.from : arc.to
        if (from !== queue[i]) continue
        if (mode !== 'path') { ids.add(arc.id); ids.add(to) }
        if (!seen.has(to)) { seen.add(to); queue.push(to); previous.set(to, { from, id: arc.id }) }
      }
      if (mode === 'path') {
        ids.clear()
        if (seen.has(selected[1])) {
          let cursor: string = selected[1]; ids.add(cursor)
          while (cursor !== selected[0]) { const step = previous.get(cursor)!; ids.add(step.id); ids.add(step.from); cursor = step.from }
        }
      }
    }
  }
  const viewport = editor.getViewportScreenBounds(), diagnostics = layoutDiagnostics(records)
  const focusNodes = graph.nodes.filter((node: any) => ids.has(node.id)).length
  return <>
    {(selected.length > 0 || mode || diagnostics.length > 0) && <div className="framework-tools" onPointerDown={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
      <div className="relationship-buttons" role="group" aria-label="关系聚焦">
        {([['direct', '直接关系'], ['upstream', '上游'], ['downstream', '下游'], ['path', '有向路径']] as const).map(([value, label]) =>
          <button key={value} disabled={selected.length !== (value === 'path' ? 2 : 1)} aria-pressed={active && mode === value ? true : false} onClick={() => setMode(value)}>{label}</button>)}
        {mode && <button onClick={() => setMode(null)}>清除聚焦</button>}
      </div>
      <span className="relationship-status" role="status">{active ? (focusNodes > (mode === 'path' ? 0 : 1) ? `已聚焦 ${focusNodes} 个模块${mode === 'path' ? ' · 按选择顺序' : ''}` : mode === 'path' ? '按选择顺序无可达有向路径' : '没有符合方向的关联模块') : mode ? '选择一个模块查看关系，或两个模块查看有向路径' : '选择模块查看关系'}</span>
      {!!diagnostics.length && <details className="layout-diagnostics"><summary>布局提示 · {diagnostics.length}</summary><ul>{diagnostics.map((item: any, i: number) => <li key={i}>{item.message}：{(item.ids ?? [item.id]).map((id: string) => graph.nodes.find((node: any) => node.id === id)?.text || graph.edges.find((edge: any) => edge.id === id)?.text || id).join("、")}</li>)}</ul></details>}
    </div>}
    {active && <svg className="relationship-overlay" aria-hidden="true">{[...ids].map(id => {
      const bounds = editor.getShapePageBounds(id as TLShapeId)
      if (!bounds) return null
      const start = editor.pageToScreen(bounds.point), end = editor.pageToScreen({ x: bounds.maxX, y: bounds.maxY })
      return <rect key={id} x={start.x - viewport.x - 4} y={start.y - viewport.y - 4} width={Math.max(8, end.x - start.x + 8)} height={Math.max(8, end.y - start.y + 8)} rx={6}/>
    })}</svg>}
  </>
})
