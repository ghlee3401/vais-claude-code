---
schema: vais-phase/v1
work_item: WI-2026-09-17-harness-diagram-skill
phase: design
revision: 1
status: approved
based_on: []
---

# Design — 다이어그램 스킬 흡수 (harness-diagram-skill)

## 1. 접근

원본 `cathrynlavery/diagram-design` 의 `skills/diagram-design/` 에서 지시문·스타일 규칙·유형 참조 11개·예제 몇 개를 가져와 우리 스킬 `skills/diagram/` 로 고쳐 쓴다(스냅샷, 동기화 없음). 진입은 둘: 스킬 설명문으로 스스로 켜짐(`/vais-code:diagram`) + `/vais diagram <요청>` 명령이 산출 폴더 authorization 을 발급. 내보내기는 새 CLI `diagram export` 가 SVG(Node 추출)·PNG(기존 `renderArtifact`)를 만든다. 3단계는 계약 한 줄(`renderArtifacts`)로 흐름 파일 HTML 을 PNG 로 찍는다. 위임 없음.

Do 첫 단계는 사용자 행동이다: `! git clone --depth 1 https://github.com/cathrynlavery/diagram-design references/diagram-design` (write guard 가 AI 의 clone 을 막음). `.gitignore` 에 `references/` 를 넣어 인박스로 쓴다. 가져온 커밋 해시를 출처 표기에 적는다. (2026-09-17 09:05 기준 clone 과 `.gitignore` 반영은 끝났다.)

## 2. REQ 별 동작 · 입력 · 출력 · 오류 · 결정 · TC

| REQ | 동작 | 입력 | 출력 | 오류 | 구현 결정 | TC |
|---|---|---|---|---|---|---|
| REQ-001 | 스킬 동봉 | `references/diagram-design/skills/diagram-design/**` | `skills/diagram/SKILL.md`(≤24KB), `LICENSE`, `references/{style-guide,semantic-patterns}.md` + 유형 11: flowchart·journey·swimlane·sequence·state·architecture·high-level·data-flow·er·timeline·tree, `assets/example-*.html`(남긴 유형 중 원본에 light 예제가 있는 것만) | 검증기 실패 → NOT_READY | SKILL.md 는 원본 §1~§10·§12 를 우리 말로 다시 쓴다. 뺀 것: §0 브랜드 게이트·`.diagram-design` 마커·profiles·onboarding, §11 가져오기, Python·Playwright·`verify-*`·`self_check` 언급 전부, 40종 표 중 뺀 29종. 바꾼 것: 저장 위치 = hook 이 허용한 폴더, PNG = `diagram export`, 글꼴은 Google Fonts 링크 유지(오프라인이면 대체 글꼴). 머리에 `원본: cathrynlavery/diagram-design main@<sha> (2026-09-17, MIT)` | TC-001 |
| REQ-002 | 독립 진입 | `/vais diagram <요청>` | authorization(allowedPaths += `docs/diagrams/**`, 활성 Work item 이 있으면 그 phase 경로도 유지) + 지침 | `/vais` 없는 턴: 스킬이 저장 대신 `/vais diagram` 안내 | `router.js` COMMAND_PATTERNS 에 `['diagram', /^(?:diagram|다이어그램)\s+(.+)$/i, true]`; 상태 머신은 건드리지 않음(save 처럼 state 무관). `config.js` `loadDiagramConfig` → `vais.config.json > diagrams.dir`(기본 `docs/diagrams`). prompt hook `commandGuidance` case `diagram`: 스킬을 Skill 도구로 켜고 `<dir>/<slug>.html` 에 쓰며, 요청에 svg·png 가 있으면 `diagram export` | TC-002 |
| REQ-003 | 내보내기 | `diagram export --session <id> --file <html> [--svg] [--png]` | 같은 폴더에 `.svg`·`.png` | 파일이 allowedPaths 밖 → 거부; Chrome 없음 → png 생략 + INSTALL_HINT | 새 `lib/workflow/v2/diagram.js`: `extractSvg(html)`(첫 `<svg…</svg>` + `<defs>` 에 글꼴 `@import`, `&`→`&amp;`), `exportDiagram(root, file, opts)`(PNG 는 `screen-capture.renderArtifact` 재사용). CLI 는 authorization 의 allowedPaths 로 파일을 검사(action 무관) | TC-003 |
| REQ-004 | 사슬 연결 | `contracts/chain-stages.json` stage-screens | `renderArtifacts: true`, `diagram: ["flowchart","journey"]` | `.mmd` 는 렌더 대상 아님(기존 regex 가 html·svg 만) | `stagePhaseLines.design` 에 stage.diagram 이 있으면 한 줄 추가: "안 마다 흐름도를 `skills/diagram` 규칙으로 `02-design/options/N/flow.html` 에 그리고 `screens capture` 로 PNG 를 찍어 응답에 보인다". Do 지침에 "흐름 파일은 `.html`(권장) 또는 `.mmd`". `schemas/chain-stage.schema.json` 에 `diagram` 키 허용 | TC-004 |
| REQ-005 | 문서·버전 | — | 4.2.0 | — | README "다이어그램" 절(두 진입·산출 폴더·내보내기·3단계), CLAUDE 규칙 17 + 구조도 `skills/diagram/`, ONBOARDING 표, design.md 대응표 행, CHANGELOG [4.2.0], 버전 7면 | TC-005 |

