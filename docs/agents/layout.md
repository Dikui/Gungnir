# Document Layout

各类文档放在哪里、是否提交、何时清理。技能按本表读写，不另行选择位置。

| 路径 | 内容 | 写入方 | 提交 | 清理 |
|---|---|---|---|---|
| `AGENTS.md`、`CLAUDE.md` | 规则文件 | setup-dikui-skills | 是 | 不清理 |
| `docs/agents/` | 技能配置 | setup-dikui-skills、safe-push | 是 | 不清理 |
| `GLOSSARY.md`、`GLOSSARY-MAP.md`、`docs/adr/` | 术语、架构决策 | domain-modeling | 是 | 不清理 |
| `design/` | 界面设计稿 | mockup | 是 | 不清理 |
| `docs/research/` | 调研结论 | research | 是 | 不清理 |
| `docs/experiments/` | 实验记录 | ablation | 是 | 不清理 |
| `.out-of-scope/` | 拒绝记录 | triage | 是 | 不清理 |
| `.scratch/<feature>/` | 需求和任务单（本地 tracker） | to-spec、to-tickets、wayfinder | 是 | 功能的任务单全部关闭后删除目录 |
| `.scratch/tasks/<任务号>/` | 执行说明、报告、证据 | 执行者 | 否 | 随意 |
| `.scratch/prototype/` | 逻辑原型 | prototype | 否 | 结论落地后删除 |

- 目录在第一次用到时创建，不预建。
- 项目已有同类目录（如 `docs/decisions/`）时，把表中路径改成实际路径，技能按表执行。
- 交接文档（handoff）写到系统临时目录，不在表中。
