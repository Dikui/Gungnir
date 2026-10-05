---
name: improve-codebase-architecture
description: 查找可用小接口封装复杂行为的模块，生成可视化架构报告，再与用户讨论选中的方案。
disable-model-invocation: true
---

# 改进代码架构

查找难以理解、修改或测试的结构，提出将浅模块改为深模块的方案，提高可测试性和代理浏览代码的效率。

领域术语沿用 `GLOSSARY.md`，尊重 `docs/adr/` 中的既有决策。架构术语和原则沿用 `/codebase-design`：module、interface、depth、seam、adapter、leverage、locality，以及删除测试、通过接口测试、有真实替换需求才设置 seam 等原则。不要随意改称 component、service、API 或 boundary。

文中其他技能仅在用户明确指定后调用，见[调用规则](../../../docs/invocation.md)。

## 1. 确定范围并探索

优先检查仍在变化的代码区域，避免为假设中的需求改架构：

- 用户指定模块、子系统或问题时，按指定范围探索。
- 未指定时，查看足够长的 `git log --oneline`，找出反复修改的文件和区域。没有明显热点时再扩大范围。

先读取 `GLOSSARY.md` 和相关 ADR，再派一个子代理浏览代码。自然探索，不机械套规则，重点观察：

- 理解一个概念是否需要跳转许多小模块？
- 哪些接口几乎与实现一样复杂？
- 是否抽出了便于测试的纯函数，但真正缺陷藏在调用关系中，缺乏 locality？
- 紧密耦合的模块是否向 seam 之外泄漏内部细节？
- 哪些部分没有测试，或难以通过当前接口测试？

对疑似浅模块使用删除测试：删除它会集中复杂度，还是只把复杂度转移？优先考虑删除后能集中复杂度的候选。

## 2. 生成 HTML 报告

将独立 HTML 文件写入操作系统临时目录，不写进仓库。读取 `$TMPDIR`，缺失时使用 `/tmp`，Windows 使用 `%TEMP%`。文件名为 `<tmpdir>/architecture-review-<timestamp>.html`，每次运行创建新文件。

向用户说明绝对路径并打开报告：Linux 用 `xdg-open <path>`，macOS 用 `open <path>`，Windows 用 `start <path>`。

使用 CDN 提供的 Tailwind 排版。调用关系、依赖和时序用 CDN 提供的 Mermaid 绘制；剖面、体量或折叠动画等表达可使用手写 HTML/CSS/SVG。每个候选必须有修改前后的对照图。

每张候选卡片包含：

- **Files**：涉及的文件和模块。
- **Problem**：当前结构造成什么问题。
- **Solution**：用直白英文说明拟议变更。
- **Benefits**：以 locality、leverage 和测试改进说明收益。
- **Before / After diagram**：并排展示浅模块与深化后的结构。
- **Recommendation strength**：使用 `Strong`、`Worth exploring` 或 `Speculative` 标签。

末尾用 **Top recommendation** 说明最先建议处理哪个候选及原因。

领域名称使用 `GLOSSARY.md` 的词汇，架构名称使用 `/codebase-design` 的词汇。例如已定义 Order 时，使用 Order intake module，不改称 FooBarHandler 或 Order service。

候选与 ADR 冲突时，只有当前问题确实值得重新讨论该决策，才提出方案，并在卡片中明确说明冲突和理由。不要罗列所有被 ADR 排除的重构。

报告模板、图形和样式见 [HTML-REPORT.md](HTML-REPORT.md)。此阶段不设计具体接口。报告完成后，让用户选择要继续讨论的候选。

## 3. 讨论选中的候选

用户选择后，使用 `/grilling` 讨论约束、依赖、深模块形态、seam 后的内容和可保留的测试。

决策形成时，使用 `/domain-modeling` 同步领域文档：

- 新模块需要 `GLOSSARY.md` 中没有的概念时，补入术语；文件缺失则按需创建。
- 模糊术语已明确时，立即更新 `GLOSSARY.md`。
- 用户因长期有效的关键理由拒绝方案时，提议记录 ADR，避免未来重复推荐。临时或显然的原因无需记录。
- 需要比较不同接口时，使用 `/codebase-design` 的 design-it-twice 并行子代理流程。
