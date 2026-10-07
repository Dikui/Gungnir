import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Buckets shipped by the Claude Code plugin; in-progress and deprecated stay out.
export const PUBLIC_BUCKETS = ['engineering', 'productivity', 'misc']
export const BUCKETS = [...PUBLIC_BUCKETS, 'in-progress', 'deprecated']

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
 * @param {string} bucket - Bucket name, or another label for skills outside `skills/`.
 */
export function readSkill(dir, bucket) {
  const name = dir.split('/').at(-1)
  const text = readFileSync(join(dir, 'SKILL.md'), 'utf8')
  const parsed = parseSkill(text)
  const yamlPath = join(dir, 'agents/openai.yaml')
  return {
    name,
    bucket,
    dir,
    path: dir.slice(ROOT.length + 1),
    public: PUBLIC_BUCKETS.includes(bucket),
    meta: parsed?.meta ?? null,
    body: parsed?.body ?? '',
    openaiYaml: existsSync(yamlPath) ? readFileSync(yamlPath, 'utf8') : null,
  }
}

/**
 * List every skill under `skills/<bucket>/<name>/SKILL.md`, sorted by name.
 *
 * @param {string[]} [buckets] - Buckets to scan; defaults to all of them.
 * @param {string} [root] - Directory containing the bucket folders.
 */
export function listSkills(buckets = BUCKETS, root = join(ROOT, 'skills')) {
  const skills = []
  for (const bucket of buckets) {
    const bucketDir = join(root, bucket)
    if (!existsSync(bucketDir)) continue
    for (const entry of readdirSync(bucketDir, { withFileTypes: true })) {
      if (entry.isDirectory() && existsSync(join(bucketDir, entry.name, 'SKILL.md'))) {
        skills.push(readSkill(join(bucketDir, entry.name), bucket))
      }
    }
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name))
}
