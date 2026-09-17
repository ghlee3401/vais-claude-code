# 제품 노트 — 왜

> 자동 생성 (`.vais/v2/ledger.jsonl` 61건). 결정·피드백·취향·부채·리스크·이정표 순.

## 결정 (23)

- 2026-09-16 11:54 · WI-2026-09-16-regression-and-docs · 저장은 `git add -A -- .` 로 `.gitignore` 를 존중하고, `.vais/` 는 add 뒤 `git rm --cached` 로 빼낸다. exclude pathspec 은 무시 규칙과 겹치면 git 이 실패하므로 쓰지 않는다. — Design revision 1 에서 확정
- 2026-09-16 11:54 · WI-2026-09-16-regression-and-docs · `commit` 은 정확히 그 단어 하나일 때만 저장 별칭이다. 뒤에 말이 붙으면 새 요청으로 본다(저장 메시지는 `저장 <메시지>` 로만). — Design revision 1 에서 확정
- 2026-09-16 11:54 · WI-2026-09-16-regression-and-docs · 저장 실패 reason 은 사용자 말로 "스테이지 N개 됨 · 커밋 안 됨 · 원인" 을 담는다. 재시도는 runtime 이 하지 않는다. — Design revision 1 에서 확정
- 2026-09-16 11:54 · WI-2026-09-16-regression-and-docs · 회귀 helper 는 준비 코드만 모으고 판정 코드는 각 장면에 남긴다. 장면 파일 하나가 설계 §11 장면 하나다. — Design revision 1 에서 확정
- 2026-09-16 11:54 · WI-2026-09-16-regression-and-docs · 4.0.0 은 새 기능 없이 "사용자 루프·양식 넷·노트·명령·kind 가 한 벌 완성" 을 뜻한다. — Design revision 1 에서 확정
- 2026-09-16 10:55 · WI-2026-09-16-feature-bug-kinds · 구현 kind 의 Design 에서 "만드는 것" 은 인용 ID 와 신규 ID 항목만이다. 서술은 `## 안 N` 의 접근 설명에만 둔다. — Design revision 1 에서 확정
- 2026-09-16 10:55 · WI-2026-09-16-feature-bug-kinds · 신규 항목은 Do 가 READY 일 때 runtime 이 정본에 붙인다. AI 가 제품 문서를 직접 편집하지 않는다(write scope 도 열지 않음). — Design revision 1 에서 확정
- 2026-09-16 10:55 · WI-2026-09-16-feature-bug-kinds · 신규 항목은 append 시 `draft`, Report 확정 시 `approved` + `implemented`. 승인 없는 항목이 사슬에 남지 않는다. — Design revision 1 에서 확정
- 2026-09-16 10:55 · WI-2026-09-16-feature-bug-kinds · stale 은 Design 제시 자체를 막는다(문서를 쓰기 전). 해소는 재승인 또는 `/vais 변경 없음 확인`. — Design revision 1 에서 확정
- 2026-09-16 10:55 · WI-2026-09-16-feature-bug-kinds · 앱 실행 명령은 배열로만 받고 셸을 거치지 않는다. 캡처 뒤 반드시 종료한다. — Design revision 1 에서 확정
- 2026-09-16 10:55 · WI-2026-09-16-feature-bug-kinds · 사슬이 비어 있으면 feature/bug 를 시작할 수 없다(예외 없음, 사용자 확인 2026-09-16). — Design revision 1 에서 확정
- 2026-09-16 09:33 · WI-2026-09-16-commands · 커밋 메시지에는 Work item ID 와 `Generated-By: vais-code <version>` trailer 가 붙어 되돌리기가 ID 로 커밋을 찾을 수 있다. — Design revision 1 에서 확정
- 2026-09-16 09:33 · WI-2026-09-16-commands · 용어 사전은 데이터(`contracts/glossary.json`)로 두어 코드 수정 없이 늘린다. — Design revision 1 에서 확정
- 2026-09-16 09:33 · WI-2026-09-16-commands · 브리핑 문장 생성을 lib 로 옮겨 상태 명령·세션 시작·상태 줄이 한 출처를 쓴다. — Design revision 1 에서 확정
- 2026-09-16 09:33 · WI-2026-09-16-commands · Report 결과 500자 초과는 조용히 자르지 않고 거부한다(동결 문서는 고칠 수 없으므로). — Design revision 1 에서 확정
- 2026-09-16 09:33 · WI-2026-09-16-commands · 쓰기 명령은 항상 두 단계다. 확인 문구는 사용자 프롬프트에서만 토큰이 되고 같은 세션 authorization 안에서 1회만 유효하다. — Design revision 1 에서 확정
- 2026-09-16 09:33 · WI-2026-09-16-commands · runtime 이 실행하는 git 은 `add -A`·`commit`·`revert --no-edit`(실패 시 `--abort`) 셋뿐이다. push·force·reset 은 없다. — Design revision 1 에서 확정
- 2026-09-16 08:17 · WI-2026-09-16-ui-loop · 그림 없는 승인은 없다: options-screens Design 과 ui do ready 는 PNG 가 없으면 Gate 를 통과하지 못한다. Chrome 이 없으면 멈추고 doctor 가 설치를 안내한다. — Design revision 1 에서 확정
- 2026-09-16 08:17 · WI-2026-09-16-ui-loop · 수정 요청은 Design 세부 수정(material=false) 경로를 재사용한다. 회차마다 Design 정본에 "수정 회차 N" 이 남아 무엇을 왜 바꿨는지 추적된다. — Design revision 1 에서 확정
- 2026-09-16 08:17 · WI-2026-09-16-ui-loop · 시안 사본은 Work item 폴더(`02-design/options/N/`) 안에만 둔다. 제품 코드는 Do 에서만 바뀐다. — Design revision 1 에서 확정
- 2026-09-16 08:17 · WI-2026-09-16-ui-loop · `vais.config.json` 에 `ui` 블록(appRoot·entry·url)을 추가한다. 이 Design 승인이 키 구조 변경 합의다. doctor `unknown-keys` 는 workflowV2 블록만 보므로 영향 없다. — Design revision 1 에서 확정
- 2026-09-16 08:17 · WI-2026-09-16-ui-loop · 테스트는 stub 렌더러로 결정적으로 돌리고 receipt 에 stub 임을 남긴다. 실제 렌더 검증은 Chrome 이 있는 환경의 별도 테스트와 사용자 확인으로 한다. — Design revision 1 에서 확정
- 2026-09-16 08:17 · WI-2026-09-16-ui-loop · 취향은 제품 전체 속성이라 feature 를 넘어 주입한다. — Design revision 1 에서 확정

