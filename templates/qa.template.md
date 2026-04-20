# {feature} — QA

> 참조 문서: `docs/{feature}/01-plan/main.md`, `docs/{feature}/02-design/main.md`
> <!-- size budget: main.md ≤ 200 lines 권장 (workflow.cLevelCoexistencePolicy.mainMdMaxLines). 초과 시 topic 문서로 분리. -->

## Decision Record (multi-owner)

<!-- 각 C-Level 이 자기 결정 행 append. Owner 컬럼 필수.
     C-Level 별 H2 섹션: ## [CTO] QA 판정 / ## [CSO] 보안 QA / ... -->

| # | Decision | Owner | Rationale | Source topic |
|---|----------|:-----:|-----------|--------------|
| 1 | {QA 판정/조치} | cto | {근거} | `{topic}.md` |

## 0. 빌드/실행 검증

| 항목 | 상태 | 비고 |
|------|------|------|
| 의존성 설치 | ✅/❌ | |
| 빌드 성공 | ✅/❌ | |
| 서버 기동 | ✅/❌ | |
| 핵심 동작 | ✅/❌ | |

## 1. 분석 개요

| 항목 | 값 |
|------|-----|
| 분석 대상 | {feature} |
| 분석 일시 | {date} |
| 기준 문서 | plan, design, infra |
| 총 요구사항 | {n}개 |
| 구현 완료 | {m}개 |
| 일치율 | {m/n * 100}% |

## 2. 요구사항 매칭

### 기획서 대비

| # | 요구사항 | 출처 | 구현 여부 | 관련 파일 |
|---|---------|------|----------|----------|

### 코딩 규칙 준수

| 규칙 | 준수 여부 | 비고 |
|------|----------|------|

### 설계 대비

| # | 설계 항목 | 구현 여부 | 차이점 |
|---|----------|----------|--------|

## 3. 미구현 항목 (Gap)

| # | 미구현 항목 | 출처 | 수정 대상 파일 | 수정 범위 | 수정 내용 |
|---|-----------|------|-------------|---------|---------|

## 4. 불일치 항목

| # | 항목 | 설계 내용 | 구현 내용 | 판정 |
|---|------|---------|---------|------|

## 5. 자동 반복 기록

| 회차 | 일치율 | 수정 항목 수 | 주요 수정 내용 |
|------|--------|-----------|-------------|

## 6. 보안 스캔 (OWASP Top 10)

| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| A01 | Broken Access Control | ✅/❌ | |
| A02 | Cryptographic Failures | ✅/❌ | |
| A03 | Injection | ✅/❌ | |
| A04 | Insecure Design | ✅/❌ | |
| A05 | Security Misconfiguration | ✅/❌ | |
| A06 | Vulnerable Components | ✅/❌ | |
| A07 | Auth Failures | ✅/❌ | |
| A08 | Data Integrity Failures | ✅/❌ | |
| A09 | Logging Failures | ✅/❌ | |
| A10 | SSRF | ✅/❌ | |

## 7. QA 시나리오

### 핵심 기능

| # | 시나리오 | 사전조건 | 테스트 단계 | 기대 결과 | 우선순위 | Pass/Fail |
|---|---------|---------|-----------|----------|---------|----------|

### 엣지 케이스

| # | 시나리오 | 입력 | 기대 결과 | Pass/Fail |
|---|---------|------|----------|----------|

### UI/UX 검증

| # | 항목 | 기준 | Pass/Fail |
|---|------|------|----------|

## 8. 코드 품질

| 항목 | 상태 | 비고 |
|------|------|------|
| 코딩 규칙 준수 | ✅/⚠️/❌ | |
| 네이밍 명확성 | ✅/⚠️/❌ | |
| 코드 중복 | ✅/⚠️/❌ | |
| 에러 핸들링 | ✅/⚠️/❌ | |
| 접근성 | ✅/⚠️/❌ | |
| 테스트 커버리지 | ✅/⚠️/❌ | |

## Architecture Compliance

### Layer Dependency

| Layer | Expected Dependencies | Actual | Status |
|-------|----------------------|--------|--------|
| {계층명} | {기대 의존성} | {실제} | ✅/❌ |

### Dependency Violations

| File | Layer | Violation | Recommendation |
|------|-------|-----------|----------------|

## Convention Compliance

### Naming Convention

| Category | Convention | Checked | Compliance % | Violations |
|----------|-----------|---------|-------------|------------|
| 파일명 | {규칙} | {n}개 | {m}% | |
| 변수명 | {규칙} | {n}개 | {m}% | |
| 컴포넌트명 | {규칙} | {n}개 | {m}% | |

### Folder Structure

| Expected Path | Exists | Correct | Notes |
|---------------|--------|---------|-------|

### Import Order

- [ ] 외부 라이브러리 → 내부 모듈 → 상대 경로 → 타입 → 스타일

## Success Criteria Evaluation

| ID | Criterion | Status | Evidence |
|----|-----------|--------|----------|
| SC-01 | {Plan에서 정의한 기준} | ✅ Met / ⚠️ Partial / ❌ Not Met | {근거: 파일:라인 또는 테스트 결과} |

**Success Rate**: {n}/{m} criteria met ({p}%)

## 9. 성능

| 항목 | 상태 | 비고 |
|------|------|------|
| N+1 쿼리 | ✅/⚠️ | |
| 메모리 누수 | ✅/⚠️ | |
| 불필요한 렌더링 | ✅/⚠️ | |
| 번들 사이즈 | ✅/⚠️ | |
| API 응답 시간 | ✅/⚠️ | |

## 10. 이슈 및 리턴 경로

| # | 이슈 | 심각도 | 대상 에이전트 | 카테고리 | 수정 힌트 |
|---|------|--------|-------------|---------|----------|

**return_to**: {P0 이슈 최다 에이전트}

## 11. 최종 판정

| 항목 | 결과 |
|------|------|
| Critical 이슈 | {n}건 |
| Warning 이슈 | {n}건 |
| Gap 일치율 | {n}% |
| QA 통과율 | {n}% |
| **최종 판정** | **Pass / Conditional / Needs Revision** |

**판정 기준:**
- **Pass**: Critical 0건 + Gap >= 90% + QA >= 90%
- **Conditional**: Warning만, Critical 없음
- **Needs Revision**: Critical 존재 또는 Gap < 90%

<!-- v0.57 subdoc-section begin -->

---

## Topic Documents (v0.57+)

> C-Level 이 `_tmp/*.md` scratchpad 를 읽고 주제별로 합성한 topic 문서 인덱스. 피처 크기에 따라 선택.

| Topic | 파일 | 한 줄 요약 | 참조 scratchpad |
|-------|------|-----------|----------------|
| | `{topic}.md` | | |

<!-- Phase 별 권장 topic 프리셋: vais.config.json > workflow.topicPresets.04-qa -->

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