## 3. 결정

- 원본은 통째로 동기화하지 않고 우리 사정에 맞게 고친 스냅샷으로 갖는다. 출처는 파일 머리와 `LICENSE`(MIT) 로 남기고, 갱신은 필요할 때 사람이 원본과 비교한다. 릴리스가 없어 커밋 해시로 고정한다.
- 유형은 개발 문서용 11종만 남긴다: 흐름도·유저 저니·스윔레인·시퀀스·상태 기계·구조도·상위 구조·데이터 흐름·ER·타임라인·트리. 나머지 29종은 요청 시 "지원 목록 + 가장 가까운 유형" 으로 안내한다.
- Python·Playwright·가져오기·기하 검증은 가져오지 않는다. PNG 는 기존 Chrome 캡처, SVG 는 Node 추출 20줄로 대신한다.
- 독립 사용의 산출 폴더는 `docs/diagrams/`(`vais.config.json > diagrams.dir`), `/vais diagram` 이 그 폴더를 그 턴의 write scope 에 넣는다. `/vais` 없는 요청은 저장하지 않고 안내한다.
- 3단계 Design 은 흐름도 안을 그림으로 보이고, Do 의 흐름 파일은 `.html` 을 권장하되 `.mmd` 도 계속 받는다(기존 제품 호환).
- 버전 4.2.0 (새 스킬·명령·계약 키).

## 4. 전문 영역

| 영역 | 판단 |
|---|---|
| 데이터 계약 | 필요 — `chain-stages.json` 키 추가(`diagram`), `vais.config.json` 키 추가(`diagrams`), 새 CLI 하위 명령. 이 Design 승인이 사전 합의다 |
| 보안 | 필요 — `diagram export` 의 파일 경로가 allowedPaths 밖이면 거부, 셸 합성 없음 |
| UI·성능 | 불필요 |

## 5. 담당 · 쓰기 범위

main voice 직접, 위임 없음. 쓰기 범위: `skills/diagram/**`, `contracts/chain-stages.json`, `schemas/chain-stage.schema.json`, `lib/workflow/v2/router.js`, `lib/workflow/v2/write-policy.js`, `lib/workflow/v2/config.js`, `lib/workflow/v2/id-chain.js`, `lib/workflow/v2/diagram.js`, `lib/workflow/v2/index.js`, `hooks/workflow-v2-prompt.js`, `scripts/vais-workflow-v2.js`, `vais.config.json`, `.gitignore`, `tests/**`, `README.md`, `CLAUDE.md`, `ONBOARDING.md`, `docs/harness/design.md`, `CHANGELOG.md`, `package.json`, `package-lock.json`, `.claude-plugin/**`, `docs/diagrams/**`.

## 6. readiness · review

readiness: `test`, `lint`, `plugin-validator`. review: `secret-scan` + 독립 QA(읽기 전용)가 스킬 파일 grep(`python`·`playwright` 0건, 출처 표기), 라우터·guard·export·렌더 테스트, 문서·버전을 대조하고 Do 가 만든 증명 그림(PNG)이 실제로 있는지 본다.

## 7. TC

| TC | 검증 | 기대 |
|---|---|---|
| TC-001 | `skills/diagram/SKILL.md` ≤24KB, frontmatter name `diagram`, 유형 참조 11개 존재, 스킬 폴더 전체 grep `python`·`playwright`·`drawio`·`excalidraw` 0건, 머리에 원본 해시·MIT, `LICENSE` 존재, plugin-validator 통과 | 일치 |
| TC-002 | `routeCommand('diagram 회원가입 흐름')` → action diagram; prompt hook 가 allowedPaths 에 `docs/diagrams/**` 를 넣고 `docs/diagrams/x.html` 쓰기 허용; `/vais` 없는 턴은 거부; `diagrams.dir` 설정 반영 | 테스트 통과 |
| TC-003 | 예제 HTML 에서 `extractSvg` 가 `<svg` 로 시작하고 `@import` 와 `&amp;` 를 가진 SVG 를 만든다; `diagram export` 가 allowedPaths 밖 파일을 거부; stub 렌더러로 PNG 경로를 만든다 | 테스트 통과 |
| TC-004 | 회귀 장면 A: 흐름 파일 `S-001.mmd` 는 그대로 통과, `S-002.html` 은 PNG 가 만들어짐(stub); stage Design 지침에 그림 문장 포함 | 테스트 통과 |
| TC-005 | 버전 7면 4.2.0, CHANGELOG [4.2.0], README·CLAUDE·ONBOARDING·design.md 에 `skills/diagram`·`/vais diagram`·`docs/diagrams`; `npm test`·회귀·lint·validate PASS; Do 증거 폴더에 실제 그림 PNG 1장 | 일치 |

## 8. rollback

`git checkout -- .` 로 추적 파일 복구 후 `skills/diagram`·`lib/workflow/v2/diagram.js`·`docs/diagrams` 삭제(사용자가 실행). `references/` 는 gitignored 라 영향 없음.
