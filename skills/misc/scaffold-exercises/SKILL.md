---
name: scaffold-exercises
description: 按课程计划创建章节、练习和说明文件，通过练习目录检查后提交。
disable-model-invocation: true
---

# 创建练习目录

创建练习目录，通过 `pnpm ai-hero-cli internal lint` 检查后，用 `git commit` 提交。

## 目录命名

- **章节**：`exercises/` 下的 `XX-section-name/`，例如 `01-retrieval-skill-building`。
- **练习**：章节下的 `XX.YY-exercise-name/`，例如 `01.03-retrieval-with-bm25`。
- 章节编号为 `XX`，练习编号为 `XX.YY`。名称使用小写字母和连字符。

## 练习类型

练习可包含以下子目录：

- `problem/`：学生作答区，包含 TODO。
- `solution/`：参考实现。
- `explainer/`：概念讲解，不含 TODO。

创建初始目录时，默认使用 `explainer/`，除非计划指定其他类型。每个练习至少需要 `problem/`、`explainer/` 或 `explainer.1/` 之一。

## 必需文件

每个子目录（`problem/`、`solution/`、`explainer/`）都需要非空的 `readme.md`，且链接有效。只有一行真实标题也可以。

新建时，使用最简的标题和说明：

```md
# Exercise Title

Description here
```

含代码的子目录还需提供超过一行的 `main.ts`。初始练习可以只有说明文件。

## 步骤

1. 从计划中提取章节名、练习名和练习类型。
2. 对每个路径执行 `mkdir -p`。
3. 在每个练习类型的子目录中创建带标题的 `readme.md`。
4. 执行 `pnpm ai-hero-cli internal lint`。
5. 修正错误，直到检查通过。

## 检查规则

`pnpm ai-hero-cli internal lint` 检查：

- 每个练习有对应的子目录（`problem/`、`solution/`、`explainer/`）
- 至少存在 `problem/`、`explainer/` 或 `explainer.1/` 之一
- 主要子目录中存在非空 `readme.md`
- 没有 `.gitkeep` 文件
- 没有 `speaker-notes.md` 文件
- 说明文件中没有失效链接
- 说明文件中没有 `pnpm run exercise` 命令
- 除非只有说明文件，否则每个子目录都需要 `main.ts`

## 移动或重命名练习

重新编号或移动练习时：

1. 使用 `git mv` 重命名目录，保留 Git 历史。
2. 更新编号前缀，维持顺序。
3. 重新运行目录检查。

示例：

```bash
git mv exercises/01-retrieval/01.03-embeddings exercises/01-retrieval/01.04-embeddings
```

## 示例：按计划创建初始目录

计划：

```
Section 05: Memory Skill Building
- 05.01 Introduction to Memory
- 05.02 Short-term Memory (explainer + problem + solution)
- 05.03 Long-term Memory
```

创建：

```bash
mkdir -p exercises/05-memory-skill-building/05.01-introduction-to-memory/explainer
mkdir -p exercises/05-memory-skill-building/05.02-short-term-memory/{explainer,problem,solution}
mkdir -p exercises/05-memory-skill-building/05.03-long-term-memory/explainer
```

然后创建说明文件：

```
exercises/05-memory-skill-building/05.01-introduction-to-memory/explainer/readme.md -> "# Introduction to Memory"
exercises/05-memory-skill-building/05.02-short-term-memory/explainer/readme.md -> "# Short-term Memory"
exercises/05-memory-skill-building/05.02-short-term-memory/problem/readme.md -> "# Short-term Memory"
exercises/05-memory-skill-building/05.02-short-term-memory/solution/readme.md -> "# Short-term Memory"
exercises/05-memory-skill-building/05.03-long-term-memory/explainer/readme.md -> "# Long-term Memory"
```
