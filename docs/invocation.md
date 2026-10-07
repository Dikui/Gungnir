# 调用规则

Gungnir 的技能分两层：**入口技能**由用户调用，**基础技能**由入口技能调用。任何技能都不应在普通对话中按任务描述自动触发。

## 入口技能（User-invoked）

除下表外的所有技能，包括开发中技能和 `.skills/` 中的内部翻译技能。只能由用户显式调用：

- Claude Code：`SKILL.md` frontmatter 设置 `disable-model-invocation: true`，用 `/research 调研这个问题` 调用。
- Codex：相邻 `agents/openai.yaml` 设置 `policy.allow_implicit_invocation: false`，用 `$research 调研这个问题` 调用。

## 基础技能（Skill-invoked）

| 技能 | 由哪些技能调用 | 用户能否直接调用 |
| --- | --- | --- |
| `grilling` | grill-me、grill-with-docs、triage、wayfinder、improve-codebase-architecture、loop-me | 否，从 `/grill-me` 或 `/grill-with-docs` 进入 |
| `domain-modeling` | grill-with-docs、triage、wayfinder、improve-codebase-architecture | 能 |
| `codebase-design` | improve-codebase-architecture、tdd、setup-ts-deep-modules | 能 |
| `writing-for-agents` | retro | 能 |
| `tdd` | implement、implement-spec | 能 |
| `code-review` | implement、implement-spec、tdd | 能 |
| `research` | wayfinder | 能 |
| `prototype` | wayfinder | 能 |

基础技能允许模型调用，靠两层软约束避免在普通对话中触发：

1. `description` 先说明用途，再写明"仅在用户直接调用，或某些技能的步骤要求加载时使用；不要根据对话内容自行加载"。不写"适用于……时"之类的触发条件。
2. 正文第一段是加载条件：不满足时停止，并提示用户改用对应的入口技能。

配置：

- Claude Code：不设 `disable-model-invocation`；用户不能直接调用的再设 `user-invocable: false`。
- Codex：`policy.allow_implicit_invocation: true`。

这是软约束，偶尔误触发可以接受。

## 技能之间的引用

- 入口技能需要基础技能时，写"通过 Skill 工具加载 `/grilling`"，或直接写 `/grilling`。名字必须带斜杠，dsh 打包时才会改写成 `/zh-grilling`。
- 入口技能提到另一个入口技能（如 `/to-spec`、`/setup-matt-pocock-skills`）时，只作推荐，由用户决定是否调用。
- 只按文件路径读取普通参考文档，不属于调用另一个技能。

## 新增或调整技能

把技能放进基础层前，确认它满足以下两点：

- 至少一个入口技能需要在执行中加载它；
- 它的描述按上面的格式写明了加载条件。

顶层和各 bucket 的 `README.md` 分别在 **User-invoked** 和 **Skill-invoked** 分组下列出技能。
