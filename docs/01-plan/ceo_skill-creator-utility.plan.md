# skill-creator-utility - 기획서

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | Anthropic 공식 skill-creator 레퍼런스가 inbox에만 존재하며, VAIS 워크플로우에서 접근 불가 |
| **Solution** | mcp-builder와 동일하게 `skills/vais/utils/skill-creator.md` 유틸리티로 핵심 가이드를 흡수 |
| **Function/UX Effect** | `/vais skill-creator` 명령으로 스킬 작성 가이드에 즉시 접근 가능 |
| **Core Value** | 스킬 생태계 확장 시 일관된 품질 기준 제공 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | reference md 파일은 삭제됨. inbox 원본은 eval 인프라 등 VAIS 외부 의존이 많아 그대로 사용 불가 |
| **WHO** | VAIS 플러그인 개발자, 스킬 작성자 |
| **RISK** | 원본 486줄 → 유틸리티 축약 시 핵심 패턴 누락 가능 |
| **SUCCESS** | `/vais skill-creator` 실행 시 SKILL.md 구조, 작성 패턴, description 최적화 가이드 제공 |
| **SCOPE** | 유틸리티 1개 파일 생성 + SKILL.md 액션 목록 등록 |

---

## 0. 아이디어 개요

### 아이디어 한 줄 설명
> Anthropic 공식 skill-creator 스킬의 핵심 작성 가이드를 VAIS 유틸리티로 흡수한다.

### 배경 (왜 필요한지)
- 현재 문제: skill-creator 가이드가 `references/_inbox/` 에만 존재, 워크플로우 연동 안 됨
- 기존 해결책의 한계: reference md 파일은 사용자가 삭제함 (유틸리티가 더 적합하다는 판단)
- 이 아이디어가 필요한 이유: mcp-builder 패턴과 동일하게 `/vais skill-creator`로 접근 가능하게

### 타겟 사용자
- 주요 사용자: VAIS 스킬 작성자 (CTO, CPO가 새 스킬 추가 시)
- 보조 사용자: 외부 기여자
- 사용자의 현재 Pain Point: 스킬 작성 시 SKILL.md 구조, frontmatter, progressive disclosure 패턴을 매번 inbox에서 찾아야 함

### 사용자 시나리오
1. 상황: 새 스킬을 만들거나 기존 스킬을 개선하려 함
2. 행동: `/vais skill-creator` 실행
3. 결과: SKILL.md 구조, 작성 패턴, description 최적화 팁을 즉시 참조

## 0.5 MVP 범위

### 핵심 기능 브레인스토밍 (중요도/난이도 매트릭스)

| 기능 | 중요도 (1-5) | 난이도 (1-5) | MVP 포함 |
|------|------------|------------|---------|
| SKILL.md 구조 가이드 (frontmatter, anatomy) | 5 | 1 | Y |
| Progressive Disclosure 3-level 패턴 | 5 | 1 | Y |
| 작성 스타일 가이드 (imperative, examples) | 4 | 1 | Y |
| Description 최적화 팁 (triggering) | 4 | 1 | Y |
| Eval/benchmark 인프라 (Python scripts) | 2 | 5 | N |
| Blind comparison / analyzer agents | 1 | 5 | N |

### MVP 포함 기능
- SKILL.md anatomy (디렉토리 구조, frontmatter 필수 필드)
- Progressive Disclosure 3-level (metadata → body → bundled resources)
- 작성 패턴 (imperative, examples, output format)
- Description 최적화 핵심 원칙 (undertrigger 방지, edge case 커버)

### 이후 버전으로 미룰 기능
- eval/benchmark Python 인프라 (VAIS 외부 의존)
- grader/comparator/analyzer 서브에이전트 (VAIS에 이미 qa-validator 존재)
- `eval-viewer/generate_review.py` (브라우저 기반 리뷰)

## 1. 개요

### 1.1 기능 설명
> Anthropic 공식 skill-creator의 스킬 작성 핵심 가이드를 VAIS 유틸리티로 제공한다.

### 1.2 목적
- 해결하려는 문제: 스킬 작성 가이드 접근성
- 기대 효과: 일관된 스킬 품질, 빠른 스킬 개발
- 대상 사용자: VAIS 플러그인 개발자

## 2. Plan-Plus 검증

### 2.1 의도 발견
> 스킬 작성 시 반복되는 구조/패턴 질문을 유틸리티 한 곳에서 해결

### 2.2 대안 탐색
| # | 대안 | 장점 | 단점 | 채택 여부 |
|---|------|------|------|----------|
| 1 | references/ 루트에 md 보관 | 단순 | 워크플로우 미연동, 사용자가 이미 삭제함 | ❌ |
| 2 | utils/ 유틸리티로 축약 | mcp-builder 패턴 일관성, `/vais` 연동 | 원본 대비 축약 | ✅ |
| 3 | 별도 에이전트 생성 | 완전한 기능 | 과잉 설계, eval 인프라 불필요 | ❌ |

### 2.3 YAGNI 리뷰
- [x] 현재 필요한 기능만 포함했는가? — eval 인프라 제외
- [x] 미래 요구사항을 위한 과잉 설계가 없는가? — 가이드 문서 1개
- [x] 제거할 수 있는 기능이 있는가? — grader/comparator/analyzer 제외

## 3. 사용자 스토리

| # | As a... | I want to... | So that... |
|---|---------|-------------|------------|
| 1 | VAIS 개발자 | `/vais skill-creator`로 가이드 참조 | 새 스킬의 SKILL.md를 빠르게 작성할 수 있다 |
| 2 | 스킬 작성자 | description 최적화 팁 확인 | 스킬 triggering 정확도를 높일 수 있다 |

## 4. 기능 요구사항

### 4.1 기능 목록

| # | 기능 | 설명 | 관련 파일 | 우선순위 | 구현 상태 |
|---|------|------|----------|---------|----------|
| 1 | 유틸리티 파일 생성 | `skills/vais/utils/skill-creator.md` | 신규 | Must | 미구현 |
| 2 | SKILL.md 액션 등록 | 유틸리티 테이블에 `skill-creator` 추가 | `skills/vais/SKILL.md` | Must | 미구현 |
| 3 | CLAUDE.md 동기화 | 변경 사항 반영 (선택) | `CLAUDE.md` | Nice | 미구현 |

## Impact Analysis

### Changed Resources

| Resource | Type | Change Description |
|----------|------|-------------------|
| `skills/vais/utils/skill-creator.md` | create | 스킬 작성 가이드 유틸리티 |
| `skills/vais/SKILL.md` | modify | 유틸리티 테이블에 skill-creator 행 추가 |

### Verification
- [x] 모든 consumer 확인 완료
- [x] breaking change 없음 확인

## Success Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | `/vais skill-creator` 실행 시 가이드 출력 | 유틸리티 파일 존재 확인 |
| SC-02 | SKILL.md anatomy, progressive disclosure, description 팁 포함 | 내용 검증 |
| SC-03 | mcp-builder와 동일한 구조 (frontmatter + 섹션 + 변경이력) | 포맷 비교 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-05 | 초기 작성 |
