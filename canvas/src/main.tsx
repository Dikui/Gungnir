import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Tldraw, ArrowShapeKindStyle, toRichText, type Editor, type TLUiOverrides } from 'tldraw'
import { Boxes, Check, ChevronRight, Download, Layers, MousePointer2, Plus, Upload, Square, HelpCircle, Save, X } from 'lucide-react'
import 'tldraw/tldraw.css'
import './style.css'
import { QuickConnect } from './QuickConnect'
import { FrameworkTools, arrangeEditor } from './FrameworkTools'
import { RoundedArrowShapeUtil } from './RoundedArrow'
import { BoxShapeUtil, CanvasStylePanel } from './BoxColors'
import { parseArchitecture, architectureRecords, framework } from '../architecture.mjs'

const CanvasForeground = () => <><QuickConnect/><FrameworkTools/></>
const canvasComponents = { InFrontOfTheCanvas: CanvasForeground, StylePanel: CanvasStylePanel }
const shapeUtils = [RoundedArrowShapeUtil, BoxShapeUtil]
const topology = (editor:Editor) => {const graph=framework(editor.store.serialize('document'));return JSON.stringify([graph.nodes.map((node:any)=>node.id),graph.edges.map((edge:any)=>[edge.id,edge.from,edge.to])])}
const canvasOverrides:TLUiOverrides = {actions:(editor,actions)=>{
  const remove=actions.delete.onSelect
  return {...actions,delete:{...actions.delete,onSelect:source=>{editor.run(()=>{
    const before=topology(editor);remove(source)
    if(topology(editor)!==before)arrangeEditor(editor)
  })}}}
}}

type Doc = { revision:number; records:Record<string,any>; transactions:any[]; projectPath?:string; architecturePath?:string; hasDraft?:boolean }
const token=location.hash.slice(1)
const empty:Doc={revision:0,records:{},transactions:[]}
async function api(path:string,body?:any) {
  const response=await fetch('/api/'+path,{method:body?'POST':'GET',headers:{'x-canvas-token':token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})})
  const result=await response.json()
  if(!response.ok) throw new Error(result.error??'连接失败')
  return result
}

function fitFramework(editor:Editor,duration=250) {
  const bounds=editor.getCurrentPageBounds()
  if(!bounds)return
  const view=editor.getViewportScreenBounds(),panel=editor.getContainer().querySelector('.tlui-style-panel__wrapper')?.getBoundingClientRect()
  const reserved=panel?.width?Math.max(0,view.maxX-panel.left)+16:0,inset=Math.min(64,view.w/8,view.h/8)
  const zoom=Math.min(1,Math.max(1,view.w-2*inset-reserved)/Math.max(1,bounds.w),Math.max(1,view.h-2*inset)/Math.max(1,bounds.h))
  editor.zoomToBounds({x:bounds.x,y:bounds.y,w:bounds.w+reserved/zoom,h:bounds.h},{inset,targetZoom:zoom,animation:{duration}})
}

