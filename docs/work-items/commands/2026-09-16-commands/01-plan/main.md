---
schema: vais-phase/v1
work_item: WI-2026-09-16-commands
phase: plan
revision: 1
status: approved
based_on: []
---

# Plan — 사용자 명령 (commands, 로드맵 H5)

## 한 줄 요약

비개발자용 명령 다섯(상태·설명·저장·되돌리기·doctor)과 부속 셋(제안·기록·기록 보기)을 `/vais` 한 단어로 만들고, 저장·되돌리기·기록처럼 상태를 바꾸는 것은 사용자가 직접 확인한 뒤에만 runtime 이 실행한다. 근거 `docs/harness/design.md` 7절·대응표, 로드맵 H5. 완료 조건은 명령 표대로 동작하는 회귀 통과. kind: harness. 규모: standard.

## 1. 문제

- 커밋은 사용자가 `! git` 을 손으로 치고 AI 가 메시지를 불러준다. 버전 6곳 동기화도 사람이 기억해야 한다.
- 되돌리기가 없어 잘못된 작업을 물리려면 git 을 알아야 한다.
- "F-003 이 뭐였지" 에 답하는 명령이 없고 상태는 JSON 뿐이다. 장부에 사람이 직접 남기는 길도 없다.
- H4 잔여: material Design 개정 뒤 `chosenOption` 유지, 트리거 `색` 오제안, Report 결과 500자 잘림.

## 2. 목표

router 가 명령을 결정적으로 인식하고, 읽기 명령은 runtime 이 사람 말로 답하며, 쓰기 명령(저장·되돌리기·기록)은 "제안 → 사용자 확인 문구 → runtime 실행" 두 단계로만 진행한다. AI 가 git 을 직접 치는 길은 열지 않는다.

## 3. 범위

포함: 상태·설명·저장(+확인)·되돌리기(+확인)·제안·기록·기록 보기, 도움말 표, doctor git 검사, H4 잔여 3건, 회귀, 문서·버전 3.5.0.
제외: feature/bug kind·인용 강제(H6), 회귀 6장면 완성·4.0.0(H7), MCP 결정(H8), 원격 push(사용자가 직접).

## 4. 요구사항

| ID | 요구사항 | 완료 조건 |
|---|---|---|
| REQ-001 | `/vais 상태`: 현재 작업·단계·기다리는 결정·부채·stale·제안 3 을 사람 말 한 단락으로. | 활성 있음/없음 두 경우 형식 고정. |
| REQ-002 | `/vais 설명 <대상>`: ID 면 부모·자식·만든 작업·승인일·stale, 용어면 사전 정의, 파일이면 정본 종류·상태·관련 작업. 모르면 "모른다". | 세 종류 + 미지 대상 테스트. |
| REQ-003 | `/vais 저장 [메시지]`: 버전 6곳 검사 → 변경 요약 → 메시지 제안. `/vais 저장 확인` 뒤에만 runtime 이 `git add -A`·`commit`. 불일치면 커밋 안 함. | 확인 없이 불가, 확인 뒤 커밋 1개, 불일치 거부. |
| REQ-004 | `/vais 되돌리기 <작업 id\|커밋>`: 되돌릴 커밋·파일 목록 제시. `/vais 되돌리기 확인: <대상>` 뒤에만 `git revert --no-edit`. | 확인 없이 불가, 확인 뒤 revert 1개, 없는 대상 거부. |
| REQ-005 | `/vais 제안`: 제안 엔진 결과 ≤3 을 사람 말로. | 브리핑과 같은 근거. |
| REQ-006 | `/vais 기록 <종류> <내용>`: decision·feedback·preference·debt·risk·note, `source user`. `/vais 기록 보기 [종류]` 최근 10건. | 종류 오류 거부, 기록 뒤 보기에 나옴. |
| REQ-007 | router·hook: 명령 8종 인식, 도움말 표. 확인 문구는 사용자 입력에서만 토큰 발급(AI 대리 불가). | 라우팅 테스트, 토큰 없는 CLI 거부. |
| REQ-008 | H4 잔여: material Design 개정 시 `chosenOption` 초기화, 트리거 `색` → `색상`·`색이`·`색을`·`색은`, Report `--outcome` 500자 초과 거부. | 각 테스트 통과. |
| REQ-009 | doctor: git 저장소·미커밋 변경 수·원격 존재 검사. | 3 경우 pass/warn. |
| REQ-010 | 회귀 `tests/regression/commands.test.js`: 임시 git repo 에서 8 명령 표대로 실행(커밋·revert 포함). | `npm run regression` 통과. |
| REQ-011 | 문서·버전: roadmap H4 완료·H5 진행, design.md 대응표, README 명령 표, CLAUDE, ONBOARDING, CHANGELOG, 3.5.0. | doctor version-sync PASS. |

## 5. 사용자 흐름

1. `/vais 상태` → "진행 중 작업 없음. 부채 8, stale 0. 제안: ① … ② … ③ …".
2. `/vais 설명 F-003` → "기능 정의서 항목. 부모 REQ-002, 자식 S-001·TC-004, WI-… 에서 승인, stale 아님".
3. `/vais 저장` → 버전 일치 확인·변경 요약·메시지 제안 → `/vais 저장 확인` → runtime 이 커밋, 해시 표시. push 는 사용자.
4. `/vais 되돌리기 WI-…-ui-loop` → 커밋·파일 목록 → `/vais 되돌리기 확인: WI-…-ui-loop` → revert 커밋.
5. `/vais 기록 취향 버튼은 항상 파랑` → preference. `/vais 기록 보기 취향`.

## 6. 엣지 케이스

| 상황 | 처리 |
|---|---|
| 저장 시 버전 불일치 | 커밋 거부, 다른 파일 표시. |
| 진행 중 작업이 있는데 저장 | 허용 + 경고, 작업 ID 를 메시지에. |
| revert 충돌·이미 되돌림 | 중단, 이유 표시, 트리 원상 복구. |
| AI 가 확인 문구를 대신 침 | hook 이 사용자 입력만 토큰으로 발급 → CLI 거부. |
| 설명 대상 없음 | "찾지 못했다" + 후보. |
| git 없는 프로젝트 | 저장·되돌리기가 이유를 말하고 doctor 안내. |

## 7. 완료 조건

REQ-001~011 테스트 증명, 회귀 A·C·E·F + commands 통과, `npm test`·`lint`·`validate`·`regression`·`doctor` PASS, 독립 QA PASS, 최종 승인.

## 8. 영향

변경: router·prompt hook·CLI·doctor·state-machine·work-kinds·phase-transaction. 신규: `explain.js`, `vcs.js`, 용어 사전, 회귀 1. `! git commit` 은 `/vais 저장` → `/vais 저장 확인` 으로 바뀐다. 반영은 push·업데이트 뒤.
