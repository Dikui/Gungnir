# 深化模块

在依赖已知的情况下，安全地深化一组浅模块。本文件沿用 [SKILL.md](SKILL.md) 的术语：**module**、**interface**、**seam**、**adapter**。

## 依赖分类

评估要深化的候选时，先给它的依赖分类。类别决定深化后的 module 如何跨 seam 测试。

### 1. In-process

纯计算、内存状态、没有 I/O。总是可以深化：合并 module，直接通过新 interface 测试。不需要 adapter。

### 2. Local-substitutable

有本地测试替身的依赖（如替代 Postgres 的 PGLite、内存文件系统）。有替身就可以深化。深化后的 module 在测试中带着替身一起测。这个 seam 在内部，module 的对外 interface 上不需要 port。

### 3. Remote but owned（Ports & Adapters）

自己拥有的跨网络服务（微服务、内部 API）。在 seam 上定义 **port**（一个 interface）。deep module 拥有逻辑，传输方式作为 **adapter** 注入。测试用内存 adapter，生产用 HTTP、gRPC 或队列 adapter。

推荐的形态：在 seam 上定义 port，生产用 HTTP adapter 实现，测试用内存 adapter 实现；这样逻辑虽然跨网络部署，仍集中在一个 deep module 里。

### 4. True external（Mock）

自己无法控制的第三方服务（Stripe、Twilio 等）。深化后的 module 把这个外部依赖作为注入的 port；测试提供 mock adapter。

## Seam 的原则

- **一个 adapter 说明 seam 只是假设，两个 adapter 才是真实的 seam。** 至少有两个 adapter 合理存在（通常是生产和测试各一个）时，才引入 port。只有一个 adapter 的 seam 只是多一层间接。
- **内部 seam 与外部 seam。** deep module 可以有内部 seam（implementation 私有，供自身测试使用），也可以有 interface 上的外部 seam。不要因为测试用到内部 seam，就把它暴露到 interface 上。

## 测试策略：替换，不叠加

- 深化后的 module 在 interface 上有了测试，旧浅模块的单元测试就成了多余，删除它们。
- 新测试写在深化后 module 的 interface 上。**interface 就是测试面。**
- 测试通过 interface 断言可观察的结果，不断言内部状态。
- 测试应在内部重构后仍然通过：它描述行为，不描述实现。实现一改测试就得改，说明测试越过了 interface。
