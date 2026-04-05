# CTO Plan — agent-description-normalization

## 목표

37개 에이전트의 description을 Claude Code best practices 형식으로 정규화.
- **현재**: 한국어 혼재, 역할 나열, "직접 호출 금지"가 description에 포함
- **목표**: 3인칭 영어 서술 + "Use when:" 포지티브 트리거 + Triggers 키워드 유지

## 변환 규칙

### 형식

```yaml
description: |
  {3인칭 ��어 1~2문장: 무엇을 하는지}.
  Use when: {구체적 사용 시점}.
  Triggers: {기존 키워드 유지}
```

### 원칙

1. **3인칭 영어** — "Orchestrates...", "Analyzes...", "Generates..." 등
2. **what + when** �� 무엇을 하는지 + 언제 사용하는지
3. **Triggers 유지** — 기존 한국어/영어 키워드 목록 그대로 보존
4. **"직접 호출 금지"** — description에서 제거 (이미 본문에 명시되어 있으므로)
5. **한국어 설명** — description에서 제거 (역할 설명은 본문으로)
6. **1024자 이내** — frontmatter description 최대 길이

## 범위 분석

### 에이전트 분류 (37개)

| 유형 | 수 | 에이전트 |
|------|---|---------|
| C-Suite (최상위) | 7 | ceo, cpo, cto, cso, cmo, coo, cfo |
| 실행 에이전트 | 26 | architect, backend, frontend, design, qa, tester, devops, database, investigate, security, validate-plugin, code-review, compliance, seo, copywriter, growth, canary, benchmark, sre, docs-writer, cost-analyst, pricing-modeler, pm-discovery, pm-strategy, pm-research, pm-prd |
| Utility/Sub | 4 | absorb-analyzer, retro, ux-researcher, data-analyst |

### 현재 이슈

| 이슈 | 해당 수 | 예시 |
|------|--------|------|
| 한국어로 시작하는 description | 37/37 | "백엔드 에이전트. API 구현..." |
| "직접 호출 금지"가 description에 포함 | ~15 | architect, backend, frontend, qa 등 |
| "Use when:" 누락 | 37/37 | 전체 |
| Triggers 키워드 존재 | ~10 | C-Suite만 Triggers 보유, 실행 에이전트는 미보유 |

## 구현 옵션

### A. 최소 범위 (Minimal)
- C-Suite 7개 에이전트만 정규화
- 체이닝: `plan:backend` (스크립트로 일괄 변환)

### B. 표준 범위 (Standard) ← 권장
- 37개 전체 에이전트 정규��
- description만 변경 (본문 미변경)
- 체이닝: `plan:design:backend`

### C. 확장 범위 (Extended)
- 37개 전체 + CLAUDE.md/AGENTS.md 에이전트 테이블도 동기화
- 체이닝: `plan:design:backend:qa`

## ���술 접근

- 각 `.md` 파일의 frontmatter `description` 필드만 수정
- 본문(`---` 이후)은 변경하지 않음
- `version` 필드는 patch 범프 (예: 3.0.0 → 3.0.1)

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-05 | 초기 작성 |
