# 领域文档

工程技能探索代码时，如何使用本仓库的领域文档。

## 探索前先读

- 仓库根目录的 **`GLOSSARY.md`**；或
- 仓库根目录的 **`GLOSSARY-MAP.md`**（存在时）：它指向每个上下文各自的 `GLOSSARY.md`，读取与当前话题相关的那些。
- **`docs/adr/`**：读取与即将处理的区域相关的 ADR。多上下文仓库中，还要读 `src/<context>/docs/adr/` 中该上下文的决策。

这些文件不存在时，**直接继续**：不报告缺失，也不提前建议创建。`/domain-modeling`（由 `/grill-me` 和 `/improve-codebase-architecture` 加载）会在术语或决策实际确定时创建它们。

## 产品框架图（可选）

产品框架图通常位于 `docs/architecture.md`；如项目已登记其他路径，沿用该路径。初始化时发现已有图，在本节登记实际文件的相对链接（默认路径在本文件中为 `../architecture.md`）。未发现图时，不生成链接或占位文件，静默继续。

分析模块职责、交互关系、核心流程或结构变更时，按需读取框架图，并结合相关需求、ADR、代码和测试。图是当前设计参考，不表示全部已实现，也不取代这些资料。若当前分析发现冲突，沿用任务自身的反馈流程指出差异，不静默覆盖。

不因此增加所有技能必读、持续检查、固定审查或后台同步的流程。

## 文件结构

单上下文仓库（多数仓库）：

```
/
├── GLOSSARY.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

多上下文仓库（根目录有 `GLOSSARY-MAP.md`）：

```
/
├── GLOSSARY-MAP.md
├── docs/adr/                          ← 全系统的决策
└── src/
    ├── ordering/
    │   ├── GLOSSARY.md
    │   └── docs/adr/                  ← 该上下文的决策
    └── billing/
        ├── GLOSSARY.md
        └── docs/adr/
```

这些路径与 `docs/agents/layout.md` 的文档布局一致；项目使用不同目录名时，以该文件登记的实际路径为准。

## 使用词汇表的术语

输出中提到领域概念时（issue 标题、重构提议、假设、测试名），使用 `GLOSSARY.md` 中定义的术语，不换成词汇表明确要求避免的同义词。

需要的概念不在词汇表中时，有两种可能：你在使用项目没有的说法，应重新考虑；或词汇表确实有缺口，记下来交给 `/domain-modeling`。

## 指出与 ADR 的冲突

输出与已有 ADR 矛盾时，明确指出，不要不加说明地覆盖：

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
