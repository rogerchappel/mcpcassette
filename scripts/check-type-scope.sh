#!/usr/bin/env bash
set -euo pipefail

if [ "${MCPCASSETTE_TYPE_SCOPE_ACTIVE:-}" = "1" ]; then
  exit 0
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fixture_root="$(mktemp -d "${TMPDIR:-/tmp}/mcpcassette-type-scope-XXXXXX")"
trap 'rm -rf "$fixture_root"' EXIT

mkdir -p "$fixture_root/node_modules/@types/unrelated" "$fixture_root/project"
printf 'declare const contaminated: MissingAncestorAmbientType;\n' \
  > "$fixture_root/node_modules/@types/unrelated/index.d.ts"

(cd "$repo_root" && tar \
  --exclude=.git \
  --exclude=dist \
  --exclude=node_modules \
  -cf - .) | (cd "$fixture_root/project" && tar -xf -)
ln -s "$repo_root/node_modules" "$fixture_root/project/node_modules"

(
  cd "$fixture_root/project"
  MCPCASSETTE_TYPE_SCOPE_ACTIVE=1 npm run release:check
)
