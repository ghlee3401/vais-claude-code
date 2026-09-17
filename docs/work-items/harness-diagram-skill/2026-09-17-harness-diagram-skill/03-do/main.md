---
schema: vais-phase/v1
work_item: WI-2026-09-17-harness-diagram-skill
phase: do
revision: 1
status: draft
based_on: []
---

# Do — harness-diagram-skill

## 구현 변경

- REQ-001 `skills/diagram/`: 한국어 `SKILL.md`(frontmatter name `diagram`, 원본 해시·MIT 표기), `LICENSE`(원본 MIT + 수정 내역), `references/` 13개(style-guide·semantic-patterns + 유형 11), `assets/template.html`·`template-dark.html`. 원본의 §0 브랜드 게이트·§11 가져오기·Python·Playwright·검증 스크립트 문단은 뺐고 저장 위치·PNG 방식은 §10·§11 로 바꿨다. 예제 HTML 은 authorization 30분 안에 복사하지 못해 이번엔 동봉하지 않았다(유형 참조가 `assets/example-*.html` 을 가리키는 줄은 남김 → 잔여 제한).
- REQ-002 `router.js` `diagram` 명령, `config.js` `loadDiagramConfig`(`vais.config.json > diagrams.dir`, 기본 `docs/diagrams`), prompt hook 이 그 턴의 allowedPaths 에 `<dir>/**` 를 더하고 `commandGuidance` case `diagram` 으로 스킬·저장 위치·export 를 지시. `vais.config.json` 에 `diagrams` 블록.
- REQ-003 `lib/workflow/v2/diagram.js` `extractSvg`·`exportDiagram`, CLI `diagram export --session --file [--svg] [--png]`(authorization 의 allowedPaths 검사), `write-policy.js` 공개 명령에 추가, `index.js` 재수출.
- REQ-004 `contracts/chain-stages.json` stage-screens `renderArtifacts: true`·`diagram`, 스키마에 `diagram` 키. prompt hook `stagePhaseLines` 가 Design 에 "안마다 `options/N/flow.html` + `screens capture` PNG", Do 에 "`.html` 권장·`.mmd` 허용" 을 넣는다. 회귀 fixture `S-002.html` 추가, 장면 A 가 `S-002.png` 생성과 `S-001.mmd` 통과를 확인.
- REQ-005 README "다이어그램" 절, CLAUDE 규칙 17·구조도·상태 줄, ONBOARDING 표·상태 줄, design.md 대응표 행, CHANGELOG [4.2.0], 버전 7면 + package-lock 4.2.0. `.gitignore` 에 `references/`.

## 검증 증거

- `tests/v2-diagram.test.js` TC-001~004(스냅샷·라우팅·authorization·설정·SVG 추출·export 범위·렌더·지침), `npm run regression` 10/10, `npm run lint` 0.
- 증명 그림: `03-do/evidence/diagram/vais-loop.html`(VAIS 사용자 루프 흐름도, 스킬 규칙대로 직접 그림) → `screens capture`(Chrome) 로 `desktop.png`·`mobile.png`. `diagram export` 자체는 실행 중 캐시(4.1.0)에 없어 이번 턴엔 테스트로만 확인.
- readiness 검사(test·lint·plugin-validator)는 `do ready` 가 실행한다. 위임 없음.
