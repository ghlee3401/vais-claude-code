# Skill/Agent 일관성 검토 리포트

**날짜**: 2026-04-01
**실행자**: CEO (자율 진행)
**범위**: agents/*.md, skills/vais/SKILL.md, skills/vais/phases/*.md, vais.config.json

## 발견된 문제 및 수정 내역

### 1. Agent Frontmatter 필드 불일치

**문제**: 구현 에이전트(design, architect, frontend, backend, qa)에 `version`, `memory`, `hooks` 필드가 누락. C-Suite agents와 sub-agents는 모두 해당 필드를 보유.

**수정**: 5개 구현 에이전트에 다음 필드 추가:
- `version: 1.0.0` (qa는 기존 변경 이력 기반 `1.1.0`)
- `memory: none` (C-Suite은 `project`, 하위 에이전트는 `none`)
- `hooks.Stop` (agent-stop.js 호출)
- `Triggers` 설명 추가: "(직접 호출 금지 -- CTO를 통해 호출)"

**수정 대상**: `agents/design.md`, `agents/architect.md`, `agents/frontend.md`, `agents/backend.md`, `agents/qa.md`

### 2. tools 필드 형식 불일치

**문제**: 구현 에이전트의 `tools` 필드가 쉼표 구분 문자열(`Read, Write, Edit, ...`)이고, C-Suite/sub-agents는 YAML 배열(`[Read, Write, Edit, ...]`) 형식.

**수정**: 모든 구현 에이전트의 tools를 YAML 배열 형식으로 통일.

### 3. Sub-agent hooks 누락

**문제**: `seo.md`, `security.md`, `validate-plugin.md`에 `hooks` 필드 누락.

**수정**: 3개 sub-agent에 `hooks.Stop` 추가.

### 4. qa.md 변경 이력 형식 오류

**문제**: 변경 이력 행이 테이블 헤더 없이 단독 존재 (56행).

**수정**: `## 변경 이력` 섹션 헤더와 테이블 헤더 추가, v1.0.0 초기 작성 행 추가.

### 5. Phase 파일 frontmatter 불일치

**문제**: `ceo.md`, `cto.md`, `cmo.md`, `cso.md` phase 파일에 frontmatter 없음. `cpo.md`, `cfo.md`, `coo.md`에는 있음.

**수정**: 4개 phase 파일에 `name`, `description` frontmatter 추가.

### 6. help.md 구조 v0.25.0 이전 참조

**문제**: `/vais auto`, `/vais plan:design:architect`, `/vais frontend+backend` 등 deprecated 커맨드 안내.

**수정**: v0.25.0 C-Suite 구조에 맞게 전체 재작성.

### 7. status.md 구조 v0.25.0 이전 참조

**문제**: 직접 단계 호출 패턴 안내 (deprecated).

**수정**: CTO 중심 워크플로우에 맞게 재작성.

### 8. commit.md 잘못된 리다이렉트

**문제**: "CTO를 통해 실행됩니다" 리다이렉트 스텁이지만, README에서 `/vais commit`은 독립 유틸리티 커맨드.

**수정**: 유틸리티 커맨드 설명으로 복원.

### 9. vais.config.json 불일치

**문제 A**: CPO 모델이 config에서 `opus`이지만 agents/cpo.md와 README에서 `sonnet`.
**수정 A**: config를 `sonnet`으로 수정 (agents + README와 일치).

**문제 B**: CFO 역할이 config에 없음 (agents/cfo.md는 존재).
**수정 B**: config에 cfo 역할 추가.

### 10. Phase 유틸리티/리다이렉트 파일 frontmatter 추가

**문제**: `init.md`, `absorb.md` 유틸리티 phase 파일과 6개 리다이렉트 스텁 파일(plan, design, architect, frontend, backend, qa)에 frontmatter 없음.

**수정**: 모든 phase 파일에 `name`, `description` frontmatter 추가하여 일관성 확보.

### 11. 미수정 사항 (의도적 보류)

- `vais.config.json`에 `cdo`, `cro` 역할이 정의되어 있으나 agent 파일 미존재: 향후 추가 예정 에이전트로 판단하여 보류
- `vais.config.json`의 `team.agentTeam` 섹션에 `manager` 참조: 레거시 호환 설정으로 보류
- `description` 필드의 `Triggers:` 형식: C-Suite은 트리거 키워드 나열, 하위 에이전트는 "(직접 호출 금지)" 표시 -- 역할 차이에 따른 의도적 구분

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0.0 | 2026-04-01 | 초기 작성 -- 19개 파일 일관성 수정 |
