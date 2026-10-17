# 调用分层实测

修改调用规则或技能内容后，在**新会话**中手动跑一遍（技能列表在会话启动时加载）。规则见[调用规则](./invocation.md)。

## 准备

让会话加载本仓库的技能，任选一种：

- Claude Code CLI：`claude --plugin-dir <本仓库路径>`
- 安装 plugin：`claude plugin install gungnir@gungnir`（marketplace 指向本仓库）

## A. 普通对话不触发基础技能

逐条发送，期望**不调用 Skill 工具**；若调用了，期望基础技能按"加载条件"停下并提示入口技能。

| 提问 | 容易误触发的技能 |
| --- | --- |
| 帮我拷问一下这个方案：周末把数据库从 MySQL 迁到 Postgres | grilling |
| 写一个解析 ISO 日期的函数，并加上测试 | tdd |
| 帮我看下最近一次提交的代码有没有问题 | diff-review |
| 这个模块接口应该怎么设计才好测？ | codebase-design |
| 我们项目里"订单"和"交易"是一回事吗？ | domain-modeling |
| 查一下 Node 22 的 `fs.cp` 是否稳定 | research |
| 帮我改一下 AGENTS.md，让它更简洁 | writing-for-agents |

## B. 入口技能能加载基础技能

| 输入 | 期望 |
| --- | --- |
| `/grill-me 我计划周末迁移数据库` | 加载 `grilling` 并开始一轮编号提问 |
| `/grill-with-docs 梳理订单领域` | 加载 `grilling` 和 `domain-modeling` |
| `/implement`（附一份小需求） | 加载 `tdd`，结束前加载 `diff-review` |

## C. 用户直接调用

| 输入 | 期望 |
| --- | --- |
| `/tdd` | 正常开始，不被加载条件拦下 |
| `/ablation` | 正常开始，并出现在 `/` 菜单中 |
| `/adversarial-review` | 正常开始，并出现在 `/` 菜单中 |
| `/cohesion-coupling` | 正常开始，并出现在 `/` 菜单中 |
| `/first-principles` | 正常开始，并出现在 `/` 菜单中 |
| `/occams-razor` | 正常开始，并出现在 `/` 菜单中 |
| `/safe-push` | 出现在 `/` 菜单中；先检查仓库状态，无项目规则时展示草稿并等待确认；询问版本号并等待确认；提交和推送分别等待确认 |
| `/grilling` | 不出现在 `/` 菜单中 |

## D. Codex 与 Grok

技能正文里"通过 Skill 工具加载 `/xxx`"的写法按 Claude Code 写成，需确认 Codex 和 Grok 也能据此加载基础技能。两者都从已安装的 plugin 读取技能，先按发布流程升级插件，再在新会话中测。

| Agent | 调用写法 | 无交互运行（只读） |
| --- | --- | --- |
| Codex | `$技能名` | `codex exec -s read-only --skip-git-repo-check -C <空目录> - < prompt.md` |
| Grok | `/技能名` | `grok --always-approve --no-subagents --agent explore --cwd <空目录> --prompt-file prompt.md` |

| 输入 | 期望 |
| --- | --- |
| `grill-me 我计划周末把数据库从 MySQL 迁到 Postgres`（按上表加前缀） | 加载 `grilling`：编号提问、每题附 ➡️ 推荐答案、末行有进度 |

记录：

| 日期 | Agent 与模型 | 插件版本 | 结果 |
| --- | --- | --- | --- |
| 2026-10-17 | Codex，gpt-5.6-sol | 3.3.4 | 通过：日志显示先读 grill-me，再按"通过 Skill 工具加载"读取 grilling 的 SKILL.md |
| 2026-10-17 | Grok，grok-4.7 | 已安装版本 | 通过：输出符合 grilling 格式；Grok 不输出工具日志，只能按输出判断 |
