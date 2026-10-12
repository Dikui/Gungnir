#!/bin/bash
# Read-only scanner: bash 3.2, Git and POSIX utilities only.
set -u
export LC_ALL=C
staged=0 unpushed=0 selected=0 force=0
base= remote= target=
error() { printf '%s\n' "safe-push: $1" >&2; exit 2; }
while [ "$#" -gt 0 ]; do
    case "$1" in
        --staged) staged=1; selected=1 ;;
        --unpushed) unpushed=1; selected=1 ;;
        --base|--remote|--target)
            option=$1; shift
            [ "$#" -gt 0 ] && [ -n "$1" ] || error 'missing option value'
            case "$option" in --base) base=$1 ;; --remote) remote=$1 ;; --target) target=$1 ;; esac ;;
        --force) force=1 ;;
        --help)
            printf '%s\n' 'Usage: scan.sh [--staged] [--unpushed] [--base REV] [--remote NAME] [--target BRANCH] [--force]'
            exit 0 ;;
        *) error 'unknown option' ;;
    esac
    shift
done
[ "$selected" -eq 1 ] || { staged=1; unpushed=1; }
root=$(git rev-parse --show-toplevel 2>/dev/null) || error 'not inside a git repository'
cd "$root" || error 'cannot enter repository'
# Atomic mkdir avoids requiring non-POSIX mktemp and never reuses a directory.
umask 077
tmp_attempt=0
while :; do
    tmp="${TMPDIR:-/tmp}/safe-push.$$.${tmp_attempt}"
    if mkdir "$tmp" 2>/dev/null; then break; fi
    tmp_attempt=$((tmp_attempt+1))
    [ "$tmp_attempt" -lt 10 ] || error 'cannot create private temporary directory'
done
trap 'rm -rf "$tmp"' EXIT
trap 'exit 2' HUP INT TERM
: > "$tmp/events"
# Suppress raw Git/awk errors: even an error can contain a credential in a path.
run() { "$@" 2> "$tmp/tool-error" || error 'Git inspection failed; check repository state and revisions locally'; }
head=$(git rev-parse --verify HEAD 2>/dev/null) || head=
if [ -n "$base" ]; then
    base=$(run git rev-parse --verify "${base}^{commit}") || exit 2
fi
branch=$(git symbolic-ref --quiet --short HEAD 2>/dev/null) || branch=
upstream=$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null) || upstream=
upremote=
if [ -n "$branch" ]; then upremote=$(git config --get "branch.$branch.remote" 2>/dev/null) || upremote=; fi
[ -n "$remote" ] || remote=$upremote
[ -n "$target" ] || {
    target=$(git config --get "branch.$branch.merge" 2>/dev/null) || target=
    target=${target#refs/heads/}
    [ -n "$target" ] || target=$branch
}
check_path() {
    case "$1" in *$'\t'*|*$'\n'*|*$'\r'*) error 'paths with tabs or newlines are unsupported; review manually' ;; esac
}
attribute() { printf 'A\t%s\t0\t%s\t%s\t%s\n' "$1" "$2" "$3" "$4" >> "$tmp/events"; }
text_record() {
    check_path "$2"
    printf '%s\t%s\t0\t%s\n' "$1" "$2" "$3" >> "$tmp/events"
}
[ -z "$branch" ] || text_record M '(branch)' "$branch"
if [ "$force" -eq 1 ]; then attribute '(push)' 13 warn 'force requested; separate confirmation required'; fi
if [ -n "$upremote" ] && [ -n "$remote" ] && [ "$remote" != "$upremote" ]; then
    attribute '(push)' 13 warn 'remote differs from upstream; separate confirmation required'
fi
if [ -n "$remote" ]; then
    default=$(git symbolic-ref --quiet --short "refs/remotes/$remote/HEAD" 2>/dev/null) || default=
    default=${default#"$remote/"}
    case "$target" in main|master) attribute '(push)' 13 warn 'default/protected branch candidate; separate confirmation required' ;;
        *) if [ -n "$default" ] && [ "$default" = "$target" ]; then attribute '(push)' 13 warn 'default branch; separate confirmation required'; fi ;;
    esac
