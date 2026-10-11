# 任务 001-mockup：新增 mockup 技能（HTML 界面设计稿）

报告写入 `docs/tasks/001-mockup/report.md`，第一行格式为 `session-id: <id>`。证据放在 `docs/tasks/001-mockup/evidence/`。报告用中文。

## 背景

现有 `prototype` 技能做的是一次性原型：用来回答一个设计问题，用完从 main 上清理掉。用户还需要另一种东西：**长期保留的 HTML 界面设计稿**，作为后续前端开发的参照，并且会随需求反复调整。两者生命周期不同，所以单独新建一个技能 `mockup`。

两个硬性要求：

1. 生成的稿子要能真实展示想要的前端效果，包括布局、视觉层次、响应式、主要交互和各种状态。
2. 节省 token。生成和后续修改时，代理读写的内容都要尽量少。

先读这些文件：

- `AGENTS.md`、`docs/invocation.md`：bucket 规则和调用分层
- `skills/engineering/prototype/SKILL.md`、`skills/engineering/prototype/UI.md`：现有原型技能，新技能要和它划清界限
- `skills/productivity/writing-for-agents/SKILL.md` 及同目录文件：按其中要求编写技能正文
- `skills/engineering/pr/`：一个最小的入口技能示例（frontmatter 和 `agents/openai.yaml` 的写法）
- `scripts/check-repo.mjs`、`scripts/audit-english.mjs`、`dsh-plugin/scripts/copy-skills.mjs`：会检查或打包新技能的脚本

## 要做的内容

### 1. 技能位置和登记

- 新建 `skills/in-progress/mockup/`。这是 beta 技能，**不要**登记到顶层 `README.md`、`.claude-plugin/plugin.json` 或 `ask-dikui`。
- 在 `skills/in-progress/README.md` 中登记，格式与其他 bucket README 一致（`- **[mockup](./mockup/SKILL.md)** — 一行描述`），并删掉"暂无技能。"。只有一个技能时是否需要 User-invoked 分组标题，以 `check-repo.mjs` 能通过且风格与其他 bucket 一致为准。
- 入口技能，只能由用户调用：frontmatter 设 `disable-model-invocation: true`；`agents/openai.yaml` 设 `policy.allow_implicit_invocation: false`，`display_name` 和 `short_description` 参照 `pr` 的写法。
- `description` 写清用途，例如"生成并维护长期保留的 HTML 界面设计稿，作为前端开发的参照"。

### 2. 目录结构（技能自身）

```
skills/in-progress/mockup/
  SKILL.md          流程和规则，正文不超过 120 行
  agents/openai.yaml
  kit/
    tokens.css      设计变量：颜色、字号、间距、圆角、阴影
    mockup.css      基础样式 + 常用组件类
    mockup.js       数据属性驱动的小脚本
    page.html       新页面骨架，含交接说明注释块
    INDEX.md        设计稿索引模板
```

`kit/` 是节省 token 的关键：使用技能时，代理用 `cp` 把整套文件复制进项目，**不重新生成**；新页面也是先复制 `page.html` 再局部修改。

### 3. kit 文件要求

**tokens.css**（不超过 60 行）：全部用 CSS 变量定义在 `:root`。配色克制、中性，默认是看起来专业的浅色主题；可选 `@media (prefers-color-scheme: dark)` 暗色。项目已有设计变量时，由技能流程负责改写这个文件，见下文。

**mockup.css**（不超过 300 行）：只引用 tokens.css 中的变量，不写死颜色。包含：
- reset、排版（标题层级、正文、辅助文字）
- 布局：容器、`stack`（纵向间距）、`row`（横向排列）、`grid`（自适应列）、侧栏加主区域的应用框架
- 组件：按钮（主要、次要、危险、禁用）、输入框、下拉框、复选框、卡片、表格、标签徽章、tabs、弹窗、抽屉、顶部导航、侧边导航、toast、骨架屏、空状态、占位图（灰底加文字标签，用来代替插图）
- 类名简短、语义化，页面 HTML 不用堆长串工具类
- 窄屏（≤ 640px）下布局能自动换行或堆叠

