# legacy-skill-cleanup - 기획서

> ⛔ **Plan 단계 범위**: 이 문서는 분석과 결정만 기록합니다. 프로덕트 파일 생성·수정은 Do 단계에서 수행하세요.
> 강행 모드: PRD 없음. ideation 요약 기반으로 진행.

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | skills/vais/phases/ 내 6개 레거시 리다이렉트 stub 파일이 남아있음. 실제 에이전트는 agents/에 있어 혼란 유발 |
| **Solution** | 참조 검증 후 안전한 파일 6개 삭제 |
| **Function/UX Effect** | 프로젝트 구조 명확화, 불필요한 파일 제거 |
| **Core Value** | 코드베이스 정리, 유지보수성 향상 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 레거시 리다이렉트 stub이 혼란 유발 — 실제 에이전트는 agents/에 있음 |
| **WHO** | VAIS Code 개발자 |
| **RISK** | 낮음 — grep 전체 탐색으로 코드/설정 참조 없음 확인 완료 |
| **SUCCESS** | 6개 파일 삭제 + 빌드/실행 이상 없음 |
| **SCOPE** | skills/vais/phases/ 내 레거시 파일 6개 삭제 |

---

## 1. 참조 검증 결과

### 삭제 대상 (6개) — 코드/설정 참조 없음 확인

| # | 파일 | 내용 | 참조 |
|---|------|------|------|
| 1 | `skills/vais/phases/backend-engineer.md` | "CTO를 통해 실행" 리다이렉트 stub | 없음 |
| 2 | `skills/vais/phases/frontend-engineer.md` | 동일 | 없음 |
| 3 | `skills/vais/phases/infra-architect.md` | 동일 | 없음 |
| 4 | `skills/vais/phases/qa-engineer.md` | 동일 | 없음 |
| 5 | `skills/vais/phases/ui-designer.md` | 동일 | 없음 |
| 6 | `skills/vais/phases/plan.md` | "C-Level 경유 필수" 리다이렉트 stub | docs/ 문서 참조만 (코드 없음) |

### 삭제 제외 (1개) — 참조 있음

| 파일 | 이유 |
|------|------|
| `skills/vais/utils/skill-creator.md` | agents/ceo/skill-creator.md의 wrapper 대상. 두 파일은 역할 분담 관계 (CLI utility vs CC agent) |

## 2. 변경 범위

| 작업 | 파일 수 |
|------|--------|
| 삭제 | 6개 |
| 수정 | 0개 (참조 없으므로) |

## 3. 위험 평가

- SKILL.md의 라우팅 로직은 `phases/` 폴더에서 C-Level 이름(ceo, cpo, cto 등)과 유틸리티 이름만 매칭
- 삭제 대상 파일명(backend-engineer 등)은 SKILL.md 액션 목록에 없음
- 따라서 삭제해도 라우팅에 영향 없음

---

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-16 | 초기 기획서 작성 (참조 검증 완료) |
