# 제품 노트 — 왜

> 자동 생성 (`.vais/v2/ledger.jsonl` 98건). 결정·피드백·취향·부채·리스크·이정표 순.

## 결정 (35)

- 2026-09-17 08:14 · WI-2026-09-17-harness-doc-budget · 설정 키는 최상위 `documentBudgets` 다(`workflowV2` 아래가 아님). 부분 덮어쓰기를 허용하고, 잘못된 값은 그 칸만 무시해 닫힘으로 동작한다. — Design revision 1 에서 확정
- 2026-09-17 08:14 · WI-2026-09-17-harness-doc-budget · 버전은 4.1.0. 하네스 판정이 바뀌므로 minor 다. — Design revision 1 에서 확정
- 2026-09-17 08:14 · WI-2026-09-17-harness-doc-budget · 예산 원칙은 유지하고 값만 올린다. 기준은 "지난 실측 최대가 새 한도의 75% 이하" 이며 1.4배·1024 배수로 정했다. 80자 복사 금지·extended 예외 승인은 그대로. — Design revision 1 에서 확정
- 2026-09-17 07:36 · WI-2026-09-17-harness-docs-module-count · 모듈 수 표기는 세 문서 모두 "38 모듈" 로 쓰고, 기준(폴더의 js 파일 수, index.js 포함)은 README 기준 줄 한 곳에만 둔다. CLAUDE·ONBOARDING 은 수만 적는다. — Design revision 1 에서 확정
- 2026-09-17 07:36 · WI-2026-09-17-harness-docs-module-count · 버전은 4.0.1 유지. 이번도 문서만 바뀐다. — Design revision 1 에서 확정
- 2026-09-17 07:25 · WI-2026-09-17-harness-readme-status-2 · 버전은 4.0.1 을 유지한다. 문서 한 파일 갱신이라 플러그인 동작이 바뀌지 않는다 (사용자 확인 2026-09-17). — Design revision 1 에서 확정
- 2026-09-17 07:25 · WI-2026-09-17-harness-readme-status-2 · 모듈 수는 `lib/workflow/v2/*.js` 파일 수(index.js 포함)로 센다. CLAUDE.md·ONBOARDING 의 "35 모듈" 과 다른데, 그 두 문서는 이번 범위 밖이라 Report 잔여 제한으로 남긴다. — Design revision 1 에서 확정
- 2026-09-17 07:25 · WI-2026-09-17-harness-readme-status-2 · CHANGELOG 는 `[Unreleased]` 절로 적는다. 이미 커밋된 `[4.0.1]` 절을 고치지 않는다. — Design revision 1 에서 확정
- 2026-09-17 01:18 · WI-2026-09-17-design-system-mcp · 유지안 기각: 연결 실패 원인 재현·수리와 Python 의존성 유지가 compact 를 넘고, 쓰는 코드가 없어 고쳐도 사용처가 없다. — Design revision 1 에서 확정
- 2026-09-17 01:18 · WI-2026-09-17-design-system-mcp · 축소안(브랜드 DESIGN.md 5종만 참고 자료로 보관) 기각: INDEX 가 Legacy 를 가리키는 죽은 문서라 정본이 없고, 필요하면 원본(VoltAgent/awesome-design-md)이나 git 이력에서 가져온다. — Design revision 1 에서 확정
- 2026-09-17 01:18 · WI-2026-09-17-design-system-mcp · 되살림 경로: git 태그 없이 4.0.0 커밋(`66d0f6b`)에서 세 폴더를 checkout 하면 된다. Report 에 적는다. — Design revision 1 에서 확정
- 2026-09-17 01:18 · WI-2026-09-17-design-system-mcp · 디자인 시스템 MCP(`mcp/`·`.mcp.json`·plugin.json mcpServers)·`vendor/ui-ux-pro-max`·`design-system/` 를 전부 삭제한다. 근거: 세션 내내 "Connection closed" 로 연결 실패, lib·hooks·scripts 에 참조 0, Python3 의존성이 비개발자 설치를 무겁게 함, 5단계 디자인 시스템은 H4 이후 스크린샷 3안으로 동작. — Design revision 1 에서 확정
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

## 부채 (30)

