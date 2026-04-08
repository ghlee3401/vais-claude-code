# ncai-add-absorb - 기획서

> ⛔ **Plan 단계 범위**: 이 문서는 분석과 결정만 기록합니다. 프로덕트 파일 생성·수정은 Do 단계에서 수행하세요.

## Executive Summary

| Perspective | Content |
|---|---|
| **Problem** | vais-code의 `design.template.md`는 IA/UX 중심이라 CTO design 단계에서 백엔드 기술 결정·API 계약·레이어 책임이 명문화되지 않고 do 단계로 미뤄진다 |
| **Solution** | 외부 레퍼런스(`references/ncai-add`)의 TRD/SDD 패턴에서 진짜 갭만 압축 흡수 — 표 형식 ~25줄 추가 + 기존 design.template 다이어트. 흡수 산출물에는 회사명/출처 미포함, **빈 양식 흡수**로 범용성 유지 |
| **Function/UX Effect** | CTO design 산출물이 backend-engineer가 즉흥 결정 없이 구현 가능한 수준의 명확성을 갖춤 |
| **Core Value** | 과한 흡수(SRD/PRD 중복) 회피하면서 진짜 갭만 메움. 5단계 phase 구조 유지 |

---

## Context Anchor

| Key | Value |
|---|---|
| **WHY** | CTO design phase가 UX 중심이어서 백엔드 결정 모호성이 do 단계로 흘러감 |
| **WHO** | CTO + 하위 backend-engineer/frontend-engineer/qa-engineer |
| **RISK** | design.template 비대화 / 비-CTO C-Level의 불필요한 부담 / 기존 plan 문서 호환성 / 흡수 산출물에 외부 회사명 유출 / 특정 기술 스택 강요로 범용성 훼손 |
| **SUCCESS** | design.template 순증 ≤15줄 + CTO 외 C-Level은 1줄 N/A로 스킵 가능 + 기존 design 산출물 마이그레이션 불필요 + 회사명/출처 0건 + 빈 양식(스택 미강요) |
| **SCOPE** | `templates/design.template.md` 단일 파일 확장. 외부 레퍼런스의 SRD/PRD/문서 흐름 전체는 흡수하지 않음 |

---

## 0. 아이디어 개요

### 아이디어 한 줄 설명
> ncai-add 번들의 TRD §3 + SDD §4-6 중 vais-code design.template에 없는 핵심만 표 형식으로 압축 흡수한다.

### 배경
- **현재 문제**: `design.template.md` (286줄)는 Architecture Options + IA + 사이트맵 + 네비게이션 + 와이어프레임 등 프론트/UX 중심. 백엔드 CTO 입장에서 design이 끝나도 다음이 미정 — 기술 스택 락, API 계약, Router/Service/Repo 책임, 도입 금지 기술
- **기존 해결책의 한계**: do 단계에서 backend-engineer가 즉흥 결정. CTO 의도와 어긋날 위험. plan→design→do 사이의 design 산출물이 "구현 직전 모호성 제거" 역할을 못함
- **이 아이디어가 필요한 이유**: ncai-add가 이 갭을 정확히 다루는 TRD/SDD 템플릿을 갖고 있고, 표 형식으로 압축하면 부피 부담 없이 흡수 가능

### 타겟 사용자
- **주요**: CTO (design phase 호출 시)
- **보조**: backend-engineer/frontend-engineer (design 산출물 소비 시)
- **Pain Point**: design 문서 읽어도 무엇을 빌드할지 명확하지 않음 → do 단계 즉흥 결정

---

## 0.5 MVP 범위

### 핵심 기능 매트릭스

| 기능 | 중요도 | 난이도 | MVP 포함 |
|---|---|---|---|
| design.template에 Part 4 (Tech Stack Lock) 표 추가 | 5 | 1 | Y |
| design.template에 Part 5 (Implementation Contract) 표 추가 | 5 | 1 | Y |
| Tech Stack Lock 표에 "금지" 컬럼 추가 (TRD §8 흡수) | 4 | 1 | Y |
| "CTO 전용" 시각 격리 박스 + N/A 패턴 | 4 | 1 | Y |
| 기존 design.template 다이어트 (Architecture Options 산문 → 표) | 3 | 2 | Y |
| 기존 design.template 다이어트 (네비/사이트맵 통합) | 3 | 2 | Y |
| ncai SRD 흡수 | 1 | - | N (plan.template가 더 풍부) |
| ncai PRD 흡수 | 1 | - | N (CPO plan/design/do 흐름이 대체) |
| 별도 cto-design.template 신설 | 2 | 3 | N (옵션 B — 라우팅 복잡도) |
| ncai 별 phase 신설 (detail-design) | 1 | 4 | N (v0.15.0 6단계 결정과 충돌) |
| skill_frontend / skill_deploy / skill_nano_oidc 흡수 | - | - | N (별도 번들 트랙) |

