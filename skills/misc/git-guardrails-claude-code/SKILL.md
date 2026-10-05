---
name: git-guardrails-claude-code
description: 为 Claude Code 配置钩子，阻止 git push、硬重置、强制清理等危险操作。
disable-model-invocation: true
---

# 配置 Git 操作保护

配置 `PreToolUse` 钩子，在 Claude 执行危险 Git 命令前阻止操作。

## 拦截范围

- `git push`（包括 `--force` 在内的所有形式）
- `git reset --hard`
- `git clean -f` / `git clean -fd`
- `git branch -D`
- `git checkout .` / `git restore .`

操作被阻止时，向 Claude 返回无权执行该命令的提示。

## 步骤

### 1. 确定安装范围

询问用户：只对当前项目生效（`.claude/settings.json`），还是对所有项目生效（`~/.claude/settings.json`）？

### 2. 复制脚本

使用附带的脚本：[scripts/block-dangerous-git.sh](scripts/block-dangerous-git.sh)。

按安装范围复制到：

- **当前项目**：`.claude/hooks/block-dangerous-git.sh`
- **所有项目**：`~/.claude/hooks/block-dangerous-git.sh`

用 `chmod +x` 让它可执行。

### 3. 添加配置

将钩子加入对应的配置文件：

**当前项目**（`.claude/settings.json`）：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/block-dangerous-git.sh"
          }
        ]
      }
    ]
  }
}
```

**所有项目**（`~/.claude/settings.json`）：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/block-dangerous-git.sh"
          }
        ]
      }
    ]
  }
}
```

配置文件已存在时，将钩子合并到 `hooks.PreToolUse` 数组，保留其他配置。

### 4. 确定是否自定义

询问用户是否需要增减拦截规则，再修改复制后的脚本。

### 5. 验证

运行快速测试：

```bash
echo '{"tool_input":{"command":"git push origin main"}}' | <path-to-script>
```

脚本应以退出码 `2` 结束，并向 `stderr` 打印 `BLOCKED` 提示。
