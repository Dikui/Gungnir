#!/bin/bash
# All mutations stay in disposable fixture repositories, never the source repo.
set -u
export LC_ALL=C
repo_root=$(cd "$(dirname "$0")/.." && pwd) || exit 2
scanner="$repo_root/skills/engineering/safe-push/scripts/scan.sh"
installer="$repo_root/skills/engineering/setup-dikui-skills/hooks/install.sh"
tmp=$(mktemp -d "${TMPDIR:-/tmp}/test-git-hooks.XXXXXX") || exit 2
trap 'rm -rf "$tmp"' EXIT
trap 'exit 2' HUP INT TERM
passes=0 failures=0 serial=0
# Credential-shaped values exist only at runtime. No complete literal in source.
key=$(printf '%s%s%s' 'gh' 'p_' 'abcdefghijklmnopqrstuvwxyz0123456789ABCD')
: > "$tmp/all-output"
pass() { passes=$((passes+1)); printf 'PASS %s\n' "$1"; }
fail() { failures=$((failures+1)); printf 'FAIL %s\n' "$1"; }
check() { if "${@:2}"; then pass "$1"; else fail "$1"; fi; }
# Fixture repo with a pushed main and a feature branch; hooks not yet installed.
newrepo() {
    serial=$((serial+1))
    fixture="$tmp/case-$serial"
    remote_dir="$tmp/remote-$serial.git"
    mkdir -p "$fixture" || exit 2
    git init --bare -q "$remote_dir" || exit 2
    cd "$fixture" || exit 2
    git init -q || exit 2
    git symbolic-ref HEAD refs/heads/main || exit 2
    git config user.name 'Fixture User'
    git config user.email 'fixture@example.invalid'
    printf 'baseline\n' > readme.txt
    git add -- readme.txt
    git commit -qm baseline || exit 2
    git remote add origin "$remote_dir"
    git push -q -u origin main || exit 2
    git checkout -qb feat || exit 2
}
install() { "$BASH" "$installer" --scan "$scanner" > "$tmp/out" 2> "$tmp/err"; result=$?; cat "$tmp/out" "$tmp/err" >> "$tmp/all-output"; }
run() { "$@" > "$tmp/out" 2>&1; result=$?; cat "$tmp/out" >> "$tmp/all-output"; }
commit_file() { printf '%s\n' "$2" > "$1"; git add -- "$1"; git commit -q "${@:3}" -m "add $1"; }
remote_ref() { git --git-dir="$remote_dir" rev-parse --verify -q "refs/heads/$1" 2>/dev/null; }
snapshot() { find . -path ./.git -prune -o -type f -print | LC_ALL=C sort | xargs shasum 2>/dev/null; }
no_key_in_output() { ! grep -F "$key" "$tmp/out" >/dev/null; }

# 1. install succeeds (default scan path inside the repo layout)
newrepo
"$BASH" "$installer" > "$tmp/out" 2> "$tmp/err"; result=$?
cat "$tmp/out" "$tmp/err" >> "$tmp/all-output"
check 'install exits 0 with default scan path' [ "$result" -eq 0 ]
check 'install creates executable hooks' [ -x .githooks/pre-commit -a -x .githooks/pre-push -a -x .githooks/lib/scan.sh ]
check 'install sets core.hooksPath' [ "$(git config core.hooksPath)" = .githooks ]

# 2. idempotent
before=$(snapshot)
install
check 'second install exits 0' [ "$result" -eq 0 ]
check 'second install leaves files unchanged' [ "$(snapshot)" = "$before" ]

# 3. existing husky
newrepo
mkdir .husky
before=$(snapshot)
install
check 'husky: exit 3' [ "$result" -eq 3 ]
check 'husky: output names the hit' grep -F '.husky' "$tmp/out"
check 'husky: no files changed' [ "$(snapshot)" = "$before" ]
check 'husky: core.hooksPath unset' [ -z "$(git config --get core.hooksPath)" ]
check 'husky: no .githooks created' [ ! -e .githooks ]

