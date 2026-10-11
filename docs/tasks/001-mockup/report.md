session-id: 01a12b86-0a3d-7561-b027-3a38c37205d8

# 任务 001：新增 HTML 界面设计稿技能

已新增仅由用户调用的 `mockup` 技能、共享资源和两页演示。本次返工恢复被调用方覆盖的完整报告，并补充弹窗与抽屉焦点锁定所需的属性说明。没有提交 git，没有做浏览器检查。

## 1. 改动文件清单

- [技能正文](../../../skills/in-progress/mockup/SKILL.md)：覆盖长期维护流程和原任务的 11 项要求；本次增加对话框属性与焦点锁定的说明。
- [入口配置](../../../skills/in-progress/mockup/agents/openai.yaml)：禁止隐式调用，沿用仓库入口技能格式。
- [设计变量](../../../skills/in-progress/mockup/kit/tokens.css)：中性浅色主题的颜色、字号、间距、圆角与阴影。
- [共享样式](../../../skills/in-progress/mockup/kit/mockup.css)：布局、常用组件、窄屏规则和设计稿切换栏。
- [交互脚本](../../../skills/in-progress/mockup/kit/mockup.js)：重复内容、状态、方案、标签、浮层、键盘操作和手机预览。
- [页面骨架](../../../skills/in-progress/mockup/kit/page.html)：交接说明与最小应用框架。
- [索引模板](../../../skills/in-progress/mockup/kit/INDEX.md)：页面表、变量来源和变更记录。
- [开发中技能索引](../../../skills/in-progress/README.md)：用户调用分组与技能链接，移除空目录说明。
- [样例索引](./evidence/sample/INDEX.md)：登记两个草稿及其变更记录。
- [列表样例](./evidence/sample/list.html)：四种状态、重复表格行、筛选控件、新建弹窗、菜单、抽屉与提示。
- [设置样例](./evidence/sample/settings.html)：结构不同的 A / B 方案、标签切换与表单组件。
- `evidence/sample/kit/`：从技能直接复制的全部 5 个资源文件。
- [静态检查脚本](./evidence/check-artifacts.mjs)：资源路径、类名、变量、行数及样例资源一致性检查。
- [交互检查脚本](./evidence/test-interactions.mjs)：纯 DOM 行为验证，不启动浏览器。
- 本报告和 `evidence/` 中的文本证据：记录基线、检查、对比、最终状态和清理结果。

本次返工仅改技能正文和报告，覆盖指定检查的证据，并补充属性检查及清理记录；样例原有属性正确，无需修改。其他技能、公开插件清单、顶层索引、仓库检查脚本及包版本均未修改。

## 2. 每项检查的结果和证据

本次重新执行以下四项，输出已覆盖原证据文件：

```sh
node scripts/check-repo.mjs
node scripts/audit-english.mjs
node docs/tasks/001-mockup/evidence/test-interactions.mjs
node docs/tasks/001-mockup/evidence/check-artifacts.mjs
```

交互检查通过环境变量提供临时安装的 DOM 依赖路径。其他初次任务检查沿用已有证据，未重复构建或改变打包目录。

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| 改动前基线 | 仓库和打包检查通过；中英文审计已有告警 | [基线输出](./evidence/baseline.txt) |
| 仓库检查，本次重跑 | 通过，检查 30 个技能 | [仓库输出](./evidence/repo-check.txt) |
| 中英文审计，本次重跑 | 188 行既有告警，与基线相同，新增 0 | [审计输出](./evidence/english-audit.txt) |
| 新增文档扩展审计，本次重跑 | 包含技能正文与完整报告，无新增告警 | [扩展输出](./evidence/english-audit-expanded.txt) |
| 审计对比，本次更新 | 基线和当前告警集合相同 | [告警差异](./evidence/english-delta.txt) |
| 打包构建 | 初次任务通过 | [构建输出](./evidence/dsh-build.txt) |
| 打包测试 | 初次任务 21 项通过 | [测试输出](./evidence/dsh-test.txt) |
| 打包验证 | 初次任务通过，验证 30 个技能 | [验证输出](./evidence/dsh-verify.txt) |
| 产物完整性与引用改写 | 5 个资源一致，技能名与原型引用均已加前缀 | [产物证据](./evidence/dsh-artifacts.txt) |
| 脚本语法 | 初次任务通过，脚本未改动 | [语法输出](./evidence/syntax.txt) |
| 行数，本次更新 | 全部低于限制，详见下表 | [行数输出](./evidence/line-counts.txt) |
| 样例自洽，本次重跑 | 两页资源路径均存在，未定义类均为 `[]`，共享资源完全一致 | [自洽输出](./evidence/sample-consistency.txt) |
| 交互检查，本次重跑 | 10 组纯 DOM 检查通过 | [交互输出](./evidence/interactions.txt) |
| 对话框属性，本次检查 | 列表弹窗与抽屉均已有必要属性；设置页没有弹窗或抽屉 | [属性记录](./evidence/dialog-attributes.txt) |
| 基线对比 | 告警集合无变化，技能数增加 1 | [对比记录](./evidence/baseline-comparison.txt) |
| 空白差异，本次更新 | 通过，无输出 | [空白检查](./evidence/diff-check.txt) |
| 跟踪文件差异，本次更新 | 仅开发中技能索引有修改 | [差异输出](./evidence/tracked-diff.txt) |
| 最终状态，本次更新 | 本次文件均在允许范围内，保留其他任务文件 | [状态输出](./evidence/git-status.txt) |
| 附加技能验证器 | 初次任务发现验证器与必需入口字段不兼容 | [附加验证](./evidence/skill-validation.txt) |

