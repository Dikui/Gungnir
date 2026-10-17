# Gungnir 技能

由 Claude Code 加载的一组 agent skills（slash commands 和 behaviors）。Skills 按 bucket 组织，并由 `/setup-dikui-skills` 生成的每仓库配置消费。

## Language

**Issue tracker**:
托管某个 repo issues 的工具，例如 GitHub Issues、Linear、本地 `.scratch/` markdown 约定，或类似系统。`to-tickets`、`to-spec` 和 `triage` 等 skills 会从中读取并写入。
_Avoid_: backlog manager, backlog backend, issue host

**Issue**:
**Issue tracker** 中的一项被跟踪工作单元：bug、task、spec，或由 `to-tickets` 产出的 slice。
_Avoid_: ticket（仅在引用外部系统称其为 ticket，或指下面的 **Decision ticket** 时使用）

**Decision ticket**:
`wayfinder` 的工作单元：`wayfinder:map` 的一个 child **Issue**，承载的问题需要通过 decision 解决，而不是要执行的 build slice。**Decision** qualifier 把它与 implementation ticket 区分开来；`wayfinder` 会先引入完整术语，之后再简称 ticket。

**Triage role**:
在 triage 期间应用到 **Issue** 上的规范 state-machine label（例如 `needs-triage`、`ready-for-agent`）。每个 role 都会通过 `skills/engineering/setup-dikui-skills/triage-labels.md` 映射到 **Issue tracker** 中真实的 label 字符串。

**调度者**:
主会话中负责选择 **执行者**、派发 **任务单**、核对 **报告** 的 agent；它不写业务代码。
_Avoid_: controller、orchestrator、主代理

**执行者**:
被 **调度者** 派出、按一张 **任务单** 工作的 agent，可以是 Claude 子代理、Codex 或 Grok；按职责称实施执行者、审查执行者、探索执行者。
_Avoid_: 子代理（仅在指 Claude 内置 subagent 时使用）、worker、implementer

**任务单**:
**调度者** 交给一个 **执行者** 的一次性派单文件，含目标、上下文指针和报告要求。
_Avoid_: brief、prompt 文件

**报告**:
**执行者** 按 **任务单** 要求写回的结果文件。
_Avoid_: 回执、返回值

## Relationships

- 一个 **Issue tracker** 包含多个 **Issues**
- 一个 **Issue** 同一时间携带一个 **Triage role**
- 一个 **Decision ticket** 是 **Issue**（`wayfinder:map` 的 child）
- 一个 **Issue** 在实施中可派出多张 **任务单**（实施、返工、审查）
- 一张 **任务单** 对应一个 **执行者** 和一份 **报告**

## Flagged ambiguities

- “backlog” 过去同时表示托管 issues 的*工具*以及工具里的*工作集合*；已解决：工具称为 **Issue tracker**，“backlog” 不再作为 domain term 使用。
- “backlog backend” / “backlog manager” 已解决：统一收敛为 **Issue tracker**。
- “任务单”曾在 `to-tickets`、`implement` 等技能里指 **Issue**（`to-tickets` 产出的切片），在派工规则里指派单文件；已解决：**任务单** 专指派单文件，切片称 **Issue**。现有技能文本待同步。
