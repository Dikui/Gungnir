# Domain Docs

Engineering skills 探索 codebase 时，应如何消费这个 repo 的 domain documentation。

## Before exploring, read these

- repo 根目录的 **`GLOSSARY.md`**，或
- repo 根目录的 **`GLOSSARY-MAP.md`**（如果存在）— 它指向每个 context 的一个 `GLOSSARY.md`。读取与当前话题相关的每个文件。
- **`docs/adr/`** — 读取与你即将处理区域相关的 ADRs。在 multi-context repos 中，也检查 `src/<context>/docs/adr/` 中的 context-scoped decisions。

如果这些文件不存在，**静默继续**。不要标记缺失；不要提前建议创建。`/domain-modeling` skill（经由 `/grill-with-docs` 和 `/improve-codebase-architecture` 调用）会在 terms 或 decisions 实际被解决时懒创建它们。

## Product architecture (optional)

产品框架图通常位于 `docs/architecture.md`，可由 Canvas 导出；如项目已登记其他路径，沿用该路径。初始化时发现已有图，在本节登记实际文件的相对链接（默认路径在本文件中为 `../architecture.md`）。未发现图时，不生成链接或占位文件，静默继续。

分析模块职责、交互关系、核心流程或结构变更时，按需读取框架图，并结合相关需求、ADR、代码和测试。图是当前设计参考，不表示全部已实现，也不取代这些资料。若当前分析发现冲突，沿用任务自身的反馈流程指出差异，不静默覆盖。

读取图不要求调用 Canvas skill，也不要求连接画布服务。只有用户明确调用时才进入 Canvas 共创；不增加所有 skills 必读、持续检查、固定审查或后台同步流程。

## File structure

Single-context repo（大多数 repos）：

```
/
├── GLOSSARY.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

Multi-context repo（根目录存在 `GLOSSARY-MAP.md`）：

```
/
├── GLOSSARY-MAP.md
├── docs/adr/                          ← system-wide decisions
└── src/
    ├── ordering/
    │   ├── GLOSSARY.md
    │   └── docs/adr/                  ← context-specific decisions
    └── billing/
        ├── GLOSSARY.md
        └── docs/adr/
```

## Use the glossary's vocabulary

当你的输出命名某个 domain concept 时（issue title、refactor proposal、hypothesis、test name），使用 `GLOSSARY.md` 中定义的 term。不要漂移到 glossary 明确避免的 synonyms。

如果你需要的概念还不在 glossary 中，这是一个信号：要么你正在发明项目没有使用的语言（重新考虑），要么确实存在缺口（为 `/domain-modeling` 记录）。

## Flag ADR conflicts

如果你的输出与现有 ADR 矛盾，明确指出，而不是静默覆盖：

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
