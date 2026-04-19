# v057-subdoc-preservation - 기획서

> ⛔ **Plan 단계 범위**: 이 문서는 분석과 결정만 기록합니다. 프로덕트 파일 생성·수정은 Do 단계에서 수행하세요.
> Feature: `v057-subdoc-preservation` | Version target: v0.56.2 → v0.57.0
> 선행 ideation: `docs/v057-subdoc-preservation/00-ideation/main.md` (없음, 본 Plan 이 ideation 결정을 흡수)

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 35+ sub-agent 중 ~5개만 자기 문서를 남기고, 나머지는 C-Level main.md 에 축약 병합됨. 원본 분석 유실 + 병렬 쓰기 race + gap 분석 구조화 한계 발생 |
| **Solution** | sub-agent 는 `docs/{feature}/{NN-phase}/_tmp/{agent-slug}.md` scratchpad 를 작성. C-Level 은 scratchpad 를 읽고 **필요성/누락/충돌을 판단**하여 **topic 별 문서 여러 개**로 재구성. `_tmp/` 는 영구 보존 + git 커밋 |
| **Function/UX Effect** | 사용자는 `docs/{feature}/{phase}/{topic}.md` 형태로 주제 중심 독서. main.md 는 의사결정 요약 + topic 인덱스. 필요 시 `_tmp/` 에서 sub-agent 원본 열람 가능 |
| **Core Value** | (1) 의사결정 근거 투명성 (추적성), (2) C-Level 큐레이션 가치 증가, (3) 병렬 쓰기 race 제거, (4) 문서 구조 사용자 친화도 ↑ |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | v0.56 까지는 sub-agent 원본이 main.md 에 축약되어 유실. "결정의 근거"를 되짚을 수 없음. 병렬 sub-agent 가 동일 main.md 쓰기 경합 |
| **WHO** | VAIS Code 사용자(개발자/PO), 그리고 VAIS 자체의 C-Level / sub-agent 프롬프트 유지보수자 |
| **RISK** | (1) C-Level 이 "그냥 복사"만 하면 큐레이션 가치 없음, (2) `_tmp/` 영구 보존으로 리포 크기 증가, (3) 35 sub-agent 마크다운 일괄 수정 PR diff 과대 |
| **SUCCESS** | (a) 샘플 피처 1건에서 scratchpad → topic 재구성 시연, (b) `npm test` 169 pass, (c) CLAUDE.md Rule #14 신설, (d) 4 파일 버전 0.57.0 |
| **SCOPE** | 플러그인 내부 convention + templates + validator + 35 sub-agent 프롬프트 업데이트. 실제 피처 문서 마이그레이션은 신규 피처부터 적용 (기존은 그대로) |

---

## 0. 아이디어 개요

### 아이디어 한 줄 설명
> Sub-agent 원본 분석을 `_tmp/` scratchpad 로 보존하고, C-Level 이 topic 별로 재구성한 문서가 최종 산출물이 되는 2-layer 문서 모델.

### 배경
- **현재 문제**: sub-agent 의 전문 분석이 main.md 축약에서 유실 (qa-engineer 의 60 이슈 → 5줄 요약)
- **기존 해결책(v0.56)의 한계**: 5개 sub-agent 만 ad-hoc 으로 자기 파일 작성, 나머지 30+ 는 손실
- **이 아이디어가 필요한 이유**: 사용자가 "왜 이 결정?" 을 되짚을 때 sub-agent 원본 필요. 또한 topic 중심 독서가 agent 중심보다 실용적

### 타겟 사용자
- **주요 사용자**: VAIS Code 로 피처를 기획·구현하는 개발자/PO
- **보조 사용자**: VAIS 프롬프트(agents/_shared, templates) 유지보수자
- **Pain Point**: "이 아키텍처 선택의 근거가 뭐였지?" → main.md 에 없고 복구 불가

### 사용자 시나리오
1. 상황: design phase 에서 infra-architect + ui-designer + db-architect 병렬 실행
2. 행동: sub-agent 각자 `_tmp/{slug}.md` 작성 → CTO 가 읽고 판단 → `architecture.md` / `data-model.md` / `ui-flow.md` 3개 topic 문서 생성 + main.md 에 의사결정·인덱스 기록
3. 결과: 사용자는 topic 중심 독서. "왜 이 DB 선택?" 질문 시 main.md Decision Record → `_tmp/db-architect.md` 원본 추적 가능

---

## 0.5 MVP 범위

### 핵심 기능 브레인스토밍

