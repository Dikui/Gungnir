session-id: 01a12b93-2333-7ab0-bfae-1f415bfbf2c5

# 任务 002：mockup 样例真实浏览器检查

检查于 2026-10-11 完成。使用真实 Google Chrome 无头浏览器打开本地 HTML，完成 44 张截图及逐图视觉复核。已验证的 kit 交互正常；视觉检查不通过：固定“设计稿”底栏遮挡表格和手机表单，另外记录两处对齐/尺寸问题。原生 select 的系统选项弹出层未能完成视觉确认，单独列为环境限制。

仅在本任务目录中新增报告、检查脚本及证据。技能、kit、样例、任务 001 文档等均未修改；范围外 195 个文件的 SHA-256 前后完全一致。未提交 git。

## 1. 检查依据与证据说明

已读取 `docs/tasks/001-mockup.md` 第 3 节、`skills/in-progress/mockup/SKILL.md` 全文（重点为第 4 节）、`sample/list.html`、`sample/settings.html` 和它们实际引用的 kit。这里使用 SKILL.md 作为评估依据，不执行其中的修改及交接流程。

样例基路径：`docs/tasks/001-mockup/evidence/sample/`。所有截图文件名的数字对应本报告编号；`-full` 为同一状态的整页截图，`-table-right` 为表格内部滚到右侧后的整页截图。默认截图为当前视口，尺寸 1280×800；#29、#37、#38 使用 390×844。整页截图会将固定切换栏保留在原视口位置，不能据此推断滚动后切换栏的位置，实际滚动补验见 #38。

- [主检查脚本](evidence/browser-check.mjs)、[原始执行输出](evidence/browser-check-output.txt)、[断言及几何数据](evidence/results.json)：57 项断言中 56 项通过，1 项原生下拉键序选值失败。该失败如实保留，不作为页面代码缺陷定论。
- [补充检查脚本](evidence/supplemental-check.mjs)、[补充输出](evidence/supplemental-check-output.txt)、[补充测量](evidence/supplemental-results.json)：补验原生选值、遮挡命中、按钮尺寸和实际滚动。
- [主控制台记录](evidence/console.txt)、[补充控制台记录](evidence/supplemental-console.txt)：逐截图记录 URL 和输出；两个完整事件流均为 `[]`，无 console error、warning、pageerror 或资源加载失败，也无其他 console 消息。
- [截图索引](evidence/screenshot-index.json)：全部 44 张截图路径、URL、描述与控制台记录。

检查驱动首次运行时发生 `evaluateAll` 回调未传入参数的驱动错误；只修正了本任务证据目录中的检查脚本并重新运行，原输出保存在 [harness-first-attempt.txt](evidence/harness-first-attempt.txt)。这不是样例控制台异常，最终检查完整运行，没有修改被测页面。

## 2. 检查项逐条结果

| 项目 | 结果及实际观察 | 截图路径（相对于本报告） | 控制台输出 |
| --- | --- | --- | --- |
| 1. list 默认打开 | **通过（功能）**。侧栏可见；tbody 五行，序号严格为 1、2、3、4、5；底部显示“设计稿”和“状态：default”。对齐问题另见 V2。 | [01-list-default](evidence/01-list-default.png) | 无报错、警告或资源失败；见主控制台 #01。 |
| 2. empty/loading/error 与状态箭头 | **通过**。各 URL 仅显示匹配的 data-state 内容；公共侧栏、标题和筛选区域保留。右箭头从 error 依次循环 default→empty→loading→error；左箭头回 loading，URL 的 state 同步变化，刷新保留。loading 有四条骨架，error 有错误说明及重试按钮。 | [02-list-empty](evidence/02-list-empty.png)、[03-list-loading](evidence/03-list-loading.png)、[04-list-error](evidence/04-list-error.png)、[05-state-arrow-refresh](evidence/05-state-arrow-refresh.png) | 全部无报错或警告；见主控制台 #02–05。 |
| 3. 新建弹窗与焦点 | **通过**。新建打开弹窗；关闭按钮和 Esc 均关闭且焦点回到同一个新建触发按钮。12 次 Tab 和 7 次 Shift+Tab 均留在弹窗内，含首尾循环；焦点轨迹在 results.json 的 modal 测试中。 | [06-modal-open](evidence/06-modal-open.png)、[07-modal-tab-trap](evidence/07-modal-tab-trap.png)、[08-modal-close](evidence/08-modal-close.png)、[09-modal-escape](evidence/09-modal-escape.png) | 全部无报错或警告；见主控制台 #06–09。 |
| 4. 筛选、data-toggle 菜单、抽屉与 toast | **通过（data-toggle）；原生下拉弹出层未确认**。页面实际筛选使用原生 select，非 data-toggle；原键序尝试未改变值（#10–11），补验 selectOption 可选“进行中”（#32）。更多操作菜单支持关闭按钮、再次点击触发按钮和 Esc；详情抽屉支持关闭及 Esc，关闭后恢复查看按钮焦点。创建操作关闭弹窗并开 toast，关闭按钮可关闭；错误页重试 toast 可用 Esc 关闭。 | [10-filter-select-open](evidence/10-filter-select-open.png)、[11-filter-select-chosen](evidence/11-filter-select-chosen.png)、[32-filter-selected-confirmed](evidence/32-filter-selected-confirmed.png)；[12-menu-open](evidence/12-menu-open.png)、[13-menu-closed](evidence/13-menu-closed.png)；[14-drawer-open](evidence/14-drawer-open.png)、[15-drawer-closed](evidence/15-drawer-closed.png)；[16-created-toast](evidence/16-created-toast.png)、[17-created-toast-closed](evidence/17-created-toast-closed.png)、[18-retry-toast](evidence/18-retry-toast.png)、[19-retry-toast-closed](evidence/19-retry-toast-closed.png) | 全部无报错或警告；见主控制台 #10–19 和补充控制台 #32。键序选值失败为检查断言，不是浏览器报错。 |
| 5. settings 方案切换与键盘 | **通过**。默认只显示 A；点击底栏切 B 且 URL variant=B，刷新保持。标题处获焦/点击后 ← 切 A、→ 切 B；名称 input 和说明 textarea 内的 ←→ 均不切方案。 | [20-settings-A](evidence/20-settings-A.png)、[21-settings-B](evidence/21-settings-B.png)、[22-variant-keyboard](evidence/22-variant-keyboard.png)、[23-variant-input](evidence/23-variant-input.png) | 全部无报错或警告；见主控制台 #20–23。 |
| 6. 两方案 tabs | **通过（功能）**。A 的通知、B 的消息偏好点击后仅对应第二面板可见，aria-selected 正确；再点击首 tab 恢复首面板。补验 B 保存全部 toast 打开及关闭。A 保存按钮尺寸差异见 V3。 | [24-tabs-A](evidence/24-tabs-A.png)、[25-tabs-B](evidence/25-tabs-B.png)；补验 [26-settings-toast](evidence/26-settings-toast.png)、[36-tab-button-width](evidence/36-tab-button-width.png) | 全部无报错或警告；见主控制台 #24–26 和补充控制台 #36。 |
| 7. 手机效果 | **响应式布局通过；视觉不通过**。list/settings 的 frame 手机框均宽 390px 并居中，侧栏 bottom=110.59、主区 y=110.59，已堆叠。桌面 frame 的 documentWidth=1280；真实窄视口 documentWidth=390，均无页面级横向溢出。列表 table-wrap clientWidth=356、scrollWidth=527，可内部滚动 171px，这是页面交接说明要求的行为。固定底栏遮内容，见 V1。额外检查 B 手机布局也能堆叠。 | [27-list-frame-mobile](evidence/27-list-frame-mobile.png)、[27-list-frame-mobile-full](evidence/27-list-frame-mobile-full.png)、[27-list-frame-mobile-table-right](evidence/27-list-frame-mobile-table-right.png)；[28-settings-frame-mobile](evidence/28-settings-frame-mobile.png)、[28-settings-frame-mobile-full](evidence/28-settings-frame-mobile-full.png)；[29-list-390](evidence/29-list-390.png)、[29-list-390-full](evidence/29-list-390-full.png)、[29-list-390-table-right](evidence/29-list-390-table-right.png)；[30-settings-B-frame-mobile](evidence/30-settings-B-frame-mobile.png)、[30-settings-B-frame-mobile-full](evidence/30-settings-B-frame-mobile-full.png)；[37-mobile-list-overlap-confirmed](evidence/37-mobile-list-overlap-confirmed.png)、[38-mobile-list-scrolled](evidence/38-mobile-list-scrolled.png) | 全部无报错或警告；见主控制台 #27–30 和补充控制台 #37–38。 |
| 8. 只引 CSS 的静态页 | **通过**。将 sample/kit/page.html 复制到 evidence/static-page.html，仅删 script 行；将 tokens.css、mockup.css 原样复制到 evidence/kit/，保持原相对路径。实际 script 数=0，两个样式表加载且 app 为 grid，侧栏、标题、卡片布局正常。 | [31-static-css-only](evidence/31-static-css-only.png)；[静态复制件](evidence/static-page.html)、[复制内容校验](evidence/static-copy-check.json) | 无报错、警告或资源失败；见主控制台 #31。 |
| 9. 对照 SKILL.md 第 4 节视觉评估 | **不通过**。已逐张检查全部 44 张截图的层级、间距、对齐和可读性；发现 V1–V3，详情和逐图评估如下。所有截图均未出现反面清单六项做法。 | 全部截图见第 4 节，重点 [33-menu-overlap-confirmed](evidence/33-menu-overlap-confirmed.png)、[34-settings-A-overlap-confirmed](evidence/34-settings-A-overlap-confirmed.png)、[35-settings-B-overlap-confirmed](evidence/35-settings-B-overlap-confirmed.png)、[36-tab-button-width](evidence/36-tab-button-width.png)、[37-mobile-list-overlap-confirmed](evidence/37-mobile-list-overlap-confirmed.png) | 全部截图控制台均无报错或警告；见两份控制台记录。 |

## 3. 发现的问题（仅分析，未修复）

### V1：固定设计稿切换栏遮挡业务文字和表单控件

**现象及影响：**

- 桌面列表打开更多操作后，第 5 行负责人文字被盖住。底栏矩形 x=512.53–767.47、y=734–784；第 5 行负责人单元格 y=719.64–788.14，其中心的 `elementFromPoint` 命中底栏“状态：default”，而非单元格。截图 [12-menu-open](evidence/12-menu-open.png)、[33-menu-overlap-confirmed](evidence/33-menu-overlap-confirmed.png)。
- 列表 frame 手机首屏中底栏盖住第 1 行下半部；390×844 真窄视口中盖住第 2 行负责人和状态文字。右滚后查看按钮左侧也部分被盖，按钮中心仍可点，不能说按钮整个不可用。截图 [27-list-frame-mobile](evidence/27-list-frame-mobile.png)、[29-list-390](evidence/29-list-390.png)、[37-mobile-list-overlap-confirmed](evidence/37-mobile-list-overlap-confirmed.png)。
- 设置 A 手机首屏中，辅助说明中心被底栏覆盖；保存按钮 y=766.22–810.22，顶部 17.78px 与底栏重叠。截图 [28-settings-frame-mobile](evidence/28-settings-frame-mobile.png)、[34-settings-A-overlap-confirmed](evidence/34-settings-A-overlap-confirmed.png)。
- 设置 B 手机首屏中名称输入框 y=713.23–757.23；底栏 y=734–784，输入框文字和中心点击位置被盖。该中心命中 `.switcher`，会阻挡从该位置点击输入框。截图 [30-settings-B-frame-mobile](evidence/30-settings-B-frame-mobile.png)、[35-settings-B-overlap-confirmed](evidence/35-settings-B-overlap-confirmed.png)。

