# 编写任务简报

任务简报（agent brief）是 issue 或 PR 转入 `ready-for-agent` 时发布在其上的结构化评论。它是代理后续独立工作的权威依据：原始正文和讨论只是背景，任务简报才是约定。

简报说明**代理应该做什么**。对 issue，是从零完成改动；对 PR，是在现有 diff 上还剩什么要做：补完它、补齐缺口、处理审查意见。两种情况原则相同，下面的 PR 示例展示了差别。

模板和示例使用英文；实际发布时使用该 tracker 的语言。

## 原则

### 耐久优先于精确

issue 可能在 `ready-for-agent` 状态停留数天或数周，期间代码会变化。简报要在文件被重命名、移动或重构后仍然可用。

- **要**描述接口、类型和行为约定。
- **要**写出代理应查找或修改的具体类型、函数签名或配置结构。
- **不要**引用文件路径，它们会过期。
- **不要**引用行号。
- **不要**假设当前的实现结构保持不变。

### 描述行为，不描述步骤

说明系统应该做**什么**，不说明**如何**实现。代理会重新探索代码，自行决定实现方式。

- **好：** "The `SkillConfig` type should accept an optional `schedule` field of type `CronExpression`"
- **差：** "Open src/types/skill.ts and add a schedule field on line 42"
- **好：** "When a user runs `/triage` with no arguments, they should see a summary of issues needing attention"
- **差：** "Add a switch statement in the main handler function"

### 完整的验收标准

代理需要知道什么时候算完成。每份简报都必须有具体、可测试的验收标准，每条都能独立验证。

- **好：** "Running `gh issue list --label needs-triage` returns issues that have been through initial classification"
- **差：** "Triage should work correctly"

### 写明范围边界

说明什么不在范围内，防止代理做多余的工作，或对相邻功能做假设。

## 模板

```markdown
## Agent Brief

**Category:** bug / enhancement
**Summary:** one-line description of what needs to happen

**Current behavior:**
Describe what happens now. For bugs, this is the broken behavior.
For enhancements, this is the status quo the feature builds on.

**Desired behavior:**
Describe what should happen after the agent's work is complete.
Be specific about edge cases and error conditions.

**Key interfaces:**
- `TypeName` — what needs to change and why
- `functionName()` return type — what it currently returns vs what it should return
- Config shape — any new configuration options needed

**Acceptance criteria:**
- [ ] Specific, testable criterion 1
- [ ] Specific, testable criterion 2
- [ ] Specific, testable criterion 3

**Out of scope:**
- Thing that should NOT be changed or addressed in this issue
- Adjacent feature that might seem related but is separate
```

## 示例

### 好的任务简报（缺陷）

```markdown
## Agent Brief

**Category:** bug
**Summary:** Skill description truncation drops mid-word, producing broken output

**Current behavior:**
When a skill description exceeds 1024 characters, it is truncated at exactly
1024 characters regardless of word boundaries. This produces descriptions
that end mid-word (e.g. "Use when the user wants to confi").

**Desired behavior:**
Truncation should break at the last word boundary before 1024 characters
and append "..." to indicate truncation.

**Key interfaces:**
- The `SkillMetadata` type's `description` field — no type change needed,
  but the validation/processing logic that populates it needs to respect
  word boundaries
- Any function that reads SKILL.md frontmatter and extracts the description

**Acceptance criteria:**
- [ ] Descriptions under 1024 chars are unchanged
- [ ] Descriptions over 1024 chars are truncated at the last word boundary
      before 1024 chars
- [ ] Truncated descriptions end with "..."
- [ ] The total length including "..." does not exceed 1024 chars

**Out of scope:**
- Changing the 1024 char limit itself
- Multi-line description support
```

### 好的任务简报（改进）

```markdown
## Agent Brief

**Category:** enhancement
**Summary:** Add `.out-of-scope/` directory support for tracking rejected feature requests

**Current behavior:**
When a feature request is rejected, the issue is closed with a `wontfix` label
and a comment. There is no persistent record of the decision or reasoning.
Future similar requests require the maintainer to recall or search for the
prior discussion.

**Desired behavior:**
Rejected feature requests should be documented in `.out-of-scope/<concept>.md`
files that capture the decision, reasoning, and links to all issues that
requested the feature. When triaging new issues, these files should be
checked for matches.

**Key interfaces:**
- Markdown file format in `.out-of-scope/` — each file should have a
  `# Concept Name` heading, a `**Decision:**` line, a `**Reason:**` line,
  and a `**Prior requests:**` list with issue links
- The triage workflow should read all `.out-of-scope/*.md` files early
  and match incoming issues against them by concept similarity

**Acceptance criteria:**
- [ ] Closing a feature as wontfix creates/updates a file in `.out-of-scope/`
- [ ] The file includes the decision, reasoning, and link to the closed issue
- [ ] If a matching `.out-of-scope/` file already exists, the new issue is
      appended to its "Prior requests" list rather than creating a duplicate
- [ ] During triage, existing `.out-of-scope/` files are checked and surfaced
      when a new issue matches a prior rejection

**Out of scope:**
- Automated matching (human confirms the match)
- Reopening previously rejected features
- Bug reports (only enhancement rejections go to `.out-of-scope/`)
```

### 好的任务简报（PR）

对 PR，“Current behavior” 描述的是 diff 的现状；简报要求代理补完或修复它，不是从零完成。

```markdown
## Agent Brief

**Category:** enhancement
**Summary:** Finish the contributor's `--json` output flag for `triage list`

**Current behavior:**
The PR adds a `--json` flag that serializes the issue list to JSON. The happy
path works and the diff matches the project's command structure. Two gaps
remain: errors are still printed as human text (not JSON), and the new flag has
no test coverage.

**Desired behavior:**
With `--json`, all output — including errors — is well-formed JSON on stdout,
and the command's exit codes are unchanged. The existing human-readable output
is untouched when the flag is absent.

**Key interfaces:**
- The command's error path should emit `{ "error": string }` under `--json`
  instead of the plain-text error
- Reuse the existing serializer the PR already added; don't introduce a second

**Acceptance criteria:**
- [ ] `triage list --json` emits valid JSON for both success and error cases
- [ ] Exit codes match the non-JSON command
- [ ] A test covers the `--json` success output and one error case
- [ ] Default (non-JSON) output is byte-for-byte unchanged

**Out of scope:**
- Adding `--json` to any other command
- Changing the JSON shape of the success payload the PR already defined
```

### 差的任务简报

```markdown
## Agent Brief

**Summary:** Fix the triage bug

**What to do:**
The triage thing is broken. Look at the main file and fix it.
The function around line 150 has the issue.

**Files to change:**
- src/triage/handler.ts (line 150)
- src/types.ts (line 42)
```

它的问题：

- 没有分类。
- 描述含糊（“the triage thing is broken”）。
- 引用了会过期的文件路径和行号。
- 没有验收标准。
- 没有范围边界。
- 没有区分当前行为和期望行为。