| 기능 | 중요도 | 난이도 | MVP |
|------|:------:|:------:|:---:|
| `_tmp/` 경로 convention 확정 | 5 | 1 | Y |
| C-Level main.md 인덱스+의사결정 포맷 | 5 | 3 | Y |
| sub-agent scratchpad 작성 규칙 (_shared/subdoc-guard.md include) | 5 | 3 | Y |
| topic별 문서 프리셋 (phase별 기본 세트) | 4 | 2 | Y |
| Sub-doc 공통 템플릿 (subdoc.template.md) | 4 | 2 | Y |
| "큐레이션 기록" 섹션 강제 | 5 | 2 | Y |
| doc-validator scratchpad 인식 + topic 존재 검사 | 4 | 3 | Y |
| status.json subDocs[] 인벤토리 | 3 | 2 | Y |
| auto-judge main.md → _tmp/{slug}.md fallback 파싱 | 3 | 3 | Y |
| Rule #14 신설 + CLAUDE/AGENTS/README 동기화 | 5 | 1 | Y |
| 특화 템플릿 5종 (engineer/analyst/auditor/designer/researcher) | 3 | 3 | N (v0.57.1) |
| Diff-merge 재실행 UI 자동화 | 2 | 5 | N (v0.58+) |
| enforcement=fail 강제화 | 2 | 3 | N (v0.58+) |
| dashboard 뷰어에 `_tmp` 트리 렌더 | 2 | 4 | N |

### MVP 포함 기능
- `_tmp/` convention 확정
- C-Level main.md 인덱스+의사결정+"큐레이션 기록" 포맷
- `agents/_shared/subdoc-guard.md` include 메커니즘
- topic 프리셋 (vais.config.json > workflow.topicPresets)
- 공통 subdoc.template.md 1종 (특화 템플릿은 v0.57.1 로 이연)
- doc-validator + status.js + auto-judge 업데이트
- Rule #14 + 문서 동기화 + 버전 bump

### 이후 버전으로 미룰 기능
- 특화 템플릿 5종 (engineer/analyst/auditor/designer/researcher) → v0.57.1
- Diff-merge 자동화(재실행 시 증분 통합) → v0.58
- enforcement=retry/fail 정책 전환 → v0.58+
- dashboard.html 에 `_tmp` 트리 → 추후 선택

---

## 0.6 경쟁/참고 분석

| 접근 | 유사 기능 | 장점 | 단점 | 차별화 |
|------|---------|------|------|-------|
| Notion 데이터베이스(페이지→하위 페이지) | 계층적 문서 | 링크·참조 강력 | 파일시스템 기반 아님, git 친화도↓ | 파일 기반 |
| Obsidian Daily Note + Backlink | 원본 보존 + 인덱스 | 양방향 링크, 검색 | AI agent 가 직접 편집 까다로움 | AI agent 쓰기 최적 |
| Monorepo RFC 폴더(`docs/rfcs/NNNN-*.md`) | 의사결정 기록 | 심플, git 추적 | sub-agent 병렬 쓰기 미고려 | _tmp 분리로 race 해결 |
| ADR (Architecture Decision Records) | 근거 분리 | 표준 포맷 | agent-specific 영역 없음 | agent 슬러그 기반 scratchpad |

**참고하되 차별화**: file-based + git native + AI agent 병렬 쓰기 친화. 위 중 어느 것도 "AI sub-agent 35개 동시 쓰기" 시나리오를 다루지 않음.

---

## 0.7 PRD 입력 (CTO 전용)

| Key | Value |
|-----|-------|
| PRD 경로 | `docs/v057-subdoc-preservation/03-do/main.md` |
| 완성도 | **missing** (강행 모드) |
| 검사 시각 | 2026-04-19 |

### 강행 모드 사유
- 사용자 선택: CP-0 = B (강행 모드)
- 이유: 본 피처는 플러그인 내부 문서/프롬프트 레이어 변경 → CPO PRD(시장/페르소나/JTBD) 오버킬. 상기 CPO Plan 이 이미 상세한 기술 분해 + Impact Analysis + SC-01~11 을 포함하여 CTO 입력으로 충분

### 가정한 요구사항 (CPO Plan 흡수)
1. Scratchpad 경로 `_tmp/{slug}.md` + topic 문서 + main.md 인덱스 3-레이어 구조 (ideation 합의)
2. `_shared/subdoc-guard.md` include 메커니즘 (advisor-guard 선례 유효)
3. `vais.config.json` 스키마 확장 3종 (docPaths.scratchpad / topicPresets / subDocPolicy)
4. 35 sub-agent frontmatter 일괄 수정 (include 1줄 추가)
5. 6 C-Level agent markdown 수정 ("큐레이션 기록" 지침 반영)
6. 공통 템플릿 1종만 (특화 5종 v0.57.1 이연)
7. doc-validator + status.js + auto-judge 확장 (warn only, 기존 호환)
8. 기존 v0.56 피처 문서 무영향 (main.md 단독 허용 유지)

