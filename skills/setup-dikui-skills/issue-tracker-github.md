# Issue tracker：GitHub

本仓库的任务单和需求文档存放在 GitHub Issues 中。所有操作使用 `gh` CLI。

## 约定

- **创建 issue**：`gh issue create --title "..." --body "..."`。多行正文用 heredoc。
- **读取 issue**：`gh issue view <number> --comments`，用 `jq` 过滤评论，同时取得标签。
- **列出 issue**：`gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`，按需加 `--label` 和 `--state`。
- **评论**：`gh issue comment <number> --body "..."`
- **加或去标签**：`gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **关闭**：`gh issue close <number> --comment "..."`

仓库从 `git remote -v` 推断；在克隆目录内运行时，`gh` 会自动识别。

## 把 PR 作为请求入口

**PRs as a request surface: no.** _（本仓库把外部 PR 当作功能请求时改为 `yes`；`/triage` 会读取这一项。）_

设为 `yes` 时，PR 使用与 issue 相同的标签和状态，命令换成 `gh pr`：

- **读取 PR**：`gh pr view <number> --comments`，用 `gh pr diff <number>` 取得 diff。
- **列出待分流的外部 PR**：`gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments`，只保留 `authorAssociation` 为 `CONTRIBUTOR`、`FIRST_TIME_CONTRIBUTOR` 或 `NONE` 的，排除 `OWNER`、`MEMBER`、`COLLABORATOR`。
- **评论、标签、关闭**：`gh pr comment`、`gh pr edit --add-label`/`--remove-label`、`gh pr close`。

GitHub 的 issue 和 PR 共用一套编号，单独的 `#42` 可能是任一种：先用 `gh pr view 42`，失败再用 `gh issue view 42`。

## 技能要求“发布到 issue tracker”时

创建一个 GitHub issue。

## 技能要求“读取相关任务单”时

运行 `gh issue view <number> --comments`。

## Wayfinding operations

供 `/wayfinder` 使用。**地图**是一个 issue，决策任务单是它的**子 issue**。

- **地图**：一个带 `wayfinder:map` 标签的 issue，正文按 `/wayfinder` 的地图格式。`gh issue create --label wayfinder:map`。
- **决策任务单**：作为 GitHub sub-issue 关联到地图（用 `gh api` 调用 sub-issues 接口）。未启用 sub-issues 时，把它加入地图正文的任务列表，并在自己正文顶部写 `Part of #<map>`。标签为 `wayfinder:<type>`（`research`/`prototype`/`grilling`/`task`）。领取后分配给推进地图的开发者。
- **阻塞**：使用 GitHub 的**原生 issue 依赖**，它在界面上可见，是权威记录。用 `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>` 添加，其中 `<blocker-db-id>` 是前置 issue 的数字 **database id**（`gh api repos/<owner>/<repo>/issues/<n> --jq .id`，不是 `#number`，也不是 `node_id`）。GitHub 在 `issue_dependencies_summary.blocked_by` 中报告仍未关闭的前置数量。依赖功能不可用时，改在子 issue 正文顶部写 `Blocked by: #<n>, #<n>`。所有前置都关闭时，任务单解除阻塞。
- **可领取任务**：列出地图未关闭的子 issue（`gh issue list --state open`，限定在地图的 sub-issues 或任务列表内），排除有未关闭前置的（`issue_dependencies_summary.blocked_by > 0`，或 `Blocked by` 行中有未关闭的 issue）和已分配的，按地图中的顺序取第一个。
- **领取**：`gh issue edit <n> --add-assignee @me`，作为会话的第一次写入。
- **解决**：`gh issue comment <n> --body "<answer>"`，再 `gh issue close <n>`，然后向地图的 `Decisions so far` 追加一行摘要和链接。
