# 调用分层实测

修改调用规则或从上游刷新内容后，在**新会话**中手动跑一遍（技能列表在会话启动时加载）。规则见[调用规则](./invocation.md)。

## 准备

让会话加载本仓库的技能，任选一种：

- Claude Code CLI：`claude --plugin-dir <本仓库路径>`
- 安装 plugin：`claude plugin install mattpocock-skills@mattpocock`（marketplace 指向本仓库）

## A. 普通对话不触发基础技能

逐条发送，期望**不调用 Skill 工具**；若调用了，期望基础技能按"加载条件"停下并提示入口技能。

| 提问 | 容易误触发的技能 |
| --- | --- |
| 帮我拷问一下这个方案：周末把数据库从 MySQL 迁到 Postgres | grilling |
| 写一个解析 ISO 日期的函数，并加上测试 | tdd |
| 帮我看下最近一次提交的代码有没有问题 | code-review |
| 这个模块接口应该怎么设计才好测？ | codebase-design |
| 我们项目里"订单"和"交易"是一回事吗？ | domain-modeling |
| 查一下 Node 22 的 `fs.cp` 是否稳定 | research |
| 帮我改一下 AGENTS.md，让它更简洁 | writing-for-agents |

## B. 入口技能能加载基础技能

| 输入 | 期望 |
| --- | --- |
| `/grill-me 我计划周末迁移数据库` | 加载 `grilling` 并开始一轮编号提问 |
| `/grill-with-docs 梳理订单领域` | 加载 `grilling` 和 `domain-modeling` |
| `/implement`（附一份小需求） | 加载 `tdd`，结束前加载 `code-review` |

## C. 用户直接调用

| 输入 | 期望 |
| --- | --- |
| `/tdd` | 正常开始，不被加载条件拦下 |
| `/grilling` | 不出现在 `/` 菜单中 |