> ⚠️ 강행 모드 plan은 PRD 부재로 인한 가정이 포함됩니다. design 단계에서 "큐레이션 기록" 포맷 상세 + `_shared/subdoc-guard.md` 정확한 블록 내용 확정 필요.

---

## 1. 개요

### 1.1 기능 설명
v0.57.0 은 VAIS Code 의 문서 구조를 2-layer 로 재정의한다: (layer 1) sub-agent 가 작성하는 `_tmp/{slug}.md` scratchpad, (layer 2) C-Level 이 큐레이션한 topic 문서 + main.md 인덱스.

### 1.2 목적
- **해결하려는 문제**: sub-agent 원본 유실, main.md 축약, 병렬 쓰기 race, 추적성 부재
- **기대 효과**: 의사결정 근거 투명성, C-Level 가치 증가, 문서 구조 사용자 친화도↑
- **대상 사용자**: VAIS Code 사용자 + 플러그인 유지보수자

---

## 2. Plan-Plus 검증

### 2.1 의도 발견
**근본 문제**: "왜 이 결정으로 갔지?" 라는 질문에 답할 수 없음. 단순히 sub-doc 을 더 남기는 게 아니라 C-Level 의 **큐레이션 프로세스 자체**를 가시화하는 것이 본질.

### 2.2 대안 탐색

| # | 대안 | 장점 | 단점 | 채택 |
|---|------|------|------|:----:|
| 1 | 기존 v057 README 원안(sub-doc 영구 + main.md 인덱스) | 원본 보존 확실 | C-Level = 단순 라우터, topic 중심 독서 불가, 35 파일 영구 | ❌ |
| 2 | 완전 통합 (단일 main.md, sub-doc 없음) | 단순 | 현상 유지 = 문제 미해결 | ❌ |
| 3 | **scratchpad + C-Level 큐레이션 + topic 문서 + `_tmp/` 보존** | 사용자 topic 독서 + 추적성 + 큐레이션 가치 | 구현 복잡, 리포 크기↑ | ✅ |
| 4 | 대안 3 + `_tmp/` 주기 삭제 | 리포 깔끔 | 추적성 상실, git log 의존 | ❌ (사용자가 거부) |
| 5 | 대안 3 + 별도 `_archive/` 이동 | 절충 | 복잡도만 증가, 실익 불분명 | ❌ |

**채택: 대안 3** (사용자 합의, 2026-04-19)

### 2.3 YAGNI 리뷰
- [x] 특화 템플릿 5종은 MVP 제외 (v0.57.1 로 이연)
- [x] enforcement=fail 강제화 제외 (v0.58+)
- [x] Diff-merge 자동화 제외 (v0.58+)
- [x] dashboard 통합 제외
- **제거 후보**: 공통 `subdoc.template.md` 외 5 특화 템플릿 → v0.57.1 로 이연

---

## 3. 사용자 스토리

| # | As a... | I want to... | So that... |
|---|---------|-------------|------------|
| 1 | 개발자 | phase 별 topic 중심(`architecture.md`, `data-model.md`)으로 문서를 읽고 싶다 | agent 중심 독서보다 설계 전체 구조가 먼저 보인다 |
| 2 | 개발자 | "이 결정의 근거" 를 클릭 몇 번으로 sub-agent 원본까지 타고 들어갈 수 있어야 한다 | 6개월 뒤에도 의사결정 맥락 복구 가능 |
| 3 | VAIS 유지보수자 | 신규 sub-agent 추가 시 markdown 1곳(`_shared/subdoc-guard.md`) 만 참조하면 scratchpad 규칙이 자동 적용되길 바란다 | 35 sub-agent 에 동일 블록 복붙 유지보수 부담 제거 |
| 4 | C-Level agent (자동) | 모든 scratchpad 를 읽고 필요성·누락·충돌을 판단한 결과를 "큐레이션 기록" 에 남겨 사용자에게 증명하고 싶다 | C-Level 이 단순 라우터가 아닌 편집자임을 보장 |
| 5 | CSO(auditor 계열) | Critical/Important/matchRate 메트릭이 main.md 든 `_tmp/qa-engineer.md` 든 양쪽에서 gate-manager 가 파싱 가능해야 한다 | 문서 구조 변경이 기존 gate 로직과 호환 |

---

## 4. 기능 요구사항

### 4.1 기능 목록