**mockup.js**（不超过 150 行，无外部依赖，直接 `<script src>` 引入即可工作）。只通过数据属性和 URL 参数驱动，页面里不用写脚本：
- `data-repeat="N"`：把该元素复制成共 N 个，用于列表、表格行。复制件中带 `data-repeat-index` 的文本替换为序号即可，不要做模板引擎。
- `?state=xxx`：带 `data-state` 的元素只在值匹配时显示；无参数时显示 `data-state="default"`。用来在同一文件里展示默认、空数据、加载中、出错等状态。
- `?variant=X`：带 `data-variant` 的元素只在匹配时显示；无参数时显示第一个方案。
- 页面中存在 state 或 variant 时，自动在底部居中生成一个浮动切换栏，带左右箭头，显示当前值，点击时更新 URL 参数（用 `history.replaceState`，刷新后保持）。键盘 ← → 切换 variant，焦点在 input、textarea、contenteditable 内时不拦截。切换栏外观要明显区别于页面，并标注"设计稿"字样。
- `data-toggle="#id"`：点击时切换目标的显示状态，用于弹窗、抽屉、下拉菜单；目标内带 `data-close` 的元素点击后关闭，按 Esc 也关闭。
- `data-tabs`：容器内的 tab 按钮和面板按顺序对应，点击切换。
- `?frame=mobile`：把页面内容约束在 390px 宽并居中显示，用来预览手机效果。

**page.html**：引入 `kit/tokens.css`、`kit/mockup.css`、`kit/mockup.js`（相对路径）；开头是一个交接说明注释块，字段如下：

```html
<!--
页面：
用途：
数据：（字段名和类型，一行一个）
状态：default / empty / loading / error（按需删减）
交互：
已确定：
示意（占位）：
更新：YYYY-MM-DD 一句话
-->
```

正文给出一个最小的应用框架示例，不超过 40 行。

**INDEX.md**：设计稿目录的索引模板，包含三部分：
- 页面表：文件、用途、状态（草稿 / 已确认 / 已实现）
- 设计变量来源：默认 kit，或者从项目哪个文件提取
- 变更记录：每条一行，格式为 `日期 | 页面 | 改了什么 | 原因`

### 4. SKILL.md 正文要求

按 `writing-for-agents` 的要求编写，内容覆盖以下几点，措辞由你组织：

1. **与 prototype 的分界**：一句话说明。只想回答一个设计问题、用完就丢的情况，改用 `/prototype`。
2. **设计稿目录**：默认 `design/`；项目的 AGENTS.md 或 CLAUDE.md 另有约定时以约定为准；目录已存在时沿用。
3. **先读索引**：`design/INDEX.md` 已存在时只读它，再读本次要改的页面，不扫描其他页面。目录不存在时初始化：复制 `kit/` 和 `INDEX.md`。如果项目已有前端设计变量（如 CSS 变量、Tailwind 配置、主题文件），只读这些文件，把对应值改写进 `tokens.css`，并在 INDEX.md 记录来源。初始化只做一次。
4. **明确需求**：缺少页面用途、关键数据或主要操作时，一次性问完，不超过 3 个问题。用户不在时，把假设写进页面的交接说明。
5. **新建页面**：复制 `page.html`，再局部修改。优先使用 kit 里的类，页面专属样式写在页内一个小 `<style>` 块中。列表用 `data-repeat`，不要手写多行重复内容。各种状态用 `data-state` 放在同一个文件里。交互用 `data-toggle` 和 `data-tabs`。不引入外部框架或 CDN。
6. **修改页面**：用编辑工具局部替换，不整页重写。多个页面共用的调整改 `tokens.css` 或 `mockup.css`，不要逐页修改。
7. **并排比较**：只在用户要求比较时用 `data-variant` 在同一文件里放 2 到 3 个方案；选定后删掉落选方案，并在变更记录中写明选择和理由。
8. **展示真实效果**：布局、层级、间距和响应式要能直接作为开发参照；内容像真实业务，但简短；没有真实数据时用明确标注的占位，不编造统计数字、用户评价或品牌信息。附一张简短的反面清单，不超过 6 条：大面积紫粉渐变、emoji 装饰、无来源的数字统计区、三列同质的功能卡片、到处都是的左边框色卡片、用 SVG 手绘人物插图。
9. **检查**：有浏览器工具时，打开改动过的页面，确认控制台没有报错，每页截一张缩小的截图；响应式相关的改动再用 `?frame=mobile` 截一张。最多两轮"修改加截图"。没有浏览器工具时，告诉用户怎么打开文件。
10. **收尾**：更新页面交接说明的"更新"行，在 INDEX.md 的变更记录追加一行，页面状态有变化时同步更新。
11. **回复用户**：只给文件路径、打开方式、可用的 `?state=` 和 `?variant=` 值，以及不超过 3 行的改动说明。不复述页面内容。

