# CEO Plan — gstack absorb

## 개요

| 항목 | 내용 |
|------|------|
| 피처 | gstack-absorb |
| 소스 | `/home/claude/gstack/` (gstack v0.14.5) |
| 모드 | CEO absorb |
| 범위 | C (전체 + 신규 서브에이전트) |

## 소스 분석

gstack은 Claude Code skills + headless browser(Playwright) 플러그인. 약 20개 스킬을 보유하며, 핵심 차별점은 persistent headless browser daemon과 opinionated workflow skills.

## 흡수 배분 맵

### 신규 에이전트 (absorb)

| # | 에이전트 | 배치 경로 | C-Level | 원본 | 핵심 내용 |
|---|---------|----------|---------|------|----------|
| 1 | investigate | `agents/cto/investigate.md` | CTO | gstack/investigate | 4단계 체계적 디버깅 (Iron Law: 원인 없이 수정 금지) |
| 2 | canary | `agents/coo/canary.md` | COO | gstack/canary | 배포 후 모니터링 (health check, 성능 회귀, 에러 감지) |
| 3 | benchmark | `agents/coo/benchmark.md` | COO | gstack/benchmark | 성능 회귀 감지 (빌드 크기, 응답 시간, 의존성 추적) |
| 4 | retro | `agents/ceo/retro.md` | CEO | gstack/retro | 엔지니어링 회고 (커밋 분석, 트렌드, 학습 추출) |

### 기존 에이전트 보강 (merge)

| # | 대상 | 보강 내용 | 원본 |
|---|------|----------|------|
| 5 | `agents/cso/security.md` | careful/guard 개념 — 런타임 안전 가드레일 섹션 추가 | gstack/careful, guard, freeze |
| 6 | `agents/cso/code-review.md` | SQL safety, LLM trust boundary, 조건부 side-effect 체크리스트 | gstack/review |
| 7 | `agents/cso/security.md` | secrets archaeology, CI/CD pipeline security, AI/LLM security 감사 항목 | gstack/cso |

### 참조 문서 (reference)

| # | 대상 | 내용 | 원본 |
|---|------|------|------|
| 8 | `references/gstack-ethos.md` | Boil the Lake, Search Before Building, User Sovereignty | gstack/ETHOS.md |

### 거부 (reject)

| 스킬 | 이유 |
|------|------|
| browse (headless browser) | Playwright/Bun 인프라 의존 |
| design-consultation/design-shotgun | GPT Image API 의존 |
| codex | OpenAI Codex CLI 의존 |
| office-hours | YC 특화, CPO pm-discovery가 대체 |
| connect-chrome/extension | Chrome 특화 |
| gen-skill-docs | gstack 전용 템플릿 시스템 |
| document-release | gstack 특화 워크플로우 |

## 수정 영향 범위

| 파일 | 변경 유형 | 내용 |
|------|----------|------|
| `agents/cto/cto.md` | 수정 | 서브에이전트 목록에 investigate 추가 |
| `agents/coo/coo.md` | 수정 | 서브에이전트 목록에 canary, benchmark 추가 |
| `agents/ceo/ceo.md` | 수정 | 서브에이전트 목록에 retro 추가 |
| `agents/cso/security.md` | 수정 | 가드레일 + 감사 항목 추가 |
| `agents/cso/code-review.md` | 수정 | 체크리스트 추가 |
| `CLAUDE.md` | 수정 | Agent Architecture 표 업데이트 |

## 충돌 위험 평가

- **새 C-Level 없음** — 기존 구조 유지
- **기존 파일 이름 변경 없음**
- **CEO 파이프라인 순서 불변**
- **vais.config.json 키 구조 불변**
- **위험도: 낮음**

---

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-04 | 초기 작성 |