### MVP 포함 (Do 단계 작업)
1. `templates/design.template.md`에 **Part 4: Tech Stack Lock** 추가 (~10줄, 표 1개)
2. `templates/design.template.md`에 **Part 5: Implementation Contract** 추가 (~15줄, 표 2개 + 선택 상태머신 마커)
3. CTO 외 C-Level용 "(N/A — CTO 전용)" 격리 박스 추가 (plan.template §0.7과 동일 패턴)
4. 기존 design.template 다이어트:
   - Architecture Options A/B/C 산문 → 비교 표 1개 + 선택 행으로 압축 (~-15줄)
   - 1.2 네비게이션 + 1.3 사이트맵 중복 통합 (~-10줄)
5. 변경 이력 표 갱신 (v1.x → v1.x+1)

### 이후 버전으로 미룰 기능
- ncai의 plan.json (Epic > Ticket > Task 분해 + Eval 게이트) — 별도 plan 문서로 분리, 흡수 여부 별도 결정
- skill_frontend (디자인 시스템 14 가이드) — 별도 번들 트랙, vais-ncai-frontend 신규 플러그인 검토
- skill_deploy / skill_nano_oidc — NCP 종속이라 vais-code 핵심 흡수 부적합

---

## 0.6 경쟁/참고 분석

| 항목 | ncai-add 방식 | vais-code 기존 | 흡수 결정 |
|---|---|---|---|
| 문서 분류 축 | 문서 타입(SRD/PRD/TRD/SDD) | phase(plan/design/do/qa/report) | vais 방식 유지 — phase 축 손대지 않음 |
| 기획 서술 | SRD 32줄, PRD 58줄 | plan.template 291줄 (MVP 매트릭스 + 경쟁 분석 + Context Anchor 포함) | vais 우월 — SRD/PRD 흡수 X |
| 백엔드 기술 결정 | TRD §3 (Lang/FW/DB/ORM/Cache + 금지) | 없음 | **갭 — Part 4로 흡수** |
| API 계약 | SDD §6 (endpoint/req/res/error) | 없음 | **갭 — Part 5로 흡수** |
| 레이어 책임 | SDD §4 (Router/Service/Repo) | 없음 | **갭 — Part 5로 흡수** |
| 상태 머신 | SDD §8 | 없음 | 선택 마커만 (도메인 있을 때만) |
| Eval 게이트 | plan.mdc 3-Layer + execute.mdc 4-Layer | qa-engineer gap 분석 (90% 기준) | 별도 결정 — 본 plan 범위 외 |

---

## 0.7 PRD 입력 (CTO 전용)

> 본 plan은 CEO가 직접 호출하므로 CPO PRD 선행 없음. **강행 모드**로 진행.

| Key | Value |
|---|---|
| PRD 경로 | 없음 (강행 모드 — CEO 직접 plan) |
| 완성도 | N/A |
| 검사 시각 | 2026-04-08 |

---

## 1. 결정 사항

### 1.1 흡수 방식: 옵션 A-Lean (압축 + 다이어트)

| 항목 | 결정 |
|---|---|
| 추가 위치 | `templates/design.template.md` 단일 파일 |
| 추가 섹션 | Part 4 (Tech Stack Lock) + Part 5 (Implementation Contract) |
| 형식 | **표 위주, 산문 금지** |
| **빈 양식 흡수 원칙** | **특정 기술 스택을 강요하지 않음**. 표 셀은 비어 있고, CTO가 feature마다 design 단계에서 채움 |
| **회사명/출처 비공개 원칙** | 흡수 산출물(template, CHANGELOG, 커밋 메시지, 코드 주석)에는 외부 회사명·제품명 0건. 출처 추적은 본 plan 문서에만 한정 |
| CTO 외 C-Level 처리 | "(N/A — CTO 전용)" 1줄 + 시각 격리 박스 (plan.template §0.7 패턴 재사용) |
| 다이어트 동시 진행 | Architecture Options 산문 → 표, 네비/사이트맵 통합 |
| 순증 줄수 목표 | **≤15줄** (286 → 290~300) |

