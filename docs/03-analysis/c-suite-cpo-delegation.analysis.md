# Gap Analysis: c-suite-cpo-delegation

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | PM 역할이 CTO에 혼재, CMO/CSO 인라인 로직 과다 → 역할 경계 불명확 |
| WHO | vais 사용자, C-Suite 에이전트, sub-agent들 |
| RISK | CMO/CSO가 너무 얇아져 컨텍스트 손실 가능성. 파일 수 증가 |
| SUCCESS | SC-01: CPO PRD 생성 + CTO 전달. SC-02: CMO→seo 위임. SC-03: CSO→sub-agent 위임. SC-04: 레거시 완전 제거 |
| SCOPE | agents/, skills/vais/phases/, skills/vais/SKILL.md, 삭제 대상 3곳 |

---

## 분석 일자: 2026-04-01

---

## 1. Structural Match (구조적 일치)

| 항목 | 상태 | 비고 |
|------|------|------|
| `agents/cpo.md` 신규 생성 | ✅ | v1.0.0, CPO 역할 완전 구현 |
| `agents/seo.md` 신규 생성 | ✅ | CMO sub-agent |
| `agents/security.md` 신규 생성 | ✅ | CSO Gate A sub-agent |
| `agents/validate-plugin.md` 신규 생성 | ✅ | CSO Gate B sub-agent |
| `agents/cfo.md` 신규 생성 | ✅ | stub, v0.1.0 |
| `agents/coo.md` 신규 생성 | ✅ | stub, v0.1.0 |
| `skills/vais/phases/cpo.md` 신규 생성 | ✅ | Query/Command 모드 분기 |
| `skills/vais/phases/cfo.md` 신규 생성 | ✅ | stub |
| `skills/vais/phases/coo.md` 신규 생성 | ✅ | stub |
| `skills/vais-seo/` 삭제 | ✅ | 폴더 전체 제거 |
| `skills/vais-validate-plugin/` 삭제 | ✅ | 폴더 전체 제거 |
| `skills/vais/phases/manager.md` 삭제 | ✅ | 레거시 제거 |
| `skills/vais/phases/auto.md` 삭제 | ✅ | 레거시 제거 |

**Structural Score: 13/13 → 100%**

---

## 2. Functional Depth (기능적 완성도)

| 항목 | 상태 | 비고 |
|------|------|------|
| CMO v2.0.0 — seo sub-agent 위임 | ✅ | `Agent 도구로 **seo** sub-agent 호출` |
| CSO v2.0.0 — security sub-agent 위임 (Gate A) | ✅ | `Agent 도구로 **security** sub-agent 호출` |
| CSO v2.0.0 — validate-plugin sub-agent 위임 (Gate B) | ✅ | 플러그인 배포 검증 분리 |
| CEO — CPO/CFO/COO 위임 테이블 추가 | ✅ | 위임 규칙 표에 3개 항목 추가 |
| SKILL.md — cpo/cfo/coo 액션 추가 | ✅ | 액션 목록 + 체이닝 예시 |
| SKILL.md — manager/auto deprecated 행 제거 | ✅ | 레거시 제거 완료 |
| Stop hooks 수정 (`${CLAUDE_PLUGIN_ROOT:-$(pwd)}`) | ✅ | 전체 6개 에이전트 일괄 수정 |
| SC-01: CPO PRD 생성 + CTO 전달 | ✅ | cpo.md + `ceo:cpo:cto` 체이닝 |
| SC-02: CMO→seo 위임 | ✅ | CMO 2단계에서 seo agent 호출 |
| SC-03: CSO→sub-agent 위임 | ✅ | Gate A/B 각각 sub-agent 분리 |
| SC-04: 레거시 완전 제거 | ✅ | phases + standalone skills 삭제 |

**Functional Score: 11/11 → 100%**

---

## 3. API Contract (인터페이스 계약)

| 계약 | 상태 | 비고 |
|------|------|------|
| CMO → seo: 키워드/타깃 전달 | ✅ | 1단계 마케팅 컨텍스트 → seo agent 입력 |
| CSO → security: feature + API 경로 전달 | ✅ | 보안 감사 요청 포맷 정의 |
| CSO → validate-plugin: package.json + plugin.json 경로 | ✅ | 검증 요청 포맷 정의 |
| CEO → CPO: 전략 컨텍스트 전달 | ✅ | `ceo:cpo:cto` 체이닝 3단계 |
| Sub-agent 단방향 의존 (sub-agent ↛ C-level) | ✅ | 설계 원칙 준수 확인 |

**Contract Score: 5/5 → 100%**

---

## 4. 비고 사항 (설계 범위 외)

| 항목 | 상태 | 판정 |
|------|------|------|
| `agents/manager.md` 존재 | ⚠️ | 설계 범위 밖 — 삭제 대상으로 명시 안 됨 |

`agents/manager.md`는 이미 내부적으로 `⚠️ DEPRECATED: manager는 cto로 대체되었습니다`로 표시되어 있으며, 자동 라우팅 agent로 동작. 이번 설계 문서에서 명시적 삭제 대상이 아니었으므로 Gap으로 분류하지 않음. 향후 정리 작업 시 제거 권장.

---

## 5. Match Rate

| 축 | 점수 | 가중치 | 기여 |
|----|------|--------|------|
| Structural | 100% | 0.20 | 20.0 |
| Functional | 100% | 0.40 | 40.0 |
| Contract | 100% | 0.40 | 40.0 |

**Overall Match Rate: 100%** ✅

> Static analysis only (서버 없음). 런타임 검증 생략.

---

## 6. Gap 목록

| ID | 심각도 | 항목 | 상태 |
|----|--------|------|------|
| — | — | 발견된 Gap 없음 | ✅ |

---

## 7. 성공 기준 최종 상태

| 기준 | 상태 | 근거 |
|------|------|------|
| SC-01: CPO PRD 생성 + CTO 전달 | ✅ 충족 | `agents/cpo.md` + `ceo:cpo:cto` 체이닝 구현 |
| SC-02: CMO→seo 위임 | ✅ 충족 | `agents/cmo.md` v2.0.0 — seo sub-agent 호출 |
| SC-03: CSO→sub-agent 위임 | ✅ 충족 | `agents/cso.md` v2.0.0 — security/validate-plugin 분리 |
| SC-04: 레거시 완전 제거 | ✅ 충족 | 4개 파일/폴더 삭제 확인 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-01 | 초기 Gap 분석 — 100% Match Rate |
