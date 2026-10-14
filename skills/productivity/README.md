# Productivity

通用工作流工具，不限于代码。

## User-invoked

通常由你调用，也允许模型在对话中隐式调用；分组只说明谁通常调用谁。

- **[adversarial-review](./adversarial-review/SKILL.md)** - 让独立攻击方寻找计划、需求或代码的反例，核实后报告成立的反例。
- **[first-principles](./first-principles/SKILL.md)** - 从目标和已验证事实重新推导方案，判断当前方向是否成立。
- **[grill-me](./grill-me/SKILL.md)** - 围绕计划或设计进行持续追问，直到 decision tree 的每个分支都被解决。
- **[handoff](./handoff/SKILL.md)** - 把当前对话压缩成 handoff document，让另一个 agent 可以继续。
- **[occams-razor](./occams-razor/SKILL.md)** - 把方案的每个组成追溯到需求或证据，找出可以删除的部分。
- **[wait-what](./wait-what/SKILL.md)** - 当一条消息没被理解时立即触发。agent 用你缺失的上下文、以直白的语言、借助你的 `GLOSSARY.md` 词汇重新解释。

## Skill-invoked

通常由入口技能在执行中加载，也允许模型在对话中隐式调用；除 `grilling` 外，你也可以直接调用。见[调用规则](../../docs/invocation.md)。

- **[grilling](./grilling/SKILL.md)** - 围绕计划、decision 或 idea 持续访谈用户，直到 decision tree 的每个分支都被解决。
- **[writing-for-agents](./writing-for-agents/SKILL.md)** - 为 agent 编写文档：skills、`AGENTS.md`/`CLAUDE.md`，以及任何 agent 通过指针触达的文档。
