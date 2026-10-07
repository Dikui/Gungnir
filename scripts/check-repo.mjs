// Check the repo invariants from AGENTS.md and docs/invocation.md:
// invocation tiers, plugin manifest, README indexes and version sync.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { BUCKETS, ROOT, listSkills, readSkill } from './skills.mjs'

const DESCRIPTION_GATE = '不要根据对话内容自行加载'
const BODY_GUARD = '加载条件：'

let failed = false
function fail(file, msg) {
  failed = true
  console.error(`✗ ${file}: ${msg}`)
}
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8')

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
const all = [...skills, readSkill(join(ROOT, '.skills/translate-skill'), '.skills')]

// Invocation tiers: frontmatter and agents/openai.yaml must agree.
const invocationDoc = read('docs/invocation.md')
for (const s of all) {
  const file = `${s.path}/SKILL.md`
  if (!s.meta) {
    fail(file, 'missing or malformed frontmatter')
    continue
  }
  const userOnly = s.meta['disable-model-invocation'] === 'true'
  s.group = userOnly ? 'User-invoked' : 'Skill-invoked'
  const implicit = s.openaiYaml?.match(/allow_implicit_invocation:\s*(true|false)/)?.[1]
  if (!implicit) fail(`${s.path}/agents/openai.yaml`, 'missing policy.allow_implicit_invocation')
  else if (implicit !== String(!userOnly)) {
    fail(`${s.path}/agents/openai.yaml`, `allow_implicit_invocation should be ${!userOnly} for a ${s.group} skill`)
  }
  const listedInDoc = invocationDoc.includes(`| \`${s.name}\` |`)
  if (userOnly) {
    if (s.meta['user-invocable'] === 'false') fail(file, 'user-invocable: false needs model invocation enabled')
    if (listedInDoc) fail('docs/invocation.md', `${s.name} is listed as Skill-invoked but sets disable-model-invocation`)
    continue
  }
  if (!s.meta.description?.includes(DESCRIPTION_GATE)) fail(file, `Skill-invoked description must contain "${DESCRIPTION_GATE}"`)
  if (!s.body.trimStart().startsWith(BODY_GUARD)) fail(file, `Skill-invoked body must start with "${BODY_GUARD}"`)
  if (!listedInDoc) fail('docs/invocation.md', `Skill-invoked table is missing ${s.name}`)
}

// Plugin manifest lists exactly the public buckets.
const plugin = JSON.parse(read('.claude-plugin/plugin.json'))
const expected = skills.filter((s) => s.public).map((s) => `./${s.path}`).sort()
const actual = [...plugin.skills].sort()
for (const path of expected) if (!actual.includes(path)) fail('.claude-plugin/plugin.json', `missing ${path}`)
for (const path of actual) if (!expected.includes(path)) fail('.claude-plugin/plugin.json', `unexpected ${path}`)

// Top README indexes every public skill under its invocation group, and nothing else.
const readme = read('README.md')
const top = indexEntries(readme)
for (const s of skills.filter((s) => s.public)) {
  const entry = top.get(s.name)
  if (!entry) fail('README.md', `missing index entry for ${s.name}`)
  else if (entry.link !== `./${s.path}/SKILL.md`) fail('README.md', `${s.name} should link to ./${s.path}/SKILL.md`)
  else if (s.group && entry.group !== s.group) fail('README.md', `${s.name} should be listed under ${s.group}`)
}
for (const m of readme.matchAll(/\(\.\/skills\/(in-progress|deprecated)\/([^/)]+)/g)) {
  fail('README.md', `must not reference ${m[1]} skill ${m[2]}`)
}

// Each bucket README indexes its own skills; public buckets also group them.
for (const bucket of BUCKETS) {
  const file = `skills/${bucket}/README.md`
  const entries = indexEntries(read(file))
  for (const s of skills.filter((s) => s.bucket === bucket)) {
    const entry = entries.get(s.name)
    if (!entry) fail(file, `missing index entry for ${s.name}`)
    else if (entry.link !== `./${s.name}/SKILL.md`) fail(file, `${s.name} should link to ./${s.name}/SKILL.md`)
    else if (s.public && s.group && entry.group !== s.group) fail(file, `${s.name} should be listed under ${s.group}`)
  }
  for (const name of entries.keys()) {
    if (!skills.some((s) => s.bucket === bucket && s.name === name)) fail(file, `lists unknown skill ${name}`)
  }
}

// The dsh package ships the same version as the Claude plugin.
const dsh = JSON.parse(read('dsh-plugin/package.json'))
if (dsh.version !== plugin.version) fail('dsh-plugin/package.json', `version ${dsh.version} != plugin ${plugin.version}`)

if (!failed) console.log(`ok: ${all.length} skills checked`)
process.exit(failed ? 1 : 0)