# other schemes
newrepo
git config core.hooksPath custom-hooks
install
check 'other core.hooksPath: exit 3' [ "$result" -eq 3 ]
check 'other core.hooksPath: value untouched' [ "$(git config core.hooksPath)" = custom-hooks ]
newrepo
printf 'repos: []\n' > .pre-commit-config.yaml
install
check 'pre-commit-config: exit 3' [ "$result" -eq 3 ]
newrepo
printf 'x\n' > lefthook.yml
install
check 'lefthook: exit 3' [ "$result" -eq 3 ]

# 4. existing .git/hooks/pre-commit (non-sample)
newrepo
printf '#!/bin/sh\nexit 0\n' > .git/hooks/pre-commit
printf '#!/bin/sh\nexit 0\n' > .git/hooks/pre-push.sample
install
check '.git/hooks/pre-commit: exit 3' [ "$result" -eq 3 ]
check '.git/hooks/pre-commit: no .githooks' [ ! -e .githooks ]
rm .git/hooks/pre-commit
install
check '.sample files are ignored' [ "$result" -eq 0 ]

# 5. foreign .githooks/pre-commit
newrepo
mkdir .githooks
printf '#!/bin/sh\necho mine\n' > .githooks/pre-commit
before=$(snapshot)
install
check 'foreign .githooks/pre-commit: exit 3' [ "$result" -eq 3 ]
check 'foreign .githooks/pre-commit: unchanged' [ "$(snapshot)" = "$before" ]
check 'foreign .githooks/pre-commit: core.hooksPath unset' [ -z "$(git config --get core.hooksPath)" ]

# errors
mkdir -p "$tmp/not-git"; cd "$tmp/not-git" || exit 2
install
check 'outside git: exit 2' [ "$result" -eq 2 ]
newrepo
"$BASH" "$installer" --scan "$tmp/missing-scan.sh" > "$tmp/out" 2> "$tmp/err"; result=$?
check 'missing scan.sh: exit 2' [ "$result" -eq 2 ]

# 6. commit with a fake secret is rejected, nothing leaks
newrepo; install
printf 'value = %s\n' "$key" > secret.txt
git add -- secret.txt
run git commit -m 'add secret'
check 'secret commit rejected' [ "$result" -ne 0 ]
check 'secret commit output does not contain the secret' no_key_in_output
check 'secret commit leaves no new commit' [ "$(git rev-list --count HEAD)" -eq 1 ]

# 7. normal commit
git reset -q -- secret.txt; rm -f secret.txt
printf 'ordinary\n' > ok.txt
git add -- ok.txt
run git commit -m 'add ok'
check 'normal commit succeeds' [ "$result" -eq 0 ]

# 8. push a new branch
run git push origin feat
check 'push new clean branch succeeds' [ "$result" -eq 0 ]
check 'new branch reached the remote' [ -n "$(remote_ref feat)" ]

# push of a following clean commit (fast-forward) succeeds
commit_file more.txt 'more'
run git push origin feat
check 'fast-forward push succeeds' [ "$result" -eq 0 ]

# 9. force push is rejected
good=$(remote_ref feat)
git reset -q --hard HEAD~1
commit_file other.txt 'different'
run git push --force origin feat
check 'force push rejected' [ "$result" -ne 0 ]
check 'force push left remote ref unchanged' [ "$(remote_ref feat)" = "$good" ]

# 10. deleting a remote branch is rejected
run git push origin --delete feat
check 'remote branch delete rejected' [ "$result" -ne 0 ]
check 'remote branch still exists' [ -n "$(remote_ref feat)" ]

# tags pass through
git tag v-test
run git push origin v-test
check 'tag push is not blocked' [ "$result" -eq 0 ]

