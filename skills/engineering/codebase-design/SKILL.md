---
name: codebase-design
description: 用深模块原则设计接口、选择可替换位置，并提高代码的可测试性和可维护性。仅在用户直接调用，或 improve-codebase-architecture、tdd 等技能的步骤要求加载时使用；不要根据对话内容自行加载。
---

加载条件：仅在用户直接调用本技能，或其他技能的步骤要求加载本技能时继续；否则停止，并提示用户可直接调用 `/codebase-design`。

# 设计深模块

用小 interface 封装大量行为，在清晰的 seam 上暴露接口，并通过接口测试。设计和重构时使用下列术语，让调用方获得 leverage，让维护者获得 locality。

## 统一术语

准确使用这些名称，不随意换成 component、service、API 或 boundary：

| 术语 | 含义 |
| --- | --- |
| Module | 具有 interface 和 implementation 的实体。可以是函数、类、包或跨层切片，不用 unit、component、service 替代。 |
| Interface | 调用方正确使用 module 必须知道的一切：类型签名、不变量、调用顺序、错误方式、配置和性能特征。API 或 signature 的含义不足以覆盖它。 |
| Implementation | module 内部的代码。讨论 seam 上的替换角色时用 adapter，讨论内部代码时用 implementation。 |
| Depth | 调用方或测试每了解一单位 interface，就能使用多少行为。小接口隐藏大量行为时是 deep；接口几乎与实现一样复杂时是 shallow。 |
| Seam | 无需修改当前位置就能改变行为的地方，即 interface 所在的位置。决定位置与决定后面的内容是两件事。该术语来自 Michael Feathers；不使用容易与 DDD bounded context 混淆的 boundary。 |
| Adapter | 在 seam 上满足 interface 的具体对象。它说明所承担的角色，不说明内部代码。小 adapter 可能有大 implementation，如 Postgres 仓储；大 adapter 也可能有小 implementation，如内存替身。 |
| Leverage | 调用方从 depth 获得的收益：学习更少的接口，就能使用更多能力。实现可在 N 个调用点和 M 个测试间复用。 |
| Locality | 维护者从 depth 获得的收益：修改、缺陷、知识和验证集中在一处，修一次即可让所有调用方受益。 |

## 深模块与浅模块

深模块用小接口隐藏复杂实现：

```text
+------------------+
| Small Interface  | -> few methods, simple params
+------------------+
|                  |
| Deep             | -> complex logic hidden
| Implementation   |
|                  |
+------------------+
```

避免接口复杂、实现却很薄的浅模块：

```text
+-------------------------------+
| Large Interface               | -> many methods, complex params
+-------------------------------+
| Thin Implementation           | -> mostly pass-through
+-------------------------------+
```

设计时问：能减少方法吗？能简化参数吗？能把更多复杂度留在内部吗？

## 设计原则

- **按接口衡量 depth**，不按实现体积衡量。内部可以有可模拟、可替换的小部件。module 可以同时有仅供自身测试使用的内部 seam，以及公开 interface 上的外部 seam。
- **删除测试**：想象移除 module。如果复杂度也消失，它只是转发层；如果复杂度散落到多个调用方，它有实际价值。
- **通过接口测试**：调用方和测试经过同一 seam。若测试必须深入内部细节，重新检查模块形状。
- **有真实替换需求才设 seam**：只有一个 adapter 时，seam 仍是假设；存在两个 adapter 时，才有真实替换。

## 让接口易于测试

1. 接收依赖，而不是在内部创建依赖。

   ```typescript
   // Testable
   function processOrder(order, paymentGateway) {}

   // Hard to test
   function processOrder(order) {
     const gateway = new StripeGateway();
   }
   ```

2. 返回结果，而不是直接修改外部状态。

   ```typescript
   // Testable
   function calculateDiscount(cart): Discount {}

   // Hard to test
   function applyDiscount(cart): void {
     cart.total -= discount;
   }
   ```

3. 减少公开方法和参数，降低测试数量与准备成本。

## 概念关系

- 一个 Module 对调用方和测试呈现一个 Interface。
- Depth 是 Module 的属性，通过 Interface 衡量。
- Seam 是 Interface 所在的位置。
- Adapter 位于 Seam 上，并满足 Interface。
- Depth 为调用方带来 Leverage，为维护者带来 Locality。

## 避免误解

- 不把 depth 定义为实现行数与接口行数之比；那会鼓励堆代码。这里以接口带来的能力衡量。
- Interface 不只是 TypeScript 的 `interface` 或类的公开方法，还包括调用方必须知道的其他事实。
- 使用 seam 或 interface，不用可能指代 DDD 上下文的 boundary。

## 进一步设计

- 深化一组有依赖关系的模块时，读 [DEEPENING.md](DEEPENING.md)：依赖分类、seam 原则，以及用新测试替换旧测试而非继续叠加。
- 比较不同接口时，读 [DESIGN-IT-TWICE.md](DESIGN-IT-TWICE.md)：并行设计差异明显的接口，按 depth、locality 和 seam 位置比较。
