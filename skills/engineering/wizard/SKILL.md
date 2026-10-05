---
name: wizard
description: 生成交互式 Bash 向导，引导用户完成代理无法代办的服务配置、凭证设置或迁移步骤。
disable-model-invocation: true
---

# 生成人工操作向导

用 Bash 脚本引导用户完成只有人能操作的流程。脚本打开网址、说明点击和复制步骤、收集值并写入 `.env` 或 GitHub secrets，同时显示进度并分阶段确认。代理能直接完成的步骤不使用此技能。

使用 [template.sh](template.sh) 已有的进度、确认、跨平台网址打开（含 WSL）、秘密输入、幂等 `.env` 更新、`gh secret`/`gh variable` 写入和收尾摘要。只编写阶段内容，不修改 `STAGES` 标记之上的公共代码。

默认将向导放在临时工作目录或 `scripts/` 中，运行结束后删除。只有用户需要长期复用的配置流程时，才提交到仓库。

## 1. 确定流程

先读取项目，再询问缺失信息：

- 配置任务：查看 `.env`、`.env.example`、`.env.*`、`README`、`docker-compose*`、框架配置和 `.github/workflows/*`。每处 `secrets.*` / `vars.*` 引用对应向导需要提供的值。
- 迁移任务：确定当前状态、目标状态及其中的不可逆操作。

按顺序列出每个阶段及其产出，让用户确认、增删或重排。

完成条件：每个阶段已命名；每个值都明确获取位置、写入位置（`.env`、GitHub secret、两者或都不写），以及是否需要隐藏输入。纯操作阶段可以不产出值。

## 2. 写清操作路径

为每个阶段说明打开哪个 URL、如何操作、在哪里获取值，以及写入哪个变量。例如“Dashboard → Developers → API keys → Reveal test key → copy”。

不清楚当前界面或准确命令时，查阅文档或询问用户，不编造步骤。

完成条件：陌生用户也能按具体指令操作。

## 3. 编写向导

复制 `template.sh` 到目标路径。替换示例阶段，每项任务一个 `stage`，按依赖顺序排列，并将 `TOTAL_STAGES` 设为实际数量。

使用已有函数：`stage`、`say`/`step`、`open_url`、`ask`/`ask_secret`、`write_env`、`set_secret`/`set_var`、`pause`/`confirm`。

- 索取网页中的值前，先打开对应 URL。
- 秘密值用 `ask_secret` 输入，需要持久化的值用 `write_env` 写入。
- 只有 CI 确实需要的值才用 `set_secret`。
- 不可逆操作前调用 `confirm`。
- 每个 `stage` 会清屏，只安排一项任务，避免必要说明滚出视野。
- 保留 `STAGES` 标记之上的公共代码原样。

## 4. 验证与交接

运行 `bash -n <script>`，有 `shellcheck` 时也运行它，再执行 `chmod +x <script>`。

不要自行完整运行向导：它会打开浏览器并等待人工输入。改为静态核对每个值是否被收集并写到约定位置，每个 `set_secret` 名称是否精确对应 CI 的 `secrets.*` 引用。

告诉用户运行方式。若用户需要可重复使用的流程，将脚本提交到仓库，并从 README 链接到它。
