# skill-creator-utility - 설계서

## Decision Record

| 항목 | 결정 |
|------|------|
| **위임 구조** | CEO 직접 처리 (C-Level 위임 불필요) |
| **구현 방식** | `references/_inbox/` 원본 → `skills/vais/utils/` 유틸리티 축약 |
| **참조 패턴** | mcp-builder 유틸리티와 동일 구조 (frontmatter + 섹션 + 변경이력) |

## 위임 분석

### 왜 C-Level 위임 없이 CEO 직접 처리인가

| 판단 기준 | 결과 |
|----------|------|
| 코드 변경 | 없음 (md 파일만) |
| 아키텍처 변경 | 없음 (기존 utils/ 패턴 재사용) |
| 보안 영향 | 없음 |
| 테스트 필요 | 없음 (가이드 문서) |

→ CTO/CSO/COO 위임 불필요. CEO가 Plan 단계에서 직접 완료.

## 구현 현황

| 산출물 | 경로 | 상태 |
|--------|------|------|
| 유틸리티 파일 | `skills/vais/utils/skill-creator.md` | ✅ 완료 (119줄) |
| SKILL.md 등록 | `skills/vais/SKILL.md` 유틸리티 테이블 | ✅ 완료 |
| Plan 문서 | `docs/01-plan/ceo_skill-creator-utility.plan.md` | ✅ 완료 |

## 흡수 매핑

### 원본 → 유틸리티 매핑

| 원본 섹션 | 유틸리티 반영 | 비고 |
|----------|-------------|------|
| SKILL.md anatomy | ✅ §1 | 디렉토리 구조 + frontmatter |
| Progressive Disclosure | ✅ §2 | 3-level 테이블 + 핵심 패턴 |
| Writing Style | ✅ §3 | imperative, why-first, examples |
| Description Optimization | ✅ §4 | undertrigger 방지, 좋은/나쁜 예 |
| 4-Phase Process | ✅ §5 | Capture → Interview → Write → Review |
| Eval/Benchmark (Python) | ❌ 제외 | VAIS 외부 런타임 의존 |
| grader/comparator/analyzer | ❌ 제외 | VAIS에 qa-validator 존재 |
| eval-viewer (browser) | ❌ 제외 | 로컬 Python 서버 의존 |
| Claude.ai/Cowork 분기 | ❌ 제외 | VAIS 환경에 불필요 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-05 | 초기 작성 |
