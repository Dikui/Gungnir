import React, { useState } from 'react'
import {
  DefaultStylePanel, DefaultStylePanelContent, GeoShapeUtil, SVGContainer,
  track, useEditor, toRichText, type TLArrowShape, type TLGeoShape, type TLUiStylePanelProps, type SvgExportContext,
} from 'tldraw'
import { normalizeReferences, plainText } from '../architecture.mjs'

function customFill(shape: TLGeoShape) {
  const color = shape.meta.fillColor
  return shape.props.geo === 'rectangle' && shape.props.fill === 'solid' &&
    typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color) ? color : null
}

export class BoxShapeUtil extends GeoShapeUtil {
  override component(shape: TLGeoShape) {
    const color = customFill(shape)
    const native = super.component(color ? { ...shape, props: { ...shape.props, fill: 'none' } } : shape)
    return <>{color && <SVGContainer><rect data-box-fill={color} width={shape.props.w} height={shape.props.h + shape.props.growY} fill={color}/></SVGContainer>}{native}</>
  }
  override toSvg(shape: TLGeoShape, context: SvgExportContext) {
    const color = customFill(shape)
    const native = super.toSvg(color ? { ...shape, props: { ...shape.props, fill: 'none' } } : shape, context)
    return <>{color && <rect width={shape.props.w / shape.props.scale} height={(shape.props.h + shape.props.growY) / shape.props.scale} fill={color}/ >}{native}</>
  }
}

const palette = [
  ['白色', '#ffffff'], ['浅灰', '#e5e7eb'], ['浅绿', '#d5eadb'], ['浅蓝', '#dbeafe'],
  ['浅紫', '#ede3fa'], ['浅黄', '#fef3c7'], ['浅橙', '#fed7aa'], ['浅红', '#fecaca'],
]
const FillColors = track(function FillColors() {
  const editor = useEditor()
  const boxes = editor.getSelectedShapes().filter((shape): shape is TLGeoShape => shape.type === 'geo' && shape.props.geo === 'rectangle' && !editor.isShapeOrAncestorLocked(shape))
  if (!boxes.length || editor.getIsReadonly()) return null
  const current = customFill(boxes[0])
  const mixed = boxes.some(shape => customFill(shape) !== current || shape.props.fill !== boxes[0].props.fill)
  function setColor(color: string | null) {
    editor.markHistoryStoppingPoint('修改填充颜色')
    editor.updateShapes(boxes.map(shape => ({ id: shape.id, type: 'geo',
      props: { fill: color ? 'solid' as const : 'none' as const },
      meta: { ...shape.meta, ...(color ? { fillColor: color } : {}) },
    })))
    editor.markHistoryStoppingPoint('完成填充颜色修改')
  }
  return <div className="box-fill-controls">
    <div className="box-fill-heading"><strong>填充颜色</strong><label className="custom-fill-picker">自定义<input type="color" aria-label="自定义填充颜色" value={current ?? '#ffffff'} onChange={event => setColor(event.target.value)}/></label></div>
    <div className="box-fill-swatches" role="group" aria-label="方框填充颜色">
      <button className="no-fill" aria-label="无填充" title="无填充" aria-pressed={!mixed && boxes[0].props.fill === 'none'} onClick={() => setColor(null)}/>
      {palette.map(([name,color]) => <button key={color} style={{ background: color }} aria-label={`填充${name}`} title={name} aria-pressed={!mixed && current === color} onClick={() => setColor(color)}/>)}
    </div>
    <div className="border-color-label">边框颜色与其他样式</div>
  </div>
})

