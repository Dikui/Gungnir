#!/bin/bash
# All mutations stay in disposable fixture repositories, never the source repo.
set -u
export LC_ALL=C
repo_root=$(cd "$(dirname "$0")/.." && pwd) || exit 2
scanner="$repo_root/skills/engineering/safe-push/scripts/scan.sh"
tmp=$(mktemp -d "${TMPDIR:-/tmp}/test-safe-push.XXXXXX") || exit 2
trap 'rm -rf "$tmp"' EXIT
trap 'exit 2' HUP INT TERM
passes=0 failures=0 serial=0
# Credential-shaped values exist only at runtime. No complete literal in source.
key=$(printf '%s%s%s' 'gh' 'p_' 'abcdefghijklmnopqrstuvwxyz0123456789ABCD')
generic=$(printf '%s%s' 'synthetic_' 'password_value')
cloud=$(printf '%s%s%s' 'AK' 'IA' '0123456789ABCDEF')
: > "$tmp/all-output"
pass() { passes=$((passes+1)); printf 'PASS %s\n' "$1"; }
fail() { failures=$((failures+1)); printf 'FAIL %s\n' "$1"; }
newrepo() {
    serial=$((serial+1))
    fixture="$tmp/case-$serial"
    mkdir -p "$fixture" || exit 2
    git init --bare -q "$tmp/remote-$serial.git" || exit 2
    cd "$fixture" || exit 2
    git init -q || exit 2
    git symbolic-ref HEAD refs/heads/main || exit 2
    git config user.name 'Fixture User'
    git config user.email 'fixture@example.invalid'
    git config core.autocrlf false
    git config core.filemode true
    git config core.hooksPath "$tmp/no-hooks"
    printf 'baseline\n' > readme.txt
    git add -- readme.txt
    git commit -qm baseline || exit 2
    git remote add origin "$tmp/remote-$serial.git"
    git push -q -u origin main || exit 2
    git symbolic-ref refs/remotes/origin/HEAD refs/remotes/origin/main
    git checkout -qb topic --track origin/main || exit 2
}
scan() {
    "$BASH" "$scanner" --remote origin --target topic "$@" > "$tmp/out" 2> "$tmp/err"
    result=$?
    cat "$tmp/out" "$tmp/err" >> "$tmp/all-output"
}
has() { awk -F '\t' -v level="$1" -v category="$2" '$1==level && $2==category { found=1 } END { exit !found }' "$tmp/out"; }
assert_has() { if has "$2" "$3"; then pass "$1"; else fail "$1"; fi; }
assert_code() { if [ "$result" -eq "$2" ]; then pass "$1"; else fail "$1"; fi; }
rules() { mkdir -p docs/agents; cat > docs/agents/push-rules.md; }
newrepo
printf 'normal change\n' >> readme.txt
git add -- readme.txt
scan --staged --unpushed
if [ "$result" -eq 0 ] && [ ! -s "$tmp/out" ]; then pass 'clean change: code 0 and no output'; else fail 'clean change'; fi

newrepo
printf 'value = %s\n' "$key" > secret.txt
git add -- secret.txt
scan --staged
assert_has 'category 1 credential blocks' block 1
assert_code 'credential exit code 1' 1
git restore --staged -- secret.txt
printf 'value = %s\n' "$cloud" > cloud.txt
git add -- cloud.txt
scan --staged
assert_has 'category 1 cloud prefix' block 1
if grep -F "$key" "$tmp/out" "$tmp/err" >/dev/null || grep -F "$cloud" "$tmp/out" "$tmp/err" >/dev/null; then fail 'redaction stdout and stderr'; else pass 'redaction stdout and stderr'; fi

newrepo
rules <<'RULES'
```safe-push-deny
block 2 REAL_CUSTOMER_EXPORT
warn 5 INTERNAL_CODENAME
warn 9 unrelated-file
```
RULES
printf 'REAL_CUSTOMER_EXPORT\nINTERNAL_CODENAME\n' > unrelated-file.txt
git add -- unrelated-file.txt
scan --staged
assert_has 'category 2 project rule blocks real data marker' block 2
assert_has 'category 5 internal marker warns' warn 5
assert_has 'category 9 unrelated path warns' warn 9

newrepo
mkdir -p docs/tasks/run
printf 'agent report\n' > docs/tasks/run/report.md
git add -- docs/tasks/run/report.md
scan --staged
assert_has 'category 3 agent artifact blocks' block 3

