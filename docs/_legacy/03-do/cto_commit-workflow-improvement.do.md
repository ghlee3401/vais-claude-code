# commit-workflow-improvement - 구현 로그

## 구현 결정사항

| # | 결정 | 이유 |
|---|------|------|
| 1 | 커밋 메시지 한국어 한 줄로 전환 | git log 가독성 향상, body 중복 제거 |
| 2 | 특수기호 sanitize 자동 적용 | CI/CD 파이프라인 호환성 확보 |
| 3 | 버전 탐색을 Grep 전체 탐색으로 전환 | 하드코딩 5개 파일 → 전체 탐색으로 누락 방지 |
| 4 | CHANGELOG.md 자동 생성/엔트리 추가 | 파일 부재 시 자동 생성, type별 섹션 분류 |

## 변경 파일 목록

| 파일 | 변경 유형 | 내용 |
|------|----------|------|
| `skills/vais/utils/commit.md` | 수정 | 전체 로직 개편 |

## Design 이탈 항목

없음

## 미완료 항목

없음

## 발견한 기술 부채

| 우선순위 | 항목 |
|----------|------|
| Medium | 직전 커밋(0.50.1)에서 `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`의 버전이 0.50.0으로 남아있음. 다음 `/vais commit` 실행 시 grep 탐색으로 자동 발견/수정 예정 |

---

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-16 | 초기 구현 로그 작성 |
