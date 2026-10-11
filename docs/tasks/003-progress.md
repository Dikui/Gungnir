# 任务 003-progress：需要用户反复处理的技能，展示进度并允许提前结束

报告写入 `docs/tasks/003-progress/report.md`，第一行格式为 `session-id: <id>`。证据放在 `docs/tasks/003-progress/evidence/`。报告用中文。

## 背景

有些技能需要用户一轮一轮地回答或审阅，轮数事先不知道。目前用户看不到还剩多少，也没有说明怎样提前结束。本任务给这些技能加两项能力：

1. **展示进度**：每轮输出的最后单独一行，格式为 `已完成数/目前已知总数`，例如 `进度：2/6`。
2. **允许提前结束**：用户用自然语言表示要停（如"够了""先到这""结束吧"），代理就停下，整理已完成和未完成的部分，然后等用户确认。

涉及三处（已和用户确认范围）：

| 技能 | 反复处理的内容 | 进度的分子 / 分母 |
| --- | --- | --- |
| `grilling`（被 grill-me、grill-with-docs、triage、wayfinder、improve-codebase-architecture 加载） | 每轮回答一组问题 | 已回答的问题数 / 目前已知的问题数（已回答 + 本轮要问的 + 还在等前置条件或查询的） |
| `to-tickets` 第 3 步"请用户确认拆分" | 反复调整拆分直到批准 | 用户已确认的任务单数 / 当前拆分中的任务单总数 |
| `wayfinder` | 每次会话解决一张任务单，跨会话推进 | 已关闭的任务单数 / 地图下的任务单总数，另附 `Not yet specified` 中剩余的条目数 |

先读这些文件：

- `AGENTS.md`、`docs/invocation.md`：仓库规则和调用分层
- `skills/productivity/writing-for-agents/SKILL.md` 及同目录文件：按其中要求修改技能正文
- `skills/productivity/grilling/SKILL.md`、`skills/engineering/to-tickets/SKILL.md`、`skills/engineering/wayfinder/SKILL.md`：要改的三个技能
- `skills/productivity/grill-me/SKILL.md`、`skills/engineering/grill-with-docs/SKILL.md`、`skills/engineering/triage/SKILL.md`、`skills/engineering/improve-codebase-architecture/SKILL.md`：加载 grilling 的入口技能，只读，用来确认改动不冲突
- `docs/productivity/grilling.md`、`docs/engineering/to-tickets.md`、`docs/engineering/wayfinder.md`：对应的说明文章
- `scripts/check-repo.mjs`、`scripts/audit-english.mjs`、`dsh-plugin/` 下的打包脚本

## 要做的内容

### 1. grilling

- **进度行**：每轮问题之后，最后单独一行写进度，格式固定为 `进度：<已回答>/<目前已知>`。分母按上表的口径计算。因为回答后可能出现新问题，分母可能变大，在正文中说明这一点即可，进度行本身不用每次解释。可以在进度行末尾附一句短提示，说明随时可以结束，例如 `进度：2/6 · 想停可以直接说"先到这"`。
- **提前结束**：用户用自然语言表示要停时，不再提问，输出：
  - 已确定的决策（逐条列出）；
  - 未决的问题，每条附推荐答案，明确标为"假设，未经确认"；
  - 然后等用户确认，再采取行动（与现在"等用户确认双方达成共同理解后再行动"的规则一致）。
- 判断不清用户是不是要停时（例如只说"算了"，也可能是在否定某个选项），先问一句确认，不要自己猜。
- 正常结束的条件和流程不变。

### 2. to-tickets 第 3 步

- 每次展示拆分或调整后的拆分时，最后单独一行写 `进度：<已确认>/<总数>`。用户可以按编号逐条确认，也可以整体批准；整体批准就是全部确认。拆分调整后（合并、再拆、增删）重新计数，已确认的任务单若内容被改动，算回未确认。
- **提前结束**：用户表示要停时，列出已确认和未确认的任务单，询问是否只发布已确认的那部分。用户没有明确同意前，第 4 步一张都不发布。未确认的任务单不发布、不写入 tracker。

### 3. wayfinder

- 两种模式（从想法建立地图、继续已有地图）的会话结束时，最后单独一行写 `地图进度：<已关闭>/<任务单总数> · 待明确 <M> 项`，M 是 `Not yet specified` 中的条目数。数据来自本次会话已经读取的地图和子 issue 查询结果，不为了这一行额外逐张读取任务正文。
- 会话内的访谈走 grilling，进度和提前结束由 grilling 负责，wayfinder 不再重复规定。若会话内提前结束了访谈，未决问题按 wayfinder 现有规则处理（能说清的建任务单，说不清的放 `Not yet specified`）；如果现有规则没有覆盖这种情况，只补一句说明，不改其他流程。

