# Engineering

我每天用于代码工作的 skills。

## User-invoked

只有在你显式输入名称时才能调用（Claude Code：`disable-model-invocation: true`；Codex：`agents/openai.yaml` 中的 `policy.allow_implicit_invocation: false`）。

- **[ask-matt](./ask-matt/SKILL.md)** - 询问当前情境适合哪个 skill 或 flow；它是本仓库 user-invoked skills 的 router。
- **[canvas](./canvas/SKILL.md)** - 根据需求、边界和测试场景共创产品框架图，支持人工与 AI 协同调整，并导出 Markdown 供设计任务按需参考。完整插件自带 Canvas MCP，按项目加载并保存 Markdown。
- **[grill-with-docs](./grill-with-docs/SKILL.md)** - 追问式访谈，同时构建项目的 domain model、打磨术语，并内联更新 `GLOSSARY.md` 与 ADRs。
- **[triage](./triage/SKILL.md)** - 通过 triage roles state machine 推进 issues。
- **[improve-codebase-architecture](./improve-codebase-architecture/SKILL.md)** - 扫描 codebase 中的 deepening opportunities，生成可视化 HTML report，然后围绕你选中的候选项继续 grilling。
- **[setup-matt-pocock-skills](./setup-matt-pocock-skills/SKILL.md)** - 为 engineering skills 配置本仓库需要的 issue tracker、triage labels 与 domain docs 布局。每个 repo 运行一次。
- **[to-spec](./to-spec/SKILL.md)** - 把当前对话整理成 spec 并发布到 issue tracker。
- **[to-tickets](./to-tickets/SKILL.md)** - 把 plan、spec 或 conversation 拆成 tracer-bullet tickets，每个 ticket 声明 blocking edges——本地文件中用文本表示，真实 tracker 上用 native blocking links。
- **[implement](./implement/SKILL.md)** - 基于 spec 或 ticket 集合实现一段工作，在预先认可的 seams 上驱动 `/tdd`，并在提交前以 `/code-review` 收尾。
- **[implement-spec](./implement-spec/SKILL.md)** - 按任务依赖图并行实现整份需求，各任务在独立 worktree 中实施，汇入同一集成分支。配套测试和审查技能须由用户明确指定。
- **[wayfinder](./wayfinder/SKILL.md)** - 把超出单个 agent session 的大块工作规划成 issue tracker 上的 decision tickets 共享 map，逐一解决直到通往 destination 的路清晰。

- **[prototype](./prototype/SKILL.md)** - 构建 throwaway prototype 来回答一个 design 问题：可以是回答 state/logic 问题的可运行终端 app，也可以是多个可切换的 UI 变体。

- **[diagnosing-bugs](./diagnosing-bugs/SKILL.md)** - 面向棘手 bug 和性能回退的纪律化诊断循环：reproduce -> minimise -> hypothesise -> instrument -> fix -> regression-test。
- **[research](./research/SKILL.md)** - 对照高可信 primary sources 调研问题，并把带引用的 findings 保存为 repo 中的 Markdown 文件，作为 background agent 运行。
- **[tdd](./tdd/SKILL.md)** - 使用 red-green-refactor 循环做 test-driven development；一次一个 vertical slice 地构建功能或修复 bug。
- **[domain-modeling](./domain-modeling/SKILL.md)** - 主动构建和打磨项目的 domain model：挑战术语、用场景做压力测试，并内联更新 `GLOSSARY.md` 与 ADRs。
- **[codebase-design](./codebase-design/SKILL.md)** - 用于设计 deep modules 的共享纪律和词汇：小 interface、清晰 seam、通过 interface 测试。
- **[code-review](./code-review/SKILL.md)** - 对固定点之后的 diff 做双轴 review：**Standards**（是否遵循 repo 的编码规范，外加 Fowler smell baseline？）和 **Spec**（是否忠实实现了源头的 issue/PRD？），作为并行 sub-agents 运行。
- **[pr](./pr/SKILL.md)** - 用最小图示、前后验证证据、可回退性和影响范围撰写 PR 正文。
- **[retro](./retro/SKILL.md)** - 复盘开发会话，按严重程度提出导航、自动检查、编码规范、工具和信息访问改进。
- **[wizard](./wizard/SKILL.md)** - 生成交互式 bash wizard，引导人完成只有他们能执行的步骤：provisioning 基础设施、设置 credentials 或 CI secrets、走查不熟悉的第三方 dashboard，或运行一次性 migration 或 cutover。
