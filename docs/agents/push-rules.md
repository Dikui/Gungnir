# 项目推送规则

- 仓库公开性：公开（GitHub `Dikui/Gungnir`）。
- 默认分支与受保护分支：默认分支 `main`；按惯例直接推送 `main`，不登记受保护分支。
- 允许推送的 remote 与目标分支：`origin`（`git@github.com:Dikui/Gungnir.git`）的 `main`。
- 提交约定：中文短句作为标题；升版本的提交写“版本升到 X”。
- 测试假数据目录及来源：无专门目录；测试脚本（`scripts/test-*.sh`）中的凭据形状值都在运行时拼接，源码中不出现完整字面量，不设豁免。
- 内部代号、内网或工单链接、未公开计划的资料入口：无。执行过程文件在 `.scratch/tasks/`，已被 `.gitignore` 忽略。

## 版本文件

- `skills/.claude-plugin/plugin.json` 的 `version`。
- `dsh-plugin/package.json` 的 `version`。
- `dsh-plugin/package-lock.json` 的顶层 `version` 和 `packages[""]` 中的 `version`，仅本包自身的两处，不含依赖条目。
- `dsh-plugin/README.md` 中安装命令里的 `dikui-gungnir-<版本>.tgz` 文件名。

只修改这里列出的本项目自身版本字段；未列出的文件（如 CHANGELOG、历史说明）不改。

## 追加与调整

```safe-push-deny
```

## 限定豁免

```safe-push-allow
```
