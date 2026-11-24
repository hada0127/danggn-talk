#!/usr/bin/env bash
# 당근톡 크롬 웹스토어 업로드용 zip 생성.
# 스토어에 올릴 파일만 담는다(docs/·scripts/·.git·개발 파일 제외).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERSION="$(node -p "require('./manifest.json').version")"
OUT="$ROOT/danggn-tok-v${VERSION}.zip"

rm -f "$OUT"

# 스토어에 포함할 항목만 명시적으로 나열(화이트리스트).
zip -r -X "$OUT" \
  manifest.json \
  action \
  background \
  content \
  themes \
  icons \
  -x '*/.DS_Store' >/dev/null

echo "packaged: $OUT"
unzip -l "$OUT"