fi
inspect_files() {
    revision=$1 previous=$2 kind=$3
    while IFS= read -r -d '' path; do
        check_path "$path"
        if [ "$kind" = staged ]; then spec=":$path"; else spec="$revision:$path"; fi
        if git cat-file -e "$spec" 2>/dev/null; then
            text_record F "$path" "$path"
            type=$(run git cat-file -t "$spec") || exit 2
            if [ "$type" = blob ]; then
                size=$(run git cat-file -s "$spec") || exit 2
                if [ "$size" -gt 52428800 ]; then attribute "$path" 6 block "bytes=$size exceeds 50 MiB"
                elif [ "$size" -gt 1048576 ]; then attribute "$path" 6 warn "bytes=$size exceeds 1 MiB"; fi
            else attribute "$path" 9 warn 'submodule pointer changed; review task relevance'; fi
            git check-ignore --no-index -q -- "$path" 2> "$tmp/tool-error"
            ignored=$?
            case "$ignored" in
                0) if [ -n "$previous" ] && git cat-file -e "$previous:$path" 2>/dev/null; then
                       attribute "$path" 11 warn 'ignored file already tracked in baseline'
                   else attribute "$path" 11 block 'new ignored file in index/history (forced-add equivalent)'; fi ;;
                1) ;;
                *) error 'cannot inspect ignore rules' ;;
            esac
        fi
        if [ "$kind" = staged ]; then
            run git diff --cached --no-ext-diff --no-textconv --no-renames --unified=0 -- "$path" > "$tmp/diff" || exit 2
        else
            run git show --format= --root -m --no-ext-diff --no-textconv --no-renames --unified=0 "$revision" -- "$path" > "$tmp/diff" || exit 2
        fi
        SAFE_PUSH_PATH=$path awk '
            BEGIN { file=ENVIRON["SAFE_PUSH_PATH"] }
            /^@@ / { split($0,parts," "); s=parts[3]; sub(/^\+/,"",s); sub(/,.*$/,"",s); line=s+0; next }
            /^new mode 100755/ { print "A\t" file "\t0\t8\twarn\texecutable permission added" }
            /^new file mode 100755/ { print "A\t" file "\t0\t8\twarn\tnew executable file" }
            /^Binary files / { print "A\t" file "\t0\t6\twarn\tbinary content changed" }
            /^\+\+\+/ { next }
            /^\+/ { print "L\t" file "\t" line "\t" substr($0,2); line++ }
        ' "$tmp/diff" >> "$tmp/events" || error 'cannot parse diff'
    done < "$tmp/files"
}
if [ "$staged" -eq 1 ]; then
    run git diff --cached --no-renames --name-only -z > "$tmp/files" || exit 2
    printf 'S\tindex\n' >> "$tmp/events"
    inspect_files '' "$head" staged || exit 2
fi
if [ "$unpushed" -eq 1 ] && [ -n "$head" ]; then
    if [ -n "$base" ]; then
        run git rev-list --reverse "$base..HEAD" > "$tmp/commits" || exit 2
    elif [ -n "$upstream" ]; then
        run git rev-list --reverse '@{upstream}..HEAD' > "$tmp/commits" || exit 2
    else
        # Equivalent to git log HEAD --not --remotes; works without upstream.
        run git rev-list --reverse HEAD --not --remotes > "$tmp/commits" || exit 2
    fi
    while IFS= read -r commit; do
        printf 'S\t%s\n' "$commit" >> "$tmp/events"
        run git log -1 --format=%B "$commit" > "$tmp/message" || exit 2
        while IFS= read -r message || [ -n "$message" ]; do text_record M "(commit:$commit)" "$message"; done < "$tmp/message"
        previous=$(git rev-parse --verify "$commit^" 2>/dev/null) || previous=
        run git diff-tree --root -m --no-renames --no-commit-id --name-only -r -z "$commit" > "$tmp/files" || exit 2
        inspect_files "$commit" "$previous" commit || exit 2
    done < "$tmp/commits"
