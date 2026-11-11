import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Parse the flat `key: value` frontmatter used by this repo's SKILL.md files.
 *
 * @param {string} text - Full SKILL.md content.
 * @returns {{ meta: Record<string, string>, body: string } | null} Keys and the body after the frontmatter.
 */
export function parseSkill(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return null
  const meta = {}
  for (const line of match[1].split('\n')) {
    const field = line.match(/^([\w-]+):\s*(.*)$/)
    if (field) meta[field[1]] = field[2].replace(/^(["'])(.*)\1$/, '$2')
  }
  return { meta, body: match[2] }
}

/**
 * Read one skill directory.
 *
 * @param {string} dir - Absolute skill directory containing SKILL.md.
 */
export function readSkill(dir) {
  const name = dir.split('/').at(-1)
  const text = readFileSync(join(dir, 'SKILL.md'), 'utf8')
  const parsed = parseSkill(text)
  const yamlPath = join(dir, 'agents/openai.yaml')
  return {
    name,
    dir,
    path: dir.slice(ROOT.length + 1),
    meta: parsed?.meta ?? null,
    body: parsed?.body ?? '',
    openaiYaml: existsSync(yamlPath) ? readFileSync(yamlPath, 'utf8') : null,
  }
}

/**
 * List every skill under `skills/<name>/SKILL.md`, sorted by name.
 *
 * @param {string} [root] - Directory containing the skill folders.
 */
export function listSkills(root = join(ROOT, 'skills')) {
  const skills = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory() && existsSync(join(root, entry.name, 'SKILL.md'))) {
      skills.push(readSkill(join(root, entry.name)))
    }
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name))
}
