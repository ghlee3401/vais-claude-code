---
name: do
description: 구현 phase — plan 범위 실행 + notes 기록. v2.0
---

# Do

## 절차

1. `docs/{feature}/plan.md` Read — 없으면 확인 1회 후 plan부터. 범위·완료 조건을 작업 기준으로 삼는다.
2. `--design` 플래그 또는 UI 신규 화면 작업이면: **ui-designer** 위임 (brand 선택 포함 — ui-designer.md 참조) → 설계 확정 후 구현.
3. 구현 — 규모에 따라:
   - 소규모: 직접 구현
   - 병렬 가치가 있으면 Agent 도구로 위임: `frontend-engineer` + `backend-engineer` + `test-engineer` (병렬), 디버깅은 `incident-responder`
4. 작업 중 유의미한 결정·발견·계획 이탈은 즉시 `notes.md`에 append: `- YYYY-MM-DD: {결정} — {근거 한 줄}`
5. 테스트 실행 — 기존 스위트 green 확인. 신규 로직은 test-engineer 또는 직접 테스트 추가.
6. status 갱신 (lib/status).

## 규칙

- plan 범위 밖 작업 금지 — 필요해 보이면 notes.md에 기록하고 사용자에게 보고만. 범위 변경은 사용자 승인 후.
- `guidelines/code-conventions.md` 준수 (에러 처리 2모드, CJS, 네이밍).
- 위험 명령 금지: `rm -rf`, `git push --force`, `DROP TABLE`.

## 완료 시

변경 파일 목록 + 테스트 결과를 대화에 표시 → 다음 단계 제안: `/vais review {feature}`.
