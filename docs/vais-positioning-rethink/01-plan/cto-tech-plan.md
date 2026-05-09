---
owner: cto
artifact: cto-tech-plan
phase: plan
feature: vais-positioning-rethink
---

# CTO Tech Plan — vais-positioning-rethink (v0.66)

> CPO PRD + qa-report 입력으로 작성한 기술 변환 spec. 코드 변경 X (Plan ≠ Do).

## §1. CP-0 PRD 검사 + 템플릿 자동 선택

### CP-0 분기 결과

| 항목 | 결과 |
|------|------|
| PRD 파일 | `docs/vais-positioning-rethink/03-do/prd.md` 존재 (704 줄) |
| 8 표준 섹션 | 8/8 작성 (qa-report §1 PASS) |
| 부록 | 7/7 (qa-report §2 PASS) |
| Quality | **"full"** → 자동 로드, **CP-0 미발동** |

### 템플릿 자동 선택

| 휴리스틱 | 적용 |
|---------|------|
| 변경 surface | hooks/ (M0) + agents/{6 c-level}/knowledge/ (M1) + lib/ + .vais/ + CLAUDE.md + CHANGELOG.md = **10+ 파일, 다중 도메인** |
| 추천 템플릿 | `plan-standard.template.md` (하지만 본 plan 은 plan-standard 보다 cto-tech-plan 단일 spec 으로 통합 — 5 minor 이슈 흡수 효율 우선) |

## §2. Architecture Overview

### M0 Stack (Ideation Continuity)

```
[User turn 입력]
    ↓
[Claude Code assistant turn 생성]
    ↓
[hook: post-assistant-turn] ← 신규 hook (M0-①)
    ↓ LLM 휴리스틱 호출 (turn 내용 → 기록 가치 판단)
    ↓
[lib/fs-utils.js append] → working-notes.md
    ↓ (결정 키워드 감지)
[lib/fs-utils.js Decision Record append] → main.md (M0-②)

[New session start]
    ↓
[hook: session-start] (기존 확장)
    ↓
[lib/memory.js readStatus] → .vais/status.json.ideation.inProgress
    ↓ (true)
[lib/fs-utils.js read working-notes] → 마지막 5 turn 추출
    ↓
[AskUserQuestion: "이전 ideation 계속?"] (M0-④)
```

### M1 Stack (Knowledge Pack Lazy-load)

```
[User: /vais cto plan vais-positioning-rethink]
    ↓
[CEO 7 차원 알고리즘] → activeCLevel = CTO
    ↓
[lib/knowledge-loader.js] ← 신규 (또는 v0.65 Wisdom Split 재활용)
    ↓ scan agents/cto/knowledge/*.md
    ↓ phase=plan, artifact=architecture 매칭 시 로드
    ↓
[CTO agent context 주입] ← H4 가정 검증 대상
    ↓
[CTO 응답: 박제된 framework 기반 답변]
```

## §3. 5 Minor 이슈 흡수 (qa-report §4 → 본 plan)

### 이슈 #1 — Sprint Week 1 부하 재조정

**문제**: PRD Sprint Plan v1 의 Week 1 = M0 5 task + M1 3 task = 8 task. 과부하.

**해결**: Sprint Plan v2 (cto-tech-plan §4) — Week 1 = M0 인프라 + lazy-load PoC (M1 ZERO 박제), Week 2 = M1 첫 3, Week 3 = M1 나머지 3, Week 4 = 검증 + GA.

### 이슈 #2 — M1 6 박제 realism

**문제**: 1 framework × 4 시간 평균 × 6 = 24 시간 작업. 4 주 sprint 다른 작업 (M0 hook, dogfood, GA) 과 함께 가능?

**해결**:
- Tier-1A (Week 2): CEO Rumelt + CPO PRD OJT + CTO Architecture (자기 박제 — 도메인 친숙도 ↑, 빠름)
- Tier-1B (Week 3): CSO OWASP+GDPR + CBO Financial + COO Incident (외부 도메인 — buffer 필요)
- 미완 시 fallback: Tier-1A 만 v0.66, Tier-1B 는 v0.66.1 patch