正文开头或适当位置用一两句话说明节省 token 的原则（复制 kit、只读索引、局部编辑、复用共享样式），让代理知道这些规则为什么存在。

### 5. 演示样例（供后续浏览器检查使用）

在 `docs/tasks/001-mockup/evidence/sample/` 下按技能流程建一个演示目录：复制 kit，写一个 `INDEX.md`，再写两个页面：
- `list.html`：后台列表页，用到侧栏框架、表格加 `data-repeat`、四种状态（default、empty、loading、error）、筛选下拉、一个由 `data-toggle` 打开的新建弹窗。
- `settings.html`：设置页，用到 `data-tabs`、表单组件，以及 A、B 两个结构不同的 `data-variant` 方案。

这两个页面用来验证 kit 的全部功能，同时作为技能产出效果的样例。

## 不要做的内容

- 不修改 `prototype`、`implement` 或其他任何已有技能，也不在其中添加对 mockup 的引用。
- 不修改顶层 `README.md`、`.claude-plugin/plugin.json`、`ask-dikui`，也不修改 `dsh-plugin/package.json` 的版本。
- 不修改 `scripts/` 下的检查脚本。新文件过不了检查时，修改新文件本身；确实需要改规则时，在报告里说明原因，不要自己改。
- 不新建 `docs/engineering/` 下的说明文章（in-progress 技能没有文档页）。
- 不提交 git。
- 本任务在沙箱内运行，不做浏览器检查。浏览器检查是单独的任务 `002-mockup-browser`。

## 必须有的测试和检查

1. **基线**：改动前运行下面的检查命令，把输出保存到 `evidence/baseline.txt`。
2. **仓库检查**：`node scripts/check-repo.mjs` 通过。
3. **中英文检查**：`node scripts/audit-english.mjs` 与基线相比没有新增问题。新文件中不可避免的英文（CSS 属性名、数据属性名等代码标识符）要放在代码格式里。
4. **dsh 打包**：在 `dsh-plugin/` 下运行 `npm run build`、`npm test`、`npm run verify` 并通过；确认产物 `dsh-plugin/skills/zh-mockup/` 中包含 `kit/` 下全部文件，SKILL.md 中对 `/prototype` 的引用被改写成 `/zh-prototype`。检查完后按仓库原样恢复或清理 `dsh-plugin/skills/`（它不在 git 中）。
5. **脚本语法**：`node --check skills/in-progress/mockup/kit/mockup.js` 通过。
6. **行数**：用 `wc -l` 记录 SKILL.md、tokens.css、mockup.css、mockup.js、page.html 的行数，都不超过上面的限制。
7. **样例自洽**：用脚本或 grep 确认两个样例页面引用的 kit 路径都存在，页面里用到的类名都在 mockup.css 中有定义（列出未定义的类；页内 `<style>` 定义的不算）。

所有命令输出保存到 `evidence/` 下的文本文件，在报告中列出路径。

## 验收标准

- 上面所有检查通过，或者对比基线没有新增失败。
- SKILL.md 覆盖第 4 节的 11 点，没有超出边界。
- 不使用切换栏和交互属性时，kit 也能正常工作：只引入 tokens.css 和 mockup.css 的静态页面能正确显示。
- `git status` 中的改动只有：`skills/in-progress/mockup/` 新目录、`skills/in-progress/README.md`、`docs/tasks/001-mockup/`。

## 报告要求（中文）

报告写入 `docs/tasks/001-mockup/report.md`：

1. 第一行：`session-id: <id>`
2. 改动文件清单
3. 每项检查的结果和证据路径
4. 与基线的对比，以及已知的环境问题
5. 设计上的取舍，以及没有完全满足要求的地方
6. 最终的 `git status`
7. 清理情况：自己启动的进程、生成的临时文件是否已清理
