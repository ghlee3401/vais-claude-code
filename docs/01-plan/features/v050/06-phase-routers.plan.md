# Sub-plan 06 — Phase Routers

> 상위: `../v050-full-overhaul.plan.md`
> 선행: 01, 02, 05
> 후행: 07, 08

---

## 0. 목적

`/vais {c-level} {phase} {feature}` 명령이 실제로 알맞은 sub-agent 조합을 호출하도록 **phase 라우터**를 갱신한다.

핵심 변경:
1. **CBO 라우터 신설** (`skills/vais/phases/cbo.md`)
2. **CEO 라우터 재작성** — 동적 라우팅 + ideation 분기 + 10+1 시나리오 매핑
3. **plan 스킬 확장** — `docs/00-ideation/` 자동 참조
4. **CTO/CSO/COO 라우터 부분 갱신** — 신규/이동 sub-agent 반영
5. **SKILL.md 진입점** — 6 C-Level + ideation 진입점 등록
6. CMO/CFO 라우터는 **이 sub-plan에서는 삭제하지 않음** (sub-plan 08에서 삭제). 단 SKILL.md 진입점에서 더 이상 참조 X.

---

## 1. 변경 파일

```
skills/vais/
├── SKILL.md                           # 진입점 전면 갱신
├── phases/
│   ├── ceo.md                         # 동적 라우팅 + ideation 분기 + 시나리오 매핑
│   ├── cpo.md                         # backlog-manager 추가
│   ├── cto.md                         # release-engineer/performance-engineer 제거
│   ├── cso.md                         # secret-scanner/dependency-analyzer 추가
│   ├── cbo.md                         # 신규
│   ├── coo.md                         # release-engineer/performance-engineer 추가, technical-writer 제거
│   └── plan.md                        # ideation 자동 참조 로직
│   (cmo.md / cfo.md 는 08에서 삭제 — 여기서는 참조만 끊음)
```

---

## 2. SKILL.md 진입점

### 2.1 현재 vs v0.50

**현재** (v0.49.2):
```
/vais {ceo|cpo|cto|cso|cmo|coo|cfo} {plan|design|do|qa|report} {feature}
/vais commit, /vais help, /vais next, ...
```

**v0.50**:
```
/vais {ceo|cpo|cto|cso|cbo|coo} {plan|design|do|qa|report} {feature}
/vais {c-level} ideation [topic]            # Phase 0 진입
/vais ideation [topic]                       # CEO 기본 ideation 라우팅
/vais commit, /vais help, /vais next, ...
```

### 2.2 SKILL.md 본문 변경 포인트
- 지원 C-Level 목록에서 cmo/cfo 삭제, cbo 추가
- 지원 phase 목록에 ideation 추가 (optional 명시)
- 자동 트리거(auto-routing) 키워드 섹션에서 cmo/cfo 관련 키워드 → cbo로 통합
- 예시 명령 섹션 갱신

---

## 3. CEO 라우터 (`skills/vais/phases/ceo.md`)

### 3.1 동적 라우팅 의사결정 트리

```
사용자 입력 분석
├── 키워드/의도 분류 → 시나리오 매핑 (S-1 ~ S-10, S-0)
├── 기존 산출물 스캔 (docs/01-plan, docs/00-ideation, .vais/features/)
└── 선행 완료 C-Level 체크 (dependencies 검증)

→ 추천 C-Level + phase
→ AskUserQuestion (CP-2a, CP-3b)
→ 승인 시 해당 phase 라우터 호출 또는 skill 체인
```

### 3.2 시나리오 매핑 (csuite-scenarios-v2 기반)

