# {feature} — 인프라 설계

> 참조 문서: `docs/{feature}/01-plan/main.md`, `docs/{feature}/02-design/main.md`
> <!-- size budget: main.md ≤ 200 lines 권장 (workflow.cLevelCoexistencePolicy.mainMdMaxLines). 초과 시 topic 문서로 분리. -->

## Decision Record (multi-owner)

<!-- 각 C-Level 이 자기 결정 행을 append. Owner 컬럼 필수.
     C-Level 별 H2 섹션: ## [CTO] 구현 결정 / ## [CSO] 보안 이슈 / ... -->

| # | Decision | Owner | Rationale | Source topic |
|---|----------|:-----:|-----------|--------------|
| 1 | {구현 결정} | cto | {근거} | `{topic}.md` |

## 1. DB 개요

| 항목 | 내용 |
|------|------|
| DB 종류 | |
| ORM | |
| 마이그레이션 도구 | |

## 2. ERD

```mermaid
erDiagram
```

## 3. 테이블 스키마

### {테이블명}

| 컬럼 | 타입 | 제약조건 | 기본값 | 설명 |
|------|------|---------|--------|------|

## 4. 인덱스

| 테이블 | 인덱스명 | 컬럼 | 유형 | 목적 |
|-------|---------|------|------|------|

## 5. 관계 정의

| FK | 참조 테이블 | ON DELETE | 설명 |
|-----|-----------|-----------|------|

## 6. 마이그레이션

```sql
-- Migration: 001_create_tables
```

## 7. Seed 데이터

```sql
-- Seed: initial_data
```

## 8. 환경 설정

### 환경 변수 (.env.example)

```env
# Database
DATABASE_URL=
```

### 필수 서비스

| 서비스 | 용도 | 설정 방법 |
|--------|------|----------|

## 9. 프로젝트 설정

### 폴더 구조

```
src/
  db/
    schema/
    migrations/
    seed/
```

### 패키지 의존성

| 패키지 | 용도 | 버전 |
|--------|------|------|

## 10. 성능 고려사항

- 인덱싱 전략
- 파티셔닝 (필요 시)
- 캐싱 전략
- 쿼리 최적화 가이드

<!-- v0.57 subdoc-section begin -->

---

## Topic Documents (v0.57+)

> C-Level 이 `_tmp/*.md` scratchpad 를 읽고 주제별로 합성한 topic 문서 인덱스. 피처 크기에 따라 선택.

| Topic | 파일 | 한 줄 요약 | 참조 scratchpad |
|-------|------|-----------|----------------|
| | `{topic}.md` | | |

<!-- Phase 별 권장 topic 프리셋: vais.config.json > workflow.topicPresets.03-do -->

## Scratchpads (v0.57+)

> sub-agent 가 작성한 `_tmp/*.md` 인벤토리. `scripts/doc-validator.js` 가 Author/Phase 헤더 + size 검증.

| Agent | 경로 | 크기 | 갱신 |
|-------|------|:----:|-----|
| | `_tmp/{agent-slug}.md` | | |

<!-- v0.57 subdoc-section end -->


---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | {date} | 초기 작성 |

<!-- template version: v0.58.0 (v0.57+ subdoc / v0.58+ clevel-coexistence 포함) -->
