import { access } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Canvas 需要 Node.js 22 或更新版本')
const root = fileURLToPath(new URL('.', import.meta.url))
try { await access(new URL('./dist/mcp.mjs', import.meta.url)) }
catch {
  // Source checkouts build once. Release plugins already include dist and need no npm install.
  console.error('Canvas 首次准备运行环境…')
  for (const args of [['ci', '--no-audit', '--no-fund'], ['run', 'build']]) {
    const child = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, { cwd: root, stdio: ['ignore', 2, 2], shell: process.platform === 'win32' })
    if (child.error || child.status !== 0) throw new Error('Canvas 准备失败：' + (child.error?.message ?? `npm ${args.join(' ')} exited ${child.status}`))
  }
}
await import('./dist/mcp.mjs')
