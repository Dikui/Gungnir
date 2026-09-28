import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CanvasState, richText } from './state.mjs'

const records={
  'shape:a':{id:'shape:a',typeName:'shape',type:'geo',x:0,y:0,meta:{status:'planned'},props:{richText:richText('A'),w:210,h:100}},
  'shape:b':{id:'shape:b',typeName:'shape',type:'geo',x:300,y:0,meta:{},props:{richText:richText('B'),w:210,h:100}},
}
const make=()=>new CanvasState({revision:1,records:structuredClone(records),transactions:[]})
test('patch is atomic and rejects stale revisions and invalid operations',()=>{
  const state=make(),original=structuredClone(state.data)
  assert.throws(()=>state.patch({baseRevision:1,label:'invalid',operations:[{op:'move',id:'shape:a',x:42,y:0},{op:'move',id:'missing',x:0,y:0}]}))
  assert.deepEqual(state.data,original)
  assert.throws(()=>state.patch({baseRevision:0,label:'stale',operations:[{op:'move',id:'shape:a',x:42,y:0}]}))
  assert.deepEqual(state.data,original)
})
test('undo preserves later edits to unrelated records, and its inverse can redo',()=>{
  const state=make()
  const tx=state.patch({baseRevision:1,label:'move A',operations:[{op:'move',id:'shape:a',x:42,y:12}]})
  const human=structuredClone(state.data.records);human['shape:b'].x=999
  state.commit(human,2,'human','move B')
  const inverse=state.undo(tx.id,3)
  assert.equal(state.data.records['shape:a'].x,0)
  assert.equal(state.data.records['shape:b'].x,999)
  state.undo(inverse.id,4)
  assert.equal(state.data.records['shape:a'].x,42)
})
test('undo refuses to overwrite a subsequent human edit on the same record',()=>{
  const state=make(),tx=state.patch({baseRevision:1,label:'move A',operations:[{op:'move',id:'shape:a',x:42,y:0}]})
  const human=structuredClone(state.data.records);human['shape:a'].x=99
  state.commit(human,2,'human','manual edit')
  assert.throws(()=>state.undo(tx.id,3),/之后又被修改/)
  assert.equal(state.data.records['shape:a'].x,99)
})
test('fill color changes preserve border and metadata and undo restores the prior fill',()=>{
  const state=make(),shape=state.data.records['shape:a']
  Object.assign(shape.props,{geo:'rectangle',color:'blue',fill:'none'})
  const tx=state.patch({baseRevision:1,label:'fill',operations:[{op:'update',id:shape.id,fillColor:'#fed7aa'}]})
  assert.equal(state.data.records[shape.id].props.color,'blue')
  assert.equal(state.data.records[shape.id].props.fill,'solid')
  assert.equal(state.data.records[shape.id].meta.fillColor,'#fed7aa')
  assert.equal(state.data.records[shape.id].meta.status,'planned')
  state.undo(tx.id,2)
  assert.equal(state.data.records[shape.id].props.fill,'none')
  assert.equal(state.data.records[shape.id].meta.fillColor,undefined)
  assert.throws(()=>state.patch({baseRevision:3,label:'invalid fill',operations:[{op:'update',id:shape.id,fillColor:'url(https://invalid)'}]}))
})
test('new modules and bound arrows have valid, distinct stacking positions and undo together',()=>{
  const state=make()
  state.data.records['shape:a'].index='a1';state.data.records['shape:b'].index='a3'
  state.data.records['shape:arrow']={id:'shape:arrow',typeName:'shape',type:'arrow',index:'a4',props:{kind:'arc',bend:30,start:{x:0,y:0},end:{x:100,y:0}},meta:{}}
  state.data.records['binding:ab']={id:'binding:ab',typeName:'binding',type:'arrow',fromId:'shape:arrow',toId:'shape:a',props:{terminal:'start'}}
  const original=structuredClone(state.data.records)
  const tx=state.patch({baseRevision:1,label:'expand',operations:[{op:'create',id:'shape:c',text:'C',x:100,y:200},{op:'connect',from:'shape:a',to:'shape:c',text:'传递检测结果'}]})
  const created=state.data.records['shape:c']
  const arrow=Object.values(state.data.records).find(r=>r.typeName==='shape'&&r.type==='arrow'&&r.id!=='shape:arrow')
  assert.ok(created.index>'a4')
  assert.ok(arrow.index>created.index)
  assert.equal(arrow.props.kind,'elbow')
  assert.equal(arrow.props.bend,0)
  assert.deepEqual(arrow.props.richText,richText('传递检测结果'))
  state.patch({baseRevision:2,label:'rename edge',operations:[{op:'update',id:arrow.id,text:'目标列表'}]})
  assert.deepEqual(state.data.records[arrow.id].props.richText,richText('目标列表'))
  state.undo(state.data.transactions[0].id,3)
  assert.equal(Object.values(state.data.records).filter(r=>r.typeName==='binding'&&r.fromId===arrow.id).length,2)
  state.undo(tx.id,4)
  assert.deepEqual(state.data.records,original)
})

