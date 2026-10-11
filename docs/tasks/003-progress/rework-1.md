# 003-progress 返工 1：收紧进度计数口径

上一版已验收并提交（8190d9d）。复查发现两处计数口径会让进度失真，按下面要求收紧。其他规则不变，沿用原任务说明 `docs/tasks/003-progress.md` 的边界、写法要求和检查项。

## 要改的内容

### 1. grilling：失效问题从分母移除

- 在定义分母的那句之后补充：因回答而不再需要的问题，从目前已知数中移除；一个回答同时覆盖了另一个问题时，那个问题算已回答。
- 把"新问题出现时，分母可能变大"改为分母会随回答增减的意思。
- 已回答的问题不受影响，分子只增不减。
- 同步修改 `docs/productivity/grilling.md` 中对应的说明。

### 2. wayfinder：范围外关闭的任务单不计

- 计数口径改为：已关闭只计因解决而关闭的任务单；因超出范围而关闭的任务单、以及删除的任务单，分子分母都不计。
- 判断依据是地图 `Out of scope` 中列出的任务链接，仍不为进度额外逐张读取任务正文。
- 进度行格式不变。
- 同步修改 `docs/engineering/wayfinder.md` 中对应的说明。

### 边界

- 只改上面两个 SKILL.md 和两篇说明文章中与计数口径相关的句子；to-tickets 及其他文件不动。
- 每个 SKILL.md 本次净增不超过 3 行。
- 不提交 git。

## 检查

1. 重跑 `node scripts/check-repo.mjs`、`node scripts/audit-english.mjs`（与原基线对比无新增）、dsh-plugin 下的 `npm run build`、`npm test`、`npm run verify`，并确认打包产物包含新句子。检查后把 `dsh-plugin/` 恢复到开始状态。
2. 在 `evidence/walkthrough.md` 末尾追加场景，引用行号；已有场景 a–g 按新文本复核，若行号或结论变化，就地更新：
   - h. grilling 目前已知 6 题，用户答了 2 题，其中一个回答使另 1 道未问的题不再需要：下一轮进度行是什么。
   - i. grilling 中用户的一个回答同时覆盖了另一道尚未提问的题：那道题怎么计数。
   - j. wayfinder 地图下 8 张任务单，已关闭 3 张，其中 1 张因超出范围关闭，`Not yet specified` 有 2 项：会话结尾输出什么。
3. 新的命令输出保存到 `evidence/` 下，文件名带 `rework1-` 前缀，不覆盖上一版的证据。

## 报告

在 `report.md` 末尾追加"## 返工 1"一节：改动内容、检查结果与证据路径、场景 h–j 的结论、a–g 是否有变化、最终 `git status`、清理情况。第一行的 session-id 保持不变。
