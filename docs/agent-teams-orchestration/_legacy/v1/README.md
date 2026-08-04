---
owner: cto
artifact: legacy-archive-readme
phase: archive
feature: agent-teams-orchestration
generated: 2026-05-16
summary: "v1 (병렬-생산 후 머지 모델) 산출물 archive. 2026-05-16 사용자 결정으로 v2 (대화-합성 모델) 로 재설계."
---

# agent-teams-orchestration — v1 Archive

본 폴더의 산출물은 **v1 (병렬-생산 후 머지 모델)** 의 plan + design 입니다. 2026-05-16 사용자가 "에이전트끼리 얘기해서 하나의 문서로" 라는 Agent Teams 본래 정신을 반영하는 **v2 (대화-합성 모델)** 로 재설계를 결정함에 따라 archive 됨.

## v1 모델 (이 폴더 산출물)

- 각 C-Level 이 각자 artifact 박제 (tech-plan / ac-verification / security-review / architecture / migration-plan / interface-contract)
- main.md 는 5섹션 인덱스 + append-only Decision Record
- C-Level 간 핸드오프 = 파일 기반
- SendMessage = sub-agent 위임에만 사용
- `clevel-doc-coexistence` v2.1 모델 재사용

## v2 모델 (현재 채택)

- 도메인 리드 (phase별 가변: plan=CPO, 설계=CTO, 보안=CSO 등) 가 conversation 주재
- 다른 C-Level 들과 SendMessage 로 토론
- Lazy Consensus 종료 (draft → N턴 이의 없으면 통과)
- 산출물 = `main.md` (합성문) + `decisions-log.md` (타임라인)

## 보존 사유

- git history 보존 (실제로는 v1 미커밋이라 archive 로 대체)
- 향후 retrospective / 모델 비교 자료
- v1 의 8 위협 / 5 SC / 패턴 D worktree 설계는 v2 에 부분 재활용 가능

## 참조 금지

- v2 작업 시 v1 main.md 의 Decision Record 인용 금지 (스키마 다름)
- 새 PR 에서 v1 파일 수정 금지
