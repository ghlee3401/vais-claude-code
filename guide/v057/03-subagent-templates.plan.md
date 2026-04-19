# v0.57 Sub-plan 03 — Sub-agent Templates

> 선행: 00
> 후행: 04
> 대상: `templates/` 신규 6 파일 (공통 1 + 특화 5)

## 1. 목적

sub-agent 가 자기 sub-doc 을 작성할 때 참조할 **표준 구조 템플릿** 제공. 공통 1종 + agent 유형별 특화 5종. 35+ sub-agent 를 5 그룹으로 분류하여 과다한 템플릿 생성 회피.

## 2. 템플릿 분류

| 그룹 | 대상 agent | 특화 포인트 |
|------|-----------|-----------|
| Engineer | infra-architect, frontend-engineer, backend-engineer, test-engineer, db-architect, release-engineer, sre-engineer | 구현 결정 / 변경 파일 / 코드 규칙 / 트레이드오프 |
| Analyst | market-researcher, customer-segmentation-analyst, seo-analyst, growth-analyst, pricing-analyst, financial-modeler, unit-economics-analyst, finops-analyst, marketing-analytics-analyst, data-analyst | 데이터 / 모델 / 지표 / 인사이트 |
| Auditor | security-auditor, code-reviewer, secret-scanner, dependency-analyzer, compliance-auditor, plugin-validator, skill-validator, release-monitor, performance-engineer, qa-engineer, incident-responder | verdict / 발견사항 / Critical·Important 분류 / 근거 파일·라인 |
| Designer | ui-designer, copy-writer | 결과물 시안 / 시각 근거 / 브랜드 / 리뷰 |
| Researcher | ux-researcher, product-discoverer, product-researcher, product-strategist, prd-writer, backlog-manager | 인터뷰 / 가설 / 사용자 스토리 / 우선순위 |

## 3. 신규 파일 목록

| # | 파일 | 목적 |
|---|------|------|
| 1 | `templates/subdoc.template.md` | 공통 베이스 (다른 5개가 상속 개념으로 재사용) |
| 2 | `templates/subdoc-engineer.template.md` | Engineer 그룹 |
| 3 | `templates/subdoc-analyst.template.md` | Analyst 그룹 |
| 4 | `templates/subdoc-auditor.template.md` | Auditor 그룹 |
| 5 | `templates/subdoc-designer.template.md` | Designer 그룹 |
| 6 | `templates/subdoc-researcher.template.md` | Researcher 그룹 |

## 4. 공통 템플릿 스펙 (`subdoc.template.md`)

```markdown
# {feature} — {phase} — {agent}

> Author: {agent-slug}
> Phase: {NN-phase}
> Refs: {참조한 상위 문서 경로, 쉼표 구분}
> Summary: {C-Level main.md 인덱스에 들어갈 1줄 요약}

## 1. Context
- 작업 요청: (C-Level 이 위임한 내용)
- 선행 의사결정: (이 작업에 영향을 준 상위 Decision)
- 참조 문서: (plan/design main.md 경로)

## 2. Body
### 2.1 ~ 2.N
(agent 의 전문 영역. 축약 금지. 상세 근거·대안·측정치 포함.)

## 3. Decisions
| # | Decision | Options Considered | Chosen | Rationale |
|---|----------|-------------------|--------|-----------|
| 1 | | | | |

## 4. Artifacts
### 4.1 생성/수정 파일
| Path | Type | Change |
|------|------|--------|
| | create/modify/delete | |

### 4.2 외부 참조
- `// @see {URL}` 형태로 코드 주석 달았다면 여기에도 기록

## 5. Handoff
- 다음 agent 에게: (예: qa-engineer 가 검증할 항목)
- 열린 질문: (해결 못한 것)
- 기술 부채 (있다면): High/Medium/Low

## 6. 변경 이력
| version | date | change |
|---------|------|--------|
| v1.0 | | 초기 작성 |

