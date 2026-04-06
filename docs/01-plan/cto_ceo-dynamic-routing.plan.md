# ceo-dynamic-routing - 기획서

> :no_entry: **Plan 단계 범위**: 이 문서는 분석과 결정만 기록합니다. 프로덕트 파일 생성·수정은 Do 단계에서 수행하세요.

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | CEO 런칭 파이프라인이 하드코딩된 순서(CPO→CTO→CSO→CMO→COO→CFO)로 고정되어, 피처 성격에 따른 유연한 실행 순서 조정이 불가능하다 |
| **Solution** | CEO가 피처 성격 + 이전 C-Level 산출물 상태를 분석해 다음 C-Level을 동적으로 판단하고, 사용자에게 추천하는 구조로 전환한다 |
| **Function/UX Effect** | 내부 도구는 CMO 스킵, 보안 중심 피처는 CSO 우선 등 피처 맥락에 맞는 자연스러운 워크플로우 |
| **Core Value** | AI 오케스트레이터의 핵심 가치인 "상황 인지 기반 판단"을 파이프라인 수준으로 확장 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 하드코딩 순서는 모든 피처에 동일한 파이프라인을 강제하여 불필요한 단계 실행이나 부자연스러운 순서를 유발한다 |
| **WHO** | VAIS Code 사용자 (플러그인 개발자, 서비스 기획자) |
| **RISK** | CEO 판단 품질 (잘못된 라우팅), 기존 파이프라인 호환성 깨짐 |
| **SUCCESS** | CEO가 피처 성격에 맞는 C-Level 순서를 추천하고, 사용자가 승인/수정할 수 있다 |
| **SCOPE** | CEO 에이전트 라우팅 로직 + 각 C-Level phase 완료 후 CEO 추천 트리거 |

---

## 0. 아이디어 개요

### 아이디어 한 줄 설명
> CEO가 하드코딩된 파이프라인 대신 피처 성격과 산출물 상태를 기반으로 다음 C-Level을 동적으로 판단하고 사용자에게 추천한다.

### 배경 (왜 필요한지)
- 현재 문제: `vais.config.json`의 `launchPipeline.order: ["cpo", "cto", "cso", "cmo", "coo", "cfo"]`가 모든 피처에 동일하게 적용됨
- 기존 해결책의 한계: 내부 도구인데 CMO 마케팅을 강제 실행, 단순 보안 패치인데 CPO 제품 기획부터 시작하는 등 비효율
- 이 아이디어가 필요한 이유: AI 오케스트레이터가 컨텍스트를 이해하고 판단하는 것이 VAIS의 핵심 가치

### 타겟 사용자
- 주요 사용자: VAIS Code로 서비스 런칭하는 개발자/기획자
- 보조 사용자: 개별 C-Level을 단독 호출하는 사용자
- 사용자의 현재 Pain Point: 불필요한 단계를 수동으로 스킵하거나, 전체 파이프라인 대신 개별 호출로 우회해야 함

### 사용자 시나리오

**시나리오 1: 런칭 파이프라인**
1. 상황: 사용자가 `/vais ceo launch my-feature` 실행
2. 행동: CEO가 피처 분석 후 "제품 정의가 필요합니다. CPO에게 맡기겠습니다." 추천 → 사용자 승인 → CPO 완주 → CEO가 다음 추천
3. 결과: 피처 성격에 맞는 C-Level만 필요한 순서로 실행

**시나리오 2: 개별 C-Level 완료 후**
1. 상황: 사용자가 `/vais cso qa my-feature` 실행, CSO QA 완료
2. 행동: CEO가 자동 개입하여 "보안 통과. COO 배포 준비를 추천합니다." 안내
3. 결과: 사용자가 다음 단계를 직접 결정하되, CEO의 추천을 참고

## 0.5 MVP 범위

### 핵심 기능 브레인스토밍 (중요도/난이도 매트릭스)

| 기능 | 중요도 (1-5) | 난이도 (1-5) | MVP 포함 |
|------|------------|------------|---------|
| CEO 동적 라우팅 판단 로직 (런칭 파이프라인) | 5 | 3 | Y |
| 개별 C-Level 완료 후 CEO 추천 | 5 | 3 | Y |
| 피처 성격 분석 프롬프트 | 5 | 2 | Y |
| vais.config.json launchPipeline 구조 변경 | 4 | 2 | Y |
| 산출물 상태 기반 판단 보강 | 4 | 2 | Y |
| CLAUDE.md / 문서 업데이트 | 3 | 1 | Y |