test('semantic export preserves descriptions and topology while ignoring visual properties', async()=>{
  const {exportArchitecture,parseArchitecture}=await import('./architecture.mjs')
  const doc=structuredClone(records)
  for(const r of Object.values(doc)) r.props.geo='rectangle'
  doc['shape:a'].props.richText=richText('相同描述\n"接口"')
  doc['shape:b'].props.richText=richText('相同描述\n"接口"')
  doc['shape:c']={...structuredClone(doc['shape:a']),id:'shape:c',props:{geo:'rectangle',richText:richText('孤立方框')}}
  for(const [i,start,end,headStart,headEnd,text] of [
    [1,'a','b','none','arrow','请求\n返回'],[2,'a','b','none','arrow','另一接口'],
    [3,'b','a','arrow','none','反向'],[4,'a','a','arrow','arrow','回路'],[5,'a','b','none','none','关联'],
  ]) {
    const arrowId='shape:edge'+i
    doc[arrowId]={id:arrowId,typeName:'shape',type:'arrow',props:{arrowheadStart:headStart,arrowheadEnd:headEnd,richText:richText(text)}}
    for(const [terminal,target] of [['start',start],['end',end]]) {
      const id=`binding:${i}${terminal}`
      doc[id]={id,typeName:'binding',type:'arrow',fromId:arrowId,toId:'shape:'+target,props:{terminal}}
    }
  }
  const text=exportArchitecture(doc)
  const graph=parseArchitecture(text)
  assert.deepEqual(graph.nodes.map(n=>n.text),['相同描述\n"接口"','相同描述\n"接口"','孤立方框'])
  assert.equal(graph.edges.length,5)
  assert.ok(graph.edges.some(e=>e.from==='N1'&&e.to==='N1'&&e.direction==='both'&&e.text==='回路'))
  assert.ok(graph.edges.some(e=>e.from==='N1'&&e.to==='N2'&&e.text==='反向'))
  assert.ok(graph.edges.some(e=>e.text==='请求\n返回'))
  assert.ok(graph.edges.some(e=>e.direction==='none'))
  for(const r of Object.values(doc)) {r.x=999;r.y=42;r.meta={color:'red',status:'planned'};Object.assign(r.props,{w:500,h:300,color:'green',dash:'dotted'})}
  assert.equal(exportArchitecture(doc),text)
  delete doc['binding:1end']
  assert.throws(()=>exportArchitecture(doc),/连接到两个方框/)
})

test('Markdown parsing supports exported text, chains, inline nodes, entities and rejects unsupported input',async()=>{
  const {parseArchitecture}=await import('./architecture.mjs')
  const graph=parseArchitecture('# Design\n```mermaid\nflowchart RL; A["a#35;quot; #34;b#34; <br/>#60;br/#62;"] -->|"x#124;y"| B[同名] <--> C[同名]; D; %% note\nC --- D\n```\nOther prose')
  assert.equal(graph.direction,'RL')
  assert.equal(graph.nodes.length,4)
  assert.equal(graph.nodes[0].text,'a#quot; "b" \n<br/>')
  assert.equal(graph.edges[0].text,'x|y')
  assert.equal(graph.edges[1].direction,'both')
  assert.equal(graph.edges[2].direction,'none')
  for(const source of ['flowchart LR\nA -->','flowchart LR\nA[bad','flowchart LR\nA[one]\nA[two]', 'flowchart LR\nsubgraph cluster\nA\nend','flowchart LR\nA{decision}', 'flowchart LR\nclick A "https://example.com"', 'flowchart LR\nA["<script>alert(1)</script>"]', 'flowchart LR\nA -->|"missing" B', 'flowchart LR', '```mermaid\nflowchart LR\nA\n```\n```mermaid\nflowchart LR\nB\n```'])assert.throws(()=>parseArchitecture(source),source)
  assert.throws(()=>parseArchitecture('x'.repeat(200001)))
})