# Check each path independently, including nested project directories.
for prefix in '' 'packages/a/'; do
    for path in '.claude/settings.json' '.claude/CLAUDE.md' '.claude/skills/x/SKILL.md' '.claude/agents/a.md' '.claude/commands/c.md' '.claude/hooks/h.sh' '.claude/output-styles/s.md' '.claude/custom/file' '.agents/skills/x/SKILL.md'; do
        newrepo
        path="$prefix$path"
        mkdir -p "$(dirname "$path")"
        printf 'shared project configuration\n' > "$path"
        git add -- "$path"
        scan --staged
        if [ "$result" -eq 0 ] && [ ! -s "$tmp/out" ]; then pass "shared path has no category 3 or other findings: $path"; else fail "shared path: $path"; fi
    done
    for path in '.claude/settings.local.json' 'CLAUDE.local.md'; do
        newrepo
        path="$prefix$path"
        mkdir -p "$(dirname "$path")"
        printf 'local configuration\n' > "$path"
        git add -- "$path"
        scan --staged
        if [ "$result" -eq 0 ] && awk -F '\t' -v path="$path" 'NF!=5 || $1!="warn" || $2!=10 || $3!=path { bad=1 } END { exit (bad || NR!=1) }' "$tmp/out"; then pass "local file has only category 10 warning: $path"; else fail "local file: $path"; fi
    done
    for path in '.claude/worktrees/x/file' '.claude/projects/p/s.jsonl' '.claude/todos/t.json' '.claude/shell-snapshots/s.sh' '.claude/file-history/f/file' '.claude/statsig/state.json' '.agents/other/file' '.agents/skills-extra/file' '.agents/file' '.agents/skills/x/.agents/other/file' '.agents/skills/x/.claude/projects/p/file'; do
        newrepo
        path="$prefix$path"
        mkdir -p "$(dirname "$path")"
        printf 'local agent state\n' > "$path"
        git add -- "$path"
        scan --staged
        if [ "$result" -eq 1 ] && has block 3; then pass "local agent path blocks category 3: $path"; else fail "local agent path: $path"; fi
    done
    newrepo
    path="$prefix.claude/.credentials.json"
    mkdir -p "$(dirname "$path")"
    printf '{}\n' > "$path"
    git add -- "$path"
    scan --staged
    if [ "$result" -eq 1 ] && has block 1 && ! has block 3 && ! has warn 3; then pass "login credential filename blocks only category 1: $path"; else fail "login credential filename: $path"; fi

    newrepo
    path="$prefix.claude/settings.json"
    mkdir -p "$(dirname "$path")"
    printf '{"value": "%s"}\n' "$key" > "$path"
    git add -- "$path"
    scan --staged
    if [ "$result" -eq 1 ] && has block 1 && ! has block 3 && ! has warn 3; then pass "shared settings still block credential content: $path"; else fail "shared settings credential content: $path"; fi
done

newrepo
printf '%s\n' '/Users/fixture/work/file' > paths.txt
git add -- paths.txt
scan --staged
assert_has 'category 4 personal path warns' warn 4

newrepo
mkdir -p dist
printf 'generated\n' > dist/output.txt
git add -- dist/output.txt
scan --staged
assert_has 'category 6 build artifact warns' warn 6

newrepo
printf 'console.log("debug");\n' > code.js
git add -- code.js
scan --staged
assert_has 'category 7 debug output warns' warn 7

newrepo
printf '<<<<<<< topic\n=======\n>>>>>>> main\n' > conflict.txt
git add -- conflict.txt
scan --staged
assert_has 'category 8 conflict blocks' block 8
assert_code 'conflict exit code 1' 1
chmod 755 readme.txt
git add -- readme.txt
scan --staged
assert_has 'category 8 mode 644 to 755 warns' warn 8

newrepo
printf 'debug=true\n' > config.txt
git add -- config.txt
scan --staged
assert_has 'category 10 local switch warns' warn 10

newrepo
printf 'ignored.txt\n' > .gitignore
printf 'local\n' > ignored.txt
git add -- .gitignore
git add -f -- ignored.txt
scan --staged
assert_has 'category 11 forced ignored file blocks' block 11