### MVP 포함 기능
- CEO 에이전트의 동적 라우팅 판단 로직
- 개별 C-Level 완료 후 CEO 추천 트리거
- vais.config.json 구조 변경
- 관련 문서 업데이트

### 이후 버전으로 미룰 기능
- CEO 판단 이력 학습 (memory 기반 패턴 인식)
- 사용자별 선호 파이프라인 프리셋

## 0.6 경쟁/참고 분석

| 서비스 | 유사 기능 | 장점 | 단점 | 차별화 포인트 |
|-------|---------|------|------|------------|
| 현재 VAIS 하드코딩 | 고정 순서 보장 | 예측 가능, 구현 단순 | 유연성 없음 | — |
| GitHub Actions (matrix) | 동적 job 생성 | 조건부 실행 가능 | 선언적, AI 판단 없음 | CEO가 AI 기반으로 판단 |
| CrewAI | 에이전트 간 동적 위임 | 유연한 태스크 라우팅 | 사용자 확인 부재 | User Sovereignty 유지 |

## 1. 개요

### 1.1 기능 설명
> CEO 에이전트가 하드코딩된 파이프라인 순서 대신, 피처 성격과 산출물 상태를 분석하여 다음 C-Level을 동적으로 추천하고, 사용자 승인 후 실행하는 기능

### 1.2 목적
- 해결하려는 문제: 모든 피처에 동일한 고정 파이프라인 적용으로 인한 비효율
- 기대 효과: 피처 맥락에 맞는 최적 워크플로우 자동 구성
- 대상 사용자: VAIS Code 사용자 전체

## 2. Plan-Plus 검증

### 2.1 의도 발견
> CEO가 "오케스트레이터"로서 실질적인 판단 능력을 갖추는 것. 현재는 단순 dispatcher에 가깝다.

### 2.2 대안 탐색
| # | 대안 | 장점 | 단점 | 채택 여부 |
|---|------|------|------|----------|
| 1 | vais.config.json에 피처 타입별 프리셋 정의 | 예측 가능 | 타입 분류 한계, 유연성 부족 | 미채택 |
| 2 | CEO AI 동적 판단 (채택) | 유연, 컨텍스트 인지 | 판단 품질 의존 | **채택** |
| 3 | 사용자가 매번 순서 지정 | 완전한 제어 | UX 부담 큼 | 미채택 |

### 2.3 YAGNI 리뷰
- [x] 현재 필요한 기능만 포함했는가? — 동적 판단 + 추천만, 학습/프리셋은 제외
- [x] 미래 요구사항을 위한 과잉 설계가 없는가? — config에 판단 기준 프레임워크만 제공
- [x] 제거할 수 있는 기능이 있는가? — 없음
- 제거 후보: 없음

## 3. 사용자 스토리

| # | As a... | I want to... | So that... |
|---|---------|-------------|------------|
| 1 | VAIS 사용자 | CEO가 피처에 맞는 다음 C-Level을 추천해주길 | 불필요한 단계를 건너뛰고 효율적으로 진행할 수 있다 |
| 2 | 개별 C-Level 호출자 | C-Level 작업 완료 후 다음에 뭘 할지 안내받길 | 워크플로우를 끊김 없이 이어갈 수 있다 |
| 3 | 서비스 런칭 사용자 | 내부 도구일 때 마케팅(CMO) 단계를 자동으로 스킵하길 | 시간과 컨텍스트를 낭비하지 않는다 |

## 4. 기능 요구사항

### 4.1 기능 목록

| # | 기능 | 설명 | 관련 파일 | 우선순위 | 구현 상태 |
|---|------|------|----------|---------|----------|
| 1 | CEO 동적 라우팅 | 피처 성격 + 산출물 상태 기반 다음 C-Level 판단 | `agents/ceo/ceo.md` | Must | 미구현 |
| 2 | 개별 C-Level 완료 후 추천 | 모든 C-Level phase 완료 시 CEO 추천 트리거 | `skills/vais/phases/c*.md` | Must | 미구현 |
| 3 | 피처 성격 분석 | 피처명 + 컨텍스트에서 성격 추론 (내부도구/사용자서비스/보안패치 등) | `agents/ceo/ceo.md` | Must | 미구현 |
| 4 | 산출물 상태 체크 | docs/ 폴더 스캔으로 어떤 C-Level이 이미 완료했는지 파악 | `agents/ceo/ceo.md` | Must | 미구현 |
| 5 | config 구조 변경 | launchPipeline.order 제거, 동적 판단 관련 설정 추가 | `vais.config.json` | Must | 미구현 |
| 6 | 추천 UX | CEO가 추천 이유 + 선택지를 사용자에게 제시 | `agents/ceo/ceo.md` | Must | 미구현 |

