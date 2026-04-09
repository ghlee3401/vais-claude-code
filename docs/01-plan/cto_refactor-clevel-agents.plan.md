# refactor-clevel-agents - 기술 기획서 (CTO)

> ⛔ **Plan 단계 범위**: 이 문서는 분석과 결정만 기록합니다. 프로덕트 파일 생성·수정은 Do 단계에서 수행하세요.

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 7개 C-Level 에이전트 본문 총 3,450줄, 공통 보일러플레이트 약 650~1,050줄 중복. CEO(696)·CTO(702)는 skill_eval BODY_WARN_LINES=500 초과. |
| **Solution** | **인라인 압축 전용** 전략 — 외부 파일/shared 분리 없이 각 파일 내부에서 공통 문구를 표·펜스·축약으로 재구성. sub-agent 프롬프트 주입 메커니즘 리스크 제거. 모든 변경은 `refactor-audit.js`로 keyword 보존 자동 검증. |
| **Function/UX Effect** | 사용자 관찰 가능한 변화 없음. 각 C-Level 응답 규칙·CP·문서 강제력 100% 동일. |
| **Core Value** | skill_eval WARN 0건, 유지보수 포인트 감소, 규칙 일관성 향상. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | CEO 기획서(`docs/01-plan/ceo_refactor-clevel-agents.plan.md`) CP-1 결정: **B. 표준** 채택 — 7개 파일 모두 <500줄 목표, 문장 rewording 금지. |
| **WHO** | 플러그인 유지보수자 (직접), /vais 사용자 (간접 — 동작 불변). |
| **RISK** | **최상위**: 규칙 keyword·CP ID 손실 → sub-agent 실행 시 강제력 약화. 방지: F7 감사 스크립트 + baseline snapshot. |
| **SUCCESS** | SC-01~SC-07 모두 PASS. 그 중 SC-03(keyword ≥ baseline), SC-04(CP ID 보존), SC-07(핵심 문구 누락 0)이 핵심. |
| **SCOPE** | `agents/{ceo,cpo,cto,cso,cmo,coo,cfo}/{c}.md` 7개 본문만. frontmatter/파일명/경로 **불변**. 하위 실행 에이전트 및 `skills/vais/phases/*.md` 제외. |

---

## 0. 아이디어 개요

### 아이디어 한 줄 설명
> 각 C-Level 파일 내부에서 중복 보일러플레이트를 "표 형식화 + 축약 + 펜스 병합"으로 인라인 압축하고, baseline keyword snapshot 대비 자동 감사로 손실 0건을 보장한다.

### 배경 (왜 필요한지)
- CEO plan이 이미 상위 문제·리스크·옵션을 분석함 → 본 CTO plan은 **기술적 실행 정밀도** 에 집중.
- `cto_cto-plan-prd-consumption.do.md:57`에서 deferred 된 "CP 템플릿 추출" 이슈의 후속.
- skill_eval WARN 상태(CEO 696, CTO 702)는 품질 게이트 통과 실패의 근본 원인.

### 타겟 사용자
- **주요**: 플러그인 유지보수자 (본 리팩터링의 PR 리뷰어 포함)
- **Pain Point**: "규칙 7곳 동시 수정", "압축하면 뭔가 빠질 것 같아 불안"

### 사용자 시나리오
1. **상황**: Do 단계에서 리팩터링 수행 중
2. **행동**: 파일 1개씩 압축 → `node scripts/refactor-audit.js {file}` 실행 → 감사 PASS 시 다음 파일
3. **결과**: 감사 FAIL 시 즉시 해당 파일 git 복원 후 재시도

## 0.5 MVP 범위

### 핵심 기능 (CEO B 옵션)

| # | 기능 | 중요도 | 난이도 | MVP |
|---|------|--------|--------|-----|
| F1 | 공통 보일러플레이트 인라인 압축 | 5 | 2 | Y |
| F2 | 종료 전 문서 체크리스트 표준화 | 4 | 1 | Y |
| F3 | CEO/CTO 고유 섹션 재정비 | 5 | 3 | Y |
| F7 | refactor-audit.js 감사 스크립트 | 5 | 2 | Y |

