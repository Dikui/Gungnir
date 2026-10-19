# Optional

独立选装的稳定技能，位于插件根目录 `skills/` 之外，不随 Gungnir 主 plugin 或 dsh 包发布。通过 `skills add --full-depth --skill <名称>` 选择所需技能；`--all --full-depth` 表示包含本分组。

## User-invoked

只能由用户显式调用。Codex 使用 `$技能名`；外部运行组件在首次使用时才下载，不因安装 Gungnir 主包而安装。

- **[whiteboard](./whiteboard/SKILL.md)** - 让本地或服务器上的 Codex 与人工共同编辑 Excalidraw 白板，并导出、恢复画板文件。

## Skill-invoked

暂无技能。
