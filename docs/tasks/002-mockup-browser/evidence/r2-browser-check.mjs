import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire('/tmp/002-mockup-browser-r2-u5hli9yx/driver.cjs');
const { chromium } = require('playwright-core');
const root = process.cwd();
const evidence = path.join(root, 'docs/tasks/002-mockup-browser/evidence');
const sample = path.join(root, 'docs/tasks/001-mockup/evidence/sample');
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const { execFileSync } = await import('node:child_process');
fs.writeFileSync(path.join(evidence, 'r2-main-processes-during.txt'), execFileSync('ps', ['-axo','pid,ppid,command'],{encoding:'utf8'}).split('\n').filter(row => row.includes('playwright_chromiumdev_profile-')).join('\n')+'\n');
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'light', reducedMotion: 'reduce' });
const page = await context.newPage();
page.setDefaultTimeout(5000);
const events = [], tests = [], shots = [];
let phase = 'setup';
page.on('console', msg => events.push({ phase, type: msg.type(), text: msg.text(), location: msg.location() }));
page.on('pageerror', err => events.push({ phase, type: 'pageerror', text: err.stack }));
page.on('requestfailed', req => events.push({ phase, type: 'requestfailed', url: req.url(), error: req.failure() }));
const check = (name, condition, detail) => { tests.push({ phase, name, pass: Boolean(condition), detail }); console.log(`${condition ? 'PASS' : 'FAIL'} ${phase}: ${name} ${JSON.stringify(detail ?? '')}`); };
const visibleGroups = async attr => page.locator(`[data-${attr}]`).evaluateAll((els, key) => els.filter(el => el.getClientRects().length).map(el => el.dataset[key]), attr);
const focus = async () => page.evaluate(() => ({ tag: document.activeElement.tagName, text: document.activeElement.textContent?.trim(), toggle: document.activeElement.dataset.toggle, inDialog: Boolean(document.activeElement.closest('[role="dialog"]')) }));
const goto = async (file, query = '', viewport = { width: 1280, height: 800 }) => { phase = file + query; await page.setViewportSize(viewport); await page.goto(pathToFileURL(path.join(sample, file)).href + query); await page.evaluate(() => document.fonts.ready); };
const geometry = async () => page.evaluate(() => {
  const rect = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; };
  const selectors = ['body', '.sidebar', '.main', '.topnav', '.container', '.table-wrap', '.switcher', '[data-variant="A"]', '[data-variant="B"]', '.settings-split', '.toast:not([hidden])'];
  return { viewport: { width: innerWidth, height: innerHeight }, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth,
    boxes: Object.fromEntries(selectors.map(s => [s, document.querySelector(s)]).filter(([,e]) => e?.getClientRects().length).map(([s,e]) => [s, rect(e)])),
    horizontalScrollContainers: [...document.querySelectorAll('*')].filter(el => el.clientWidth && el.scrollWidth > el.clientWidth + 1 && ['auto','scroll'].includes(getComputedStyle(el).overflowX)).map(el => ({ tag: el.tagName, class: el.className, clientWidth: el.clientWidth, scrollWidth: el.scrollWidth })),
    overflowingElements: [...document.querySelectorAll('body *')].filter(el => el.getClientRects().length && el.getBoundingClientRect().right > innerWidth + 1 && !el.closest('.table-wrap')).map(el => ({ tag: el.tagName, class: el.className, text: el.textContent.slice(0,70), rect: rect(el) })) };
});
const shot = async (id, description, fullPage = false) => {
  id = 'r2-' + id;
  await page.screenshot({ path: path.join(evidence, id + '.png'), fullPage });
  shots.push({ id, description, phase, url: page.url(), geometry: await geometry(), focus: await focus(), console: events.filter(e => e.phase === phase) });
};
try {
  fs.writeFileSync(path.join(evidence, 'r2-environment.json'), JSON.stringify({ browser: 'Google Chrome', version: browser.version(), playwright: require('playwright-core/package.json').version, platform: process.platform, arch: process.arch, node: process.version, protocol: 'file://', viewport: {width:1280,height:800}, deviceScaleFactor:1, headless:true, colorScheme:'light', reducedMotion:'reduce', browserPidEvidence: 'r2-processes-during.txt' }, null, 2));
  await goto('list.html');
  check('默认状态只显示 default', JSON.stringify(await visibleGroups('state')) === '["default"]');
  check('表格五行且序号 1–5', JSON.stringify(await page.locator('tbody [data-repeat-index]').allTextContents()) === '["1","2","3","4","5"]', await page.locator('tbody tr').count());
  check('侧栏及设计稿底栏可见', await page.locator('.sidebar').isVisible() && (await page.locator('.switcher').innerText()).includes('设计稿'));
  await shot('01-list-default', '列表默认状态');
  for (const [state,id] of [['empty','02'],['loading','03'],['error','04']]) {
    await goto('list.html', '?state=' + state);
    check('仅匹配状态可见', JSON.stringify(await visibleGroups('state')) === JSON.stringify([state]), await visibleGroups('state'));
    await shot(id + '-list-' + state, state + ' 状态');
  }
  phase = 'state-arrows';
  for (const expected of ['default','empty','loading','error']) {
    await page.getByRole('button',{name:'下一个状态'}).click();
    check('右箭头更新 URL 和内容', new URL(page.url()).searchParams.get('state') === expected && JSON.stringify(await visibleGroups('state')) === JSON.stringify([expected]), { expected, url: page.url() });
  }
  await page.getByRole('button',{name:'上一个状态'}).click();
  check('左箭头更新 URL', new URL(page.url()).searchParams.get('state') === 'loading');
  await page.reload();
  check('刷新保留状态', JSON.stringify(await visibleGroups('state')) === '["loading"]');
  await shot('05-state-arrow-refresh', '切换箭头及刷新后 loading 状态');

  await goto('list.html'); phase = 'modal';
  const create = page.locator('.container > .row [data-toggle="#create"]');
  await create.click(); check('新建弹窗打开', await page.locator('#create').isVisible());
  await shot('06-modal-open', '新建弹窗打开');
  const focusTrace = [];
  for (let i=0;i<12;i++) { await page.keyboard.press('Tab'); focusTrace.push(await focus()); }
  for (let i=0;i<7;i++) { await page.keyboard.press('Shift+Tab'); focusTrace.push(await focus()); }
  check('Tab 和 Shift+Tab 焦点留在弹窗内', focusTrace.every(f => f.inDialog), focusTrace);
  await shot('07-modal-tab-trap','Tab 循环后的弹窗焦点');
  await page.locator('#create').getByRole('button',{name:'关闭',exact:true}).click();
  check('关闭按钮关闭并恢复触发焦点', !(await page.locator('#create').isVisible()) && (await focus()).toggle === '#create', await focus());
  await shot('08-modal-close','关闭按钮后焦点回到新建');
  await create.click(); await page.keyboard.press('Escape');
  check('Esc 关闭并恢复触发焦点', !(await page.locator('#create').isVisible()) && (await focus()).toggle === '#create', await focus());
  await shot('09-modal-escape','Esc 后焦点回到新建');

  phase = 'native-select';
  const select = page.locator('[aria-label="筛选条件"] select');
  await select.focus(); await page.keyboard.press('Space');
  await shot('10-filter-select-open','原生筛选下拉打开');
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  check('原生筛选选择进行中', await select.inputValue() === '进行中', await select.inputValue());
  await shot('11-filter-select-chosen','原生筛选已选择进行中');
  phase = 'menu';
  const menuTrigger=page.getByRole('button',{name:'更多操作',exact:true});
  await menuTrigger.click(); check('操作菜单打开',await page.locator('#actions').isVisible()); await shot('12-menu-open','操作菜单打开');
  await page.locator('#actions [data-close]').click(); check('菜单关闭按钮生效',!(await page.locator('#actions').isVisible()));
  await menuTrigger.click(); await menuTrigger.click(); check('再次点击触发按钮关闭菜单',!(await page.locator('#actions').isVisible()));
  await menuTrigger.click(); await page.keyboard.press('Escape'); check('Esc 关闭菜单',!(await page.locator('#actions').isVisible()));
  await shot('13-menu-closed','操作菜单关闭');
  phase = 'drawer';
  await page.locator('[data-toggle="#details"]').first().click(); check('详情抽屉打开',await page.locator('#details').isVisible()); await shot('14-drawer-open','详情抽屉打开');
  await page.locator('#details [data-close]').click(); check('详情关闭按钮生效并恢复焦点',!(await page.locator('#details').isVisible()) && (await focus()).toggle === '#details');
  await page.locator('[data-toggle="#details"]').first().click(); await page.keyboard.press('Escape'); check('Esc 关闭抽屉',!(await page.locator('#details').isVisible())); await shot('15-drawer-closed','详情抽屉关闭');
  phase='created-toast'; await create.click(); await page.locator('#create [data-toggle="#created"]').click();
  check('创建关闭弹窗并打开 toast',!(await page.locator('#create').isVisible()) && await page.locator('#created').isVisible()); await shot('16-created-toast','创建演示提示打开');
  await page.locator('#created [data-close]').click(); check('创建 toast 关闭',!(await page.locator('#created').isVisible())); await shot('17-created-toast-closed','创建提示关闭');
  await goto('list.html','?state=error'); phase='retry-toast'; await page.locator('[data-toggle="#retry"]').click(); check('重试 toast 打开',await page.locator('#retry').isVisible()); await shot('18-retry-toast','重试演示提示');
  await page.keyboard.press('Escape'); check('Esc 关闭重试 toast',!(await page.locator('#retry').isVisible())); await shot('19-retry-toast-closed','重试提示关闭');

  await goto('settings.html'); check('默认方案 A',JSON.stringify(await visibleGroups('variant'))==='["A"]'); await shot('20-settings-A','设置默认 A');
  phase='variant-switch'; await page.getByRole('button',{name:'下一个方案'}).click();
  check('按钮切换 B 并更新 URL',JSON.stringify(await visibleGroups('variant'))==='["B"]' && new URL(page.url()).searchParams.get('variant')==='B'); await shot('21-settings-B','切换到 B');
  await page.reload(); check('刷新保持方案 B',JSON.stringify(await visibleGroups('variant'))==='["B"]');
  await page.locator('h1:visible').click(); await page.keyboard.press('ArrowLeft'); check('左键切换到 A',JSON.stringify(await visibleGroups('variant'))==='["A"]');
  await page.keyboard.press('ArrowRight'); check('右键切换到 B',JSON.stringify(await visibleGroups('variant'))==='["B"]'); await shot('22-variant-keyboard','键盘左右键切换 B');
  const input=page.locator('[data-variant="B"] input').first(); await input.focus(); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowRight');
  check('输入框内左右键不切换',JSON.stringify(await visibleGroups('variant'))==='["B"]' && new URL(page.url()).searchParams.get('variant')==='B');
  const textarea=page.locator('[data-variant="B"] textarea'); await textarea.focus(); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowRight'); check('textarea 内左右键不切换',JSON.stringify(await visibleGroups('variant'))==='["B"]');
  await input.focus(); await shot('23-variant-input','输入框内左右键后保持 B');
  for(const [variant,id] of [['A','24'],['B','25']]) {
    await goto('settings.html','?variant='+variant); phase='tabs-'+variant;
    const scope=page.locator(`[data-variant="${variant}"]`); const tabs=scope.locator('[data-tab]'); const panels=scope.locator('[data-panel]');
    await tabs.nth(1).click(); check('第二个 tab 仅显示第二面板',!(await panels.nth(0).isVisible()) && await panels.nth(1).isVisible() && await tabs.nth(1).getAttribute('aria-selected')==='true');
    await shot(id+'-tabs-'+variant,variant+' 第二标签面板');
    await tabs.nth(0).click(); check('第一个 tab 恢复第一面板',await panels.nth(0).isVisible() && !(await panels.nth(1).isVisible()));
  }
  phase='settings-toast'; await page.locator('[data-variant="B"] [data-toggle="#saved"]').click(); check('设置保存 toast 打开',await page.locator('#saved').isVisible()); await shot('26-settings-toast','设置保存演示提示');
  await page.locator('#saved [data-close]').click(); check('设置保存 toast 关闭',!(await page.locator('#saved').isVisible()));

  for(const [file,query,id,viewport] of [
    ['list.html','?frame=mobile','27-list-frame-mobile',{width:1280,height:800}],
    ['settings.html','?frame=mobile','28-settings-frame-mobile',{width:1280,height:800}],
    ['list.html','','29-list-390',{width:390,height:844}],
    ['settings.html','?frame=mobile&variant=B','30-settings-B-frame-mobile',{width:1280,height:800}],
  ]) {
    await goto(file,query,viewport); const g=await geometry();
    check('页面无横向溢出',g.documentWidth<=viewport.width, g);
    check('侧栏堆叠在主区上方',g.boxes['.sidebar'].bottom<=g.boxes['.main'].y+1,g.boxes);
    if(query.includes('frame')) check('手机框宽 390px',Math.abs(g.boxes.body.width-390)<1,g.boxes.body);
    await shot(id,file+' 手机效果（首屏）');
    await shot(id+'-full',file+' 手机效果（整页）',true);
    if(file==='list.html') {
      const wrap=page.locator('.table-wrap'); const dims=await wrap.evaluate(el=>({before:el.scrollLeft,width:el.clientWidth,scrollWidth:el.scrollWidth}));
      await wrap.evaluate(el=>{el.scrollLeft=el.scrollWidth;}); const after=await wrap.evaluate(el=>el.scrollLeft);
      check('表格局部横向滚动',dims.scrollWidth>dims.width && after>0,{...dims,after});
      await shot(id+'-table-right', '表格滚到右侧操作列（整页）',true);
    }
  }
  phase='css-only'; await page.setViewportSize({width:1280,height:800}); await page.goto(pathToFileURL(path.join(evidence,'r2-static','page.html')).href); await page.evaluate(()=>document.fonts.ready);
  check('静态页面不引入脚本',await page.locator('script').count()===0);
  check('两份 CSS 均加载且 grid 生效',await page.evaluate(()=>document.styleSheets.length===2 && getComputedStyle(document.querySelector('.app')).display==='grid'));
  check('静态侧栏/卡片/标题可见',await page.locator('.sidebar').isVisible() && await page.locator('.card').isVisible() && await page.locator('h1').isVisible());
  await shot('31-static-css-only','只引入 CSS 的骨架页面');
} catch(error) {
  tests.push({phase,name:'未预期的测试中断',pass:false,detail:error.stack}); console.error(error);
} finally {
  fs.writeFileSync(path.join(evidence,'r2-results.json'),JSON.stringify({tests,shots,events},null,2)+'\n');
  fs.writeFileSync(path.join(evidence,'r2-console.txt'), shots.map(s => `[${s.id}] ${s.phase}\nURL: ${s.url}\n` + (s.console.length ? s.console.map(e=>JSON.stringify(e)).join('\n') : '控制台 error/warning/pageerror/requestfailed：无；其他 console 消息：无') + '\n').join('\n') + '\n完整事件流：\n' + JSON.stringify(events,null,2)+'\n');
  await context.close(); await browser.close();
  console.log(JSON.stringify({checks:tests.length,failed:tests.filter(t=>!t.pass).length,screenshots:shots.length,consoleEvents:events.length}));
}
