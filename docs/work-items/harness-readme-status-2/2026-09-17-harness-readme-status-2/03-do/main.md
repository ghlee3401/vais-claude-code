---
schema: vais-phase/v1
work_item: WI-2026-09-17-harness-readme-status-2
phase: do
revision: 1
status: draft
based_on: []
---

# Do — harness-readme-status-2

## 구현 변경

- REQ-001 `docs/harness/README.md` 상태 표 두 행 교체: 구현 → "로드맵 H1~H8 완료 (4.0.1, 2026-09-17)", 현재 커널 → "모듈 38 · hook 이벤트 5 · 스크립트 6 · CLI 1". 표 아래에 세는 기준 한 줄 추가(모듈은 폴더의 js 파일 수, 이벤트는 hooks.json 최상위 키, 스크립트는 그 파일이 부르는 hooks/*.js 수).
- REQ-002 요약의 "11단계" 와 목차 두 행은 정본과 같아 손대지 않음.
- REQ-003 `CHANGELOG.md` 맨 위에 `## [Unreleased]` · `### Changed` 한 줄. 버전 5 파일(package·config·plugin·marketplace 2곳) 모두 4.0.1 확인.

## 검증 증거

- 모듈 수 `ls lib/workflow/v2` 38개, `hooks/hooks.json` 이벤트 5(SessionStart·UserPromptSubmit·PreToolUse·PostToolUse·Stop)·스크립트 6, CLI 1 을 직접 세어 표와 대조.
- readiness 검사(plugin-validator·test)는 `do ready` 가 실행하고 증거를 남긴다.
- 위임 없음, handoff 없음.