### 4. 说明文章

更新 `docs/productivity/grilling.md`、`docs/engineering/to-tickets.md`、`docs/engineering/wayfinder.md`，按各文章已有的结构（"它会做什么""如何判断它有效""常见问题"等）补充进度和提前结束的说明。只改与本次功能有关的段落。其他文章（如 grill-me.md、triage.md）若有描述与新行为矛盾的句子，才修改，并在报告中列出；没有矛盾就不动。

### 写法要求

- 按 `writing-for-agents` 的要求写：短句、规则明确、不加解释性铺陈。三个 SKILL.md 各自新增的内容控制在 15 行以内。
- 以下格式要求只针对本次新写的内容：中文正文；进度行格式与上面完全一致，三个技能的写法保持统一（都用全角冒号 `：`）。不要批量改已有内容的标点或措辞。

## 不要做的内容

- 不修改 grill-me、grill-with-docs、triage、improve-codebase-architecture 的 SKILL.md。若发现它们与新行为冲突，写进报告，不要自己改。
- 不修改 tdd、adversarial-review、ablation 等其他技能。它们的多轮由代理自己跑，不在本次范围。
- 不修改顶层 `README.md`、bucket README、`.claude-plugin/plugin.json`、`dsh-plugin/package.json` 的版本、`scripts/` 下的检查脚本。
- 不改变 grilling 的提问格式（❓ / ➡️ / 水平线）和待问集合的计算规则。
- 不提交 git。
- 本任务不涉及界面，没有浏览器检查任务。

## 必须有的测试和检查

1. **基线**：改动前运行第 2 到 4 项命令，把输出保存到 `evidence/baseline.txt`。
2. **仓库检查**：`node scripts/check-repo.mjs` 通过。
3. **中英文检查**：`node scripts/audit-english.mjs` 与基线相比没有新增问题。
4. **dsh 打包**：在 `dsh-plugin/` 下运行 `npm run build`、`npm test`、`npm run verify` 并通过；确认产物中 `zh-grilling`、`zh-to-tickets`、`zh-wayfinder` 包含新增的进度和提前结束内容，且其中对其他技能的引用（如 `/grilling`）按原规则被改写。检查完后把 `dsh-plugin/` 下的产物恢复到开始时的状态（以开始时的 `git status` 为准）。
5. **场景走查**：不运行模型，对照改后的 SKILL.md 文本逐条说明下面每个场景中代理应当怎么做，并引用决定该行为的行号。保存到 `evidence/walkthrough.md`：
   - a. grilling 第 1 轮问 3 题，用户全部回答后出现 2 个新问题：第 1 轮和第 2 轮结尾的进度行分别是什么。
   - b. grilling 第 2 轮，用户回复"先到这吧"：输出包含什么，代理下一步做什么。
   - c. grilling 中用户只回复"算了"：代理怎么做。
   - d. to-tickets 展示 5 张任务单，用户确认 1、2、3，要求把 4 拆成两张：下一次展示的进度行是什么。
   - e. to-tickets 中用户确认 1、2 后说"够了"：是否发布，发布哪些。
   - f. wayfinder 继续已有地图，地图下 8 张任务单，本次关闭 1 张后共关闭 3 张，`Not yet specified` 有 2 项：会话结尾输出什么。
   - g. wayfinder 会话内访谈被提前结束：未决问题去哪里。
6. **行数**：用 `git diff --stat` 和 `wc -l` 记录改动规模，三个 SKILL.md 各自新增不超过 15 行。

所有命令输出保存到 `evidence/` 下的文本文件，在报告中列出路径。

## 验收标准

- 上面所有检查通过，或与基线相比没有新增失败；已知的环境问题在报告中说明。
- 场景走查的每个场景都能从 SKILL.md 文本中唯一推出答案，不需要代理自己猜。
- 进度行格式在三个技能中一致，与本说明给出的格式相同。
- `git status` 中的改动只有：三个 SKILL.md、三篇说明文章（以及报告中列明理由的其他文章）、`docs/tasks/003-progress/`。

## 报告要求（中文）

报告写入 `docs/tasks/003-progress/report.md`：

1. 第一行：`session-id: <id>`
2. 改动文件清单，以及每个文件改了什么
3. 每项检查的结果和证据路径
4. 与基线的对比，以及已知的环境问题
5. 发现的与新行为冲突、但按边界没有修改的地方
6. 设计上的取舍，以及没有完全满足要求的地方
7. 最终的 `git status`
8. 清理情况：自己启动的进程、生成的临时文件是否已清理
