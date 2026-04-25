---
owner: cpo
topic: cto-handoff
phase: qa
feature: subagent-architecture-rethink
---

# Topic: CTO 핸드오프 컨텍스트 패키지

> CPO → CTO 핸드오프. CTO가 `/vais cto plan subagent-architecture-rethink` 진입 시 즉시 사용 가능한 컨텍스트.

## 1. 핸드오프 메타

| Key | Value |
|-----|-------|
| 요청 C-Level | CPO |
| 피처 | subagent-architecture-rethink |
| 요청 유형 | 구현 요청 (메타-VAIS 리팩터링) |
| 긴급도 | 🟡 중 (사용자 통증 진행 중, but no production outage) |
| 근거 문서 | `docs/subagent-architecture-rethink/03-do/main.md` (PRD) + 3 topic |
| 완료 조건 | MUST SC-01/02/03/05/07/09 + SHOULD 2+/4 (SC-04/06/08/10) |
| 다음 단계 | `/vais cto plan subagent-architecture-rethink` |
| 재검증 | `/vais cpo qa subagent-architecture-rethink` |

## 2. 핵심 문제 (WHY)

표면: "쓸데없이 CI/CD 만든다" (release-engineer)
중간: 44 sub-agent default-execute + 분리 자의성 + template 88% 부재
근본: **모름을 시스템에 내재화하는 프로토콜의 부재**. VAIS가 사용자 지식 거울(mirror)이 아닌 의수(prosthesis)여야 함.

## 3. 타깃 사용자 (WHO)

| 우선 | Persona | 핵심 욕구 |
|:----:|---------|---------|
| 1차 | P1. 솔로 빌더 | "AI가 더 똑똑하길"이 아닌 **"내 프로젝트에 안 맞는 건 안 만들길"** |
| 2차 | P2. 스타트업 CTO | **"팀 표준화 도구"** — 정전 기반 template = team knowledge |
| 3차 | P3. 엔터프라이즈 PM | **"AI 결정 근거 명시"** + `_tmp/` 추적성 |

## 4. 성공 기준 (SUCCESS — MUST 6개)

| SC | 기준 (요약) | 자동/수동 |
|:--:|-----------|:--------:|
| SC-01 | Profile yaml 자동 생성 + Context Load 자동 주입 | 자동 |
| SC-02 | 25개 template `execution.policy` 명시 | 자동 |
| SC-03 | 6 sub-agent 호출 시 Profile 미충족 → 자동 skip | 자동 |
| SC-05 | release-engineer 5분해 완료 | 자동 |
| SC-07 | PRD designCompleteness ≥ 80 | 자동 (현재 통과) |
| SC-09 | 44 sub-agent 4기준 점검 매트릭스 44/44 | 자동+수동 |

## 5. 범위 제한 (OUT_OF_SCOPE)

- Epistemic Contract / Uncertainty Reporting / Absorb 대화 강제 → H2 (1~2년) 별도 피처
- 시스템 게이트 매번 묻기 UX (옵션 i) → 영구 거부

## 6. 기술 핵심 7요소 (CTO plan 작업 항목)

| # | 파일 | 작업 | Sprint |
|:-:|------|------|:------:|
| 1 | `lib/project-profile.js` | **신규** — schema 로드/유효성/scope_conditions 평가/Context Load 주입 | 1~3 |
| 2 | `hooks/ideation-guard.js` | **수정** — ideation 종료 시 Profile 합의 prompt + yaml 저장 | 1~3 |
| 3 | `scripts/template-validator.js` | **신규** — frontmatter schema 검증 + 정책 매핑 | 4~6 |
| 4 | `lib/auto-judge.js` | **수정** — alignment α 메트릭 추가 | 11~14 |
| 5 | `agents/coo/release-engineer.md` | **수정** — deprecate notice | 7~10 |
| 6 | 신규 agent md 7개 | `agents/ceo/` 4 + `agents/cpo/roadmap-author.md` 1 + `agents/coo/release-*.md` 5 = 10개 (release-engineer deprecate 제외 시 7~9) | 7~10 |
| 7 | 신규 template 25개 (우선) → 50개 (전체) | `templates/{core,why,what,how,biz}/` | 4~14 |

## 7. 기술 제약 (Constraints)

| ID | 제약 | 의미 |
|:--:|------|------|
| C-1 | `frontmatter includes[]` Claude Code sub-agent context 런타임 미통합 | v0.57 Option A(블록 복붙 + patch 스크립트) 패턴 유지 |
| C-2 | `scope_conditions` 평가는 단순 dict 비교로 시작 | YAGNI — CEL 파서 불필요 |
| C-3 | alignment α는 키워드 기반 — 의미론적 정확도 한계 | EXP-4에서 70% 감지율 검증 |

