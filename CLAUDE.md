Skills 按 bucket folder 组织在 `skills/` 下：

- `engineering/` - 日常代码工作
- `productivity/` - 日常非代码工作流工具
- `misc/` - 保留但很少使用
- `in-progress/` - beta：有意公开、欢迎反馈，但不随 plugin 发布
- `deprecated/` - 不再使用

`engineering/`、`productivity/` 或 `misc/` 中的每个 skill，都必须在顶层 `README.md` 中有引用，并在 `.claude-plugin/plugin.json` 中有条目。`in-progress/` 和 `deprecated/` 中的 skills 不得出现在这两个位置。

顶层 `README.md` 中的每个 skill 条目都必须把 skill 名称链接到对应的 `SKILL.md`。

每个 bucket folder 都有一个 `README.md`，列出该 bucket 中的所有 skills，并给出一行描述；skill 名称需要链接到对应的 `SKILL.md`。Bucket `README.md` 和顶层 `README.md` 中的 skills 统一列在 **User-invoked** 分组。

本版本每个 `SKILL.md` 都必须是 user-invoked：frontmatter 设置 `disable-model-invocation: true`，`agents/openai.yaml` 设置 `policy.allow_implicit_invocation: false`。所有技能仅允许用户显式调用，包括开发中技能和内部翻译技能。技能间引用需要用户明确指定对应技能，不能自动串联调用。详见 [docs/invocation.md](./docs/invocation.md)。

本仓库也是一个单 plugin 的 Claude Code marketplace：`.claude-plugin/marketplace.json` 列出唯一的 `mattpocock-skills` plugin。修改 `.claude-plugin/plugin.json` 或 marketplace manifest 后，运行 `claude plugin validate . --strict`。Plugin 的公开 skill 集合继续遵循本仓库 bucket 规则。
