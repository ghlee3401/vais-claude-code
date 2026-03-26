# Plan: SessionStart 강화 + Output Style 자동 주입

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | session-start-enhance |
| 작성일 | 2026-03-26 |
| 목표 기간 | 1일 |

### Value Delivered

| 관점 | 내용 |
|------|------|
| Problem | vais-code SessionStart 출력이 ~20줄 텍스트에 불과하여 bkit 대비 존재감이 약하고, output-style이 자동 적용되지 않아 매 응답의 하단 리포트가 누락되는 경우 발생 |
| Solution | SessionStart를 모듈화하여 Progress Bar + Workflow Map + 피처 상태 요약을 시각적으로 출력하고, output-style 규칙을 additionalContext에 자동 주입 |
| Function UX Effect | 세션 시작 시 현재 작업 상태를 한눈에 파악 가능. 매 응답마다 일관된 하단 리포트 자동 표시 |
| Core Value | 플러그인 전문성과 신뢰감 향상. 사용자가 별도 설정 없이도 일관된 경험 제공 |

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | vais-code SessionStart가 bkit 대비 가시성이 낮아 사용자에게 플러그인 존재감을 제대로 전달하지 못함 |
| WHO | vais-code 플러그인 사용자 (개발자) |
| RISK | SessionStart 출력이 너무 길어지면 bkit과 합쳐져 context 낭비. 5초 타임아웃 내 완료 필수 |
| SUCCESS | SC-01: Progress Bar 표시, SC-02: Workflow Map 표시, SC-03: output-style 자동 주입, SC-04: 5초 이내 실행 |
| SCOPE | SessionStart hook 모듈화 + output-style 자동 주입. 새 스킬/에이전트 추가 없음 |

---

## 1. 배경 및 문제 정의

### 1.1 현재 상태

vais-code의 `hooks/session-start.js`는 단일 파일로 ~100줄의 간단한 구조:
- 버전 헤더 + 워크플로우 아이콘 한 줄
- 진행 중 피처 목록 (있을 때만)
- 커맨드 테이블 4줄
- 하단 리포트 규칙 텍스트

**출력량**: ~30줄 (additionalContext)

### 1.2 bkit 비교

bkit의 SessionStart는 9개 모듈로 분리된 파이프라인:
1. Migration → 2. Restore → 3. Context Init → 4. Onboarding → 5. Session Context → 6. Progress Bar → 7. Workflow Map → 8. Control Panel → 9. Stale Detection

**출력량**: ~200줄 이상 (Control Panel, Workflow Map, Progress Bar, 온보딩, 트리거 테이블 등)

### 1.3 문제점

1. **시각적 가시성 부족**: 텍스트 테이블만으로는 현재 상태 파악이 어려움
2. **output-style 미적용**: `vais-default.md`가 존재하지만 자동으로 적용되지 않아 하단 리포트가 누락됨
3. **모듈화 부재**: 단일 파일에 모든 로직이 혼재

---

## 2. 목표

| ID | 목표 | 측정 기준 |
|----|------|-----------|
| G-01 | SessionStart에 Progress Bar 표시 | 세션 시작 시 시각적 진행 바 출력 확인 |
| G-02 | SessionStart에 Workflow Map 표시 | 6단계 워크플로우 상태 시각화 출력 확인 |
| G-03 | output-style 규칙 자동 주입 | additionalContext에 하단 리포트 규칙 포함 확인 |
| G-04 | 타임아웃 준수 | 5초 이내 실행 완료 |

---

## 3. 요구사항

### 3.1 기능 요구사항

#### FR-01: Progress Bar 렌더링
- 현재 피처의 6단계 진행 상황을 시각적 바로 표시
- 형식: `┌─── {feature} ──── {percent}% ─┐`
- 각 단계: `✓`(완료), `▶`(진행중), `·`(대기)

#### FR-02: Workflow Map 렌더링
- 6단계 워크플로우를 화살표로 연결하여 표시
- 형식: `[📋기획 ✓]──→[🎨설계 ▶]──→[🔧인프라 ·]──→...`
- 현재 단계 강조

#### FR-03: Output Style 자동 주입
- `output-styles/vais-default.md`의 핵심 규칙을 additionalContext에 포함
- 별도 설정 없이 매 세션 자동 적용
- 기존 `buildReportRule()` 함수를 output-style 파일 기반으로 전환

