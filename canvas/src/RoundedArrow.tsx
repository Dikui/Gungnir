import React, { Children, cloneElement } from 'react'
import {
  ArrowShapeUtil, PathBuilder, SVGContainer, STROKE_SIZES, getArrowInfo,
  track, useDefaultColorTheme, useEditor, type TLArrowShape, type SvgExportContext,
} from 'tldraw'

// Keep tldraw's routing, bindings, handles, labels and history; only replace its SVG strokes.
function paths(editor: ArrowShapeUtil['editor'], shape: TLArrowShape) {
  const info = getArrowInfo(editor, shape)
  if (info?.type !== 'elbow' || !info.isValid) return null
  const points = info.route.points.filter(point => !info.route.skipPointsWhenDrawing.has(point))
  if (points.length < 2) return null
  const width = STROKE_SIZES[shape.props.size] * shape.props.scale
  const body = PathBuilder.lineThroughPoints(points).toDrawD({
    strokeWidth: width, randomSeed: shape.id, offset: 0, passes: 1, roundness: 12 * shape.props.scale,
  })
  const head = (end: boolean) => {
    const tip = end ? points.at(-1)! : points[0], previous = end ? points.at(-2)! : points[1]
    const length = Math.hypot(previous.x - tip.x, previous.y - tip.y)
    if (!length) return ''
    const size = Math.min(width * 4, length / 2)
    const dx = (previous.x - tip.x) / length * size, dy = (previous.y - tip.y) / length * size
    return `M${tip.x + dx - dy * .5},${tip.y + dy + dx * .5} L${tip.x},${tip.y} L${tip.x + dx + dy * .5},${tip.y + dy - dx * .5}`
  }
  return { body, heads: [shape.props.arrowheadStart === 'arrow' ? head(false) : '', shape.props.arrowheadEnd === 'arrow' ? head(true) : ''].join(' '), width }
}

const supports = (shape: TLArrowShape) => shape.props.kind === 'elbow' &&
  [shape.props.arrowheadStart, shape.props.arrowheadEnd].every(head => head === 'arrow' || head === 'none')

const RoundedSvg = track(function RoundedSvg({ shape }: { shape: TLArrowShape }) {
  const editor = useEditor(), theme = useDefaultColorTheme(), drawing = paths(editor, shape)
  if (!drawing) return null
  return <g fill="none" stroke={theme[shape.props.color].solid} strokeWidth={drawing.width} strokeLinecap="round" strokeLinejoin="round">
    <path data-rounded-arrow="body" d={drawing.body} strokeDasharray={shape.props.dash === 'dashed' ? '8 6' : shape.props.dash === 'dotted' ? '1 6' : undefined}/>
    <path d={drawing.heads}/>
  </g>
})

export class RoundedArrowShapeUtil extends ArrowShapeUtil {
  override getDefaultProps() { return { ...super.getDefaultProps(), kind: 'elbow' as const, dash: 'solid' as const } }
  override component(shape: TLArrowShape) {
    const native = super.component(shape)
    if (!native || !supports(shape)) return native
    // tldraw 4.5 renders its SVG first, followed by its editable rich-text label.
    const [, ...labels] = Children.toArray(native.props.children)
    return <><SVGContainer style={{ minWidth: 50, minHeight: 50 }}><RoundedSvg shape={shape}/></SVGContainer>{labels}</>
  }
  override getIndicatorPath(shape: TLArrowShape) {
    if (!supports(shape) || this.editor.getEditingShapeId() === shape.id) return super.getIndicatorPath(shape)
    const drawing = paths(this.editor, shape)
    return drawing ? new Path2D(drawing.body + ' ' + drawing.heads) : super.getIndicatorPath(shape)
  }
  override toSvg(shape: TLArrowShape, context: SvgExportContext) {
    const native = super.toSvg(shape, context)
    if (!supports(shape)) return native
    const [, ...labels] = Children.toArray(native.props.children)
    return cloneElement(native, {}, <RoundedSvg shape={shape}/>, ...labels)
  }
}
