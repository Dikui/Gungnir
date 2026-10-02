---
name: to-spec
description: 将当前讨论整理为需求文档，发布到项目 issue tracker。
disable-model-invocation: true
---

根据当前对话和代码库生成需求文档。**不要**访谈用户，只整理已讨论的内容。

使用已有的 tracker 和分流标签配置。缺失时先通过 `/setup-matt-pocock-skills` 配置；调用其他技能须由用户明确指定。

## 流程

1. 如果还没查看仓库，先了解代码库现状。需求文档使用项目领域词汇，并遵守相关 ADR。

2. 列出准备测试此功能的边界。优先使用现有边界，并选择尽可能高层的边界；确需新增时，也尽量放在高层。

边界越少越好，理想情况下只有一个。请用户确认这些边界是否合适。

3. 按下面的模板编写需求文档，并发布到项目 issue tracker。添加 `ready-for-agent` 分流标签，无需再次分流。

<spec-template>

## Problem Statement

从用户视角描述正在遇到的问题。

## Solution

从用户视角描述解决方案。

## User Stories

用编号列出完整的用户故事，覆盖功能的所有方面。每条使用以下格式：

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

## Implementation Decisions

列出已确定的实现决策，例如：

- 要创建或修改的模块
- 要修改的模块接口
- 开发者给出的技术澄清
- 架构决策
- 数据结构变更
- API 契约
- 具体交互

不要写具体文件路径或代码片段，它们可能很快过时。

例外：如果 原型片段能比文字更准确地表达决策（状态机、reducer、schema、类型结构），可以放在相关决策中，并注明来自原型。只保留决策本身，不放完整示例程序。

## Testing Decisions

列出已确定的测试决策，包括：

- 好测试的定义（只测外部行为，不测实现细节）
- 要测试的模块
- 代码库中相似测试的先例

## Out of Scope

列出本需求文档 不包含的事项。

## Further Notes

补充说明。

</spec-template>