### 1.1.1 빈 양식 흡수의 의미

**Tech Stack Lock은 "기술 강요"가 아니라 "결정의 양식화"입니다.**

| 잘못된 흡수 방식 | 올바른 흡수 방식 (채택) |
|---|---|
| `Backend: FastAPI` 고정 | `Backend: {Lang/Framework/DB/ORM}` 빈 셀 |
| 모든 사용자가 같은 스택 강요 | 사용자/프로젝트마다 다른 스택 자유 |
| 외부 회사 선호 스택 노출 | 범용 플러그인 정체성 유지 |

→ vais-code는 **"design 단계에서 백엔드 스택을 명시적으로 결정해야 한다"는 규율**만 강제하고, **"무엇을 결정할지는 강제하지 않습니다"**. React든 Vue든 FastAPI든 Spring이든 자유. CTO가 매 feature마다 채웁니다.

(향후 옵션, Ocean) 프로젝트 단위 기본 스택을 `vais.config.json > project.defaultStack` 같은 곳에 1회 선언 → design.template이 "default + override" 2단으로 채워지는 방식. **본 plan 범위 외**, 별도 plan으로 분리.

### 1.2 명시적 흡수 제외

| 항목 | 제외 이유 |
|---|---|
| ncai SRD 전체 | plan.template (291줄)가 이미 더 풍부 — 0. 아이디어 + 0.5 MVP + 0.6 경쟁 분석이 SRD를 상회 |
| ncai PRD 전체 | CPO plan/design/do 흐름 + prd-writer 에이전트가 동적으로 PRD 생산. 정적 템플릿 중복 불필요 |
| TRD §6 (API 원칙), §9 (완료 기준) | 부수적 — Part 4/5 표만으로 충분 |
| SDD §1 (개요), §10 (구현 메모) | 부수적 — phase 헤더가 이미 같은 역할 |
| Part 6 (Out-of-Scope) 별도 섹션 | Tech Stack Lock 표의 "금지" 컬럼에 흡수해 절약 |
| 별도 cto-design.template 신설 (옵션 B) | 라우팅 분기 복잡도 + 매트릭스 비대화 |
| detail-design phase 신설 (옵션 C) | v0.15.0의 9→6 단계 축소 결정과 충돌 |
| skill_frontend / skill_deploy / skill_nano_oidc | NCP 종속 또는 별도 번들 트랙 — 본 plan 범위 외 |

### 1.3 Do 단계 산출물

| 파일 | 변경 | 예상 줄수 |
|---|---|---|
| `templates/design.template.md` | Part 4/5 추가 + Architecture Options 다이어트 + 네비/사이트맵 통합 + 변경 이력 갱신 | 286 → 290~300 (+4~14) |
| `CHANGELOG.md` | v0.48.2 엔트리 추가 ("Tech Stack Lock + Implementation Contract 섹션 추가" 식으로 기능 중심 표기, 외부 회사명 미포함) | +5~8줄 |
| (버전 범프 5곳) | package.json / vais.config.json / CLAUDE.md / README.md | 각 1줄 |

### 1.4 회사명/출처 미포함 가드 (Do 단계 검증)

Do 단계 종료 전 다음 명령으로 검증:

```bash
grep -i "ncai\|nano\|ncsoft" templates/design.template.md CHANGELOG.md
# → 0건이어야 함
```

스테이징 직전 `git diff --cached`에도 회사명 검사. 1건이라도 발견되면 do 미완료.

---