### 제외 (2차 작업)
- F4 CSO 컴플라이언스 외부 추출
- F5 CMO GTM / CFO 가격책정 / COO CI/CD 외부 추출
- F6 shared/common-rules.md 도입

## 0.6 경쟁/참고 분석
(CEO plan과 동일 — 생략)

## 0.7 PRD 입력 (CTO 전용)

| Key | Value |
|-----|-------|
| PRD 경로 | `docs/01-plan/ceo_refactor-clevel-agents.plan.md` (CEO plan을 PRD analog로 사용) |
| 완성도 | full — 상위 분석 완료 |
| 검사 시각 | 2026-04-08 |

### CEO plan 핵심 결정 (PRD analog)

| # | 결정 | 출처 섹션 |
|---|------|----------|
| 1 | CP-1 옵션 B(표준) 채택 — 7개 파일 <500줄, WARN 0건 | CEO plan "CP-1 결정" |
| 2 | 인라인 압축 전용, 외부 파일 분리 금지 (MVP) | CEO plan 2.2 대안 탐색 |
| 3 | 문장 rewording 금지, 중복 제거·표 형식화만 | CEO plan R4/R9 방지책 |
| 4 | frontmatter/파일 경로 불변 | CEO plan 정책 5.1 |
| 5 | F7 감사로 keyword 보존 자동 검증 | CEO plan F7 |

## 1. 개요

### 1.1 기능 설명
> 7개 C-Level 에이전트 본문을 인라인 압축하여 각 파일 <500줄, skill_eval WARN 0건을 달성하고, refactor-audit.js로 keyword 손실 0건을 자동 검증한다.

### 1.2 목적
- **해결 문제**: 비대화 + 중복 + skill_eval WARN
- **기대 효과**: 870줄 감축(-25%), WARN 해소, 유지보수성 향상
- **대상**: 유지보수자

## 2. Plan-Plus 검증

### 2.1 의도 발견
> CEO plan 2.1과 동일 — "파일 크기"가 아니라 "규칙 일관성 관리 비용"이 본질.

### 2.2 대안 탐색 (기술 관점)

| # | 대안 | 장점 | 단점 | 채택 |
|---|------|------|------|------|
| T1 | 표 형식화 (인라인) | sub-agent 무영향, diff 검증 쉬움 | 세밀한 표현력 손실 | ✅ |
| T2 | HTML 주석 fence (`<!-- @begin:common-rules -->`) 로 섹션 마킹 → 리팩터링 툴 기준 | 향후 추출 용이 | sub-agent 프롬프트엔 노출되지만 의미 없음 (무해) | ✅ 보조 채택 (향후 자동화용) |
| T3 | jscodeshift-like AST 변환 | 재현성 높음 | markdown AST 도구 복잡 | ❌ over-engineering |
| T4 | 수동 편집 + 감사 스크립트 | 단순, 즉시 실행 | 편집자 집중력 요구 | ✅ MVP 방식 |

### 2.3 YAGNI 리뷰
- [x] 필요한 것만: 인라인 압축 + 감사
- [x] 과잉 설계 없음 (AST/빌드 시스템 회피)
- [x] 문장 rewording 금지로 과잉 개입 차단

## 3. 사용자 스토리

| # | As a... | I want to... | So that... |
|---|---------|-------------|------------|
| 1 | 유지보수자 | 한 번의 명령으로 keyword 손실 여부를 확인하고 싶다 | 리팩터링 후 안심할 수 있다 |
| 2 | PR 리뷰어 | 각 파일의 변경이 순수 구조 조정인지 확인하고 싶다 | 의미 변경 리스크를 빠르게 판단할 수 있다 |
| 3 | /vais 사용자 | 리팩터링 후에도 CP·AskUserQuestion 동작이 동일하기를 원한다 | 혼란 없이 기존 워크플로우를 유지할 수 있다 |

