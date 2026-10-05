## 功能

`implement-spec` 接收一份[需求文档](https://www.aihero.dev/ai-coding-dictionary/spec)及其[任务单](https://www.aihero.dev/ai-coding-dictionary/ticket)，在一次运行中完成全部实现。负责协调的[代理](https://www.aihero.dev/ai-coding-dictionary/agent)将每张任务单交给一个实施[子代理](https://www.aihero.dev/ai-coding-dictionary/subagent)，各自在独立的 git worktree 中工作，将完成的分支合并到一个**集成分支**，在用户同时明确指定 [code-review](https://aihero.dev/skills-code-review) 时审查结果，并完成任务单。其他技能引用仅表示流程依赖，详见[调用规则](../invocation.md)。

它将任务单视为**任务依赖图**，而非列表。阻塞关系决定哪些工作可以开始，因此始终有一组阻塞项均已合并的任务单，构成**待执行集合**，待执行集合上的所有任务单同时运行。这与逐张处理任务单不同：决定进度的是图的形状，而非跟踪器中的排列顺序。

## 何时使用

输入 `/implement-spec` 手动调用，代理不会自行选择它。

| 你的情况 | 使用 |
| --- | --- |
| 需求文档已拆为带阻塞关系的任务单，希望一次完成 | `/implement-spec` |
| 在自己的[上下文窗口](https://www.aihero.dev/ai-coding-dictionary/context-window)中逐张处理任务单，每张之间[清空上下文](https://www.aihero.dev/ai-coding-dictionary/clearing) | [implement](https://aihero.dev/skills-implement) |
| 需求文档尚未拆为任务单 | 先由用户调用 [to-tickets](https://aihero.dev/skills-to-tickets) |
| 小规模工作，没有真正的任务依赖图 | 直接由用户调用 [implement](https://aihero.dev/skills-implement) |

## 前提条件

- **issue tracker。** 技能从 [setup-matt-pocock-skills](https://aihero.dev/skills-setup-matt-pocock-skills) 配置的跟踪器读取并完成任务单。若尚未配置，它会停止并要求你先运行该技能，不会猜测。
- **带阻塞关系的任务单**，采用 [to-tickets](https://aihero.dev/skills-to-tickets) 生成的形式。没有阻塞关系时，图是平的，所有任务单会同时开始。
- **能在后台运行子代理，并为每个子代理提供 git worktree 的[运行环境](https://www.aihero.dev/ai-coding-dictionary/harness)。** 并发是重点；逐个运行子代理的环境只会得到更慢的 `implement`。

## 集成分支

所有工作都合并到一个分支。每个实施子代理：

1. 开始前确认其 worktree 基于集成分支，
2. 在用户同时明确指定 [tdd](https://aihero.dev/skills-tdd) 时，按红绿循环逐个切片实现任务单，
3. 汇报完成前将集成分支最新提交合并到自己的分支，使最终合并成为快进合并。

是否创建 pull request 由跟踪器的工作方式决定。若跟踪器通过 PR 关闭工作，或你要求 PR，首次合并后会创建草稿 PR，最后标记为可供审查。否则，运行在集成分支上结束，并按跟踪器的方式完成所有任务单，因此也能使用本地 Markdown 跟踪器完全离线运行。

实施子代理通过[上下文指针](https://www.aihero.dev/ai-coding-dictionary/context-pointer)（需求文档、任务单、共享探索笔记、之前的提交）与协调代理通信，而非粘贴总结。这样可缩小子代理的提示，也让协调代理的窗口留给任务依赖图。

## 常见问题

**与我自己对每张任务单运行 `/implement` 有何不同？**

这正是此技能要回答的问题。发布前，大家不断自行构建类似方案。一位用户准确描述了需求：希望“由子代理实现任务单”，而非“当一份需求文档可能超过 5 张任务单时，还得逐个创建新会话，让它们一张一张实现”。使用 `implement` 时，你负责调度：每张任务单一个[会话](https://www.aihero.dev/ai-coding-dictionary/session)，中间清空上下文，并自行跟踪哪些任务单已解除阻塞。`implement-spec` 将这项工作交给一个协调会话。代价是你不再逐张阅读任务单刚完成的工作，而是在最后审查集成分支。开始时，清空上下文，输入 `/implement-spec` 并附上需求文档指针（问题编号或文件路径）。没有真正任务依赖图的小改动，直接使用 `implement`。

**需要 GitHub 吗？我想让它停在分支上。**

现在不需要了。一位喜欢开发中版本的用户曾提出：“它最后会创建 PR，这需要 GitHub 这样的在线仓库。我希望它也能离线完成工作，并停在所有工作合并后的分支上。”现在目标是集成分支。只有配置的跟踪器通过 PR 关闭工作，或你要求 PR 时才创建。因此，使用本地 Markdown 跟踪器时，运行结束后所有任务单已完成，工作已合并到分支。

**审查和修复循环跑了几个小时，或不断“修复”尚未实现的任务单。**

这两种情况都源于 `code-review` 在技能指定的唯一时机之外运行。它根据整份需求文档检查代码，因此只有所有任务单均已合并后才有意义。在中途运行，每张尚未实现的任务单都会被视为失败，代理开始实现它，又触发下一轮审查。最后，若用户已明确指定，技能运行一次 `code-review`，并将所有发现交给一个修复子代理，但尚未说明修复后何时停止。一位用户报告，一个含五张任务单的功能“审查和修复循环大约花了四个小时”。若看到第二次全面审查开始，请要求它只针对修复项运行检查，然后停止。首次审查发现真正的问题是正常的：运行产物是等待审查完成的草稿，不能直接发布。

**它会像 implement 一样执行 tdd 吗？**

上游现在会，早期版本不会。开发中版本的用户发现“实施子代理没有继承 /tdd 指令”，因此从单张任务单扩展到整份需求文档时，红绿循环就消失了。在本仓库中，只有用户同时明确指定 `tdd`，每个实施子代理才用它实现任务单。它仍没有像 `implement` 会话那样交互约定接口边界的步骤，因此若需要固定边界，请在需求文档或任务单中写明。

**两个并行实施子代理修改了同一文件，或为同一事物选择了不同名称。**

Worktree 不会消除冲突，只会将冲突推迟到合并时。根据任务单文字写出的阻塞关系，只是对涉及文件的猜测；两张处于“代码库不同部分”的任务单仍可能共享消息目录、配置注册表或类型。每个实施子代理只看到自己的任务单和共享笔记，看不到其他子代理正在进行的工作，因此一位用户的 Web 和移动端任务单将同一字符串分别命名为 `blockedSince` 和 `blockedOn`。若待执行集合上的两张任务单涉及同一个共享部分，可添加阻塞关系让它们顺序运行，或在探索笔记中固定各任务单添加的确切名称。

**阻塞项已合并，但被阻塞的任务单仍未开始。**

这是 GitHub 上已知的不完善之处。跟踪器的 blocked-by 数量只有在阻塞任务单*关闭*后才会下降，而任务单通常在 PR 合并时关闭，也就是运行结束时。跟踪器适合作为初始任务依赖图的来源，但运行中可能过时。请要求协调代理自行记录哪些任务单已合并到集成分支，并据此计算待执行集合。

**它能替代 Sandcastle 或 AFK 脚本吗？**

不能。技能开始涉及实现后，用户会问：“Sandcastle 还有意义吗？你的技能现在似乎也能处理实现。”`implement-spec` 让代理在一个运行环境会话内负责协调，无需基础设施，也便于你观察和引导。对于真正的 [AFK](https://www.aihero.dev/ai-coding-dictionary/afk) 工作，确定性循环（[Sandcastle](https://github.com/mattpocock/sandcastle)、shell 脚本、CI 任务）更快、更便宜、更可靠，因为协调过程不会偏离。

**任务单的关键测试在 worktree 中被跳过，却报告通过。**

Worktree 只包含 git 跟踪的内容。读取 gitignored 测试数据、本地数据库或凭据的测试，可能在其中静默跳过。若任务单验证依赖未跟踪的材料，请要求协调代理在主检出目录中运行。

## 生效标志

- 任务依赖图允许时，有多个实施子代理同时运行，而非逐个运行。
- 最后一个阻塞项合并到集成分支后，任务单立即开始，而非等到整个运行结束。
- 用户同时指定 `tdd` 时，每张任务单的记录都显示它在运行，且先有失败测试，再有代码。
- 合并到集成分支时采用快进合并，而非解决冲突。
- 运行在一个分支上结束，所有任务单均已完成，只有跟踪器需要时才有 PR。

## 所处位置

`implement-spec` 是主流程中的构建步骤，是逐张任务单运行 [implement](https://aihero.dev/skills-implement) 的并行替代方案：

```txt
grill-with-docs → to-spec → to-tickets → implement-spec → retro
```

相邻技能是 [to-tickets](https://aihero.dev/skills-to-tickets)，它声明阻塞关系，供此技能读取为任务依赖图；以及 [code-review](https://aihero.dev/skills-code-review)，用户同时明确指定后，在结束前审查集成分支。不确定处于哪种流程时，[ask-matt](https://aihero.dev/skills-ask-matt) 可帮助选择整套技能中的流程。上述引用不构成自动调用授权。
