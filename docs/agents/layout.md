# Document Layout

各类文档放在哪里、是否提交、何时清理。技能按本表读写，不另行选择位置。

只提交核心内容：clone 仓库的人或代理构建、运行、修改或理解项目所必需的文件。过程产物、中间结论、可重新生成的文件、临时代码和本机文件都不提交。

| 路径 | 内容 | 写入方 | 提交 | 清理 |
|---|---|---|---|---|
| `AGENTS.md`、`CLAUDE.md` | 规则文件 | setup-dikui-skills | 是 | 不清理 |
| `docs/agents/` | 技能配置 | setup-dikui-skills、safe-push | 是 | 不清理 |
| `GLOSSARY.md`、`GLOSSARY-MAP.md`、`docs/adr/` | 术语、架构决策 | domain-modeling | 是 | 不清理 |
| `design/` | 界面设计稿 | mockup | 否 | 不清理 |
| `docs/research/` | 调研结论 | research | 否 | 不清理 |
| `docs/experiments/` | 实验记录 | ablation | 否 | 不清理 |
| `.out-of-scope/` | 拒绝记录 | triage | 否 | 重新考虑时删除或更新 |
| `.scratch/<feature>/` | 需求和任务单（本地 tracker） | to-spec、to-tickets、wayfinder | 否 | 不清理；任务单全部关闭时做收尾检查 |
| `.scratch/tasks/<任务号>/` | 执行说明、报告、证据 | 执行者 | 否 | 随意 |
| `.scratch/prototype/` | 逻辑原型 | prototype | 否 | 结论落地后删除 |
| `*.excalidraw` | 白板存档 | whiteboard | 否 | 用户自行处理 |

- 目录在第一次用到时创建，不预建。
- 项目已有同类目录（如 `docs/decisions/`）时，把表中路径改成实际路径，技能按表执行。
- 已提交的文件不链接不提交的路径；需要引用时写明“仅本地”。
- 界面原型和诊断用的临时代码写在代码旁，提交前移除；回归测试照常提交。
- 交接文档（handoff）和架构评审报告写到系统临时目录，不在表中。

## 收尾检查

本地 tracker 下，一个功能的任务单全部关闭时执行。不提交的任务单只在本机保留，ADR 是唯一进入远程仓库的决策记录。

1. 回看 `spec.md`、`map.md` 和各任务单的答案，按 `/domain-modeling` 的 ADR 三个条件筛出候选决策，连同被否决的方案列给用户确认。
2. 用户确认的决策用 `/domain-modeling` 写入 ADR；讨论中确定的新术语写入 `GLOSSARY.md`。
3. 在 `spec.md`（没有时写 `map.md`）顶部写一行 `ADR review: done <YYYY-MM-DD>`。没有候选决策也写。