**复现：**1280×800 打开 list.html，点击“更多操作”；或直接打开 list.html?frame=mobile、settings.html?frame=mobile、settings.html?frame=mobile&variant=B；或 390×844 打开 list.html 并在表格内右滚。保持首屏即可看到遮挡。

**可能原因：**sample/kit/mockup.css:68 的 `.switcher` 使用 fixed、bottom:16px、z-index:50，直接占用视口中的业务内容区；:24 的 main 仅在文档末尾预留 96px，不保证每个滚动位置的底部安全区域。菜单本身在正常 flex 文档流内，会增高筛选卡片并将表格下移，使桌面第 5 行落入底栏。向下滚 307px 后最后一行可完整看到（[38-mobile-list-scrolled](evidence/38-mobile-list-scrolled.png)），说明不是永久丢失内容，而是特定视口位置的视觉/点击遮挡。精确矩形与命中记录见 supplemental-results.json。

### V2：列表筛选行的操作按钮与输入控件未对齐

**现象：**默认桌面视口中 select 和搜索框顶边 y=239.77、底边 y=283.77；“更多操作”顶边 y=224.92、底边 y=268.92，三者高度同为 44px，但按钮比输入框上移 14.84px。“导出”也与更多操作同排。截图 [01-list-default](evidence/01-list-default.png)、[32-filter-selected-confirmed](evidence/32-filter-selected-confirmed.png)，原始坐标见补充 #33 的 alignment 字段。打开菜单后错位仍可见（[33-menu-overlap-confirmed](evidence/33-menu-overlap-confirmed.png)）。

**复现：**1280×800 默认打开 list.html，对比筛选卡片中的输入框下边缘和更多操作按钮下边缘。

**可能原因：**mockup.css:19 的 `.row` 使用 `align-items:center`，带标签的 `.field` 整体高度大于按钮，导致标签加输入框整体中心与按钮中心对齐，而非控件边缘对齐。窄屏字段已独占一行，此问题主要出现在桌面筛选行。

### V3：A 方案同一保存操作在不同 tab 中宽度相差明显

**现象：**基本信息面板保存按钮宽 130px、靠左，通知面板保存按钮宽 942px、横贯卡片；动作文案同为“保存（演示）”。这使 tab 切换时主要操作的视觉权重明显改变。作为样例的一致性问题记录，不判定其保存功能失败。截图 [20-settings-A](evidence/20-settings-A.png)、[24-tabs-A](evidence/24-tabs-A.png)、[36-tab-button-width](evidence/36-tab-button-width.png)。

**复现：**1280×800 打开 settings.html，比较默认基本信息面板与点击“通知”后的保存按钮。

**可能原因：**settings.html:45 的按钮放在 `.row` 中，宽度按内容；:46 的按钮直接放在 `.stack` 纵向 flex 容器内，默认横向 stretch。两处容器结构不同而没有限定按钮宽度。

## 4. 逐张视觉评估

以下均为查看实际 PNG 后的记录。字号以 kit 设置为准：标题 28px、正文 16px、辅助/表格文字 14px。未发现正常可交互文字的低对比问题；按 tokens.css 静态颜色计算，正文/白色 14.86:1，辅助文字/页面背景 4.86:1，主按钮 7.22:1，底栏 16.37:1，详情见 [颜色对比证据](evidence/color-contrast.json)。禁用按钮透明度降低，但同时标注未开放；遮罩下的背景内容不作为当前操作内容评价。V1 是几何遮挡，不能用颜色对比通过代替。

每行“六项做法”分别指：大面积紫粉渐变、emoji 装饰、无来源统计数字区、三列同质功能卡片、到处都是左边框色卡片、SVG 手绘人物插图。列表序号不是统计区；placeholder 均写明占位，没有虚构品牌或评价。

| 截图 | 层级与间距 | 对齐、文字可读性及具体问题 | SKILL 第 4 节反面清单 |
| --- | --- | --- | --- |
| [01-list-default](evidence/01-list-default.png) | 标题、筛选卡片、表格顺序明确；主区左边缘 x=256。 | 更多操作比输入框高 14.84px（问题 V2）；底栏压住表格底部留白，但未盖住第 5 行文字。 | 未见六项做法 |
| [02-list-empty](evidence/02-list-empty.png) | 插图占位、标题、说明、按钮垂直居中；内容与卡片四周有余量。 | placeholder 标明占位；底栏与卡片之间有间隔，未遮挡空状态内容。 | 未见六项做法 |
| [03-list-loading](evidence/03-list-loading.png) | 加载标题在上、四条骨架在下，间距一致。 | 骨架与标题左对齐；四条均可辨认，底栏未遮挡。 | 未见六项做法 |
| [04-list-error](evidence/04-list-error.png) | 失败标签、标题、说明、重试按钮集中在卡片中心。 | 红色仅用于失败提示；正文和按钮可读，底栏未遮挡。 | 未见六项做法 |
| [05-state-arrow-refresh](evidence/05-state-arrow-refresh.png) | 箭头切换并刷新后保留加载标题和四条骨架。 | 状态为 loading，未混入表格、空状态或错误内容。 | 未见六项做法 |
| [06-modal-open](evidence/06-modal-open.png) | 480px 宽弹窗居中；标题、两项字段、说明及操作分层明确。 | 字段左右边缘一致；所有控件完整显示；设计稿底栏在遮罩之上，但未覆盖弹窗。 | 未见六项做法 |
| [07-modal-tab-trap](evidence/07-modal-tab-trap.png) | 布局与 #06 一致，循环 Tab 后关闭按钮有清楚的焦点轮廓。 | 轮廓未被裁切；19 次正反 Tab 的焦点都在弹窗内。 | 未见六项做法 |
| [08-modal-close](evidence/08-modal-close.png) | 弹窗关闭后恢复列表层级，主要按钮在右上。 | 新建项目按钮有焦点轮廓；筛选行仍存在 V2。 | 未见六项做法 |
| [09-modal-escape](evidence/09-modal-escape.png) | Esc 后弹窗和遮罩消失，背景恢复正常色彩。 | 触发按钮焦点轮廓完整；筛选行仍存在 V2。 | 未见六项做法 |
| [10-filter-select-open](evidence/10-filter-select-open.png) | 尝试打开原生下拉，截图只有带焦点轮廓的筛选控件。 | 未拍到原生选项弹出层，不能声称其打开外观通过；控件本体文字无裁切。 | 未见六项做法 |
| [11-filter-select-chosen](evidence/11-filter-select-chosen.png) | 原键序后仍为“全部状态”，列表布局未变化。 | 这是失败尝试的原始证据，并非已选“进行中”；补验见 #32。 | 未见六项做法 |
| [12-menu-open](evidence/12-menu-open.png) | 菜单出现在筛选卡片右侧的文档流内，卡片变高，表格下移。 | 第 5 行负责人文字被固定底栏覆盖（V1）；更多操作与输入框也未底对齐（V2）。 | 未见六项做法 |
| [13-menu-closed](evidence/13-menu-closed.png) | 菜单关闭后筛选卡片和表格回到原位置。 | 更多操作按钮焦点可见；第 5 行正文恢复可读，V2 仍存在。 | 未见六项做法 |
| [14-drawer-open](evidence/14-drawer-open.png) | 416px 宽抽屉贴右；标题和关闭按钮同排，下方为说明及封面占位。 | 抽屉内部无重叠；归档按钮变淡且明确写“未开放”，属于禁用态。 | 未见六项做法 |
| [15-drawer-closed](evidence/15-drawer-closed.png) | 抽屉和遮罩消失，表格恢复；第 1 行因悬停呈浅底。 | 第 1 行查看按钮焦点轮廓完整；未出现残留浮层。 | 未见六项做法 |
| [16-created-toast](evidence/16-created-toast.png) | 创建弹窗消失，顶部提示约 336×70px，提示和关闭按钮同排。 | 提示文字完整；浮层落在顶部导航中央空白处，未盖导航标题或徽章。 | 未见六项做法 |
| [17-created-toast-closed](evidence/17-created-toast-closed.png) | 提示关闭后顶部导航完整显示，表格五行保留。 | 无残留提示；筛选行仍存在 V2。 | 未见六项做法 |
| [18-retry-toast](evidence/18-retry-toast.png) | 错误卡片保留，重试提示在顶部中央显示。 | 提示与关闭按钮间距足够，文字没有截断，未挡住错误标题或重试按钮。 | 未见六项做法 |
| [19-retry-toast-closed](evidence/19-retry-toast-closed.png) | 重试提示消失，错误状态仍居中展示。 | 重试按钮焦点轮廓可见；状态内容不重叠。 | 未见六项做法 |
| [20-settings-A](evidence/20-settings-A.png) | 标题在卡片外；横向 tabs 在卡片顶；双列表单和底部操作有区分。 | 字段边缘对齐，textarea 可读；保存按钮宽 130px，底栏未遮挡表单。 | 未见六项做法 |
| [21-settings-B](evidence/21-settings-B.png) | 左侧 208px 类别区、右侧表单卡片，顶部保存按钮独立。 | 类别按钮与卡片顶端对齐；字段宽度一致，正文未被底栏遮住。 | 未见六项做法 |
| [22-variant-keyboard](evidence/22-variant-keyboard.png) | 键盘切换后结构与 #21 一致。 | 方案标签为 B；只有 B 的标题与字段可见，无方案叠加。 | 未见六项做法 |
| [23-variant-input](evidence/23-variant-input.png) | 左右键后仍为 B；名称输入框焦点轮廓清晰。 | 轮廓未裁切，也未出现跳方案；字段左右边缘一致。 | 未见六项做法 |
| [24-tabs-A](evidence/24-tabs-A.png) | 通知 tab 高亮，面板只剩两项复选框和保存按钮。 | 保存按钮宽 942px，相比基本信息的 130px 显著变化（V3）；标签与复选框左边缘一致。 | 未见六项做法 |
| [25-tabs-B](evidence/25-tabs-B.png) | 消息偏好高亮；右侧卡片仅显示通知内容。 | 复选框及通知渠道整齐排列；卡片底部和说明之间有间隔，底栏未遮挡。 | 未见六项做法 |
| [26-settings-toast](evidence/26-settings-toast.png) | B 结构不变，保存提示浮在顶部中央。 | 提示文字和关闭按钮完整；顶部保存全部按钮仍可见。 | 未见六项做法 |
| [27-list-frame-mobile](evidence/27-list-frame-mobile.png) | 390px 手机框居中，侧栏变成顶部导航；筛选字段分行。 | 没有页面级横向溢出；表格局部裁切可横滚，但底栏遮住第 1 行下半部（V1）。 | 未见六项做法 |
| [27-list-frame-mobile-full](evidence/27-list-frame-mobile-full.png) | 整页可见五行、窄屏布局及底部留白。 | 整页截图仍把固定底栏画在原首屏 y=734，覆盖第 1 行（V1）；并非第二处底栏。 | 未见六项做法 |
| [27-list-frame-mobile-table-right](evidence/27-list-frame-mobile-table-right.png) | 表格内部向右滚后操作列可见，其余页面不移动。 | 底栏遮挡第 1 行底部和第 2 行顶部，并覆盖第 1 行查看按钮左下边缘（V1）。 | 未见六项做法 |
| [28-settings-frame-mobile](evidence/28-settings-frame-mobile.png) | A 表单由两列变为一列；tabs 保持同排。 | 底栏盖住说明的辅助文字和保存/撤销按钮上部（V1）；各字段无横向溢出。 | 未见六项做法 |
| [28-settings-frame-mobile-full](evidence/28-settings-frame-mobile-full.png) | 整页显示 A 表单、底部操作和保存演示说明。 | 字段间距清楚；固定底栏遮挡仍在 y=734–784（V1），其余内容无裁切。 | 未见六项做法 |
| [29-list-390](evidence/29-list-390.png) | 真实 390×844 视口下侧栏堆叠；筛选控件按手机宽度展开。 | 表格第 2 行负责人、状态被底栏覆盖（V1）；documentWidth=390，无页面横向滚动。 | 未见六项做法 |
| [29-list-390-full](evidence/29-list-390-full.png) | 整页显示五行及末尾留白，列宽维持可读字号。 | 底栏仍覆盖第 2 行（V1）；没有把整张表压缩到文字过小。 | 未见六项做法 |
| [29-list-390-table-right](evidence/29-list-390-table-right.png) | 表格右滚后负责人、状态、查看列出现。 | 第 2 行状态文字及查看按钮左侧被底栏遮住（V1）；横滚只发生在 table-wrap。 | 未见六项做法 |
| [30-settings-B-frame-mobile](evidence/30-settings-B-frame-mobile.png) | B 类别区与卡片纵向堆叠，顶部保存按钮换到下一行。 | 底栏覆盖名称输入框的下半部和文字中心（V1）；卡片与类别区无横向溢出。 | 未见六项做法 |
| [30-settings-B-frame-mobile-full](evidence/30-settings-B-frame-mobile-full.png) | 整页展示类别区、完整空间资料表单及底部说明。 | 分类说明与表单间隔足够；名称字段仍被原首屏固定底栏覆盖（V1）。 | 未见六项做法 |
| [31-static-css-only](evidence/31-static-css-only.png) | 无脚本也显示 224px 侧栏、顶部导航、标题、说明及卡片。 | 标题、说明和卡片左边缘一致；主要内容文字完整，无浮动切换栏。 | 未见六项做法 |
| [32-filter-selected-confirmed](evidence/32-filter-selected-confirmed.png) | selectOption 后筛选字段显示“进行中”，其余占位表格不变。 | 选值文字可读，符合“筛选仅展示控件状态”的说明；仍有 V2。 | 未见六项做法 |
| [33-menu-overlap-confirmed](evidence/33-menu-overlap-confirmed.png) | 已选“进行中”时打开菜单，同样使卡片和表格下移。 | 第 5 行负责人中心命中 switcher 的状态文本而非单元格，证实 V1。 | 未见六项做法 |
| [34-settings-A-overlap-confirmed](evidence/34-settings-A-overlap-confirmed.png) | 手机 A 卡片和单列字段完整，底栏仍固定在 y=734。 | 辅助说明中心命中底栏；保存按钮 y=766.22 起，顶部 17.78px 被挡（V1）。 | 未见六项做法 |
| [35-settings-B-overlap-confirmed](evidence/35-settings-B-overlap-confirmed.png) | 手机 B 名称字段 y=713.23–757.23，底栏 y=734–784。 | 输入框中心的 elementFromPoint 命中 switcher，证实视觉及点击遮挡（V1）。 | 未见六项做法 |
| [36-tab-button-width](evidence/36-tab-button-width.png) | A 通知面板的两项选择之下有通栏蓝色保存按钮。 | 测得按钮从 130px 增至 942px；同一方案同一操作尺寸不一致（V3）。 | 未见六项做法 |
| [37-mobile-list-overlap-confirmed](evidence/37-mobile-list-overlap-confirmed.png) | 窄视口、表格右滚，状态与操作列仍维持清楚行间距。 | 第 2 行负责人和状态中心命中底栏；查看按钮左部被盖，中心仍可点（V1）。 | 未见六项做法 |
| [38-mobile-list-scrolled](evidence/38-mobile-list-scrolled.png) | 页面向下滚动 307px 后表格五行进入可视区域，末尾有留白。 | 此位置底栏不遮挡表格；说明 V1 是当前视口叠层问题，并非最后一行永久不可达。 | 未见六项做法 |

