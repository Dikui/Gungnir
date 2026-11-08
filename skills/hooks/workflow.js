#!/usr/bin/env node
// SessionStart / SubagentStart：把 workflow.md 和用户的全局偏好注入为会话上下文。Claude Code 和 Codex 都读这种输出格式。
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { homedir } = require('node:os')

let event = 'SessionStart'
try { event = JSON.parse(readFileSync(0, 'utf8')).hook_event_name || event } catch {}
let additionalContext = readFileSync(join(__dirname, 'workflow.md'), 'utf8')
try {
  const prefs = readFileSync(join(homedir(), '.gungnir', 'preferences.md'), 'utf8').trim()
  if (prefs) additionalContext += `\n\n# 全局偏好（~/.gungnir/preferences.md）\n\n${prefs}\n`
} catch {}
process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext } }))
