# 仓库指南

Skills 按 bucket folder 组织在 `skills/` 下：

- `engineering/` - 日常代码工作
- `productivity/` - 日常非代码工作流工具
- `misc/` - 保留但很少使用
- `in-progress/` - beta：有意公开、欢迎反馈，但不随 plugin 发布
- `deprecated/` - 不再使用

`engineering/`、`productivity/` 或 `misc/` 中的每个 skill，都必须在顶层 `README.md` 中有引用，并在 `.claude-plugin/plugin.json` 中有条目。`in-progress/` 和 `deprecated/` 中的 skills 不得出现在这两个位置。

顶层 `README.md` 中的每个 skill 条目都必须把 skill 名称链接到对应的 `SKILL.md`。

每个 bucket folder 都有一个 `README.md`，列出该 bucket 中的所有 skills，并给出一行描述；skill 名称需要链接到对应的 `SKILL.md`。Bucket `README.md` 和顶层 `README.md` 按调用方式分为 **User-invoked** 和 **Skill-invoked** 两组。

技能分两层：入口技能只由用户调用（`disable-model-invocation: true`，`agents/openai.yaml` 中 `policy.allow_implicit_invocation: false`）；基础技能由入口技能调用，描述和正文开头写明加载条件，避免在普通对话中触发。基础技能清单、配置和写法见 [docs/invocation.md](./docs/invocation.md)。

本仓库也是一个单 plugin 的 Claude Code marketplace：`.claude-plugin/marketplace.json` 列出唯一的 `mattpocock-skills` plugin。修改 `.claude-plugin/plugin.json` 或 marketplace manifest 后，运行 `claude plugin validate . --strict`。Plugin 的公开 skill 集合继续遵循本仓库 bucket 规则。

## 翻译刷新

从 `mattpocock/skills` 刷新上游内容时，改文件前先使用 `.skills/translate-skill/SKILL.md`。本仓库采用 skill-guided content localization，不做 Git fork-sync：保留简体中文本地化身份，安装命令保持指向 `vinvcn/mattpocock-skills-zh-CN`，不要导入上游 repository-management state。刷新时保留本地的调用分层：基础技能的 `description` 和正文开头的加载条件不要被上游内容覆盖。