## 5. 环境及未完成范围

- macOS / arm64，Google Chrome **154.0.8037.99**（系统现有安装），Playwright Core **1.64.0**，Node **v26.10.0**；见 [环境记录](evidence/environment.json)。没有下载额外浏览器。
- 全部页面通过 `file://` 打开，不启动本地静态服务。桌面 1280×800、真窄视口 390×844，deviceScaleFactor=1、浅色模式；手机 frame 仍使用桌面视口，另有真窄视口补验。
- 设置 reducedMotion=reduce，使骨架屏截图可复核；本任务检查了四条骨架的存在和布局，没有验证 pulse 动画时序。手机为桌面 Chrome 的窄视口，不是实体手机或移动 Safari；没有声称完成跨浏览器或触屏测试。
- 原生筛选 select 的系统选项层：执行 focus→Space→ArrowDown→Enter 后值仍为“全部状态”，截图 #10 未显示选项层。无法确定是 macOS 原生选项层在无头模式的自动化限制还是该键序差异，未归为页面缺陷。补验 selectOption 选到“进行中”并截图 #32；**真实弹出菜单的外观、鼠标点选及收起没有得到完整截图验证**。实际 data-toggle 菜单、抽屉、toast 的打开/关闭均已完成。

## 6. 范围保护与清理

开始前记录完整 git 状态和范围外所有 tracked/untracked 非忽略文件哈希，覆盖任务 001 的 skills/in-progress/mockup/、skills/in-progress/README.md、docs/tasks/001-mockup*，以及预先存在的 docs/tasks/002-mockup-browser.md。结束前再次记录；195 个文件均相同，没有范围外新增、删除或内容变化。

- [开始 git 状态](evidence/git-status-before.txt)
- [开始 SHA-256](evidence/sha256-before.txt) / [JSON](evidence/sha256-before.json)
- [结束 SHA-256](evidence/sha256-after.txt) / [JSON](evidence/sha256-after.json)
- [哈希比对](evidence/sha256-comparison.json)：changed、added_outside_task、deleted 全为空，pass=true。
- [静态复制件核验](evidence/static-copy-check.json)：只删了复制件的 script 行，两份 CSS 与样例 kit 完全相同。
- [清理证据](evidence/cleanup.json)、[浏览器运行时进程](evidence/processes-during.txt)：所有检查 context/browser 均关闭；最后一次补验的 5 个浏览器进程 PID 均已不存在。未关闭预先存在的用户 Chrome。
- 临时依赖目录 `/tmp/002-mockup-browser-p2y6o9px`（含 npm 安装的 playwright-core）已删除；Playwright 自建浏览器临时 profile 随 browser.close 清理。本地服务没有启动。证据脚本保留在任务目录，可审查；重新运行需在临时目录重装驱动并更新脚本的临时路径。

## 7. 最终 git 状态

以下为 `git status --short --untracked-files=all` 的完整原样输出，同步保存到 [git-status-after.txt](evidence/git-status-after.txt)。开始前已有的 001 文件、skills/in-progress/README.md 及任务说明文件均为原有未提交状态；本任务只新增 `docs/tasks/002-mockup-browser/` 下的文件。

```text
 M skills/in-progress/README.md
?? docs/tasks/001-mockup.md
?? docs/tasks/001-mockup/evidence/backup-location.txt
?? docs/tasks/001-mockup/evidence/baseline-comparison.txt
?? docs/tasks/001-mockup/evidence/baseline.txt
?? docs/tasks/001-mockup/evidence/check-artifacts.mjs
?? docs/tasks/001-mockup/evidence/cleanup.txt
?? docs/tasks/001-mockup/evidence/dialog-attributes.txt
?? docs/tasks/001-mockup/evidence/diff-check.txt
?? docs/tasks/001-mockup/evidence/dom-setup.txt
?? docs/tasks/001-mockup/evidence/dsh-artifacts.txt
?? docs/tasks/001-mockup/evidence/dsh-build.txt
?? docs/tasks/001-mockup/evidence/dsh-test.txt
?? docs/tasks/001-mockup/evidence/dsh-verify.txt
?? docs/tasks/001-mockup/evidence/english-audit-expanded.txt
?? docs/tasks/001-mockup/evidence/english-audit.txt
?? docs/tasks/001-mockup/evidence/english-delta.txt
?? docs/tasks/001-mockup/evidence/git-status.txt
?? docs/tasks/001-mockup/evidence/interactions-first-run.txt
?? docs/tasks/001-mockup/evidence/interactions-second-run.txt
?? docs/tasks/001-mockup/evidence/interactions.txt
?? docs/tasks/001-mockup/evidence/line-counts.txt
?? docs/tasks/001-mockup/evidence/python-setup.txt
?? docs/tasks/001-mockup/evidence/repo-check.txt
?? docs/tasks/001-mockup/evidence/rework-dom-setup.txt
?? docs/tasks/001-mockup/evidence/rework-temp-location.txt
?? docs/tasks/001-mockup/evidence/sample-consistency.txt
?? docs/tasks/001-mockup/evidence/sample/INDEX.md
?? docs/tasks/001-mockup/evidence/sample/kit/INDEX.md
?? docs/tasks/001-mockup/evidence/sample/kit/mockup.css
?? docs/tasks/001-mockup/evidence/sample/kit/mockup.js
?? docs/tasks/001-mockup/evidence/sample/kit/page.html
?? docs/tasks/001-mockup/evidence/sample/kit/tokens.css
?? docs/tasks/001-mockup/evidence/sample/list.html
?? docs/tasks/001-mockup/evidence/sample/settings.html
?? docs/tasks/001-mockup/evidence/skill-validation.txt
?? docs/tasks/001-mockup/evidence/syntax.txt
?? docs/tasks/001-mockup/evidence/test-interactions.mjs
?? docs/tasks/001-mockup/evidence/tracked-diff.txt
?? docs/tasks/001-mockup/report.md
?? docs/tasks/002-mockup-browser.md
?? docs/tasks/002-mockup-browser/evidence/01-list-default.png
?? docs/tasks/002-mockup-browser/evidence/02-list-empty.png
?? docs/tasks/002-mockup-browser/evidence/03-list-loading.png
?? docs/tasks/002-mockup-browser/evidence/04-list-error.png
?? docs/tasks/002-mockup-browser/evidence/05-state-arrow-refresh.png
?? docs/tasks/002-mockup-browser/evidence/06-modal-open.png
?? docs/tasks/002-mockup-browser/evidence/07-modal-tab-trap.png
?? docs/tasks/002-mockup-browser/evidence/08-modal-close.png
?? docs/tasks/002-mockup-browser/evidence/09-modal-escape.png
?? docs/tasks/002-mockup-browser/evidence/10-filter-select-open.png
?? docs/tasks/002-mockup-browser/evidence/11-filter-select-chosen.png
?? docs/tasks/002-mockup-browser/evidence/12-menu-open.png
?? docs/tasks/002-mockup-browser/evidence/13-menu-closed.png
?? docs/tasks/002-mockup-browser/evidence/14-drawer-open.png
?? docs/tasks/002-mockup-browser/evidence/15-drawer-closed.png
?? docs/tasks/002-mockup-browser/evidence/16-created-toast.png
?? docs/tasks/002-mockup-browser/evidence/17-created-toast-closed.png
?? docs/tasks/002-mockup-browser/evidence/18-retry-toast.png
?? docs/tasks/002-mockup-browser/evidence/19-retry-toast-closed.png
?? docs/tasks/002-mockup-browser/evidence/20-settings-A.png
?? docs/tasks/002-mockup-browser/evidence/21-settings-B.png
?? docs/tasks/002-mockup-browser/evidence/22-variant-keyboard.png
?? docs/tasks/002-mockup-browser/evidence/23-variant-input.png
?? docs/tasks/002-mockup-browser/evidence/24-tabs-A.png
?? docs/tasks/002-mockup-browser/evidence/25-tabs-B.png
?? docs/tasks/002-mockup-browser/evidence/26-settings-toast.png
?? docs/tasks/002-mockup-browser/evidence/27-list-frame-mobile-full.png
?? docs/tasks/002-mockup-browser/evidence/27-list-frame-mobile-table-right.png
?? docs/tasks/002-mockup-browser/evidence/27-list-frame-mobile.png
?? docs/tasks/002-mockup-browser/evidence/28-settings-frame-mobile-full.png
?? docs/tasks/002-mockup-browser/evidence/28-settings-frame-mobile.png
?? docs/tasks/002-mockup-browser/evidence/29-list-390-full.png
?? docs/tasks/002-mockup-browser/evidence/29-list-390-table-right.png
?? docs/tasks/002-mockup-browser/evidence/29-list-390.png
?? docs/tasks/002-mockup-browser/evidence/30-settings-B-frame-mobile-full.png
?? docs/tasks/002-mockup-browser/evidence/30-settings-B-frame-mobile.png
?? docs/tasks/002-mockup-browser/evidence/31-static-css-only.png
?? docs/tasks/002-mockup-browser/evidence/32-filter-selected-confirmed.png
?? docs/tasks/002-mockup-browser/evidence/33-menu-overlap-confirmed.png
?? docs/tasks/002-mockup-browser/evidence/34-settings-A-overlap-confirmed.png
?? docs/tasks/002-mockup-browser/evidence/35-settings-B-overlap-confirmed.png
?? docs/tasks/002-mockup-browser/evidence/36-tab-button-width.png
?? docs/tasks/002-mockup-browser/evidence/37-mobile-list-overlap-confirmed.png
?? docs/tasks/002-mockup-browser/evidence/38-mobile-list-scrolled.png
?? docs/tasks/002-mockup-browser/evidence/browser-check-output.txt
?? docs/tasks/002-mockup-browser/evidence/browser-check.mjs
?? docs/tasks/002-mockup-browser/evidence/cleanup.json
?? docs/tasks/002-mockup-browser/evidence/color-contrast.json
?? docs/tasks/002-mockup-browser/evidence/console.txt
?? docs/tasks/002-mockup-browser/evidence/dependency-install.txt
?? docs/tasks/002-mockup-browser/evidence/environment.json
?? docs/tasks/002-mockup-browser/evidence/final-verification.json
?? docs/tasks/002-mockup-browser/evidence/git-status-after.txt
?? docs/tasks/002-mockup-browser/evidence/git-status-before.txt
?? docs/tasks/002-mockup-browser/evidence/harness-first-attempt.txt
?? docs/tasks/002-mockup-browser/evidence/kit/mockup.css
?? docs/tasks/002-mockup-browser/evidence/kit/tokens.css
?? docs/tasks/002-mockup-browser/evidence/processes-during.txt
?? docs/tasks/002-mockup-browser/evidence/results.json
?? docs/tasks/002-mockup-browser/evidence/screenshot-index.json
?? docs/tasks/002-mockup-browser/evidence/session-id.txt
?? docs/tasks/002-mockup-browser/evidence/sha256-after.json
?? docs/tasks/002-mockup-browser/evidence/sha256-after.txt
?? docs/tasks/002-mockup-browser/evidence/sha256-before.json
?? docs/tasks/002-mockup-browser/evidence/sha256-before.txt
?? docs/tasks/002-mockup-browser/evidence/sha256-comparison.json
?? docs/tasks/002-mockup-browser/evidence/static-copy-check.json
?? docs/tasks/002-mockup-browser/evidence/static-page.html
?? docs/tasks/002-mockup-browser/evidence/supplemental-check-output.txt
?? docs/tasks/002-mockup-browser/evidence/supplemental-check.mjs
?? docs/tasks/002-mockup-browser/evidence/supplemental-console.txt
?? docs/tasks/002-mockup-browser/evidence/supplemental-results.json
?? docs/tasks/002-mockup-browser/evidence/temp-location.txt
?? docs/tasks/002-mockup-browser/report.md
?? skills/in-progress/mockup/SKILL.md
?? skills/in-progress/mockup/agents/openai.yaml
?? skills/in-progress/mockup/kit/INDEX.md
?? skills/in-progress/mockup/kit/mockup.css
?? skills/in-progress/mockup/kit/mockup.js
?? skills/in-progress/mockup/kit/page.html
?? skills/in-progress/mockup/kit/tokens.css
```


