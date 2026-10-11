# 场景走查

本走查不运行模型，按最终技能正文推导行为。行号完整快照见 [skill-lines.txt](skill-lines.txt)。下列进度行均是代理输出的最后一行，不是用户回答之后追加的计数。

## a. 首轮 3 题，回答后新增 2 题

第 1 轮提出 3 题时，已回答 0 题，目前已知 3 题，末行是 `进度：0/3`。用户全部回答后，代理重新计算待问集合，并在第 2 轮提出新增的 2 题；此时已回答 3 题，目前已知 5 题，末行是 `进度：3/5`。按题设的 3 个初始问题及 2 个新增问题计数。

依据：[grilling 第 11 行](../../../../skills/productivity/grilling/SKILL.md#L11) 要求回答后重新计算；[第 27 行](../../../../skills/productivity/grilling/SKILL.md#L27) 说明回答后可能出现新问题；[第 29 行](../../../../skills/productivity/grilling/SKILL.md#L29) 规定输出时机与格式；[第 30 行](../../../../skills/productivity/grilling/SKILL.md#L30) 定义计数及分母增长。若有已知但仍等待前置条件或查询的问题，第 30 行同样要求计入分母。

## b. 第 2 轮回复“先到这吧”

代理结束访谈，不再提问。输出逐条列出的已确定决策，以及全部未决问题；每个未决问题附推荐答案，并明确标为“假设，未经确认”。随后等待用户确认共同理解，不继续问第 3 轮，也不直接执行建议。

依据：[grilling 第 35 行](../../../../skills/productivity/grilling/SKILL.md#L35) 的停止条件，[第 37 行](../../../../skills/productivity/grilling/SKILL.md#L37)、[第 38 行](../../../../skills/productivity/grilling/SKILL.md#L38) 的整理要求，以及 [第 39 行](../../../../skills/productivity/grilling/SKILL.md#L39) 的确认边界。

## c. 只回复“算了”

代理只问一句“你是想结束这次访谈吗？”，等待回答。它既不自行认定结束，也不自行认定用户否定了某个选项，不继续提出访谈问题。

依据：[grilling 第 41 行](../../../../skills/productivity/grilling/SKILL.md#L41) 明确处理含义不清的停止表达。

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

分子取累计关闭数 3，分母取地图下总数 8，不取本次关闭数 1。计数使用本次已读地图和子 issue 查询结果，并计入本次关闭动作；不为这一行额外逐张读正文。

依据：[wayfinder 第 98 行](../../../../skills/engineering/wayfinder/SKILL.md#L98) 规定两种模式的会话末行、计数口径及待明确数量，[第 99 行](../../../../skills/engineering/wayfinder/SKILL.md#L99) 规定数据来源、本次变动及读取边界。

## g. wayfinder 会话内访谈提前结束

先由 grilling 停止访谈、列出决策与带推荐答案的未决问题，并等待用户确认。确认后，目标范围内能说清的未决问题建为任务单；仍说不清的问题放入 `Not yet specified`。超出目标范围的事项放入 `Out of scope`。已存在的任务单不重复放入 `Not yet specified`；当前任务的问题尚未解决时，不把提前结束当作解决并关闭任务。

依据：[wayfinder 第 100 行](../../../../skills/engineering/wayfinder/SKILL.md#L100) 将确认和后续分类衔接起来；[grilling 第 35 行](../../../../skills/productivity/grilling/SKILL.md#L35)、[第 37 行](../../../../skills/productivity/grilling/SKILL.md#L37)、[第 38 行](../../../../skills/productivity/grilling/SKILL.md#L38)、[第 39 行](../../../../skills/productivity/grilling/SKILL.md#L39) 决定访谈收尾；[wayfinder 第 86 行](../../../../skills/engineering/wayfinder/SKILL.md#L86)、[第 87 行](../../../../skills/engineering/wayfinder/SKILL.md#L87)、[第 88 行](../../../../skills/engineering/wayfinder/SKILL.md#L88) 决定问题去向；[第 90 行](../../../../skills/engineering/wayfinder/SKILL.md#L90) 排除重复；[第 67 行](../../../../skills/engineering/wayfinder/SKILL.md#L67) 只允许在解决后关闭任务。
