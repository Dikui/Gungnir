# Gungnir

简体中文的工程技能集，覆盖项目开发的完整链路：访谈打磨想法、整理需求与任务、TDD 实现、代码审查、领域建模、缺陷诊断和方法复查。支持 Claude Code、Codex、Grok 和 DeepSeek Harness。

基于 [mattpocock/skills](https://github.com/mattpocock/skills)，MIT 许可，见 [LICENSE](./LICENSE)。

<p align="center">
  <img src="./assets/support_img.png" alt="支持的 AI 工具" width="300">
</p>

## 快速开始

```bash
claude plugin marketplace add Dikui/Gungnir
claude plugin install gungnir@gungnir
```

然后在项目中：

1. 运行 `/gungnir:setup-dikui-skills`，为仓库配置规则文件、issue tracker、分流标签、领域文档和文档布局。每个仓库运行一次。
2. 不确定该用哪个技能时，运行 `/gungnir:ask-dikui`，它会根据当前任务推荐技能和使用顺序。

## 安装

| 平台 | 安装方式 | 调用示例 |
| --- | --- | --- |
| Claude Code（推荐） | 插件市场，见上方快速开始 | `/gungnir:ask-dikui` |
| Codex | `codex plugin marketplace add Dikui/Gungnir`<br>`codex plugin add gungnir@gungnir` | `$ask-dikui` |
| Grok | `grok plugin install Dikui/Gungnir#skills --trust` | — |
| DeepSeek Harness | 见 [dsh 插件说明](./dsh-plugin/README.md) | `/dk-ask-dikui` |
| 其他代理（平铺安装） | `npx skills@latest add Dikui/Gungnir` | 技能原名 |

- 插件安装只复制 `skills/` 目录。Claude Code 插件技能带 `gungnir:` 前缀，不会与其他来源的技能重名；平铺安装使用技能原名，可能重名。
- Grok 必须用 `#skills` 指定插件目录。

### 本地打包

在仓库根目录打包并安装本地 Claude Code 插件：

```bash
node scripts/package-plugin.mjs
claude plugin marketplace add ./dist
claude plugin install gungnir@gungnir
```

产物位于 `dist/plugins/gungnir/`，同时包含 Claude Code 和 Codex 插件清单，`dist` 中另有对应的本地 marketplace 清单。重复打包时可向脚本传入新的输出目录。

线上和本地 marketplace 都叫 `gungnir`，二者只能选一种，不要同时添加。

## 常用流程

完整的选择指南在 [ask-dikui](./skills/engineering/ask-dikui/SKILL.md) 中，这里只列主干。

**从想法到实现**

1. `/grill-me` 访谈打磨想法；在项目仓库中，它把术语和决策写入 `GLOSSARY.md` 与 ADR。
2. 一次会话能完成的，直接 `/implement`。
3. 需要多次会话的，`/to-spec` 整理需求，`/to-tickets` 拆成可独立验证的任务，再用 `/implement` 处理整个任务单目录：按依赖分批，同批任务并行开发。
4. `/implement` 内部用 `/tdd` 驱动实现，用 `/local-test` 做局部测试并沉淀测试，用 `/diff-review` 审查后提交。
5. 推送前 `/safe-push` 检查不应入库的内容；需要 PR 正文时用 `/pr-body`；结束后可用 `/retro` 复盘。

其他起点（缺陷积压、棘手缺陷、大任务规划、方案复查、实现比较、架构诊断）见 [ask-dikui](./skills/engineering/ask-dikui/SKILL.md)。

## 技能索引

技能分两层：**User-invoked** 入口技能通常由用户调用，**Skill-invoked** 基础技能通常由入口技能在执行中加载。分组只说明谁通常调用谁，不限制调用：所有技能都允许模型隐式调用，除 `grilling` 外用户也都能直接调用。详见[调用规则](./docs/invocation.md)。

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
- **[implement](./skills/engineering/implement/SKILL.md)**
  按任务单实现一份需求或一组任务：无依赖的任务并行开发，局部测试后请用户验收，通过后合入、推送并部署。
- **[improve-codebase-architecture](./skills/engineering/improve-codebase-architecture/SKILL.md)**
  查找可用小接口封装复杂行为的模块，生成可视化架构报告，再与用户讨论选中的方案。
- **[mockup](./skills/engineering/mockup/SKILL.md)**
  生成并维护长期保留的 HTML 界面设计稿，作为前端开发的参照。
- **[pr-body](./skills/engineering/pr-body/SKILL.md)**
  编写 PR 正文时使用。
- **[retro](./skills/engineering/retro/SKILL.md)**
  复盘一次编码会话。
- **[safe-push](./skills/engineering/safe-push/SKILL.md)**
  检查不应入库的内容，默认升修订号，提交并推送代码。
- **[setup-dikui-skills](./skills/engineering/setup-dikui-skills/SKILL.md)**
  初始化仓库：配置规则文件、issue tracker、分流标签、领域文档、文档布局、测试命令和 pre-push 钩子。
- **[to-spec](./skills/engineering/to-spec/SKILL.md)**
  将当前讨论整理为需求文档，发布到项目 issue tracker。
- **[to-tickets](./skills/engineering/to-tickets/SKILL.md)**
  将计划、需求文档或当前讨论拆成可独立验证的任务，注明依赖后发布到项目 tracker。
- **[trial](./skills/engineering/trial/SKILL.md)**
  在真实后端代码中并行实现两到三个方案，用同一组测试和测量比较，选定一版并删除其余。
- **[triage](./skills/engineering/triage/SKILL.md)**
  对 issue 和范围内的外部 PR 分类、验证并更新处理状态，整理出可交给代理的任务说明。
- **[wayfinder](./skills/engineering/wayfinder/SKILL.md)**
  为一次会话无法规划清楚的大任务建立决策地图，逐项解决问题，直到实施路径明确。

**Skill-invoked**

- **[codebase-design](./skills/engineering/codebase-design/SKILL.md)**
  用深模块原则设计接口、选择可替换位置，并提高代码的可测试性和可维护性。
- **[diff-review](./skills/engineering/diff-review/SKILL.md)**
  审查指定基准之后的代码变更，分别报告编码规范问题和需求实现问题。
- **[domain-modeling](./skills/engineering/domain-modeling/SKILL.md)**
  维护项目的领域术语和模型，并记录重要架构决策。
- **[local-test](./skills/engineering/local-test/SKILL.md)**
  只测试改动影响的范围，必要时构造场景测试，再筛选值得长期保留的测试写入项目。
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
  通过持续提问打磨计划或设计；在项目仓库中同时记录词汇表和 ADR。
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

## 禁止隐式调用

主插件技能都允许模型隐式调用（由 `scripts/check-repo.mjs` 检查）。若在自己的副本中要禁止某个技能被模型自动选用，各平台使用以下参数，设置后用户仍可显式调用：

| 平台 | 参数 | 效果 |
| --- | --- | --- |
| Claude Code | `SKILL.md` frontmatter 中 `disable-model-invocation: true` | 描述不进入模型上下文，模型和其他技能都不能通过 Skill 工具调用；用户仍可用 `/技能名` 调用 |
| Codex | `agents/openai.yaml` 中 `policy.allow_implicit_invocation: false` | 模型不会根据描述自动选用；用户仍可用 `$技能名` 调用 |
| DeepSeek Harness | 复用 `disable-model-invocation: true` | dsh 插件（`dsh-plugin/index.js`）将其转换为 `invocation.modelInvocable: false`；用户仍可用 `/dk-技能名` 调用 |

这些参数只限制平台的调用机制，模型按路径直接读取 `SKILL.md` 时不受限制。

## 升级说明

### 4.5.0

新增会话启动钩子，注入默认工作流；`/implement` 只有一张任务单时也派子代理；`/setup-dikui-skills` 增加 Testing 一节和按版本号运行全量测试的 pre-push 钩子。

### 3.0.0

插件与 marketplace 统一改名为 `gungnir`。已安装旧插件 `dikui-skills@dikui` 时，先卸载再按上面的命令安装；旧本地插件同样先卸载，再添加新的本地 marketplace。

```bash
claude plugin uninstall dikui-skills@dikui
```

技能 `code-review` 改名为 `diff-review`，`pr` 改名为 `pr-body`。
