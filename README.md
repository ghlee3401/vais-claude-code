<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.1-blue?style=flat-square" alt="version" />
  <img src="https://img.shields.io/badge/Claude_Code-plugin-7C3AED?style=flat-square" alt="Claude Code Plugin" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT" />
</p>

# VAIS

**이력을 남기는 일관성 있는 개발 + AI 티 나지 않는 보고서.**

Claude Code 플러그인. 피처마다 `plan → do → review` 를 돌며 문서 3개(계획/결정 로그/검증)가 쌓이고, `guidelines/` 지침이 코드·문서 일관성을 잡는다. review 마다 교훈이 지침으로 승격되어 프로젝트가 진행될수록 일관성이 강해진다. 추가로 71종 브랜드 디자인 토큰으로 자체 포함 HTML 보고서/슬라이드를 생성한다.

## Quick Start

```bash
git clone https://github.com/ghlee3401/vais-claude-code.git
cd vais-claude-code && bash scripts/setup-dev.sh

# In Claude Code
/reload-plugins
/vais help
```

Node.js ≥ 18 만 있으면 된다.

## 사용법

```bash
/vais plan payment-retry-logic    # 착수 — 범위·접근·완료 조건 → docs/{feature}/plan.md
/vais do payment-retry-logic      # 구현 — sub-agent 병렬 위임, 결정은 notes.md 에 한 줄씩
/vais review payment-retry-logic  # 검증 — 완료 조건 대조 + 지침 승격 루프

/vais report q3-analysis          # brand 스타일 HTML 보고서 (인쇄 → PDF)
/vais deck q3-analysis            # 16:9 HTML 슬라이드 (인쇄 → PPT 대체)
/vais brand new                   # 사내 CI·개인 스타일을 커스텀 브랜드로 등록

/vais status · /vais init · /vais commit · /vais help
```

소규모 작업은 plan 이 먼저 "문서 없이 바로 실행할까요?"를 제안한다 — 30분짜리 수정에 문서 세트를 강요하지 않는다.

## 핵심 설계

| 축 | 내용 |
|----|------|
| 이력 (records) | `docs/{feature}/` 3파일 — plan(≤80줄) / notes(한 줄 append) / review(≤60줄). "다음 개발자가 30초 안에 맥락 파악"이 목적 |
| 지침 (norms) | `guidelines/` 2파일, 크기 예산제(3KB/2KB — validator 가 강제). 매 작업 로드되는 것은 이것뿐 |
| 승격 루프 | review 마지막 스텝: notes 의 교훈 중 반복될 규칙만 지침에 1줄 승격 |
| 보고서 | `design-system/brands/{slug}/DESIGN.md` 토큰이 스타일 정본. 금지 패턴 8종(보라 그라데이션, 이모지 불릿, 동일 레이아웃 반복 등) + self-critique QA |
| 하네스 | hook 3개 (세션 상태 복원 / 위험 명령 차단 / 상태 힌트) + `node --test` + 구조 validator |

## 실행 에이전트 (7)

frontend-engineer · backend-engineer · test-engineer · qa-engineer · ui-designer · incident-responder · security-auditor — do/review 단계에서 병렬 위임용. 방법론(4-phase 디버깅, Confidence 필터링, OWASP 체크, 디자인 크리틱)은 각 md 에 압축되어 있다.

## v1 → v2

v1.x 는 6 C-Level + sub-agent 47 의 가상 조직 시뮬레이션이었다. 실측 결과 phase 당 15–20k 토큰의 프레임워크 오버헤드와 피처당 17개 문서를 낳아, v2.0 에서 시뮬레이션 레이어를 제거하고 본래 목적(이력·일관성·완성도)만 남겼다. 분석과 근거: [`docs/260730_vais_code_review/`](./docs/260730_vais_code_review/) — 과거 산출물은 `docs/_archive/` 에 보존.

## 문서

- [ONBOARDING.md](./ONBOARDING.md) — 5분 진입 가이드
- [CLAUDE.md](./CLAUDE.md) — Claude Code 지침 (규칙 7개, 정본)
- [AGENTS.md](./AGENTS.md) — Cursor/Copilot 등 범용 AI 지침
- [CHANGELOG.md](./CHANGELOG.md)

## License

MIT