function App() {
  const [doc,setDoc]=useState<Doc>(empty), [editor,setEditor]=useState<Editor|null>(null)
  const [status,setStatus]=useState('正在连接'),[error,setError]=useState('')
  const [showConnect,setShowConnect]=useState(false),[showImport,setShowImport]=useState(false),[markdown,setMarkdown]=useState('')
  const modalRef=useRef<HTMLElement|null>(null), flushRef=useRef<()=>Promise<void>>(async()=>{})
  useEffect(()=>{
    if(!showConnect&&!showImport)return
    const previous=document.activeElement as HTMLElement
    modalRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const key=(e:KeyboardEvent)=>{
      if(e.key==='Escape'){setShowConnect(false);setShowImport(false)}
      if(e.key==='Tab'){
        const elements=modalRef.current?.querySelectorAll<HTMLElement>('button, [href], textarea, input, [tabindex="0"]')
        if(!elements?.length)return
        const first=elements[0],last=elements[elements.length-1]
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
      }
    }
    document.addEventListener('keydown',key)
    return()=>{document.removeEventListener('keydown',key);previous?.focus()}
  },[showConnect,showImport])
  const current=useRef<Doc>(empty), dirty=useRef(false), saving=useRef(false), recovery=useRef<any>(null)
  useEffect(()=>{
    if(!editor)return
    let before:string|undefined
    const finish=(event:any)=>{
      if(event.name==='pointer_down')before=topology(editor)
      if(event.name==='pointer_up'){
        if(before!==undefined&&topology(editor)!==before&&!editor.getIsReadonly()){
          editor.run(()=>arrangeEditor(editor));editor.markHistoryStoppingPoint('完成框架调整')
        }
        before=undefined
      }
      if(event.name==='cancel')before=undefined
    }
    editor.on('event',finish)
    return()=>{editor.off('event',finish)}
  },[editor])
  useEffect(()=>{
    if(!editor)return
    let disposed=false, timer:any, stopDoc=()=>{},stopSession=()=>{},stream:EventSource, pendingRemote:Doc|null=null
    function replace(next:Doc) {
      current.current=next;setDoc(next);setStatus(next.hasDraft?'画布草稿已保存':'已同步项目结构图')
      editor!.store.mergeRemoteChanges(()=>{
        const existing=editor!.store.serialize('document')
        editor!.store.remove(Object.keys(existing).filter(id=>!next.records[id]) as any)
        editor!.store.put(Object.values(next.records))
      })
    }
    async function flush() {
      if(saving.current) {while(saving.current) await new Promise(r=>setTimeout(r,20));if(dirty.current)await flush();return}
      if(!dirty.current)return
      saving.current=true;dirty.current=false;setStatus('保存中')
      const records=editor!.store.serialize('document')
      try {
        const next=await api('document',{baseRevision:current.current.revision,records,label:'编辑画布'})
        current.current=next;setDoc(next);setStatus(current.current.hasDraft?'画布草稿已保存':'已同步项目结构图')
      }catch(e:any){
        recovery.current=editor!.store.serialize('document')
        setError(e.message+' 本地编辑已保留，可导出恢复。')
        try {
          const latest=await api('state')
          // Include edits made while either request was pending in the recovery file.
          recovery.current=editor!.store.serialize('document')
          dirty.current=false;replace(latest);setStatus('已加载最新画布')
        }catch {dirty.current=true;setStatus('服务连接中断');return}
      }
      finally {saving.current=false}
      if(dirty.current)await flush()
      if(!dirty.current&&pendingRemote){const pending=pendingRemote;pendingRemote=null;if(pending.revision>current.current.revision)replace(pending)}
    }
    flushRef.current=flush
    ;(async()=>{
      try {
        await api('reload',{});const next=await api('state');if(disposed)return
        replace(next);editor.setStyleForNextShapes(ArrowShapeKindStyle,'elbow');fitFramework(editor,0);await api('selection',{ids:editor.getSelectedShapeIds()});setStatus(current.current.hasDraft?'画布草稿已保存':'已同步项目结构图')
        stopDoc=editor.store.listen(()=>{dirty.current=true;setStatus('保存中');clearTimeout(timer);timer=setTimeout(flush,400)},{source:'user',scope:'document'})
        let selected=''
        stopSession=editor.store.listen(()=>{const ids=editor.getSelectedShapeIds();if(JSON.stringify(ids)===selected)return;selected=JSON.stringify(ids);api('selection',{ids}).catch(()=>{})},{scope:'session'})
        stream=new EventSource('/api/events?token='+encodeURIComponent(token))
        stream.onmessage=e=>{const incoming=JSON.parse(e.data);if(incoming.revision<current.current.revision)return;if(dirty.current||saving.current){if(!pendingRemote||incoming.revision>pendingRemote.revision)pendingRemote=incoming;return}replace(incoming)}
        stream.onerror=()=>setStatus('服务连接中断')
        stream.onopen=()=>{if(dirty.current)void flush();else setStatus(current.current.hasDraft?'画布草稿已保存':'已同步项目结构图')}
      }catch(e:any){setError(e.message);setStatus('连接失败')}
    })()
    const unload=(e:BeforeUnloadEvent)=>{if(dirty.current||saving.current){e.preventDefault();e.returnValue=''}}
    window.addEventListener('beforeunload',unload)
    return()=>{disposed=true;clearTimeout(timer);stopDoc();stopSession();stream?.close();window.removeEventListener('beforeunload',unload)}
  },[editor])

  async function saveProject() {
    try {
      await flushRef.current()
      if(dirty.current||recovery.current)throw new Error('存在未同步的本地编辑，请先处理画布冲突')
      const saved=await api('save',{baseRevision:current.current.revision})
      current.current={...current.current,...saved};setDoc(current.current);setStatus('已同步项目结构图');setError('')
    }catch(e:any){setError(e.message)}
  }

  function download(data:any,name='canvas.json') {
    const url=URL.createObjectURL(new Blob([typeof data==='string'?data:JSON.stringify(data,null,2)],{type:typeof data==='string'?'text/plain;charset=utf-8':'application/json'})),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
  async function downloadArchitecture() {
    if(!editor)return
    try {
      await flushRef.current()
      if(dirty.current||recovery.current)throw new Error('存在未同步的本地编辑，请先处理画布冲突')
      const result=await api('architecture');setError('');download(result.text,'architecture.md')
    }
    catch(e:any) {setError(e.message)}
  }
  function importMarkdown() {
    if(!editor)return
    let mark:string|undefined
    try {
      setError('')
      const graph=parseArchitecture(markdown),bounds=editor.getCurrentPageBounds()
      const records=architectureRecords(graph,editor.store.serialize('document'),editor.getCurrentPageId(),{x:bounds?.x??70,y:bounds?bounds.maxY+200:70})
      mark=editor.markHistoryStoppingPoint('导入 Markdown')
      editor.run(()=>{
        editor.createShapes(records.filter((r:any)=>r.typeName==='shape') as any)
        editor.createBindings(records.filter((r:any)=>r.typeName==='binding') as any)
        arrangeEditor(editor)
        editor.select(...records.filter((r:any)=>r.typeName==='shape').map((r:any)=>r.id))
      })
      editor.markHistoryStoppingPoint('完成 Markdown 导入')
      editor.zoomToSelection({animation:{duration:250}})
      setShowImport(false);setMarkdown('')
    } catch(e:any) {if(mark)editor.bailToMark(mark);setError(e.message)}
  }
  return <div className="app">
    <header className="header"><a className="brand" href={'/#'+token} aria-label="共画首页"><span className="logo"><Square size={18}/><Square size={13}/></span><span>共画<span className="brand-en">canvas</span></span></a><span className="header-divider"/><div className="breadcrumb">项目画布 <ChevronRight size={14}/><strong>{doc.projectPath?.split(/[\\/]/).pop()??'正在加载项目'}</strong></div><div className="header-right"><span className="save-state" role="status"><Check size={14}/>{status}</span><button className="connect-button" onClick={saveProject}><Save size={15}/>保存到项目</button><button className="icon-button" aria-label="使用说明" onClick={()=>setShowConnect(true)}><HelpCircle size={18}/></button></div></header>
    <div className="workspace"><nav className="rail"><button className="rail-active" title="画布" aria-label="画布" onClick={()=>editor&&fitFramework(editor)}><Layers size={21}/></button><button title="添加模块" aria-label="添加模块" onClick={()=>{if(!editor||editor.getIsReadonly())return;const p=editor.getViewportPageBounds().center;editor.markHistoryStoppingPoint('添加模块');editor.run(()=>{editor.createShape({type:'geo',x:p.x-100,y:p.y-50,props:{w:210,h:100,font:'sans',richText:toRichText('新模块'),fill:'solid',color:'green'},meta:{status:'planned',owner:'human'}});arrangeEditor(editor)});editor.markHistoryStoppingPoint('完成添加模块')}}><Plus size={21}/></button><div className="rail-bottom"><button title="导入 Markdown 框架图" aria-label="导入 Markdown 框架图" onClick={()=>setShowImport(true)}><Upload size={20}/></button><button title="导出 Markdown 框架图" aria-label="导出 Markdown 框架图" onClick={downloadArchitecture}><Download size={20}/></button><span className="rail-mark">C</span></div></nav>
      <main className="main"><div className="canvas-bar"><div><span className="board-icon"><Boxes size={15}/></span><span>项目结构图</span><span className="bar-slash">/</span><span className="muted">{doc.architecturePath}</span></div><button className="arrange-button" disabled={!editor} onClick={()=>{if(!editor||editor.getIsReadonly())return;try{editor.markHistoryStoppingPoint('整理布局');editor.run(()=>arrangeEditor(editor));editor.markHistoryStoppingPoint('完成整理布局');fitFramework(editor);setError('')}catch(e:any){setError(e.message)}}}>整理布局</button></div>
        <div className="canvas-surface"><Tldraw onMount={setEditor} components={canvasComponents} shapeUtils={shapeUtils} overrides={canvasOverrides} options={{maxPages:1}} inferDarkMode={false}/><div className="canvas-label"><span>{Object.values(doc.records).some((r:any)=>r.typeName==='shape')?'WORKING CANVAS':'空画布 · 从需求开始共画'}</span></div></div>
        <footer className="canvas-footer"><span><MousePointer2 size={13}/>拖动边中点连线 · 双击改字 · 选中连线编辑描述</span><span>{Object.values(doc.records).filter((r:any)=>r.typeName==='shape'&&r.type==='geo').length} 个模块<span className="footer-dot">·</span>人工与 Agent 共享状态</span></footer>
      </main>
    </div>
    {error&&<div className="error" role="alert"><span>{error}</span>{recovery.current&&<button onClick={()=>download(recovery.current,'canvas-recovery.json')}>导出本地编辑</button>}<button aria-label="关闭错误" onClick={()=>setError('')}><X size={16}/></button></div>}
    {showImport&&<div className="modal-backdrop" onClick={()=>setShowImport(false)}><section ref={modalRef} className="modal" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-label="导入 Markdown 框架图">
      <button className="modal-close icon-button" aria-label="关闭导入" onClick={()=>setShowImport(false)}><X size={20}/></button>
      <h2>导入 Markdown 框架图</h2><p>选择 .md 文件或粘贴 Mermaid 流程图。支持方框、连线和文字描述；添加后整理整张图的布局，可撤销。</p>
      <input type="file" accept=".md,.markdown,.mmd,text/markdown,text/plain" aria-label="选择 Markdown 文件" onChange={async e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';if(!file)return;try{if(file.size>800000)throw new Error('文件过大，请限制在 800 KB 内');setMarkdown(await file.text());setError('')}catch(err:any){setError(err.message)}}}/>
      <textarea style={{resize:'none'}} className="markdown-input" aria-label="Mermaid Markdown 内容" value={markdown} onChange={e=>setMarkdown(e.target.value)} placeholder={'flowchart LR\n  A["模块 A"] -->|"数据"| B["模块 B"]'}/>
      <button className="connect-button" disabled={!markdown.trim()} onClick={importMarkdown}>添加到画布</button>
    </section></div>}
    {showConnect&&<div className="modal-backdrop" onClick={()=>setShowConnect(false)}><section ref={modalRef} className="modal" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-label="使用说明">
      <button className="modal-close icon-button" aria-label="关闭" onClick={()=>setShowConnect(false)}><X size={20}/></button>
      <h2>项目框架图共创</h2><p>当前画布由 Canvas MCP 打开，内容来自项目中登记的 Markdown。人工可直接编辑，也可以在 AI 会话中描述调整。</p>
      <p>画布编辑自动保存为本机草稿。点击「保存到项目」写回 Markdown；Canvas skill 结束前也会执行这一步。文件被外部修改时会提示冲突。</p>
      <p>「导出 Markdown」下载副本；「导入 Markdown」追加内容。重新打开项目时读取最新项目文件，并保留未同步草稿，发生冲突时不自动覆盖。</p>
    </section></div>}
  </div>
}
createRoot(document.getElementById('root')!).render(<App/> )
