---
owner: cpo
topic: release-roadmap
phase: do
feature: subagent-architecture-rethink
authors: [prd-writer]
---

# Topic: Release Roadmap (Sprint 1~14 + 3-Horizon + Go/No-Go)

> Source: `_tmp/prd-writer.md` 섹션 8.

## H1 (Now ~ 약 5개월) — VAIS v1.0 Stable

### Sprint 1~3 — Profile 게이트 작동

| 항목 | 내용 |
|------|------|
| 목표 | F1 완성 — Project Profile 자동 작동 |
| 산출물 | `project-profile.yaml` schema + `lib/project-profile.js` + `hooks/ideation-guard.js` 수정 + 신규 피처 ideation 종료 후 yaml 자동 생성 검증 |
| 완료 기준 | SC-01 통과 + EXP-1 (Profile 게이트 30분 검증) 성공 |

### Sprint 4~6 — Template 우선 25개 1차 (Core + Why)

| 항목 | 내용 |
|------|------|
| 목표 | Core 5 + Why 5 = 10개 template (c) 깊이 + Template metadata schema 작동 |
| 산출물 | `templates/core/*.md` × 5 (Vision/Strategy Kernel/OKR/PR-FAQ/3-Horizon) + `templates/why/*.md` × 5 (PEST/Five Forces/SWOT/JTBD/Persona) + `scripts/template-validator.js` |
| 완료 기준 | SC-02 (10/25 명시) + SC-04 (10/25 c 깊이) — partial |

### Sprint 7~10 — Sub-agent 재정의 + 신설

| 항목 | 내용 |
|------|------|
| 목표 | F4/F5/F6 — release-engineer 5분해 + CEO 4 신설 + roadmap-author 신설 + 44 점검 매트릭스 |
| 산출물 | `agents/coo/*.md` × 5 (release-* 신규) + `agents/ceo/*.md` × 4 (vision-author/strategy-kernel-author/okr-author/pr-faq-author) + `agents/cpo/roadmap-author.md` + `04-qa/subagent-audit-matrix.md` (44행) + `release-engineer.md` deprecate notice |
| 완료 기준 | SC-05 (5분해) + SC-06 (VPC 재매핑) + SC-09 (44/44 점검) |

### Sprint 11~14 — 잔여 25개 + Alignment + 외부 인터뷰

| 항목 | 내용 |
|------|------|
| 목표 | F3 잔여 25 + F7 alignment α+β + ux-researcher 외부 인터뷰 5~7명 |
| 산출물 | `templates/{what,how,biz}/*.md` × 15+ (What 7 / How 11 / 사업·재무 5) + `lib/auto-judge.js` alignment 메트릭 + `templates/alignment/*.md` × 3 (core-why/why-what/what-how) + `02-design/user-interviews.md` 외부 인터뷰 리포트 |
| 완료 기준 | SC-08 (50/50 partial 가능) + SC-10 (alignment + 인터뷰) |

## H2 (1~2년 — H1 완료 후) — VAIS v2.0

**모름의 시스템 처리 레이어** — 선반 보관 항목 도입:

| 항목 | 설명 | 출처 |
|------|------|------|
| Epistemic Contract | C-Level이 자기 지식 한계 명시 (`confidence:` 필드) | D-11 (선반) |
| Uncertainty Reporting | 산출물 `confidence: 0~100` + 사용자에게 transparent | (선반) |
| Absorb 대화 강제 | 외부 reference 흡수 시 사용자 1:1 강제 | 후속 피처 `absorb-conversational` |
| Alignment α+β 운영화 | H1 alignment 검증 결과 반영 + 정확도 향상 | F7 누적 |
| Community Template Registry 초안 | 커뮤니티 기여 template peer-review | H3 준비 |

## H3 (3년+ — 장기) — VAIS Ecosystem

| 항목 | 설명 |
|------|------|
| Community Template Registry | 커뮤니티가 산출물 template 기여 + peer-review + canon_source 검증 |
| Project Profile Marketplace | 업종별 Profile preset (B2B SaaS Series A / 규제 헬스케어 / OSS Plugin 등) |
| VAIS Federation | cross-project 산출물 검색 — 유사 Profile에서 어떤 Lean Canvas 썼나? |
| Enterprise VAIS | 사내 template 레지스트리 + 사내 Profile preset + C-Level agent 커스터마이징 |

## Go/No-Go Gates

| Gate | 조건 | 추가 검증 |
|------|------|---------|
| **Alpha → Beta** (Sprint 6 완료 후) | SC-01 + SC-03 + SC-05 통과 | EXP-1 + EXP-2 |
| **Beta → GA** (Sprint 14 완료 후) | SC-01~07 MUST 6/6 + SHOULD 2+/4 | EXP-3 + EXP-5 |
| **GA → H2** | SC-08~10 SHOULD 추가 충족 + 외부 인터뷰 완료 | H1 사용 데이터 누적 후 결정 |

## 우선순위 매트릭스 (RICE 기반)

| Feature | Reach (사용자) | Impact (1~3) | Confidence (%) | Effort (Sprint) | RICE |
|---------|:--:|:--:|:--:|:--:|:--:|
| F1 Profile schema | 100% (모든 사용자) | 3 | 80% | 3 | 80 |
| F2 Template metadata | 100% | 3 | 90% | 1 | 270 |
| F3 카탈로그 25개 | 90% | 3 | 70% | 6 | 31.5 |
| F4 44 점검 매트릭스 | 100% | 2 | 85% | 4 | 42.5 |
| F5 release 5분해 | 60% (배포 사용자) | 3 | 90% | 2 | 81 |
| F6 신규 sub-agent 5 | 80% | 2 | 80% | 2 | 64 |
| F7 Alignment α+β | 50% | 2 | 60% | 4 | 15 |
| F8 VPC 재매핑 | 30% (CPO 사용자) | 2 | 95% | 0.5 | 114 |

→ 가장 높은 RICE: **F2 (270) > F8 (114) > F5 (81) > F1 (80)**. F2/F8은 빠른 win — Sprint 1 일부에 끼워 넣기. F1/F5는 핵심 — Sprint 1~6 보장.

## 큐레이션 기록

| Source | 채택 | 거절 | 병합 | 추가 | 이유 |
|----|:----:|:----:|:----:|:----:|------|
| Sprint 1~14 분할 | ✅ | | | | 명확한 작업 단위 |
| 3-Horizon (H1/H2/H3) | ✅ | | | | 시간축 시각화 |
| Go/No-Go Gates | ✅ | | | | EXP 추가 검증 명시 |
| **추가** RICE 매트릭스 | | | | ✅ | 우선순위 정량화 — F2 quick win 식별 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 큐레이션 — Sprint + 3-Horizon + Gate + RICE |
