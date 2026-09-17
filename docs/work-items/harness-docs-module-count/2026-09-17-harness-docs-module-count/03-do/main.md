---
schema: vais-phase/v1
work_item: WI-2026-09-17-harness-docs-module-count
phase: do
revision: 1
status: draft
based_on: []
---

# Do — harness-docs-module-count

## 구현 변경

- REQ-001 `CLAUDE.md` 34행 "35 모듈:" → "38 모듈:", `ONBOARDING.md` 33행 "(35 모듈)" → "(38 모듈)". 모듈 나열과 흐름도는 그대로.
- REQ-002 `docs/harness/README.md` 기준 줄에서 "최상위 키 수" → "`hooks` 아래 키 수". 문장의 나머지는 그대로.
- REQ-003 `CHANGELOG.md` `[Unreleased]` Changed 에 불릿 1개 추가. 버전 파일은 손대지 않음.

## 검증 증거

- Design 시점 `ls lib/workflow/v2` 38개 재확인 뒤 치환.
- readiness 검사(plugin-validator)는 `do ready` 가 실행해 증거를 남긴다.
- 위임 없음, handoff 없음.