## 4. 기능 요구사항

### 4.1 기능 목록 (기술 상세)

| # | 기능 | 관련 파일 | 우선순위 | 상태 |
|---|------|----------|---------|------|
| F1 | 공통 보일러플레이트 인라인 압축 | 7개 `agents/*/c*.md` | Must | 미구현 |
| F2 | 종료 전 문서 체크리스트 표준화 | 7개 | Must | 미구현 |
| F3 | CEO/CTO 고유 섹션 재정비 | `agents/ceo/ceo.md`, `agents/cto/cto.md` | Must | 미구현 |
| F7 | refactor-audit.js | `scripts/refactor-audit.js` (신규) | Must | 미구현 |
| F8 | baseline snapshot (git 기반) | `docs/03-do/ceo_refactor-clevel-agents.baseline.json` | Must | 미구현 |

### 4.2 파일별 Before/After 매핑

#### 📊 현재 baseline (2026-04-08 측정)

| 파일 | 현재 라인 | 목표 | 감축 | 핵심 압축 섹션 |
|------|---------|------|------|--------------|
| ceo.md | 696 | ≤480 | -216 | 서비스 런칭 모드 다이어그램, CP-1/2/Q/R/A 템플릿, 동적 라우팅 예시 |
| cto.md | 702 | ≤490 | -212 | CP-0/1/D/G/2/Q 템플릿 펜스 병합, PDCA 표, QA 리턴 라우팅 |
| cso.md | 485 | ≤400 | -85 | 공통 규칙, CP 템플릿, 법적 체크리스트는 유지 |
| cmo.md | 441 | ≤360 | -81 | 공통 규칙, CP 템플릿 |
| cfo.md | 399 | ≤320 | -79 | 공통 규칙, CP 템플릿 |
| cpo.md | 366 | ≤300 | -66 | 공통 규칙, CP 템플릿 |
| coo.md | 361 | ≤295 | -66 | 공통 규칙, CP 템플릿 |
| **합계** | **3,450** | **≤2,645** | **-805 (-23%)** | |

#### 🎯 공통 압축 패턴 (F1) — 7개 파일 공통 적용

| 섹션 | 현재 (줄수 평균) | 압축 방식 | 목표 (줄수) |
|------|---------------|----------|----------|
| 🚨 최우선 규칙 (AskUserQuestion 강제 + 단계별 실행) | 60 | AskUserQuestion 강제 블록은 1회만 풀 출력, 나머지는 표로 | 30 |
| ⛔ Plan 단계 범위 제한 | 9 | 표 1행 + 원문 1문단 유지 | 6 |
| 필수 문서 | 7 | 표 1행 | 3 |
| ⛔ 체크포인트 기반 멈춤 규칙 | 17 | 헤더 + 1표 + 규칙 4항목 | 12 |
| PDCA 사이클 표 | 20 | 표 병합 | 12 |
| Contract (Input/Output/State) | 12 | 3표 → 1표 | 8 |
| Context Load | 6 | 그대로 유지 | 6 |
| 종료 전 문서 체크리스트 | 13 | 표 유지, 설명 제거 | 9 |
| CTO 핸드오프 (CPO/CSO/CMO/COO/CFO) | 11 | 양식 블록 1회 | 8 |
| 작업 원칙 / Push 규칙 | 15 | 중복 Push 규칙 제거 | 8 |
| **합계 절약/파일** | **170** | | **102** → **-68줄/파일** |

#### 🎯 CEO 고유 섹션 (F3-CEO)

| 섹션 | 현재 | 압축 방식 | 목표 |
|------|------|----------|------|
| 서비스 런칭 모드 — 동적 라우팅 | 140 | ASCII 다이어그램 → Mermaid 1개 or 8줄 리스트, 판단 기준표 유지 | 85 |
| PDCA 사이클 (라우팅/absorb 모드) | 70 | absorb Do 분기 로직 펜스 압축 | 45 |
| Checkpoint CP-1/2/Q/R/A 템플릿 | 200 | 각 CP의 "출력 템플릿 코드펜스" 를 표 + 1 예시로 | 135 |
| Full-Auto 모드 | 25 | 판정 기준표 유지, 서술 축약 | 15 |
| **합계** | 435 | | **280** → **-155줄** |

