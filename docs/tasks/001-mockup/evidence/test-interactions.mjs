// 纯 DOM 检查，无浏览器、渲染或截图；依赖安装在临时目录。
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';

const { parseHTML } = await import(pathToFileURL(process.env.MOCKUP_DOM_MODULE).href);
const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(here, '../../../../skills/in-progress/mockup/kit/mockup.js'), 'utf8');
let checks = 0;
function check(label, fn) { fn(); checks++; console.log(`ok: ${label}`); }
function boot(html, query = '', loading = false) {
  const { document, window } = parseHTML(html);
  const create = document.createElement.bind(document);
  document.createElement = (...args) => {
    const element = create(...args);
    element.getBoundingClientRect = () => ({ height: 40 });
    return element;
  };
  Object.defineProperty(document, 'readyState', { value: loading ? 'loading' : 'complete' });
  let focused = document.body;
  Object.defineProperty(document, 'activeElement', { get: () => focused });
  for (const element of document.querySelectorAll('*')) {
    element.focus = () => { focused = element; };
    element.getClientRects = () => [{}];
  }
  const location = new URL(`file:///sample/page.html${query}`);
  let replacements = 0;
  const history = { replaceState(_state, _title, url) { location.href = url.href; replacements++; } };
  const context = vm.createContext({ document, location, history, URL, URLSearchParams });
  vm.runInContext(source, context, { timeout: 1000 });
  const emit = (target, type, key, shiftKey = false) => {
    const event = new window.Event(type, { bubbles: true, cancelable: true });
    Object.defineProperties(event, { key: { value: key }, shiftKey: { value: shiftKey } });
    context.dispatch = () => target.dispatchEvent(event);
    vm.runInContext('dispatch()', context, { timeout: 1000 });
    return event;
  };
  return { document, location, get replacements() { return replacements; }, click: el => emit(el, 'click'), key: (el, key, shift) => emit(el, 'keydown', key, shift), ready: () => emit(document, 'DOMContentLoaded') };
}
const list = readFileSync(resolve(here, 'sample/list.html'), 'utf8');
const settings = readFileSync(resolve(here, 'sample/settings.html'), 'utf8');
const a = boot(list);
const q = selector => a.document.querySelector(selector);
check('表格共 5 行，序号为 1 至 5，骨架共 4 个', () => {
  assert.equal(a.document.querySelectorAll('tbody tr').length, 5);
  assert.deepEqual([...a.document.querySelectorAll('[data-repeat-index]')].map(e => e.textContent), ['1', '2', '3', '4', '5']);
  assert.equal(a.document.querySelectorAll('.skeleton').length, 4);
});
check('默认状态和四状态循环；更新 URL 并保持其他参数', () => {
  assert.equal(q('[data-state="default"]').hidden, false);
  const next = q('.switcher-group button:last-child');
  for (const state of ['empty', 'loading', 'error', 'default']) {
    a.click(next); assert.equal(a.location.searchParams.get('state'), state);
    assert.equal([...a.document.querySelectorAll('[data-state]')].filter(e => !e.hidden)[0].dataset.state, state);
  }
  assert.equal(a.replacements, 4);
});
check('URL 指定每种状态，刷新后保持', () => {
  for (const state of ['default', 'empty', 'loading', 'error']) {
    const b = boot(list, `?state=${state}`);
    assert.equal(b.document.querySelector(`[data-state="${state}"]`).hidden, false);
  }
});
check('新建弹窗显示、同按钮关闭、data-close 关闭、Esc 关闭与焦点返回', () => {
  const button = q('[data-toggle="#create"]'), modal = q('#create');
  a.click(button); assert.equal(modal.hidden, false); assert.equal(button.getAttribute('aria-expanded'), 'true');
  a.click(button); assert.equal(modal.hidden, true);
  a.click(button); a.click(modal.querySelector('[data-close]')); assert.equal(modal.hidden, true);
  a.click(button); a.key(a.document.body, 'Escape'); assert.equal(modal.hidden, true);
  assert.equal(a.document.activeElement, button); assert.equal(button.getAttribute('aria-expanded'), 'false');
});
check('创建关闭弹窗并打开 toast，toast 关闭；菜单与抽屉可开关', () => {
  a.click(q('[data-toggle="#create"]')); a.click(q('#create [data-toggle="#created"]'));
  assert.equal(q('#create').hidden, true); assert.equal(q('#created').hidden, false);
  a.click(q('#created [data-close]')); assert.equal(q('#created').hidden, true);
  for (const id of ['actions', 'details']) {
    a.click(q(`[data-toggle="#${id}"]`)); assert.equal(q(`#${id}`).hidden, false);
    a.click(q(`#${id} [data-close]`)); assert.equal(q(`#${id}`).hidden, true);
  }
});
const b = boot(settings, '?frame=mobile&keep=yes');
const qb = selector => b.document.querySelector(selector);
check('默认首方案 A，箭头切换 B，URL 保留 frame 和其他参数', () => {
  assert.equal(qb('[data-variant="A"]').hidden, false);
  assert.equal(qb('[data-variant="B"]').hidden, true);
  b.click(qb('.switcher-group button:last-child'));
  assert.equal(qb('[data-variant="B"]').hidden, false);
  assert.equal(b.location.searchParams.get('variant'), 'B');
  assert.equal(b.location.searchParams.get('frame'), 'mobile');
  assert.equal(b.location.searchParams.get('keep'), 'yes');
  assert(b.document.body.classList.contains('mockup-frame'));
  assert.equal(boot(settings, b.location.search).document.querySelector('[data-variant="B"]').hidden, false);
});
check('键盘左右切换并循环；输入框、文本域、可编辑元素不拦截', () => {
  b.key(b.document.body, 'ArrowRight'); assert.equal(b.location.searchParams.get('variant'), 'A');
  b.key(b.document.body, 'ArrowLeft'); assert.equal(b.location.searchParams.get('variant'), 'B');
  for (const selector of ['input', 'textarea', 'select']) {
    assert.equal(b.key(qb(selector), 'ArrowRight').defaultPrevented, false);
    assert.equal(b.location.searchParams.get('variant'), 'B');
  }
  const editor = b.document.createElement('div'); editor.setAttribute('contenteditable', 'true');
  editor.innerHTML = '<strong>可编辑文字</strong>'; b.document.body.append(editor);
  Object.defineProperty(editor.firstElementChild, 'isContentEditable', { value: true });
  assert.equal(b.key(editor.firstElementChild, 'ArrowRight').defaultPrevented, false);
  assert.equal(b.location.searchParams.get('variant'), 'B');
});
check('每个方案的 tabs 独立切换；标签键盘操作不切换方案', () => {
  for (const group of b.document.querySelectorAll('[data-tabs]')) {
    const tabs = group.querySelectorAll('[data-tab]'), panels = group.querySelectorAll('[data-panel]');
    assert.equal(panels[0].hidden, false); assert.equal(panels[1].hidden, true);
    b.click(tabs[1]); assert.equal(panels[1].hidden, false); assert.equal(panels[0].hidden, true);
    assert.equal(tabs[1].getAttribute('aria-selected'), 'true');
    b.key(tabs[1], 'ArrowLeft'); assert.equal(panels[0].hidden, false);
    assert.equal(b.location.searchParams.get('variant'), 'B');
  }
});
check('DOMContentLoaded 延后初始化；零项、非法重复值；两种切换栏同时工作', () => {
  const c = boot('<html><body><div data-repeat="0">删除</div><div data-repeat="bad">保留</div><div data-state="default"></div><div data-state="empty"></div><div data-variant="A"></div><div data-variant="B"></div></body></html>', '', true);
  assert.equal(c.document.querySelector('.switcher'), null); c.ready();
  assert(!c.document.body.textContent.includes('删除')); assert(c.document.body.textContent.includes('保留'));
  assert.equal(c.document.querySelectorAll('.switcher-group').length, 2);
  const arrows = c.document.querySelectorAll('.switcher-group button:last-child');
  c.click(arrows[0]); c.click(arrows[1]);
  assert.equal(c.location.searchParams.get('state'), 'empty'); assert.equal(c.location.searchParams.get('variant'), 'B');
});
check('无交互属性的骨架无需切换栏，纯 CSS 可独立引入', () => {
  const c = boot(readFileSync(resolve(here, 'sample/kit/page.html'), 'utf8'));
  assert.equal(c.document.querySelector('.switcher'), null);
  assert(c.document.querySelector('.app'));
  assert.equal(c.document.body.classList.contains('has-switcher'), false);
});
check('设计稿标题可折叠与展开，URL 保留其他参数，刷新保持折叠', () => {
  const c = boot(settings, '?variant=B&frame=mobile&keep=yes');
  const title = c.document.querySelector('.switcher > button');
  const groups = [...c.document.querySelectorAll('.switcher-group')];
  assert.equal(title.textContent, '设计稿');
  assert.equal(title.getAttribute('aria-expanded'), 'true');
  assert(c.document.body.classList.contains('has-switcher'));
  assert.equal(c.document.body.style.getPropertyValue('--switcher-height'), '40px');
  c.click(title);
  assert.equal(title.getAttribute('aria-expanded'), 'false');
  assert(groups.every(group => group.hidden));
  assert.equal(c.location.searchParams.get('bar'), '0');
  for (const [key, value] of [['variant', 'B'], ['frame', 'mobile'], ['keep', 'yes']]) {
    assert.equal(c.location.searchParams.get(key), value);
  }
  const refreshed = boot(settings, c.location.search);
  assert.equal(refreshed.document.querySelector('.switcher > button').getAttribute('aria-expanded'), 'false');
  assert([...refreshed.document.querySelectorAll('.switcher-group')].every(group => group.hidden));
  c.click(title);
  assert.equal(title.getAttribute('aria-expanded'), 'true');
  assert(groups.every(group => !group.hidden));
  assert.equal(c.location.searchParams.has('bar'), false);
});
check('直接 bar=0 折叠两组工具栏，仍可展开和切换状态与方案', () => {
  const html = '<html><body><div data-state="default"></div><div data-state="empty"></div><div data-variant="A"></div><div data-variant="B"></div></body></html>';
  const c = boot(html, '?bar=0&state=empty&variant=B');
  const title = c.document.querySelector('.switcher > button');
  assert.equal(title.getAttribute('aria-expanded'), 'false');
  assert([...c.document.querySelectorAll('.switcher-group')].every(group => group.hidden));
  assert.equal(c.document.querySelector('[data-state="empty"]').hidden, false);
  assert.equal(c.document.querySelector('[data-variant="B"]').hidden, false);
  c.key(c.document.body, 'ArrowRight');
  assert.equal(c.location.searchParams.get('variant'), 'A');
  assert.equal(c.location.searchParams.get('bar'), '0');
  c.click(title);
  c.click(c.document.querySelector('.switcher-group button:last-child'));
  assert.equal(c.location.searchParams.get('state'), 'default');
  assert.equal(c.location.searchParams.get('variant'), 'A');
  assert.equal(c.location.searchParams.has('bar'), false);
  const staticPage = boot('<html><body><p>静态页面</p></body></html>', '?bar=0');
  assert.equal(staticPage.document.querySelector('.switcher'), null);
  assert.equal(staticPage.document.body.classList.contains('has-switcher'), false);
});
console.log(`${checks} 组 DOM 行为检查通过；未进行浏览器检查或视觉检查。`);