fi
rules=docs/agents/push-rules.md
[ -f "$rules" ] || { rules="$tmp/no-rules"; : > "$rules"; }
# All user content remains in private temporary files. Findings contain fixed
# descriptions, never a source-line excerpt, including custom deny matches.
awk -F '\t' '
function glob(s,    i,c,r) {
    r="^"
    for(i=1;i<=length(s);i++) {
        c=substr(s,i,1)
        if(c=="*") r=r ".*"
        else if(c=="?") r=r "."
        else if(index(".[](){}+^$|\\",c)) r=r "\\" c
        else r=r c
    }
    return r "$"
}
function credential(s,    t,rhs,value) {
    if(s ~ /(AKIA|ASIA)[A-Z0-9]{16}|gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}/) return 1
    if(s ~ /-----BEGIN ([A-Z0-9]+ )*PRIVATE KEY-----|[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^ \/:]+:[^ \/@]+@/) return 1
    t=tolower(s)
    while(match(t,/(api[_-]?key|access[_-]?key|secret([_-]?key)?|token|password|passwd)["\047]?[[:space:]]*[:=][[:space:]]*/)) {
        rhs=substr(t,RSTART+RLENGTH)
        if(rhs !~ /^(process[.]env[.]|os[.]environ|os[.]getenv\(|getenv\(|env\(|ENV\[)/) {
            value=rhs; sub(/^["\047]/,"",value)
            if(value ~ /^[a-z0-9_+\/.=-]{8,}/) return 1
        }
        t=rhs
    }
    return 0
}
function allowed(file,s,    i) {
    for(i=1;i<=na;i++) if(file ~ ag[i] && s ~ ar[i]) return 1
    return 0
}
function finding(cat,lev,reason,    i,f) {
    if(allowed(file,content)) return
    for(i=1;i<=nd;i++) if(dc[i]==cat && content ~ dr[i]) lev=dl[i]
    if(cat==12 && credential(content)) lev="block"
    f=file
    for(i=1;i<=nd;i++) if(dc[i]==1 && f ~ dr[i]) f=substr(f,1,4) "[REDACTED]"
    if(credential(f)) f=substr(f,1,4) "[REDACTED]"
    gsub(/[[:cntrl:]]/,"?",f)
    print lev "\t" cat "\t" f "\t" lineno "\t" reason (source!="" ? " [source=" source "]" : "")
    if(lev=="block") blocked=1
}
function personal(s) {
    return s ~ /\/Users\/[^ \/]+\/|\/home\/[^ \/]+\/|[A-Za-z]:\\Users\\[^\\ ]+\\|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|(^|[^0-9])(10\.[0-9]+\.[0-9]+\.[0-9]+|192\.168\.[0-9]+\.[0-9]+|172\.(1[6-9]|2[0-9]|3[01])\.[0-9]+\.[0-9]+)/
}
FILENAME==ARGV[1] {
    if($0=="```safe-push-deny") { mode="deny"; next }
    if($0=="```safe-push-allow") { mode="allow"; next }
    if($0=="```") { mode=""; next }
    if(mode=="" || $0 ~ /^[[:space:]]*(#|$)/) next
    s=$0; sub(/^[[:space:]]+/,"",s)
    first=s; sub(/[[:space:]].*$/, "",first)
    sub(/^[^[:space:]]+[[:space:]]*/,"",s)
    if(mode=="deny") {
        cat=s; sub(/[[:space:]].*$/, "",cat)
        sub(/^[^[:space:]]+[[:space:]]*/,"",s)
        if((first!="block" && first!="warn") || cat !~ /^([1-9]|1[0-3])$/ || s=="") { print "safe-push: invalid deny row (details withheld)" > "/dev/stderr"; invalid=1; next }
        if(cat==1 && first!="block") { print "safe-push: category 1 downgrade ignored" > "/dev/stderr"; next }
        dummy=("" ~ s); nd++; dc[nd]=cat+0; dl[nd]=first; dr[nd]=s
    } else {
        if(s=="" || first=="*" || first=="**" || first !~ /\//) { print "safe-push: allow requires a scoped path and content regex" > "/dev/stderr"; invalid=1; next }
        dummy=("" ~ s); na++; ag[na]=glob(first); ar[na]=s
    }
    next
}
{
    if($1=="S") { source=$2; next }
    type=$1; file=$2; lineno=$3; content=$4
    for(i=5;i<=NF;i++) content=content "\t" $i
    if(type=="A") { content=$6; finding($4,$5,$6); next }
    if(type=="M") {
        if(credential(content)) finding(12,"block","credential pattern in branch/commit (source category 1)")
        if(personal(content)) finding(12,"warn","personal environment in branch/commit (source category 4)")
        for(j=1;j<=nd;j++) if((dc[j]==1 || dc[j]==4 || dc[j]==5 || dc[j]==12) && content ~ dr[j]) finding(12,dl[j],"project rule in branch/commit (source category " dc[j] ")")
        next
    }
    if(type=="F") {
        if(content ~ /(^|\/)\.env($|\.)|\.(pem|p12|pfx|key|crt|cer)$/) finding(1,"block","credential-bearing file name; inspect locally")
        if(content ~ /(^|\/)(docs\/tasks|\.claude|\.agents|\.chatgpt_exec)(\/|$)|(^|\/)(last-message\.md|[^\/]*scratchpad[^\/]*)$/) finding(3,"block","agent work artifact")
        if(content ~ /(^|\/)(dist|build|node_modules|coverage|__pycache__)(\/|$)|\.(log|exe|dll|dylib|so|zip|png|jpg|pdf)$/) finding(6,"warn","build/log/binary artifact candidate")
        if(content ~ /(^|\/)(\.DS_Store|\.idea|settings\.local\.json)(\/|$)|\.override\.|\.swp$/) finding(10,"warn","local/editor file")
        if(content ~ /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/) finding(9,"warn","lockfile changed; review task relevance")
    }
    if(credential(content)) finding(1,"block","credential pattern [REDACTED]")
    if(personal(content)) finding(4,"warn","personal path/email/private IP candidate")
    if(type=="L") {
        if(content ~ /^(<<<<<<<|=======|>>>>>>>)( |$)/) finding(8,"block","merge conflict marker")
        if(content ~ /^Subproject commit [0-9a-f]+$/) finding(9,"warn","submodule pointer changed; review task relevance")
        if(content ~ /console\.(log|debug)|(^|[^A-Za-z])debugger([^A-Za-z]|$)|\.(only)[[:space:]]*\(|(^|[^A-Za-z])(fit|fdescribe)[[:space:]]*\(|(TODO|FIXME).*([Hh][Aa][Cc][Kk]|temporary)/) finding(7,"warn","debug/test focus/temporary hack candidate")
        if(tolower(content) ~ /debug[[:space:]]*[:=][[:space:]]*true|mock[[:space:]]*[:=][[:space:]]*true|localhost|127\.0\.0\.1/) finding(10,"warn","local debug/mock/localhost setting")
        if(index(content,"\r")) finding(8,"warn","CRLF added; review line-ending changes")
    }
    for(j=1;j<=nd;j++) if(content ~ dr[j]) finding(dc[j],dl[j],"project deny rule matched (content withheld)")
}
END { if(invalid) exit 2; if(blocked) exit 1 }
' "$rules" "$tmp/events" > "$tmp/output" 2> "$tmp/diagnostics"
code=$?
case "$code" in
    0|1) cat "$tmp/diagnostics" >&2; cat "$tmp/output"; exit "$code" ;;
    *) printf '%s\n' 'safe-push: invalid project rule or scan error; check syntax locally (content withheld)' >&2; exit 2 ;;
esac
