# VAIS Code — Skill & Agent Authoring Guide

> Claude Code 공식 best practices 기반, VAIS Code 맥락에 맞게 정리
> 원본: `references/claude_code_agent_skill/best_practices.md`

## 1. 간결성 (Conciseness)

- SKILL.md body **500줄 이하** 유지
- Claude가 이미 아는 것은 설명하지 않음 — 모든 토큰이 context window 공유
- 질문: "이 문단이 토큰 비용을 정당화하는가?"

## 2. Description 작성법

### SKILL.md description
- **3인칭** 서술: "Processes X and does Y" (not "I can…" / "You can…")
- **what + when** 모두 포함: 무엇을 하는지 + 언제 사용하는지
- 최대 1024자, 구체적 키워드 포함
- Trigger 키워드는 description에 자연스럽게 녹여넣기

```yaml
# Good
description: >
  Orchestrates C-Suite agents for product strategy and implementation.
  Use when: product ideation, technical execution, security review,
  marketing strategy, deployment, or cost analysis is needed.

# Bad
description: "VAIS Code 플러그인"
```

### Agent description
- 동일 원칙 적용: 3인칭 + what + when
- `Triggers:` 키워드 별도 열거 가능 (VAIS 고유 패턴)
- "직접 호출 금지" 등 제약은 description이 아닌 본문에 명시

## 3. Progressive Disclosure

```
SKILL.md (개요 + 네비게이션)
  └── phases/*.md (상세 지침)    ← 1단계 깊이
  └── utils/*.md (유틸리티)      ← 1단계 깊이
```

- **참조는 1단계까지만** — SKILL.md → 직접 참조 파일 (중첩 참조 금지)
- 100줄 초과 참조 파일은 **상단 목차(TOC)** 필수
- Claude는 긴 파일을 `head -100`으로 미리보기할 수 있으므로 TOC가 네비게이션 역할

## 4. 자유도 설정 (Degrees of Freedom)

| 자유도 | 사용 시점 | 예시 |
|--------|----------|------|
| **High** (텍스트 지시) | 여러 접근법이 유효할 때 | 코드 리뷰, 전략 분석 |
| **Medium** (의사코드) | 선호 패턴이 있으나 변형 허용 | 리포트 생성, 데이터 분석 |
| **Low** (정확한 스크립트) | 오류 민감, 일관성 필수 | DB 마이그레이션, 배포 |

## 5. Workflow & Feedback Loop

### 체크리스트 패턴
```
Task Progress:
- [ ] Step 1: 분석
- [ ] Step 2: 계획 수립
- [ ] Step 3: 실행
- [ ] Step 4: 검증
- [ ] Step 5: 최종 확인
```

### Feedback Loop
```
실행 → 검증 → 이슈 발견 → 수정 → 재검증 → 통과 시 다음 단계
```

VAIS의 Gap 분석(90% 일치율)이 이 패턴의 구현체.

## 6. 모델별 고려

| 모델 | 고려사항 |
|------|---------|
| **Opus** (C-Suite) | 과도한 설명 지양, 전략적 판단에 집중 |
| **Sonnet** (실행 에이전트) | 명확하고 구체적인 지시, 충분한 컨텍스트 |
| **Haiku** (사용 시) | 더 상세한 가이드 제공 필요 |

## 7. Anti-patterns

- ❌ Windows 경로 (`\`) → ✅ Forward slash (`/`)
- ❌ 과다한 선택지 → ✅ 기본값 + escape hatch
- ❌ 시간 의존 정보 → ✅ 버전 기반 분류
- ❌ 용어 혼재 → ✅ 일관된 용어 사용
- ❌ 중첩 참조 (A→B→C) → ✅ 1단계 참조 (SKILL→A, SKILL→B)

## 8. Evaluation Checklist (신규 스킬/에이전트 작성 시)

### Core Quality
- [ ] Description이 구체적이고 what + when 포함
- [ ] 3인칭으로 작성
- [ ] SKILL.md 500줄 이하
- [ ] 상세 내용은 별도 파일 분리
- [ ] 시간 의존 정보 없음
- [ ] 일관된 용어 사용
- [ ] 참조 1단계 깊이 유지

### VAIS 고유
- [ ] PDCA 문서 경로 명시
- [ ] C-Level 위임 구조 명확
- [ ] Gate 체크포인트 정의
- [ ] `vais.config.json` 연동 확인

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-05 | 초기 작성 — best_practices.md absorb |
