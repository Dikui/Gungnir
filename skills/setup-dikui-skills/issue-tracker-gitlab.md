# Issue tracker：GitLab

本仓库的任务单和需求文档存放在 GitLab Issues 中。所有操作使用 [`glab`](https://gitlab.com/gitlab-org/cli) CLI。

## 约定

- **创建 issue**：`glab issue create --title "..." --description "..."`。多行描述用 heredoc；传 `--description -` 可打开编辑器。
- **读取 issue**：`glab issue view <number> --comments`。加 `-F json` 取得机器可读的输出。
- **列出 issue**：`glab issue list -F json`，按需加 `--label`。
- **评论**：`glab issue note <number> --message "..."`。GitLab 把评论称为 note。
- **加或去标签**：`glab issue update <number> --label "..."` / `--unlabel "..."`。多个标签用逗号分隔，或重复该参数。
- **关闭**：`glab issue close <number>`。它不接受关闭评论，所以先用 `glab issue note <number> --message "..."` 发布说明，再关闭。
- **合并请求**：GitLab 把 PR 称为 merge request（MR）。使用 `glab mr create`、`glab mr view`、`glab mr note` 等；用法与 `gh pr ...` 相同，只是 `pr` 换成 `mr`，`comment`/`--body` 换成 `note`/`--message`。

仓库从 `git remote -v` 推断；在克隆目录内运行时，`glab` 会自动识别。

## 把 MR 作为请求入口

**MRs as a request surface: no.** _（本仓库把外部 MR 当作功能请求时改为 `yes`；`/triage` 会读取这一项。）_

设为 `yes` 时，MR 使用与 issue 相同的标签和状态，命令换成 `glab mr`：

- **读取 MR**：`glab mr view <number> --comments`，用 `glab mr diff <number>` 取得 diff。
- **列出待分流的外部 MR**：`glab mr list -F json`，只保留作者不是项目成员或所有者的 MR。
- **评论、标签、关闭**：`glab mr note`、`glab mr update --label`/`--unlabel`、`glab mr close`。

GitLab 的 issue 和 MR 分开编号。知道维护者指的是哪一种后，`#42` 没有歧义。

## 技能要求“发布到 issue tracker”时

创建一个 GitLab issue。

## 技能要求“读取相关任务单”时

运行 `glab issue view <number> --comments`。

## Wayfinding operations

供 `/wayfinder` 使用。**地图**是一个 issue，决策任务单是它的**子 issue**。

- **地图**：一个带 `wayfinder:map` 标签的 issue，正文按 `/wayfinder` 的地图格式。`glab issue create --label wayfinder:map`。支持 epic 的 GitLab 版本也可以用 epic 保存地图；带标签的 issue 在所有版本都可用。
- **决策任务单**：一个 issue，描述顶部写 `Part of #<map>`，标签为 `wayfinder:<type>`（`research`/`prototype`/`grilling`/`task`）。领取后分配给推进地图的开发者。
- **阻塞**：使用 GitLab 的**原生阻塞关联**，它在界面上可见，是权威记录。用 quick action 作为 note 发布：`glab issue note <child> --message "/blocked_by #<blocker>"`。原生阻塞关联是 Premium/Ultimate 功能；免费版或不可用时，改在描述顶部写 `Blocked by: #<n>, #<n>`。所有前置都关闭时，任务单解除阻塞。
- **可领取任务**：`glab issue list -F json` 限定在地图的子 issue 内，排除有未关闭前置的（原生 `blocked_by` 关联指向未关闭的 issue，用 `glab api projects/:id/issues/:iid/links` 查询；或 `Blocked by` 行中有未关闭的 issue）和已分配的，按地图中的顺序取第一个。
- **领取**：`glab issue update <n> --assignee @me`，作为会话的第一次写入。
- **解决**：`glab issue note <n> --message "<answer>"`，再 `glab issue close <n>`，然后向地图的 `Decisions so far` 追加一行摘要和链接。