| 시나리오 ID | 트리거 | 권장 흐름 |
|-------------|--------|-----------|
| S-0 | 아이디어 모호, 탐색 필요 | CEO ideation → 추천 C-Level |
| S-1 | "새 SaaS", "신규 서비스 풀 개발" | CBO(market)→CPO→CTO→CSO→CBO(GTM)→COO |
| S-2 | "기능 추가", "기존 서비스 확장" | CPO→CTO→CSO→COO |
| S-3 | "버그", "UX 개선", "리팩터" | 3 branches (bug/UX/refactor) |
| S-4 | "장애", "프로덕션 이슈" | CTO(incident-responder)→CSO→COO |
| S-5 | "최적화", "느림", "비용 절감" | perf branch (CTO) or cost branch (CBO) |
| S-6 | "보안 감사", "컴플라이언스" | CSO↔CTO 루프 (max 3 iterations) |
| S-7 | "마케팅 캠페인", "GTM" | CPO→CBO→(CTO) |
| S-8 | "시장 분석", "사업 분석", "IR" | CBO→(CPO) |
| S-9 | "skill 만들기", "agent 추가", "흡수" | CEO(skill-creator)→CSO |
| S-10 | "정기 운영", "기술부채" | CTO or COO |

### 3.3 Ideation 분기

- 진입: `/vais ceo ideation {topic}` 또는 `/vais ideation {topic}`
- 위임: `skills/vais/phases/ideation.md` 호출 (CEO 페르소나로 대화)
- 종료 루틴에서 다음 C-Level 추천 생성 (sub-plan 05 §4)
- 승인 시 `skills/vais/phases/{추천 c-level}.md`의 plan 핸들러로 자동 전환

### 3.4 자동화 레벨과 연동 (L0~L4)
- **L0 Manual**: 추천만, 사용자가 직접 명령 입력
- **L1 Semi**: 추천 + AskUserQuestion → 승인 시 전환
- **L2 (default)**: L1과 동일, 체크포인트에서 중단 가능
- **L3 Auto**: 명백한 의존성 기반 진행 (예: plan 완료 → design 자동)
- **L4 Full Auto**: S-10 등 반복 작업 full-auto, 최종 리뷰만 확인

---

## 4. CBO 라우터 (`skills/vais/phases/cbo.md`)

### 4.1 Frontmatter
```yaml
---
name: cbo
phase-router: true
c-level: cbo
version: 0.50.0
subAgents: [market-researcher, customer-segmentation-analyst, seo-analyst, copy-writer, growth-analyst, pricing-analyst, financial-modeler, unit-economics-analyst, finops-analyst, marketing-analytics-analyst]
---
```

### 4.2 Phase 핸들러 로직

| Phase | 기본 sub-agent 호출 |
|-------|---------------------|
| plan | market-researcher + customer-segmentation-analyst (병렬) |
| design | growth-analyst + copy-writer + pricing-analyst + financial-modeler (병렬) |
| do | seo-analyst + copy-writer + finops-analyst + unit-economics-analyst + marketing-analytics-analyst (병렬) |
| qa | CBO 본체가 unit-economics / marketing-analytics / financial-modeler 결과 검증 |
| report | CBO가 투자자/팀 발표용 통합 리포트 |

### 4.3 Sub-agent 필터링
- CEO가 "CBO design — pricing-analyst만" 같은 선택적 위임 시 `{selected: [pricing-analyst]}` 컨텍스트를 respect
- 기본은 위 매트릭스, 필터 있으면 교집합

---

## 5. CPO / CTO / CSO / COO 라우터 갱신

### 5.1 `phases/cpo.md`
- Design phase에서 `prd-writer` 완료 후 `backlog-manager` 체인 호출 (PRD → user stories)
- sub-agent 목록 업데이트

### 5.2 `phases/cto.md`
- sub-agent 목록에서 `release-engineer`, `performance-engineer` 제거
- "배포 관련은 COO 라우터로 넘김" 주석

### 5.3 `phases/cso.md`
- Do phase: `security-auditor` + `code-reviewer` + `secret-scanner` + `dependency-analyzer` 병렬
- QA phase: CSO 본체가 4개 결과 통합 + severity 분류
- S-6 (보안 감사) 시 CSO↔CTO 3회 iteration 루프 오케스트레이션 코드

### 5.4 `phases/coo.md`
- sub-agent 추가: release-engineer, performance-engineer
- technical-writer 제거
- Plan: 배포 전략 결정 / Design: CI/CD 아키텍처 / Do: release-engineer + performance-engineer 병렬 / QA: 스테이징 검증

---

## 6. plan 스킬 ideation 자동 참조 (`phases/plan.md`)

