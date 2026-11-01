#!/usr/bin/env bash
set -Eeuo pipefail

readonly DEPLOY_DIR='/opt/frontend/DevOpsKit'
readonly DIST_DIR="${DEPLOY_DIR}/dist"
readonly BACKUP_DIR="${DEPLOY_DIR}/backup"
readonly ARCHIVE="${DEPLOY_DIR}/devopskit.tar.gz"

staging_dir=''
backup_path=''

cleanup() {
  local status=$?
  # 备份移走后若新目录未发布成功，恢复原目录。
  if (( status != 0 )) && [[ -n "$backup_path" && ! -e "$DIST_DIR" ]]; then
    printf '部署失败，正在恢复备份：%s\n' "$backup_path" >&2
    if ! mv -- "$backup_path" "$DIST_DIR"; then
      printf '自动恢复失败，请手动恢复：%s\n' "$backup_path" >&2
    fi
  fi
  if [[ -n "$staging_dir" && -d "$staging_dir" ]]; then
    rm -rf -- "$staging_dir"
  fi
  exit "$status"
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if [[ ! -f "$ARCHIVE" ]]; then
  printf '未找到部署包：%s\n' "$ARCHIVE" >&2
  exit 1
fi
if [[ -L "$DIST_DIR" || ( -e "$DIST_DIR" && ! -d "$DIST_DIR" ) ]]; then
  printf '部署目标须为普通目录：%s\n' "$DIST_DIR" >&2
  exit 1
fi

mkdir -p -- "$BACKUP_DIR"

# 构建包内为 devopskit/，去掉这一层后 index.html 直接位于 dist 下。
# 先在同一文件系统内解压并校验，避免坏包影响当前站点。
staging_dir=$(mktemp -d "${DEPLOY_DIR}/.deploy.XXXXXXXX")
tar -xzf "$ARCHIVE" -C "$staging_dir" --strip-components=1
if [[ ! -f "${staging_dir}/index.html" ]]; then
  printf '部署包缺少 devopskit/index.html，当前站点未变更。\n' >&2
  exit 1
fi

if [[ -d "$DIST_DIR" ]]; then
  backup_path="${BACKUP_DIR}/dist-$(date +%Y%m%d_%H%M%S)-$$"
  mv -- "$DIST_DIR" "$backup_path"
  printf '已备份：%s\n' "$backup_path"
fi

mv -- "$staging_dir" "$DIST_DIR"
staging_dir=''
rm -- "$ARCHIVE"

printf '部署完成：%s\n部署包已删除。\n' "$DIST_DIR"
