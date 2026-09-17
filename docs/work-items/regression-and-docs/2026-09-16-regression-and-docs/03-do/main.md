---
schema: vais-phase/v1
work_item: WI-2026-09-16-regression-and-docs
phase: do
revision: 1
status: draft
based_on: []
---

# Do — regression-and-docs

## 구현 변경

- REQ-001 `tests/regression/helpers.js` 신설(임시 repo·버전 7면·fixture 복사·사슬 승인·권한·사용자 문장·QA 결과). 장면 A·B·C·D·E·commands 가 helper 를 쓰고 머리말을 `장면 X — design.md §11 / 검증 / 렌더러` 로 통일, F 는 머리말만. `design.md` §11 에 장면 ↔ 파일 표.
- REQ-002 `vcs.commitSave`: `git add -A -- .` + `git rm -r --cached --ignore-unmatch -- .vais`, exclude 경로 제거. add·commit 실패는 `SAVE_FAILED` 에 "스테이지 N개 됨 · 커밋 단계에서 실패: 원인" 을 담고 재시도 없음. commands 회귀는 `.gitignore` 에 `.vais/` 가 있는 저장소로 바뀜.
- REQ-003 `router.COMMAND_PATTERNS`: `commit`(단독) → save, `commit 확인|confirm[: 메시지]` → save-confirm. hook 도움말 표·`glossary.json` save 항목에 별칭.
- REQ-004 `vcs.git()` 에 `raw` 옵션, `changedFiles` 정규식 파싱으로 앞 점 보존.
- REQ-005 README(4.0.0 상태, 사용 순서 5줄, 저장 별칭·실패 안내), ONBOARDING(6 묶음, 35 모듈, ui.run, 저장 실패 안내), CLAUDE(상태 줄, 10-6 을 10-5 뒤로, 구조도 helpers, Testing).
- REQ-006 `design.md` 대응표 잔여 행 완료·유지·보류(H8) + H7 행 3개, §11 표. `roadmap.md` H6 완료(3.6.0)·H7 진행.
- REQ-007 버전 7면 4.0.0, CHANGELOG [4.0.0](Fixed 3건·Changed 4건, 3.1~3.6 링크).

## 검증 증거

- 단위 `tests/v2-commands.test.js` H7 TC-002~004 추가: `.gitignore` 저장소 커밋·`.vais/` 미포함·pre-commit 실패 시 reason, `commit` 별칭 부정 케이스, 앞 점 보존. `npm test` 전체 PASS.
- `npm run regression` 7 파일 PASS(A 2.6s, 나머지 0.5s 이하, 총 3초 미만). 버전 고정 문구 2곳을 helper VERSION 으로 교체.
- `npm run lint` 0 경고, plugin validator 오류 0, `design.md` 대응표에 변경·신규·진행 중 잔재 없음.
