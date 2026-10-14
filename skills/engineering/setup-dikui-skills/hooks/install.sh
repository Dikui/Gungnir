#!/bin/bash
# Installs the gungnir git hooks into the repository containing the current directory.
# Usage: install.sh [--scan PATH_TO_scan.sh]
# Exit codes: 0 installed, 2 error, 3 existing hook setup detected (nothing changed).
# bash 3.2, Git and POSIX utilities only.
src=$(cd "$(dirname "$0")" && pwd) || exit 2
scan="$src/../../safe-push/scripts/scan.sh"
while [ "$#" -gt 0 ]; do
    case "$1" in
        --scan) [ "$#" -ge 2 ] && [ -n "$2" ] || { echo 'install: --scan needs a path' >&2; exit 2; }; scan=$2; shift ;;
        *) echo 'install: unknown option' >&2; exit 2 ;;
    esac
    shift
done
[ -f "$scan" ] || { echo 'install: scan.sh not found' >&2; exit 2; }
scan=$(cd "$(dirname "$scan")" && pwd)/$(basename "$scan")
root=$(git rev-parse --show-toplevel 2>/dev/null) || { echo 'install: not inside a git repository' >&2; exit 2; }
cd "$root" || exit 2
for f in pre-commit pre-push; do [ -f "$src/$f" ] || { echo "install: missing $f next to install.sh" >&2; exit 2; }; done

hits=
add() { hits="$hits$1
"; }
hp=$(git config --get core.hooksPath 2>/dev/null) || hp=
if [ -n "$hp" ] && [ "$hp" != .githooks ]; then add "core.hooksPath=$hp"; fi
[ ! -d .husky ] || add '.husky/'
for f in lefthook.yml lefthook.yaml .lefthook.yml .pre-commit-config.yaml; do
    [ ! -e "$f" ] || add "$f"
done
gh=$(git rev-parse --git-common-dir 2>/dev/null)/hooks
for f in pre-commit pre-push; do
    [ ! -e "$gh/$f" ] || add "$gh/$f"
    if [ -e ".githooks/$f" ] && ! grep -q '^# gungnir-hook' ".githooks/$f" 2>/dev/null; then
        add ".githooks/$f (not a gungnir hook)"
    fi
done
if [ -n "$hits" ]; then
    echo 'Existing hook setup detected; nothing was changed:'
    printf '%s' "$hits"
    exit 3
fi

mkdir -p .githooks/lib || exit 2
for f in pre-commit pre-push; do
    cp "$src/$f" ".githooks/$f" || exit 2
    chmod 755 ".githooks/$f" || exit 2
done
cp "$scan" .githooks/lib/scan.sh || exit 2
chmod 755 .githooks/lib/scan.sh || exit 2
git config core.hooksPath .githooks || exit 2
echo 'Installed .githooks/pre-commit, .githooks/pre-push, .githooks/lib/scan.sh; core.hooksPath=.githooks'
