---
name: claude-handoff
description: 将当前对话整理为交接摘要，并启动新的后台代理立即接手。
argument-hint: "下一个会话将用于什么？"
disable-model-invocation: true
---

为当前对话编写交接摘要，不保存为文件。将摘要作为提示，启动后台代理：`claude --bg --name "<descriptive name>" "<handoff summary>"`。代理在当前工作目录启动，命令立即返回；用户可用 `claude agents` 管理它。

始终传入 `-n`/`--name` 和描述性名称，如 `--name "Fix login bug"`。名称会显示在任务列表、会话选择器和终端标题中。

摘要应包含：

- `suggested skills` 小节：建议接手代理使用的技能，由用户决定调用哪些技能。
- 已有产物的路径或 URL，如 PRD、计划、ADR、issue、提交和差异，不重复其内容。
- 用户传入参数所指定的下一会话重点。

删除 API 密钥、密码和个人身份信息等敏感内容；摘要会直接成为新代理的提示。