### 4.2 기능 상세

#### F1. CEO 동적 라우팅 판단
- **트리거**: 런칭 파이프라인에서 현재 C-Level 완료 시 / 개별 C-Level 완료 시
- **정상 흐름**:
  1) 피처 성격 분석 (피처명, 사용자 요청 컨텍스트, 기존 산출물)
  2) 산출물 상태 스캔 (`docs/` 폴더에서 `{role}_{feature}.*.md` 존재 여부)
  3) 다음 C-Level 결정 + 이유 생성
  4) 사용자에게 추천 제시 (AskUserQuestion)
- **예외 흐름**: 사용자가 다른 C-Level 선택 → CEO가 그 선택을 수용

#### F2. 개별 C-Level 완료 후 CEO 추천
- **트리거**: 모든 C-Level의 phase 완료 시 (plan, design, do, qa, report 각각)
- **정상 흐름**:
  1) C-Level이 현재 phase 완료
  2) 완료 아웃로에서 CEO 추천 섹션 출력
  3) CEO가 피처 상태를 분석하여 다음 액션 추천
  4) 선택지: [추천 C-Level 진행 / 다른 C-Level 선택 / 현재 C-Level 다음 phase / 종료]
- **예외 흐름**: 사용자가 "종료" 선택 시 추천 없이 종료

#### F3. 피처 성격 분석
- **판단 기준**:
  - 피처명에서 도메인 추론 (예: `security-*` → 보안 중심, `landing-*` → 마케팅 포함)
  - 사용자 요청 컨텍스트 (내부 도구 vs 사용자 서비스)
  - 이미 존재하는 산출물 (CPO PRD가 있으면 제품 기획 불필요)
- **출력**: 추천 C-Level + 이유 (1~2문장)

#### F4. 추천 UX 형식
```
CEO 추천: 다음 단계는 [CSO 보안 검토]입니다.
이유: CTO 구현이 완료되어 보안 검토가 필요합니다. 내부 도구이므로 CMO는 불필요합니다.

선택지:
A. CSO 보안 검토 진행
B. 다른 C-Level 선택 (목록 표시)
C. 종료
```

## 5. 정책 정의

### 5.1 비즈니스 규칙

| # | 정책 | 규칙 | 비고 |
|---|------|------|------|
| 1 | User Sovereignty | CEO 추천은 제안일 뿐, 사용자가 최종 결정 | 기존 원칙 유지 |
| 2 | 완료 C-Level 재추천 금지 | 이미 산출물이 있는 C-Level은 추천에서 제외 (재실행은 사용자 명시적 선택으로만) | 중복 방지 |
| 3 | 핸드오프 우선 | 이슈 기반 핸드오프(CSO→CTO 등)는 일반 추천보다 우선 | 기존 메커니즘 유지 |

### 5.2 권한 정책

해당 없음 (에이전트 간 프로토콜)

### 5.3 유효성 검증 규칙

| 필드 | 타입 | 필수 | 규칙 | 에러 메시지 |
|------|------|------|------|-----------|
| feature | string | Y | kebab-case, 2~4단어 | "피처명을 입력해주세요" |

## 6. 비기능 요구사항

| 항목 | 요구사항 | 기준 |
|------|---------|------|
| 성능 | CEO 판단은 프롬프트 기반이므로 추가 latency 최소화 | 별도 API 호출 없이 에이전트 내 판단 |
| 호환성 | 기존 `/vais cto plan` 등 개별 호출은 그대로 동작 | 기존 동작 깨지지 않음 |
| 확장성 | 새 C-Level 추가 시 CEO 판단 로직에 자동 반영 | config 기반 C-Level 목록 참조 |

