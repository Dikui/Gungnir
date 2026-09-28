import { getIndexAbove } from '@tldraw/utils'

export const plainText = node => node?.type === 'hardBreak' ? '\n' : node?.text ?? (node?.content ?? []).map(plainText).join(node?.type === 'doc' ? '\n' : '')
const richText = text => ({type:'doc',content:text.split('\n').map(text=>({type:'paragraph',content:text?[{type:'text',text}]:[]}))})
const quote = text => text === '' ? '"#8203;"' : '"' + text.replace(/[#&"<>|`\\\r]/g, char => `#${char.codePointAt(0)};`).replace(/\n/g,'<br/>') + '"'
const decode = text => text === '#8203;' ? '' : text.replace(/<br\s*\/?\s*>/gi,'\n').replace(/#(quot|amp|lt|gt|\d+);/g,(_,code)=> {
  const named={quot:'"',amp:'&',lt:'<',gt:'>'}
  if(named[code])return named[code]
  const n=Number(code)
  if(n>0x10ffff || (n>=0xd800&&n<=0xdfff))throw new Error('描述中包含无效字符编码')
  return String.fromCodePoint(n)
})

export function exportArchitecture(records) {
  const values=Object.values(records)
  const boxes=values.filter(r=>r.typeName==='shape'&&r.type==='geo'&&r.props.geo==='rectangle').sort((a,b)=>a.id.localeCompare(b.id))
  if(!boxes.length)throw new Error('画布中没有可导出的方框')
  const ids=new Map(boxes.map((box,i)=>[box.id,`N${i+1}`])), endpoints=new Map()
  for(const r of values) {
    if(r.typeName!=='binding'||r.type!=='arrow')continue
    if(!endpoints.has(r.fromId))endpoints.set(r.fromId,{})
    endpoints.get(r.fromId)[r.props.terminal]=ids.get(r.toId)
  }
  const edges=values.filter(r=>r.typeName==='shape'&&r.type==='arrow').map(arrow=>{
    let {start,end}=endpoints.get(arrow.id)??{}
    if(!start||!end)throw new Error('有连线未连接到两个方框，请连接两端后再导出架构。')
    const left=arrow.props.arrowheadStart!=='none',right=arrow.props.arrowheadEnd!=='none'
    if(left&&!right)[start,end]=[end,start]
    const direction=left&&right?'<-->':left||right?'-->':'---',text=plainText(arrow.props.richText)
    return `  ${start} ${direction}${text?'|'+quote(text)+'|':''} ${end}`
  }).sort()
  return ['```mermaid','flowchart LR',...boxes.map(box=>`  ${ids.get(box.id)}[${quote(plainText(box.props.richText))}]`),'',...edges,'```',''].join('\n')
}

// Deliberately parse the box-and-connection subset. Reject unsupported syntax instead of losing it.
export function parseArchitecture(markdown) {
  if(typeof markdown!=='string'||markdown.length>200000)throw new Error('Markdown 最大支持 200,000 个字符')
  const blocks=[...markdown.matchAll(/^[ \t]*```mermaid[ \t]*\r?\n([\s\S]*?)^[ \t]*```[ \t]*(?:\r?\n|$)/gmi)]
  if(blocks.length>1)throw new Error('每次请导入一个 Mermaid 框架图')
  const source=(blocks.length?blocks[0][1]:markdown).trim()
  const header=source.match(/^(?:flowchart|graph)\s+(LR|RL|TB|TD|BT)\b/)
  if(!header)throw new Error('需要 Mermaid flowchart / graph 框架图（LR、RL、TB、TD 或 BT）')
  let pos=header[0].length
  const nodes=new Map(),edges=[]
  const fail=()=>{throw new Error(`不支持或不完整的 Mermaid 语法（图内第 ${source.slice(0,pos).split('\n').length} 行）。支持方框、箭头和连线描述。`)}
  const skip=()=>{while(pos<source.length){if(/[\s;]/.test(source[pos])){pos++;continue}if(source.startsWith('%%',pos)){const end=source.indexOf('\n',pos);pos=end<0?source.length:end;continue}break}}
  const label=closing=>{
    let text
    if(source[pos]==='"') {const end=source.indexOf('"',++pos);if(end<0)fail();text=source.slice(pos,end);pos=end+1;while(/[ \t]/.test(source[pos]??'')&&pos<source.length)pos++}
    else {const end=source.indexOf(closing,pos);if(end<0)fail();text=source.slice(pos,end).trim();pos=end;if(/[\[\]{}\n]/.test(text))fail()}
    if(source[pos++]!==closing)fail()
    // Only <br> is interpreted as markup. Other tags require entity escaping.
    if(/<[^>]*>/.test(text.replace(/<br\s*\/?\s*>/gi,'')))fail()
    text=decode(text)
    if(text.length>4000)throw new Error('单个方框或连线描述最多 4000 个字符')
    return text
  }
  const endpoint=()=>{
    skip()
    const match=source.slice(pos).match(/^[A-Za-z_][A-Za-z0-9_]*(?:-(?!->)[A-Za-z0-9_]+)*/)
    if(!match)fail()
    const id=match[0];pos+=id.length
    if(['subgraph','end','style','classDef','class','click','linkStyle','direction'].includes(id))fail()
    while(/[ \t]/.test(source[pos]??'')&&pos<source.length)pos++
    let text
    if(source[pos]==='['){pos++;text=label(']')}
    const previous=nodes.get(id)
    if(text!==undefined&&previous?.explicit&&previous.text!==text)throw new Error(`方框 ${id} 的描述重复且不一致`)
    if(!previous||text!==undefined)nodes.set(id,{id,text:text??id,explicit:text!==undefined})
    if(nodes.size>200)throw new Error('每次最多导入 200 个方框')
    return id
  }
  while(true) {
    skip();if(pos===source.length)break
    let from=endpoint()
    while(true) {
      // A newline ends a statement unless the following token is an arrow.
      const end=pos
      while(/\s/.test(source[pos]??'')&&pos<source.length)pos++
      const arrow=source.slice(pos).match(/^(<-->|-->|<--|---)/)
      if(!arrow) {
        if(pos<source.length&&!source.startsWith('%%',pos)&&source[pos]!==';'&&!source.slice(end,pos).includes('\n'))fail()
        break
      }
      pos+=arrow[0].length;while(/\s/.test(source[pos]??'')&&pos<source.length)pos++
      let text=''
      if(source[pos]==='|'){pos++;text=label('|')}
      if(source[pos]===';'||source.startsWith('%%',pos))fail()
      const to=endpoint(),reverse=arrow[0]==='<--'
      edges.push({from:reverse?to:from,to:reverse?from:to,text,direction:arrow[0]==='<-->'?'both':arrow[0]==='---'?'none':'forward'})
      if(edges.length>500)throw new Error('每次最多导入 500 条连线')
      from=to
    }
  }
  if(!nodes.size)throw new Error('框架图中没有方框')
  return {direction:header[1],nodes:[...nodes.values()].map(({id,text})=>({id,text})),edges}
}


export const boxProps = text => ({w:240,h:110,geo:'rectangle',dash:'solid',growY:0,url:'',scale:1,color:'black',labelColor:'black',fill:'none',size:'m',font:'sans',align:'middle',verticalAlign:'middle',richText:richText(text)})
export const arrowProps = text => ({kind:'elbow',elbowMidPoint:0.5,dash:'solid',size:'s',fill:'none',color:'grey',labelColor:'black',bend:0,start:{x:0,y:0},end:{x:100,y:0},arrowheadStart:'none',arrowheadEnd:'arrow',richText:richText(text),labelPosition:0.5,font:'sans',scale:1})

// Shared by the browser and MCP so imported diagrams have identical semantics and defaults.
export function architectureRecords(graph,records,parentId,origin) {
  const existing=Object.values(records).filter(r=>r.typeName==='shape')
  const page=parentId??Object.values(records).find(r=>r.typeName==='page')?.id
  if(!page)throw new Error('请先打开画布以创建页面')
  const offset=origin??{x:70,y:existing.length?Math.max(...existing.map(r=>r.y+(r.props.h??200)+(r.props.growY??0)))+200:70}
  const degree=new Map(graph.nodes.map(n=>[n.id,0])),level=new Map(graph.nodes.map(n=>[n.id,0]))
  for(const edge of graph.edges)if(edge.from!==edge.to)degree.set(edge.to,degree.get(edge.to)+1)
  const queue=graph.nodes.filter(n=>degree.get(n.id)===0).map(n=>n.id)
  for(let i=0;i<queue.length;i++)for(const edge of graph.edges.filter(e=>e.from===queue[i]&&e.from!==e.to)) {
    level.set(edge.to,Math.max(level.get(edge.to),level.get(edge.from)+1));degree.set(edge.to,degree.get(edge.to)-1)
    if(degree.get(edge.to)===0)queue.push(edge.to)
  }
  // Cycles share one column/row; users can refine the layout after import.
  const cycleLevel=Math.max(...level.values())+1
  for(const [id,count] of degree)if(count>0)level.set(id,cycleLevel)
  const maxLevel=Math.max(...level.values()),horizontal=['LR','RL'].includes(graph.direction),reverse=['RL','BT'].includes(graph.direction)
  const heights=new Map(graph.nodes.map(n=>[n.id,Math.max(110,n.text.split('\n').reduce((sum,line)=>sum+Math.max(1,Math.ceil([...line].length/17)),0)*28+32)]))
  const rowHeight=Math.max(...heights.values())+100,rows=new Map(),result=[],byId=new Map()
  let index=existing.filter(r=>r.parentId===page).map(r=>r.index).sort().at(-1)
  const prefix=crypto.randomUUID()
  const shape=(type,id,x,y,props)=>{index=getIndexAbove(index);const r={id,type,typeName:'shape',parentId:page,index,x,y,rotation:0,isLocked:false,opacity:1,meta:{},props};result.push(r);return r}
  graph.nodes.forEach((node,i)=>{
    const rank=level.get(node.id),row=rows.get(rank)??0;rows.set(rank,row+1)
    const column=reverse?maxLevel-rank:rank
    const x=offset.x+(horizontal?column:row)*380,y=offset.y+(horizontal?row:column)*rowHeight
    byId.set(node.id,shape('geo',`shape:${prefix}-n${String(i).padStart(3,'0')}`,x,y,{...boxProps(node.text),h:heights.get(node.id)}))
  })
  graph.edges.forEach((edge,i)=>{
    const from=byId.get(edge.from),to=byId.get(edge.to)
    const start=horizontal?{x:reverse?0:1,y:0.5}:{x:0.5,y:reverse?0:1}
    const end=horizontal?{x:reverse?1:0,y:0.5}:{x:0.5,y:reverse?1:0}
    const arrow=shape('arrow',`shape:${prefix}-e${i}`,from.x,from.y,{...arrowProps(edge.text),start:{x:start.x*from.props.w,y:start.y*from.props.h},end:{x:to.x-from.x+end.x*to.props.w,y:to.y-from.y+end.y*to.props.h},arrowheadStart:edge.direction==='both'?'arrow':'none',arrowheadEnd:edge.direction==='none'?'none':'arrow'})
    for(const [terminal,target,anchor] of [['start',from,start],['end',to,end]])result.push({id:`binding:${prefix}-${i}-${terminal}`,typeName:'binding',type:'arrow',fromId:arrow.id,toId:target.id,meta:{},props:{terminal,normalizedAnchor:anchor,isExact:true,isPrecise:true,snap:'edge-point'}})
  })
  return result
}
