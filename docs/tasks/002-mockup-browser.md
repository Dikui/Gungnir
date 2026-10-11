# 任务 002-mockup-browser：mockup 技能样例的浏览器检查

报告写入 `docs/tasks/002-mockup-browser/report.md`，第一行格式为 `session-id: <id>`。证据（截图、控制台输出等）放在 `docs/tasks/002-mockup-browser/evidence/`。报告用中文。

## 背景

任务 001-mockup 新增了 `skills/in-progress/mockup/` 技能，并在 `docs/tasks/001-mockup/evidence/sample/` 下生成了两个样例页面 `list.html` 和 `settings.html`，它们引用同目录的 `kit/`。001 只做了 DOM 层面的行为测试，没有在真实浏览器里检查。本任务在真实浏览器中检查功能和视觉效果。

先读：`docs/tasks/001-mockup.md` 的第 3 节（kit 功能说明）、`skills/in-progress/mockup/SKILL.md`、两个样例页面。

## 严格限制

- **禁止修改任何代码或文档**，包括技能文件、kit 和样例页面。发现问题只记录，不修复。
- 写入范围仅限 `docs/tasks/002-mockup-browser/`（报告和证据）。
- 用 file:// 打开页面即可。如果必须启动本地静态服务，用完关闭，并在报告中写明。
- 用 Playwright 或本机 Chrome 无头模式均可；需要安装的依赖装到临时目录，用完删除，不写入项目目录。

## 检查项

每项都要截图（文件名带编号），并记录控制台的报错和警告。桌面视口用 1280×800。

1. `list.html` 默认打开：侧栏、表格 5 行、序号 1 到 5，底部有标注"设计稿"的切换栏。
2. `list.html?state=empty`、`?state=loading`、`?state=error`：每种状态只显示对应内容；点击切换栏箭头时，URL 的 state 参数同步变化。
3. `list.html` 点击"新建"按钮打开弹窗，截图；分别用关闭按钮、Esc 关闭弹窗，确认焦点回到触发按钮。弹窗打开时按 Tab，焦点留在弹窗内。
4. `list.html` 的筛选下拉、抽屉、toast 等由 `data-toggle` 控制的元素能打开和关闭（以页面里实际有的为准）。
5. `settings.html` 默认显示方案 A；点击切换栏切到 B，截图；按键盘 ← → 切换方案；焦点在输入框内时按 ← → 不切换方案。
6. `settings.html` 的 tabs 点击切换面板，每个方案各截一张。
7. 手机效果：`list.html?frame=mobile` 和 `settings.html?frame=mobile` 各截一张；另用 390×844 视口打开 `list.html`，截一张。检查有没有横向溢出，侧栏是否堆叠到上方。
8. 只引入 CSS 的静态页面：把 `kit/page.html` 复制到证据目录，删掉其中的 `<script>` 行，打开并截图，确认布局正常。复制件放在证据目录里，不改原文件。
9. 视觉评估：对照 SKILL.md 第 4 节，逐张截图评估层级、间距、对齐、文字可读性，以及有没有反面清单里的做法。列出具体问题，比如某元素重叠、某处对比度太低，给出截图编号。不要写泛泛的评价。

## 报告要求（中文）

1. 第一行：`session-id: <id>`
2. 检查项逐条列出：通过或不通过、截图路径、控制台输出
3. 发现的问题清单：现象、复现步骤、截图、可能的原因（只分析，不修改）
4. 环境说明：使用的浏览器和版本，有哪些检查受环境限制没做成
5. 清理情况：浏览器进程、本地服务、临时依赖是否都已清理
6. 最后附 `git status --short --untracked-files=all` 的完整输出，确认除了 `docs/tasks/002-mockup-browser/` 以外没有新增或修改的文件（001 留下的未提交文件除外，见下）

注意：运行本任务时，001 的改动可能还没提交，`git status` 里会有 `skills/in-progress/mockup/`、`skills/in-progress/README.md`、`docs/tasks/001-mockup*` 等文件。这些不算本任务的改动，但它们的内容不能有变化。开始前和结束前分别记录这些文件的 SHA-256，放进证据目录。