| # | 기능 | 설명 | 관련 파일 | 우선순위 | 상태 |
|---|------|------|----------|:-------:|:----:|
| F1 | `_tmp/` 경로 convention | `docs/{feature}/{NN-phase}/_tmp/{agent-slug}.md` 표준화, qualifier 규칙 | `vais.config.json` | Must | 미구현 |
| F2 | topic 프리셋 정의 | phase 별 기본 topic 세트 + 확장 허용 | `vais.config.json > workflow.topicPresets` | Must | 미구현 |
| F3 | C-Level main.md 인덱스 포맷 | Executive + Decision Record + Topic 인덱스 + "큐레이션 기록" | `agents/{ceo,cpo,cto,cso,cbo,coo}/*.md` (6개) | Must | 미구현 |
| F4 | sub-agent scratchpad 규칙 | `_shared/subdoc-guard.md` include 로 DRY 적용 | `agents/_shared/subdoc-guard.md` (신규) + 35 sub-agent frontmatter | Must | 미구현 |
| F5 | 공통 템플릿 | `templates/subdoc.template.md` (1 파일, 특화 5종 v0.57.1 이연) | `templates/` | Must | 미구현 |
| F6 | "큐레이션 기록" 섹션 강제 | topic 문서에 채택/거절/병합/추가 기록 필수 | C-Level prompts + doc-validator | Must | 미구현 |
| F7 | doc-validator 확장 | `_tmp/` 존재 확인, topic 문서 존재 확인, 양쪽 파싱 호환 | `scripts/doc-validator.js` | Must | 미구현 |
| F8 | status.json subDocs[] | scratchpad + topic 문서 인벤토리 트래킹 | `lib/status.js` | Should | 미구현 |
| F9 | auto-judge fallback | main.md → `_tmp/qa-engineer.md` 순으로 메트릭 파싱 | `scripts/auto-judge.js` | Should | 미구현 |
| F10 | Rule #14 + 문서 동기화 | CLAUDE / AGENTS / README / CHANGELOG | 4 파일 | Must | 미구현 |
| F11 | 버전 bump 0.56.2 → 0.57.0 | 4 파일 동기화 | package.json / vais.config.json / .claude-plugin/{plugin,marketplace}.json | Must | 미구현 |
| F12 | 테스트 7건 | 신규 테스트 + 3 fixture | `tests/` | Must | 미구현 |

### 4.2 기능 상세

#### F1. `_tmp/` 경로 convention
- **트리거**: sub-agent 실행 완료 시 scratchpad Write
- **정상 흐름**: 1) agent 가 `{phase-folder}/_tmp/{agent-slug}.md` 에 Write → 2) C-Level 이 모든 `_tmp/*.md` Read → 3) C-Level 이 topic 문서 작성 → 4) `_tmp/` 그대로 보존 (git 커밋)
- **예외**: 동일 agent 복수 산출물 → `{slug}.{qualifier}.md` (예: `ui-designer.review.md`)
- **산출물**: `_tmp/` 트리 + topic 문서 + main.md

#### F3. C-Level main.md 인덱스 포맷
- **트리거**: C-Level phase 완료 시
- **정상 흐름**: Executive Summary → Context Anchor → Decision Record (근거 sub-doc 링크 포함) → Topic 문서 인덱스 → 큐레이션 기록 → Gate Metrics → Next
- **금지**: sub-agent 원본 전체 복사, 파일별 diff 나열 (→ topic 문서 or `_tmp/`)

#### F4. sub-agent scratchpad 규칙 + F6. 큐레이션 기록 섹션
- sub-agent: `_tmp/{slug}.md` Write 필수 + 빈 파일 금지(>500B) + 메타 헤더 3줄(Author/Phase/Refs)
- C-Level: topic 문서 내 "## 큐레이션 기록" 섹션 필수. 표 포맷: `| Source (_tmp/...) | 채택 | 거절 | 병합 | 추가 | 이유 |`

---

## 5. 정책 정의

### 5.1 비즈니스 규칙

| # | 정책 | 규칙 | 비고 |
|---|------|------|------|
| 1 | scratchpad 보존 | `_tmp/` 는 삭제 금지, git 커밋 대상 | 사용자 요청 2026-04-19 |
| 2 | 병렬 main.md 쓰기 금지 | sub-agent 는 `_tmp/{slug}.md` 만 Write. main.md 는 C-Level 전담 | race 방지 |
| 3 | 큐레이션 기록 필수 | topic 문서에 채택/거절/병합/추가 기록 없으면 doc-validator 경고 | 큐레이션 품질 보장 |
| 4 | 최소 크기 | scratchpad `<500B` 이면 경고 (빈 템플릿 스팸 방지) | doc-validator |
| 5 | enforcement 정책 | v0.57 은 `warn only`. fail 전환은 v0.58+ | 도입 단계 |
| 6 | 시스템 산출물 예외 | `interface-contract.md` 등은 agent 슬러그 아닌 의미명 유지 | 예외 리스트 |

### 5.2 권한 정책 (문서 쓰기)