## 8. 검증 필요 가정 Top 3 (RA — 즉시 검증 권장)

| RA | 가정 | 리스크 | 검증 |
|:--:|------|:------:|-----|
| RA-1 | Profile 게이트가 실제 통증 해소 | **상** | EXP-1 (30분 — Sprint 1) + EXP-5 외부 인터뷰 (Sprint 11~14) |
| RA-2 | Profile 합의 UX 직관성 | **상** | think-aloud 3명 + T1 시나리오 — Sprint 4 |
| RA-3 | 50+ template 14~22주 실현가능성 | **상** | 5개 파일럿 sprint 측정 — Sprint 1 측정 |

## 9. 우선순위 (RICE)

| Feature | RICE | Sprint |
|---------|:----:|:------:|
| F2 Template metadata | **270** | 1~3 (quick win) |
| F8 VPC 재매핑 | **114** | 4~6 (quick win) |
| F5 release 5분해 | **81** | 7~10 (핵심 통증 해소) |
| F1 Profile schema | **80** | 1~3 (게이트 작동 핵심) |
| F6 신규 sub-agent 5 | 64 | 7~10 |
| F4 44 점검 매트릭스 | 42.5 | 7~10 |
| F3 카탈로그 25 | 31.5 | 4~6 (Core+Why), 11~14 (잔여) |
| F7 Alignment α+β | 15 | 11~14 |

## 10. Gap 4건 (CTO plan에서 보완 권장)

| Gap | 영역 | 권장 |
|-----|------|------|
| **G-1** | 비기능 요구사항 (성능/보안) | CTO plan에서 명시 — Profile 게이트 latency < 50ms / template-validator < 1s / project-profile.yaml secret 차단 |
| **G-2** | 카탈로그 data model | CTO infra-architect — templates/*.md frontmatter scan + `catalog.json` 인덱스 자동 생성 |
| **G-3** | API N/A 명시 | PRD 또는 CTO plan에 한 줄 명시 |
| **G-4** | vais.config.json cSuite 업데이트 | CTO infra-architect Sprint 7 작업 항목 — 신규 7개 sub-agent 등록 |

## 11. CTO 작업 분해 권장 (sprint 단위)

```
Sprint 1~3 (F1 Profile + F2 Template metadata + EXP-1)
├── infra-architect: lib/project-profile.js 신규 (G-1 secret 차단 포함)
├── infra-architect: hooks/ideation-guard.js 수정
├── backend-engineer: scripts/template-validator.js 신규
├── infra-architect: catalog.json 인덱스 빌더 (G-2)
└── EXP-1: Profile 게이트 30분 검증

Sprint 4~6 (F3 Core+Why 10 template + F8 VPC 재매핑 + EXP-2)
├── ui-designer + 도메인 sub-agent: templates/core/*.md × 5
├── ui-designer + market-researcher: templates/why/*.md × 5
├── infra-architect: copy-writer.md + product-strategist.md + VPC template 재매핑
└── EXP-2: depth (c) 품질 검증

Sprint 7~10 (F4 44 점검 + F5 release 5분해 + F6 신규 sub-agent 5 + EXP-3)
├── infra-architect: agents/coo/release-*.md × 5 신설 + release-engineer deprecate
├── infra-architect: agents/ceo/{vision,strategy-kernel,okr,pr-faq}-author.md × 4 신설
├── infra-architect: agents/cpo/roadmap-author.md 신설
├── infra-architect: vais.config.json cSuite 업데이트 (G-4)
├── infra-architect: package.json claude-plugin agents 업데이트
├── infra-architect + 도메인 sub-agent: 04-qa/subagent-audit-matrix.md 44행 작성
└── EXP-3: 44 매트릭스 점검 (2~3시간)

Sprint 11~14 (F3 잔여 25 + F7 Alignment α+β + 외부 인터뷰 + EXP-4 + EXP-5)
├── ui-designer + 도메인: templates/{what,how,biz}/*.md × 15+
├── infra-architect: lib/auto-judge.js alignment α 메트릭 (EXP-4)
├── infra-architect: templates/alignment/{core-why,why-what,what-how}.md × 3
├── ux-researcher: 외부 인터뷰 5~7명 (모집 + 인터뷰 + 분석)
└── EXP-5: 통증 보편성 5명 중 3명+ 검증
```

## 12. 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — CTO 핸드오프 통합 패키지 |
