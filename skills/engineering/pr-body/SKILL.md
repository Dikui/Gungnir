---
name: pr-body
description: "编写 PR 正文时使用。"
metadata:
  credits:
    skill: show-me
    author: Dex Horthy
    organisation: Humanlayer
    url: "https://github.com/humanlayer/skills/blob/main/plugins/show-me/skills/show-me/SKILL.md"
---

使用以下模板编写 PR 正文：

```markdown
## Summary

<diagram, diff-sketch, or tree>

## Evidence

- **Before:** <screenshot/output/failing test run>
  **After:** <screenshot/output/passing test run>

## Merge Danger

**Door:** <one-way or two-way>

<optional: description>

**Blast Radius:** <one-word description>

<optional: potential ramifications of merge>
```

## 章节

省略所有开场白，保持文字简短。使用 `GLOSSARY.md` 中用户的领域用语。

### Summary

选择能说明关键点的最小视图。

- 伪代码：展示逻辑或算法。
- 调用树：展示运行时控制流。
- 组件树：展示 UI 结构，包括重要的状态和模块边界。
- 浅层文件树：展示文件职责或大范围重构。
- Mermaid：展示组件交互、控制流或数据流。
- `diff`：重点在于变化、周围结构已存在时使用。让 diff 的形式符合主题（组件、文件布局、调用树或状态）。
- 完整代码块：大部分内容是新增的、省略上下文会隐藏归属或顺序，或用户需要可复制的目标结构时使用。

各种视图的写法示例见 [EXAMPLES.md](EXAMPLES.md)；不确定某种视图怎么画时读取。

#### 指引

将每个图示放在它支持的简短文字旁边。只保留回答用户当前问题，或解决当前讨论所需选项涉及的调用、文件、props、状态和边界。

可以用一种，也可以用几种，通常无需全部使用。根据实际需要判断，不要让用户应接不暇。

### Evidence

提供变更有效的具体证据，展示修改前后对比。

若环境支持截图，且变更涉及视觉效果，截图是 S 级证据。

执行结果是 A 级证据，例如测试结果、控制台输出。贴出同一个测试在修改前失败、修改后通过的实际命令和输出，可只截取关键行。没有运行过的检查不写成证据。

### Merge Danger

说明变更是单向门还是双向门。双向门可以返回，单向门不能。回滚成本低的 PR 风险较低。涉及破坏性操作或难以撤销的决策的变更属于单向门。

影响范围是此 PR 引入的变更可能造成的影响或波及范围。考虑各种可能，例如布局偏移、使用方功能受损、移动端响应式表现等。
