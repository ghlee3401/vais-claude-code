# Ideation Summary: ceo / clevel-doc-coexistence

> 진행일: 2026-04-20
> 진행자 C-Level: CEO
> 소요 대화 turns: 4
> Status: summarized

---

## Key Points

- v0.57.0 은 **sub-agent → C-Level** main.md 덮어쓰기를 `_tmp/` scratchpad + topic 큐레이션으로 해결했으나, **C-Level 간** 공유 main.md 경합은 미해결이다.
- 3가지 덮어쓰기 패턴이 모두 존재:
  1. 같은 phase 에 여러 C-Level 이 순차 참여 (CEO S-1 풀 런칭 CBO→CPO→CTO→CSO→COO)
  2. 같은 C-Level 재실행 (예: CBO plan 2회 — 시장 조사 업데이트)
  3. 다른 phase 재진입 (plan 완료 후 CTO 가 다시 plan 호출)
- 사용자는 **C-Level 별 파일 분리**에는 동의하나 `{c-level}.md` 이름에는 **미동의** → v0.57 철학(소유자보다 topic) 을 C-Level 경계에도 일관되게 적용해야 한다.
- main.md 는 유지하되 **append-merge** 계약으로 규칙화해야 한다 (덮어쓰기 금지).
- `vais.config.json > workflow.topicPresets.{phase}` 스키마를 **`.{c-level}` 서브키로 확장** 하여 C-Level 별 기본 topic 세트 정의.
- 적용 범위는 5 phase 전체 (plan/design/do/qa/report) — ideation 은 선택.

## Decisions

- **피처 이름**: `clevel-doc-coexistence` (S-1 풀 런칭에서 가장 자주 겪는 공존 문제라는 의미).
- **구조 유지**: `docs/{feature}/{NN-phase}/{topic}.md` + `main.md` + `_tmp/` 3-layer (v0.57 기반 상위 호환).
- **파일명 규칙**: **Topic 중심** (`architecture.md`, `prd.md`, `market-analysis.md` 등). `{c-level}.md` 또는 `{c-level}-{topic}.md` 접두 금지.
- **소유권 메타데이터**: topic 문서 frontmatter 에 `owner: {c-level}` 명시 (파일명 대신 frontmatter 로 추적).
- **main.md 머지 책임**: **현재 턴 C-Level** 이 기존 main.md 를 읽고 자기 섹션/인덱스를 append 한다. 이전 C-Level 의사결정·topic 인덱스 보존은 mandatory.
- **프리셋 스키마**: `vais.config.json > workflow.topicPresets.{phase}.{c-level}` 로 확장 (객체/배열 형태는 plan 에서 확정).
- **적용 범위**: 5 mandatory phase 전체.
- **v0.57 관계**: 완전 상위 호환. `_tmp/` scratchpad 정책 그대로 유지, topic 레이어에만 C-Level 경계 추가.
- **다음 C-Level**: CTO (기술 구현 비중 압도 — vais.config.json / lib/status.js / doc-validator.js / agents md 수정).

## Open Questions

- `topicPresets.{phase}.{c-level}` 스키마 형태 — 객체 계층 vs 배열 확장 vs 별도 맵.
- main.md append-merge 계약의 섹션 마커 규칙 (예: `<!-- clevel-section: cbo begin -->` HTML 주석 vs 헤딩 기반).
- `doc-validator.js` 신규 경고 설계 — `W-OWN` (topic owner 미지정) / `W-MRG` (main.md 가 이전 C-Level 섹션 삭제 감지) 등.
- 기존 v0.57 피처 (`v057-subdoc-preservation`) 재마이그레이션 여부 — 그대로 두는 방향이 유력 (v0.57 호환성 원칙).
- CEO 동적 라우팅 시 이전 C-Level 의 topic 를 새 C-Level 프롬프트에 자동 include 할지 (컨텍스트 전파).
- v0.57 `subDocPolicy.enforcement = warn` 과 동일한 `cLevelCoexistencePolicy` 도입 여부.
- 단일 C-Level 단독 호출 시 (CEO 없이) 이전 C-Level 섹션 존재 시 경고/통합 정책.

## Next Step

- C-Level: **CTO**
- Phase: **plan**
- 이유: 구조 변경 비중이 `vais.config.json` 스키마, `lib/status.js` 인벤토리, `scripts/doc-validator.js` 경고, 6 C-Level agent 프롬프트, 템플릿에 집중되어 있어 기술 구현 오케스트레이션이 핵심. v0.57 도 CTO 주도로 처리되었으므로 일관.

---

## Raw Context

> 사용자 원문 (2026-04-20):
> "현재 여러 c-level이 참여를 해서 문서를 작성하게 되면 기존의 pdca의 main.md에 작성을 하려고 해서 덮어쓰려는 현상이 발생하고 있어. 이 문제를 해결해야 돼"
>
> 사용자 노트 (AskUserQuestion "Direction" 응답):
> "c level별로 파일을 분리하는 것에 동의 하지만 {c-level}.md 이름으로 남기는 것에는 미동의"

**핵심 해석**: topic-first 원칙(v0.57 철학)을 유지하면서 C-Level 경계를 frontmatter owner 메타로 표현. 파일명은 owner-agnostic.

<!-- v0.57 subdoc-section begin -->

---

## Topic Documents (v0.57+)

> Ideation 단계에서는 topic 분리 없음 — 본 main.md 에 요약만 기록. plan 단계에서 본격적으로 topic 분리 시작.

| Topic | 파일 | 한 줄 요약 | 참조 scratchpad |
|-------|------|-----------|----------------|
| (해당 없음) | — | — | — |

## Scratchpads (v0.57+)

| Agent | 경로 | 크기 | 갱신 |
|-------|------|:----:|-----|
| (해당 없음 — CEO 단독 대화) | — | — | — |

<!-- v0.57 subdoc-section end -->

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-20 | 초기 작성 — v0.57 후속 피처 ideation 완료, CTO plan 으로 전환 |

<!-- template version: v0.57.0 -->