**CEO 목표 검증**: 696 − 68(공통) − 155(고유) = **473** ≤ 480 ✅

#### 🎯 CTO 고유 섹션 (F3-CTO)

| 섹션 | 현재 | 압축 방식 | 목표 |
|------|------|----------|------|
| CP-0/1/D/G1~G4/2/Q 템플릿 펜스 | 260 | 7개 CP 템플릿 코드펜스 → 공통 헤더 + CP별 table row + 1 예시만 펜스 | 160 |
| PDCA 사이클 — 기술 도메인 | 45 | 에이전트 위임 규칙 표 유지, 수정 요청 체이닝 축약 | 30 |
| Gate 판정 시스템 (Gate 1~4) | 35 | 표로 병합 | 20 |
| Interface Contract 예시 | 25 | 예시 1개만 유지 | 12 |
| 데이터 분석 역량 (SQL/Cohort/A/B) | 45 | SDK 링크 + 요약 표 | 18 |
| **합계** | 410 | | **240** → **-170줄** |

**CTO 목표 검증**: 702 − 68(공통) − 170(고유) = **464** ≤ 490 ✅

#### 🎯 CPO/CSO/CMO/COO/CFO (F1+F2만 적용)

- 각 파일 현재 - 68줄(공통 압축) = 목표 달성
- CSO: 485 - 85 = 400 ✅ (공통 68 + Gate 분기표 축약 17)
- CMO: 441 - 81 = 360 ✅ (공통 68 + GTM 서술 축약 13)
- CFO: 399 - 79 = 320 ✅ (공통 68 + 가격책정 서술 축약 11)
- CPO: 366 - 66 = 300 ✅ (공통 68 반올림)
- COO: 361 - 66 = 295 ✅ (공통 68 반올림)

### 4.3 F7. refactor-audit.js 스펙

#### 입력
- 명령어: `node scripts/refactor-audit.js [--file agents/ceo/ceo.md] [--all]`
- `--all`: 7개 파일 전부
- `--baseline <path>`: baseline snapshot 경로 (기본 `docs/03-do/ceo_refactor-clevel-agents.baseline.json`)

#### 동작
1. **baseline 생성 모드** (`--init`):
   - `git show HEAD:agents/{c}/{c}.md` 로 pre-refactor 스냅샷 읽기
   - 각 파일별로 다음 지표 수집 → JSON으로 저장
2. **검증 모드** (기본):
   - 현재 working tree 파일 읽기
   - 동일 지표 수집
   - baseline과 비교, 모든 조건 충족 시 exit 0, 아니면 exit 1

#### 수집 지표 (파일별)

| 지표 | 수집 방법 | 검증 규칙 |
|------|---------|----------|
| `lines` | `body.split("\n").length` (frontmatter 제외) | `current ≤ 500` AND `current ≤ target_per_file` |
| `frontmatter_hash` | sha256(frontmatter YAML) | `current === baseline` (불변) |
| `cp_ids` | `[...content.matchAll(/CP-[A-Z0-9]+/g)]` set | `current_set ⊇ baseline_set` (전부 포함) |
| `keyword_counts` | 아래 whitelist 각각 grep count | `current[k] ≥ baseline[k]` for all k |
| `section_headers` | `/^##+ .+$/gm` match | `baseline의 mandatory 섹션 set ⊆ current` |
| `mandatory_phrases` | 각 파일에 최소 1회 이상 등장해야 하는 문장 | all present |

#### Keyword Whitelist (Baseline 2026-04-08 측정)

