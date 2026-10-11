import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const evidence = dirname(fileURLToPath(import.meta.url));
const root = resolve(evidence, '../../../..');
const kit = resolve(root, 'skills/in-progress/mockup/kit');
const css = readFileSync(resolve(kit, 'mockup.css'), 'utf8');
const tokens = readFileSync(resolve(kit, 'tokens.css'), 'utf8');
const classes = text => new Set([...text.matchAll(/\.([a-z][\w-]*)/gi)].map(m => m[1]));
const variables = new Set([...tokens.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
const refs = [...css.matchAll(/var\((--[\w-]+)/g)].map(m => m[1]);
assert.deepEqual(refs.filter(v => !variables.has(v)), []);
assert(!/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\(/i.test(css), '颜色必须使用设计变量');
console.log(`样式变量：${new Set(refs).size} 个引用均有定义，无硬编码颜色`);
const limits = { 'SKILL.md': 120, 'kit/tokens.css': 60, 'kit/mockup.css': 300, 'kit/mockup.js': 150, 'kit/page.html': 40 };
for (const [file, limit] of Object.entries(limits)) {
  const count = readFileSync(resolve(kit, '..', file), 'utf8').split('\n').length - 1;
  assert(count <= limit, `${file}: ${count} > ${limit}`);
  console.log(`${file}: ${count}/${limit} 行`);
}
for (const file of ['list.html', 'settings.html']) {
  const path = resolve(evidence, 'sample', file);
  const html = readFileSync(path, 'utf8');
  const inline = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
  const defined = new Set([...classes(css), ...classes(inline)]);
  const used = [...html.matchAll(/class="([^"]*)"/g)].flatMap(m => m[1].split(/\s+/));
  const missing = [...new Set(used.filter(c => !defined.has(c)))];
  console.log(`${file} 未定义类：${JSON.stringify(missing)}`);
  assert.deepEqual(missing, []);
  for (const match of html.matchAll(/(?:href|src)="(kit\/[^"]+)"/g)) {
    assert(existsSync(resolve(dirname(path), match[1])), match[1]);
    console.log(`${file} 资源存在：${match[1]}`);
  }
  for (const match of html.matchAll(/data-toggle="#([^"]+)"/g)) {
    assert(html.includes(`id="${match[1]}"`), `缺少交互目标 ${match[1]}`);
  }
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size, '重复 id');
}
for (const file of readdirSync(kit)) {
  assert.equal(readFileSync(resolve(evidence, 'sample/kit', file), 'utf8'), readFileSync(resolve(kit, file), 'utf8'));
}
console.log('样例 kit 与技能 kit 的全部 5 个文件一致');
const skeleton = readFileSync(resolve(kit, 'page.html'), 'utf8');
assert(skeleton.includes('class="app"') && skeleton.includes('kit/tokens.css') && skeleton.includes('kit/mockup.css'));
assert(!/data-(?:state|variant|tabs|toggle|repeat)/.test(skeleton));
assert(css.includes('[hidden] { display: none !important; }'));
console.log('静态骨架使用基础样式，无交互属性；布局不依赖 JS 初始化（未验证像素效果）');
console.log('ok: 静态自洽检查通过');
