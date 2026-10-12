# 仓库指南

Skills 按 bucket folder 组织在 `skills/` 下：

- `engineering/` - 日常代码工作
- `productivity/` - 日常非代码工作流工具

仓库中的每个技能都必须在顶层 `README.md` 中有引用，并在 `.claude-plugin/plugin.json` 中有条目；所有技能都公开。

顶层 `README.md` 中的每个 skill 条目都必须把 skill 名称链接到对应的 `SKILL.md`。

每个 bucket folder 都有一个 `README.md`，列出该 bucket 中的所有 skills，并给出一行描述；skill 名称需要链接到对应的 `SKILL.md`。Bucket `README.md` 和顶层 `README.md` 按调用方式分为 **User-invoked** 和 **Skill-invoked** 两组。

技能分两层：入口技能只由用户调用（`disable-model-invocation: true`，`agents/openai.yaml` 中 `policy.allow_implicit_invocation: false`）；基础技能由入口技能调用，描述和正文开头写明加载条件，避免在普通对话中触发。基础技能清单、配置和写法见 [docs/invocation.md](./docs/invocation.md)。

本仓库也是一个单 plugin 的 Claude Code marketplace：`.claude-plugin/marketplace.json` 列出唯一的 `gungnir` plugin。修改 `.claude-plugin/plugin.json` 或 marketplace manifest 后，运行 `claude plugin validate . --strict`。根目录 `CLAUDE.md` 会触发一条已知警告（插件根目录的 CLAUDE.md 不作为项目上下文加载），严格模式因此退出码为 1；这条可以忽略，只需确认没有其他警告或错误。
