## 功能

`retro` 回顾一次编码[会话](https://www.aihero.dev/ai-coding-dictionary/session)，提出代理**[环境](https://www.aihero.dev/ai-coding-dictionary/environment)**的改进建议，让下次运行更顺利。它读取会话自身的记录（默认当前会话，也可指定会话日志），寻找代理遇到困难的时刻，并按严重程度列出候选修复。

它关注环境，而非代码。代理交付的 bug、花了二十次[工具调用](https://www.aihero.dev/ai-coding-dictionary/tool-call)才找到的文件、审查者遗漏的规则：`retro` 都不会直接修复。它询问仓库哪些条件让问题发生，并提出防止重演的检查、指针或标准。它也只提出建议；你选定候选项之前，什么都不会改变。

## 何时使用

输入 `/retro` 手动调用，代理不会自行选择它。

在一次比预期困难的会话结束后使用：代理找东西花了太久、犯了机器本可发现的错误，或需要无法获取的信息。顺利的会话能带来的经验不多；困难的会话才容易产生发现。若需要判断会话产出的代码，请由用户调用 [code-review](https://aihero.dev/skills-code-review)。其他技能引用仅表示流程依赖，详见[调用规则](../invocation.md)。

## 发现应放在哪里

每个候选项属于一个类别，类别决定修复的位置：

| 会话中发生的问题 | 修复方式 |
| --- | --- |
| 代理花了很久才找到文件或事实 | 从它已经读取的文件添加**导航指针** |
| 犯了工具本可发现的错误 | **[自动检查](https://www.aihero.dev/ai-coding-dictionary/automated-check)**：lint 规则、类型、测试、pre-commit hook、CI 任务 |
| 审查者遗漏了需要判断的错误 | 在 `CODING_STANDARDS.md` 中给审查代理增加规则 |
| `AGENTS.md` 或 `CLAUDE.md` 很大 | 将引导内容移到标准或检查中 |
| 工具调用成本相对返回内容过高 | 精简或替换工具 |
| 引导文件充满不改变行为的内容 | 删除**无效指令** |
| 代理需要的信息无法访问 | 扩大访问范围：将开发服务器日志同时写入文件，提供服务的只读访问 |

核心是标准属于**审查者**，而非实现者。实现代理承受最大的上下文压力：它探索、写代码、调试失败。审查代理只收到 diff。因此新规则应放到有余力执行的审查阶段，不能放入 [AGENTS.md](https://www.aihero.dev/ai-coding-dictionary/agents-md)；后者无论是否相关，都会进入每个会话的[上下文窗口](https://www.aihero.dev/ai-coding-dictionary/context-window)。

编写规则之前，先对违规分类。**机械性**违规（禁用 API、导入形式、文件位置规则）使用确定性检查，因为检查会失败，标准文件中的一句话不会。只有 linter 无法执行、真正需要判断的事项才成为文字。仓库完全没有防护机制（没有 pre-commit hook，也没有运行 lint、类型检查和测试的 CI 任务）本身也要作为一项发现报告。

## 常见问题

**它会自行写 lint 规则，还是等待同意？能让它在每次会话后运行吗？**

它会等待。`retro` 只提出建议；你选定候选项前，什么都不会改变，因此不会直接编辑，也不会自动应用 hook。这是有意的：一位用户曾“被阻止正确变更的自动 hook 坑过”，因此提出这一要求。判断什么值得成为永久检查需要人的判断，所以技能保持[人在回路中](https://www.aihero.dev/ai-coding-dictionary/human-in-the-loop)，且由用户调用。有些用户确实在每次实现后接着调用它，但顺利会话能带来的经验不多，每次都运行主要会产生无人需要的规则。没有 dry-run 模式：建议的检查像其他代码一样构建，在让它阻止合并前，先在仓库中试运行。

**它会不会永远堆积 lint 规则？会建议删除吗？**

部分会，这是它最薄弱的地方。删除方面只覆盖文字：引导文件中的无效指令，以及 `AGENTS.md` 或 `CLAUDE.md` 中本应放到标准或检查中的引导。文件较大时，它会根据正在读取的会话将这些内容标记为删除候选；应将每项视为需要验证是否能删除的候选，而非定论。它不会审计上个月建议的 lint 规则、hook 或 CI 任务。它只看到一个会话，无法判断规则已产生噪声，或当初的 bug 已不再需要它。清理检查仍由你负责；规则不断对正确代码报警，就是信号。

**它会不会为了填满分类而编造泛泛建议？**

这是它收到的最尖锐批评。一位用户发现：“任务完成后，AI 往往忘记会话中途的困难，并编造通用建议来填满复盘分类。”应对方式是每个候选项必须来自会话自己的记录，使建议针对这次会话。这也有两面：它很少凭空生成无关内容，但可能过度关注这次会话碰巧涉及的内容。无法追溯到具体时刻的候选项应丢弃。严重程度排序也只当作初稿：安静但高成本的错误可能排在明显但低成本的错误后面。

**会话很长，现在运行，还是重新开始？**

默认审查当前会话，这通常最好，因为遇到的困难仍在上下文窗口中。若会话已离开[智能区间](https://www.aihero.dev/ai-coding-dictionary/smart-zone)，请[清空上下文](https://www.aihero.dev/ai-coding-dictionary/clearing)，在新会话中输入 `/retro`，指向日志中的上一次会话。

**代理反复犯同样的错误，是否应往 `CLAUDE.md` 加一句？**

通常不应该，这是 `retro` 最常反对的做法。`CLAUDE.md` 中的一句话会加载到每个会话，稀释文件中的其他内容，并随代码变化而过时。机械性错误应使用会失败的检查。需要判断的错误应进入审查者读取的编码规范。`AGENTS.md` 和 `CLAUDE.md` 主要用于导航指针，少放其他内容。同理，`retro` 不是[记忆系统](https://www.aihero.dev/ai-coding-dictionary/memory-system)：它不存储发生过什么，而是建议改变环境，让同样的问题不再发生。

**我的配置提到 `CODING_STANDARDS.md`，但我没有，哪里来？**

没有工具预先提供该文件。会话首次发现审查者需要判断的规则时，`retro` 会建议创建。你接受后，用户调用 [code-review](https://aihero.dev/skills-code-review) 时就会读取它。已有的其他标准文档，例如 `CONTRIBUTING.md`，也可以发挥同样作用。

**它与 `improve-codebase-architecture` 有何不同？**

输入不同。[improve-codebase-architecture](https://aihero.dev/skills-improve-codebase-architecture) 只需要代码，寻找代码结构的改进。`retro` 需要会话历史，改进代理工作的环境，而非代码。两者并列，互不替代。

## 生效标志

- 每个候选项都指向会话中的具体时刻，而非通用最佳实践。
- 重复错误转化为会失败的检查，`AGENTS.md` 随时间变短，而非变长。
- 已存在但未接入的检查被识别为发现，而非建议重新构建。
- 下次执行同类任务时，会话更快找到方向。

## 所处位置

`retro` 是主流程的最后一步，让流程回顾自身：

```txt
grill-with-docs → to-spec → to-tickets → implement → code-review → retro
```

在一次值得学习的构建后运行，可以在同一会话，也可指向该会话日志。顺利的构建可以跳过。

- [code-review](https://aihero.dev/skills-code-review) 是 `retro` 最常建议调整的审查代理：新增编码规范放在它的 Standards 维度读取的位置。
- [writing-for-agents](https://aihero.dev/skills-writing-for-agents) 为 `retro` 建议的引导文件和技能提供写作风格。只有用户同时明确指定它时，`retro` 才在开始前调用。

不确定当前情况适合哪个技能时，[ask-matt](https://aihero.dev/skills-ask-matt) 可帮助选择整套技能中的流程。