### 이슈 #3 — H4 lazy-load PoC 우선 처리

**문제**: 7.4 H4 (lazy-load 동작 미검증) 와 7.3 (lazy-load 메커니즘 명시) 충돌. lazy-load 가 안 되면 M1 6 박제 무용지물.

**해결**: §5 PoC Spec 참조. Week 1 D1-D2 에 PoC 전용 작업. PASS → M1 5 박제 GO. FAIL → manual `@include` fallback 즉시 전환 (R-3 완화 전략).

### 이슈 #4 — H5 휴리스틱 검증 표본 부족

**문제**: PRD H5 의 "10 turn 샘플" 부족.

**해결**:
- 본 ideation (turn 1~9) + 본 plan turn 들을 backfill 검증 자료로 활용 — *지금 만든 working-notes 가 LLM 휴리스틱 기준에 맞는가* 후행 점검
- 추가 30+ turn 샘플은 CTO Do phase 의 dogfood 1 피처 (M1 박제 작업 자체) 로 자연 누적
- 즉, 표본 30+ turn 은 *작업 부산물* 로 자연 충족

### 이슈 #5 — 7.3 ↔ 7.4 lazy-load 정합

**문제**: 7.3 Technology 는 "동작 명시", 7.4 H4 는 "미검증" — 모순.

**해결**: 본 cto-tech-plan §2 Architecture 에 명시 — *"v0.65 Wisdom Split 패턴 설계 완료, v0.66 Week 1 PoC 로 동작 검증"*. PRD 자체는 재작성 X (sprint scope 절감).

## §4. Sprint Plan v2 (4 주, Week 분할 재조정)

### Week 1 — M0 인프라 + Lazy-load PoC

| Day | Task | 담당 sub-agent | DoD |
|-----|------|--------------|-----|
| D1-2 | **H4 lazy-load PoC** (§5 spec) | backend-engineer | CEO `rumelt-strategy-kernel.md` minimal stub (300 자) → CEO agent 호출 시 context 주입 확인 |
| D2 | **PoC Gate**: PASS / FAIL 결정 | qa-engineer | PASS → 5 박제 GO. FAIL → manual `@include` fallback 전환 |
| D3 | `.vais/status.json` 스키마 확장 (`ideation.inProgress` 등) | backend-engineer | 스키마 정의 + 읽기/쓰기 단위 테스트 |
| D3-4 | working-notes 자동 append hook (M0-①) | backend-engineer | 10 turn 테스트 → LLM 휴리스틱 품질 확인 |
| D4 | Decision Record append 로직 (M0-②) | backend-engineer | 결정 키워드 감지 → append 동작 확인 |
| D5 | session-start 자동 복원 (M0-④) | backend-engineer | 새 세션에서 5 줄 요약 자동 표시 확인 |
| D5 | "체크포인트" 키워드 (M0-③) Should Have | backend-engineer | 발화 시 부분 정리 출력 + 세션 유지 확인 |

### Week 2 — M1 Tier-1A (도메인 친숙)

| Day | Task | 담당 | DoD |
|-----|------|------|-----|
| D1-2 | M1 CEO `rumelt-strategy-kernel.md` 정식 박제 | CEO 직접 (PoC stub 확장) | OJT 4 요소 통과 + 3000~5000 자 |
| D3-4 | M1 CPO `prd-writing-ojt.md` | CPO 직접 | 4 요소 + 3000~5000 자 |
| D5 | M1 CTO `architecture-decision.md` | CTO 직접 | 4 요소 + 3000~5000 자 |

### Week 3 — M1 Tier-1B (외부 도메인)