| Keyword | CEO | CPO | CTO | CSO | CMO | COO | CFO | 규칙 |
|---------|-----|-----|-----|-----|-----|-----|-----|------|
| `AskUserQuestion` | 19 | 6 | 19 | 7 | 6 | 6 | 6 | `≥ baseline` |
| `반드시` | 10 | 5 | 8 | 6 | 4 | 4 | 5 | `≥ baseline` |
| `절대 금지`\|`절대금지` | 4 | 1 | 4 | 1 | 1 | 1 | 1 | `≥ baseline` |
| `Plan 단계 범위` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | `= 1` |
| `필수 문서` | 3 | 3 | 3 | 3 | 3 | 3 | 3 | `≥ 3` |
| `체크포인트` | ≥1 | ≥1 | ≥1 | ≥1 | ≥1 | ≥1 | ≥1 | `≥ 1` |
| `SubagentStop` | ≥1 | ≥1 | ≥1 | ≥1 | ≥1 | ≥1 | ≥1 | `≥ 1` |
| `\| \`plan\` \|` (phase 표) | 1 | 1 | 1 | 1 | 1 | 1 | 1 | `= 1` |

#### CP ID Whitelist (Baseline 2026-04-08)

| 파일 | CP IDs (보존 필수) |
|------|------------------|
| ceo.md | CP-1, CP-2, CP-A, CP-L1, CP-L2, CP-L3, CP-Q, CP-R |
| cpo.md | CP-1, CP-2, CP-P, CP-Q |
| cto.md | CP-0, CP-1, CP-2, CP-D, CP-G, CP-G1, CP-Q |
| cso.md | CP-1, CP-2, CP-C, CP-Q |
| cmo.md | CP-1, CP-2, CP-C, CP-Q, CP-S |
| coo.md | CP-1, CP-2, CP-Q |
| cfo.md | CP-1, CP-2, CP-Q |

#### Mandatory 섹션 헤더 Whitelist (7개 공통)
- `## 🚨 최우선 규칙` (또는 동일 제목 variant)
- `### 단계별 실행 모드`
- `### ⛔ Plan 단계 범위 제한`
- `### 필수 문서`
- `## Role`
- `## ⛔ 체크포인트 기반 멈춤 규칙`
- `## Contract`
- `## Checkpoint`
- `## Context Load`
- `## ⛔ 종료 전 필수 문서 체크리스트`
- `## 작업 원칙`

#### 출력
```
[refactor-audit] agents/ceo/ceo.md
  lines: 473 ≤ 480 ✓
  frontmatter: unchanged ✓
  CP IDs: 8/8 preserved ✓
  keywords: 8/8 ≥ baseline ✓
  sections: 11/11 preserved ✓
  phrases: OK ✓
  RESULT: PASS
...
[refactor-audit] ALL: 7/7 PASS
```

- FAIL 시 누락 항목 상세 출력 + `exit 1`

### 4.4 F8. Baseline Snapshot 생성

- Do 단계 첫 작업: `node scripts/refactor-audit.js --init --baseline docs/03-do/ceo_refactor-clevel-agents.baseline.json`
- 이 시점 HEAD commit의 7개 파일 지표 저장
- Do 진행 중 Edit 후 `--check` 로 비교

### 4.5 실행 순서 (Do 단계)

리스크가 낮은 파일부터 → 검증 후 다음 → 마지막에 CEO/CTO:

| 순서 | 파일 | 이유 |
|------|------|------|
| 1 | COO (361→295) | 가장 짧고 고유 로직 적음 → 공통 압축 검증 |
| 2 | CPO (366→300) | 구조 단순 |
| 3 | CFO (399→320) | 가격책정 프레임워크 보존 주의 |
| 4 | CMO (441→360) | GTM 프레임워크 보존 |
| 5 | CSO (485→400) | Gate A/B/C + 법적 체크리스트 보존 주의 |
| 6 | **CEO (696→473)** | 서비스 런칭 모드 고유 압축 (고위험) |
| 7 | **CTO (702→464)** | CP 템플릿 병합 (최고위험) |

각 파일 완료 시:
1. `node scripts/refactor-audit.js --file {path}` 실행
2. PASS → 다음 파일
3. FAIL → `git checkout HEAD -- {path}` 로 롤백 후 재시도

