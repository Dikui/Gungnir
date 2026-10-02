import React, { useEffect, useState } from 'react'
import { createBindingId, createShapeId, track, useEditor, type TLGeoShape, type TLShape, type TLShapeId } from 'tldraw'

import { arrangeEditor } from './FrameworkTools'

const ports = [
  { name: '上', x: .5, y: 0 },
  { name: '右', x: 1, y: .5 },
  { name: '下', x: .5, y: 1 },
  { name: '左', x: 0, y: .5 },
]
type Point = { x: number; y: number }
type Port = typeof ports[number]
type Drag = { sourceId: TLShapeId; port: Port; point: Point; targetId?: TLShapeId; targetPort?: Port }
const isBox = (shape: TLShape): shape is TLGeoShape => shape.type === 'geo' && shape.props.geo === 'rectangle'
const shapeName = (node: any): string => node?.text ?? (node?.content ?? []).map(shapeName).join(' ')

export const QuickConnect = track(function QuickConnect() {
  const editor = useEditor()
  const [drag, setDrag] = useState<Drag | null>(null)
  useEffect(() => {
    if (!drag) return
    const cancel = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.stopPropagation(); setDrag(null) }
    }
    window.addEventListener('keydown', cancel, true)
    return () => window.removeEventListener('keydown', cancel, true)
  }, [!!drag])

  const viewport = editor.getViewportScreenBounds()
  function pagePoint(shape: TLShape, port: Port) {
    const bounds = editor.getShapeGeometry(shape).bounds
    return editor.getShapePageTransform(shape).applyToPoint({ x: bounds.x + bounds.w * port.x, y: bounds.y + bounds.h * port.y })
  }
  function canvasPoint(point: Point) {
    const screen = editor.pageToScreen(point)
    return { x: screen.x - viewport.x, y: screen.y - viewport.y }
  }
  function destination(point: Point, sourceId: TLShapeId) {
    const target = editor.getShapeAtPoint(point, {
      hitInside: true, margin: 12 / editor.getZoomLevel(),
      filter: shape => isBox(shape) && shape.id !== sourceId && !editor.isShapeOrAncestorLocked(shape),
    })
    if (!target) return { point }
    const port = ports.reduce((best, candidate) => {
      const a = pagePoint(target, best), b = pagePoint(target, candidate)
      return Math.hypot(b.x - point.x, b.y - point.y) < Math.hypot(a.x - point.x, a.y - point.y) ? candidate : best
    })
    return { point: pagePoint(target, port), targetId: target.id, targetPort: port }
  }
  function finish(connection: Drag) {
    setDrag(null)
    const source = editor.getShape(connection.sourceId), target = connection.targetId && editor.getShape(connection.targetId)
    if (!source || !target || source.id === target.id || !connection.targetPort || editor.getIsReadonly()) return
    if (editor.isShapeOrAncestorLocked(source) || editor.isShapeOrAncestorLocked(target)) return
    const start = pagePoint(source, connection.port), end = pagePoint(target, connection.targetPort)
    const arrowId = createShapeId()
    editor.markHistoryStoppingPoint('快速连线')
    editor.run(() => {
      editor.createShape({ id: arrowId, type: 'arrow', x: start.x, y: start.y, props: {
        kind: 'elbow', start: { x: 0, y: 0 }, end: { x: end.x - start.x, y: end.y - start.y },
        bend: 0, color: 'green', size: 's', dash: 'solid', arrowheadStart: 'none', arrowheadEnd: 'arrow',
      }, meta: { owner: 'human', source: 'quick-connect' } })
      editor.createBindings([
        { id: createBindingId(), type: 'arrow', fromId: arrowId, toId: source.id, props: {
          terminal: 'start', normalizedAnchor: { x: connection.port.x, y: connection.port.y }, isExact: true, isPrecise: true, snap: 'edge-point',
        } },
        { id: createBindingId(), type: 'arrow', fromId: arrowId, toId: target.id, props: {
          terminal: 'end', normalizedAnchor: { x: connection.targetPort!.x, y: connection.targetPort!.y }, isExact: true, isPrecise: true, snap: 'edge-point',
        } },
      ])
      arrangeEditor(editor)
      editor.select(arrowId)
    })
    editor.markHistoryStoppingPoint('完成快速连线')
  }

  if (editor.getIsReadonly() || editor.getEditingShapeId() || !editor.isIn('select.idle')) return null
  const shapes = editor.getCurrentPageShapesSorted().filter(shape => isBox(shape) && !editor.isShapeOrAncestorLocked(shape))
  const source = drag && editor.getShape(drag.sourceId)
  const start = source && drag ? canvasPoint(pagePoint(source, drag.port)) : null
  const end = drag ? canvasPoint(drag.point) : null

  return <div className="quick-connect" aria-label="方框快速连线">
    {start && end && <svg className="connection-preview" aria-hidden="true">
      <defs><marker id="quick-connect-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7" fill="none" stroke="currentColor" strokeWidth="1.2"/></marker></defs>
      <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} markerEnd="url(#quick-connect-arrow)"/>
    </svg>}
    {shapes.flatMap(shape => ports.map(port => {
      const position = canvasPoint(pagePoint(shape, port))
      const active = drag?.targetId === shape.id && drag.targetPort === port
      const emphasized = !!drag || editor.getHoveredShapeId() === shape.id || editor.getSelectedShapeIds().includes(shape.id)
      const name = shapeName((shape.props as TLGeoShape['props']).richText) || '方框'
      return <button key={shape.id + port.name} className={`connection-port ${emphasized ? 'visible' : ''} ${active ? 'target' : ''}`}
        style={{ left: position.x, top: position.y }} aria-label={`${name}·${port.name}侧连接点`} title={`从${port.name}侧拖到另一个方框，松开连线`}
        onPointerDown={event => {
          if (event.button !== 0) return
          event.preventDefault(); event.stopPropagation()
          event.currentTarget.setPointerCapture(event.pointerId)
          setDrag({ sourceId: shape.id, port, point: pagePoint(shape, port) })
        }}
        onPointerMove={event => {
          if (!drag || !event.currentTarget.hasPointerCapture(event.pointerId)) return
          event.stopPropagation()
          setDrag({ ...drag, targetId: undefined, targetPort: undefined,
            ...destination(editor.screenToPage({ x: event.clientX, y: event.clientY }), drag.sourceId) })
        }}
        onPointerUp={event => {
          if (!drag || !event.currentTarget.hasPointerCapture(event.pointerId)) return
          event.stopPropagation()
          const hit = destination(editor.screenToPage({ x: event.clientX, y: event.clientY }), drag.sourceId)
          event.currentTarget.releasePointerCapture(event.pointerId)
          finish({ ...drag, targetId: undefined, targetPort: undefined, ...hit })
        }}
        onPointerCancel={() => setDrag(null)}
        onLostPointerCapture={() => setDrag(null)}
        onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') event.stopPropagation() }}
        onClick={event => {
          event.stopPropagation()
          if (event.detail !== 0) return
          if (drag) finish({ ...drag, targetId: shape.id, targetPort: port })
          else setDrag({ sourceId: shape.id, port, point: pagePoint(shape, port) })
        }}><span/></button>
    }))}
    {drag && <div className="connection-hint" role="status">{drag.targetId ? '松开，连接到高亮中点' : '拖到另一个方框 · Esc 取消'}</div>}
  </div>
})