| 文件 | 当前总行数 | 限制 |
| --- | --- | --- |
| `SKILL.md` | 70，包含配置头 | 正文 120 |
| `tokens.css` | 42 | 60 |
| `mockup.css` | 89 | 300 |
| `mockup.js` | 133 | 150 |
| `page.html` | 37，包含注释和文档头 | 40 |

样例中的对话框标记位于 `data-toggle` 指向的容器上，交互脚本依靠该目标的角色识别需要焦点锁定的浮层；技能正文现已明确要求该位置添加以下属性：

```html
role="dialog" aria-modal="true"
```

已重跑的交互检查覆盖重复行、四状态循环、初始参数与刷新保持、方案及键盘切换、输入焦点避让、标签、弹窗关闭与焦点返回、菜单、抽屉、提示、延后初始化以及静态骨架。该脚本不单独验证 Tab 焦点循环；本次通过属性检查确认焦点锁定的配置前提，真实浏览器验证仍交给任务 002。

## 3. 与基线的对比

基线仓库检查为 29 个技能，新增后为 30 个。基线及当前中英文审计均有 188 行告警，集合完全一致，新增和消除均为 0。初次任务的打包构建、测试、验证和当前重新执行的仓库、样例、交互检查均通过。

审计脚本只读取已跟踪文档，因此另用临时索引执行原脚本，纳入本次新增文档及报告。真实 git 索引与审计脚本未修改。

## 4. 环境问题、设计取舍及未完全验证的地方

- 初次任务的附加验证器依赖系统中未安装的 Python 模块；临时安装后，仍不支持仓库必需的 `disable-model-invocation` 字段。保留必需字段，仓库检查通过；附加验证器不属于任务必需检查。
- 初次纯 DOM 检查曾因测试模拟层修改共享元素原型而超时；改用实例级模拟后通过，本次也通过。失败与修正过程的证据均保留。
- 初次沙箱禁止查看进程列表，未据此声称完成进程扫描；本任务未启动浏览器或开发服务器。
- 配色采用中性浅色主题，未添加可选暗色主题。所有共享组件颜色来自设计变量。
- 复制资源和页面骨架，先读索引及目标页面，再局部编辑；共用调整集中在设计变量和共享样式，减少读写内容。
- 390px 预览使用宽度约束和容器查询，常规窄屏使用媒体查询；表格横向滚动以保留列的可读性。
- 设置方案 A 为横向标签与底部保存，B 为侧栏分类与顶部保存；两者结构不同，切换栏明确标注“设计稿”。
- 数据均标注占位；筛选不接数据，新建和保存不持久化，页面交接说明与可见提示写明演示边界。
- 静态骨架没有交互属性，基础布局与组件不依赖脚本初始化；结构与行为已检查，像素效果尚未验证。
- 按原任务边界未做浏览器检查，没有截图或视觉效果结论；响应式与真实键盘行为留给任务 `002-mockup-browser`。

打包脚本实际生成 `dsh-plugin/skills/mockup/`，配置中的技能名称为 `zh-mockup`，原型引用被改写为 `/zh-prototype`。资源完整性已在实际目录验证；调用方已接受此目录约定，不再作为未满足项，不改打包脚本，也不人为增加带前缀的目录。

技能正文覆盖原任务的 11 点要求，仍低于行数限制；除明确留给后续任务的浏览器验证外，本次返工没有未完成项。

## 5. 样例打开方式

双击下列页面即可打开，不依赖服务或联网：

- [列表页](./evidence/sample/list.html)
  状态参数为 `default`、`empty`、`loading`、`error`。
- [设置页](./evidence/sample/settings.html)：方案参数为 `A`、`B`。

参数分别使用 `?state=`、`?variant=`；手机预览使用 `?frame=mobile`，组合参数时用 `&` 连接。

## 6. 最终 git 状态

完整逐文件输出见 [最终状态](./evidence/git-status.txt)。按目录归纳如下：