| Day | Task | 담당 | DoD |
|-----|------|------|-----|
| D1-2 | M1 CSO `owasp-gdpr-korea.md` | CSO 직접 | 4 요소 + 3000~5000 자, 한국 PIPA 명시 |
| D3-4 | M1 CBO `financial-modeler-3statement.md` | CBO 직접 | 4 요소 + 3000~5000 자, CAC/LTV 수식 |
| D5 | M1 COO `incident-playbook.md` | COO 직접 | 4 요소 + 3000~5000 자, Sev 1~4 |

### Week 4 — 검증 + GA

| Day | Task | 담당 | DoD |
|-----|------|------|-----|
| D1 | dogfood A/B 검증 (KR3) | PO 직접 | vais vs vanilla CC 동일 질문 비교 — 1 회 |
| D2 | AC 13 개 최종 점검 | qa-engineer | 12+/13 통과 (AC-M1-2 주관적 양해) |
| D3 | CLAUDE.md 정체성 1 줄 추가 | CTO | "organization-in-a-box" 문구 grep 확인 |
| D3 | CHANGELOG.md v0.66 entry | release-notes-writer (COO) | Keep a Changelog 6 섹션 형식 |
| D4 | `/vais commit` → v0.66.0 태깅 | COO | git tag + release notes |
| D5 | 후행 작업 (M0 self-application 회복 입증 등) | PO | KR1 측정 (5 분 회복) |

### 미완 시 Fallback Plan

| 시나리오 | Fallback |
|---------|---------|
| Week 1 PoC FAIL | manual `@include` 전환. M1 박제는 *include 지시문 박힌 형태* 로 박제 |
| Week 2 Tier-1A 미완 | Week 3 시작을 D1 → D2 로 1 일 밀고 Tier-1A 잔여 D1 처리 |
| Week 3 Tier-1B 미완 | v0.66 = M0 + Tier-1A 만 GA. Tier-1B 는 v0.66.1 patch. KR2 = "3/6" 으로 partial 측정 |
| Week 4 dogfood 시간 부족 | dogfood A/B 는 v0.66.1 로 미루고 v0.66.0 = "M0 + M1 박제" 만 |

## §5. H4 Lazy-load PoC Spec (Week 1 D1-D2 첫 task)

### 목표

agents/cto/knowledge 의 lazy-load 메커니즘이 **실제로 동작** 하는지 minimal stub 으로 검증. PASS 면 v0.65 Wisdom Split 패턴 그대로 진행. FAIL 면 manual `@include` fallback.

### 절차

```
D1 morning:
1. agents/ceo/knowledge/rumelt-strategy-kernel.md minimal stub 작성 (300 자)
   - frontmatter: owner=ceo, artifact=rumelt-strategy-kernel, phase=knowledge, feature=v0.66
   - 본문: "Rumelt Strategy Kernel = Diagnosis + Guiding Policy + Coherent Actions" 한 줄 + signature 문구 ("RUMELT_KERNEL_LOADED")

2. CEO agent 호출 시 context 주입 확인:
   - /vais ceo plan some-test-feature (가상 피처)
   - CEO 응답에서 "RUMELT_KERNEL_LOADED" signature 검색
   - signature 발견 → lazy-load 동작 확인 (PASS)
   - signature 부재 → manual include 필요 (FAIL)

D1 afternoon:
3. v0.65 Wisdom Split 패턴 코드 위치 확인:
   - agents/{c-level}/knowledge/ scan 어디서 발생?
   - vais.config.json 의 knowledge.lazyLoad 설정 확인
   - lib/ 또는 hooks/ 에서 로드 트리거 확인
4. (FAIL 시) manual @include 패턴 설계:
   - agents/ceo/ceo.md 의 Knowledge Index 섹션에 명시적 "Read knowledge/rumelt-strategy-kernel.md when phase=plan" 같은 지시문
   - sub-agent 가 자체적으로 Read 하는 모델

D2 morning:
5. PoC Gate 평가:
   - PASS → Week 1 D3 부터 M0 hook 작업 진행, M1 박제는 W2 부터
   - FAIL → manual @include fallback 전환. PRD 7.3 ↔ 7.4 정합 갱신 (CTO Do phase 에서)

D2 afternoon: M0 hook 작업 시작
```

