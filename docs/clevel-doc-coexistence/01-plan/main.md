# clevel-doc-coexistence — 기획서

> ⛔ **Plan 단계 범위**: 분석·결정만 기록. 프로덕트 파일 수정은 Do 단계에서.
> Feature: `clevel-doc-coexistence` | v0.57.0 → v0.58.0
> 선행 ideation: `../00-ideation/main.md` | CP-0: B(강행) 선택 → ideation 을 요구사항 소스로 사용

> <!-- size budget: main.md ≤ 200 lines 권장. 초과 시 topic 분리 (F14 자가 적용) -->

## Executive Summary

| Perspective | Content | Contributing C-Levels |
|-------------|---------|-----------------------|
| **Problem** | CEO S-1 풀 런칭에서 여러 C-Level 이 `{NN-phase}/main.md` 에 순차 쓰기 → 이전 의사결정 소실. v0.57 은 sub-agent 경합만 해결 | cto |
| **Solution** | main.md append-only 멀티-오너 + H2 헤딩 섹션(`## [CBO]/[CPO]/...`) + Multi-owner Decision Record + topic frontmatter `owner` + `topicPresets.{phase}.{c-level}` 계층화. **+(F14) main.md size budget 로 직접 작성 phase 비대화도 차단** | cto |
| **Effect** | 한 파일에서 전 C-Level 의사결정 가시화 + main.md 비대화 자동 감지. v0.57 `_tmp/` 모델 완전 상위 호환 | cto |
| **Core Value** | 의사결정 투명성 · topic-first 일관성 · validator 자동 회귀 감시 · 10+1 시나리오 안정화 | cto |

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | v0.57.0 릴리즈 직후 다중 C-Level main.md 덮어쓰기 발견(2026-04-20) + 같은 날 사용자 지적으로 F14(직접 작성 phase 비대화 방지)도 범위에 편입 |
| WHO | PO/개발자(S-1 런칭 사용자), VAIS 프롬프트 유지보수자, CI 관리자 |
| RISK | main.md 길이 증가(완화: F14 size budget) / C-Level 규칙 위반(완화: W-MRG-*) / config 복잡도 / 6 agent md PR diff |
| SUCCESS | 3 C-Level 공존 샘플 + `npm test` ≥ 195 + Rule #15 + v0.58.0 + **본 피처 자가 적용 증명(SC-16)** |
| SCOPE | config + validator + status + 6 agent md + 5 templates + 4 문서. **제외**: 기존 피처 재마이그레이션, fail 강제화, CEO 자동 전파 |

## Decision Record (multi-owner)

| # | Decision | Owner | Rationale | Source topic |
|---|----------|-------|-----------|--------------|
| 1 | 파일명은 topic-first (`requirements.md` O, `cpo-requirements.md` X) | cto | 사용자 ideation 2026-04-20 명시 거부 (`{c-level}.md` 이름 미동의) | `requirements.md` §F2 |
| 2 | main.md append-only, 현재 턴 C-Level 이 자기 섹션 append | cto | 이전 C-Level 섹션 100% 보존. validator 검사 용이 | `requirements.md` §F3 |
| 3 | `topicPresets.{phase}.{c-level}` 확장 (backward-compatible 객체/배열) | cto | v0.57 무변경 호환 | `requirements.md` §F1 |
| 4 | 5 mandatory phase 전체 적용 | cto | 사용자 ideation 전 phase 선택 | `policy.md` §1 |
| 5 | v0.57 `_tmp/`/`subDocs[]`/subdoc-guard 무변경 유지 | cto | 상위 호환 원칙 | `policy.md` §1 |
| 6 | CP-0 = B(PRD 없이 강행) | cto | 메타 피처 + ideation 충분 | CP-0 2026-04-20 |
| 7 | CP-1 = B(표준 MVP 12건, v1.1 에서 14건) | cto | v0.57 선례와 동일 완결성 | CP-1 2026-04-20 |
| 8 | **F14 추가** — C-Level 직접 작성 phase 에서도 topic 분리 강제 (`mainMdMaxLines`) | cto | 사용자 지적 "57로 왔을 때 main.md 비대화 방지하자고 했는데 지금도 main.md 만 생기는 이유" — v0.57 모델 sub-agent 트리거 공백 | `requirements.md` §F14 |

## [CTO] 기획 요약

본 Plan 은 CTO 단독 오케스트레이션(메타 피처, UI 없음). 14 MVP 기능, 16 Success Criteria, 5 New / ~22 Changed / 0 Removed.

- **요구사항**: F1~F14 (topicPresets 확장 · owner frontmatter · main.md append-merge · validator W-* · 6 agent md 블록 복붙 · canonical guard · 5 templates · Rule #15 · policy 키 · status 확장 · patch 스크립트 · 버전 · **F14 size budget**). 상세 → `requirements.md`
- **영향 분석**: New 5 / Changed ~22 / Removed 0. F14 증분 +9 위치 ~50 라인. 상세 → `impact-analysis.md`
- **스코프/SC/기술접근/리스크**: Scope B(표준) + D-Q1~D-Q7 Design 이관 + SC-01~SC-16 + Walking Skeleton 4 Batch. 상세 → `policy.md`

## Topic Documents

| Topic | 파일 | Owner | 요약 |
|-------|------|:-----:|------|
| requirements | `./requirements.md` | cto | F1~F14 기능 요구사항 + MVP 포함/제외 |
| impact-analysis | `./impact-analysis.md` | cto | New/Changed/Removed + F14 증분 + Blast radius |
| policy | `./policy.md` | cto | Scope · D-Q · SC · 기술접근 · 리스크 · Walking Skeleton |

## Scratchpads

| Agent | 경로 | 크기 | 갱신 |
|-------|------|:---:|-----|
| (해당 없음 — CTO 직접 작성 phase) | — | — | — |

## Gate 1 체크리스트

| # | 항목 | 상태 |
|---|------|:---:|
| 1 | 피처 레지스트리 (`.vais/status.json`) | ✅ v2 스키마로 등록됨 |
| 2 | 데이터 모델 정의 | ✅ design `data-model.md` 에서 상세 |
| 3 | 기술 스택 선정 | ✅ 기존 Node.js + markdown + JSON 그대로 |
| 4 | YAGNI 검증 | ✅ MVP 제외 목록 명시 (F10, W-MRG-01, fail, conflict resolver) |

## Next

- `/vais cto design clevel-doc-coexistence` 에서 D-Q1~D-Q7 확정 + Interface Contract 생성 (Gate 2).

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-20 | 초기 — F1-F13 MVP, 11 SC, Impact Analysis, Walking Skeleton |
| v1.1 | 2026-04-20 | **topic 분리 리팩토링** — main.md 를 405→~150 라인 축약, 3 topic(`requirements`/`impact-analysis`/`policy`) 로 본문 이관. F14 추가 (사용자 지적 편입) |