const ArrowDescription = track(function ArrowDescription() {
  const editor = useEditor(), selected = editor.getSelectedShapes()
  if (selected.length !== 1 || selected[0].type !== 'arrow' || editor.getIsReadonly() || editor.isShapeOrAncestorLocked(selected[0])) return null
  const arrow = selected[0] as TLArrowShape
  return <label className="arrow-description">连线描述
    <textarea style={{resize:'none'}} aria-label="连线描述" placeholder="例如：传递检测结果" rows={3} value={plainText(arrow.props.richText)}
      onFocus={() => editor.markHistoryStoppingPoint('修改连线描述')}
      onBlur={() => editor.markHistoryStoppingPoint('完成连线描述修改')}
      onKeyDown={event => event.stopPropagation()}
      onChange={event => editor.updateShapes([{ id: arrow.id, type: 'arrow', props: { richText: toRichText(event.target.value) } }])}/>
    <small>显示在线上，随架构文本导出</small>
  </label>
})

const SourceReferences = track(function SourceReferences() {
  const editor = useEditor(), selected = editor.getSelectedShapes()
  const [drafts, setDrafts] = useState<Record<string, { value: string; base: string }>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const shape = selected.length === 1 && selected[0].type === 'geo' && selected[0].props.geo === 'rectangle' ? selected[0] : null
  if (!shape) return null
  const raw = Array.isArray(shape.meta.refs) ? shape.meta.refs : [], base = JSON.stringify(raw)
  const draft = drafts[shape.id], value = draft?.value ?? raw.join('\n')
  const disabled = editor.getIsReadonly() || editor.isShapeOrAncestorLocked(shape)
  let refs: string[] = []
  try { refs = normalizeReferences(raw) } catch { /* Invalid external metadata remains editable. */ }
  function save() {
    if (!draft || disabled || !shape) return
    try {
      const latest = editor.getShape(shape.id)
      if (!latest || editor.getIsReadonly() || editor.isShapeOrAncestorLocked(latest)) throw new Error('模块已删除或锁定，来源未保存')
      if (JSON.stringify(Array.isArray(latest.meta.refs) ? latest.meta.refs : []) !== draft.base) throw new Error('来源已由其他编辑更新，请重新选择模块核对后修改')
      const next = normalizeReferences(draft.value.split('\n').map(line => line.trim()).filter(Boolean))
      editor.updateShapes([{ id: shape.id, type: 'geo', meta: { ...latest.meta, refs: next } }])
      setDrafts(current => { const next = { ...current }; delete next[shape.id]; return next })
      setErrors(current => ({ ...current, [shape.id]: '' }))
    } catch (error: any) { setErrors(current => ({ ...current, [shape.id]: error.message })) }
  }
  return <label className="arrow-description source-references">模块来源
    <textarea style={{resize:'none'}} aria-label="模块来源，每行一条" placeholder={'https://example.com/docs\nsrc/main.ts:12'} rows={3} disabled={disabled} value={value}
      onFocus={() => editor.markHistoryStoppingPoint('修改模块来源')}
      onBlur={() => { save(); editor.markHistoryStoppingPoint('完成模块来源修改') }}
      onKeyDown={event => event.stopPropagation()}
      onChange={event => { const value = event.target.value; setDrafts(current => ({ ...current, [shape.id]: { value, base: current[shape.id]?.base ?? base } })); setErrors(current => ({ ...current, [shape.id]: '' })) }}/>
    <small>每行一个 HTTP/HTTPS 链接或文件位置。</small>
    {errors[shape.id] && <small role="alert" className="reference-error">{errors[shape.id]}<button type="button" onClick={() => { setDrafts(current => { const next = { ...current }; delete next[shape.id]; return next }); setErrors(current => ({ ...current, [shape.id]: '' })) }}>重新载入来源</button></small>}
    {refs.length > 0 && <span className="source-links">{refs.map(ref => /^https?:\/\//i.test(ref) ? <a key={ref} href={ref} target="_blank" rel="noopener noreferrer">{ref}</a> : <span key={ref}>{ref}</span>)}</span>}
  </label>
})

export function CanvasStylePanel(props: TLUiStylePanelProps) {
  return <DefaultStylePanel {...props}><ArrowDescription/><SourceReferences/><FillColors/><DefaultStylePanelContent/></DefaultStylePanel>
}