# 11. protected branches
newrepo; install
mkdir -p docs/agents
cat > docs/agents/push-rules.md <<'RULES'
```safe-push-protected
# comment line
release
```
RULES
git checkout -qb release
commit_file r.txt 'r'
run git push origin release
check 'push to protected branch rejected' [ "$result" -ne 0 ]
check 'protected branch not created on remote' [ -z "$(remote_ref release)" ]
git checkout -qb unlisted
run git push origin unlisted
check 'push to unlisted branch succeeds' [ "$result" -eq 0 ]
rm docs/agents/push-rules.md
run git push origin release
check 'no rules file protects nothing' [ "$result" -eq 0 ]

# a protected block does not break the scanner
newrepo
mkdir -p docs/agents
printf '```safe-push-protected\nmain\n```\n```safe-push-deny\nblock 5 NOTHING_MATCHES\n```\n' > docs/agents/push-rules.md
printf 'fine\n' >> readme.txt; git add -- readme.txt
run "$BASH" "$scanner" --staged
check 'scan.sh ignores the protected block' [ "$result" -eq 0 ]

# 12. history containing a secret is rejected on push
newrepo; install
commit_file leak.txt "value = $key" --no-verify
commit_file leak.txt 'clean now'
run git push origin feat
check 'push with earlier secret commit rejected' [ "$result" -ne 0 ]
check 'push output does not contain the secret' no_key_in_output
check 'rejected push did not reach the remote' [ -z "$(remote_ref feat)" ]

# existing remote branch: only new commits are scanned
newrepo; install
commit_file a.txt 'a'
run git push origin feat
commit_file leak.txt "value = $key" --no-verify
run git push origin feat
check 'push of a new secret commit to existing branch rejected' [ "$result" -ne 0 ]

# pushing something other than HEAD is rejected
newrepo; install
commit_file a.txt 'a'
git branch side
git checkout -q main
run git push origin side
check 'pushing a non-HEAD branch rejected' [ "$result" -ne 0 ]

# 13. scan.sh: .scratch/tasks blocks category 3, other .scratch paths do not
newrepo
mkdir -p .scratch/tasks/x
printf 'report\n' > .scratch/tasks/x/report.md
git add -- .scratch/tasks/x/report.md
run "$BASH" "$scanner" --staged
check '.scratch/tasks blocks category 3' awk -F '\t' '$1=="block" && $2==3 { f=1 } END { exit !f }' "$tmp/out"
git reset -q; rm -rf .scratch
mkdir -p .scratch/feat/issues
printf 'issue\n' > .scratch/feat/issues/01-a.md
git add -- .scratch/feat/issues/01-a.md
run "$BASH" "$scanner" --staged
check '.scratch/<feature>/issues has no category 3' awk -F '\t' '$2==3 { f=1 } END { exit f }' "$tmp/out"

# 14. first commit after install: hook scripts and scan.sh must not trip the scanner
newrepo; install
git add .githooks
run git commit -m 'add hooks'
check 'first commit after install succeeds' [ "$result" -eq 0 ]
run git push origin feat
check 'pushing the hooks commit succeeds' [ "$result" -eq 0 ]

# 15. the template copied verbatim does not protect main
newrepo; install
mkdir -p docs/agents
cp "$repo_root/skills/engineering/safe-push/push-rules-template.md" docs/agents/push-rules.md
git add docs/agents/push-rules.md
run git commit -m 'add push rules'
check 'committing the unmodified template succeeds' [ "$result" -eq 0 ]
git checkout -q main
git merge -q feat
run git push origin main
check 'push to main is not rejected by the template' [ "$result" -eq 0 ]
check 'main advanced on the remote' [ "$(remote_ref main)" = "$(git rev-parse main)" ]

# bash 3.2 syntax and no leak across all output
for f in pre-commit pre-push install.sh; do
    check "bash -n $f" bash -n "$repo_root/skills/engineering/setup-dikui-skills/hooks/$f"
done
check 'all output redacts the generated credential' sh -c '! grep -F "$1" "$2" >/dev/null' _ "$key" "$tmp/all-output"
printf 'Summary: %s PASS, %s FAIL\n' "$passes" "$failures"
[ "$failures" -eq 0 ]
