# Gungnir

面向项目开发的简体中文工程技能集，覆盖访谈、需求与任务、TDD、代码审查、领域建模和方法诊断。技能按入口技能与基础技能分层调用，可用于 Claude Code、Codex 和 DeepSeek Harness。

基于 [mattpocock/skills](https://github.com/mattpocock/skills)，MIT 许可，见 [LICENSE](./LICENSE)。

<p align="center">
  <img src="./assets/support_img.png" alt="支持的 AI 工具" width="300">
</p>

## 安装

首选通过 Claude Code 插件市场安装：技能带 `gungnir:` 前缀，例如 `/gungnir:ask-dikui`，不会与其他技能同名冲突。

```bash
claude plugin marketplace add Dikui/Gungnir
claude plugin install gungnir@gungnir
```

在仓库根目录打包并安装本地 Claude Code 插件：

```bash
node scripts/package-plugin.mjs
claude plugin marketplace add ./dist
claude plugin install gungnir@gungnir
```

打包产物位于 `dist/plugins/gungnir/`，同时包含 Claude Code 和 Codex 插件清单；`dist` 中也包含对应的本地 marketplace 清单。重复打包时可向脚本传入新的输出目录。

线上 marketplace 和本地打包 marketplace 都叫 `gungnir`，二者选一种安装，不要同时添加。

通过 skills 安装到所选代理或项目是平铺安装，技能使用自身名称，可能与其他来源的技能同名：

```bash
npx skills@latest add Dikui/Gungnir
```

DeepSeek Harness 安装步骤见 [dsh 插件说明](./dsh-plugin/README.md)，技能命令使用 `zh-` 前缀，例如 `/zh-ask-dikui`。

### 3.0.0 不兼容变更

插件与 marketplace 统一改名为 `gungnir`。已安装旧插件 `dikui-skills@dikui` 时，先卸载，再按上面的新命令安装：

```bash
claude plugin uninstall dikui-skills@dikui
```

旧本地插件同样需先卸载，再添加新的本地 marketplace。

技能 `code-review` 改名为 `diff-review`，`pr` 改名为 `pr-body`；调用命令和引用同步使用新名称。

## 调用方式

所有技能都允许模型在对话中隐式调用。入口技能（**User-invoked**）通常由用户调用：Claude Code 使用 `/技能名`，Codex 使用 `$技能名`。
首次使用时运行 `/setup-dikui-skills` 配置项目；选择方法时运行 `/ask-dikui`。

基础技能（**Skill-invoked**）通常由入口技能在执行中加载。分组只说明谁通常调用谁，不代表调用限制；`grilling` 保留 `user-invocable: false`，不能由用户直接调用。完整层级和配置见 [调用规则](./docs/invocation.md)。

### 硬约束参数

需要禁止模型隐式调用某个技能时，各平台使用以下参数。设置后用户仍可显式调用；本仓库目前所有技能都允许隐式调用，不设置这些参数（`scripts/check-repo.mjs` 会拒绝）。

| 平台 | 参数 | 效果 |
| --- | --- | --- |
| Claude Code | `SKILL.md` frontmatter 中 `disable-model-invocation: true` | 技能描述不进入模型上下文，模型和其他技能都不能通过 Skill 工具调用；用户仍可用 `/技能名` 调用 |
| Codex | `agents/openai.yaml` 中 `policy.allow_implicit_invocation: false` | 模型不会根据描述自动选用；用户仍可用 `$技能名` 调用 |
| DeepSeek Harness（dsh） | 无独立参数，复用 `disable-model-invocation: true` | dsh 插件（`dsh-plugin/index.js`）把它转换为 `invocation.modelInvocable: false` 交给 dsh；用户仍可用 `/zh-技能名` 调用 |

这些参数只限制平台的调用机制；模型按路径直接读取 `SKILL.md` 时不受限制。

## 技能索引

### Engineering

**User-invoked**

- **[ablation](./skills/engineering/ablation/SKILL.md)**
  逐个去掉机制并测量，确定收益来自哪个机制。
- **[ask-dikui](./skills/engineering/ask-dikui/SKILL.md)**
  根据当前任务推荐合适的技能及使用顺序。
- **[cohesion-coupling](./skills/engineering/cohesion-coupling/SKILL.md)**
  用职责表、依赖图和共同修改记录，诊断模块的内聚与耦合问题。
- **[diagnosing-bugs](./skills/engineering/diagnosing-bugs/SKILL.md)**
  通过复现、缩小场景、验证假设和回归测试，诊断棘手缺陷或性能回退。
- **[grill-with-docs](./skills/engineering/grill-with-docs/SKILL.md)**
  通过持续访谈打磨计划或设计，并记录 ADR 和词汇表。
- **[implement](./skills/engineering/implement/SKILL.md)**
  由当前会话自己编码，实现一张任务单或一份小需求，完成后提交到当前分支。
- **[improve-codebase-architecture](./skills/engineering/improve-codebase-architecture/SKILL.md)**
  查找可用小接口封装复杂行为的模块，生成可视化架构报告，再与用户讨论选中的方案。
- **[mockup](./skills/engineering/mockup/SKILL.md)**
  生成并维护长期保留的 HTML 界面设计稿，作为前端开发的参照。
- **[pr-body](./skills/engineering/pr-body/SKILL.md)**
  编写 PR 正文时使用。
- **[retro](./skills/engineering/retro/SKILL.md)**
  复盘一次编码会话。
- **[safe-push](./skills/engineering/safe-push/SKILL.md)**
  检查不应入库的内容，确认版本号，经确认后提交并推送代码。
- **[setup-dikui-skills](./skills/engineering/setup-dikui-skills/SKILL.md)**
  初始化仓库：配置规则文件、issue tracker、分流标签、领域文档、文档布局。
- **[to-spec](./skills/engineering/to-spec/SKILL.md)**
  将当前讨论整理为需求文档，发布到项目 issue tracker。
- **[to-tickets](./skills/engineering/to-tickets/SKILL.md)**
  将计划、需求文档或当前讨论拆成可独立验证的任务，注明依赖后发布到项目 tracker。
- **[triage](./skills/engineering/triage/SKILL.md)**
  对 issue 和范围内的外部 PR 分类、验证并更新处理状态，整理出可交给代理的任务说明。
- **[wayfinder](./skills/engineering/wayfinder/SKILL.md)**
  为一次会话无法规划清楚的大任务建立决策地图，逐项解决问题，直到实施路径明确。

**Skill-invoked**

- **[diff-review](./skills/engineering/diff-review/SKILL.md)**
  审查指定基准之后的代码变更，分别报告编码规范问题和需求实现问题。
- **[codebase-design](./skills/engineering/codebase-design/SKILL.md)**
  用深模块原则设计接口、选择可替换位置，并提高代码的可测试性和可维护性。
- **[domain-modeling](./skills/engineering/domain-modeling/SKILL.md)**
  维护项目的领域术语和模型，并记录重要架构决策。
- **[prototype](./skills/engineering/prototype/SKILL.md)**
  用临时原型验证一个设计问题：逻辑和状态是否合理，或界面应该是什么样。
- **[research](./skills/engineering/research/SKILL.md)**
  基于一手来源调研问题，并将结论和引用保存为仓库中的 Markdown 文件。
- **[tdd](./skills/engineering/tdd/SKILL.md)**
  先写测试，再开发功能或修复缺陷的 red-green 循环。

### Productivity

**User-invoked**

- **[adversarial-review](./skills/productivity/adversarial-review/SKILL.md)**
  让独立攻击方寻找计划、需求或代码的反例，核实后报告成立的反例。
- **[first-principles](./skills/productivity/first-principles/SKILL.md)**
  从目标和已验证事实重新推导方案，判断当前方向是否成立。
- **[grill-me](./skills/productivity/grill-me/SKILL.md)**
  通过持续提问打磨计划或设计。
- **[handoff](./skills/productivity/handoff/SKILL.md)**
  将当前对话整理成交接文档，供其他代理继续工作。
- **[occams-razor](./skills/productivity/occams-razor/SKILL.md)**
  把方案的每个组成追溯到需求或证据，找出可以删除的部分。
- **[wait-what](./skills/productivity/wait-what/SKILL.md)**
  用户没听懂时，补足背景，并按理解情况逐步升级解释方式。

**Skill-invoked**

- **[grilling](./skills/productivity/grilling/SKILL.md)**
  围绕计划、决策或想法持续访谈的方法。
- **[writing-for-agents](./skills/productivity/writing-for-agents/SKILL.md)**
  编写或精简供代理阅读的技能、AGENTS.md、CLAUDE.md 和参考文档。

### Misc

**User-invoked**

暂无技能。

**Skill-invoked**

暂无技能。