## 复检

### 范围、结论与证据

2026-10-11 对任务 001“第二轮返工”后的共享 kit 复检。保持报告第一行 session-id 和以上首轮内容不变；首轮 44 张截图及全部旧证据原样保留。新增 **70 张 `r2-` 前缀截图**，重跑原 9 项，并针对 V1–V3、折叠、URL 持久化及新增 CSS 规则补验。

**V1 按本次“无遮挡，或者滚到底后能完整看到”的条件通过；V2、V3 通过。未发现新增功能回归或新的独立视觉缺陷。** 仍有首屏局部遮挡：桌面菜单展开时右下底栏挡第 5 行查看按钮，真实 390px 视口挡第 2 行状态/操作，折叠也不保证所有首屏内容无遮挡；这些场景滚到底后均无遮挡，属于 V1 的剩余限制，不能写成“任意滚动位置都已无遮挡”。原生 select 的系统弹出层仍未得到完整视觉验证，见下面环境限制。

- [r2 主驱动](evidence/r2-browser-check.mjs)、[主输出](evidence/r2-browser-check-output.txt)、[主断言与几何数据](evidence/r2-results.json)：原检查 57 个断言，56 通过，1 个原生 select 键序选值失败；原始失败未隐藏，后续 selectOption 补验通过。
- [V1–V3 及新增规则驱动](evidence/r2-targeted-check.mjs)、[补验输出](evidence/r2-targeted-check-output.txt)、[44 个补验断言与测量](evidence/r2-targeted-results.json)：44 项全部通过。
- [r2 主控制台](evidence/r2-console.txt)、[r2 补验控制台](evidence/r2-targeted-console.txt)：逐张截图记录控制台与 URL；完整事件流均为 `[]`，没有 console error/warning、pageerror、资源失败或其他 console 消息。
- [70 张截图索引](evidence/r2-screenshot-index.json)、[逐图视觉记录](evidence/r2-visual-review.json)。

### 原 9 项重跑结果

下表截图均位于本任务 evidence/ 中，每张截图对应的控制台输出可在两份 r2-console 记录按同名编号找到。

| 检查项 | 复检结论及依据 | 新截图 | 控制台 |
| --- | --- | --- | --- |
| 1. list 默认 | **通过**：侧栏、表格五行、序号 1–5 以及写有设计稿的右下切换栏均可见；筛选控件已底对齐。 | [r2-01-list-default](evidence/r2-01-list-default.png) | 无错误/警告。 |
| 2. 四种状态、箭头与 URL | **通过**：empty/loading/error 只显示匹配的状态内容，公共框架保留；左右箭头同步 state，循环正常，刷新保留 loading。 | [r2-02-list-empty](evidence/r2-02-list-empty.png)、[r2-03-list-loading](evidence/r2-03-list-loading.png)、[r2-04-list-error](evidence/r2-04-list-error.png)、[r2-05-state-arrow-refresh](evidence/r2-05-state-arrow-refresh.png) | 均无错误/警告。 |
| 3. 弹窗、Esc 和焦点 | **通过**：新建打开；关闭和 Esc 后焦点回同一触发按钮；12 次 Tab 与 7 次 Shift+Tab 全在 dialog 内，焦点轮廓清楚。 | [r2-06-modal-open](evidence/r2-06-modal-open.png)、[r2-07-modal-tab-trap](evidence/r2-07-modal-tab-trap.png)、[r2-08-modal-close](evidence/r2-08-modal-close.png)、[r2-09-modal-escape](evidence/r2-09-modal-escape.png) | 均无错误/警告。 |
| 4. 筛选、菜单、抽屉、toast | **通过（data-toggle 与原生选值）；原生系统选项层未确认**：菜单关闭按钮、再次点击、Esc 正常；抽屉打开、关闭、Esc 正常；创建 toast 和重试 toast 均可开关；selectOption 可选进行中。原 focus→Space→ArrowDown→Enter 未改变值。 | [r2-10-filter-select-open](evidence/r2-10-filter-select-open.png)、[r2-11-filter-select-chosen](evidence/r2-11-filter-select-chosen.png)、[r2-32-filter-selected](evidence/r2-32-filter-selected.png)、[r2-12-menu-open](evidence/r2-12-menu-open.png)、[r2-13-menu-closed](evidence/r2-13-menu-closed.png)、[r2-14-drawer-open](evidence/r2-14-drawer-open.png)、[r2-15-drawer-closed](evidence/r2-15-drawer-closed.png)、[r2-16-created-toast](evidence/r2-16-created-toast.png)、[r2-17-created-toast-closed](evidence/r2-17-created-toast-closed.png)、[r2-18-retry-toast](evidence/r2-18-retry-toast.png)、[r2-19-retry-toast-closed](evidence/r2-19-retry-toast-closed.png) | 均无错误/警告；选值断言失败不是页面控制台异常。 |
| 5. settings 方案和左右键 | **通过**：默认 A，按钮切 B 且 URL 同步，刷新保留；非输入区域 ←→ 切 A/B；input 与 textarea 内左右键不切方案。 | [r2-20-settings-A](evidence/r2-20-settings-A.png)、[r2-21-settings-B](evidence/r2-21-settings-B.png)、[r2-22-variant-keyboard](evidence/r2-22-variant-keyboard.png)、[r2-23-variant-input](evidence/r2-23-variant-input.png) | 均无错误/警告。 |
| 6. A/B tabs | **通过**：两个方案点击第二 tab 仅显示第二面板，再点击第一 tab 恢复；A 保存按钮两面板宽度均 130px；额外检查 B 保存 toast 开关。 | [r2-24-tabs-A](evidence/r2-24-tabs-A.png)、[r2-25-tabs-B](evidence/r2-25-tabs-B.png)、[r2-26-settings-toast](evidence/r2-26-settings-toast.png)、[r2-45-save-basic](evidence/r2-45-save-basic.png)、[r2-46-save-notification](evidence/r2-46-save-notification.png) | 均无错误/警告。 |
| 7. 手机布局 | **通过（布局及本次 V1 条件）**：frame 宽 390px 且居中，侧栏叠在主区上方；真实 390×844 documentWidth=390，frame 所在桌面 documentWidth=1280，无页面横向溢出。表格内部 356→527px 可横滚 171px，属于既定行为；B 手机框也正确堆叠。真窄视口首屏残余遮挡通过滚到底避开。 | [r2-27-list-frame-mobile](evidence/r2-27-list-frame-mobile.png)、[r2-27-list-frame-mobile-full](evidence/r2-27-list-frame-mobile-full.png)、[r2-27-list-frame-mobile-table-right](evidence/r2-27-list-frame-mobile-table-right.png)、[r2-28-settings-frame-mobile](evidence/r2-28-settings-frame-mobile.png)、[r2-28-settings-frame-mobile-full](evidence/r2-28-settings-frame-mobile-full.png)、[r2-29-list-390](evidence/r2-29-list-390.png)、[r2-29-list-390-full](evidence/r2-29-list-390-full.png)、[r2-29-list-390-table-right](evidence/r2-29-list-390-table-right.png)、[r2-30-settings-B-frame-mobile](evidence/r2-30-settings-B-frame-mobile.png)、[r2-30-settings-B-frame-mobile-full](evidence/r2-30-settings-B-frame-mobile-full.png)；底部补验见 V1 表。 | 均无错误/警告。 |
| 8. 仅 CSS 静态页 | **通过**：最新 page.html 复制到 evidence/r2-static/page.html，仅删 script 行；最新两份 CSS 原样复制到其 kit/，保持相对路径。script 数 0、两个样式表成功加载、app 为 grid；标题、侧栏、卡片正确，body 无切换栏留白。 | [r2-31-static-css-only](evidence/r2-31-static-css-only.png)、[复制页](evidence/r2-static/page.html)、[复制与 kit 同步核验](evidence/r2-static-and-kit-check.json) | 无错误/警告、无资源失败。 |
| 9. 视觉评估 | **通过（本次 V1 可滚动完整显示条件）**：逐张查看 70 张新截图，V2/V3 纠正，未见新增低对比、文本裁切、层级混乱或反面清单做法；首屏残余遮挡明确列在 V1，未声称完全消失。 | 本节下方逐图评估；重点 [r2-35-desktop-menu-bottom](evidence/r2-35-desktop-menu-bottom.png)、[r2-40-list-390-left-bottom](evidence/r2-40-list-390-left-bottom.png)、[r2-41-list-390-right-bottom](evidence/r2-41-list-390-right-bottom.png)、[r2-33-alignment-default](evidence/r2-33-alignment-default.png)、[r2-34-alignment-menu](evidence/r2-34-alignment-menu.png)、[r2-45-save-basic](evidence/r2-45-save-basic.png)、[r2-46-save-notification](evidence/r2-46-save-notification.png) | 全部截图均无错误/警告。 |

