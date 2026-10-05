## What it does

[`wait-what`](../../skills/productivity/wait-what/SKILL.md) 用于你没听懂当前解释时。代理会回顾相关对话，补足背景、前提和推理，使用你的语言和项目 `GLOSSARY.md` 中的术语。

目标是让你理解。短句只是起点；删掉必要背景，即使更短，也没有完成解释。

## 渐进式解释

默认按以下顺序推进，只有仍不清楚时才升级：

1. **简明文字**：核心答案、必要背景和一个具体例子。
2. **图示**：展示关系、流程或时序，标出卡住的环节。
3. **单页 HTML**：分步展开同一个例子，支持回看；需要探索参数时增加交互。
4. **讲解视频**：用连续画面和旁白说明仍未理解的变化或因果关系。

每轮只提供当前需要的一层。你继续说“没懂”时，代理沿用同一问题的解释进度；你已经理解或能够继续原任务时停止。明确要求某种形式时，可以直接从那一层开始。

工具无法生成目标形式时，代理会说明限制并提供替代解释。视频脚本或分镜会明确标注，不作为成片交付。

## When to reach for it

在 Codex 中输入 `$wait-what`，在 Claude Code 中使用对应的 `/wait-what` 技能命令。它不会因你普通地提问而自动调用，详见[调用规则](../invocation.md)。调用后，可以继续反馈哪一步没懂，无需每轮重输技能名。

在你发现自己开始跳读的那一刻就用它。agent 已经漂移进它自己发明的术语、堆了五个缩写，或者解释了一个你从没见过前提的 decision。它修复的是你正在进行的这场对话。要彻底阻止术语出现，用 [grill-with-docs](https://aihero.dev/skills-grill-with-docs)，它预先构建共享语言。

## The name is the mechanism

leading word 是 **wait**。"Be concise" 是一条针对 agent 输出的指令，model 通过删词来服从它，从而让你进一步迷失。**Wait** 是关于_你_的状态的。它说：这里理解失败了。一个听到"讲简短点"的 agent 会写电报体。一个听到"等等，我跟丢了"的 agent 会退回去解释。

这个区别就是整个 skill。每一种对抗冗长的流行修复都在命名 _output_：`/tldr`、`/no-fluff`、`/talk-normal`。model 会过度纠枉，落进一个更短、却也一点也不更清楚的原始人腔调。命名 _listener_ 则一次要两样：更少的词**和**你缺少的 context。

skill 说重新讲一遍**那个**，不是"刚才那条消息"。让你迷失的东西通常比一个段落更大，所以 agent 决定要回溯多远。

## It plugs into the language you already have

技能借鉴 ASD-STE100 的简化表达原则：短句、直接表达、术语一致，并保留必要条件。解释使用你的语言，中文不机械套用英文词数限制。项目 `GLOSSARY.md` 提供领域术语；多上下文仓库沿 `GLOSSARY-MAP.md` 找到当前话题对应的词汇表；升级到图示、HTML 或视频时继续沿用。

如果没有 `GLOSSARY.md`，也没有 `GLOSSARY-MAP.md` 指向当前上下文的词汇表，skill 仍然有效。你只是失去领域词汇那一半。

## It's working if

- 重新解释后，你能理解原先卡住的内容，而不只是看到更少的字。
- 它补上了你缺少的前提，而不只是删词。
- 项目的名词替换了那些发明出来的词。你 `GLOSSARY.md` 里的术语回来了。
- 你连续反馈“没懂”时，它会针对缺口升级解释，而不重复压缩同一段文字。

## Where it fits

你可以在其他技能执行期间明确调用 `wait-what`，让代理解释当前问题。解释流程在本技能内完成，不自动调用 `teach`、`prototype` 或其他技能。需要其他技能时，由你明确指定。

## 参考

- [ASD-STE100 简化表达技能](https://github.com/danyuchn/asd-ste100-skill)：使用短句和一致术语，简化时保留原意。
- [Answer me with HTML](https://github.com/QingYunA/answer-me-with-html/tree/5a0e28ba4d1316de040ee24e9b729c4bdc5f5445)：按子问题组织解释页，分离内容写作与页面排版。