## 5. 정책 정의

### 5.1 비즈니스 규칙 (기술 제약)

| # | 정책 | 규칙 | 근거 |
|---|------|------|------|
| 1 | frontmatter 불변 | sha256 동일 | CLAUDE.md "Do NOT" |
| 2 | 파일 경로 불변 | `agents/{c}/{c}.md` 유지 | skills/phases 로더 |
| 3 | CP ID 전부 보존 | baseline ⊆ current | 기존 동작 |
| 4 | keyword 출현 횟수 | baseline 이상 | F7 감사 |
| 5 | 본문 라인 수 | ≤ 500 (skill_eval WARN) AND ≤ 파일별 target | SC-01 |
| 6 | 외부 파일 의존 금지 | Read/include 없음 | sub-agent 리스크 |
| 7 | **문장 rewording 금지** | 의미 있는 문장은 원문 그대로 복붙. 표/펜스/bullet 재배치만 | R4/R9 |
| 8 | CP 템플릿 출력 예시 | CTO는 7개 CP 중 **최소 1개**는 full 펜스 유지 (나머지는 표+참고) | 사용자가 실행 시 형식 예시 필요 |
| 9 | 배포 승인 등 게이트 키워드 | gate-check.js 매칭 문자열 보존 | CI 안정성 |

### 5.3 유효성 검증 규칙

| 필드 | 규칙 | 에러 시 |
|------|------|---------|
| 라인 수 | ≤ target | 재압축 |
| frontmatter sha256 | baseline 일치 | 복원 |
| CP ID set | baseline ⊆ current | 복원 |
| keyword counts | baseline 이하면 FAIL | 복원 |
| mandatory section | baseline 누락 시 FAIL | 복원 |

## 6. 비기능 요구사항

| 항목 | 요구사항 | 기준 |
|------|---------|------|
| 품질 | skill_eval WARN/FAIL 0건 | `python3 -m scripts.skill_eval.quick_validate agents/*/c*.md` |
| 호환성 | /vais 명령어 regression 0 | smoke: `/vais ceo plan smoke-test`, `/vais cto plan smoke-test`, `/vais cso qa smoke-test` |
| 재현성 | refactor-audit.js는 idempotent | 같은 입력 → 같은 출력 |
| 실행 시간 | 감사 스크립트 ≤ 2초 | Node 실행 기준 |

## Success Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | 7개 파일 모두 본문 ≤ 파일별 target AND ≤ 500 | `wc -l agents/*/c*.md` + target table |
| SC-02 | skill_eval 전부 PASS (WARN 0건) | `quick_validate.py` exit 0 + 출력 로그 |
| SC-03 | keyword whitelist 전부 baseline 이상 | `refactor-audit.js --all` PASS |
| SC-04 | CP ID 전부 보존 | same |
| SC-05 | frontmatter sha256 불변 | same |
| SC-06 | smoke 회귀 3건 정상 | 수동 테스트 로그 `docs/04-qa/` |
| SC-07 | mandatory section/phrase 전부 보존 | `refactor-audit.js` section check |
| SC-08 | 3개 smoke 실행 시 응답에 AskUserQuestion 도구 호출 흔적 존재 | QA 단계 수동 기록 |
| SC-09 | `gate-check.js` 매칭 패턴 ("배포 승인" 등) 보존 | grep + gate-check dry-run |

## Impact Analysis

### Changed Resources

| Resource | Type | Change |
|----------|------|--------|
| `agents/ceo/ceo.md` | modify | 696 → ~473줄 |
| `agents/cpo/cpo.md` | modify | 366 → ~300줄 |
| `agents/cto/cto.md` | modify | 702 → ~464줄 |
| `agents/cso/cso.md` | modify | 485 → ~400줄 |
| `agents/cmo/cmo.md` | modify | 441 → ~360줄 |
| `agents/coo/coo.md` | modify | 361 → ~295줄 |
| `agents/cfo/cfo.md` | modify | 399 → ~320줄 |
| `scripts/refactor-audit.js` | create | 감사 스크립트 (Node CJS) |
| `docs/03-do/ceo_refactor-clevel-agents.baseline.json` | create | Baseline snapshot |
| `docs/03-do/cto_refactor-clevel-agents.do.md` | create | Do 단계 실행 로그 |