### PASS 기준

CEO agent 응답에 `RUMELT_KERNEL_LOADED` signature 가 *사용자 프롬프트 명시 지시 없이* 등장. (즉, agent context 에 자동 주입됐음을 의미.)

### FAIL 시 Action

manual `@include` fallback:
- 각 C-Level agent .md 의 Knowledge Index 섹션에 *명시적 lazy-load 지시문* 추가
- sub-agent 가 phase 진입 시 자체 Read
- 효율은 v0.65 Wisdom Split 보다 낮지만 동작 보장

## §6. Implementation 분해 (Plan ≠ Do — 본 plan 은 spec 만)

### 핵심 원칙

> **CTO Plan 은 spec, Do 는 실행**. 본 plan 에서 코드·hooks·knowledge MD 작성 금지. Do phase 에서 sub-agent 위임.

### Sub-agent 매핑

| 모듈 | sub-agent | Do phase 위임 시기 |
|------|-----------|-------------------|
| H4 lazy-load PoC | backend-engineer + qa-engineer 검증 | Week 1 D1-D2 |
| `.vais/status.json` 스키마 | backend-engineer | Week 1 D3 |
| working-notes hook (M0-①) | backend-engineer | Week 1 D3-D4 |
| Decision Record append (M0-②) | backend-engineer | Week 1 D4 |
| 체크포인트 키워드 (M0-③) | backend-engineer | Week 1 D5 (Should Have) |
| session-start 복원 (M0-④) | backend-engineer | Week 1 D5 |
| M1 6 knowledge 박제 | **각 C-Level 직접** (CEO/CPO/CTO/CSO/CBO/COO) | Week 2~3 |
| CLAUDE.md 정체성 1 줄 | CTO 직접 | Week 4 D3 |
| CHANGELOG.md v0.66 entry | release-notes-writer (COO 위임) | Week 4 D3 |
| dogfood A/B 검증 | PO 직접 (qa-engineer 보조) | Week 4 D1 |

### 의존성

```
H4 PoC ─→ M0 hook (W1 D3+) ─→ M1 박제 (W2+) ─→ dogfood (W4)
   │           │                    │
   │           ↓                    ↓
   │      session-start 복원    M1 cross-review (cross C-Level OJT 4 요소 검증)
   │
   └─ FAIL → manual @include fallback ─→ M1 박제 형식 변경
```

### Plan ≠ Do 명시 영역

본 cto-tech-plan 에서 *코드 변경 0*. 다음만:
- 본 MD 작성
- 01-plan/main.md 의 Decision Record + Artifacts 표 append (CTO 자기 행만)

기타 (hooks/ 신설, lib/knowledge-loader.js, agents/{c-level}/knowledge/ 박제, CLAUDE.md 갱신, CHANGELOG.md 갱신, vais.config.json 변경) 은 **CTO Do phase** 또는 각 C-Level Do phase 에서 처리.

## §7. Plan Gate 자가 점검

| 항목 | 충족 |
|------|------|
| PRD 검사 (CP-0) | ✅ "full" — 자동 로드 |
| 5 minor 이슈 흡수 | ✅ §3 5/5 |
| Sprint Plan v2 (Week 부하 재조정) | ✅ §4 |
| H4 lazy-load PoC spec | ✅ §5 |
| Implementation 분해 + sub-agent 매핑 | ✅ §6 |
| Plan ≠ Do 준수 (코드 변경 0) | ✅ §6 명시 |

→ **6/6 = 100% Plan Gate 통과**. CTO design phase 진입 가능.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-09 | 초기 작성 — CPO PRD + qa-report 입력 기반 CTO 기술 변환 spec. 5 minor 이슈 흡수 + Sprint v2 + H4 PoC + Implementation 분해 |
