#!/bin/sh
# 把本机 Claude、Codex、Grok 里装的 Gungnir 插件更新到远端最新版。推送到 main 后运行。
# 没装某个 CLI 或没装插件的就跳过；任一处失败不影响其他处，最后非零退出。
# shortcut: dsh 插件从本地 tarball 安装、本机目前没装，不在这里同步；装上后再补。
set -u
fail=0
run() { echo "> $*"; "$@" || { echo "失败：$*" >&2; fail=1; }; }

if command -v claude >/dev/null && claude plugin list 2>/dev/null | grep -q 'gungnir@gungnir'; then
  run claude plugin marketplace update gungnir
  run claude plugin update gungnir@gungnir
else echo "跳过 Claude：未安装 gungnir"; fi

if command -v codex >/dev/null && codex plugin list 2>/dev/null | grep -q 'gungnir@gungnir'; then
  run codex plugin marketplace upgrade gungnir
else echo "跳过 Codex：未安装 gungnir"; fi

if command -v grok >/dev/null && grok plugin list 2>/dev/null | grep -q 'Dikui/Gungnir'; then
  name=$(grok plugin list 2>/dev/null | grep 'Dikui/Gungnir' | sed -E 's/^[^:]+: *([^ ]+) .*/\1/' | head -n1)
  run grok plugin update "$name"
else echo "跳过 Grok：未安装 gungnir"; fi

echo "--- 当前版本"
command -v claude >/dev/null && claude plugin list 2>/dev/null | grep -A1 'gungnir@gungnir' | grep -i version
command -v codex >/dev/null && codex plugin list 2>/dev/null | grep 'gungnir@gungnir'
command -v grok >/dev/null && grok plugin list 2>/dev/null | grep 'Dikui/Gungnir'
exit $fail