#### FR-04: 모듈화
- `hooks/session-start.js`를 thin orchestrator로 변경
- 렌더링 로직을 `lib/ui/` 하위 모듈로 분리:
  - `lib/ui/progress-bar.js` — Progress Bar 렌더링
  - `lib/ui/workflow-map.js` — Workflow Map 렌더링

### 3.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-01 | 실행 시간 | 5초 이내 (hook timeout) |
| NFR-02 | 에러 격리 | 각 모듈 실패 시 다른 모듈에 영향 없음 |
| NFR-03 | 피처 없을 때 | Progress Bar/Workflow Map 미표시, 커맨드 테이블만 출력 |

---

## 4. 성공 기준

| ID | 기준 | 검증 방법 |
|----|------|-----------|
| SC-01 | 진행 중 피처가 있을 때 Progress Bar가 표시됨 | `node hooks/session-start.js` 실행 후 출력 확인 |
| SC-02 | 진행 중 피처가 있을 때 Workflow Map이 표시됨 | 동일 |
| SC-03 | 매 세션 시작 시 하단 리포트 규칙이 additionalContext에 포함됨 | additionalContext에 "하단 리포트" 규칙 존재 확인 |
| SC-04 | hook 실행이 5초 이내 완료 | `time node hooks/session-start.js` |

---

## 5. 구현 범위

### 5.1 수정 대상 파일

| 파일 | 변경 내용 |
|------|-----------|
| `hooks/session-start.js` | thin orchestrator로 리팩토링 (모듈 호출만) |
| `lib/ui/progress-bar.js` | **신규** — Progress Bar 렌더링 함수 |
| `lib/ui/workflow-map.js` | **신규** — Workflow Map 렌더링 함수 |
| `output-styles/vais-default.md` | 변경 없음 (기존 유지) |

### 5.2 구현 제외

- Control Panel (vais에는 자동화 레벨 개념 없음)
- Stale Detection (현재 필요성 낮음)
- 온보딩 분기 (신규/복귀 사용자 구분 불필요)
- 별도 setup 스킬

---

## 6. 리스크

| 리스크 | 영향 | 완화 |
|--------|------|------|
| additionalContext가 너무 길어져 context 낭비 | 중 | Progress Bar + Workflow Map 합쳐서 최대 15줄 이내로 제한 |
| bkit SessionStart와 출력이 겹쳐 혼란 | 중 | vais는 `💠` 아이콘으로 명확히 구분. bkit은 `┌───` 박스 스타일 |
| 5초 타임아웃 초과 | 높 | 모듈별 try-catch로 실패 격리. 파일 I/O 최소화 |

---

## 7. 예상 출력 예시

### 7.1 피처 진행 중일 때

```
┌─── login ───────────────────────────────────── 33% ─┐
│  📋✓  🎨✓  🔧▶  💻·  ⚙️·  ✅·  ██████░░░░░░░░░░░░  │
└─ 🔧인프라 • last: 2h ago                            ┘

┌─── Workflow: login ──────────────────────────────────┐
│                                                       │
│  [📋기획 ✓]→[🎨설계 ✓]→[🔧인프라 ▶]→[💻FE ·]→[⚙️BE ·]→[✅QA ·]  │
│                                                       │
└──────────────────────────────────────────────────────┘

# VAIS Code v0.19.1

> 📋기획 → 🎨설계 → 🔧인프라 → 💻프론트 + ⚙️백엔드 → ✅QA

## 진행 중인 피처

👉 **login** — 🔧 인프라 ✅✅🔄⬜⬜⬜

## 시작하기
| 커맨드 | 설명 |
|--------|------|
| `/vais auto {기능}` | 전체 자동 워크플로우 |
| `/vais plan {기능}` | 기획부터 시작 |
| `/vais status` | 진행 상태 확인 |
| `/vais help` | 사용법 안내 |

## VAIS 하단 리포트 (Required for all responses)
...
```

### 7.2 피처 없을 때

```
# VAIS Code v0.19.1

> 📋기획 → 🎨설계 → 🔧인프라 → 💻프론트 + ⚙️백엔드 → ✅QA

## 시작하기
| 커맨드 | 설명 |
|--------|------|
| `/vais auto {기능}` | 전체 자동 워크플로우 |
| `/vais plan {기능}` | 기획부터 시작 |
| `/vais status` | 진행 상태 확인 |
| `/vais help` | 사용법 안내 |

## VAIS 하단 리포트 (Required for all responses)
...
```
