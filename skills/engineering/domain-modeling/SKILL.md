---
name: domain-modeling
description: 维护项目的领域术语和模型，并记录重要架构决策。
disable-model-invocation: true
---

# 领域建模

设计时主动维护领域模型：澄清术语、用边界场景检验概念，并及时把结论写入词汇表或 ADR。读取 `CONTEXT.md` 只是查词；本技能 用于修改模型。

## 文件结构

多数仓库只有一个上下文：

```text
/
|- CONTEXT.md
|- docs/
|  `- adr/
|     |- 0001-event-sourced-orders.md
|     `- 0002-postgres-for-write-model.md
`- src/
```

如果仓库根目录有 `CONTEXT-MAP.md`，说明仓库有多个上下文；该文件会列出各上下文 的位置：

```text
/
|- CONTEXT-MAP.md
|- docs/
|  `- adr/                          -> system-wide decisions
`- src/
   |- ordering/
   |  |- CONTEXT.md
   |  `- docs/adr/                  -> context-specific decisions
   `- billing/
      |- CONTEXT.md
      `- docs/adr/
```

只在有内容要写时创建文件：解决第一个术语时创建 `CONTEXT.md`；需要记录第一个 ADR 时创建 `docs/adr/`。

## 建模过程

### 对照词汇表

如果用户用词与 `CONTEXT.md` 冲突，立即指出，例如：“词汇表把 cancellation 定义为 X，但你似乎在说 Y，应该采用哪一个？”

### 澄清模糊术语

遇到模糊或含义过多的术语时，提出明确的规范术语，例如：“account 指 Customer 还是 User？两者并不相同。”

### 用具体场景检验

讨论领域关系时，用具体场景检验边界案例，帮助用户明确概念之间的边界。

### 核对代码

用户描述系统行为时，核对代码；发现矛盾就指出，例如：“代码会取消整个订单，但你说可以部分取消，哪一种才是预期？”

### 及时更新 CONTEXT.md

术语一经确认就更新 `CONTEXT.md`，不要留到最后批量处理。遵循 [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md) 的格式。

`CONTEXT.md` 只能包含领域术语，不得记录实现细节。不要用它保存需求文档、草稿或实现决策。

### 谨慎提出 ADR

只有以下三项全部成立时，才建议创建 ADR：

1. **难以逆转**：后续改变决策会有明显成本。
2. **需要解释**：未来读者会疑惑为什么这样设计。
3. **经过真实取舍**：存在替代方案，并基于具体理由作出了选择。

缺少任一项就不建 ADR。遵循 [ADR-FORMAT.md](./ADR-FORMAT.md) 的格式。
