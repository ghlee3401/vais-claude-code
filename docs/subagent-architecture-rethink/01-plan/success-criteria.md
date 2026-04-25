---
owner: cpo
topic: success-criteria
phase: plan
feature: subagent-architecture-rethink
---

# Topic: 성공 기준 (SC-01~07)

> 각 기준은 QA 단계에서 ✅ Met / ⚠️ Partial / ❌ Not Met 평가.

## SC-01. Project Profile 작동

| 항목 | 값 |
|------|---|
| Criterion | ideation 종료 시 `docs/{feature}/00-ideation/project-profile.yaml` 자동 생성 + C-Level 진입 시 자동 로드 |
| Verification | (a) ideation-guard hook 코드 존재 + (b) 임의 신규 피처 ideation 종료 후 yaml 파일 존재 + (c) `lib/project-profile.js` 가 모든 C-Level Context Load에 추가됨 |
| Threshold | 3개 모두 통과 |

## SC-02. Template metadata schema 적용

| 항목 | 값 |
|------|---|
| Criterion | MVP 25개 산출물 template 모두 frontmatter `execution.policy` 명시 + 정책 매핑 (A/B/C/D) 일치 |
| Verification | `scripts/template-validator.js` 신규 추가 → 25개 template 일괄 검증 → 모든 항목 pass |
| Threshold | 25/25 통과 |

## SC-03. Default-execute anti-pattern 해소

| 항목 | 값 |
|------|---|
| Criterion | 의심 6 sub-agent (release-engineer 5분해 + infra-architect / test-engineer / seo-analyst / finops-analyst / compliance-auditor) 호출 시, Profile 조건 미충족 산출물은 자동 skip + skip 사유 리포트 |
| Verification | 통합 테스트: 6개 시나리오 (각 sub-agent 호출 + 의도적으로 Profile 조건 위배 → skip 발생 확인) |
| Threshold | 6/6 시나리오 통과 |

## SC-04. 산출물 카탈로그 25개 (c) 깊이 작성

| 항목 | 값 |
|------|---|
| Criterion | 우선순위 25개 template 모두 (c)=sample+checklist+anti-pattern 깊이로 작성 |
| Verification | (a) 각 template `## (작성된 sample)` 섹션 존재 + 100자 이상 + (b) `## 작성 체크리스트` 5+ 항목 + (c) `## ⚠ Anti-pattern` 3+ 항목 |
| Threshold | 25/25 모두 3가지 섹션 충족 |

## SC-05. release-engineer 5분해 완료

| 항목 | 값 |
|------|---|
| Criterion | release-notes-writer / ci-cd-configurator / container-config-author / migration-planner / runbook-author 5개 sub-agent 정의 + 각자 산출물 template + 기존 release-engineer는 deprecate alias로 1 phase 유지 |
| Verification | (a) `agents/coo/{name}.md` 5개 존재 + frontmatter `description` 80자 이상 + (b) 각 산출물 template SC-04 충족 + (c) `agents/coo/release-engineer.md` 가 deprecate notice 포함 |
| Threshold | 모두 충족 |

## SC-06. Value Proposition Canvas 재매핑

| 항목 | 값 |
|------|---|
| Criterion | Value Proposition Canvas template의 `owner_agent`가 `copy-writer`에서 `product-strategist`로 변경 + copy-writer 정의에서 VPC 책임 제거 + product-strategist 정의에 VPC 책임 추가 |
| Verification | (a) VPC template frontmatter 검증 + (b) 두 sub-agent md 파일에서 grep |
| Threshold | 3개 모두 변경됨 |

## SC-07. CPO PRD 8개 섹션 완성도

| 항목 | 값 |
|------|---|
| Criterion | Do phase에서 작성될 `docs/subagent-architecture-rethink/03-do/main.md` PRD가 8개 섹션 모두 80자+ 충족 (auto-judge designCompleteness ≥ 80) |
| Verification | `lib/auto-judge.js` 가 PRD 파싱 → designCompleteness 메트릭 ≥ 80 |
| Threshold | designCompleteness ≥ 80 |

## SC-08. 카탈로그 50+ 전체 (c) 깊이 (확장 범위 C 추가)

| 항목 | 값 |
|------|---|
| Criterion | 산출물 카탈로그 전체 50개 template 모두 (c) 깊이 |
| Verification | template-validator → 50/50 통과 |
| Threshold | 50/50 |

## SC-09. 44 sub-agent 전체 점검 완료 (확장 범위 C 추가)

| 항목 | 값 |
|------|---|
| Criterion | 44개 sub-agent 모두 4기준(Q-A 산출물 명확성 / Q-B default-execute / Q-C 묶음 적정성 / Q-D 매핑 정합성) 점검 + 결과 매트릭스 문서화 |
| Verification | `docs/subagent-architecture-rethink/04-qa/subagent-audit-matrix.md` 작성됨 + 44 행 모두 채워짐 |
| Threshold | 44/44 점검 |

## SC-10. Alignment 메커니즘 + ux-researcher 외부 인터뷰 (확장 범위 C 추가)

| 항목 | 값 |
|------|---|
| Criterion | (a) auto-judge α(자동 일관성 검증) + β(alignment 산출물 schema) 구현 + (b) ux-researcher 외부 인터뷰 5~7명 + Profile schema 검증 리포트 |
| Verification | (a) `lib/auto-judge.js` alignment 메트릭 추가 + alignment 산출물 template 3개(core-why / why-what / what-how) + (b) `docs/subagent-architecture-rethink/02-design/user-interviews.md` 작성 + Profile 변수 1개 이상 사용자 피드백 반영 |
| Threshold | a 2/2 + b 충족 |

## 종합 통과 기준

### B 표준 범위 (CP-1에서 B 선택 시)

- **MUST 통과**: SC-01, SC-02, SC-03, SC-05, SC-07 (5개)
- **SHOULD 통과**: SC-04, SC-06 (2개) — 작업량 따라 partial 허용

→ MUST 5/5 + SHOULD 1+/2 = phase 통과.

### C 확장 범위 (CP-1에서 C 선택 — **현재 채택**)

- **MUST 통과**: SC-01, SC-02, SC-03, SC-05, SC-07, SC-09 (6개)
- **SHOULD 통과**: SC-04, SC-06, SC-08, SC-10 (4개)

→ MUST 6/6 + SHOULD 2+/4 = phase 통과. SC-04와 SC-08은 partial 허용 (예: 50개 중 35개 (c) 깊이 = SC-08 partial).

## 큐레이션 기록

| Source | 채택 | 거절 | 병합 | 추가 | 이유 |
|--------|:----:|:----:|:----:|:----:|------|
| Executive Summary SUCCESS | | | ✅ | | SC-01~05를 7개로 확장 |
| ideation Q-3 (Always 적정성) | | | | ✅ | SC-04에 sample/checklist/anti-pattern 3섹션 명시 |
| 잘못된 매핑 (VPC) | | | | ✅ | SC-06 신설 — 재매핑 명시화 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — SC-01~07 |
| v1.1 | 2026-04-25 | CPO 재진입: C 확장 범위 채택 → SC-08(카탈로그 50+) / SC-09(44 sub-agent 전체 점검) / SC-10(alignment + ux-researcher 외부) 추가 + 종합 통과 기준 B/C 분리 |
