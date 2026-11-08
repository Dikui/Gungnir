# 仓库指南

Skills 按 bucket folder 组织在 `skills/` 下：

- `engineering/` - 日常代码工作
- `productivity/` - 日常非代码工作流工具

`skills/` 中的每个技能都必须在顶层 `README.md` 中有引用，并在 `skills/.claude-plugin/plugin.json` 中有条目；这些技能都随主插件公开。

顶层 `README.md` 中的每个 skill 条目都必须把 skill 名称链接到对应的 `SKILL.md`。

每个 bucket folder 都有一个 `README.md`，列出该 bucket 中的所有 skills，只写名称并链接到对应的 `SKILL.md`，描述以 `SKILL.md` 的 `description` 为准。Bucket `README.md` 和顶层 `README.md` 按调用方式分为 **User-invoked** 和 **Skill-invoked** 两组。

主插件技能都允许模型在对话中隐式调用：`SKILL.md` 不设置 `disable-model-invocation`，相邻 `agents/openai.yaml` 设置 `policy.allow_implicit_invocation: true`。入口技能通常由用户调用，基础技能通常由入口技能调用；两层及 README 分组只说明谁通常调用谁，不代表调用限制。`user-invocable: false` 仅用于用户不能直接调用的技能。基础技能清单、配置和写法见 [docs/invocation.md](./docs/invocation.md)。

白板技能随主插件发布；外部运行组件仅在使用白板时下载，不作为 Gungnir 必装依赖。

本仓库也是一个单 plugin 的 Claude Code marketplace：`.claude-plugin/marketplace.json` 列出唯一的 `gungnir` plugin，插件根目录是 `skills/`，安装时只复制该目录，仓库其余文件不进安装包。技能不得引用 `skills/` 以外的文件。修改 `skills/.claude-plugin/plugin.json` 或 marketplace manifest 后，运行 `claude plugin validate . --strict` 和 `claude plugin validate skills --strict`。

## Agent skills

### Issue tracker

Issues 和 specs 以 Markdown 文件存放在 `.scratch/<feature>/`。See `docs/agents/issue-tracker.md`.

### Triage labels

使用五个默认标签：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。See `docs/agents/triage-labels.md`.

### Domain docs

single-context：根目录 `GLOSSARY.md` 加 `docs/adr/`。涉及业务或架构设计时，参阅 `docs/agents/domain.md` 中的资料入口与按需读取规则。

### Document layout

文档放置约定见 `docs/agents/layout.md`。

### Testing

开发中只运行受影响的检查，按 `/local-test` 做：改技能、README 或清单后运行 `node scripts/check-repo.mjs`；改 safe-push 扫描运行 `bash scripts/test-safe-push-scan.sh`；改 pre-push 模板运行 `sh scripts/test-pre-push.sh`；改 `dsh-plugin/` 运行 `cd dsh-plugin && npm test`。全量检查写在 `.githooks/pre-push`，由它在版本号（`skills/.claude-plugin/plugin.json`）前两位变化时运行。

### Commit rules

禁止 `--no-verify`、`git add -A` / `git add .` 和强推。

### 试用与部署

验收单附试用命令，在 Claude 里临时加载改动后的插件，并只在这个会话里停用已安装的版本：

```sh
claude --plugin-dir <worktree>/skills --settings '{"enabledPlugins":{"gungnir@gungnir":false}}'
```

部署 Gungnir 就是把本机 Claude、Codex、Grok 里的 Gungnir 插件更新到新版本。验收通过、推送到 `main` 后，运行 `sh scripts/sync-local-installs.sh`，并报告各处版本。

## 偏好

- 技能、README 和清单只写经过筛选、确实有用的内容；设计稿、调研结论、实验记录和 `.scratch/` 不提交（2026-11-08，来源：Gungnir 历史讨论）。
- Gungnir 是给各种代理安装的通用技能来源，不绑定本机配置；私人技能、工具和提示词不放进本仓库（2026-11-08，来源：仓库定位讨论）。
- 只在 `main` 上升版本号，默认只升修订号（2026-11-08，来源：Gungnir 使用分析）。