### V1：所有原遮挡场景、折叠与底部留白

**结论：通过本次验收条件。** 桌面手机 frame 的切换栏现定位到整个视口右下，在 390px 居中业务框之外，列表文字、设置 A 辅助说明/操作及 B 名称字段不再与它相交。真实窄视口和桌面菜单场景首屏仍可能相交；下表逐个场景滚到底后没有业务文字或控件与底栏交叠。判断使用实际浏览器矩形交集与 `elementFromPoint` 命中，并查看 PNG；表格本身的列裁切属于独立横滚区域，不算切换栏遮挡。

| 原问题场景 | 首屏 | 滚到底实测 | 结论 | 首屏 / 底部 / 折叠截图 |
| --- | --- | --- | --- | --- |
| 桌面菜单展开 | 有局部遮挡 | scrollY=187，交叠元素 0；折叠后滚到底也为 0 | **通过** | [r2-35-desktop-menu-initial](evidence/r2-35-desktop-menu-initial.png)、[r2-35-desktop-menu-bottom](evidence/r2-35-desktop-menu-bottom.png)、[r2-35-desktop-menu-folded](evidence/r2-35-desktop-menu-folded.png) |
| 列表手机 frame 左侧列 | 无业务遮挡 | scrollY=421，交叠元素 0；折叠后滚到底也为 0 | **通过** | [r2-36-list-frame-left-initial](evidence/r2-36-list-frame-left-initial.png)、[r2-36-list-frame-left-bottom](evidence/r2-36-list-frame-left-bottom.png)、[r2-36-list-frame-left-folded](evidence/r2-36-list-frame-left-folded.png) |
| 列表手机 frame 操作列 | 无业务遮挡 | scrollY=421，交叠元素 0；折叠后滚到底也为 0 | **通过** | [r2-37-list-frame-right-initial](evidence/r2-37-list-frame-right-initial.png)、[r2-37-list-frame-right-bottom](evidence/r2-37-list-frame-right-bottom.png)、[r2-37-list-frame-right-folded](evidence/r2-37-list-frame-right-folded.png) |
| 设置 A 手机 frame | 无业务遮挡 | scrollY=255，交叠元素 0；折叠后滚到底也为 0 | **通过** | [r2-38-settings-A-frame-initial](evidence/r2-38-settings-A-frame-initial.png)、[r2-38-settings-A-frame-bottom](evidence/r2-38-settings-A-frame-bottom.png)、[r2-38-settings-A-frame-folded](evidence/r2-38-settings-A-frame-folded.png) |
| 设置 B 手机 frame | 无业务遮挡 | scrollY=433，交叠元素 0；折叠后滚到底也为 0 | **通过** | [r2-39-settings-B-frame-initial](evidence/r2-39-settings-B-frame-initial.png)、[r2-39-settings-B-frame-bottom](evidence/r2-39-settings-B-frame-bottom.png)、[r2-39-settings-B-frame-folded](evidence/r2-39-settings-B-frame-folded.png) |
| 390px 列表左侧列 | 有局部遮挡 | scrollY=377，交叠元素 0；折叠后滚到底也为 0 | **通过** | [r2-40-list-390-left-initial](evidence/r2-40-list-390-left-initial.png)、[r2-40-list-390-left-bottom](evidence/r2-40-list-390-left-bottom.png)、[r2-40-list-390-left-folded](evidence/r2-40-list-390-left-folded.png) |
| 390px 列表操作列 | 有局部遮挡 | scrollY=377，交叠元素 0；折叠后滚到底也为 0 | **通过** | [r2-41-list-390-right-initial](evidence/r2-41-list-390-right-initial.png)、[r2-41-list-390-right-bottom](evidence/r2-41-list-390-right-bottom.png)、[r2-41-list-390-right-folded](evidence/r2-41-list-390-right-folded.png) |

实际展开和折叠栏高度均为 38px；body padding-bottom=70px，`--switcher-height=38px`，加上原 main 的末尾留白，保证上述末尾内容可滚到栏上方。折叠缩的是宽度，不能承诺高度也变小。

**残余位置记录：**1280×800 桌面菜单首屏底栏 x=1031.06–1268、y=750–788，仍盖第 5 行查看按钮的下部；390×844 首屏底栏 x=141.06–378、y=794–832，仍盖第 2 行状态和操作；折叠后约 78px 宽小栏也可压到第 2 行查看按钮。原因仍为 fixed 右下叠层，body 留白解决末尾可滚达，不能排除所有中间滚动位置的覆盖。复现和证据为上述表内 initial/folded 图；bottom 图证明其可通过滚动避开。没有修改代码。

**折叠与 URL 结论：通过。** 七个原场景点击设计稿按钮后只剩该按钮，aria-expanded=false、switcher-group 隐藏，URL 增加 bar=0；展开恢复箭头/标签并移除 bar，保留 frame、state/variant。分别直接打开 list.html?frame=mobile&state=error&bar=0 与 settings.html?frame=mobile&variant=B&bar=0，刷新仍折叠、其他参数不丢：[r2-42-bar0-refresh](evidence/r2-42-bar0-refresh.png)、[r2-42-bar-expanded](evidence/r2-42-bar-expanded.png)、[r2-43-bar0-refresh](evidence/r2-43-bar0-refresh.png)、[r2-43-bar-expanded](evidence/r2-43-bar-expanded.png)。折叠状态仍可键盘切 B→A，刷新保留 A 和 bar=0：[r2-44-folded-keyboard-refresh](evidence/r2-44-folded-keyboard-refresh.png)。

### V2：输入框与操作按钮底边

**结论：通过。** 高度均为 44px，以下是未取整的 CSS 像素；四个控件最大底边差=0。默认截图 [r2-33-alignment-default](evidence/r2-33-alignment-default.png)，菜单展开截图 [r2-34-alignment-menu](evidence/r2-34-alignment-menu.png)。

| 控件 | 默认顶边 / 底边 | 菜单展开顶边 / 底边 |
| --- | --- | --- |
| 项目状态 select | 239.765625 / 283.765625 | 273.765625 / 317.765625 |
| 项目名称 input | 239.765625 / 283.765625 | 273.765625 / 317.765625 |
| 更多操作 | 239.765625 / 283.765625 | 273.765625 / 317.765625 |
| 导出（禁用） | 239.765625 / 283.765625 | 273.765625 / 317.765625 |

### V3：两个 tab 保存按钮宽度

**结论：通过。** A 基本信息、通知面板的“保存（演示）”均宽 130px、左边缘 x=281px，宽度差=0、左边缘差=0。截图 [r2-45-save-basic](evidence/r2-45-save-basic.png)、[r2-46-save-notification](evidence/r2-46-save-notification.png)，不再出现首轮的 130px→942px 变化。

新增 `.btn.block` 在独立、无 JS 的证据页中检查：普通按钮宽 98px，block 按钮宽 1102px，恰等于卡片内容宽度 1102px；没有改样例或 kit。证据 [r2-button-fixture.html](evidence/r2-button-fixture.html)、[r2-47-btn-block-fixture](evidence/r2-47-btn-block-fixture.png)。

### 新问题检查与逐张视觉复核

**未发现新增独立问题。** 重跑原状态、方案、tabs、弹窗焦点、菜单/抽屉/toast 后行为没有回归；折叠及刷新没有丢 frame/state/variant；动态调整已有窗口到 390px、320px 再回 1280px，留白高度随实际栏同步，无新增页面级横向溢出（[r2-48-resize-back-desktop](evidence/r2-48-resize-back-desktop.png)）。静态页无额外留白；普通 stack 按钮和 block 规则均符合新约定。V1 上述残余遮挡保留记录，不称为完全修复，也不重复登记成新缺陷。

下表对全部 70 张 r2 截图逐张记录层级、间距、对齐或可读性的具体观察。正常正文、辅助文字、主要按钮等颜色未改变，未发现新增低对比；禁用按钮仍明确标注未开放。六项反面清单指紫粉渐变、emoji、无来源统计区、三列同质功能卡片、泛滥左边框色卡、SVG 人物；表格序号不是统计区，封面/插图均明确标注占位。full 图保留原视口固定栏位置，实际滚到底以 bottom 图和测量为准。

