# code-quality-fix Planning Document

> **Summary**: Code Review에서 발견된 Critical/Major 이슈를 체계적으로 수정하여 코드 품질 점수를 74점에서 90점 이상으로 향상
>
> **Project**: vais-code
> **Version**: 0.16.1
> **Author**: ghlee0304
> **Date**: 2026-03-25
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 코드 리뷰 결과 Critical 4건, Major 10건, Minor 13건의 이슈가 발견됨. XSS 취약점, 중복 코드, stale-status 버그, 테스트 커버리지 부족 등 |
| **Solution** | 우선순위별 3단계 수정: (1) Critical 보안/버그 즉시 수정, (2) Major 아키텍처 개선, (3) Minor 코드 정리 |
| **Function/UX Effect** | 대시보드 보안 강화, 워크플로우 상태 관리 안정성 향상, 테스트 가능성 확보 |
| **Core Value** | 플러그인 신뢰성 및 유지보수성 향상, 마켓플레이스 배포 품질 기준 충족 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | Code Review 점수 74/100 — Critical 보안 취약점 및 데이터 무결성 버그 존재 |
| **WHO** | vais-code 플러그인 사용자 및 개발자 |
| **RISK** | XSS 공격 가능성, 워크플로우 상태 데이터 손실 |
| **SUCCESS** | Critical 0건, Major 0건, 테스트 커버리지 70%+, 코드 리뷰 점수 90+ |
| **SCOPE** | Phase 1: Critical (보안), Phase 2: Major (아키텍처), Phase 3: Minor (정리) |

---

## 1. Overview

### 1.1 Purpose

bkit code-analyzer가 수행한 전체 코드 리뷰에서 발견된 27건의 이슈를 체계적으로 수정하여 vais-code 플러그인의 품질을 마켓플레이스 배포 기준 이상으로 향상시킨다.

### 1.2 Background

- 현재 코드 리뷰 점수: **74/100**
- Critical 이슈 4건 중 3건이 `generate-dashboard.js`에 집중 (XSS 취약점)
- `atomicWriteSync` 중복, stale-status 패턴 등 구조적 문제 존재
- 16개 모듈 중 7개만 테스트 존재 (커버리지 44%)

### 1.3 Related Documents

- Code Review Report: 이전 대화에서 생성된 리뷰 결과
- CHANGELOG.md: v0.14.1에서 보안 수정 이력 참조

---

## 2. Scope

### 2.1 In Scope

- [x] Phase 1: Critical 이슈 4건 수정
- [ ] Phase 2: Major 이슈 10건 수정
- [ ] Phase 3: 선별된 Minor 이슈 수정 (영향도 높은 것 우선)

### 2.2 Out of Scope

- 새로운 기능 추가
- 대규모 아키텍처 변경 (파일 분할은 Minor로 별도 관리)
- vendor/ 디렉토리 수정

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status | Issue Ref |
|----|-------------|----------|--------|-----------|
| FR-01 | `atomicWriteSync`를 공유 유틸로 추출 | Critical | Pending | C1 |
| FR-02 | `generate-dashboard.js` XSS 취약점 수정 (피처명 이스케이프) | Critical | Pending | C2 |
| FR-03 | Mermaid `securityLevel`을 `'strict'`로 변경 | Critical | Pending | C3 |
| FR-04 | 테이블 구분자 감지 정규식 수정 | Critical | Pending | C4 |
| FR-05 | `status.js`에서 미사용 `os` import 제거 | Major | Pending | M1 |
| FR-06 | 스크립트에 `require.main === module` 가드 추가 (5개 파일) | Major | Pending | M3 |
| FR-07 | `fileExists` 중복 제거 | Major | Pending | M4 |
| FR-08 | `setRunRange` stale-status 버그 수정 | Major | Pending | M5 |
| FR-09 | `saveGapAnalysis` stale-status 버그 수정 | Major | Pending | M6 |
| FR-10 | `atomicWriteSync` orphan tmp 파일 정리 로직 추가 | Major | Pending | M7 |
| FR-11 | `md2html` 이중 이스케이프 수정 | Major | Pending | M8 |
| FR-12 | `webhook.js` data 필드 우선순위 수정 | Major | Pending | M9 |
| FR-13 | 누락된 모듈 테스트 추가 (최소 3개) | Major | Pending | M10 |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Security | XSS 취약점 0건 | 코드 리뷰 재검증 |
| Reliability | stale-status 버그 0건 | 단위 테스트 |
| Testability | 테스트 커버리지 70%+ (현재 44%) | Jest coverage report |
| Compatibility | 기존 테스트 100% 통과 | `npm test` |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] Critical 이슈 4건 모두 수정 완료
- [ ] Major 이슈 10건 모두 수정 완료
- [ ] 기존 테스트 100% 통과
- [ ] 신규 테스트 추가 (최소 status.js feature registry, debug.js)
- [ ] 코드 리뷰 재실행 시 점수 90+ 달성

### 4.2 Quality Criteria