### 6.1 로직
```
/vais {role} plan {topic} 진입 시:
  ideation_path = `docs/00-ideation/{role}_{topic}.md`
  if exists(ideation_path):
    parse 4 sections (Key Points / Decisions / Open Questions / Next Step)
    주입: plan 시스템 프롬프트에 "See prior ideation:" 블록 포함
    이벤트: `plan_referenced_ideation` 기록
  else:
    기존 흐름 그대로 (SC-12)
```

### 6.2 파싱 규약
- 4 섹션 헤더가 h2 (`## Key Points` 등)
- 각 섹션 본문 그대로 주입 (가공 최소화, LLM이 판단)
- 파일 존재하지만 4 섹션 미충족 → warn 후 "ideation 없음" 처리 (폴백 안전장치, Risk 대응)

---

## 7. CMO/CFO 라우터 처리

- 파일 존재는 유지 (08에서 삭제)
- SKILL.md 진입점 테이블에서 `cmo`, `cfo` 행 **삭제**
- CEO 라우터 시나리오 매핑에서 cmo/cfo 참조 **삭제** → 모두 cbo로 대체
- 단기 호환을 위해 `phases/cmo.md`에 안내 한 줄 추가: "v0.50부터 CBO로 통합되었습니다. `/vais cbo ...`를 사용하세요." (08 삭제 전까지 가드)

---

## 8. 진입 시 신경 쓸 점

### 8.1 선행에서 보장됨
- 01/02로 모든 agent markdown 존재
- 05로 ideation phase 라우터 + template + 경로 확정

### 8.2 다음으로 넘길 보증
- 모든 phase 라우터가 v0.50 sub-agent 집합과 100% 일치
- CEO 라우터가 10+1 시나리오 매핑 내장
- plan 스킬이 `docs/00-ideation/{role}_{topic}.md` 자동 참조
- SKILL.md에서 cmo/cfo 진입점 제거 완료

### 8.3 함정
- **라우팅에서 CMO/CFO 참조 누락 1건도 남기지 말 것**: 시나리오 테이블, auto-trigger 키워드, 예시 명령 모두 스캔.
- **CBO의 design phase 4-agent 병렬 vs 순차**: `growth-analyst`가 pricing 결과를 참조해야 하는 경우 있음. 완전 병렬 대신 "(pricing-analyst → growth-analyst) + (copy-writer → growth-analyst)" DAG가 맞을 수 있음. 본 sub-plan은 단순 병렬로 시작, 실 운영 피드백 후 `design` DAG 최적화.
- **ideation 참조 파싱 실패 시 폴백**: 파일이 있지만 형식 이상(사용자가 직접 편집 등) → 에러 내지 말고 "ideation 파싱 실패, 무시" 로그 후 기본 plan 흐름.
- **SKILL.md 자동 트리거 키워드 충돌**: "마케팅"은 CPO(브랜딩) / CBO(GTM) 양쪽 모두 가능 → CEO 라우터에서 disambiguation. SKILL.md 레벨에서는 CEO로 위임.
- **라우터 markdown의 `subAgents` 배열이 frontmatter와 config와 agent 본체 세 곳에서 매칭**: 한 곳이라도 틀어지면 호출 실패. 09에서 일관성 테스트 추가.

---

## 9. 검증

- [ ] `skills/vais/phases/cbo.md` 존재 + 10 sub-agent 참조
- [ ] `grep -c "cmo\|cfo" skills/vais/SKILL.md` == 0 (cmo.md 내부 안내 메시지 제외)
- [ ] `/vais cbo plan test-market-analysis` 실행 → market-researcher + customer-segmentation-analyst 호출
- [ ] 수동: `docs/00-ideation/cpo_test.md` 생성 후 `/vais cpo plan test` → plan이 ideation 내용 참조 확인 (SC-10)
- [ ] 수동: `/vais ceo ideation test-s0` → CEO ideation → 종료 시 AskUserQuestion + 자동 전환 (SC-11)
- [ ] `/vais cpo plan nonexistent-topic` 실행 (ideation 없이) → 기존과 동일 동작 (SC-12)
- [ ] CEO 라우터 시나리오 매핑 10+1 개 모두 문서화

연결 SC: **SC-10, SC-11, SC-12, SC-21**

---

## 10. 다음 단계

- **07** Harness Gates — phase 라우터가 호출하는 sub-agent의 종료 시점에 gate 발동
