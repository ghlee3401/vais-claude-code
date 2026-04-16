# unified-outro-format - 기획서

> ⛔ **Plan 단계 범위**: 이 문서는 분석과 결정만 기록합니다.
> 강행 모드: PRD 없음. ideation 기반 진행.

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | "CEO 추천" 아웃로 블록에 구분선 없어 가독성 저하. 아웃로 포맷이 SKILL.md에만 정의되어 서브에이전트에 미적용 |
| **Solution** | SKILL.md 아웃로 템플릿에 `---` 추가 + output-styles에 아웃로 포맷 섹션 추가 |
| **Effect** | 모든 C-Level 응답에서 일관된 아웃로 포맷 |
| **Core Value** | UX 일관성, 가독성 향상 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 사용자가 스크린샷으로 구분선 부재 직접 지적 |
| **WHO** | VAIS Code 사용자 |
| **RISK** | 낮음 — 마크다운 포맷 변경만 |
| **SUCCESS** | 모든 C-Level 응답에서 아웃로 앞 `---` 구분선 + 일관된 포맷 |
| **SCOPE** | SKILL.md + output-styles/vais-default.md 2개 파일 수정 |

---

## 1. 현황 분석

### 아웃로 포맷 적용 경로

```
SessionStart hook → output-styles/vais-default.md 로드 (메인 대화 + 서브에이전트 모두)
SKILL.md → /vais 커맨드 실행 시 메인 대화에서 참조
agents/{c-level}/{c-level}.md → Agent 도구로 서브에이전트 호출 시 참조
```

**핵심 포인트**: `output-styles/vais-default.md`는 SessionStart hook으로 로드되어 메인 대화 컨텍스트에 포함. 서브에이전트도 이 컨텍스트를 상속.

### 현재 문제

| 파일 | 아웃로 규칙 | `---` 구분선 |
|------|-----------|-------------|
| `SKILL.md` | 있음 (완료 아웃로 섹션) | ❌ "CEO 추천" 앞에 없음 |
| `output-styles/vais-default.md` | 하단 리포트만 정의 | ❌ 아웃로 포맷 미정의 |
| 6개 C-Level agent `.md` | 없음 | ❌ |

## 2. 변경 설계

### 2.1 SKILL.md 아웃로 템플릿 수정

**Before:**
```
---
✅ **$0 완료** — {피처명}

📌 **이번 작업 요약**
- {수행한 핵심 작업 1~3줄}

📍 **CEO 추천 — 다음 단계**
```

**After:**
```
---
✅ **$0 완료** — {피처명}

📌 **이번 작업 요약**
- {수행한 핵심 작업 1~3줄}

---

📍 **CEO 추천 — 다음 단계**
```

변경점: "CEO 추천" 블록 바로 위에 `---` 구분선 추가.

### 2.2 output-styles/vais-default.md에 아웃로 포맷 섹션 추가

하단 리포트 섹션 앞에 "완료 아웃로" 섹션 추가:
- "CEO 추천" 블록 앞 `---` 구분선 필수
- 작업 요약과 CEO 추천 사이 시각적 분리

이렇게 하면 output-styles를 로드하는 모든 대화(메인 + 서브에이전트)에서 동일 규칙 적용.

## 3. 변경 범위

| 파일 | 변경 내용 |
|------|----------|
| `skills/vais/SKILL.md` | 아웃로 템플릿에 `---` 추가 |
| `output-styles/vais-default.md` | 아웃로 포맷 섹션 추가 |

**에이전트 `.md` 개별 수정 불필요** — output-styles가 SessionStart에서 로드되므로 전체 적용됨.

---

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-16 | 초기 기획서 작성 |
