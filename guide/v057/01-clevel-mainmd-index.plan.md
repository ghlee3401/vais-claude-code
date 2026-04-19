# v0.57 Sub-plan 01 — C-Level main.md → Index Format

> 선행: 00
> 후행: 04
> 대상: `agents/{ceo,cpo,cto,cso,cbo,coo}/{c-level}.md` (6 파일)

## 1. 목적

C-Level agent 의 `main.md` 를 "sub-agent 산출물을 요약 묶음" → **"인덱스 + 핵심 의사결정"** 포맷으로 재정의. 사용자 요청 "main.md 에 내용이 축약되는 걸 지양" 반영.

## 2. 새 main.md 표준 포맷

### 2.1 공통 섹션 (모든 phase)

```markdown
# {feature} — {phase} ({C-Level})

> Author: {c-level}
> Phase: {NN-phase}
> Sub-docs: {N}개 (아래 "Sub-documents" 표)

## Executive Summary
| Perspective | Content |
|-------------|---------|
| Problem     | ... |
| Solution    | ... |
| Effect      | ... |
| Core Value  | ... |

## Context Anchor
| Key      | Value |
|----------|-------|
| WHY / WHO / RISK / SUCCESS / SCOPE | ... |

## Decision Record
| # | 결정 | 대안 | 선택 이유 | 근거 sub-doc |
|---|------|------|-----------|-------------|
| 1 | {결정} | A/B/C | {이유} | [backend-engineer.md#auth](backend-engineer.md#auth) |

## Sub-documents
| Agent | 역할 | 경로 | 한 줄 요약 |
|-------|------|------|-----------|
| ui-designer | 화면 설계 | `ui-designer.md` | 5 화면, 탭 기반 IA |
| infra-architect | 인프라 | `infra-architect.md` | 3 테이블, PG 16, Redis |

## Gate Metrics (해당 phase 에 게이트가 있는 경우)
- matchRate: {N}%
- criticalIssueCount: {N}
- {기타 메트릭}

## Next
- 다음 phase: `/vais {c-level} {next-phase} {feature}`
- 선행 조건: {있다면}
```

### 2.2 Phase 별 추가 섹션

| Phase | 추가 섹션 | 비고 |
|-------|----------|------|
| 00-ideation | "Problem Space", "Hypotheses", "Exit Criteria" | 선택. CEO / CPO 주도 |
| 01-plan | "Requirements Summary" + "Impact Analysis" | 상세는 sub-doc / prd-writer.md 참조 |
| 02-design | "Architecture Decision" + "Interface Contract 링크" | 화면 상세는 ui-designer.md 로 이관 |
| 03-do | "Implementation Summary" + "Changed Files 총계" | 파일 별 diff 는 sub-doc |
| 04-qa | "Verdict 표" + "Critical/Important 합계" | 이슈 상세는 qa-engineer.md 로 이관 |
| 05-report | (sub-doc 없음, 기존 포맷 유지) | CP-5=B 결정 반영 |

## 3. 변경 대상 파일 & 범위

### 3.1 `agents/{c-level}/{c-level}.md` (6 파일)

각 파일에서 아래 섹션을 업데이트:

| 섹션 | 변경 |
|------|------|
| `## PDCA 사이클` 표 | "산출물" 컬럼에 `main.md (인덱스) + {slug}.md` 구조 명시 |
| `## Contract` > `Output` | 각 phase 에 "main.md (index)" + "sub-docs (per agent)" 두 줄로 분리 |
| `## Checkpoint` CP 출력 포맷 | CP-1/D/2/Q 출력 시 "Sub-documents" 요약 블록 추가 권장 (선택) |
| `## Do 문서 생성` 등 phase 별 지침 | main.md = 인덱스 + Decision Record 에 집중. 파일별 diff 는 sub-doc 으로 이관 지시 |

### 3.2 phases/*.md (skills/vais/phases/)

6 파일 (`ceo.md`, `cpo.md`, `cto.md`, `cso.md`, `cbo.md`, `coo.md`, `ideation.md`) 의 **완료 후 출력 형식** 섹션에 "sub-doc 링크가 있으면 인덱스 포맷 우선" 한 줄 추가.

## 4. 작성 규칙

### 4.1 main.md 가 해야 할 일

- ✅ Executive Summary + Context Anchor + Decision Record
- ✅ Sub-documents 인덱스 표 (Agent / 역할 / 경로 / 1줄 요약)
- ✅ Gate Metrics (해당 phase)
- ✅ Phase 간 이어지는 결정의 연속성 (Decision Record Chain)

### 4.2 main.md 가 하면 안 되는 일

