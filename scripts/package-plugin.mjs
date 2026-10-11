import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const output = resolve(process.argv[2] ?? join(root, 'dist'))
const original = JSON.parse(await readFile(join(root, '.claude-plugin/plugin.json'), 'utf8'))
const plugin = join(output, 'plugins', original.name)
await mkdir(plugin, { recursive: false }).catch(async e => {
  if (e.code === 'ENOENT') { await mkdir(dirname(plugin), { recursive: true }); await mkdir(plugin) }
  else throw new Error('输出目录已存在，请选择新的输出目录，避免混入旧技能：' + plugin)
})
// Only publish the public buckets already registered in the Claude manifest.
for (const path of original.skills) {
  if (!/^\.\/skills\/(engineering|productivity|misc)\/[^/]+$/.test(path)) throw new Error('非法公开 skill 路径：' + path)
  await cp(join(root, path), join(plugin, 'skills', path.split('/').at(-1)), { recursive: true })
}
await cp(join(root, 'LICENSE'), join(plugin, 'LICENSE'))
const json = async (path, data) => { await mkdir(dirname(path), { recursive: true }); await writeFile(path, JSON.stringify(data, null, 2) + '\n') }
await json(join(plugin, '.claude-plugin/plugin.json'), { ...original, skills: ['./skills/'] })
await json(join(plugin, '.codex-plugin/plugin.json'), {
  ...original, skills: './skills/',
  interface: { displayName: 'Gungnir', shortDescription: '面向项目开发的简体中文工程技能', longDescription: '简体中文工程技能，覆盖需求梳理、任务规划、TDD、代码审查和领域建模。', developerName: 'dikui', category: 'Developer Tools', capabilities: ['Read', 'Write'], defaultPrompt: ['使用 $ask-dikui 为当前项目选择合适的工程技能。'] },
})
const codex = JSON.parse(await readFile(join(plugin, '.codex-plugin/plugin.json'), 'utf8'))
await json(join(plugin, 'plugin.json'), {
  $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
  name: original.name, version: original.version, description: original.description,
  extensions: { 'com.openai': { interface: codex.interface } },
})
await json(join(output, '.agents/plugins/marketplace.json'), {
  name: 'gungnir-local', interface: { displayName: 'Gungnir' },
  plugins: [{ name: original.name, source: { source: 'local', path: './plugins/' + original.name }, policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' }, category: 'Developer Tools' }],
})
await json(join(output, '.claude-plugin/marketplace.json'), {
  name: 'gungnir-local', owner: { name: 'dikui' },
  description: 'Gungnir 本地插件市场，提供简体中文工程技能。',
  plugins: [{ name: original.name, source: './plugins/' + original.name }],
})
console.log('Plugin package: ' + plugin)
console.log('Marketplace: ' + output)
