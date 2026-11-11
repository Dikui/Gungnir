// Check the repo invariants from AGENTS.md and docs/invocation.md:
// implicit invocation, documented tiers, plugin manifest, README indexes and version sync.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { ROOT, listSkills } from './skills.mjs'

const DESCRIPTION_GATE = '不要根据对话内容自行加载'

let failed = false
function fail(file, msg) {
  failed = true
  console.error(`✗ ${file}: ${msg}`)
}
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8')

// Reject stray directories instead of silently omitting them from the checks below.
for (const entry of readdirSync(join(ROOT, 'skills'), { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === '.claude-plugin') continue
  if (!existsSync(join(ROOT, 'skills', entry.name, 'SKILL.md'))) {
    fail(`skills/${entry.name}`, 'missing SKILL.md; skills sit directly under skills/')
  }
}

/**
 * Collect `- **[name](link)**` index entries and the invocation group heading they sit under.
 *
 * @param {string} text - README content.
 * @returns {Map<string, { link: string, group: string | null }>}
 */
function indexEntries(text) {
  const entries = new Map()
  let group = null
  for (const line of text.split('\n')) {
    const heading = line.match(/^(?:#+\s*|\*\*)(User-invoked|Skill-invoked)(?:\*\*)?\s*$/)
    if (heading) {
      group = heading[1]
      continue
    }
    if (line.startsWith('#')) group = null
    const item = line.match(/^- \*\*\[([^\]]+)\]\(([^)]+)\)\*\*/)
    if (item) entries.set(item[1], { link: item[2], group })
  }
  return entries
}

const skills = listSkills()

// Main-plugin skills allow implicit invocation.
const invocationDoc = read('docs/invocation.md')
const skillInvoked = new Set([...invocationDoc.matchAll(/^\| `([^`]+)` \|/gm)].map((match) => match[1]))
for (const name of skillInvoked) {
  if (!skills.some((s) => s.name === name)) fail('docs/invocation.md', `lists unknown Skill-invoked skill ${name}`)
}
for (const s of skills) {
  const file = `${s.path}/SKILL.md`
  if (!s.meta) {
    fail(file, 'missing or malformed frontmatter')
    continue
  }
  if (s.meta.name !== s.name) fail(file, `name must match directory ${s.name}`)
  s.group = skillInvoked.has(s.name) ? 'Skill-invoked' : 'User-invoked'
  if (Object.hasOwn(s.meta, 'disable-model-invocation')) fail(file, 'disable-model-invocation must not be set')
  const policy = s.openaiYaml?.match(/^policy:[ \t]*\n((?:[ \t]+[^\n]*\n?)*)/m)?.[1]
  const implicit = policy?.match(/^[ \t]+allow_implicit_invocation:[ \t]*(true|false)[ \t]*(?:#.*)?$/m)?.[1]
  if (!implicit) fail(`${s.path}/agents/openai.yaml`, 'missing policy.allow_implicit_invocation')
  else if (implicit !== 'true') fail(`${s.path}/agents/openai.yaml`, 'policy.allow_implicit_invocation must be true')
  if (s.meta.description?.includes(DESCRIPTION_GATE)) fail(file, 'description must not prohibit implicit invocation')
  if (s.body.trimStart().startsWith('加载条件：')) fail(file, 'body must not start with "加载条件："')
  if (s.body.includes('须手动调用')) fail(file, 'body must not restrict a skill to manual invocation')
}

// Every caller listed in docs/invocation.md must actually reference the skill.
for (const [, name, callers] of invocationDoc.matchAll(/^\| `([^`]+)` \| ([^|]+) \|/gm)) {
  for (const caller of callers.split('、').map((c) => c.trim())) {
    const s = skills.find((skill) => skill.name === caller)
    if (!s) fail('docs/invocation.md', `${name}: unknown caller ${caller}`)
    else if (!new RegExp(`/${name}(?![A-Za-z0-9-])`).test(s.body)) {
      fail('docs/invocation.md', `${name}: ${caller} does not reference /${name}`)
    }
  }
}

// Entry skills must be discoverable through ask-dikui.
const askDikuiFile = 'skills/ask-dikui/SKILL.md'
const askDikui = read(askDikuiFile)
for (const s of skills) {
  if (s.name === 'ask-dikui' || s.group !== 'User-invoked' || s.meta['user-invocable'] === 'false') continue
  const name = s.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (!new RegExp(`/${name}(?![A-Za-z0-9-])`).test(askDikui)) {
    fail(askDikuiFile, `${s.name}: 在 ask-dikui 中登记该技能`)
  }
}

// Plugin manifest lists every repository skill.
const plugin = JSON.parse(read('skills/.claude-plugin/plugin.json'))
const expected = skills.map((s) => `./${s.path.replace(/^skills\//, '')}`).sort()
const actual = [...plugin.skills].sort()
for (const path of expected) if (!actual.includes(path)) fail('skills/.claude-plugin/plugin.json', `missing ${path}`)
for (const path of actual) if (!expected.includes(path)) fail('skills/.claude-plugin/plugin.json', `unexpected ${path}`)

// Top README indexes every skill under its invocation group, and nothing else.
const readme = read('README.md')
const top = indexEntries(readme)
for (const s of skills) {
  const entry = top.get(s.name)
  if (!entry) fail('README.md', `missing index entry for ${s.name}`)
  else if (entry.link !== `./${s.path}/SKILL.md`) fail('README.md', `${s.name} should link to ./${s.path}/SKILL.md`)
  else if (s.group && entry.group !== s.group) fail('README.md', `${s.name} should be listed under ${s.group}`)
}
for (const name of top.keys()) {
  if (!skills.some((s) => s.name === name)) fail('README.md', `lists unknown skill ${name}`)
}

// The dsh package ships the same version as the Claude plugin.
const dsh = JSON.parse(read('dsh-plugin/package.json'))
if (dsh.version !== plugin.version) fail('dsh-plugin/package.json', `version ${dsh.version} != plugin ${plugin.version}`)

if (!failed) console.log(`ok: ${skills.length} skills checked`)
process.exit(failed ? 1 : 0)
