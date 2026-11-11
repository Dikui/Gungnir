import { test } from 'node:test'
import assert from 'node:assert/strict'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import * as m from '../index.js'
import { listSkills } from '../../scripts/skills.mjs'

const SOURCE_SKILLS = listSkills()
const SKILL_NAMES = SOURCE_SKILLS.map((skill) => skill.name)
const PROVIDER_NAME = 'dk-gungnir'
const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const SKILLS_ROOT = fileURLToPath(new URL('../skills/', import.meta.url))
const BOGUS_SKILL_PATH = fileURLToPath(new URL('./__no_such_skill__.md', import.meta.url))

test('module exposes only the documented named exports', () => {
  assert.equal(m.default, undefined)
  assert.equal(m.name, PROVIDER_NAME)
  assert.ok(m.inject.includes('skills'))
  assert.equal(typeof m.apply, 'function')
})

test('createProvider returns a named provider whose list and get are thenable', () => {
  const provider = m.createProvider()
  assert.equal(provider.name, PROVIDER_NAME)
  assert.equal(typeof provider.list({}).then, 'function')
  assert.equal(typeof provider.get({}).then, 'function')
})

test('list exposes every source skill under its original name', async () => {
  const candidates = await m.createProvider().list({})
  assert.equal(candidates.length, SKILL_NAMES.length)
  assert.equal(new Set(candidates.map((candidate) => candidate.name)).size, SKILL_NAMES.length)
  assert.equal(candidates.length, 31)
  const names = new Set(candidates.map((candidate) => candidate.name))
  assert.deepEqual([...names].sort(), SKILL_NAMES)
  for (const candidate of candidates) {
    assert.equal(candidate.provider, PROVIDER_NAME)
    assert.equal(candidate.source, 'bundled')
    assert.equal(candidate.rank, 600)
    assert.equal(typeof candidate.description, 'string')
    assert.ok(candidate.description.length > 0, `${candidate.name} has a description`)
    assert.match(candidate.name, KEBAB_CASE)
    assert.equal(candidate.name, basename(candidate.locator))
    assert.equal(candidate.path, join(candidate.locator, 'SKILL.md'))
    assert.ok(candidate.path.startsWith(SKILLS_ROOT), `${candidate.path} lives under the bundled skills root`)
  }
})

test('grill-me allows both model and user invocation', async () => {
  const candidates = await m.createProvider().list({})
  const grillMe = candidates.find((candidate) => candidate.name === 'grill-me')
  assert.deepEqual(grillMe.invocation, { modelInvocable: true, userInvocable: true })
})

test('all bundled skills allow model invocation and keep source user visibility', async () => {
  const sources = new Map(SOURCE_SKILLS.map((skill) => [skill.name, skill.meta]))
  const candidates = await m.createProvider().list({})
  for (const candidate of candidates) {
    const meta = sources.get(candidate.name)
    assert.deepEqual(candidate.invocation, {
      modelInvocable: true,
      userInvocable: meta['user-invocable'] !== 'false',
    }, candidate.name)
  }
})

test('grilling allows model invocation and stays hidden from user invocation', async () => {
  const candidates = await m.createProvider().list({})
  const grilling = candidates.find((candidate) => candidate.name === 'grilling')
  assert.deepEqual(grilling.invocation, { modelInvocable: true, userInvocable: false })
})

test('get preserves the original grill-me body and references', async () => {
  const provider = m.createProvider()
  const candidates = await provider.list({})
  const candidate = candidates.find((entry) => entry.name === 'grill-me')
  const skill = await provider.get(candidate, {})
  assert.equal(skill.name, 'grill-me')
  assert.equal(skill.content, SOURCE_SKILLS.find((entry) => entry.name === 'grill-me').body)
  assert.match(skill.content, /\/grilling/)
  assert.deepEqual(skill.resourceBase, { kind: 'directory', path: candidate.locator })
  assert.equal(skill.rank, undefined)
  assert.equal(skill.locator, undefined)
})

test('get resolves undefined for an unreadable path', async () => {
  const provider = m.createProvider()
  const skill = await provider.get({ name: 'missing', path: BOGUS_SKILL_PATH }, {})
  assert.equal(skill, undefined)
})

test('apply registers a provider that lists the same catalog', async () => {
  let captured
  m.apply({ skills: { registerProvider: (create) => { captured = create() } } })
  assert.equal(captured.name, PROVIDER_NAME)
  const candidates = await captured.list({})
  assert.equal(candidates.length, SKILL_NAMES.length)
  for (const candidate of candidates) {
    assert.equal(candidate.provider, m.name)
  }
})
