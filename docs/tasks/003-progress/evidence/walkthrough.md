# 场景走查

本走查不运行模型，按最终技能正文推导行为。返工 1 的行号完整快照见 [当前行号快照](rework1-skill-lines.txt)，原版快照保留在 [原版快照](skill-lines.txt)。下列进度行均是代理输出的最后一行，不是用户回答之后追加的计数。

## a. 首轮 3 题，回答后新增 2 题

第 1 轮提出 3 题时，已回答 0 题，目前已知 3 题，末行是 `进度：0/3`。用户全部回答后，代理重新计算待问集合，并在第 2 轮提出新增的 2 题；此时已回答 3 题，目前已知 5 题，末行是 `进度：3/5`。按题设的 3 个初始问题及 2 个新增问题计数。

依据：[grilling 第 11 行](../../../../skills/productivity/grilling/SKILL.md#L11) 要求回答后重新计算；[第 27 行](../../../../skills/productivity/grilling/SKILL.md#L27) 说明回答后可能出现新问题；[第 29 行](../../../../skills/productivity/grilling/SKILL.md#L29) 规定输出时机与格式；[第 30 行](../../../../skills/productivity/grilling/SKILL.md#L30) 定义分母组成；[第 31 行](../../../../skills/productivity/grilling/SKILL.md#L31)、[第 32 行](../../../../skills/productivity/grilling/SKILL.md#L32) 规定失效问题移除、覆盖回答计数及分子只增不减。若有已知但仍等待前置条件或查询的问题，第 30 行同样要求计入分母。

## b. 第 2 轮回复“先到这吧”

代理结束访谈，不再提问。输出逐条列出的已确定决策，以及全部未决问题；每个未决问题附推荐答案，并明确标为“假设，未经确认”。随后等待用户确认共同理解，不继续问第 3 轮，也不直接执行建议。

依据：[grilling 第 37 行](../../../../skills/productivity/grilling/SKILL.md#L37) 的停止条件，[第 39 行](../../../../skills/productivity/grilling/SKILL.md#L39)、[第 40 行](../../../../skills/productivity/grilling/SKILL.md#L40) 的整理要求，以及 [第 41 行](../../../../skills/productivity/grilling/SKILL.md#L41) 的确认边界。

## c. 只回复“算了”

代理只问一句“你是想结束这次访谈吗？”，等待回答。它既不自行认定结束，也不自行认定用户否定了某个选项，不继续提出访谈问题。

依据：[grilling 第 43 行](../../../../skills/productivity/grilling/SKILL.md#L43) 明确处理含义不清的停止表达。

## d. 5 张任务单，确认 1、2、3，把 4 拆成两张

原任务单 1、2、3 保持已确认。原任务单 4 被两张未确认的新任务单替代，原任务单 5 仍未确认。当前共 6 张，已确认 3 张，下一次展示末行是 `进度：3/6`。

依据：[to-tickets 第 48 行](../../../../skills/engineering/to-tickets/SKILL.md#L48) 支持按编号确认，[第 49 行](../../../../skills/engineering/to-tickets/SKILL.md#L49) 定义展示时机、计数和格式，[第 50 行](../../../../skills/engineering/to-tickets/SKILL.md#L50) 要求再拆后重新计数及改动内容重置确认。

## e. 确认 1、2 后说“够了”

代理停止调整，列出已确认的 1、2，以及其余未确认任务单，询问是否只发布已确认部分。此时一张都不发布。只有用户明确同意后才进入第 4 步，按前置任务优先的顺序发布 1、2；其余任务单不发布、不写入任务跟踪器。用户未同意时继续等待。

依据：[to-tickets 第 51 行](../../../../skills/engineering/to-tickets/SKILL.md#L51) 要求停止和分组整理，[第 52 行](../../../../skills/engineering/to-tickets/SKILL.md#L52) 禁止未经明确同意发布，[第 53 行](../../../../skills/engineering/to-tickets/SKILL.md#L53) 限定发布范围，[第 57 行](../../../../skills/engineering/to-tickets/SKILL.md#L57) 保留发布顺序。

## f. 已有地图 8 张任务单，本次关闭后累计关闭 3 张，待明确 2 项

会话最后单独一行输出：

```text
地图进度：3/8 · 待明确 2 项
```

本场景未列出范围外关闭或删除任务。分子取累计因解决而关闭的任务数 3，分母取计数范围内的任务总数 8，不取本次关闭数 1。计数使用本次已读地图和子 issue 查询结果，并计入本次关闭动作；不为这一行额外逐张读正文。

依据：[wayfinder 第 98 行](../../../../skills/engineering/wayfinder/SKILL.md#L98) 规定两种模式的会话末行、计数口径及待明确数量，[第 99 行](../../../../skills/engineering/wayfinder/SKILL.md#L99) 规定数据来源、本次变动及读取边界。

依据：[第 100 行](../../../../skills/engineering/wayfinder/SKILL.md#L100)、[第 101 行](../../../../skills/engineering/wayfinder/SKILL.md#L101) 规定关闭原因与范围外排除依据。

## g. wayfinder 会话内访谈提前结束

先由 grilling 停止访谈、列出决策与带推荐答案的未决问题，并等待用户确认。确认后，目标范围内能说清的未决问题建为任务单；仍说不清的问题放入 `Not yet specified`。超出目标范围的事项放入 `Out of scope`。已存在的任务单不重复放入 `Not yet specified`；当前任务的问题尚未解决时，不把提前结束当作解决并关闭任务。

依据：[wayfinder 第 102 行](../../../../skills/engineering/wayfinder/SKILL.md#L102) 将确认和后续分类衔接起来；[grilling 第 37 行](../../../../skills/productivity/grilling/SKILL.md#L37)、[第 39 行](../../../../skills/productivity/grilling/SKILL.md#L39)、[第 40 行](../../../../skills/productivity/grilling/SKILL.md#L40)、[第 41 行](../../../../skills/productivity/grilling/SKILL.md#L41) 决定访谈收尾；[wayfinder 第 86 行](../../../../skills/engineering/wayfinder/SKILL.md#L86)、[第 87 行](../../../../skills/engineering/wayfinder/SKILL.md#L87)、[第 88 行](../../../../skills/engineering/wayfinder/SKILL.md#L88) 决定问题去向；[第 90 行](../../../../skills/engineering/wayfinder/SKILL.md#L90) 排除重复；[第 67 行](../../../../skills/engineering/wayfinder/SKILL.md#L67) 只允许在解决后关闭任务。

## h. 已知 6 题，答 2 题使另 1 道未问题失效

按题设已回答 2 题；另 1 道未问的问题不再需要，从目前已知数中移除。没有新增问题时，目前已知数由 6 变为 5，下一轮末行是 `进度：2/5`。已回答的 2 题仍保留在分子和分母中。

依据：

- [grilling 第 30 行](../../../../skills/productivity/grilling/SKILL.md#L30) 定义计数
- [第 31 行](../../../../skills/productivity/grilling/SKILL.md#L31) 要求移除不再需要的未回答问题
- [第 32 行](../../../../skills/productivity/grilling/SKILL.md#L32) 保留已回答问题并规定分子只增不减
- [第 29 行](../../../../skills/productivity/grilling/SKILL.md#L29) 规定输出时机和格式。

## i. 一个回答覆盖另一道尚未提问的题

被覆盖的题算已回答，不再作为待问题重复提问，也不按失效问题从分母删除。这个回答覆盖的两道题均计入已回答数；若两题此前都未回答，分子增加 2，分母不因覆盖而减少。已经回答过的题不重复累加。

依据：

- [grilling 第 31 行](../../../../skills/productivity/grilling/SKILL.md#L31) 明确另一个被覆盖问题算已回答
- [第 30 行](../../../../skills/productivity/grilling/SKILL.md#L30) 按问题数计数，而非按回复次数
- [第 32 行](../../../../skills/productivity/grilling/SKILL.md#L32) 保留已回答问题。

## j. 8 张任务单，关闭 3 张，其中 1 张因超出范围关闭

按地图 `Out of scope` 中的任务链接识别并排除那张范围外关闭的任务单。分子为因解决而关闭的 2 张，分母为排除范围外任务后的 7 张。`Not yet specified` 仍有 2 项，会话最后单独一行输出：

```text
地图进度：2/7 · 待明确 2 项
```

不为判断关闭原因额外逐张读取任务正文。

依据：

- [wayfinder 第 98 行](../../../../skills/engineering/wayfinder/SKILL.md#L98) 规定格式与待明确数
- [第 99 行](../../../../skills/engineering/wayfinder/SKILL.md#L99) 规定已读数据及读取边界
- [第 100 行](../../../../skills/engineering/wayfinder/SKILL.md#L100) 要求范围外关闭及删除的任务单均不计入分子分母
- [第 101 行](../../../../skills/engineering/wayfinder/SKILL.md#L101) 规定范围外关闭的判断依据。