- 2026-09-17 08:26 · WI-2026-09-17-harness-doc-budget · 새 예산은 push 후 플러그인을 4.1.0 으로 업데이트해야 이 저장소에서도 적용된다. 실행 중 캐시는 4.0.1 — WI-2026-09-17-harness-doc-budget Report 의 잔여 제한
- 2026-09-17 08:26 · WI-2026-09-17-harness-doc-budget · 독립 QA specialist 가 세 작업 연속으로 읽기 전용 handoff 에 files 항목을 넣거나 문자열 한도를 넘겨 재출력을 받았다. agents/v2-specialist.md 지시문에 읽기 전용이면 files 금지와 문자열 한도 표를 못 박는 것이 다음 하네스 작업 후보다(harness-docs-module-count 의 잔여 제한과 같음) — WI-2026-09-17-harness-doc-budget Report 의 잔여 제한
- 2026-09-17 08:26 · WI-2026-09-17-harness-doc-budget · 예외 승인됐던 extended Design 28,280B 는 새 한도 26,624B 도 넘어 예외 절차가 그대로 필요하다 — WI-2026-09-17-harness-doc-budget Report 의 잔여 제한
- 2026-09-17 07:48 · WI-2026-09-17-harness-docs-module-count · 독립 QA specialist 가 두 작업 연속으로 읽기 전용 handoff 에 files 항목을 넣어 등록이 거부되고 재출력을 받았다. agents/v2-specialist.md 지시문에 읽기 전용이면 files 금지를 못 박는 것이 다음 하네스 작업 후보다 — WI-2026-09-17-harness-docs-module-count Report 의 잔여 제한
- 2026-09-17 07:30 · WI-2026-09-17-harness-readme-status-2 · CLAUDE.md 와 ONBOARDING.md 의 '35 모듈' 표기가 실제 38 과 다르다(이번 범위 밖, 다음 문서 작업에서 맞춘다) — WI-2026-09-17-harness-readme-status-2 Report 의 잔여 제한
- 2026-09-17 07:30 · WI-2026-09-17-harness-readme-status-2 · README 세는 기준 줄의 '최상위 키' 는 정확히는 hooks.json 의 hooks 아래 키를 뜻한다(동작 무관, 표현 손질 후보) — WI-2026-09-17-harness-readme-status-2 Report 의 잔여 제한
- 2026-09-17 01:32 · WI-2026-09-17-design-system-mcp · package-lock.json 루트 버전이 3.0.1 로 남아 있다(동작 무관, 버전 7면 밖). 다음 하네스 작업에서 npm install 로 맞춘다 — WI-2026-09-17-design-system-mcp Report 의 잔여 제한
- 2026-09-17 01:32 · WI-2026-09-17-design-system-mcp · 개인 설정 .claude/settings.local.json 에 옛 MCP 도구 허용 항목이 남아 있다(저장소 밖, 사용자가 지운다) — WI-2026-09-17-design-system-mcp Report 의 잔여 제한
- 2026-09-17 01:32 · WI-2026-09-17-design-system-mcp · write guard 가 승인된 쓰기 범위 안에서도 AI 의 rm·git rm 을 막아 삭제는 사용자가 직접 실행했다 — WI-2026-09-17-design-system-mcp Report 의 잔여 제한
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

## 이정표 (32)

- 2026-09-17 08:26 · WI-2026-09-17-harness-doc-budget · 작업 완료 — 문서 예산 상향과 설정화 — Report 가 확정되어 동결됐다
- 2026-09-17 08:26 · WI-2026-09-17-harness-doc-budget · 최종 승인 — 문서 예산 상향과 설정화 — 독립 QA PASS 뒤 사용자가 결과를 승인했다
- 2026-09-17 08:14 · WI-2026-09-17-harness-doc-budget · Design 승인 (revision 1) — 문서 예산 상향과 설정화 — 사용자가 Design 을 승인했다
- 2026-09-17 08:12 · WI-2026-09-17-harness-doc-budget · Plan 승인 (revision 1) — 문서 예산 상향과 설정화 — 사용자가 Plan 을 승인했다
- 2026-09-17 07:48 · WI-2026-09-17-harness-docs-module-count · 작업 완료 — 모듈 수 표기 통일과 기준 줄 손질 — Report 가 확정되어 동결됐다
- 2026-09-17 07:48 · WI-2026-09-17-harness-docs-module-count · 최종 승인 — 모듈 수 표기 통일과 기준 줄 손질 — 독립 QA PASS 뒤 사용자가 결과를 승인했다
- 2026-09-17 07:36 · WI-2026-09-17-harness-docs-module-count · Design 승인 (revision 1) — 모듈 수 표기 통일과 기준 줄 손질 — 사용자가 Design 을 승인했다
- 2026-09-17 07:35 · WI-2026-09-17-harness-docs-module-count · Plan 승인 (revision 1) — 모듈 수 표기 통일과 기준 줄 손질 — 사용자가 Plan 을 승인했다
- 2026-09-17 07:30 · WI-2026-09-17-harness-readme-status-2 · 작업 완료 — 하네스 README 상태 표 갱신 — Report 가 확정되어 동결됐다
- 2026-09-17 07:30 · WI-2026-09-17-harness-readme-status-2 · 최종 승인 — 하네스 README 상태 표 갱신 — 독립 QA PASS 뒤 사용자가 결과를 승인했다
- 2026-09-17 07:25 · WI-2026-09-17-harness-readme-status-2 · Design 승인 (revision 1) — 하네스 README 상태 표 갱신 — 사용자가 Design 을 승인했다
- 2026-09-17 07:23 · WI-2026-09-17-harness-readme-status-2 · Plan 승인 (revision 1) — 하네스 README 상태 표 갱신 — 사용자가 Plan 을 승인했다
- 2026-09-17 01:32 · WI-2026-09-17-design-system-mcp · 작업 완료 — H8 디자인 시스템 MCP 유지·삭제 결정 — Report 가 확정되어 동결됐다
- 2026-09-17 01:32 · WI-2026-09-17-design-system-mcp · 최종 승인 — H8 디자인 시스템 MCP 유지·삭제 결정 — 독립 QA PASS 뒤 사용자가 결과를 승인했다
- 2026-09-17 01:18 · WI-2026-09-17-design-system-mcp · Design 승인 (revision 1) — H8 디자인 시스템 MCP 유지·삭제 결정 — 사용자가 Design 을 승인했다
- 2026-09-17 01:15 · WI-2026-09-17-design-system-mcp · Plan 승인 (revision 1) — H8 디자인 시스템 MCP 유지·삭제 결정 — 사용자가 Plan 을 승인했다
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

