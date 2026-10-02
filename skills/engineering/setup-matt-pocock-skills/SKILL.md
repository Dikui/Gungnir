---
name: setup-matt-pocock-skills
description: 首次使用工程技能前，配置项目的 issue tracker、分流标签和领域文档入口。
disable-model-invocation: true
---

# 配置工程技能

为当前仓库确定任务存放位置、五种分流状态的标签，以及 `CONTEXT.md`、ADR、已有产品框架图的路径和读取规则。

先探索并展示发现，再与用户确认和写入。本技能按项目情况配置，不是一段固定脚本。

## 1. 了解现有项目

读取已有内容，不凭空假设：

- `git remote -v` 和 `.git/config`：判断托管平台和仓库。
- 根目录 `AGENTS.md`、`CLAUDE.md`：查看是否已有 `## Agent skills`。
- 根目录 `CONTEXT.md`、`CONTEXT-MAP.md`，以及 `docs/adr/`、`src/*/docs/adr/`。
- `docs/agents/`：查看此前是否已配置。
- 已登记的框架图路径，以及默认的 `docs/architecture.md`（若存在）。
- `.scratch/`：查看是否已使用本地 Markdown 任务约定。
- 相邻目录或可用技能中是否存在 `triage`：决定是否配置分流标签。
- `pnpm-workspace.yaml`、`package.json` 的 `workspaces`，或已有内容且各自包含 `src/` 的 `packages/*`：判断是否为大型多包仓库。无这些信号时，按单上下文处理。

## 2. 展示发现并确认选项

总结已有和缺失的配置。按 A、B、C 顺序逐项讨论，每次只处理一个选项，先给推荐答案。仅在选择确有差异时补充一行解释。探索已能确定答案时跳过提问。

### A. Issue tracker

Tracker 是项目存放任务的地方。`to-tickets`、`triage`、`to-spec` 等技能根据配置选择 CLI、本地文件或其他工作流。

通常默认 GitHub；远程地址指向 GitHub 时推荐 GitHub，指向 GitLab（包括自托管）时推荐 GitLab。否则，或用户有其他偏好时，提供以下选择：

- **GitHub**：使用 `gh` CLI 管理 GitHub Issues，如 `gh issue create`。
- **GitLab**：使用 [glab](https://gitlab.com/gitlab-org/cli) 管理 GitLab Issues。
- **本地 Markdown**：任务文件保存在 `.scratch/<feature>/`，适合个人项目或无远程仓库的项目。
- **其他平台**：如 Jira、Linear，请用户用一段话说明工作流，并原样记录为自然语言配置。

将选择写入 `docs/agents/issue-tracker.md`。GitHub、GitLab 模板中的 “PRs as a request surface” 默认关闭，不为此提问；用户之后可以自行打开外部 PR 分流。

### B. 分流标签

未安装 `triage` 时跳过整个选项。已安装时，只问是否保留默认标签，推荐保留：

`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。

用户同意时按标准名称写入。只有用户不同意时才收集名称映射，避免创建重复标签。

### C. 领域文档

默认使用单上下文：根目录 `CONTEXT.md` 加 `docs/adr/`，无需提问。仅在发现大型多包仓库信号时，才提供多上下文选项：根目录 `CONTEXT-MAP.md` 链接各上下文的 `CONTEXT.md`，由用户确认布局。

已有框架图时，在 `docs/agents/domain.md` 保留或登记实际路径和适用场景。沿用自定义路径，不另建副本；已有规则文件中的图入口也保留。没有图时，不创建占位，也不要求接入 Canvas。

## 3. 展示草稿

写入前展示以下内容，并让用户有机会修改：

- 将加入 `CLAUDE.md` 或 `AGENTS.md` 的 `## Agent skills`。
- `docs/agents/issue-tracker.md` 和 `docs/agents/domain.md`。
- 仅在安装了 `triage` 时，展示 `docs/agents/triage-labels.md`。

## 4. 写入配置

选择规则文件：优先编辑已有 `CLAUDE.md`，否则编辑已有 `AGENTS.md`。两者都不存在时，询问用户创建哪一个，不替用户选择。已有其中之一时不新建另一个。

已有 `## Agent skills` 时原位更新，不重复追加，也不覆盖周围的用户内容。使用以下结构：

```markdown
## Agent skills

### Issue tracker

[one-line summary of where issues are tracked]. See `docs/agents/issue-tracker.md`.

### Triage labels

[one-line summary of the label vocabulary]. See `docs/agents/triage-labels.md`.

### Domain docs

[one-line summary of layout - "single-context" or "multi-context"]. 涉及业务或架构设计时，参阅 `docs/agents/domain.md` 中的资料入口与按需读取规则。
```

仅在安装了 `triage` 且实际完成选项 B 时，保留 `### Triage labels` 并写入 `docs/agents/triage-labels.md`；否则两者都省略。

以下模板作为起点：

- [issue-tracker-github.md](./issue-tracker-github.md)：GitHub。
- [issue-tracker-gitlab.md](./issue-tracker-gitlab.md)：GitLab。
- [issue-tracker-local.md](./issue-tracker-local.md)：本地 Markdown。
- [triage-labels.md](./triage-labels.md)：标签映射，仅在安装 `triage` 时使用。
- [domain.md](./domain.md)：领域文档布局和读取规则。

其他 tracker 按用户描述编写 `docs/agents/issue-tracker.md`。

## 5. 完成

说明配置结果，以及哪些工程技能会读取这些文件。用户可随时直接修改 `docs/agents/*.md`；只有切换 tracker 或重新配置时，才需再次运行本技能。
