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
await mkdir(join(plugin, 'canvas'), { recursive: true })
await cp(join(root, 'canvas/dist'), join(plugin, 'canvas/dist'), { recursive: true })
await cp(join(root, 'canvas/launch.mjs'), join(plugin, 'canvas/launch.mjs'))
await cp(join(root, '.mcp.json'), join(plugin, '.mcp.json'))
await cp(join(root, 'LICENSE'), join(plugin, 'LICENSE'))
const json = async (path, data) => { await mkdir(dirname(path), { recursive: true }); await writeFile(path, JSON.stringify(data, null, 2) + '\n') }
await json(join(plugin, '.claude-plugin/plugin.json'), { ...original, skills: ['./skills/'], mcpServers: './.mcp.json' })
await json(join(plugin, '.codex-plugin/plugin.json'), {
  ...original, skills: './skills/', mcpServers: './.mcp.json',
  interface: { displayName: 'Gungnir Skills + Canvas', shortDescription: '工程技能与项目画布共创', longDescription: '简体中文工程技能，以及自动启动、按项目读写 Markdown 的 Canvas MCP。', developerName: 'vinvcn', category: 'Developer Tools', capabilities: ['Read', 'Write', 'Interactive'], defaultPrompt: ['使用 $canvas 打开当前项目的结构图。'] },
})
// Codex resolves bundled stdio paths in the portable MCP format.
const codex = JSON.parse(await readFile(join(plugin, '.codex-plugin/plugin.json'), 'utf8'))
await json(join(plugin, 'plugin.json'), {
  $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
  name: original.name, version: original.version, description: original.description,
  extensions: { 'com.openai': { interface: codex.interface } },
})
await json(join(plugin, 'mcp.json'), {
  $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
  mcpServers: { canvas: { type: 'stdio', command: 'node', args: ['${PLUGIN_ROOT}/canvas/launch.mjs'], cwd: './' } },
})
await json(join(output, '.agents/plugins/marketplace.json'), {
  name: 'gungnir-local', interface: { displayName: 'Gungnir' },
  plugins: [{ name: original.name, source: { source: 'local', path: './plugins/' + original.name }, policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' }, category: 'Developer Tools' }],
})
await json(join(output, '.claude-plugin/marketplace.json'), {
  name: 'gungnir-local', owner: { name: 'vinvcn' }, plugins: [{ name: original.name, source: './plugins/' + original.name }],
})
console.log('Plugin package: ' + plugin)
console.log('Marketplace: ' + output)
