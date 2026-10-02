---
name: to-tickets
description: 将计划、需求文档或当前讨论拆成可独立验证的任务，注明依赖后发布到项目 tracker。
disable-model-invocation: true
---

# 拆分任务

将工作拆成贯通各层、可独立验证的任务单，每项都注明开始前必须完成的任务。

使用项目已有的 tracker 和分流标签配置。缺失时先通过 `/setup-matt-pocock-skills` 配置；该技能须由用户明确指定后调用。

## 1. 收集上下文

使用当前对话已有的信息。用户提供需求文档路径、issue 编号或 URL 时，完整读取正文和评论。

尚未探索代码库时，先了解现状。任务标题和说明使用领域词汇，遵守相关 ADR。寻找能让后续实现更容易的预先重构，并先完成这些重构。

## 2. 拆分可验证的任务

每个纵向切片（tracer bullet）应满足：

- 贯通 schema、API、UI、测试等各层，形成窄而完整的路径，不按单一技术层拆分。
- 完成后可独立演示或验证。
- 规模能放入一次新会话的上下文。
- 列出开始前必须完成的任务；没有依赖的任务可以立即开始。

### 大范围机械重构的例外

列重命名、共享类型替换等改动可能同时破坏大量调用方，无法让每个纵向切片独立通过检查。此时按 expand–contract 顺序拆分：

1. **扩展**：保留旧形式，增加新形式，保持现有功能正常。
2. **迁移**：按包、目录等影响范围分批迁移，每批一个任务，依赖扩展任务。保留旧形式，使每批 CI 均能通过。
3. **收缩**：所有调用方迁移后，用一个依赖全部迁移任务的收尾任务删除旧形式。

如果连单独批次也无法通过检查，仍保持这个顺序，但让各批共享集成分支。所有批次都作为最后“集成并验证”任务的前置条件，只在最后要求整体通过。

## 3. 请用户确认拆分

用编号列表展示，每项包含：

- **Title**：简短名称。
- **Blocked by**：前置任务，没有则说明无依赖。
- **What it delivers**：从用户角度说明打通的完整行为。

询问粒度是否合适、依赖是否必要且正确，以及哪些任务需合并或继续拆分。根据回答调整，直到用户批准。

## 4. 发布已批准的任务

按前置任务优先的顺序发布：

- **本地文件**：每项保存到 `.scratch/<feature-slug>/issues/<NN>-<slug>.md`，从 `01` 开始编号。每个文件只含一项任务，`Blocked by` 写明前置任务编号和标题，不合并成一个大文件。
- **远程 tracker**：每项创建一个 issue。支持时使用原生依赖或子 issue 关系，否则在 `Blocked by` 中引用前置 issue。除非另有指示，应用 `ready-for-agent` 标签。

后续处理前置任务均已完成的任务；线性依赖链按顺序推进。不要关闭或修改任何父 issue。

### 本地任务模板

<local-ticket-template>

# <NN> — <Ticket title>

**What to build:** 从用户视角说明本任务打通的完整行为，不按技术层罗列实现。

**Blocked by:** 前置任务的编号和标题，或 “None — can start immediately”。

**Status:** ready-for-agent

- [ ] Acceptance criterion 1
- [ ] Acceptance criterion 2

</local-ticket-template>

### 远程任务模板

<issue-template>

## Parent

来源是已有 issue 时，引用父 issue；否则省略本节。

## What to build

从用户视角说明本任务打通的完整行为，不按技术层罗列实现。

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Blocked by

- 前置任务的引用，或 “None — can start immediately”。

</issue-template>

两种形式都避免写入易过时的具体文件路径和代码。例外：原型中的状态机、reducer、schema 或类型结构比文字更准确时，可保留表达决策的片段，并注明来自原型，不放入完整演示程序。
