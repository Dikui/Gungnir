# Issue tracker：本地 Markdown

本仓库的任务单和需求文档以 Markdown 文件存放在 `.scratch/` 中。

## 约定

- 每个功能一个目录：`.scratch/<feature-slug>/`。
- 需求文档是 `.scratch/<feature-slug>/spec.md`。
- 每张任务单一个文件：`.scratch/<feature-slug>/issues/<NN>-<slug>.md`，从 `01` 开始编号。不要把多张任务单合并成一个文件。
- 分流状态写在任务单文件顶部附近的 `Status:` 行（标签字符串见 `triage-labels.md`）。
- 评论和讨论记录追加到文件底部的 `## Comments` 标题下。
- `.scratch/` 整个目录不提交，只在本机保留（见 `layout.md`）；功能目录不删除。

## 技能关闭任务单时

设置 `Status: resolved`（或分流的关闭状态）并保存后，检查同一 `.scratch/<feature-slug>/issues/` 下是否还有未关闭的任务单。全部关闭且 `spec.md`、`map.md` 顶部没有 `ADR review: done` 行时，按 `layout.md` 的“收尾检查”执行。

## 技能要求“发布到 issue tracker”时

在 `.scratch/<feature-slug>/` 下创建新文件，必要时创建目录。

## 技能要求“读取相关任务单”时

读取所引用路径的文件。用户通常会直接给出路径或任务单编号。

## Wayfinding operations

供 `/wayfinder` 使用。**地图**是一个文件，每张决策任务单是一个**子文件**。

- **地图**：`.scratch/<effort>/map.md`，正文按 `/wayfinder` 的地图格式。
- **决策任务单**：`.scratch/<effort>/issues/NN-<slug>.md`，从 `01` 开始编号，正文写问题。`Type:` 行记录类型（`research`/`prototype`/`grilling`/`task`）；`Status:` 行记录 `claimed` 或 `resolved`。
- **阻塞**：顶部附近的 `Blocked by: NN, NN` 行。它列出的文件都是 `resolved` 时，任务单解除阻塞。
- **可领取任务**：扫描 `.scratch/<effort>/issues/` 中未关闭、已解除阻塞、未领取的文件，取编号最小的。
- **领取**：开始任何工作前设置 `Status: claimed` 并保存。
- **解决**：把答案追加到 `## Answer` 标题下，设置 `Status: resolved`，再向 `map.md` 的 `Decisions so far` 追加一行摘要和链接，然后按“技能关闭任务单时”检查。
