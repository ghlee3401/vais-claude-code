---
schema: vais-phase/v1
work_item: WI-2026-09-17-harness-diagram-skill
phase: plan
revision: 1
status: approved
based_on: []
---

# Plan — 다이어그램 스킬 흡수 (harness-diagram-skill)

kind: harness (플러그인 자체) · 규모: standard · 관련 작업: chain-stages(H2, 3단계 흐름 파일)·ui-loop(H4, 스크린샷)·`brief` 스킬(독립 진입 선례)

## 1. 문제

화면 정의서(3단계)의 흐름 파일이 Mermaid 텍스트(`flows/*.mmd`)라 비개발자가 읽기 어렵고 그림 품질이 들쭉날쭉하다. 기능 설명이나 유저 플로우 그림이 필요할 때 따를 기준도 없다. 외부에 `cathrynlavery/diagram-design`(MIT, 40종, 의존성 없는 HTML + 인라인 SVG, 강조색 하나·4px 격자 같은 편집 규칙)이 있어 사용자가 흡수를 요청했다(2026-09-17). 또 `/vais` 밖 대화는 write guard 가 파일 쓰기를 막으므로 "그려줘" 만으로는 그림이 저장되지 않는다. 논의 결과: 원본을 통째로 동기화하지 않고 우리 사정에 맞게 고친 스냅샷을 갖되, 개발 문서에 쓰는 유형만 추리고, Python·Playwright 는 가져오지 않는다.

## 2. 목표

vais 사용자가 `/vais` 안팎 어디서든 같은 규칙으로 그림을 그려 HTML·SVG·PNG 로 얻고, 3단계 흐름도가 그 규칙으로 그려져 PNG 로 확인된다.

## 3. 범위

포함: 스킬 스냅샷(추린 유형·스타일 규칙·템플릿, 출처·버전·MIT 표기), `/vais diagram` 진입과 산출 폴더 허용, SVG 추출 도구, PNG 는 기존 캡처 재사용, 3단계 흐름 파일 HTML 허용 + PNG 렌더, 문서·회귀·버전. 제외: Python 가져오기(Mermaid·draw.io·Excalidraw)·기하 검증·Playwright, 원본 동기화 스크립트, feature kind `## 사용자 흐름` 그림 강제, 와이어프레임·시안 단계 변경.

## 4. 요구사항

| ID | 요구사항 | 완료 조건 |
|---|---|---|
| REQ-001 | 스킬 동봉: 원본 지시문·유형 참조·템플릿을 가져와 우리 사정에 맞게 고친 파일을 `skills/diagram/` 에 둔다. 유형은 개발 문서용 10종 안팎으로 추린다(흐름도·유저 저니·스윔레인·시퀀스·상태 기계·구조도·데이터 흐름·ER·타임라인·트리, 최종 목록은 Design). Python·Playwright·가져오기 문단은 없애고 저장 위치·PNG 방식은 우리 것으로 바꾼다. 파일 머리에 원본·버전·MIT·가져온 날짜, `LICENSE` 사본. | 플러그인 검증 통과, 스킬 파일에 `python`·`playwright` 0건, 출처 표기 존재, 지시문 크기 예산(Design 에서 정함) 이하. |
| REQ-002 | 독립 진입: `/vais diagram <요청>` 이 스킬을 켜고 산출 폴더(기본 `docs/diagrams/`, `vais.config.json` 으로 변경)를 그 턴의 write scope 에 넣는다. `/vais` 없이 "그려줘" 하면 스킬은 켜지되 저장은 안 되므로 `/vais diagram` 을 안내한다. | 회귀: `/vais diagram` 뒤 `docs/diagrams/x.html` 쓰기 허용, `/vais` 없는 턴은 거부 + 안내. |
| REQ-003 | 내보내기: 그리기 결과는 HTML 한 파일. 요청 시 SVG(HTML 에서 `<svg>` 추출 + 글꼴 import 삽입, Node 스크립트)와 PNG(기존 `screens capture` 재사용)를 같은 폴더에 만든다. | 테스트: HTML 에서 SVG 파일 생성, Chrome 있으면 PNG 생성, 없으면 기존 doctor 안내. |
| REQ-004 | 사슬 연결: 3단계 흐름 파일이 `.html` 이면 `do ready` 가 와이어프레임처럼 PNG 를 렌더한다. `.mmd` 도 그대로 허용(기존 프로젝트 호환). 3단계 Design 의 "흐름도 2~3안" 은 이 스킬로 그리고 PNG 로 보인다는 지시가 단계 지침에 들어간다. | 회귀 장면 A 에 html 흐름 파일 케이스, `.mmd` 케이스 유지. |
| REQ-005 | 문서·버전: README 다이어그램 절, CLAUDE 규칙 한 줄·구조도, ONBOARDING, design.md 대응표, CHANGELOG, minor 버전(4.2.0) 7면. | grep 통과, doctor fail 0. |

## 5. 사용자 흐름

지금: 3단계에서 Mermaid 텍스트를 받거나, 그림이 필요하면 매번 말로 설명한다. 바뀐 뒤 (a) `/vais diagram 회원가입 유저 플로우` → `docs/diagrams/signup-flow.html`(+ 요청 시 svg·png)이 생기고 응답에 PNG 가 보인다. (b) 3단계 Design 에서 흐름도 2안이 PNG 로 나오고 `/vais 2번` 으로 고른 뒤 Do 가 `docs/product/flows/S-001.html` 과 PNG 를 만든다. 그 밖의 사용법은 같다.

## 6. 엣지 케이스

- Chrome 이 없으면 PNG 만 생략하고 HTML·SVG 는 만든다. 안내는 기존 규칙 10-5 와 같다.
- 추리고 남긴 유형 밖을 요청하면 지원 목록을 보이고 가장 가까운 유형을 제안한다.
- 산출 폴더 밖 경로를 요청하면 write guard 가 막고, 안내 문구가 폴더를 알려 준다.
- 원본 갱신은 자동으로 따라가지 않는다. 필요할 때 원본과 눈으로 비교해 골라 넣는다(출처 표기의 버전이 기준).
- 지시문이 커지면 Design 중에 켜질 때 부담이 되므로 Design 에서 크기 상한을 정한다.
- 기존 `.mmd` 흐름 파일이 있는 제품은 그대로 통과해야 한다.

## 7. 완료 조건

REQ-001~005 충족, `npm test`·`npm run regression`·lint·validate PASS, 독립 QA PASS, 실제로 그린 그림 한 장이 PNG 로 응답에 보인다.

## 8. 영향

변경 후보: `skills/diagram/**`(신규), `contracts/chain-stages.json`(3단계 렌더), `lib/workflow/v2/{router,write-policy,config,id-chain}.js`, `hooks/workflow-v2-prompt.js`(별칭 라우팅·단계 지침), `scripts/`(SVG 추출), `vais.config.json`(산출 폴더 키), `tests/**`, README·CLAUDE·ONBOARDING·`docs/harness/design.md`·CHANGELOG, 버전 7면. 상태 머신·양식 구조는 바꾸지 않는다. 커밋은 `/vais 저장` 흐름.