| 新截图 | 具体视觉观察 | 反面清单 |
| --- | --- | --- |
| [r2-01-list-default](evidence/r2-01-list-default.png) | 侧栏、标题、筛选卡片与五行表格分层明确；四个筛选控件已底对齐，右下切换栏仅碰到表格边缘留白，不盖正文。 | 未见六项做法 |
| [r2-02-list-empty](evidence/r2-02-list-empty.png) | 占位插图、空状态标题、说明与按钮垂直居中；占位标注明确，右下底栏未覆盖空状态。 | 未见六项做法 |
| [r2-03-list-loading](evidence/r2-03-list-loading.png) | 加载标题与四条骨架左对齐，骨架间距一致；筛选按钮底边齐平，底栏与骨架区域分离。 | 未见六项做法 |
| [r2-04-list-error](evidence/r2-04-list-error.png) | 失败徽章、标题、说明、重试按钮分层清楚；红色使用克制，按钮和正文没有遮挡。 | 未见六项做法 |
| [r2-05-state-arrow-refresh](evidence/r2-05-state-arrow-refresh.png) | 状态箭头后刷新保留 loading；只见加载标题和四条骨架，底栏位于右下且不挡加载内容。 | 未见六项做法 |
| [r2-06-modal-open](evidence/r2-06-modal-open.png) | 480px 居中弹窗，字段、说明及底部操作间距清楚；所有弹窗控件完整，右下底栏未覆盖弹窗。 | 未见六项做法 |
| [r2-07-modal-tab-trap](evidence/r2-07-modal-tab-trap.png) | Tab 循环后的关闭按钮焦点轮廓清楚、无裁切；标题、输入与操作边缘保持对齐。 | 未见六项做法 |
| [r2-08-modal-close](evidence/r2-08-modal-close.png) | 关闭后列表恢复，新建按钮焦点轮廓完整；筛选控件底边一致，无残留遮罩。 | 未见六项做法 |
| [r2-09-modal-escape](evidence/r2-09-modal-escape.png) | Esc 后弹窗消失，新建按钮保留焦点；表格五行可见，底栏在右下。 | 未见六项做法 |
| [r2-10-filter-select-open](evidence/r2-10-filter-select-open.png) | 尝试打开原生 select，仅控件焦点轮廓进入截图；选项弹出层未拍到，不能判定弹出层外观通过。 | 未见六项做法 |
| [r2-11-filter-select-chosen](evidence/r2-11-filter-select-chosen.png) | 原键序后仍显示全部状态；这是未选中进行中的原始尝试证据，补验选值见 r2-32。 | 未见六项做法 |
| [r2-12-menu-open](evidence/r2-12-menu-open.png) | 操作菜单在筛选卡片文档流内，卡片增高；按钮已底对齐，但第 5 行查看按钮仍被右下底栏部分遮住，滚到底见 r2-35-bottom。 | 未见六项做法 |
| [r2-13-menu-closed](evidence/r2-13-menu-closed.png) | 菜单关闭后筛选卡片恢复，更多操作按钮焦点可辨；控件底边齐平。 | 未见六项做法 |
| [r2-14-drawer-open](evidence/r2-14-drawer-open.png) | 抽屉贴右，标题与关闭按钮同排，封面占位和说明完整；归档按钮因 stack 新规则变为内容宽度，符合默认规则且禁用态可辨。 | 未见六项做法 |
| [r2-15-drawer-closed](evidence/r2-15-drawer-closed.png) | 关闭后第 1 行查看按钮焦点轮廓完整；抽屉和遮罩没有残留。 | 未见六项做法 |
| [r2-16-created-toast](evidence/r2-16-created-toast.png) | 创建弹窗已关闭；顶部提示和关闭按钮同排，文字完整；提示不盖导航左右文字。 | 未见六项做法 |
| [r2-17-created-toast-closed](evidence/r2-17-created-toast-closed.png) | 创建提示关闭，顶部工作空间文字及徽章完整显示；表格未出现残留浮层。 | 未见六项做法 |
| [r2-18-retry-toast](evidence/r2-18-retry-toast.png) | 错误卡片保留，顶部重试反馈与关闭按钮间距足够，未遮挡错误内容。 | 未见六项做法 |
| [r2-19-retry-toast-closed](evidence/r2-19-retry-toast-closed.png) | 重试提示关闭，重试按钮焦点轮廓清楚；错误卡片标题、说明可读。 | 未见六项做法 |
| [r2-20-settings-A](evidence/r2-20-settings-A.png) | 横向 tabs、双列表单、说明与底部操作层级清楚；保存按钮 130px，底栏与表单分离。 | 未见六项做法 |
| [r2-21-settings-B](evidence/r2-21-settings-B.png) | 左侧类别、右侧资料卡片和顶部保存操作分区清楚；字段宽度一致，底栏未盖表单。 | 未见六项做法 |
| [r2-22-variant-keyboard](evidence/r2-22-variant-keyboard.png) | 键盘切到 B 后只有 B 的结构可见；左侧类别和右侧字段边缘保持对齐。 | 未见六项做法 |
| [r2-23-variant-input](evidence/r2-23-variant-input.png) | 名称 input 中左右键后仍为 B；焦点轮廓清楚，文字没有裁切或跳方案。 | 未见六项做法 |
| [r2-24-tabs-A](evidence/r2-24-tabs-A.png) | 通知高亮，面板只有两项复选框与保存；保存按钮已恢复内容宽 130px、靠左，与基本信息一致。 | 未见六项做法 |
| [r2-25-tabs-B](evidence/r2-25-tabs-B.png) | 消息偏好高亮，复选框和通知渠道左边缘一致；卡片底部与说明间隔充足。 | 未见六项做法 |
| [r2-26-settings-toast](evidence/r2-26-settings-toast.png) | B 保存提示在顶部中央，提示文字及关闭按钮完整；顶部保存全部仍清楚可见。 | 未见六项做法 |
| [r2-27-list-frame-mobile](evidence/r2-27-list-frame-mobile.png) | 390px 框居中，侧栏堆叠，筛选分行；底栏位于视口右下、在手机框外，不再挡第 1 行文字。 | 未见六项做法 |
| [r2-27-list-frame-mobile-full](evidence/r2-27-list-frame-mobile-full.png) | 整页包含五行和新增底部留白；表格内部裁切保留横滚，右下底栏不与手机框内容重叠。 | 未见六项做法 |
| [r2-27-list-frame-mobile-table-right](evidence/r2-27-list-frame-mobile-table-right.png) | 表格内部右滚后负责人、状态、查看列可见；每行操作按钮无底栏遮挡。 | 未见六项做法 |
| [r2-28-settings-frame-mobile](evidence/r2-28-settings-frame-mobile.png) | A 表单堆叠成一列，tabs 同排；原先被盖的辅助说明与按钮上边缘已露出，首屏底部按钮余下部分需滚动查看。 | 未见六项做法 |
| [r2-28-settings-frame-mobile-full](evidence/r2-28-settings-frame-mobile-full.png) | 整页辅助说明、保存和撤销完整可见；手机框外的切换栏没有遮住字段或操作。 | 未见六项做法 |
| [r2-29-list-390](evidence/r2-29-list-390.png) | 真窄视口侧栏与字段均堆叠，无页面横向溢出；第 2 行负责人/状态仍有局部首屏遮挡，滚到底可避开。 | 未见六项做法 |
| [r2-29-list-390-full](evidence/r2-29-list-390-full.png) | 五行字号保持可读，新增底部留白可见；整页截屏保留原首屏的固定栏位置，不能替代滚到底截图。 | 未见六项做法 |
| [r2-29-list-390-table-right](evidence/r2-29-list-390-table-right.png) | 内部横滚显示查看列；第 2 行状态与查看按钮下部被底栏盖住，底部可见性另由 r2-41-bottom 验证。 | 未见六项做法 |
| [r2-30-settings-B-frame-mobile](evidence/r2-30-settings-B-frame-mobile.png) | B 类别与卡片纵向堆叠；原被挡的名称字段文字完整，右下底栏在手机框外。 | 未见六项做法 |
| [r2-30-settings-B-frame-mobile-full](evidence/r2-30-settings-B-frame-mobile-full.png) | 资料卡片的名称、说明和可见范围全部完整；类别说明和表单之间有间距，无底栏交叠。 | 未见六项做法 |
| [r2-31-static-css-only](evidence/r2-31-static-css-only.png) | 无 JS 仍显示侧栏、导航、标题和卡片；左边缘一致，没有切换栏或 body 额外留白。 | 未见六项做法 |
| [r2-32-filter-selected](evidence/r2-32-filter-selected.png) | 选值显示进行中，原生控件文字完整；筛选卡片控件底边一致。 | 未见六项做法 |
| [r2-33-alignment-default](evidence/r2-33-alignment-default.png) | 状态下拉、搜索、更多操作、导出高度均 44px，底边均 y=283.765625。 | 未见六项做法 |
| [r2-34-alignment-menu](evidence/r2-34-alignment-menu.png) | 菜单展开后卡片增高，四控件底边均 y=317.765625；第 5 行操作仍有首屏局部遮挡。 | 未见六项做法 |
| [r2-35-desktop-menu-initial](evidence/r2-35-desktop-menu-initial.png) | 桌面菜单展开：字段/行间距保持；首屏仍有业务区域局部遮挡，滚到底另验。 | 未见六项做法 |
| [r2-35-desktop-menu-bottom](evidence/r2-35-desktop-menu-bottom.png) | 桌面菜单展开：滚动 187px 后内容完整，底栏交叠业务元素为 0；文字/控件与底部留白分开。 | 未见六项做法 |
| [r2-35-desktop-menu-folded](evidence/r2-35-desktop-menu-folded.png) | 桌面菜单展开：切换栏只剩设计稿按钮；设计稿小按钮仍与右侧单元格局部交叠，折叠后滚到底的交叠为 0。 | 未见六项做法 |
| [r2-36-list-frame-left-initial](evidence/r2-36-list-frame-left-initial.png) | 列表手机 frame 左侧列：字段/行间距保持；手机框内容与视口右下底栏分离，无首屏业务遮挡。 | 未见六项做法 |
| [r2-36-list-frame-left-bottom](evidence/r2-36-list-frame-left-bottom.png) | 列表手机 frame 左侧列：滚动 421px 后内容完整，底栏交叠业务元素为 0；文字/控件与底部留白分开。 | 未见六项做法 |
| [r2-36-list-frame-left-folded](evidence/r2-36-list-frame-left-folded.png) | 列表手机 frame 左侧列：切换栏只剩设计稿按钮；正文与小按钮分离，无业务遮挡。 | 未见六项做法 |
| [r2-37-list-frame-right-initial](evidence/r2-37-list-frame-right-initial.png) | 列表手机 frame 操作列：字段/行间距保持；手机框内容与视口右下底栏分离，无首屏业务遮挡。 | 未见六项做法 |
| [r2-37-list-frame-right-bottom](evidence/r2-37-list-frame-right-bottom.png) | 列表手机 frame 操作列：滚动 421px 后内容完整，底栏交叠业务元素为 0；文字/控件与底部留白分开。 | 未见六项做法 |
| [r2-37-list-frame-right-folded](evidence/r2-37-list-frame-right-folded.png) | 列表手机 frame 操作列：切换栏只剩设计稿按钮；正文与小按钮分离，无业务遮挡。 | 未见六项做法 |
| [r2-38-settings-A-frame-initial](evidence/r2-38-settings-A-frame-initial.png) | 设置 A 手机 frame：字段/行间距保持；手机框内容与视口右下底栏分离，无首屏业务遮挡。 | 未见六项做法 |
| [r2-38-settings-A-frame-bottom](evidence/r2-38-settings-A-frame-bottom.png) | 设置 A 手机 frame：滚动 255px 后内容完整，底栏交叠业务元素为 0；文字/控件与底部留白分开。 | 未见六项做法 |
| [r2-38-settings-A-frame-folded](evidence/r2-38-settings-A-frame-folded.png) | 设置 A 手机 frame：切换栏只剩设计稿按钮；正文与小按钮分离，无业务遮挡。 | 未见六项做法 |
| [r2-39-settings-B-frame-initial](evidence/r2-39-settings-B-frame-initial.png) | 设置 B 手机 frame：字段/行间距保持；手机框内容与视口右下底栏分离，无首屏业务遮挡。 | 未见六项做法 |
| [r2-39-settings-B-frame-bottom](evidence/r2-39-settings-B-frame-bottom.png) | 设置 B 手机 frame：滚动 433px 后内容完整，底栏交叠业务元素为 0；文字/控件与底部留白分开。 | 未见六项做法 |
| [r2-39-settings-B-frame-folded](evidence/r2-39-settings-B-frame-folded.png) | 设置 B 手机 frame：切换栏只剩设计稿按钮；正文与小按钮分离，无业务遮挡。 | 未见六项做法 |
| [r2-40-list-390-left-initial](evidence/r2-40-list-390-left-initial.png) | 390px 列表左侧列：字段/行间距保持；首屏仍有业务区域局部遮挡，滚到底另验。 | 未见六项做法 |
| [r2-40-list-390-left-bottom](evidence/r2-40-list-390-left-bottom.png) | 390px 列表左侧列：滚动 377px 后内容完整，底栏交叠业务元素为 0；文字/控件与底部留白分开。 | 未见六项做法 |
| [r2-40-list-390-left-folded](evidence/r2-40-list-390-left-folded.png) | 390px 列表左侧列：切换栏只剩设计稿按钮；设计稿小按钮仍与右侧单元格局部交叠，折叠后滚到底的交叠为 0。 | 未见六项做法 |
| [r2-41-list-390-right-initial](evidence/r2-41-list-390-right-initial.png) | 390px 列表操作列：字段/行间距保持；首屏仍有业务区域局部遮挡，滚到底另验。 | 未见六项做法 |
| [r2-41-list-390-right-bottom](evidence/r2-41-list-390-right-bottom.png) | 390px 列表操作列：滚动 377px 后内容完整，底栏交叠业务元素为 0；文字/控件与底部留白分开。 | 未见六项做法 |
| [r2-41-list-390-right-folded](evidence/r2-41-list-390-right-folded.png) | 390px 列表操作列：切换栏只剩设计稿按钮；设计稿小按钮仍与右侧单元格局部交叠，折叠后滚到底的交叠为 0。 | 未见六项做法 |
| [r2-42-bar0-refresh](evidence/r2-42-bar0-refresh.png) | error+frame=mobile+bar=0 刷新后仍为错误页，底栏只剩设计稿按钮，失败标题和说明可读。 | 未见六项做法 |
| [r2-42-bar-expanded](evidence/r2-42-bar-expanded.png) | 展开恢复错误状态的箭头和标签；移除 bar 参数，手机框布局和错误内容不变。 | 未见六项做法 |
| [r2-43-bar0-refresh](evidence/r2-43-bar0-refresh.png) | B+frame=mobile+bar=0 刷新后仍为 B，底栏折叠；名称输入框无遮挡。 | 未见六项做法 |
| [r2-43-bar-expanded](evidence/r2-43-bar-expanded.png) | 展开恢复方案 B 标签与箭头；名称框与右下底栏分离，分类与表单层级保持。 | 未见六项做法 |
| [r2-44-folded-keyboard-refresh](evidence/r2-44-folded-keyboard-refresh.png) | 折叠时键盘切 A 并刷新后仍折叠；A 的 tabs、单列表单和保存操作完整分层。 | 未见六项做法 |
| [r2-45-save-basic](evidence/r2-45-save-basic.png) | 基本信息保存按钮宽 130px、左边缘 x=281；与旁边撤销按钮间距明确。 | 未见六项做法 |
| [r2-46-save-notification](evidence/r2-46-save-notification.png) | 通知保存按钮宽 130px、左边缘 x=281；不再横贯卡片，复选框和按钮左边缘一致。 | 未见六项做法 |
| [r2-47-btn-block-fixture](evidence/r2-47-btn-block-fixture.png) | 证据夹具中普通按钮 98px、block 按钮 1102px，等于容器内容宽；文字居中，无 JS 额外留白。 | 未见六项做法 |
| [r2-48-resize-back-desktop](evidence/r2-48-resize-back-desktop.png) | 动态缩到 390/320 再回 1280 后侧栏恢复左侧，筛选底对齐，五行完整，留白与底栏高度同步。 | 未见六项做法 |

