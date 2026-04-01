#!/bin/bash
# setup-dev.sh
# 새 PC에서 vais-code 개발 환경 세팅
# 실행: bash scripts/setup-dev.sh

set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MARKETPLACE_DIR="$HOME/.claude/plugins/marketplaces/vais-marketplace"
PLUGINS_DIR="$HOME/.claude/plugins/marketplaces"

echo "=== vais-code dev setup ==="
echo "repo: $REPO_DIR"
echo "target: $MARKETPLACE_DIR"
echo ""

# marketplaces 디렉토리 확인
if [ ! -d "$PLUGINS_DIR" ]; then
    echo "ERROR: $PLUGINS_DIR 없음. Claude Code가 설치되어 있나요?"
    echo "  npm install -g @anthropic-ai/claude-code 후 claude 한 번 실행하세요."
    exit 1
fi

# 기존 marketplace 처리
if [ -L "$MARKETPLACE_DIR" ]; then
    echo "기존 symlink 제거 중..."
    rm "$MARKETPLACE_DIR"
elif [ -d "$MARKETPLACE_DIR" ]; then
    echo "기존 디렉토리 백업 중... ($MARKETPLACE_DIR.bak)"
    mv "$MARKETPLACE_DIR" "${MARKETPLACE_DIR}.bak"
fi

# symlink 생성
ln -s "$REPO_DIR" "$MARKETPLACE_DIR"
echo "symlink 생성 완료"
echo ""
echo "=== 완료 ==="
echo "Claude Code에서 /reload-plugins 실행하면 활성화됩니다."
echo ""
echo "개발 루프:"
echo "  1. 코드 수정 (workspace)"
echo "  2. /reload-plugins"
echo "  3. /vais cto {feature} 로 다음 기능 개발"