| 주체 | `_tmp/{slug}.md` | `{topic}.md` | `main.md` |
|------|:---:|:---:|:---:|
| sub-agent (자기) | ✅ Write | ❌ | ❌ |
| sub-agent (타) | ❌ | ❌ | ❌ |
| C-Level | Read only | ✅ Write | ✅ Write |
| 사용자 | ✅ (수동) | ✅ (수동) | ✅ (수동) |

### 5.3 유효성 검증 규칙 (doc-validator)

| 필드 | 규칙 | 에러 |
|------|------|------|
| `_tmp/{slug}.md` Author 헤더 | `> Author:` 필수 | warn: 메타 헤더 누락 |
| scratchpad 크기 | ≥ 500B | warn: 템플릿 스캐폴드 의심 |
| topic 문서 큐레이션 기록 | `## 큐레이션 기록` 섹션 필수 | warn: 큐레이션 증거 부재 |
| main.md 에 topic 문서 링크 | 링크 존재 | warn: 인덱스 누락 |

---

## 6. 비기능 요구사항

| 항목 | 요구사항 | 기준 |
|------|---------|------|
| 성능 | doc-validator 실행 | 피처 1건 ≤ 2s |
| 호환성 | 기존 v0.56 피처 문서 | 변경 없이 동작 (기존 피처는 main.md 단독 허용) |
| 확장성 | 신규 sub-agent 추가 | `_shared/subdoc-guard.md` include 1줄로 규칙 적용 |
| 관측성 | `subdoc.write/validate/missing-link` 이벤트 | observability 로깅 |
| 리포 크기 | `_tmp/` 커밋 포함 | 피처당 증가 ≤ 1MB 기대 (텍스트만) |

---