- [ ] Critical 이슈 0건
- [ ] Major 이슈 0건
- [ ] 빌드/테스트 성공
- [ ] 버전 0.17.0으로 업데이트

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| `atomicWriteSync` 추출 시 import 경로 변경으로 기존 코드 깨짐 | High | Medium | 테스트 먼저 실행하여 기존 동작 보장 후 리팩토링 |
| `require.main === module` 가드 추가 시 hooks 동작 변경 | Medium | Low | 각 스크립트별 동작 테스트 후 변경 |
| `escapeHtml` 적용 시 의도된 HTML 출력이 깨질 수 있음 | Medium | Medium | 대시보드 생성 후 시각적 검증 |
| stale-status 수정 시 동시 접근 race condition | Low | Low | atomic write 패턴으로 이미 보호됨 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `lib/status.js` | Library | `atomicWriteSync` 제거, import 변경, `os` 제거, stale-status 수정 |
| `lib/memory.js` | Library | `atomicWriteSync` 제거, import 변경, stale-status 수정 |
| `lib/fs-utils.js` | Library (NEW) | `atomicWriteSync`, `fileExists` 공유 유틸 |
| `lib/webhook.js` | Library | data spread 순서 변경 |
| `scripts/generate-dashboard.js` | Script | XSS 수정, Mermaid 보안, 테이블 파서 수정 |
| `scripts/prompt-handler.js` | Script | `require.main === module` 가드 추가 |
| `scripts/doc-tracker.js` | Script | `require.main === module` 가드 추가 |
| `scripts/stop-handler.js` | Script | `require.main === module` 가드 추가 |
| `scripts/get-context.js` | Script | `require.main === module` 가드 추가 |
| `hooks/session-start.js` | Hook | `require.main === module` 가드 추가 |
| `scripts/seo-audit.js` | Script | `fileExists` 중복 제거, import 변경 |
| `scripts/vais-validate-plugin.js` | Script | `fileExists` 중복 제거, import 변경 |

### 6.2 Current Consumers

| Resource | Consumer | Impact |
|----------|----------|--------|
| `atomicWriteSync` (status.js) | `initFeature`, `updatePhase`, `setRunRange`, `saveGapAnalysis`, `saveStatus` | import 경로 변경 필요 |
| `atomicWriteSync` (memory.js) | `saveMemory`, `addEntry` | import 경로 변경 필요 |
| `fileExists` (seo-audit.js) | SEO 감사 로직 | import 경로 변경 |
| `fileExists` (validate-plugin.js) | 플러그인 검증 로직 | import 경로 변경 |
| hooks scripts | Claude Code hook system | `require.main === module` 가드로 동작 영향 없음 (직접 실행) |

### 6.3 Verification

- [ ] `npm test` — 기존 7개 테스트 스위트 모두 통과
- [ ] hooks 정상 동작 확인 (SessionStart, PreToolUse, PostToolUse, Stop, UserPromptSubmit)
- [ ] 대시보드 생성 후 XSS 이스케이프 확인

---

## 7. Implementation Plan

### Phase 1: Critical Issues (우선순위 최고)

| Step | Task | Files | Est. |
|------|------|-------|------|
| 1-1 | `lib/fs-utils.js` 생성, `atomicWriteSync` + `fileExists` 추출 | NEW: `lib/fs-utils.js` | 10min |
| 1-2 | `status.js`, `memory.js`에서 import 변경 | `lib/status.js`, `lib/memory.js` | 5min |
| 1-3 | `generate-dashboard.js` XSS 수정: `escapeHtml` 적용 + Mermaid strict | `scripts/generate-dashboard.js` | 15min |
| 1-4 | 테이블 구분자 정규식 수정 | `scripts/generate-dashboard.js` | 5min |
| 1-5 | 기존 테스트 실행 확인 | - | 3min |

### Phase 2: Major Issues

| Step | Task | Files | Est. |
|------|------|-------|------|
| 2-1 | `os` import 제거 | `lib/status.js` | 1min |
| 2-2 | 5개 스크립트에 `require.main === module` 가드 추가 | 5 scripts | 20min |
| 2-3 | `seo-audit.js`, `validate-plugin.js`에서 `fileExists` 제거, import 변경 | 2 scripts | 5min |
| 2-4 | `setRunRange` stale-status 수정 | `lib/status.js` | 3min |
| 2-5 | `saveGapAnalysis` stale-status 수정 | `lib/status.js` | 3min |
| 2-6 | `atomicWriteSync` orphan tmp 정리 (try/finally) | `lib/fs-utils.js` | 5min |
| 2-7 | `md2html` 이중 이스케이프 수정 | `scripts/generate-dashboard.js` | 10min |
| 2-8 | `webhook.js` spread 순서 변경 | `lib/webhook.js` | 2min |
| 2-9 | 누락 테스트 추가 (fs-utils, debug, status feature registry) | `tests/` | 30min |

### Phase 3: Selected Minor Issues

| Step | Task | Files | Est. |
|------|------|-------|------|
| 3-1 | `debug.js` JSON.stringify 안전 처리 | `lib/debug.js` | 3min |
| 3-2 | `stop-handler.js` 함수 순서 정리 | `scripts/stop-handler.js` | 3min |
| 3-3 | `bash-guard.js` force-with-lease 주석 추가 | `scripts/bash-guard.js` | 1min |

---

## 8. Version Plan

- 현재: **v0.16.1**
- 수정 후: **v0.17.0** (Major 보안/품질 개선)
- CHANGELOG 업데이트 포함

---

## 9. Next Steps

1. [ ] Plan 리뷰 및 승인
2. [ ] Design 문서 작성 (`/pdca design code-quality-fix`)
3. [ ] Phase 1 → Phase 2 → Phase 3 순서로 구현
4. [ ] Gap 분석 (`/pdca analyze code-quality-fix`)
5. [ ] 완료 보고 (`/pdca report code-quality-fix`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-25 | Initial draft based on code review results | ghlee0304 |
