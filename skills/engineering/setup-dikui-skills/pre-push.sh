#!/bin/sh
# 推送到默认分支时，版本号前两位（主版本、次版本）变化才运行全量测试；只升修订号或不改版本时直接放行。
# 由 setup-dikui-skills 生成：按项目修改下面三行。
DEFAULT_BRANCH='main'
VERSION_FILE='package.json'
FULL_TEST='npm test'

set -eu
zero=0000000000000000000000000000000000000000

# <提交> → x.y.z；VERSION 文件取全文，其他文件取第一处 version 键。读不到时为空。
version_at() {
  git show "$1:$VERSION_FILE" 2>/dev/null | {
    if [ "$(basename "$VERSION_FILE")" = VERSION ]; then cat; else grep -m1 -E '^[[:space:]]*"?version"?[[:space:]]*[:=]'; fi
  } | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -n1 || true
}

while read -r _ local_sha remote_ref remote_sha; do
  [ "$remote_ref" = "refs/heads/$DEFAULT_BRANCH" ] || continue
  [ "$local_sha" = "$zero" ] && continue
  # 远端有本地没有的提交时推送反正会被拒；先停下，免得白跑全量。
  if [ "$remote_sha" != "$zero" ] && ! git cat-file -e "$remote_sha^{commit}" 2>/dev/null; then
    echo "pre-push：远端 $DEFAULT_BRANCH 有本地没有的提交，先拉取合并再推送" >&2
    exit 1
  fi
  new=$(version_at "$local_sha")
  old=''
  [ "$remote_sha" = "$zero" ] || old=$(version_at "$remote_sha")
  [ -n "$new" ] && [ "${new%.*}" = "${old%.*}" ] && continue
  echo "pre-push：版本 ${old:-无} → ${new:-无}，前两位变化，运行全量测试：$FULL_TEST" >&2
  if [ "$local_sha" != "$(git rev-parse HEAD)" ]; then
    echo "pre-push：推送的提交不是当前 HEAD，检出它后再推送，全量测试才测得到这份代码" >&2
    exit 1
  fi
  sh -c "$FULL_TEST"
done