## Success Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | CEO가 피처 성격에 따라 서로 다른 C-Level 순서를 추천한다 | 내부 도구 vs 사용자 서비스 피처로 테스트, 추천 순서가 다른지 확인 |
| SC-02 | 개별 C-Level 완료 후 CEO 추천이 항상 출력된다 | `/vais cso qa feature` 완료 시 CEO 추천 섹션 존재 확인 |
| SC-03 | 사용자가 CEO 추천을 거부하고 다른 C-Level을 선택할 수 있다 | "다른 C-Level 선택" 옵션 동작 확인 |
| SC-04 | 기존 하드코딩 파이프라인 순서가 config에서 제거된다 | `launchPipeline.order` 배열 제거 확인 |
| SC-05 | 기존 개별 C-Level 호출(`/vais cto plan`)이 정상 동작한다 | 기존 기능 regression 없음 |

## Impact Analysis

### Changed Resources

| Resource | Type | Change Description |
|----------|------|-------------------|
| `agents/ceo/ceo.md` | modify | 하드코딩 파이프라인 → 동적 라우팅 판단 로직으로 교체 |
| `skills/vais/phases/cto.md` | modify | 완료 아웃로에 CEO 추천 트리거 추가 |
| `skills/vais/phases/cso.md` | modify | 완료 아웃로에 CEO 추천 트리거 추가 |
| `skills/vais/phases/cpo.md` | modify | 완료 아웃로에 CEO 추천 트리거 추가 |
| `skills/vais/phases/cmo.md` | modify | 완료 아웃로에 CEO 추천 트리거 추가 |
| `skills/vais/phases/coo.md` | modify | 완료 아웃로에 CEO 추천 트리거 추가 |
| `skills/vais/phases/cfo.md` | modify | 완료 아웃로에 CEO 추천 트리거 추가 |
| `skills/vais/phases/ceo.md` | modify | 런칭 파이프라인 동적 라우팅 반영 |
| `vais.config.json` | modify | `launchPipeline.order` 제거, CEO 판단 기준 설정 추가 |
| `CLAUDE.md` | modify | 파이프라인 설명 업데이트 |

### Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| `agents/ceo/ceo.md` | Read | CEO 에이전트 실행 시 | 직접 변경 대상 |
| `vais.config.json` | Read | 모든 에이전트 세션 시작 시 | `launchPipeline.order` 참조하는 코드가 있으면 영향 |
| `skills/vais/phases/c*.md` | Read | `/vais {c-level}` 호출 시 | 아웃로 섹션 추가 |
| `skills/vais/SKILL.md` | Read | `/vais` 호출 시 | 아웃로 템플릿에 이미 CEO 추천 가능 |

### Verification
- [x] 모든 consumer 확인 완료
- [x] breaking change 없음 확인 — 개별 호출 동작은 유지, 추천이 추가되는 것뿐

## 7. 기술 스택

| 영역 | 기술 | 이유 |
|------|------|------|
| 에이전트 | Markdown (에이전트 정의) | 기존 에이전트 시스템 |
| 설정 | JSON (vais.config.json) | 기존 설정 시스템 |
| 오케스트레이션 | Claude Code Agent 도구 | 기존 실행 인프라 |

## 8. 변경 파일 목록

| # | 파일 | 변경 내용 | 우선순위 |
|---|------|----------|---------|
| 1 | `agents/ceo/ceo.md` | 동적 라우팅 판단 로직 + 피처 성격 분석 프롬프트 | P0 |
| 2 | `vais.config.json` | `launchPipeline.order` → CEO 판단 기준 설정 | P0 |
| 3 | `skills/vais/phases/c{to,so,po,mo,oo,fo}.md` | 완료 아웃로에 CEO 추천 트리거 | P0 |
| 4 | `skills/vais/phases/ceo.md` | 런칭 파이프라인 동적 모드 반영 | P0 |
| 5 | `CLAUDE.md` | 파이프라인 설명 업데이트 | P1 |

## 9. 일정 (예상)

| 단계 | 산출물 |
|------|--------|
| 기획 | plan 문서 (본 문서) |
| 설계 | CEO 동적 라우팅 판단 프롬프트 구조 설계 |
| 구현 | agents/ceo/ceo.md, vais.config.json, phases/*.md 수정 |
| QA | SC-01~SC-05 검증 |

> 다음 단계: `/vais cto design ceo-dynamic-routing`

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-06 | 초기 작성 — 대화 합의 내용 기반 |