newrepo
printf 'tracked baseline\n' > ignored.txt
git add -- ignored.txt
git commit -qm 'baseline tracked file'
git push -q origin HEAD:main
git fetch -q origin
printf 'ignored.txt\n' > .gitignore
printf 'update\n' >> ignored.txt
git add -- .gitignore ignored.txt
scan --staged --unpushed
assert_has 'category 11 tracked before ignore warns' warn 11
if has block 11; then fail 'old tracked ignored file has no block'; else pass 'old tracked ignored file has no block'; fi

newrepo
printf 'normal\n' >> readme.txt
git add -- readme.txt
git commit -qm 'fix: path /home/fixture/project/file'
scan --unpushed
assert_has 'category 12 commit personal path warns' warn 12

newrepo
"$BASH" "$scanner" --staged --remote other --target topic > "$tmp/out" 2> "$tmp/err"
result=$?
cat "$tmp/out" "$tmp/err" >> "$tmp/all-output"
assert_has 'category 13 upstream remote mismatch warns' warn 13
"$BASH" "$scanner" --staged --remote origin --target main --force > "$tmp/out" 2> "$tmp/err"
cat "$tmp/out" "$tmp/err" >> "$tmp/all-output"
if has warn 13 && grep 'force requested' "$tmp/out" >/dev/null && grep 'branch candidate' "$tmp/out" >/dev/null; then pass 'category 13 default branch and force warn'; else fail 'default branch and force'; fi

newrepo
printf 'value=%s\n' "$key" > history.txt
git add -- history.txt
git commit -qm 'first local change'
printf 'safe replacement\n' > history.txt
git add -- history.txt
git commit -qm 'replace with safe value'
scan --staged --unpushed
assert_has 'earlier unpushed credential survives clean index and safe HEAD' block 1
assert_code 'earlier unpushed credential exit code 1' 1
scan
assert_has 'default range includes unpushed historical credential' block 1
scan --staged
if [ "$result" -eq 0 ] && [ ! -s "$tmp/out" ]; then pass 'staged-only does not scan history'; else fail 'staged-only range'; fi
git config --unset branch.topic.remote
git config --unset branch.topic.merge
scan --unpushed
assert_has 'no upstream still scans unpushed history' block 1
assert_code 'no upstream scan exit code 1' 1
scan --unpushed --base origin/main
assert_has 'explicit base scans each commit' block 1

newrepo
rules <<'RULES'
```safe-push-deny
block 5 INTERNAL_CODENAME
block 7 console[.]log
warn 1 .*
```
RULES
printf 'INTERNAL_CODENAME\nconsole.log("debug");\nvalue=%s\n' "$key" > code.js
git add -- code.js
scan --staged
assert_has 'deny added internal marker blocks' block 5
assert_has 'deny raises built-in severity' block 7
if has warn 7; then fail 'raised severity replaces built-in warning'; else pass 'raised severity replaces built-in warning'; fi
assert_has 'deny cannot downgrade category 1' block 1
if grep 'downgrade ignored' "$tmp/err" >/dev/null; then pass 'category 1 downgrade diagnostic'; else fail 'downgrade diagnostic'; fi

newrepo
rules <<'RULES'
```safe-push-allow
tests/fixtures/* gh[p]_
```
RULES
mkdir -p tests/fixtures
printf 'value=%s\n' "$key" > tests/fixtures/fake.txt
git add -- tests/fixtures/fake.txt
scan --staged
if [ "$result" -eq 0 ] && [ ! -s "$tmp/out" ]; then pass 'allow exact path and content exempts fake key'; else fail 'allow path and content'; fi
printf 'value=%s\n' "$key" > elsewhere.txt
git add -- elsewhere.txt
scan --staged
assert_has 'same fake key outside allow path blocks' block 1

for row in 'tests/fixtures/*' 'gh[p]_' '* gh[p]_' '** gh[p]_'; do
    rules <<RULES
