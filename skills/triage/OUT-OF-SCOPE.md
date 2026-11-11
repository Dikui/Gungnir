# 拒绝记录库

仓库中的 `.out-of-scope/` 目录长期保存被拒绝的功能请求。它有两个用途：

1. **保留理由**：记录某个功能为什么被拒绝，避免 issue 关闭后理由丢失。
2. **去重**：新 issue 与以前的拒绝相同时，可以指出当时的决定，不必重新争论。

## 目录结构

```
.out-of-scope/
├── dark-mode.md
├── plugin-system.md
└── graphql-api.md
```

每个**概念**一个文件，不是每个 issue 一个文件。请求同一件事的多个 issue 归入同一个文件。

## 文件格式

用易读的风格书写，像一篇短设计说明，不像数据库条目。使用段落、代码片段和例子，让第一次看到的人也能理解理由。示例为英文；实际书写时使用该仓库的语言。

```markdown
# Dark Mode

This project does not support dark mode or user-facing theming.

## Why this is out of scope

The rendering pipeline assumes a single color palette defined in
`ThemeConfig`. Supporting multiple themes would require:

- A theme context provider wrapping the entire component tree
- Per-component theme-aware style resolution
- A persistence layer for user theme preferences

This is a significant architectural change that doesn't align with the
project's focus on content authoring. Theming is a concern for downstream
consumers who embed or redistribute the output.

```ts
// The current ThemeConfig interface is not designed for runtime switching:
interface ThemeConfig {
  colors: ColorPalette; // single palette, resolved at build time
  fonts: FontStack;
}
```

## Prior requests

- #42 — "Add dark mode support"
- #87 — "Night theme for accessibility"
- #134 — "Dark theme option"
```

### 文件命名

用简短、能说明概念的 kebab-case 名称：`dark-mode.md`、`plugin-system.md`、`graphql-api.md`。浏览目录的人不打开文件就应该知道被拒绝的是什么。

### 写理由

理由要有实质内容：不写“我们不想要这个”，要写为什么。好的理由会引用：

- 项目范围或理念（“本项目专注于 X，主题定制由下游处理”）。
- 技术约束（“支持它需要 Y，与现有的 Z 架构冲突”）。
- 策略决定（“我们选择 A 而不是 B，因为……”）。

理由应长期成立。不引用临时情况（“现在太忙”）：那是延期，不是拒绝。

## 何时检查 `.out-of-scope/`

分流时在“读取上下文”一步读取 `.out-of-scope/` 中的所有文件。评估新 issue 时：

- 检查请求是否与已有的拒绝记录相同。
- 按概念是否相同判断，不按关键词；“night theme” 与 `dark-mode.md` 相同。
- 相同时向维护者指出：这与 `.out-of-scope/dark-mode.md` 相似，当时拒绝的理由是什么，现在是否仍这样决定。

维护者可能：

- **确认**：把新 issue 加入该文件的 “Prior requests” 列表，然后关闭。
- **重新考虑**：删除或更新该文件，issue 走正常分流。
- **不认为相同**：两者相关但不同，继续正常分流。

## 何时写入 `.out-of-scope/`

只有**改进请求**（不是缺陷）被*拒绝*为 `wontfix` 时才写。改进类 PR 同样适用：被拒绝的 PR 记在这里，同样的请求就不会以新代码的形式再次出现。

因为**已经实现**而以 `wontfix` 关闭的请求**不**写在这里。那是已有的功能，不是被拒绝的功能；记进来会让去重检查出错。关闭评论应指出该功能在哪里。

流程：

1. 维护者决定某个功能请求不在范围内。
2. 检查是否已有相同概念的 `.out-of-scope/` 文件。
3. 已有：把新 issue 追加到 “Prior requests” 列表。
4. 没有：创建新文件，写入概念名、决定、理由和第一条请求。
5. 在 issue 上发布评论，说明决定并提到该文件。
6. 加 `wontfix` 标签并关闭 issue。

## 更新或删除拒绝记录

维护者改变了对某个已拒绝概念的看法时：

- 删除对应的 `.out-of-scope/` 文件。
- 不必重新打开旧 issue，它们是历史记录。
- 触发重新考虑的新 issue 走正常分流。