- ❌ sub-agent 의 전문 분석 본문을 통째로 복사
- ❌ 파일별 diff / code snippet 나열 (→ sub-doc 로 이관)
- ❌ 화면별 ASCII 와이어프레임 (→ ui-designer.md 로 이관)
- ❌ 이슈 60개 나열 (→ qa-engineer.md 로 이관, main.md 는 Critical N / Important M 합계만)

### 4.3 "Sub-documents" 섹션 생성 방식

**CP-3 결정 반영 (C. 하이브리드)**:
- 자동: sub-plan 04 의 `doc-validator.js` 가 `docs/{feature}/{phase}/*.md` 스캔하여 표 스켈레톤 주입 시도
- 수동: C-Level 이 "한 줄 요약" 컬럼 채움 (자동으로는 내용 요약 어려움)

## 5. 예시 (Before / After)

### 5.1 Before (v0.56 현 CTO Do main.md)

```markdown
## 구현 결과
- 인증 API: JWT 기반으로 구현. JwtStrategy 사용. 리프레시 토큰은 Redis 에 저장...
  (백엔드 상세 200줄)
- 로그인 화면: 탭 전환 애니메이션 추가...
  (프론트 상세 150줄)
- 테스트: 38개 케이스 추가...
  (테스트 상세 80줄)
```

### 5.2 After

**`03-do/main.md`** (CTO):
```markdown
## Implementation Summary
| 영역 | 산출 | 주요 결정 | sub-doc |
|------|------|-----------|---------|
| Backend | 8 endpoint | JWT + Redis refresh | [backend-engineer.md](backend-engineer.md) |
| Frontend | 5 화면 | 탭 전환, Zustand | [frontend-engineer.md](frontend-engineer.md) |
| Test | 38 케이스 | 단위 + 통합 + e2e | [test-engineer.md](test-engineer.md) |

## Changed Files (총계)
- 생성: 14 / 수정: 8 / 삭제: 0
- 상세: 각 sub-doc 참조
```

**`03-do/backend-engineer.md`** (sub-agent):
```markdown
# {feature} — do — backend-engineer
> Author: backend-engineer ...

## 1. 맥락
interface-contract 의 8 endpoint 구현.

## 2. 구현 상세
### 2.1 JWT 전략
(원본 200줄 본문)

### 2.2 Refresh Token
(상세)

## 3. 결정
| # | 결정 | 대안 | 이유 |
| 1 | JWT + Redis refresh | (세션 기반) | 수평 확장 |
```

## 6. 성공 기준

| # | Criteria | 검증 |
|---|----------|------|
| SC-01-1 | 6 C-Level agent markdown 의 PDCA 표 + Contract Output 섹션이 신규 포맷 반영 | grep `main.md (index)` in `agents/*/[ceo|cpo|cto|cso|cbo|coo].md` |
| SC-01-2 | 6 phases/*.md 가 완료 출력 형식에서 sub-doc 인덱스 언급 | grep `Sub-documents` in `skills/vais/phases/*.md` |
| SC-01-3 | "Before/After" 예시 최소 1건이 test fixture 로 존재 | tests/fixtures/subdoc-index.sample.md |
| SC-01-4 | Report (05-report) 는 기존 포맷 유지, main.md 단일 | 변경 없음 |

## 7. 리스크

| 리스크 | 완화 |
|--------|------|
| C-Level 이 "1줄 요약" 컬럼을 비워둠 | sub-plan 04 의 doc-validator 가 경고 (차단 X) |
| Decision Record 가 Chain 을 잃음 (phase 간 끊김) | 04 Validator 가 이전 phase main.md 참조 여부 체크 |
| 기존 피처 main.md 역호환 | 기존 파일 유지, 신규 피처부터 적용 |

## 8. 구현 체크리스트

- [ ] `agents/ceo/ceo.md` — PDCA 표 + Contract Output + 완료 아웃로 문구 업데이트
- [ ] `agents/cpo/cpo.md` — 동일
- [ ] `agents/cto/cto.md` — 동일 + "Do 문서 생성" 섹션 재작성
- [ ] `agents/cso/cso.md` — 동일 + CSO verdict 표가 main.md, 이슈 본문은 auditor.md 로
- [ ] `agents/cbo/cbo.md` — 동일 + 다수의 analyst sub-agent 인덱스 명시
- [ ] `agents/coo/coo.md` — 동일
- [ ] `skills/vais/phases/{6 files}.md` — 완료 출력 형식에 sub-doc 언급
- [ ] sample fixture 작성

## 9. 다음

sub-plan 02 (sub-agent 자기 문서 작성 규칙) 와 병렬 진행 가능.
