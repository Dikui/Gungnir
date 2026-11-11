/**
 * Build the dsh-plugin skill tree: copy every skill from the repo's
 * `skills/` into `dsh-plugin/skills/`, preserving names and contents.
 */

import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { cpSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const PLUGIN_DIR = dirname(SCRIPT_DIR)
const REPO_ROOT = dirname(PLUGIN_DIR)

const sourceRoot = resolve(process.env.SKILLS_SRC ?? join(REPO_ROOT, 'skills'))
const outputRoot = resolve(process.env.SKILLS_OUT ?? join(PLUGIN_DIR, 'skills'))

console.log(`sourceRoot: ${sourceRoot}`)
console.log(`outputRoot: ${outputRoot}`)

/**
 * Print a guard violation and exit with a non-zero status.
 *
 * @param {string} message - Specific description of the violated guard.
 */
function fail(message) {
  console.error(`copy-skills: ${message}`)
  process.exit(1)
}

if (outputRoot === sourceRoot) {
  fail(`outputRoot must differ from sourceRoot (both are ${sourceRoot})`)
}
if (!outputRoot.includes('/dsh-plugin/')) {
  fail(`outputRoot must be inside a /dsh-plugin/ directory, got ${outputRoot}`)
}

/** @type {string[]} */
const names = []
// Dot directories (.claude-plugin) are plugin metadata, not skills.
for (const entry of readdirSync(sourceRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name.startsWith('.')) continue
  if (!existsSync(join(sourceRoot, entry.name, 'SKILL.md'))) {
    fail(`skill directory has no SKILL.md: ${join(sourceRoot, entry.name)}`)
  }
  names.push(entry.name)
}

rmSync(outputRoot, { recursive: true, force: true })
mkdirSync(outputRoot, { recursive: true })

for (const name of names) {
  cpSync(join(sourceRoot, name), join(outputRoot, name), { recursive: true })
}

console.log(`copied ${names.length} skills to ${outputRoot}`)
