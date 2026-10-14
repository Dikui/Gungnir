# 调用规则

所有技能都允许模型在对话中隐式调用。Gungnir 的技能分两层：**入口技能**通常由用户调用，**基础技能**通常由入口技能调用。两层及 README 中的 **User-invoked** / **Skill-invoked** 分组只说明谁通常调用谁，不代表调用限制。

## 入口技能（User-invoked）

除下表外的所有技能。用户可以显式调用，模型也可以在对话中隐式调用：

- Claude Code：用 `/技能名` 调用。
- Codex：用 `$技能名` 调用。

## 基础技能（Skill-invoked）

| 技能 | 由哪些技能调用 | 用户能否直接调用 |
| --- | --- | --- |
| `grilling` | grill-me、grill-with-docs、triage、wayfinder、improve-codebase-architecture | 否，从 `/grill-me` 或 `/grill-with-docs` 进入 |
| `domain-modeling` | grill-with-docs、triage、wayfinder、improve-codebase-architecture | 能 |
| `codebase-design` | improve-codebase-architecture、tdd | 能 |
| `writing-for-agents` | retro | 能 |
| `tdd` | implement、implement-spec | 能 |
| `diff-review` | implement、implement-spec、tdd | 能 |
| `research` | wayfinder | 能 |
| `prototype` | wayfinder | 能 |

基础技能通常由入口技能在执行中加载，也允许模型在对话中隐式调用。除 `grilling` 外，用户也可以直接调用。

## 配置

所有技能统一使用以下配置：

- Claude Code：不设 `disable-model-invocation`；`user-invocable: false` 仅用于用户不能直接调用的技能，目前为 `grilling`。
- Codex：相邻 `agents/openai.yaml` 设置 `policy.allow_implicit_invocation: true`。

技能描述说明用途，正文直接说明执行方法。

## 技能之间的引用

- 入口技能需要基础技能时，写"通过 Skill 工具加载 `/grilling`"，或直接写 `/grilling`。名字必须带斜杠，dsh 打包时才会改写成 `/zh-grilling`。
- 入口技能提到另一个入口技能（如 `/to-spec`、`/setup-dikui-skills`）时，可以推荐给用户，也允许模型隐式调用。
- 只按文件路径读取普通参考文档，不属于调用另一个技能。

## 新增或调整技能

至少一个入口技能需要在执行中加载的技能可放入基础层，并登记在上表中；其余技能属于入口层。描述保留用途，正文说明执行方法，配置遵循上面的统一规则。

顶层和各 bucket 的 `README.md` 分别在 **User-invoked** 和 **Skill-invoked** 分组下列出技能，并与上表保持一致。