\`\`\`safe-push-allow
$row
\`\`\`
RULES
    scan --staged
    if [ "$result" -eq 2 ] && [ -s "$tmp/err" ]; then pass 'invalid single/global allow rejected with diagnostic'; else fail 'invalid allow'; fi
done

newrepo
# Limits use binary zero data, so Git emits a compact binary diff.
dd if=/dev/zero of=medium.bin bs=1048576 count=1 2>/dev/null
printf x >> medium.bin
git add -- medium.bin
scan --staged
assert_has 'over 1 MiB warns' warn 6
if grep 'exceeds 1 MiB' "$tmp/out" >/dev/null; then pass '1 MiB size warning is independent of binary warning'; else fail 'size warning'; fi
dd if=/dev/zero of=large.bin bs=1048576 count=50 2>/dev/null
printf x >> large.bin
git add -- large.bin
scan --staged
assert_has 'over 50 MiB blocks' block 6
assert_code 'over 50 MiB exit code 1' 1

newrepo
printf 'console.log("debug");\n' > 'space name.js'
printf 'console.log("debug");\n' > '中文.js'
git add -- 'space name.js' '中文.js'
scan --staged
if [ "$result" -eq 0 ] && grep -F 'space name.js' "$tmp/out" >/dev/null && grep -F '中文.js' "$tmp/out" >/dev/null; then pass 'space and Chinese filenames preserved'; else fail 'space and Chinese filenames'; fi

newrepo
printf 'safe\n' >> readme.txt
git add -- readme.txt
git commit -qm "fix: $key"
scan --unpushed
assert_has 'credential in commit message blocks category 12' block 12
rules <<'RULES'
```safe-push-deny
warn 12 .*
```
RULES
scan --unpushed
assert_has 'category 12 cannot downgrade credential via category 12 rule' block 12

newrepo
git checkout -qb "topic-$key"
scan --staged
assert_has 'credential in branch name blocks category 12' block 12

newrepo
printf 'ordinary value\n' > "$key.txt"
git add -- "$key.txt"
scan --staged
assert_has 'credential-shaped filename blocks and redacts' block 1
if grep -F "$key" "$tmp/out" "$tmp/err" >/dev/null; then fail 'credential filename redaction'; else pass 'credential filename redaction'; fi

newrepo
printf '{"password": "%s"}\n' "$generic" > data.json
git add -- data.json
scan --staged
assert_has 'generic credential in JSON blocks' block 1
if grep -F "$generic" "$tmp/out" "$tmp/err" >/dev/null; then fail 'generic credential redaction'; else pass 'generic credential redaction'; fi

newrepo
printf 'const token = process.env.APP_TOKEN;\n' > code.js
git add -- code.js
scan --staged
if [ "$result" -eq 0 ] && [ ! -s "$tmp/out" ]; then pass 'environment lookup is not a credential literal'; else fail 'environment lookup'; fi

newrepo
# A gitlink need not have its object available in the superproject.
git update-index --add --cacheinfo 160000,0123456789012345678901234567890123456789,submodule
scan --staged
assert_has 'category 9 gitlink without local object warns' warn 9

newrepo
printf 'safe placeholder\n' > .env
git add -- .env
git commit -qm 'existing file'
git push -q origin HEAD:main
git fetch -q origin
git rm -q -- .env
scan --staged
if [ "$result" -eq 0 ] && [ ! -s "$tmp/out" ]; then pass 'deleting existing credential filename permits cleanup'; else fail 'deletion cleanup'; fi

newrepo
rules <<'RULES'
```safe-push-deny
block 5 [
```
RULES
scan --staged
assert_code 'invalid ERE exits 2' 2
scan --base missing-revision --unpushed
assert_code 'invalid revision exits 2' 2

newrepo
mkdir -p .scratch/tasks/x
printf 'report\n' > .scratch/tasks/x/report.md
git add -- .scratch/tasks/x/report.md
scan --staged
assert_has '.scratch/tasks blocks category 3' block 3
git reset -q; rm -rf .scratch
mkdir -p .scratch/feat/issues
printf 'issue\n' > .scratch/feat/issues/01-a.md
git add -- .scratch/feat/issues/01-a.md
scan --staged
if awk -F '\t' '$2==3 { f=1 } END { exit f }' "$tmp/out"; then pass '.scratch/<feature>/issues has no category 3'; else fail '.scratch/<feature>/issues has no category 3'; fi

mkdir -p "$tmp/not-git"
cd "$tmp/not-git" || exit 2
scan --staged
if [ "$result" -eq 2 ] && grep 'not inside a git repository' "$tmp/err" >/dev/null; then pass 'outside Git: code 2 and clear error'; else fail 'outside Git'; fi
if grep -F "$key" "$tmp/all-output" >/dev/null || grep -F "$cloud" "$tmp/all-output" >/dev/null || grep -F "$generic" "$tmp/all-output" >/dev/null; then fail 'all output redacts complete generated credentials'; else pass 'all output redacts complete generated credentials'; fi
printf 'Summary: %s PASS, %s FAIL\n' "$passes" "$failures"
[ "$failures" -eq 0 ]