## Success Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | `vais.config.json > workflow.topicPresets` + `docPaths.scratchpad` 스키마 존재 | diff |
| SC-02 | `agents/_shared/subdoc-guard.md` 신규 + 35 sub-agent frontmatter 에 include 추가 | grep `_shared/subdoc-guard.md` |
| SC-03 | 6 C-Level agent markdown 이 main.md = 인덱스+의사결정+큐레이션 기록 포맷 명시 | grep `큐레이션 기록` in agents/*/(ceo\|cpo\|cto\|cso\|cbo\|coo).md |
| SC-04 | `templates/subdoc.template.md` 존재 (공통 1종만, 특화 5종은 v0.57.1) | ls templates/ |
| SC-05 | `scripts/doc-validator.js` 가 `_tmp/` + topic + 큐레이션 섹션 검증 | `tests/doc-validator-subdoc.test.js` |
| SC-06 | `lib/status.js` subDocs[] + `registerSubDoc/listSubDocs` 함수 | `tests/status-subdoc.test.js` |
| SC-07 | `scripts/auto-judge.js` main.md → `_tmp/qa-engineer.md` fallback | `tests/auto-judge-fallback.test.js` |
| SC-08 | CLAUDE.md Rule #13 확장 + Rule #14 신설 + AGENTS.md 동기화 | diff |
| SC-09 | 4 파일 버전 0.56.2 → 0.57.0 + CHANGELOG 단락 | diff |
| SC-10 | 샘플 피처 1건 end-to-end 시연 (scratchpad → topic 3개 → main.md 인덱스) | smoke test |
| SC-11 | `npm test` 169 pass / `npm run lint` 0 warning / `scripts/vais-validate-plugin.js` 통과 | 명령어 |

> QA 단계에서 각 기준을 ✅ Met / ⚠️ Partial / ❌ Not Met 으로 평가합니다.

---

## Impact Analysis

### Changed Resources

| Resource | Type | Change |
|----------|------|--------|
| `vais.config.json` | modify | `workflow.docPaths` 확장(scratchpad 경로) + `workflow.topicPresets` 신규 + `workflow.subDocPolicy` 신규 |
| `agents/_shared/subdoc-guard.md` | create | 공통 scratchpad 규칙 (includes 메커니즘) |
| `agents/{ceo,cpo,cto,cso,cbo,coo}/*.md` (6) | modify | PDCA 표 + Contract Output + "큐레이션 기록" 지침 |
| `agents/{cpo,cto,cso,cbo,coo}/*-engineer.md 등 35` | modify | frontmatter `includes: [_shared/subdoc-guard.md]` 추가 |
| `templates/subdoc.template.md` | create | 공통 sub-doc 템플릿 |
| `templates/{plan,design,do,qa,report,ideation}.template.md` (6) | modify | main.md 인덱스 포맷 + "큐레이션 기록" 섹션 반영 |
| `scripts/doc-validator.js` | modify | `_tmp/` + topic + 큐레이션 섹션 검증 |
| `lib/status.js` | modify | `subDocs[]` 인벤토리 + `registerSubDoc/listSubDocs` |
| `scripts/auto-judge.js` | modify | main.md → `_tmp/{slug}.md` fallback 파싱 |
| `skills/vais/phases/{ceo,cpo,cto,cso,cbo,coo,ideation}.md` (7) | modify | 완료 아웃로에 topic 인덱스 언급 |
| `tests/{subdoc-convention,clevel-index,subdoc-guard-include,subdoc-templates,doc-validator-subdoc,status-subdoc,auto-judge-fallback}.test.js` (7) | create | 신규 테스트 |
| `tests/fixtures/{subdoc-index,subdoc-engineer,subdoc-auditor}.sample.md` (3) | create | fixture |
| `CLAUDE.md` | modify | Rule #13 확장 + Rule #14 신설 |
| `AGENTS.md` | modify | CLAUDE.md 동기화 |
| `README.md` | modify | "What's New in v0.57" + Structure 도식 |
| `CHANGELOG.md` | modify | v0.57.0 단락 신설 |
| `package.json` + `vais.config.json` + `.claude-plugin/{plugin,marketplace}.json` (4) | modify | 버전 0.56.2 → 0.57.0 |
| `guide/v057/README.md` + `00~05.plan.md` (6) | modify | 기존 "영구 보존 + 인덱스" 모델 → "scratchpad + 큐레이션 + topic" 모델로 재작성 |

**총 약 70+ 파일** (35 sub-agent frontmatter 일괄 수정이 대부분)

### Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| 기존 피처 main.md (v0.56 이전) | Read | `docs/*/[01-05]-*/main.md` | **무영향** — scratchpad 부재는 warn 대상 아님 |
| `hooks/hooks.json` PostToolUse | Write 감지 | scratchpad 경로도 감지되도록 확장 (선택) | 기존 동작 유지 |
| `.hooks/pre-commit` | top-level `docs/NN-` 차단 | feature-hierarchy 유지, `_tmp/` 는 영향 없음 | 무영향 |
| `tests/paths.test.js` | 회귀 가드 | 기존 검증 문자열 유지. scratchpad 경로 추가 검증은 별도 테스트 | 변경 금지 (회귀 가드) |

### Verification
- [x] 기존 피처 문서 역호환 확인 (warn only, main.md 단독 허용)
- [x] Rule #13 pre-commit 훅이 `_tmp/` 경로 차단하지 않음 확인 (feature-grouped 하위)
- [ ] `_shared/subdoc-guard.md` include 메커니즘이 런타임에서 실제 동작하는지 smoke test 필요 (`advisor-guard.md` 선례 존재)

---

## CTO 기술 분해 (강행 모드)

### Do 분할 실행 전략 (Walking Skeleton)

CP-1=D(커스텀 체이닝) + Do 분할 Option 1 = **Walking Skeleton** 확정 (2026-04-19).

| Batch | 세션 | 작업 | 파일 수 | 목적 |
|:-----:|:----:|------|:-------:|------|
| **A. Skeleton** | 1 | T1 + T2 + T5 + 샘플 1 C-Level (CTO) + 샘플 1 sub-agent (backend-engineer) + include smoke test | ~5 | R1 검증 우선 |
| **B. Scale** | 2 | T3 (6 C-Level 전체) + T4 (35 sub-agent 전체) + T6 (phase 템플릿 6종) | ~48 | 대량 일괄 edit |
| **C. Scripts** | 3 | T7 (doc-validator) + T8 (status.js) + T9 (auto-judge) + T10 (테스트 7건 + fixture 3건) | ~10 | 런타임 로직 |
| **D. Release** | 4 | T11 (CLAUDE/AGENTS) + T12 (README) + T13 (버전/CHANGELOG) + T14 (guide 재작성) + T15 (smoke test) | ~12 | 문서/릴리즈 |

**Batch A 성공 조건** (Batch B 진입 gate):
- `_shared/subdoc-guard.md` 가 `backend-engineer` sub-agent 호출 시 실제 로드됨 (로그/동작 확인)
- 실패 시 → Option A(직접 복붙) fallback 로 전환하여 Batch B 재계획

### 구현 순서 (guide/v057 sub-plan 00~05 재작성 포함)

| # | 작업 | 의존 | 타깃 Agent |
|---|------|------|------------|
| T1 | `vais.config.json` 스키마 확장 (docPaths.scratchpad / topicPresets / subDocPolicy) | — | infra-architect |
| T2 | `agents/_shared/subdoc-guard.md` 신규 작성 + includes 메커니즘 검증 | T1 | backend-engineer |
| T3 | 6 C-Level agent markdown 수정 (PDCA + Contract + "큐레이션 기록" 지침) | T2 | backend-engineer |
| T4 | 35 sub-agent frontmatter `includes: [_shared/subdoc-guard.md]` 추가 | T2 | backend-engineer (일괄 edit) |
| T5 | `templates/subdoc.template.md` 공통 템플릿 작성 | T1 | backend-engineer |
| T6 | 기존 6 phase 템플릿에 "Sub-documents" 섹션 반영 | T1 | backend-engineer |
| T7 | `scripts/doc-validator.js` `_tmp/` + topic + 큐레이션 섹션 검증 확장 | T1 | backend-engineer |
| T8 | `lib/status.js` `subDocs[]` + `registerSubDoc/listSubDocs` | T1 | backend-engineer |
| T9 | `scripts/auto-judge.js` main.md → `_tmp/qa-engineer.md` fallback | T8 | backend-engineer |
| T10 | 테스트 7건 + fixture 3건 | T7, T8, T9 | test-engineer |
| T11 | CLAUDE.md Rule #13 확장 + Rule #14 신설 + AGENTS 동기화 | T2~T9 | backend-engineer |
| T12 | README.md "What's New in v0.57" + Structure 도식 | T11 | backend-engineer |
| T13 | CHANGELOG v0.57.0 단락 + 4 파일 버전 bump | T1~T12 | backend-engineer |
| T14 | guide/v057/README + 00~05.plan.md 재작성 (scratchpad 모델 반영) | T11 | backend-engineer |
| T15 | 샘플 피처 smoke test (scratchpad → topic 3개 → main.md) | T1~T14 | qa-engineer |

### 피처 레지스트리 (Gate 1 필수)

```jsonc
// .vais/features/v057-subdoc-preservation.json
{
  "name": "v057-subdoc-preservation",
  "createdAt": "2026-04-19",
  "phase": "plan",
  "type": "meta-infrastructure",
  "owner": "cto",
  "dependencies": [],
  "tags": ["plugin-internal", "document-convention", "v0.57.0"]
}
```

> Do phase 진입 시 CTO 가 `.vais/features/v057-subdoc-preservation.json` Write (Gate 1 체크)

### 체이닝 경로 (CP-1 선택에 따라 결정)

| CP-1 선택 | 체이닝 | 적합성 |
|-----------|--------|:-----:|
| A. 최소 | plan → backend-engineer | ✅ **최적합** — UI 없음, backend-engineer 가 config/agents/templates/scripts 전체 담당 |
| B. 표준 | plan → ui-designer → infra → frontend+backend | ❌ ui-designer/frontend 불필요 (UI 없음) |
| C. 확장 | + qa-engineer | ⚠️ qa 는 마지막에 1회 |

> **권장 변형**: CP-1 = A + qa-engineer 1회 (커스텀) — 메타 피처 특화 체이닝

### Gate 1 체크리스트 (Plan 완료)

- [ ] 피처 레지스트리 생성 (`.vais/features/v057-subdoc-preservation.json`) — Do phase 에서 생성
- [x] 데이터 모델 정의 (위 "데이터 모델 개요" 섹션에 status.json / vais.config 스키마 상세)
- [x] 기술 스택 선정 (기존 유지 — Node CJS / JSON / Markdown)
- [x] YAGNI 검증 (2.3 섹션에서 4건 이연)

### 리스크 & 완화

| # | 리스크 | 완화 |
|---|--------|------|
| R1 | `_shared/subdoc-guard.md` include 런타임 미동작 | design phase 에서 smoke test 1건 필수. 실패 시 35 sub-agent 에 블록 직접 삽입 fallback |
| R2 | 35 파일 일괄 edit 중 일부 frontmatter 포맷 오류 | `scripts/vais-validate-plugin.js` 사전 실행 + git diff 리뷰 |
| R3 | `_tmp/` git 커밋으로 리포 크기 증가 | 커밋 포함은 사용자 결정 사항. 샘플 피처 1건으로 실측 후 v0.58+ 재검토 |
| R4 | 기존 v0.56 피처 main.md 단독 문서 역호환 파괴 | doc-validator enforcement=warn only, `_tmp/` 부재는 경고 대상 아님 |
| R5 | CPO Plan 과 CTO Plan 이 동일 파일 공유 | 본 문서처럼 섹션 분리 + 변경 이력 추적. 향후 복잡도 증가 시 01-plan/ 하위 분리 고려 |

---

## 7. 기술 스택

> (기존 스택 유지 — 본 피처는 플러그인 내부 문서/규칙 변경)

| 영역 | 기술 | 이유 |
|------|------|------|
| 런타임 | Node.js (CJS) | 기존 유지 |
| 설정 | JSON (vais.config / plugin.json / marketplace.json) | 기존 유지 |
| 프롬프트 | Markdown + YAML frontmatter | 기존 유지 |
| 테스트 | node:test + assert | 기존 유지 |
| 문서 참조 | `includes: [_shared/*]` (선례: `advisor-guard.md`) | DRY + 유지보수 |

---

## 8. 화면 목록

> (N/A — 본 피처는 문서/프롬프트 레이어, UI 없음)

---

## 데이터 모델 개요

### `.vais/status.json` 스키마 확장

```jsonc
{
  "features": {
    "{feature}": {
      "docs": {
        "main": { /* 기존 유지 */ },
        "subDocs": [                         // 신규
          {
            "phase": "02-design",
            "agent": "ui-designer",
            "kind": "scratchpad",            // scratchpad | topic
            "qualifier": null,               // "review" 등
            "path": "docs/{feature}/02-design/_tmp/ui-designer.md",
            "size": 4523,
            "updatedAt": "2026-04-19T10:20:00Z"
          },
          {
            "phase": "02-design",
            "agent": null,                   // topic 은 agent 없음
            "kind": "topic",
            "topic": "architecture",
            "path": "docs/{feature}/02-design/architecture.md",
            "size": 8211,
            "updatedAt": "2026-04-19T10:45:00Z"
          }
        ]
      }
    }
  }
}
```

### `vais.config.json > workflow` 스키마 확장

```jsonc
{
  "workflow": {
    "docPaths": {
      "main":       "docs/{feature}/{phase}/main.md",
      "topic":      "docs/{feature}/{phase}/{topic}.md",          // 신규
      "scratchpad": "docs/{feature}/{phase}/_tmp/{slug}.md",      // 신규
      "scratchpadQualified": "docs/{feature}/{phase}/_tmp/{slug}.{qualifier}.md",
      "systemArtifacts": [
        "docs/{feature}/02-design/interface-contract.md"
      ]
    },
    "topicPresets": {                                              // 신규
      "00-ideation": ["problem", "hypotheses", "exit-criteria"],
      "01-plan":     ["requirements", "impact-analysis", "policy"],
      "02-design":   ["architecture", "data-model", "api-contract", "ui-flow", "security"],
      "03-do":       ["implementation", "changes", "tests"],
      "04-qa":       ["findings", "metrics", "issues"],
      "05-report":   []
    },
    "subDocPolicy": {                                              // 신규
      "enforcement":  "warn",
      "scratchpadPreserve": true,
      "scratchpadMinBytes": 500,
      "requireCurationRecord": true,
      "reportPhase": "single"
    }
  }
}
```

---

## API 엔드포인트 개요

> (N/A — 플러그인 내부)

---

## 9. 일정 (예상)

| 단계 | 산출물 | 비고 |
|------|--------|------|
| Plan (현재) | `docs/v057-subdoc-preservation/01-plan/main.md` | 본 문서 |
| Design | 아키텍처 topic 분해, C-Level 프롬프트 변경 포인트 상세, `_shared/subdoc-guard.md` 스펙 확정 | design phase |
| Do (CTO) | agent markdown + template + vais.config + scripts + tests 구현 | 70+ 파일 |
| QA | SC-01~11 검증, 샘플 피처 smoke test, gate 메트릭 호환 확인 | 169 pass 목표 |
| Report | CHANGELOG, README, 버전 0.57.0 승격 | v0.57.0 릴리즈 |
| 후속 | guide/v057 재작성(기존 00~05.plan.md → 신 모델 반영) | Plan 이후 병행 |

> 다음 단계: 사용자 승인 → `/vais cpo design v057-subdoc-preservation` 또는 바로 `/vais cto plan v057-subdoc-preservation` (CPO Do=PRD 생략 가능)

---

## Checkpoint 기록

| CP | C-Level | 결정 | 결과 | 일시 |
|----|:-------:|------|------|------|
| CP-1 | CPO | 제품 발견 범위 | B. 표준 (discoverer → strategist+researcher 병렬 → prd-writer) | 2026-04-19 |
| CP-0 | CTO | PRD 입력 | B. 강행 모드 (CPO Plan 을 입력으로 사용, 가정 8건 명기) | 2026-04-19 |
| CP-1 | CTO | 구현 범위 | **D. 커스텀** — infra-architect(스키마) → backend-engineer(전체) → test-engineer(테스트 7건) → qa-engineer(smoke) | 2026-04-19 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-19 | 초기 작성 — ideation 5 쟁점 결정 흡수, scratchpad+큐레이션+topic 모델 확정 |
| v1.1 | 2026-04-19 | CPO CP-1 결정 기록 (표준 범위 B) |
| v1.2 | 2026-04-19 | CTO Plan 합류 — CP-0 강행 모드 + 가정한 요구사항 8건 + T1~T15 구현 순서 + Gate 1 체크리스트 + 리스크 R1~R5 |
| v1.3 | 2026-04-19 | CTO CP-1 결정 기록 (D. 커스텀 체이닝) |
| v1.4 | 2026-04-19 | Do 분할 전략 Walking Skeleton (Batch A~D 4 세션) 확정 |

<!-- template version: v0.18.0 -->
