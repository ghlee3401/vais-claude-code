# CEO Design — reference-restructure

> 📎 참조 문서: `docs/01-plan/ceo_reference-restructure.plan.md`

## 변경 상세 (Before → After)

---

### 1. gstack-ethos.md → CLAUDE.md

**Before** (`CLAUDE.md:125`):
```
8. **C-Suite 호출 규칙** — 실행 에이전트(architect, backend, frontend 등)는 직접 호출 금지, 반드시 CTO를 통해 호출
```
(여기서 끝)

**After**:
```
8. **C-Suite 호출 규칙** — 실행 에이전트(architect, backend, frontend 등)는 직접 호출 금지, 반드시 CTO를 통해 호출
9. **완전성 원칙 (Boil the Lake)** — 각 C-Level은 담당 범위를 완전하게 수행. "나중에" 미룸 금지. Lake(끓일 수 있는 범위)는 끓이고, Ocean(전체 재작성 등)은 범위 밖으로 표시
10. **탐색 우선 (Search Before Building)** — 빌드 전 기존 솔루션 탐색. 검증된 패턴 → 현재 베스트 프랙티스 → First Principles 순서
11. **사용자 주권 (User Sovereignty)** — AI는 추천, 사용자가 결정. CEO 체크포인트에서 반드시 사용자 확인
```

**삭제**: `references/gstack-ethos.md` (56줄)

---

### 2. mcp-builder-guide.md → skills/vais/utils/mcp-builder.md

**신규 파일** 생성. 원문에서 "VAIS 적용" 섹션(L49~53) 제거, 나머지 핵심 보존.

```markdown
---
name: mcp-builder
description: MCP 서버 개발 가이드. 설계 원칙, 4 Phase 프로세스, 권장 스택 안내.
---

# MCP Server 개발 가이드

> CTO 또는 architect가 MCP 서버를 설계/구현할 때 참조

## 설계 원칙
(원문 L8~11 유지: API Coverage, Tool Naming, Context Management, Error Messages)

## 개발 프로세스 (4 Phase)
(원문 L14~36 유지: Research → Implementation → Review → Evaluation)

## 권장 스택
(원문 L38~47 유지: 테이블)
```

**삭제**: `references/mcp-builder-guide.md` (60줄)

---

### 3-A. skill-authoring-guide.md Sections 1~8 → validate-plugin.md

**Before** (`validate-plugin.md:79`):
```
CSO가 최종 Gate B Pass/Fail을 판정합니다.
```
(여기서 끝)

**After** (아래 섹션 추가):
```markdown
## 스킬/에이전트 품질 기준

### Description 작성 규칙
- 3인칭 서술: "Processes X and does Y" (not "I can…")
- what + when 모두 포함
- 최대 1024자, 구체적 키워드 포함
- Trigger 키워드는 description에 자연스럽게 녹여넣기

### 구조 품질 체크리스트
- [ ] SKILL.md body 500줄 이하
- [ ] 상세 내용은 별도 파일 분리 (Progressive Disclosure)
- [ ] 참조는 1단계 깊이까지만 (중첩 참조 금지)
- [ ] 100줄 초과 참조 파일은 상단 TOC 필수
- [ ] 시간 의존 정보 없음
- [ ] 일관된 용어 사용
- [ ] Windows 경로 없음 (forward slash 사용)
- [ ] PDCA 문서 경로 명시
- [ ] C-Level 위임 구조 명확
- [ ] Gate 체크포인트 정의

### Anti-patterns
- ❌ 과다한 선택지 → ✅ 기본값 + escape hatch
- ❌ 용어 혼재 → ✅ 일관된 용어
- ❌ 중첩 참조 (A→B→C) → ✅ 1단계 참조 (SKILL→A, SKILL→B)
```

---

### 3-B. skill-authoring-guide.md Section 9 → absorb-analyzer.md

**Before** (`absorb-analyzer.md:142`):
```
## 주의사항
```

**After** (주의사항 직전에 삽입):
```markdown
## Description 최적화 평가 (흡수 대상이 스킬/에이전트인 경우)

### 평가 항목
- 3인칭 서술인가 ("Processes X" ✅ / "I can" ❌)
- what + when 모두 포함하는가
- 최대 1024자 이내인가
- Trigger 키워드가 자연스럽게 포함되어 있는가

### Eval 방법론 (선택적 심화)
- 20개 trigger eval 쿼리 생성 (should-trigger 10 + should-not-trigger 10)
- should-trigger: 다양한 표현, 암시적 요구, 경쟁 스킬 대비 우위 케이스
- should-not-trigger: near-miss 쿼리 (키워드 유사하지만 다른 도메인)
- 60% train / 40% test 분할 → 최대 5회 반복 → best 선택

### 스킬 구조 검증
- SKILL.md body 500줄 이하 유지
- 상세 내용은 별도 파일 분리 (Progressive Disclosure, 1단계 깊이만)
- 반복 작업이 발견되면 scripts/에 번들 권장

## 주의사항
```

**삭제**: `references/skill-authoring-guide.md` (153줄)

---

### 4. ceo.md 참조 경로 수정

**Before** (`ceo.md:322`):
```
- `references/skill-authoring-guide.md` — 스킬/에이전트 작성 가이드라인 (수정 시 참조)
```

**After**:
```
- `agents/ceo/absorb-analyzer.md` — Description 최적화 평가 기준 (스킬/에이전트 흡수 시 참조)
```

---

### 5. CLAUDE.md project structure 주석 수정

**Before**:
```
├── references/      # 참고 문서
```

**After**:
```
├── references/      # 흡수 대기 inbox (_inbox/만 유지, 흡수 완료 문서는 에이전트로 이동)
```

---

## 실행 순서

1. `CLAUDE.md` — Rule 9-11 추가 + 구조 주석 수정
2. `skills/vais/utils/mcp-builder.md` — 신규 생성
3. `agents/cso/validate-plugin.md` — 품질 기준 섹션 추가
4. `agents/ceo/absorb-analyzer.md` — Description 평가 섹션 추가
5. `agents/ceo/ceo.md` — 참조 경로 수정
6. `references/` 3파일 삭제

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-05 | 초기 작성 |
