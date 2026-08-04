---
name: skill-creator
description: 스킬 작성 가이드. SKILL.md 구조, progressive disclosure, description 최적화, 4단계 프로세스 안내.
---

# Skill 작성 가이드

> CTO 또는 CPO가 새 스킬을 설계/구현할 때 참조
> 원본: Anthropic 공식 `skill-creator` 스킬

## 1. SKILL.md 구조 (Anatomy)

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description 필수)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/    - 결정적/반복적 작업용 실행 코드
    ├── references/ - 필요 시 컨텍스트에 로드되는 문서
    └── assets/     - 출력에 사용되는 파일 (템플릿, 아이콘 등)
```

### Frontmatter 필수 필드

```yaml
---
name: my-skill
description: >
  스킬이 하는 일 + 언제 사용해야 하는지.
  triggering 정확도를 위해 구체적이고 "pushy"하게 작성.
---
```

## 2. Progressive Disclosure (3-Level)

| Level | 내용 | 로딩 시점 | 권장 크기 |
|-------|------|----------|----------|
| L1 Metadata | name + description | 항상 (available_skills) | ~100 단어 |
| L2 Body | SKILL.md 본문 | 스킬 trigger 시 | <500줄 |
| L3 Resources | scripts/, references/, assets/ | 필요 시 Read | 무제한 |

**핵심 패턴**:
- SKILL.md 500줄 초과 시 → references/ 파일로 분리 + 명확한 포인터
- 대형 reference (>300줄) → 목차(TOC) 포함
- 멀티 도메인 → variant별 reference 분리 (예: `references/aws.md`, `references/gcp.md`)

## 3. 작성 스타일

- **Imperative form** 사용 (명령형: "~하세요", "~합니다")
- **Why 설명** 우선 — ALWAYS/NEVER 대신 이유를 설명하면 모델이 edge case도 판단 가능
- **Examples 포함** — Input/Output 쌍으로 기대 동작 명시
- **Output format** 정의 시 정확한 템플릿 제공

```markdown
## 커밋 메시지 형식
**Example 1:**
Input: Added user authentication with JWT tokens
Output: feat(auth): implement JWT-based authentication
```

## 4. Description 최적화

Description은 스킬 triggering의 **유일한 메커니즘**. Claude는 `available_skills` 목록에서 description만 보고 판단한다.

### 원칙

1. **Undertrigger 방지**: "pushy"하게 작성. 관련 키워드, 유사 표현, edge case까지 명시
2. **복합 쿼리 타겟**: 단순 1-step 작업은 스킬 없이도 처리됨 → 복잡한 다단계 작업에 유용
3. **부정 조건 포함**: "Do NOT trigger when: ~" 으로 오탐 방지

**좋은 예**:
```
Create new skills, modify existing skills, and measure skill performance.
Use when users want to create a skill from scratch, edit or optimize an existing skill,
run evals to test a skill, or optimize a skill's description for better triggering.
```

**나쁜 예**:
```
A skill for making skills.
```

## 5. 작성 프로세스 (4 Phase)

### Phase 1: Capture Intent
1. 스킬이 무엇을 하는가?
2. 언제 trigger 되어야 하는가? (사용자 문구/컨텍스트)
3. 기대 출력 형식은?
4. 테스트 케이스가 필요한가? (객관적 검증 가능 여부에 따라 판단)

### Phase 2: Interview & Research
- Edge case, 입출력 형식, 의존성 파악
- 기존 유사 스킬 탐색 (Search Before Building 원칙)
- 사용자 부담 최소화 — 리서치는 사전에 준비

### Phase 3: Write SKILL.md
- Frontmatter 작성 (name, description)
- Progressive Disclosure 적용 (L1/L2/L3)
- 작성 스타일 준수 (imperative, why-first, examples)
- 500줄 한도 체크 → 초과 시 references/ 분리

### Phase 4: Review & Iterate
- 2~3개 현실적 테스트 프롬프트 작성
- 스킬 적용/미적용 결과 비교
- 사용자 피드백 기반 개선
- Description 최적화 (triggering 정확도 확인)

### 반복 원칙
- 피드백에서 **일반화** — 특정 예제에만 맞추지 않고 범용 패턴 도출
- **Lean 유지** — 효과 없는 지시 제거
- **반복 작업 감지** → scripts/로 번들링

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-05 | inbox skill-creator에서 유틸로 흡수 (표준 범위: 가이드 + 프로세스) |
