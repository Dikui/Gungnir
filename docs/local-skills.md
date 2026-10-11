# 本地自有技能

以下技能为本地自有技能，刷新上游内容时不得因上游没有而删除或覆盖。

| 技能 | bucket | 用途 |
| --- | --- | --- |
| [`first-principles`](../skills/productivity/first-principles/SKILL.md) | `productivity/` | 从目标和已验证事实重新推导方案，判断当前方向是否成立。 |
| [`adversarial-review`](../skills/productivity/adversarial-review/SKILL.md) | `productivity/` | 让独立攻击方寻找计划、需求或代码的反例，核实后报告成立的反例。 |
| [`occams-razor`](../skills/productivity/occams-razor/SKILL.md) | `productivity/` | 把方案的每个组成追溯到需求或证据，找出可以删除的部分。 |
| [`ablation`](../skills/engineering/ablation/SKILL.md) | `engineering/` | 逐个去掉机制并测量，确定收益来自哪个机制。 |
| [`cohesion-coupling`](../skills/engineering/cohesion-coupling/SKILL.md) | `engineering/` | 用职责表、依赖图和共同修改记录，诊断模块的内聚与耦合问题。 |

## 本地对上游技能的改动

刷新 [`ask-matt`](../skills/engineering/ask-matt/SKILL.md) 时，保留以下本地新增内容：

- “遇到问题时选方法”一节，包括触发信号表和技能区别说明。
- “从想法到实现”的“明确想法”之后，怀疑方向时先用 `/first-principles` 的提示。
- “从想法到实现”的“需要多次会话”中，用 `/adversarial-review` 审查需求漏洞、用 `/occams-razor` 检查膨胀方案的提示。
- “从想法到实现”的实现流程说明之后，用 `/ablation` 确认多项优化贡献的提示。
- “架构维护与术语”的 `/improve-codebase-architecture` 一条中，先用 `/cohesion-coupling` 获取职责、依赖和共同修改证据的提示。