<!-- subdoc-template version: v0.57.0 -->
```

## 5. 특화 템플릿 스펙 (각자 공통을 확장)

### 5.1 Engineer (`subdoc-engineer.template.md`)

공통의 `## 2. Body` 를 다음으로 치환:

```markdown
## 2. 구현 상세

### 2.1 아키텍처 / 설계 결정
- 참조한 Interface Contract / Plan / Design 경로
- 선택한 패턴 (예: Repository / MVC / Layered)

### 2.2 파일별 변경
#### {path}
- 역할:
- 주요 변경:
- 코드 규칙 준수: (Plan 의 코딩 규칙 ID 참조)

### 2.3 테스트 전략
- 단위 / 통합 / e2e 구분
- 커버리지 타겟

### 2.4 성능·보안 고려사항
- 캐싱 / N+1 / 인덱스 / 인증 / 입력 검증

### 2.5 마이그레이션 / 롤백
- DB 변경 시 마이그레이션 파일 경로
- 롤백 절차
```

### 5.2 Analyst (`subdoc-analyst.template.md`)

```markdown
## 2. 분석 상세

### 2.1 데이터 소스
- 원천 / 수집 기간 / 샘플 크기 / 한계

### 2.2 방법론
- 모델 / 세그멘테이션 기준 / 통계 기법

### 2.3 주요 발견 (Findings)
| # | Insight | Evidence | Impact |
|---|---------|----------|--------|

### 2.4 정량 지표
| Metric | Value | Benchmark | Gap |
|--------|-------|-----------|-----|

### 2.5 시각화 / 표
(차트 경로 또는 ASCII 표)

### 2.6 가정 / 민감도
- 가정 목록
- 주요 가정이 뒤집힐 경우 영향
```

### 5.3 Auditor (`subdoc-auditor.template.md`)

```markdown
## 2. 감사 결과

### 2.1 검사 범위
- 대상 파일 / 디렉토리 / 엔드포인트
- 검사 프레임워크 (OWASP Top 10 / GDPR / SAST 규칙 등)

### 2.2 Verdict
- overall: pass / pass_with_warnings / fail
- criticalCount: N
- importantCount: N
- score: (해당 시 숫자 — gate-manager 호환)

### 2.3 Findings — Critical
| # | Issue | File:Line | Impact | Suggested Fix |
|---|-------|-----------|--------|--------------|
| 1 | | | | |

### 2.4 Findings — Important
| ... |

### 2.5 Findings — Advisory
(Nice-to-fix)

### 2.6 메트릭 요약 (gate-manager 파싱용)
- `Critical: {N}`
- `Important: {N}`
- `matchRate: {N}%`  (qa-engineer 한정)
- `owaspScore: {N}`  (security-auditor 한정)
- `codeQualityScore: {N}`  (code-reviewer 한정)
```

### 5.4 Designer (`subdoc-designer.template.md`)

```markdown
## 2. 설계 / 시안

### 2.1 방향성 (Design Thinking)
- Purpose / Tone / Differentiation

### 2.2 IA / 화면 목록 (ui-designer) 또는 브랜드 목소리 (copy-writer)

### 2.3 컴포넌트 / 카피 명세
| # | Name | Spec | Notes |

### 2.4 디자인 토큰 / 브랜드 가이드라인
- 참조 경로

### 2.5 접근성 / 가독성 체크
- WCAG / 대비 / 키보드 네비게이션

### 2.6 리뷰 (선택, `.review` qualifier sub-doc 에서 사용)
- 시각적 계층 / 간격 / 타이포 / 색상 / 일관성 / 피드백
- 가장 먼저 고쳐야 할 한 가지
```

### 5.5 Researcher (`subdoc-researcher.template.md`)