### Current Consumers (사이드 이펙트 — CEO plan 상속)

CEO plan "Current Consumers" 표 및 R1~R10 리스크 매트릭스를 **그대로 상속**합니다. 기술 레이어에서 추가 확인된 consumer:

| Resource | 추가 확인 | 조치 |
|----------|---------|------|
| `scripts/skill_eval/quick_validate.py:49` | `BODY_WARN_LINES = 500`, `BODY_FAIL_LINES = 800` 확인 | target <500 설정으로 해소 |
| `scripts/vais-validate-plugin.js:295` | description 500자 (frontmatter만) | 무영향 (frontmatter 불변) |
| `scripts/gate-check.js:179` | `/배포\s*승인\s*여부/i` 정규식 매칭 — cso.md "배포 승인 여부" 섹션 의존 | **CSO 리팩터링 시 해당 섹션 헤더 문자열 보존 필수** (SC-09) |
| `.claude/settings.local.json:88-89` | cpo.md 특정 섹션 grep 허용 목록에 `^### Push 규칙` 등장 | Push 규칙 섹션 헤더 문자열 보존 |

### Verification
- [x] 모든 consumer 확인 완료 (CEO plan 10개 + CTO plan 추가 4개)
- [x] breaking change 없음 (target, whitelist, sha256, gate-check 키워드 모두 고정)
- [x] 롤백 전략 (파일당 git checkout) 명시

## 7. 기술 스택

| 영역 | 기술 | 이유 |
|------|------|------|
| 감사 스크립트 | Node.js CJS (lib/*.js 와 동일 스타일) | 기존 scripts/*.js 일관성 |
| 해싱 | `crypto.createHash('sha256')` | frontmatter 불변 검증 |
| 파싱 | 단순 string split + regex | markdown AST 불필요 |
| 회귀 테스트 | 수동 `/vais` 3건 smoke | e2e 자동화는 과잉 |

## 8. 화면 목록
(N/A)

## 데이터 모델 개요

### baseline.json 스키마
```json
{
  "generated_at": "2026-04-08T00:00:00Z",
  "git_sha": "<HEAD SHA>",
  "files": {
    "agents/ceo/ceo.md": {
      "lines": 696,
      "frontmatter_sha256": "...",
      "cp_ids": ["CP-1","CP-2","CP-A","CP-L1","CP-L2","CP-L3","CP-Q","CP-R"],
      "keyword_counts": {"AskUserQuestion": 19, "반드시": 10, ...},
      "section_headers": ["## Role", "## Checkpoint", ...],
      "mandatory_phrases": {"AskUserQuestion 도구를 호출": 7}
    }
  },
  "targets": {"agents/ceo/ceo.md": 480, "agents/cto/cto.md": 490, ...}
}
```

## API 엔드포인트
(N/A)

## 9. 일정 (예상)

| 단계 | 산출물 |
|------|--------|
| Plan (CTO) | 본 문서 — **현재** |
| Design (CTO) | (선택) refactor-audit.js 아키텍처 다이어그램, 파일별 섹션 이동 맵 시각화. 본 plan이 충분히 상세하면 Design은 CP-D에서 간소화 가능 |
| Do (CTO) | baseline 생성 → 파일 순차 압축 → F7 감사 → do 문서 |
| QA (CTO) | SC-01~SC-09 검증 + smoke 3건 + skill_eval 실행 |
| Report (CTO) | 감축 수치, 변경 요약, 2차 작업 권고 |

> 다음 단계: `/vais cto design refactor-clevel-agents`

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-08 | 초기 작성 — CEO plan 기반 기술 실행 정밀화 |