## 부채 (21)

- 2026-09-17 00:58 · WI-2026-09-16-regression-and-docs · 이전에 git 이 추적하던 .vais/ 파일이 있는 프로젝트는 저장 때 그 파일들이 삭제로 커밋된다(이 repo 는 해당 없음) — WI-2026-09-16-regression-and-docs Report 의 잔여 제한
- 2026-09-17 00:58 · WI-2026-09-16-regression-and-docs · 저장 실패 문구는 커밋되지 않았다 로 시작해 문서의 커밋 안 됨 표현과 글자가 다르다 — WI-2026-09-16-regression-and-docs Report 의 잔여 제한
- 2026-09-17 00:58 · WI-2026-09-16-regression-and-docs · 회귀 60초 상한은 테스트가 강제하지 않고 QA 가 측정했다(현재 3초) — WI-2026-09-16-regression-and-docs Report 의 잔여 제한
- 2026-09-16 11:35 · WI-2026-09-16-feature-bug-kinds · 앱 조기 종료 감지는 Linux /proc 전제, 다른 OS 는 readyTimeoutMs 만료로만 실패 — WI-2026-09-16-feature-bug-kinds Report 의 잔여 제한
- 2026-09-16 11:35 · WI-2026-09-16-feature-bug-kinds · withApp 대기는 동기 폴링(300ms)이라 transaction 중 다른 일을 하지 않는다 — WI-2026-09-16-feature-bug-kinds Report 의 잔여 제한
- 2026-09-16 11:35 · WI-2026-09-16-feature-bug-kinds · 실제 Chrome 캡처와 플러그인 캐시 반영은 테스트하지 않았다(stub 렌더러, 3.6.0 업데이트 전) — WI-2026-09-16-feature-bug-kinds Report 의 잔여 제한
- 2026-09-16 11:24 · WI-2026-09-16-feature-bug-kinds · QA FAIL: independent-qa-handoff — 독립 QA 가 independent-qa-handoff 를 실패로 판정했다 (수정 회차 1)
- 2026-09-16 10:07 · WI-2026-09-16-commands · roadmap H5 상태를 완료로 바꾸는 것은 H6 Do 에서 한다 — WI-2026-09-16-commands Report 의 잔여 제한
- 2026-09-16 10:07 · WI-2026-09-16-commands · 문서의 '버전 6곳' 표기와 실제 저장 검사 7면(manifest 5 + README 배지 + CHANGELOG 헤더)이 혼재한다 — WI-2026-09-16-commands Report 의 잔여 제한
- 2026-09-16 10:07 · WI-2026-09-16-commands · prompt hook 의 ledger-add-invalid 지침 분기는 router 가 종류 오류 기록을 일반 요청으로 흘려보내 도달하지 않는다 (무해한 죽은 분기, H7 정리) — WI-2026-09-16-commands Report 의 잔여 제한
- 2026-09-16 10:07 · WI-2026-09-16-commands · 되돌리기는 미커밋 변경이 있으면 전면 거부한다 (먼저 /vais 저장). revert 충돌 시 abort 경로는 테스트되지 않았다 — WI-2026-09-16-commands Report 의 잔여 제한
- 2026-09-16 10:07 · WI-2026-09-16-commands · Claude Code 실제 hook 경로의 끝-끝 실행과 플러그인 캐시 3.5.0 반영은 push·업데이트 뒤 새 세션에서 확인한다 — WI-2026-09-16-commands Report 의 잔여 제한
- 2026-09-16 10:07 · WI-2026-09-16-commands · 이 작업의 커밋은 3.4.0 런타임에서 사용자가 ! git 으로 직접 한다. /vais 저장 흐름은 다음 작업부터 — WI-2026-09-16-commands Report 의 잔여 제한
- 2026-09-16 09:08 · WI-2026-09-16-ui-loop · 예약 check screenshot-compare 를 Design 에 선언하면 gate 가 BLOCKED 된다 (미구현 자리) — WI-2026-09-16-ui-loop Report 의 잔여 제한
- 2026-09-16 09:08 · WI-2026-09-16-ui-loop · W·V 산출물 PNG 렌더가 Review 의 stage-document 검사에서 다시 실행된다 — WI-2026-09-16-ui-loop Report 의 잔여 제한
- 2026-09-16 09:08 · WI-2026-09-16-ui-loop · 실제 Chrome 으로 do ready 전 구간은 사용자 프로젝트에서 확인한다 (단위·회귀는 stub, 캡처 자체는 실제 Chrome 테스트로 검증). 실행 플러그인 3.3.0 이라 push·업데이트 뒤 반영 — WI-2026-09-16-ui-loop Report 의 잔여 제한
- 2026-09-16 09:08 · WI-2026-09-16-ui-loop · roadmap H4 상태를 완료로 바꾸는 것은 H5 Do 에서 한다 — WI-2026-09-16-ui-loop Report 의 잔여 제한
- 2026-09-16 09:08 · WI-2026-09-16-ui-loop · material Design 개정 뒤에도 chosenOption 이 유지된다 (새 시안 세트에서 다시 고르게 하는 초기화는 H5/H6 에서) — WI-2026-09-16-ui-loop Report 의 잔여 제한
- 2026-09-16 09:08 · WI-2026-09-16-ui-loop · ui 트리거 '색' 이 '검색' 같은 요청에도 ui kind 를 오제안할 수 있다 (사용자가 Plan 에서 kind 확인) — WI-2026-09-16-ui-loop Report 의 잔여 제한
- 2026-09-16 09:08 · WI-2026-09-16-ui-loop · do/blocked(수정 상한) 에서 수정 문장은 적용되지 않고 확인·취소만 유효하다. blocked 경로는 단위 테스트로만 검증(장면 C 미포함) — WI-2026-09-16-ui-loop Report 의 잔여 제한
- 2026-09-16 08:43 · WI-2026-09-16-ui-loop · QA FAIL: independent-qa-handoff — 독립 QA 가 independent-qa-handoff 를 실패로 판정했다 (수정 회차 1)

