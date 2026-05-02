---
owner: cto
agent: cto-direct
artifact: patch-script-spec
phase: design
feature: simplify-non-cto-workflow
generated: 2026-05-02
summary: "patch-subdoc-block.js + patch-clevel-guard.js 의 v2.x 동작 + legacy mode + dry-run + rollback CLI spec."
---

# Patch Script Spec — v2.x 동작 + legacy mode

## 적용 위치

- `scripts/patch-subdoc-block.js` (37 sub-agent md 본문 inline 주입)
- `scripts/patch-clevel-guard.js` (6 C-Level md 본문 inline 주입)

## 공통 CLI

```bash
node scripts/patch-subdoc-block.js [options]
node scripts/patch-clevel-guard.js [options]

Options:
  --dry-run        변경 미리보기 (실제 쓰기 X)
  --legacy         v0.57 옛 블록 복원 (rollback 시나리오)
  --target <glob>  특정 파일만 (예: agents/cpo/*.md)
  --verbose, -v    상세 로그
  --help, -h       이 메시지
```

## 동작 흐름

### patch-subdoc-block.js

```
1. 정본 본문 Read: agents/_shared/subdoc-guard.md
2. 새 블록 마커 추출:
   <!-- vais:subdoc-guard:begin -->
   ...
   <!-- vais:subdoc-guard:end -->
3. 37 sub-agent md 스캔: agents/{cpo,cto,cso,cbo,coo,ceo}/*.md (C-Level 본인 md 제외)
4. 각 sub-agent md 의 옛 마커 블록 검색
5. 옛 블록 → 새 블록 교체 (마커 사이 내용)
6. --legacy 시: 새 → 옛 (rollback)
7. --dry-run 시: diff 만 출력, 쓰기 X
8. 검증: 모든 sub-agent md 에 새 블록 주입 확인 (grep "subdoc-guard version: v2.0")
```

### patch-clevel-guard.js

```
1. 정본 Read: agents/_shared/clevel-main-guard.md
2. 6 C-Level md (agents/{ceo,cpo,cto,cso,cbo,coo}/{c-level}.md) 스캔
3. 동일 마커 기반 교체
4. 옵션 동일 (--dry-run / --legacy)
```

## 정본 마커 형식

```markdown
<!-- vais:subdoc-guard:begin — injected by scripts/patch-subdoc-block.js. Do not edit inline; update agents/_shared/subdoc-guard.md and re-run the script. -->
{본문}
<!-- subdoc-guard version: vX.Y -->
<!-- vais:subdoc-guard:end -->
```

마커 + 버전 명시. patch 스크립트가 버전 비교로 갱신 필요 판단.

## v2.0 새 블록 (subdoc-guard 정본)

`subdoc-guard-canonical.md` 의 정본 본문 그대로. patch 스크립트가 그 본문을 모든 sub-agent md 에 inline 주입.

## v1.x → v2.0 마이그레이션 흐름

```bash
# 1. 정본 갱신
$ vim agents/_shared/subdoc-guard.md   # v2.0 본문으로 교체

# 2. dry-run 으로 변경 미리보기
$ node scripts/patch-subdoc-block.js --dry-run
[dry-run] Would update 37 files:
  agents/cpo/prd-writer.md       (v0.58.4 → v2.0)
  agents/cpo/roadmap-author.md   (v0.58.4 → v2.0)
  ... (37 lines)

# 3. 실제 적용
$ node scripts/patch-subdoc-block.js
✓ Updated 37 files
✓ All sub-agent md now have subdoc-guard v2.0

# 4. 검증
$ grep -l "subdoc-guard version: v2.0" agents/*/*.md | wc -l
37

# 5. 회귀 테스트 (1 sub-agent 호출)
$ /vais ceo do test-feature
→ docs/test-feature/00-ideation/main.md 박제 (새 위치 + frontmatter)
→ _tmp/ 폴더 미생성 확인

# 6. git commit
```

## Rollback 흐름 (--legacy)

```bash
# 1. dry-run rollback 미리보기
$ node scripts/patch-subdoc-block.js --legacy --dry-run
[dry-run] Would revert 37 files to v0.58.4 spec:
  ...

# 2. 실제 rollback
$ node scripts/patch-subdoc-block.js --legacy
✓ Reverted 37 files to subdoc-guard v0.58.4

# 3. vais.config.json 동시 정정
$ vim vais.config.json
  → orchestration.legacyV1.enabled = true

# 4. doc-validator + auto-judge 옛 룰 복원
$ git checkout v0.6x scripts/doc-validator.js scripts/auto-judge.js

# 5. 검증
$ /vais ceo do test-feature
→ _tmp/ 모델 동작 확인
```

## --target 옵션 (부분 적용)

```bash
# CPO sub-agent 만 갱신
$ node scripts/patch-subdoc-block.js --target "agents/cpo/*.md"

# CSO sub-agent 만 rollback
$ node scripts/patch-subdoc-block.js --legacy --target "agents/cso/*.md"
```

→ 단계적 마이그레이션 가능. C-Level 별로 검증 후 다음으로.

## Exit code

| Code | 의미 |
|:----:|------|
| 0 | 모든 파일 정상 patch |
| 1 | 일반 에러 |
| 2 | 정본 파일 (`_shared/subdoc-guard.md`) 미존재 |
| 3 | 마커 블록 없는 sub-agent md 발견 (수동 처리 필요) |
| 4 | 일부 파일 patch 실패 (atomicity 깨짐 — rollback 권장) |

## 회귀 테스트

| # | 시나리오 | 기대 |
|---|---------|------|
| P-1 | dry-run 후 실제 patch | dry-run 결과 = 실제 변경 |
| P-2 | 마커 없는 sub-agent md | exit code 3 + 수동 안내 |
| P-3 | 정본 미존재 | exit code 2 |
| P-4 | --legacy 후 다시 v2.0 patch | 양방향 가능 (idempotent) |
| P-5 | --target 부분 적용 | 지정 파일만 patch |
| P-6 | 부분 실패 (file write 권한) | rollback 가이드 안내 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | patch 스크립트 v2.x CLI spec — --dry-run / --legacy / --target / 마커 형식 / 마이그레이션 흐름 / rollback / exit code / 회귀 6 시나리오. |
