import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
const require=createRequire('/tmp/002-mockup-browser-r2-u5hli9yx/driver.cjs');
const {chromium}=require('playwright-core');
const out=path.resolve('docs/tasks/002-mockup-browser/evidence');
const sample=path.resolve('docs/tasks/001-mockup/evidence/sample');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
fs.writeFileSync(path.join(out,'r2-targeted-processes-during.txt'),execFileSync('ps',['-axo','pid,ppid,command'],{encoding:'utf8'}).split('\n').filter(row=>row.includes('playwright_chromiumdev_profile-')).join('\n')+'\n');
const context=await browser.newContext({viewport:{width:1280,height:800},colorScheme:'light',reducedMotion:'reduce'});
const page=await context.newPage();
const events=[],shots=[],tests=[],scenarios=[];let phase='setup';
page.on('console',m=>events.push({phase,type:m.type(),text:m.text()}));
page.on('pageerror',e=>events.push({phase,type:'pageerror',text:e.stack}));
page.on('requestfailed',r=>events.push({phase,type:'requestfailed',url:r.url(),error:r.failure()}));
const test=(name,pass,detail)=>{tests.push({phase,name,pass:Boolean(pass),detail});console.log(`${pass?'PASS':'FAIL'} ${phase}: ${name} ${JSON.stringify(detail??'')}`);};
const goto=async(file,query='',viewport={width:1280,height:800})=>{phase=file+query;await page.setViewportSize(viewport);await page.goto(pathToFileURL(path.join(sample,file)).href+query);await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));};
const measure=async()=>page.evaluate(()=>{
  const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  const bar=document.querySelector('.switcher'),r=bar?.getBoundingClientRect();
  const controls=[...document.querySelectorAll('td,input,textarea,select,button,p,.hint')].filter(e=>e.getClientRects().length&&!e.closest('.switcher'));
  const intersects=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  const covered=r?controls.filter(e=>{const s=e.getBoundingClientRect();const wrap=e.closest('.table-wrap');return intersects(s,r)&&(!wrap||intersects(s,wrap.getBoundingClientRect()));}).map(e=>{
    const s=e.getBoundingClientRect(),x=(Math.max(s.left,r.left)+Math.min(s.right,r.right))/2,y=(Math.max(s.top,r.top)+Math.min(s.bottom,r.bottom))/2;
    return{tag:e.tagName,text:e.textContent.trim().slice(0,70),value:e.value,rect:rect(e),overlapPoint:{x,y},hit:document.elementFromPoint(x,y)?.outerHTML.slice(0,160)};
  }):[];
  return{viewport:{width:innerWidth,height:innerHeight},documentWidth:document.documentElement.scrollWidth,scrollY,scrollHeight:document.documentElement.scrollHeight,bodyHeight:document.body.getBoundingClientRect().height,bodyPaddingBottom:getComputedStyle(document.body).paddingBottom,reservedHeight:document.body.style.getPropertyValue('--switcher-height'),bar:r?rect(bar):null,folded:bar?.querySelector('button').getAttribute('aria-expanded')==='false',covered,
  controls:controls.filter(e=>['INPUT','TEXTAREA','SELECT','BUTTON'].includes(e.tagName)).map(e=>({tag:e.tagName,text:e.textContent.trim(),rect:rect(e)}))};
});
const snap=async(id,description,extra={})=>{await page.screenshot({path:path.join(out,id+'.png')});shots.push({id,description,url:page.url(),console:events.filter(e=>e.phase===phase),measurement:await measure(),...extra});};
const bottom=async()=>{await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));await page.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));};
try{
  await goto('list.html');await page.locator('[aria-label="筛选条件"] select').selectOption({label:'进行中'});
  test('原生 select 可选择进行中',await page.locator('[aria-label="筛选条件"] select').inputValue()==='进行中');
  await snap('r2-32-filter-selected','原生下拉选值补验');
  for(const menu of [false,true]){
    if(menu)await page.getByRole('button',{name:'更多操作',exact:true}).click();
    const coordinates=await page.evaluate(()=>Object.fromEntries(['[aria-label="筛选条件"] select','[aria-label="筛选条件"] input','[data-toggle="#actions"]','[aria-label="筛选条件"] button:disabled'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return[s,{top:r.top,bottom:r.bottom,height:r.height}];})));
    const edges=Object.values(coordinates).map(x=>x.bottom);
    test('V2 '+(menu?'菜单打开':'默认')+'控件底边一致',Math.max(...edges)-Math.min(...edges)<.1,coordinates);
    await snap(menu?'r2-34-alignment-menu':'r2-33-alignment-default','V2 筛选控件底边测量',{coordinates});
  }
  const definitions=[
    {name:'desktop-menu',id:'35',file:'list.html',menu:true},
    {name:'list-frame-left',id:'36',file:'list.html',query:'?frame=mobile'},
    {name:'list-frame-right',id:'37',file:'list.html',query:'?frame=mobile',right:true},
    {name:'settings-A-frame',id:'38',file:'settings.html',query:'?frame=mobile'},
    {name:'settings-B-frame',id:'39',file:'settings.html',query:'?frame=mobile&variant=B'},
    {name:'list-390-left',id:'40',file:'list.html',viewport:{width:390,height:844}},
    {name:'list-390-right',id:'41',file:'list.html',viewport:{width:390,height:844},right:true},
  ];
  for(const d of definitions){
    await goto(d.file,d.query??'',d.viewport);phase='V1-'+d.name;
    if(d.menu)await page.getByRole('button',{name:'更多操作',exact:true}).click();
    if(d.right)await page.locator('.table-wrap').evaluate(e=>{e.scrollLeft=e.scrollWidth;});
    const initial=await measure();await snap(`r2-${d.id}-${d.name}-initial`,'V1 原遮挡场景首屏');
    await bottom();const scrolled=await measure();
    test('V1 滚到底业务内容不被切换栏遮挡',scrolled.covered.length===0,{name:d.name,initialCovered:initial.covered,scrolled});
    test('增加留白且与切换栏高度同步',parseFloat(scrolled.bodyPaddingBottom)>scrolled.bar.height&&Math.abs(parseFloat(scrolled.reservedHeight)-scrolled.bar.height)<1,scrolled);
    await snap(`r2-${d.id}-${d.name}-bottom`,'V1 滚到底后内容完整');
    await page.evaluate(()=>window.scrollTo(0,0));await page.locator('.switcher > button').click();
    const folded=await measure();test('折叠按钮隐藏方案/状态控件',folded.folded&&await page.locator('.switcher-group:visible').count()===0&&new URL(page.url()).searchParams.get('bar')==='0');
    await snap(`r2-${d.id}-${d.name}-folded`,'V1 原场景折叠切换栏');
    await bottom();const foldedBottom=await measure();test('折叠后滚到底无业务遮挡',foldedBottom.covered.length===0,foldedBottom);
    scenarios.push({name:d.name,initial,scrolled,folded,foldedBottom});
  }
  for(const [file,query,id] of [['list.html','?frame=mobile&state=error&bar=0','42'],['settings.html','?frame=mobile&variant=B&bar=0','43']]){
    await goto(file,query);phase='bar-persistence-'+file;
    test('直接 bar=0 打开折叠', (await measure()).folded);
    await page.reload();const after=await measure();
    test('刷新保持折叠和其他 URL 参数',after.folded&&new URL(page.url()).searchParams.get('bar')==='0'&&new URL(page.url()).searchParams.get('frame')==='mobile'&&new URL(page.url()).searchParams.get(file==='list.html'?'state':'variant')===(file==='list.html'?'error':'B'));
    await snap(`r2-${id}-bar0-refresh`,'bar=0 刷新保持折叠');
    await page.locator('.switcher > button').click();
    test('展开移除 bar 参数保留其他参数',!(await measure()).folded&&!new URL(page.url()).searchParams.has('bar')&&new URL(page.url()).searchParams.get('frame')==='mobile');
    await snap(`r2-${id}-bar-expanded`,'展开并恢复方案/状态控件');
    await page.locator('.switcher > button').click();
    if(file==='settings.html'){
      await page.locator('h1:visible').click();await page.keyboard.press('ArrowLeft');
      test('折叠时键盘切 A 保留 bar=0',new URL(page.url()).searchParams.get('variant')==='A'&&new URL(page.url()).searchParams.get('bar')==='0');
      await page.reload();test('刷新保留折叠和新方案 A',await page.locator('[data-variant="A"]').isVisible()&&(await measure()).folded);
      await snap('r2-44-folded-keyboard-refresh','折叠时键盘切换方案并刷新');
    }
  }
  await goto('settings.html');phase='V3-width';
  const save=()=>page.locator('[data-variant="A"] [data-panel]:visible [data-toggle="#saved"]');
  const a=await save().evaluate(e=>({width:e.getBoundingClientRect().width,left:e.getBoundingClientRect().left}));await snap('r2-45-save-basic','V3 基本信息保存按钮',{button:a});
  await page.getByRole('tab',{name:'通知',exact:true}).click();const b=await save().evaluate(e=>({width:e.getBoundingClientRect().width,left:e.getBoundingClientRect().left}));
  test('V3 两 tab 保存按钮宽度及左边缘一致',Math.abs(a.width-b.width)<.1&&Math.abs(a.left-b.left)<.1,{basic:a,notification:b});await snap('r2-46-save-notification','V3 通知保存按钮',{button:b});
  phase='block-css-fixture';
  fs.writeFileSync(path.join(out,'r2-button-fixture.html'),'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><link rel="stylesheet" href="r2-static/kit/tokens.css"><link rel="stylesheet" href="r2-static/kit/mockup.css"><body><main class="container"><section class="card stack"><h1>按钮宽度检查（证据夹具）</h1><button class="btn primary">普通按钮</button><button class="btn primary block">整行按钮</button></section></main></body></html>');
  await page.goto(pathToFileURL(path.join(out,'r2-button-fixture.html')).href);
  const widths=await page.evaluate(()=>{const s=document.querySelector('.stack'),a=document.querySelector('.btn'),b=document.querySelector('.block');return{ordinary:a.getBoundingClientRect().width,block:b.getBoundingClientRect().width,parentContent:s.clientWidth-parseFloat(getComputedStyle(s).paddingLeft)-parseFloat(getComputedStyle(s).paddingRight),bodyPadding:getComputedStyle(document.body).paddingBottom};});
  test('新增 btn.block 显式整行宽度且普通按钮按内容',widths.ordinary<widths.block&&Math.abs(widths.block-widths.parentContent)<1&&widths.bodyPadding==='0px',widths);await snap('r2-47-btn-block-fixture','新增 block 修饰类独立证据页',{widths});
  // Check resize observer, dynamic reserve, and absence of overflow while resizing an existing page.
  await goto('list.html');phase='responsive-resize';
  for(const width of [390,320,1280]){
    await page.setViewportSize({width,height:844});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const m=await measure();
    test('窗口 '+width+'px 无新增横向溢出，留白随 bar 同步',m.documentWidth<=width&&Math.abs(parseFloat(m.reservedHeight)-m.bar.height)<1,m);
  }
  await snap('r2-48-resize-back-desktop','动态缩放后恢复桌面');
}finally{
  fs.writeFileSync(path.join(out,'r2-targeted-results.json'),JSON.stringify({tests,shots,scenarios,events},null,2)+'\n');
  fs.writeFileSync(path.join(out,'r2-targeted-console.txt'),shots.map(s=>`[${s.id}] ${s.url}\n`+(s.console.length?JSON.stringify(s.console):'控制台 error/warning/pageerror/requestfailed：无；其他 console 消息：无')).join('\n\n')+'\n完整事件流：\n'+JSON.stringify(events,null,2)+'\n');
  await context.close();await browser.close();console.log(JSON.stringify({checks:tests.length,failed:tests.filter(t=>!t.pass).length,screenshots:shots.length,consoleEvents:events.length}));
}
