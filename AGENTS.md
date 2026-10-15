# 仓库指南

Skills 按 bucket folder 组织在 `skills/` 下：

- `engineering/` - 日常代码工作
- `productivity/` - 日常非代码工作流工具

仓库中的每个技能都必须在顶层 `README.md` 中有引用，并在 `.claude-plugin/plugin.json` 中有条目；所有技能都公开。

顶层 `README.md` 中的每个 skill 条目都必须把 skill 名称链接到对应的 `SKILL.md`。

每个 bucket folder 都有一个 `README.md`，列出该 bucket 中的所有 skills，并给出一行描述；skill 名称需要链接到对应的 `SKILL.md`。Bucket `README.md` 和顶层 `README.md` 按调用方式分为 **User-invoked** 和 **Skill-invoked** 两组。

所有技能都允许模型在对话中隐式调用：`SKILL.md` 不设置 `disable-model-invocation`，相邻 `agents/openai.yaml` 设置 `policy.allow_implicit_invocation: true`。入口技能通常由用户调用，基础技能通常由入口技能调用；两层及 README 分组只说明谁通常调用谁，不代表调用限制。`user-invocable: false` 仅用于用户不能直接调用的技能。基础技能清单、配置和写法见 [docs/invocation.md](./docs/invocation.md)。

本仓库也是一个单 plugin 的 Claude Code marketplace：`.claude-plugin/marketplace.json` 列出唯一的 `gungnir` plugin。修改 `.claude-plugin/plugin.json` 或 marketplace manifest 后，运行 `claude plugin validate . --strict`。根目录 `CLAUDE.md` 会触发一条已知警告（插件根目录的 CLAUDE.md 不作为项目上下文加载），严格模式因此退出码为 1；这条可以忽略，只需确认没有其他警告或错误。

## Agent skills

### Issue tracker

Issues 和 specs 以 Markdown 文件存放在 `.scratch/<feature>/`。See `docs/agents/issue-tracker.md`.

### Triage labels

使用五个默认标签：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。See `docs/agents/triage-labels.md`.

### Domain docs

single-context：根目录 `GLOSSARY.md` 加 `docs/adr/`。涉及业务或架构设计时，参阅 `docs/agents/domain.md` 中的资料入口与按需读取规则。

### Document layout

文档放置约定见 `docs/agents/layout.md`。

### Commit rules

禁止 `--no-verify`、`git add -A` / `git add .` 和强推。
