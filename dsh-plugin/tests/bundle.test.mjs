import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse } from 'yaml'

// small / spec: 用户要求 Gungnir 在 DSH 中显示为 dk-gungnir。
test('DSH exposes the bundle as dk-gungnir', () => {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  const patch = parse(readFileSync(new URL(manifest.dsh.bundle.patch, new URL('../', import.meta.url)), 'utf8'))
  assert.equal(manifest.name, 'dk-gungnir')
  assert.deepEqual(patch, [{ insert: [{ id: 'dk-gungnir', name: 'dk-gungnir' }] }])
})