## 2. Risk & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| design.template 비대화 | Med | Med | 표 형식 강제 + 다이어트 동시 진행 + 순증 ≤15줄 가드 |
| CTO 외 C-Level 사용자 혼란 | Low | Med | "(N/A — CTO 전용)" 시각 격리 박스 + plan.template §0.7 동일 패턴 학습 비용 0 |
| 기존 design 산출물(`docs/02-design/*.design.md`) 호환성 | Low | Low | Part 4/5는 신규 추가 섹션이라 기존 문서는 빈 채로도 valid. 마이그레이션 불필요 |
| 외부 자산(plan.json/skills) 추가 흡수 압력 | Med | Low | 본 plan에서 명시적 제외 + 별도 plan 문서로 분리 처리 |
| 흡수 후 사용자 입력 부담 증가 | Med | Med | 빈 셀 허용 규칙 — 해당 없으면 빈 셀 그대로 두는 것 허용 |
| **외부 회사명/제품명 흡수 산출물 유출** | **Med** | **High** | **Do 단계 종료 전 grep 가드 + Success Criteria 체크 항목 + CHANGELOG 기능 중심 표기** |
| **특정 기술 스택을 강요해 범용성 훼손** | **Med** | **High** | **빈 양식 원칙 — 표 셀은 비어 있고 사용자가 매번 채움. 어떤 스택도 default로 명시 X** |

---

## 3. Success Criteria

- [ ] `templates/design.template.md`가 290~300줄 이내
- [ ] Part 4 (Tech Stack Lock) 표에 backend/frontend/auth 3행 + 금지 컬럼 포함
- [ ] **Part 4 표 셀은 모두 빈 양식 (`{Lang/Framework/...}` 플레이스홀더)** — 특정 기술 명시 0건
- [ ] Part 5 (Implementation Contract) 표에 Router/Service/Repository 3행 + API Contract 표 포함
- [ ] 비-CTO C-Level용 "(N/A — CTO 전용)" 격리 박스 존재
- [ ] Architecture Options 섹션 다이어트 적용 (산문 → 비교 표)
- [ ] 네비게이션 + 사이트맵 섹션 통합
- [ ] 기존 `docs/02-design/*.design.md` 산출물 영향 없음 (Part 4/5는 빈 셀 허용)
- [ ] 변경 이력 표 갱신
- [ ] CHANGELOG + 5곳 버전 범프 (v0.48.2)
- [ ] **`grep -i "ncai\|nano\|ncsoft" templates/design.template.md CHANGELOG.md` → 0건**
- [ ] **CHANGELOG 엔트리가 외부 회사명/제품명 미포함, 기능 중심 표기**
- [ ] **커밋 메시지에 외부 회사명/제품명 미포함**

---

## 4. Out of Scope (Lake vs Ocean)

### Lake (이번 plan에서 처리)
- design.template Part 4/5 추가
- Architecture Options + 네비/사이트맵 다이어트
- 시각 격리 박스 패턴 적용

### Ocean (별도 plan 필요)
- ncai plan.json (Epic > Ticket > Task) 흡수
- ncai 3/4-Layer Eval 게이트 → qa-engineer 통합
- skill_frontend 별도 번들화 (vais-ncai-frontend 플러그인 신설)
- skill_deploy / skill_nano_oidc NCP 전용 번들
- CPO prd-writer 에이전트와 ncai PRD 구조 통합 검토
- design phase 전반 다이어트(현재 286줄 자체가 부담스럽다는 일반 판단)

---

## 5. Open Questions

1. Part 5의 API Contract 표는 design 단계에서 완전 채움이 필수인가, 아니면 "확정된 endpoint만" 채우는 부분 채움 허용인가? → **부분 채움 허용 권장 (do 단계 보강)**
2. Tech Stack Lock의 "금지" 컬럼이 비어 있어도 valid한가? → **예 — 금지 사항 없으면 빈 셀 OK**
3. State Machine 마커는 별도 섹션인가, Part 5 내부 하위 항목인가? → **Part 5 내부 하위 항목 (선택, 없으면 N/A)**

---

## 변경 이력

| version | date | change |
|---|---|---|
| v1.0 | 2026-04-08 | 초기 작성 — TRD/SDD 패턴 압축 흡수 + design.template 다이어트 결정 |
| v1.1 | 2026-04-08 | 사용자 검토 반영 — (1) 흡수 산출물 회사명/출처 0건 가드 추가 (§1.4 grep 검증 + Risk 2건 + Success Criteria 3항목), (2) 빈 양식 흡수 원칙 §1.1.1 신설 — Tech Stack Lock은 결정 강요가 아닌 결정 양식. 사용자별 스택 자유 |
