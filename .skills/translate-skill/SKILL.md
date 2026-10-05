---
name: translate-skill
description: 将 mattpocock/skills 的说明翻译、刷新或复核为简体中文，保留命令、路径和其他影响行为的内容。
disable-model-invocation: true
---

# 翻译与刷新技能内容

将上游 `mattpocock/skills` 的内容本地化到 `vinvcn/mattpocock-skills-zh-CN`。目标仓库是独立的简体中文版本：只同步内容，不同步 Git 历史或上游仓库管理元数据。

## 翻译范围

翻译面向用户、代理和维护者的自然语言说明，包括：

- README、文档和技能正文。
- 技能简介及 frontmatter 中的提示语。
- 以文字说明写成的示例。

以下内容原样保留：

- 目录名、技能名、斜杠命令、CLI 命令、代码块和行内代码。
- 文件路径、包名、工具及 API 标识、环境变量名。
- frontmatter 及 JSON/YAML/TOML 的键。
- Markdown 链接目标和影响行为的标签。

保留 Markdown 结构、标题层级、列表嵌套、表格、相对路径和代码围栏。

## 安装路径

在指导用户安装或使用本地化版本的命令或说明中，将仓库路径：

```text
mattpocock/skills
```

替换为：

```text
vinvcn/mattpocock-skills-zh-CN
```

其他位置不做此替换，并保留上游项目署名。

## Frontmatter

键保持不变。按值的实际含义判断是否翻译：

- `name` 保持不变。
- `description`、`argument-hint` 等自然语言说明译为简体中文。
- 标识、命令、路径、包名、URL、工具名、布尔值、数字和其他配置值保持不变。
- 自然语言值中嵌入的斜杠命令、行内代码、占位符和其他影响行为的片段保持不变。
- 无法确定时标记待复核，不猜测。

示例：

```yaml
---
name: teach
description: 在这个工作区中教用户一个新技能或概念。
disable-model-invocation: true
argument-hint: "你想学习什么？"
---
```

## 语言要求

使用自然、简洁、准确的简体中文，与仓库现有语气一致。常见工程术语可以保留英文；翻译会降低准确性时，保留原词。

## 翻译单个文件

1. 确定文件路径和类型，区分自然语言、混合内容、配置与不可翻译内容。
2. 标记需要原样保留的片段。
3. 只翻译自然语言，并原样放回受保护的片段。
4. 对照原文检查命令、代码块、路径、URL、标识和 frontmatter 键。
5. 确认本地化安装命令使用 `vinvcn/mattpocock-skills-zh-CN`。
6. 返回文件内容或补丁，并列出待复核事项。

## 刷新整个仓库

1. 将上游视为内容来源，不合并其 Git 历史。
2. 列出新增、修改和移除的内容文件。
3. 翻译新增或修改文件中的自然语言。
4. 只复制或保留本次范围内的非翻译支持文件。
5. 保留本地化 README 的定位和安装路径。
6. 完成下一节的验证，将简短结果写入顶层 README，不粘贴完整命令输出。
7. 更新 README 同步记录，注明翻译执行者和翻译策略。
8. 将含义不明的文件、被移除的文件和风险改动交给维护者复核。
9. 总结翻译、复制、保留、移除和跳过的文件，以及验证结果和待复核事项。

## 验证步骤

每次上游内容刷新后，完成并记录：

1. 运行 `node scripts/check-translation.mjs`，检查 Markdown、frontmatter、README 安装路径和许可证约束。
2. 核对公开索引：`engineering/`、`productivity/`、`misc/` 中的技能须同时出现在顶层 `README.md` 和 `.claude-plugin/plugin.json`。`personal/`、`in-progress/`、`deprecated/` 中的技能不得出现在这两个公开索引中。
3. 对比 `upstream/main` 中本次范围内的文件清单，确认没有漏掉上游文件，也没有保留上游已移除且本地策略不需要的文件。
4. 对照双方共有的 Markdown 文件，确认 frontmatter 键和 `name` 不变、代码围栏成对、路径和命令等行为关键内容没有误改。
5. 运行 `git diff --check` 和 `git diff --cached --check`。
6. 确认 README 同步记录包含最新上游短 SHA 和本地同步提交号，没有遗留“待定”占位。
7. 检查过时的安装地址和路径，包括上游安装地址、旧中文仓库短路径、已移除的 triage 技能名及旧 domain-model 相对路径。
8. 运行 `node scripts/audit-english.mjs`，逐项人工复核结果。合理的英文术语、命令、示例和标识不算失败；该脚本只提供复核线索。

## README 同步记录

每次刷新在顶层 README 增加一条简短记录，包含：

- 日期，格式为 `YYYY-MM-DD`。
- 上游版本，通常写为 `mattpocock/skills@<short-sha>`。
- 本地同步提交号；尚未提交时可暂写待定，提交后必须替换。
- 一句话概括用户可见的变化。

详细流程留在本技能中，README 只链接到这里。示例：

```text
- 2026-05-09: Synced upstream `mattpocock/skills@733d312`, local commit `c9fe120`. Added Chinese translations for `prototype` and `in-progress` content, and refreshed public skill indexes.
```

## 复核输出格式

复核翻译刷新时，按以下格式报告：

```text
Changed files:
- ...

Translated files:
- ...

Copied or preserved files:
- ...

Removed or stale files:
- ...

Review flags:
- ...

README sync log:
- ...

验证结果:
- ...

Invariant checks:
- install commands point to vinvcn/mattpocock-skills-zh-CN
- code blocks preserved
- frontmatter keys preserved
- paths and identifiers preserved
- Markdown structure preserved
```

## 不确定时

无法确定某段文字是否影响行为时，原样保留并标记待复核。不得擅自改动可能影响安装、技能发现、命令执行、文件引用、API 调用、工具使用或代理行为的内容。
