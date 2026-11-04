#!/bin/sh
# 自检 setup-dikui-skills/pre-push.sh：只有默认分支上版本号前两位变化时才运行全量测试。
set -eu
HOOK="$(cd "$(dirname "$0")/.." && pwd)/skills/engineering/setup-dikui-skills/pre-push.sh"
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
git init -q --bare "$T/remote.git"
git init -q -b main "$T/work"; cd "$T/work"
git config user.email t@example.com; git config user.name t
git remote add origin "$T/remote.git"
mkdir -p .githooks; git config core.hooksPath .githooks
sed -e "s|^FULL_TEST=.*|FULL_TEST='echo run >> \"$T/ran\"; [ ! -f \"$T/fail\" ]'|" "$HOOK" > .githooks/pre-push
chmod +x .githooks/pre-push

ver() { printf '{\n  "name": "x",\n  "version": "%s"\n}\n' "$1" > package.json; git add package.json; git commit -qm "v$1"; }
runs() { [ -f "$T/ran" ] && wc -l < "$T/ran" | tr -d ' ' || echo 0; }
expect() { [ "$(runs)" = "$1" ] || { echo "FAIL：$2，期望全量运行 $1 次，实际 $(runs) 次" >&2; exit 1; }; }

ver 0.1.0; git push -q origin main 2>/dev/null; expect 1 '首次推送'
ver 0.1.1; git push -q origin main 2>/dev/null; expect 1 '只升修订号'
echo a > a; git add a; git commit -qm a; git push -q origin main 2>/dev/null; expect 1 '不改版本'
ver 0.2.0; git push -q origin main 2>/dev/null; expect 2 '升次版本'
git switch -qc feature; ver 1.0.0; git push -q origin feature 2>/dev/null; expect 2 '推送非默认分支'
git switch -q main; ver 1.0.0; touch "$T/fail"
if git push -q origin main 2>/dev/null; then echo 'FAIL：全量失败时推送应被拒绝' >&2; exit 1; fi
expect 3 '升主版本且全量失败'
rm "$T/fail"; git push -q origin main 2>/dev/null; expect 4 '修复后重推'

sed -i '' -e "s|^VERSION_FILE=.*|VERSION_FILE='VERSION'|" .githooks/pre-push 2>/dev/null || sed -i -e "s|^VERSION_FILE=.*|VERSION_FILE='VERSION'|" .githooks/pre-push
printf '1.0.0\n' > VERSION; git add VERSION; git commit -qm vf; git push -q origin main 2>/dev/null; expect 5 '远端还没有版本文件，按变化处理'
printf '1.0.1\n' > VERSION; git add VERSION; git commit -qm vf1; git push -q origin main 2>/dev/null; expect 5 'VERSION 文件，只升修订号'
printf '1.1.0\n' > VERSION; git add VERSION; git commit -qm vf2; git push -q origin main 2>/dev/null; expect 6 'VERSION 文件，升次版本'
echo 'pre-push 自检全部通过'