test('import creates schema-valid editable records on an empty page, round-trips semantics and undoes atomically',async()=>{
  const {createTLSchema}=await import('@tldraw/tlschema')
  const {parseArchitecture,exportArchitecture}=await import('./architecture.mjs')
  const schema=createTLSchema()
  const page=schema.types.page.create({id:'page:page',name:'Test',index:'a1'})
  const validate=records=>{for(const r of Object.values(records))schema.types[r.typeName].validate(r)}
  const state=new CanvasState({revision:0,records:{[page.id]:page},transactions:[]},validate)
  const original=structuredClone(state.data)
  const source='```mermaid\nflowchart TB\nA["相同\\ #quot; #60;br/#62;"] -->|"请求<br/>返回"| B["相同"]\nA --> B\nB <--> A\nA --- A\nC["孤立"]\n```'
  assert.throws(()=>state.importMarkdown({baseRevision:0,markdown:'flowchart LR\nA -->'}))
  assert.deepEqual(state.data,original)
  const tx=state.importMarkdown({baseRevision:0,markdown:source})
  const shapeCount=()=>Object.values(state.data.records).filter(r=>r.typeName==='shape').length
  assert.equal(shapeCount(),7)
  const graph=parseArchitecture(exportArchitecture(state.data.records))
  const input=parseArchitecture(source)
  assert.deepEqual(graph.nodes.map(n=>n.text),input.nodes.map(n=>n.text))
  const semanticEdges=g=>g.edges.map(e=>[g.nodes.find(n=>n.id===e.from).text,g.nodes.find(n=>n.id===e.to).text,e.direction,e.text]).sort()
  assert.deepEqual(semanticEdges(graph),semanticEdges(input))
  assert.throws(()=>state.importMarkdown({baseRevision:0,markdown:source}),/最新版本/)
  assert.equal(shapeCount(),7)
  const firstRecords=structuredClone(state.data.records)
  const second=state.importMarkdown({baseRevision:1,markdown:'flowchart LR\nA["Second"] --> B'})
  for(const [id,record] of Object.entries(firstRecords))assert.deepEqual(state.data.records[id],record)
  state.undo(second.id,2)
  assert.deepEqual(state.data.records,firstRecords)
  state.undo(tx.id,3)
  assert.deepEqual(state.data.records,original.records)
})

test('hard line breaks survive semantic export and malformed statement separators are rejected',async()=>{
  const {plainText,parseArchitecture}=await import('./architecture.mjs')
  assert.equal(plainText({type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'第一行'},{type:'hardBreak'},{type:'text',text:'第二行'}]}]}),'第一行\n第二行')
  for(const source of ['flowchart LR\nA[One] junk','flowchart LR\nA --> B stray','flowchart LR\nA --> B; --> C','flowchart LR\nA -->; B'])assert.throws(()=>parseArchitecture(source))
  assert.equal(parseArchitecture('flowchart LR\nA --> B; C --> D').edges.length,2)
})

test('MCP can create boxes and labeled connections on an empty page without templates',async()=>{
  const {createTLSchema}=await import('@tldraw/tlschema')
  const schema=createTLSchema(),page=schema.types.page.create({id:'page:page',name:'Empty',index:'a1'})
  const s=new CanvasState({revision:0,records:{[page.id]:page},transactions:[]},records=>{for(const r of Object.values(records))schema.types[r.typeName].validate(r)})
  const tx=s.patch({baseRevision:0,label:'build from scratch',operations:[{op:'create',id:'shape:a',text:'A',x:0,y:0},{op:'create',id:'shape:b',text:'B',x:300,y:0},{op:'connect',from:'shape:a',to:'shape:b',text:'数据'}]})
  const arrow=Object.values(s.data.records).find(r=>r.type==='arrow'&&r.typeName==='shape')
  assert.equal(arrow.props.arrowheadStart,'none')
  assert.equal(arrow.props.arrowheadEnd,'arrow')
  assert.deepEqual(arrow.props.richText,richText('数据'))
  assert.equal(Object.values(s.data.records).filter(r=>r.typeName==='binding').length,2)
  s.undo(tx.id,1)
  assert.deepEqual(s.data.records,{[page.id]:page})
})

test('empty labels use valid Mermaid syntax and distinguish literal entity text',async()=>{
  const {exportArchitecture,parseArchitecture}=await import('./architecture.mjs')
  for(const text of ['', '#8203;', '\u200b','<br/>','#quot;']){
    const output=exportArchitecture({a:{id:'shape:a',typeName:'shape',type:'geo',props:{geo:'rectangle',richText:richText(text)}}})
    assert.ok(!output.includes('[""]'))
    assert.equal(parseArchitecture(output).nodes[0].text,text)
  }
})
