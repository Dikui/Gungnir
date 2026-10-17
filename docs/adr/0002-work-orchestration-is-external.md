# 工作调度归外部调度系统，Gungnir 只提供方法

Gungnir 的技能只规定一件事怎么做好；把一批工作分配给多个 agent、跟踪进度、合并结果，由外部调度系统负责。因此删除 `implement-spec`，不引入 superpowers 的 subagent-driven-development 这类调度技能，跨厂商执行者（Claude、Codex、Grok）的选择与调用也不进 Gungnir。

技能可以为方法需要而派子代理，例如 `diff-review` 分两条线并行审查、`adversarial-review` 需要独立攻击方；判断归属看职责，不看是否派了子代理。

**Considered Options**：参照 [obra/superpowers](https://github.com/obra/superpowers)在 Gungnir 内补调度基础技能、进度账本和返工环。未采纳：外部调度系统已在 runtime 层设计调度，两处各做一套会互相冲突。