### 环境、保护及清理

浏览器为本机 Google Chrome 154.0.8037.99，Playwright Core 1.64.0，macOS arm64、Node v26.10.0；详见 [r2 环境](evidence/r2-environment.json)。主要桌面视口仍为 1280×800，真窄视口为 390×844；最后的动态窗口补验额外使用 320px 宽及 1280×844。deviceScaleFactor=1、浅色、reducedMotion=reduce；全程 file://，没有本地服务，没有移动 Safari/实体触屏检查，未验证骨架 pulse 动画时序。

原生筛选系统选项层限制与首轮一致：focus→Space→ArrowDown→Enter 后仍为全部状态，r2-10 未拍到选项层；无法确定是 macOS 无头原生菜单限制还是键序差异，未认定页面缺陷。selectOption 已证明原生值可更新（r2-32），但系统弹出层外观及实际鼠标点选关闭仍未完成确认。

复检以任务 001 返工后的内容为新基线，范围外 **197 个文件**开始/结束 SHA-256 完全一致，没有本轮范围外新增、删除或改动。旧证据比较也无变化；报告仅在末尾追加，本次第一行 session-id 不变。

- [r2 开始状态](evidence/r2-git-status-before.txt)
- [r2 开始 SHA-256](evidence/r2-sha256-before.txt) / [JSON](evidence/r2-sha256-before.json)
- [r2 结束 SHA-256](evidence/r2-sha256-after.txt) / [JSON](evidence/r2-sha256-after.json)
- [r2 范围外比对](evidence/r2-sha256-comparison.json)：197→197，changed/added_outside_task/deleted 全为空。
- [首轮证据保护比对](evidence/r2-old-evidence-comparison.json)：旧 PNG 44 张及其他旧证据均未变化；[报告旧前缀校验基准](evidence/r2-report-prefix-before.json)、[最终核验](evidence/r2-final-verification.json) 证明原报告前缀逐字节保留。
- [最新 kit 同步与静态复制核验](evidence/r2-static-and-kit-check.json)：技能和样例 kit 五个文件一致；本任务 r2 静态复制页只删 script 行，两份 CSS 原样复制。
- [r2 清理](evidence/r2-cleanup.json)、[主浏览器运行进程](evidence/r2-main-processes-during.txt)、[补验浏览器运行进程](evidence/r2-targeted-processes-during.txt)：两个 context/browser 都已关闭，记录的 9 个浏览器 PID 已不存在，两个临时 profile 已删除；未关闭已有用户 Chrome。
- 临时依赖目录 `/tmp/002-mockup-browser-r2-u5hli9yx` 已删除；未启动本地服务。r2 驱动及证据夹具只保留在允许的 evidence/ 目录中，重新运行需在临时目录安装驱动并更新其路径。

### 复检最终 git 状态

以下为本轮结束时 `git status --short --untracked-files=all` 的完整原样输出，另存 [r2-git-status-after.txt](evidence/r2-git-status-after.txt)。任务 001 已有的未提交改动采用本轮开始时的哈希保护；本轮只新增本任务目录下的 r2 证据并追加 report.md。

