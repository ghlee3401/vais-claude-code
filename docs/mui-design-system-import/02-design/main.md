# mui-design-system-import — 설계서 v2.0

> Phase: 🎨 design | Owner: CTO (직접 작성 — sub-agent 미위임) | Date: 2026-05-02 (v2.0 — 런타임 통합 폐기)
> 참조: `docs/mui-design-system-import/01-plan/main.md` v2.0, `architecture-plan.md` v2.0
>
> **v2.0 변경 사유**: 사용자 의도 재확인 — 본 피처 = "Figma 분석 → MD 카탈로그 박제". v1.0 의 hook diff / MCP adapter API / router 인터페이스 / feature flag 결정은 모두 폐기.

## 한 줄 요약

plan v2.0 의 박제 모델을 interface contract 수준으로 정제 — 디렉토리 컨벤션, MD 카탈로그 schema, lockfile schema, INDEX.md 형식, import script CLI 확정. **런타임 통합 인터페이스 (Hook diff / MCP adapter API) 폐기**.

---

## Decision Record (multi-owner)

| # | Decision | Owner | Rationale | Source topic |
|---|----------|:-----:|-----------|--------------|
| D-1 | 모듈 구조 = `scripts/` (실행) + `scripts/import-mui-helpers/` (재사용 헬퍼). 작은 피처라 `lib/` 진입까지 가지 않음 | cto | (v2.0) router 폐기로 모듈 수 축소. `lib/` 으로 격상은 후속 피처에서 검토 | `architecture.md` |
| D-2 | JSON schema 표준 = JSON Schema Draft-07 (Ajv 호환). 토큰 JSON (선택 출력) + lockfile schema. MD 자체는 schema 검증 대상 외 (구조 검증은 별도 시각 review) | cto | Ajv 검증으로 lockfile/JSON 일관성 자동 보장 | `data-model.md` |
| D-3 | import script CLI = `node scripts/import-mui-design-system.js [--fallback-mui-only] [--dry-run] [--verbose]` | cto | dry-run 으로 CI/PR 검증 가능. ds-name 파라미터는 본 피처에서는 mui 고정, 후속 피처가 일반화 | `api-contract.md` |
| D-4 | ~~Hook 수정~~ → **변경 없음 (v2.0)** | cto | (v2.0) 런타임 통합 폐기 | — |
| D-5 | ~~MCP adapter~~ → **변경 없음 (v2.0)** | cto | (v2.0) 런타임 통합 폐기 | — |
| D-6 | ~~router 우선순위~~ → **router 자체 없음 (v2.0)**. INDEX.md 가 등록만 담당 | cto | (v2.0) 런타임 라우팅 폐기 | — |
| D-7 | ~~feature flag~~ → **N/A (v2.0)** | cto | (v2.0) 런타임 통합 폐기로 toggle 대상 없음 | — |
| D-8 | (v2.0 신규) ui-designer.md 안내 = "## 문서 참조 규칙" 섹션에 한 줄: "디자인 시스템 카탈로그가 있으면 `design-system/{ds}/MASTER.md` 를 참조한다." 끝 | cto | 사용자 의도 = 단순 참조. agent 가 컨텍스트에서 자연스럽게 인식 | `api-contract.md` |
| D-9 | (v2.0 신규) MD 카탈로그 표준 섹션 = (헤더 + 출처/라이선스) + (토큰 표) + (variants/sizes/states 표) + (a11y) + (사용 예시). 사람이 1분 안에 어떤 토큰/컴포넌트를 쓸지 결정 가능 | cto | "잘 정리된 MD" 의 객관 기준 | `data-model.md` §5 |

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | plan v2.0 의 박제 모델을 do 단계에서 모호함 없이 구현하려면 schema/CLI/MD 형식이 정해져야 함 |
| **Solution** | 토큰 JSON schema (선택) + lockfile schema + MD 카탈로그 표준 섹션 + import CLI 시그니처 + ui-designer.md 1줄 안내 spec 박제 |
| **Effect** | do 단계에서 schema/CLI/형식만 보고 구현 가능 — 해석 여지 ❌ |
| **Core Value** | interface contract 의 폭이 좁아짐 (런타임 통합 폐기) → 구현 자유도 ↑, 회귀 위험 ↓ |

---

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | plan v2.0 결정을 schema 수준으로 정제 |
| WHO | infra-architect/backend-engineer 가 do phase 에서 본 design 을 따라 구현 |
| RISK | schema 불일치 시 lockfile 무결성 깨짐 / MD 형식 불균일 시 사람이 사용하기 불편 |
| SUCCESS | do phase 시작 시 backend-engineer 가 schema/CLI/형식 확정성 검증 통과 + 추가 질문 0건 |
| SCOPE | interface contract (schema + CLI + MD 형식 + ui-designer.md 1줄 spec) 만 |

---

## Topic Documents

| Topic | 파일 | Owner | 한 줄 요약 |
|-------|------|:-----:|-----------|
| Architecture | `architecture.md` | cto | 모듈 의존 그래프 + 데이터 흐름 (런타임 통합 폐기로 단순화) |
| Data Model | `data-model.md` | cto | 토큰 JSON schema (선택) + lockfile schema + INDEX entry + MD 카탈로그 표준 섹션 |
| API Contract | `api-contract.md` | cto | import CLI 시그니처 + exit code + ui-designer.md 1줄 spec (Hook/MCP API 폐기) |

## Scratchpads

| Agent | 경로 | 비고 |
|-------|------|-----|
| (none) | — | CTO 직접 작성 phase, sub-agent 미위임 |

---

## Gate 2 — Interface Contract (v2.0)

본 피처는 외부 API/UI 가 없는 internal infra 라 표준 Interface Contract 포맷 (HTTP 엔드포인트) 미적용. v2.0 에서 런타임 통합 마저 폐기되어 인터페이스 면적 더 축소:

| 표준 항목 | 본 피처 매핑 (v2.0) | 위치 |
|----------|-------------------|------|
| API 엔드포인트 | **(없음)** — 모든 동작이 CLI 1회 실행 | — |
| 에러 코드 | CLI exit code 표 (0~4) | `api-contract.md` §1.4 |
| 공통 응답 형식 | CLI stdout 포맷 (4-stage 진행 + DIFF SUMMARY) | `api-contract.md` §1.3 |
| MD 카탈로그 형식 | 표준 섹션 9개 (헤더/출처/토큰/variants/sizes/states/a11y/예시/changelog ref) | `data-model.md` §5 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-01 | CTO design 초기 작성 (D-1~D-7 + topic 3개 + Gate 2 매핑) |
| **v2.0** | **2026-05-02** | **사용자 의도 재확인 — 런타임 통합 폐기. D-4 (Hook diff) / D-5 (MCP adapter) / D-6 (router 우선순위) / D-7 (feature flag) 모두 폐기. D-1 (lib→scripts 만) / D-3 (CLI) 단순화. D-8 (ui-designer.md 1줄 안내) / D-9 (MD 카탈로그 표준 섹션) 신규. Gate 2 인터페이스 매핑 단순화. 이전 행 삭제 없음, 폐기 사유 명시.** |
