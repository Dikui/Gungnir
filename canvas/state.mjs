import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { getIndexAbove, getIndexBetween } from '@tldraw/utils'
import { parseArchitecture, architectureRecords, boxProps, arrowProps, framework, normalizeReferences, documentIds } from './architecture.mjs'
import { arrangeRecords, layoutDiagnostics } from './layout.mjs'

const references = z.array(z.string().min(1).max(1000)).max(30)
const id = z.string().min(1).max(200)
export const importSchema = z.object({baseRevision:z.number().int().nonnegative(),markdown:z.string().min(1).max(200000)})
export const patchSchema = z.object({
  baseRevision: z.number().int().nonnegative(),
  label: z.string().min(1).max(160),
  operations: z.array(z.discriminatedUnion('op', [
    z.object({ op: z.literal('move'), id, x: z.number().finite(), y: z.number().finite() }),
    z.object({ op: z.literal('update'), id, text: z.string().max(4000).optional(), color: z.enum(['black','grey','light-violet','violet','blue','light-blue','yellow','orange','green','light-green','light-red','red','white']).optional(), fillColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(), status: z.enum(['done','implementing','planned']).optional(), refs: references.optional() }),
    z.object({ op: z.literal('create'), id, text: z.string().max(4000), x: z.number().finite(), y: z.number().finite(), color: z.string().optional(), repoPath: z.string().max(300).optional(), refs: references.optional() }),
    z.object({ op: z.literal('connect'), from: id, to: id, text: z.string().max(4000).optional() }),
    z.object({ op: z.literal('delete'), id }),
  ])).min(1).max(100),
})
export const richText = text => ({ type: 'doc', content: text.split('\n').map(text => ({ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] })) })
const equal = (a,b) => JSON.stringify(a) === JSON.stringify(b)
export class CanvasState {
  constructor(saved, validate = () => {}) {
    this.data = saved ?? { revision: 0, records: {}, transactions: [] }
    for(const [id,name] of documentIds(this.data.records))this.data.records[id].meta={...this.data.records[id].meta,documentId:name}
    this.validate = validate
    this.selection = []
  }
  context({geometry=false}={}) {
    return {revision: this.data.revision, selection: this.selection, ...framework(this.data.records,{geometry}), ...(geometry?{diagnostics:layoutDiagnostics(this.data.records)}:{})}
  }
  arrange(baseRevision) {
    return this.commit(arrangeRecords(this.data.records),baseRevision,'codex','自动整理框架图')
  }
  commit(records, baseRevision, author, label) {
    if (baseRevision !== this.data.revision) throw new Error('画布已发生变化，请基于最新版本重试。')
    for(const [id,name] of documentIds(records)){
      records[id].meta={...records[id].meta,documentId:name}
      if(records[id].meta.refs!==undefined)records[id].meta.refs=normalizeReferences(records[id].meta.refs)
    }
    this.validate(records)
    const changes = [...new Set([...Object.keys(this.data.records),...Object.keys(records)])].filter(id=>!equal(this.data.records[id],records[id])).map(id=>({id,before:this.data.records[id]??null,after:records[id]??null}))
    if (!changes.length) return null
    const transaction = { id:randomUUID(), author, label, time:Date.now(), changes, revision:this.data.revision+1 }
    this.data = { records, revision:this.data.revision+1, transactions:[transaction,...this.data.transactions].slice(0,100) }
    return transaction
  }
  patch(input) {
    const patch = patchSchema.parse(input)
    const records = structuredClone(this.data.records)
    const get = id => { if (!records[id] || records[id].typeName !== 'shape') throw new Error('找不到图形：'+id); return records[id] }
    for (const op of patch.operations) {
      try {
      if (op.op === 'move') Object.assign(get(op.id), { x:op.x,y:op.y })
      if (op.op === 'update') {
        const r = get(op.id)
        if (op.text !== undefined) { if (!('richText' in r.props)) throw new Error('此图形不支持文字'); r.props.richText=richText(op.text) }
        if (op.color) r.props.color=op.color
        if (op.fillColor) {
          if(r.type!=='geo'||r.props.geo!=='rectangle') throw new Error('独立填充颜色只适用于方框')
          r.meta.fillColor=op.fillColor;r.props.fill='solid'
        }
        if (op.status) r.meta.status=op.status
        if (op.refs !== undefined) r.meta.refs=normalizeReferences(op.refs)
      }
      if (op.op === 'create') {
        if (records[op.id] || !op.id.startsWith('shape:')) throw new Error('新图形 ID 必须唯一且以 shape: 开头')
        const template = Object.values(records).find(r=>r.typeName==='shape')
        const parentId=Object.values(records).find(r=>r.typeName==='page')?.id??template?.parentId
        if (!parentId&&!template) throw new Error('请先打开画布以创建页面')
        const highest=Object.values(records).filter(r=>r.typeName==='shape'&&r.parentId===parentId).map(r=>r.index).sort().at(-1)
        records[op.id] = {id:op.id,typeName:'shape',type:'geo',parentId,index:getIndexAbove(highest),x:op.x,y:op.y,rotation:0,isLocked:false,opacity:1,meta:{status:'planned',owner:'codex',repoPath:op.repoPath??'',...(op.refs!==undefined?{refs:normalizeReferences(op.refs)}:{})},props:{...boxProps(op.text),w:210,h:100,color:op.color??'green'}}
      }
      if (op.op === 'connect') {
        const from=get(op.from),to=get(op.to)
        if(from.type!=='geo'||to.type!=='geo')throw new Error('连线两端必须是方框')
        const arrowId='shape:'+randomUUID()
        if(from.parentId!==to.parentId) throw new Error('本 demo 仅支持同一父页面下的模块连接')
        const highest=[from.index,to.index].sort().at(-1)
        const next=Object.values(records).filter(r=>r.typeName==='shape'&&r.parentId===from.parentId&&r.index>highest).map(r=>r.index).sort()[0]
        const arrowIndex=next?getIndexBetween(highest,next):getIndexAbove(highest)
        records[arrowId]={id:arrowId,typeName:'shape',type:'arrow',parentId:from.parentId,index:arrowIndex,x:from.x,y:from.y,rotation:0,isLocked:false,opacity:1,meta:{owner:'codex'},props:{...arrowProps(op.text??''),start:{x:from.props.w??210,y:(from.props.h??100)/2},end:{x:to.x-from.x,y:to.y-from.y+(to.props.h??100)/2}}}
        for(const [terminal,target,x] of [['start',op.from,1],['end',op.to,0]]) {
          const bindingId='binding:'+randomUUID()
          records[bindingId]={id:bindingId,typeName:'binding',type:'arrow',meta:{},fromId:arrowId,toId:target,props:{terminal,normalizedAnchor:{x,y:0.5},isExact:true,isPrecise:true,snap:'edge-point'}}
        }
      }
      if (op.op === 'delete') {
        get(op.id)
        const removed=new Set([op.id])
        for(const r of Object.values(records)) if(r.typeName==='binding'&&r.toId===op.id) removed.add(r.fromId)
        for(const r of Object.values(records)) if(removed.has(r.id)||(r.typeName==='binding'&&(removed.has(r.fromId)||removed.has(r.toId)))) delete records[r.id]
      }
      } catch (error) { throw new Error(`${op.op} ${op.id??`${op.from} → ${op.to}`}: ${error.message}`) }
    }
    const structural=patch.operations.some(op=>['create','delete','connect'].includes(op.op))
    return this.commit(structural?arrangeRecords(records):records,patch.baseRevision,'codex',patch.label)
  }
  importMarkdown(input) {
    const {markdown,baseRevision}=importSchema.parse(input)
    const graph=parseArchitecture(markdown)
    const additions=architectureRecords(graph,this.data.records)
    const records={...this.data.records,...Object.fromEntries(additions.map(r=>[r.id,r]))}
    return this.commit(arrangeRecords(records),baseRevision,'codex','导入 Markdown 框架图')
  }
  undo(transactionId, baseRevision) {
    const tx=this.data.transactions.find(t=>t.id===transactionId)
    if(!tx || tx.undone) throw new Error(`undo ${transactionId}: 该事务不存在或已撤销`)
    const records=structuredClone(this.data.records)
    for(const c of tx.changes) {
      if(!equal(records[c.id]??null,c.after)) throw new Error(`undo ${transactionId}, ${c.id}: 这些图形之后又被修改，不能直接撤销；请先撤销后续修改。`)
      if(c.before) records[c.id]=c.before; else delete records[c.id]
    }
    const result=this.commit(records,baseRevision,'human','撤销 · '+tx.label)
    this.data.transactions=this.data.transactions.map(t=>t.id===tx.id?{...t,undone:true}:t)
    return result
  }
}