```text
 M skills/in-progress/README.md
?? docs/tasks/001-mockup.md
?? docs/tasks/001-mockup/evidence/backup-location.txt
?? docs/tasks/001-mockup/evidence/baseline-comparison.txt
?? docs/tasks/001-mockup/evidence/baseline.txt
?? docs/tasks/001-mockup/evidence/check-artifacts.mjs
?? docs/tasks/001-mockup/evidence/cleanup.txt
?? docs/tasks/001-mockup/evidence/dialog-attributes.txt
?? docs/tasks/001-mockup/evidence/diff-check.txt
?? docs/tasks/001-mockup/evidence/dom-setup.txt
?? docs/tasks/001-mockup/evidence/dsh-artifacts.txt
?? docs/tasks/001-mockup/evidence/dsh-build.txt
?? docs/tasks/001-mockup/evidence/dsh-test.txt
?? docs/tasks/001-mockup/evidence/dsh-verify.txt
?? docs/tasks/001-mockup/evidence/english-audit-expanded.txt
?? docs/tasks/001-mockup/evidence/english-audit.txt
?? docs/tasks/001-mockup/evidence/english-delta.txt
?? docs/tasks/001-mockup/evidence/git-status.txt
?? docs/tasks/001-mockup/evidence/interactions-first-run.txt
?? docs/tasks/001-mockup/evidence/interactions-second-run.txt
?? docs/tasks/001-mockup/evidence/interactions.txt
?? docs/tasks/001-mockup/evidence/line-counts.txt
?? docs/tasks/001-mockup/evidence/python-setup.txt
?? docs/tasks/001-mockup/evidence/repo-check.txt
?? docs/tasks/001-mockup/evidence/rework-dom-setup.txt
?? docs/tasks/001-mockup/evidence/rework-temp-location.txt
?? docs/tasks/001-mockup/evidence/round2-dom-setup.txt
?? docs/tasks/001-mockup/evidence/round2-temp-location.txt
?? docs/tasks/001-mockup/evidence/sample-consistency.txt
?? docs/tasks/001-mockup/evidence/sample/INDEX.md
?? docs/tasks/001-mockup/evidence/sample/kit/INDEX.md
?? docs/tasks/001-mockup/evidence/sample/kit/mockup.css
?? docs/tasks/001-mockup/evidence/sample/kit/mockup.js
?? docs/tasks/001-mockup/evidence/sample/kit/page.html
?? docs/tasks/001-mockup/evidence/sample/kit/tokens.css
?? docs/tasks/001-mockup/evidence/sample/list.html
?? docs/tasks/001-mockup/evidence/sample/settings.html
?? docs/tasks/001-mockup/evidence/skill-validation.txt
?? docs/tasks/001-mockup/evidence/syntax.txt
?? docs/tasks/001-mockup/evidence/test-interactions.mjs
?? docs/tasks/001-mockup/evidence/tracked-diff.txt
?? docs/tasks/001-mockup/report.md
?? docs/tasks/002-mockup-browser.md
?? docs/tasks/002-mockup-browser/evidence/01-list-default.png
?? docs/tasks/002-mockup-browser/evidence/02-list-empty.png
?? docs/tasks/002-mockup-browser/evidence/03-list-loading.png
?? docs/tasks/002-mockup-browser/evidence/04-list-error.png
?? docs/tasks/002-mockup-browser/evidence/05-state-arrow-refresh.png
?? docs/tasks/002-mockup-browser/evidence/06-modal-open.png
?? docs/tasks/002-mockup-browser/evidence/07-modal-tab-trap.png
?? docs/tasks/002-mockup-browser/evidence/08-modal-close.png
?? docs/tasks/002-mockup-browser/evidence/09-modal-escape.png
?? docs/tasks/002-mockup-browser/evidence/10-filter-select-open.png
?? docs/tasks/002-mockup-browser/evidence/11-filter-select-chosen.png
?? docs/tasks/002-mockup-browser/evidence/12-menu-open.png
?? docs/tasks/002-mockup-browser/evidence/13-menu-closed.png
?? docs/tasks/002-mockup-browser/evidence/14-drawer-open.png
?? docs/tasks/002-mockup-browser/evidence/15-drawer-closed.png
?? docs/tasks/002-mockup-browser/evidence/16-created-toast.png
?? docs/tasks/002-mockup-browser/evidence/17-created-toast-closed.png
?? docs/tasks/002-mockup-browser/evidence/18-retry-toast.png
?? docs/tasks/002-mockup-browser/evidence/19-retry-toast-closed.png
?? docs/tasks/002-mockup-browser/evidence/20-settings-A.png
?? docs/tasks/002-mockup-browser/evidence/21-settings-B.png
?? docs/tasks/002-mockup-browser/evidence/22-variant-keyboard.png
?? docs/tasks/002-mockup-browser/evidence/23-variant-input.png
?? docs/tasks/002-mockup-browser/evidence/24-tabs-A.png
?? docs/tasks/002-mockup-browser/evidence/25-tabs-B.png
?? docs/tasks/002-mockup-browser/evidence/26-settings-toast.png
?? docs/tasks/002-mockup-browser/evidence/27-list-frame-mobile-full.png
?? docs/tasks/002-mockup-browser/evidence/27-list-frame-mobile-table-right.png
?? docs/tasks/002-mockup-browser/evidence/27-list-frame-mobile.png
?? docs/tasks/002-mockup-browser/evidence/28-settings-frame-mobile-full.png
?? docs/tasks/002-mockup-browser/evidence/28-settings-frame-mobile.png
?? docs/tasks/002-mockup-browser/evidence/29-list-390-full.png
?? docs/tasks/002-mockup-browser/evidence/29-list-390-table-right.png
?? docs/tasks/002-mockup-browser/evidence/29-list-390.png
?? docs/tasks/002-mockup-browser/evidence/30-settings-B-frame-mobile-full.png
?? docs/tasks/002-mockup-browser/evidence/30-settings-B-frame-mobile.png
?? docs/tasks/002-mockup-browser/evidence/31-static-css-only.png
?? docs/tasks/002-mockup-browser/evidence/32-filter-selected-confirmed.png
?? docs/tasks/002-mockup-browser/evidence/33-menu-overlap-confirmed.png
?? docs/tasks/002-mockup-browser/evidence/34-settings-A-overlap-confirmed.png
?? docs/tasks/002-mockup-browser/evidence/35-settings-B-overlap-confirmed.png
?? docs/tasks/002-mockup-browser/evidence/36-tab-button-width.png
?? docs/tasks/002-mockup-browser/evidence/37-mobile-list-overlap-confirmed.png
?? docs/tasks/002-mockup-browser/evidence/38-mobile-list-scrolled.png
?? docs/tasks/002-mockup-browser/evidence/browser-check-output.txt
?? docs/tasks/002-mockup-browser/evidence/browser-check.mjs
?? docs/tasks/002-mockup-browser/evidence/cleanup.json
?? docs/tasks/002-mockup-browser/evidence/color-contrast.json
?? docs/tasks/002-mockup-browser/evidence/console.txt
?? docs/tasks/002-mockup-browser/evidence/dependency-install.txt
?? docs/tasks/002-mockup-browser/evidence/environment.json
?? docs/tasks/002-mockup-browser/evidence/final-verification.json
?? docs/tasks/002-mockup-browser/evidence/git-status-after.txt
?? docs/tasks/002-mockup-browser/evidence/git-status-before.txt
?? docs/tasks/002-mockup-browser/evidence/harness-first-attempt.txt
?? docs/tasks/002-mockup-browser/evidence/kit/mockup.css
?? docs/tasks/002-mockup-browser/evidence/kit/tokens.css
?? docs/tasks/002-mockup-browser/evidence/processes-during.txt
?? docs/tasks/002-mockup-browser/evidence/r2-01-list-default.png
?? docs/tasks/002-mockup-browser/evidence/r2-02-list-empty.png
?? docs/tasks/002-mockup-browser/evidence/r2-03-list-loading.png
?? docs/tasks/002-mockup-browser/evidence/r2-04-list-error.png
?? docs/tasks/002-mockup-browser/evidence/r2-05-state-arrow-refresh.png
?? docs/tasks/002-mockup-browser/evidence/r2-06-modal-open.png
?? docs/tasks/002-mockup-browser/evidence/r2-07-modal-tab-trap.png
?? docs/tasks/002-mockup-browser/evidence/r2-08-modal-close.png
?? docs/tasks/002-mockup-browser/evidence/r2-09-modal-escape.png
?? docs/tasks/002-mockup-browser/evidence/r2-10-filter-select-open.png
?? docs/tasks/002-mockup-browser/evidence/r2-11-filter-select-chosen.png
?? docs/tasks/002-mockup-browser/evidence/r2-12-menu-open.png
?? docs/tasks/002-mockup-browser/evidence/r2-13-menu-closed.png
?? docs/tasks/002-mockup-browser/evidence/r2-14-drawer-open.png
?? docs/tasks/002-mockup-browser/evidence/r2-15-drawer-closed.png
?? docs/tasks/002-mockup-browser/evidence/r2-16-created-toast.png
?? docs/tasks/002-mockup-browser/evidence/r2-17-created-toast-closed.png
?? docs/tasks/002-mockup-browser/evidence/r2-18-retry-toast.png
?? docs/tasks/002-mockup-browser/evidence/r2-19-retry-toast-closed.png
?? docs/tasks/002-mockup-browser/evidence/r2-20-settings-A.png
?? docs/tasks/002-mockup-browser/evidence/r2-21-settings-B.png
?? docs/tasks/002-mockup-browser/evidence/r2-22-variant-keyboard.png
?? docs/tasks/002-mockup-browser/evidence/r2-23-variant-input.png
?? docs/tasks/002-mockup-browser/evidence/r2-24-tabs-A.png
?? docs/tasks/002-mockup-browser/evidence/r2-25-tabs-B.png
?? docs/tasks/002-mockup-browser/evidence/r2-26-settings-toast.png
?? docs/tasks/002-mockup-browser/evidence/r2-27-list-frame-mobile-full.png
?? docs/tasks/002-mockup-browser/evidence/r2-27-list-frame-mobile-table-right.png
?? docs/tasks/002-mockup-browser/evidence/r2-27-list-frame-mobile.png
?? docs/tasks/002-mockup-browser/evidence/r2-28-settings-frame-mobile-full.png
?? docs/tasks/002-mockup-browser/evidence/r2-28-settings-frame-mobile.png
?? docs/tasks/002-mockup-browser/evidence/r2-29-list-390-full.png
?? docs/tasks/002-mockup-browser/evidence/r2-29-list-390-table-right.png
?? docs/tasks/002-mockup-browser/evidence/r2-29-list-390.png
?? docs/tasks/002-mockup-browser/evidence/r2-30-settings-B-frame-mobile-full.png
?? docs/tasks/002-mockup-browser/evidence/r2-30-settings-B-frame-mobile.png
?? docs/tasks/002-mockup-browser/evidence/r2-31-static-css-only.png
?? docs/tasks/002-mockup-browser/evidence/r2-32-filter-selected.png
?? docs/tasks/002-mockup-browser/evidence/r2-33-alignment-default.png
?? docs/tasks/002-mockup-browser/evidence/r2-34-alignment-menu.png
?? docs/tasks/002-mockup-browser/evidence/r2-35-desktop-menu-bottom.png
?? docs/tasks/002-mockup-browser/evidence/r2-35-desktop-menu-folded.png
?? docs/tasks/002-mockup-browser/evidence/r2-35-desktop-menu-initial.png
?? docs/tasks/002-mockup-browser/evidence/r2-36-list-frame-left-bottom.png
?? docs/tasks/002-mockup-browser/evidence/r2-36-list-frame-left-folded.png
?? docs/tasks/002-mockup-browser/evidence/r2-36-list-frame-left-initial.png
?? docs/tasks/002-mockup-browser/evidence/r2-37-list-frame-right-bottom.png
?? docs/tasks/002-mockup-browser/evidence/r2-37-list-frame-right-folded.png
?? docs/tasks/002-mockup-browser/evidence/r2-37-list-frame-right-initial.png
?? docs/tasks/002-mockup-browser/evidence/r2-38-settings-A-frame-bottom.png
?? docs/tasks/002-mockup-browser/evidence/r2-38-settings-A-frame-folded.png
?? docs/tasks/002-mockup-browser/evidence/r2-38-settings-A-frame-initial.png
?? docs/tasks/002-mockup-browser/evidence/r2-39-settings-B-frame-bottom.png
?? docs/tasks/002-mockup-browser/evidence/r2-39-settings-B-frame-folded.png
?? docs/tasks/002-mockup-browser/evidence/r2-39-settings-B-frame-initial.png
?? docs/tasks/002-mockup-browser/evidence/r2-40-list-390-left-bottom.png
?? docs/tasks/002-mockup-browser/evidence/r2-40-list-390-left-folded.png
?? docs/tasks/002-mockup-browser/evidence/r2-40-list-390-left-initial.png
?? docs/tasks/002-mockup-browser/evidence/r2-41-list-390-right-bottom.png
?? docs/tasks/002-mockup-browser/evidence/r2-41-list-390-right-folded.png
?? docs/tasks/002-mockup-browser/evidence/r2-41-list-390-right-initial.png
?? docs/tasks/002-mockup-browser/evidence/r2-42-bar-expanded.png
?? docs/tasks/002-mockup-browser/evidence/r2-42-bar0-refresh.png
?? docs/tasks/002-mockup-browser/evidence/r2-43-bar-expanded.png
?? docs/tasks/002-mockup-browser/evidence/r2-43-bar0-refresh.png
?? docs/tasks/002-mockup-browser/evidence/r2-44-folded-keyboard-refresh.png
?? docs/tasks/002-mockup-browser/evidence/r2-45-save-basic.png
?? docs/tasks/002-mockup-browser/evidence/r2-46-save-notification.png
?? docs/tasks/002-mockup-browser/evidence/r2-47-btn-block-fixture.png
?? docs/tasks/002-mockup-browser/evidence/r2-48-resize-back-desktop.png
?? docs/tasks/002-mockup-browser/evidence/r2-browser-check-output.txt
?? docs/tasks/002-mockup-browser/evidence/r2-browser-check.mjs
?? docs/tasks/002-mockup-browser/evidence/r2-button-fixture.html
?? docs/tasks/002-mockup-browser/evidence/r2-cleanup.json
?? docs/tasks/002-mockup-browser/evidence/r2-console.txt
?? docs/tasks/002-mockup-browser/evidence/r2-dependency-install.txt
?? docs/tasks/002-mockup-browser/evidence/r2-environment.json
?? docs/tasks/002-mockup-browser/evidence/r2-final-verification.json
?? docs/tasks/002-mockup-browser/evidence/r2-git-status-after.txt
?? docs/tasks/002-mockup-browser/evidence/r2-git-status-before.txt
?? docs/tasks/002-mockup-browser/evidence/r2-main-processes-during.txt
?? docs/tasks/002-mockup-browser/evidence/r2-old-evidence-before.json
?? docs/tasks/002-mockup-browser/evidence/r2-old-evidence-comparison.json
?? docs/tasks/002-mockup-browser/evidence/r2-report-prefix-before.json
?? docs/tasks/002-mockup-browser/evidence/r2-results.json
?? docs/tasks/002-mockup-browser/evidence/r2-screenshot-index.json
?? docs/tasks/002-mockup-browser/evidence/r2-sha256-after.json
?? docs/tasks/002-mockup-browser/evidence/r2-sha256-after.txt
?? docs/tasks/002-mockup-browser/evidence/r2-sha256-before.json
?? docs/tasks/002-mockup-browser/evidence/r2-sha256-before.txt
?? docs/tasks/002-mockup-browser/evidence/r2-sha256-comparison.json
?? docs/tasks/002-mockup-browser/evidence/r2-static-and-kit-check.json
?? docs/tasks/002-mockup-browser/evidence/r2-static/kit/mockup.css
?? docs/tasks/002-mockup-browser/evidence/r2-static/kit/tokens.css
?? docs/tasks/002-mockup-browser/evidence/r2-static/page.html
?? docs/tasks/002-mockup-browser/evidence/r2-targeted-check-output.txt
?? docs/tasks/002-mockup-browser/evidence/r2-targeted-check.mjs
?? docs/tasks/002-mockup-browser/evidence/r2-targeted-console.txt
?? docs/tasks/002-mockup-browser/evidence/r2-targeted-processes-during.txt
?? docs/tasks/002-mockup-browser/evidence/r2-targeted-results.json
?? docs/tasks/002-mockup-browser/evidence/r2-temp-location.txt
?? docs/tasks/002-mockup-browser/evidence/r2-visual-review.json
?? docs/tasks/002-mockup-browser/evidence/results.json
?? docs/tasks/002-mockup-browser/evidence/screenshot-index.json
?? docs/tasks/002-mockup-browser/evidence/session-id.txt
?? docs/tasks/002-mockup-browser/evidence/sha256-after.json
?? docs/tasks/002-mockup-browser/evidence/sha256-after.txt
?? docs/tasks/002-mockup-browser/evidence/sha256-before.json
?? docs/tasks/002-mockup-browser/evidence/sha256-before.txt
?? docs/tasks/002-mockup-browser/evidence/sha256-comparison.json
?? docs/tasks/002-mockup-browser/evidence/static-copy-check.json
?? docs/tasks/002-mockup-browser/evidence/static-page.html
?? docs/tasks/002-mockup-browser/evidence/supplemental-check-output.txt
?? docs/tasks/002-mockup-browser/evidence/supplemental-check.mjs
?? docs/tasks/002-mockup-browser/evidence/supplemental-console.txt
?? docs/tasks/002-mockup-browser/evidence/supplemental-results.json
?? docs/tasks/002-mockup-browser/evidence/temp-location.txt
?? docs/tasks/002-mockup-browser/report.md
?? skills/in-progress/mockup/SKILL.md
?? skills/in-progress/mockup/agents/openai.yaml
?? skills/in-progress/mockup/kit/INDEX.md
?? skills/in-progress/mockup/kit/mockup.css
?? skills/in-progress/mockup/kit/mockup.js
?? skills/in-progress/mockup/kit/page.html
?? skills/in-progress/mockup/kit/tokens.css
```
