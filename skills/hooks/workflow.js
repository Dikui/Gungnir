#!/usr/bin/env node
// SessionStart / SubagentStart：把 workflow.md 注入为会话上下文。Claude Code 和 Codex 都读这种输出格式。
const { readFileSync } = require('node:fs')
const { join } = require('node:path')

let event = 'SessionStart'
try { event = JSON.parse(readFileSync(0, 'utf8')).hook_event_name || event } catch {}
const additionalContext = readFileSync(join(__dirname, 'workflow.md'), 'utf8')
process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext } }))