```text
 M skills/in-progress/README.md
?? skills/in-progress/mockup/
?? docs/tasks/001-mockup/
?? docs/tasks/001-mockup.md
?? docs/tasks/002-mockup-browser.md
```

状态中另有两份未跟踪的任务说明文件，均未修改；其中任务 001 说明在初次任务开始前已存在。本任务新增或修改均在允许的三个位置内，没有改其他技能、检查脚本、插件清单或包版本，没有提交 git，也没有修改真实索引。

## 7. 清理情况

初次任务已恢复原有打包目录，并确认与任务前备份的全部文件路径及 SHA-256 一致；本次没有重新构建或改动该目录。

初次任务的临时备份、依赖和审计索引已删除；本次重跑新建的临时 DOM 依赖和临时索引也已删除。所有本次命令会话均已结束，没有启动浏览器、后台服务或其他常驻进程。

保留报告、样例、可复查的证据脚本和文本输出。详情见 [清理记录](./evidence/cleanup.txt)；临时目录位置记录仅作历史证据，对应目录已删除。

## 第二轮返工

已阅读 [浏览器检查报告](../002-mockup-browser/report.md) 第 3 节，按 V1–V3 在共享资源层修复，所有引用 kit 的页面均受益。以上章节保留首轮返工记录，本节为最新改动与检查结论；第一行会话标识未变。

### 改动

- V1：切换栏移到右下角，缩小内边距、间距和箭头尺寸；“设计稿”标题改为按钮，点击可折叠或展开。
- 折叠时通过历史替换写入 `bar=0`，展开时移除该参数；保留其他参数，刷新后恢复折叠，不使用本地存储。
- 仅有切换栏的页面为正文加入底部留白。初始化及折叠时测量切换栏高度，尺寸变化时由观察器更新，使滚动到底后末尾内容可避开切换栏。
- 切换栏高度有共享变量默认值；无切换栏的静态页面不加入额外留白。
- 技能第 5 节补充截图前可用 `?bar=0` 折叠遮挡内容的切换栏。
- V2：横排容器直接包含带标签的字段时，统一底边对齐，使按钮与输入控件底边齐平。
- V3：纵向容器直接包含的按钮默认保持内容宽度，靠左对齐；确需整行宽度时可加 `.btn.block`。
- 全套共享资源已重新复制到样例目录，页面 HTML 未修改；交互证据脚本新增折叠、直接参数打开、刷新保持和参数保留检查。

本轮修改范围如下：

```text
skills/in-progress/mockup/SKILL.md
skills/in-progress/mockup/kit/tokens.css
skills/in-progress/mockup/kit/mockup.css
skills/in-progress/mockup/kit/mockup.js
docs/tasks/001-mockup/evidence/sample/kit/
docs/tasks/001-mockup/evidence/test-interactions.mjs
docs/tasks/001-mockup/evidence/*.txt
docs/tasks/001-mockup/report.md
```

### 检查结果

指定检查已重跑并覆盖原证据：

| 检查 | 最新结果 | 证据 |
| --- | --- | --- |
| 仓库检查 | 通过，30 个技能 | [仓库输出](./evidence/repo-check.txt) |
| 中英文审计及基线对比 | 188 行既有告警，新增 0；原审计退出码仍为 1 | [审计输出](./evidence/english-audit.txt) |
| 纳入新增文档的扩展审计 | 包含最新技能及本报告，与基线告警集合一致 | [扩展输出](./evidence/english-audit-expanded.txt) |
| 告警集合对比 | 跟踪文档与扩展文档均无新增 | [对比输出](./evidence/english-delta.txt) |
| 交互检查 | 12 组纯 DOM 检查通过，包含新折叠与刷新检查 | [交互输出](./evidence/interactions.txt) |
| 样例自洽 | 通过；无未定义类，全部资源路径存在，5 个复制文件与技能一致 | [自洽输出](./evidence/sample-consistency.txt) |
| 脚本语法 | 通过 | [语法输出](./evidence/syntax.txt) |
| 行数 | 正文文件总计 72 行；变量 43、样式 95、脚本 149、骨架 37 行，均在限制内 | [行数输出](./evidence/line-counts.txt) |
| 空白与修改范围 | 通过；完整状态包含其他任务既有文件，均未修改 | [状态输出](./evidence/git-status.txt) |

DOM 检查用模拟尺寸验证留白变量写入，没有真实布局测量。右下角位置、底部内容可见性、筛选对齐和按钮实际宽度仍须后续真实浏览器复核；本轮没有启动浏览器、截图或宣称视觉验收通过。

### 清理与边界

临时依赖和临时审计索引已清理，所有本轮命令会话均已结束，没有启动浏览器或后台服务，清理记录已追加。没有重新打包，没有改其他技能或仓库检查脚本，没有提交 git。原打包目录名的约定维持上一轮已接受的结果。