```markdown
## 2. 리서치 상세

### 2.1 질문 / 가설
- Research Question
- Hypotheses (가설 목록)

### 2.2 방법 / 참가자
- 인터뷰 N명 / 설문 N건 / 데스크 리서치 범위

### 2.3 발견 (Findings)
| # | Finding | Evidence (quote/stat) | Implication |

### 2.4 페르소나 / JTBD
- Persona cards 또는 Job Statements

### 2.5 User Stories / Backlog (해당 시)
- As a... / I want... / So that...

### 2.6 우선순위 / 다음 스텝
- MoSCoW / RICE / Impact-Effort
```

## 6. 템플릿 참조 방식

각 sub-agent markdown (sub-plan 02 의 `_shared/subdoc-guard.md` include) 에 아래 매핑:

| Agent | 템플릿 |
|-------|--------|
| infra-architect / frontend-engineer / backend-engineer / test-engineer / db-architect / release-engineer / sre-engineer | `templates/subdoc-engineer.template.md` |
| market-researcher / customer-segmentation-analyst / seo-analyst / growth-analyst / pricing-analyst / financial-modeler / unit-economics-analyst / finops-analyst / marketing-analytics-analyst / data-analyst | `templates/subdoc-analyst.template.md` |
| security-auditor / code-reviewer / secret-scanner / dependency-analyzer / compliance-auditor / plugin-validator / skill-validator / release-monitor / performance-engineer / qa-engineer / incident-responder | `templates/subdoc-auditor.template.md` |
| ui-designer / copy-writer | `templates/subdoc-designer.template.md` |
| ux-researcher / product-discoverer / product-researcher / product-strategist / prd-writer / backlog-manager | `templates/subdoc-researcher.template.md` |

## 7. 기존 phase 템플릿과의 관계

- `templates/plan.template.md`, `design.template.md`, `do.template.md`, `qa.template.md`, `report.template.md`, `ideation.template.md`, `finance.template.md`, `ops.template.md` — **유지**. 이는 **C-Level main.md** 용.
- v0.57 에서 `plan.template.md` 등을 **인덱스 포맷** 반영하여 업데이트 (sub-plan 01 에서 수행)

## 8. qualifier 사전 정의 (권장)

sub-plan 00 §2.3 에서 "qualifier 남발 방지" 약속. 권장 qualifier:

| qualifier | 용도 | 예시 |
|-----------|------|------|
| `.review` | 리뷰·크리틱 산출물 | `ui-designer.review.md` |
| `.audit` | 심화 감사 | `security-auditor.audit.md` |
| `.bench` | 성능 벤치마크 | `performance-engineer.bench.md` |
| `.draft` | WIP 임시 저장 (release 전 삭제 권장) | `prd-writer.draft.md` |
| `.v2`, `.v3` | 동일 phase 재실행 시 버전 관리 (이력 유지) | `backend-engineer.v2.md` |

## 9. 성공 기준

| # | Criteria | 검증 |
|---|----------|------|
| SC-03-1 | 6 개 템플릿 파일 존재 (subdoc / engineer / analyst / auditor / designer / researcher) | `ls templates/subdoc*.template.md` |
| SC-03-2 | 공통 템플릿이 메타 헤더 4줄 (Author/Phase/Refs/Summary) 포함 | grep |
| SC-03-3 | 특화 템플릿 5종이 Body 섹션에서 공통을 오버라이드 | diff |
| SC-03-4 | `agents/_shared/subdoc-guard.md` 에 agent↔템플릿 매핑표 존재 | grep |

## 10. 리스크

| 리스크 | 완화 |
|--------|------|
| 템플릿 과분화 → 유지보수 부담 | 5 그룹으로 제한. 6번째 그룹 추가는 PR 리뷰 |
| sub-agent 가 템플릿 무시 | doc-validator 가 필수 섹션 (Context/Body/Decisions) 존재 여부 경고 |
| qualifier 남발 | 권장 리스트 (§8) 로 제한. 새 qualifier 추가는 README 업데이트 필수 |

## 11. 다음

sub-plan 04 에서 doc-validator 가 템플릿 섹션 존재 여부 검증.
