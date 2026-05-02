---
owner: cto
agent: cto-direct
artifact: phase-index
phase: design
feature: simplify-non-cto-workflow
generated: 2026-05-02
summary: "v2.x 통합 모델의 interface contract 정제. plan 의 9 spec → design 의 정확한 코드/스키마 레벨 변경 단위."
---

# simplify-non-cto-workflow — Design (인덱스)

> Phase: 🎨 design | Owner: CTO (직접 작성, sub-agent 미위임) | Date: 2026-05-02
> 참조: `docs/simplify-non-cto-workflow/01-plan/main.md` v1.0 + 8 plan artifact

## Executive Summary

| Perspective | Content |
|-------------|---------|
| Problem | plan v1.0 의 9 spec 이 추상 수준. do 단계에서 모호함 없이 구현하려면 코드/스키마 레벨 정제 필요 |
| Solution | 6 design topic 으로 분리 — CEO 알고리즘 의사 코드, subdoc-guard 정확한 본문, vais.config 정확한 schema, validator 룰 코드 변경, patch 스크립트 동작, 라우팅 sequence |
| Effect | do phase 시작 시 backend/scripts 수정자가 spec 만 보고 구현 가능 (해석 여지 ❌) |
| Core Value | plan = "무엇을" / design = "어떻게" 의 깊이. 둘을 명확히 분리해서 do 부담 ↓ |

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | plan spec 이 의도/원칙 위주. 코드 레벨 변경 시 정밀 spec 필요 |
| WHO | do phase 의 CTO (직접 또는 backend-engineer 위임) |
| RISK | over-spec → 유연성 ↓ / under-spec → 모호 |
| SUCCESS | do 진입 시 추가 질문 0건. 검증 (R-1~R-6) 자동 통과 |
| SCOPE | interface contract 레벨 (함수 시그니처 / schema / 정확 텍스트). 실제 코드 작성은 do |

## Decision Record

| # | Decision | Owner | Rationale | Source artifact |
|---|----------|:-----:|-----------|----------------|
| D-1 | CEO 7 차원 = `lib/ceo-algorithm.js` 단일 모듈 + 의사 코드 spec | cto | testable, 다른 phase 에서도 import 가능 | ceo-algorithm-impl.md |
| D-2 | subdoc-guard 본문 = canonical 텍스트로 박제 → patch 스크립트가 inline 주입 | cto | 37 sub-agent 동기 보장 | subdoc-guard-canonical.md |
| D-3 | main.md template = `templates/main-md.template.md` 신규. 5 섹션 자동 채우기 | cto | C-Level 일관성 | main-md-template.md |
| D-4 | doc-validator 룰 = 4 갱신 (W-MAIN-SIZE 폐기 / W-IDX-01 갱신 / W-OWN 갱신 / W-SCOPE 단순화) | cto | 새 모델 호환 | validator-rules.md |
| D-5 | vais.config.json schema = primary/secondary 분리 + phaseArtifactMapping 신규 | cto | CEO 알고리즘 의존 | vais-config-schema.md |
| D-6 | patch 스크립트 동작 = legacy mode 지원 (rollback 가능) | cto | tech-risks R-1 완화 | patch-script-spec.md |

## Topic Documents (artifact 인덱스)

| Topic | 파일 | Owner | 한 줄 요약 |
|-------|------|:-----:|-----------|
| CEO 알고리즘 구현 | `ceo-algorithm-impl.md` | cto | 7 차원 함수 시그니처 + 의사 코드 + 등급 알고리즘 |
| subdoc-guard 정본 | `subdoc-guard-canonical.md` | cto | 새 SUB-DOC RULES 본문 (patch 스크립트 inline 주입 대상) |
| main.md 템플릿 | `main-md-template.md` | cto | templates/main-md.template.md 정확 마크다운 |
| Validator 룰 | `validator-rules.md` | cto | doc-validator 4 룰 갱신 + 코드 변경 |
| vais.config schema | `vais-config-schema.md` | cto | primary/secondary 분리 + phaseArtifactMapping schema |
| patch 스크립트 spec | `patch-script-spec.md` | cto | patch-subdoc-block + patch-clevel-guard 동작 + legacy mode |

## Gate 2 — Interface Contract

본 피처는 외부 HTTP API 가 없는 internal infra. Interface = (a) CEO 알고리즘 함수 (b) subdoc-guard 본문 (c) vais.config schema (d) doc-validator 룰 (e) patch 스크립트 CLI.

| 표준 항목 | 본 피처 매핑 |
|----------|-------------|
| API 엔드포인트 | (없음) |
| 함수 시그니처 | `ceo-algorithm-impl.md` §함수 시그니처 |
| 데이터 schema | `vais-config-schema.md` |
| 텍스트 정본 | `subdoc-guard-canonical.md`, `main-md-template.md` |
| CLI | `patch-script-spec.md` (`--legacy` / `--dry-run`) |
| 검증 룰 | `validator-rules.md` |

## Success Criteria (design 검증)

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-D1 | CEO 알고리즘 함수가 입력(피처 요청) → 출력(7 차원 결과 + phase/artifact 매핑) 결정적 | unit test 가능한 spec |
| SC-D2 | subdoc-guard 본문 정본이 patch 스크립트로 일괄 적용 가능 | dry-run 결과 검증 |
| SC-D3 | vais.config schema 가 backward-compat (옵트아웃 가능) | schema migration 검토 |
| SC-D4 | doc-validator 룰 갱신이 기존 docs 와 호환 (현재 docs/ 비어있어 부담 적음) | 회귀 테스트 |
| SC-D5 | 모든 spec 이 do phase 에서 모호함 없이 구현 가능 | do 진입 시 추가 질문 0건 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | CTO design 인덱스 — 6 topic + Gate 2 매핑 + Decision 6 + SC-D1~D5. plan 9 spec → design 6 spec 으로 정제 (frontmatter/identity/ux 는 plan 에서 충분, design 에서 코드/schema 레벨로 더 깊어진 것만 topic). |