## 리스크 (1)

- 2026-09-16 11:16 · WI-2026-09-16-feature-bug-kinds · Do 준비 미달 1회: test — readiness 검사가 실패했다

## 이정표 (16)

- 2026-09-17 00:58 · WI-2026-09-16-regression-and-docs · 작업 완료 — H7 회귀 세트와 문서 정리 (4.0.0) — Report 가 확정되어 동결됐다
- 2026-09-17 00:27 · WI-2026-09-16-regression-and-docs · 최종 승인 — H7 회귀 세트와 문서 정리 (4.0.0) — 독립 QA PASS 뒤 사용자가 결과를 승인했다
- 2026-09-16 11:54 · WI-2026-09-16-regression-and-docs · Design 승인 (revision 1) — H7 회귀 세트와 문서 정리 (4.0.0) — 사용자가 Design 을 승인했다
- 2026-09-16 11:51 · WI-2026-09-16-regression-and-docs · Plan 승인 (revision 1) — H7 회귀 세트와 문서 정리 (4.0.0) — 사용자가 Plan 을 승인했다
- 2026-09-16 11:35 · WI-2026-09-16-feature-bug-kinds · 작업 완료 — 기능·버그 작업 종류 · 인용 강제 · 문서 갱신 · 앱 실행 — Report 가 확정되어 동결됐다
- 2026-09-16 11:34 · WI-2026-09-16-feature-bug-kinds · 최종 승인 — 기능·버그 작업 종류 · 인용 강제 · 문서 갱신 · 앱 실행 — 독립 QA PASS 뒤 사용자가 결과를 승인했다
- 2026-09-16 10:55 · WI-2026-09-16-feature-bug-kinds · Design 승인 (revision 1) — 기능·버그 작업 종류 · 인용 강제 · 문서 갱신 · 앱 실행 — 사용자가 Design 을 승인했다
- 2026-09-16 10:40 · WI-2026-09-16-feature-bug-kinds · Plan 승인 (revision 1) — 기능·버그 작업 종류 · 인용 강제 · 문서 갱신 · 앱 실행 — 사용자가 Plan 을 승인했다
- 2026-09-16 10:07 · WI-2026-09-16-commands · 작업 완료 — 사용자 명령 · 상태 설명 저장 되돌리기 제안 기록 — Report 가 확정되어 동결됐다
- 2026-09-16 10:07 · WI-2026-09-16-commands · 최종 승인 — 사용자 명령 · 상태 설명 저장 되돌리기 제안 기록 — 독립 QA PASS 뒤 사용자가 결과를 승인했다
- 2026-09-16 09:33 · WI-2026-09-16-commands · Design 승인 (revision 1) — 사용자 명령 · 상태 설명 저장 되돌리기 제안 기록 — 사용자가 Design 을 승인했다
- 2026-09-16 09:22 · WI-2026-09-16-commands · Plan 승인 (revision 1) — 사용자 명령 · 상태 설명 저장 되돌리기 제안 기록 — 사용자가 Plan 을 승인했다
- 2026-09-16 09:08 · WI-2026-09-16-ui-loop · 작업 완료 — UI 루프 · 화면 확인 정지점 · 스크린샷 · 취향 장부 — Report 가 확정되어 동결됐다
- 2026-09-16 09:07 · WI-2026-09-16-ui-loop · 최종 승인 — UI 루프 · 화면 확인 정지점 · 스크린샷 · 취향 장부 — 독립 QA PASS 뒤 사용자가 결과를 승인했다
- 2026-09-16 08:17 · WI-2026-09-16-ui-loop · Design 승인 (revision 1) — UI 루프 · 화면 확인 정지점 · 스크린샷 · 취향 장부 — 사용자가 Design 을 승인했다
- 2026-09-16 08:11 · WI-2026-09-16-ui-loop · Plan 승인 (revision 1) — UI 루프 · 화면 확인 정지점 · 스크린샷 · 취향 장부 — 사용자가 Plan 을 승인했다

