---
feature: c-suite-delegation
status: design
architecture: B (SKILL.md 정리 + Phase 리다이렉트 스텁)
created: 2026-04-01
---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | SKILL.md가 구현 단계를 직접 노출해 C-레벨 계층이 무의미해짐 |
| **WHO** | vais-code 사용자 (개발자) |
| **RISK** | 기존 사용 습관 혼란 → 리다이렉트 스텁으로 완화 |
| **SUCCESS** | 사용자가 `/vais cto`로만 구현 시작, 나머지는 CTO가 오케스트레이션 |
| **SCOPE** | SKILL.md 1개 수정 + phase 스텁 10개 교체. agents 수정 없음 |

---

## 1. 발견: 에이전트는 이미 올바름

코드 분석 결과:
- **CTO**: Gate 시스템 (4개 Gate) + AskUserQuestion 확인 + 단계별 에이전트 위임 이미 구현됨
- **CEO**: C-레벨에만 위임하는 구조 이미 구현됨

**변경이 필요한 것은 `skills/vais/SKILL.md`뿐.**
SKILL.md가 `plan`, `architect`, `backend` 등을 여전히 직접 액션으로 노출하고 있어 사용자가 CTO를 우회할 수 있는 상태.

---

## 2. 변경 파일 목록

| 파일 | 작업 | 변경 내용 |
|------|------|---------|
| `skills/vais/SKILL.md` | 수정 | 구현 트리거/액션 제거, C-레벨 중심으로 재편 |
| `skills/vais/phases/plan.md` | 교체 | 리다이렉트 스텁 |
| `skills/vais/phases/design.md` | 교체 | 리다이렉트 스텁 |
| `skills/vais/phases/architect.md` | 교체 | 리다이렉트 스텁 |
| `skills/vais/phases/backend.md` | 교체 | 리다이렉트 스텁 |
| `skills/vais/phases/frontend.md` | 교체 | 리다이렉트 스텁 |
| `skills/vais/phases/qa.md` | 교체 | 리다이렉트 스텁 |
| `skills/vais/phases/report.md` | 교체 | 리다이렉트 스텁 |
| `skills/vais/phases/commit.md` | 교체 | 리다이렉트 스텁 |
| `skills/vais/phases/test.md` | 교체 | 리다이렉트 스텁 |
| `skills/vais/phases/next.md` | 교체 | 리다이렉트 스텁 |
| `agents/*.md` | **수정 없음** | 이미 올바른 구조 |

---

## 3. `skills/vais/SKILL.md` 변경 상세

### 3.1 description 트리거 변경

```yaml
# 제거할 트리거 (구현 단계)
plan, design, implement, qa, QA, gap, test, commit,
wireframe, 와이어프레임, 화면설계, 목업, mockup, layout, 레이아웃, 화면 구성,
architect, 아키텍트, 인프라, DB, 환경설정, 마이그레이션, 스키마,
frontend, backend

# 유지할 트리거 (전략/C-suite)
vais, help, 도움말, 사용법, 개발, 리뷰, 검토,
상태, status, init, 초기화, 적용, 기존 프로젝트,
아이디어, research, 조사, 뭐 만들, 만들고 싶, 시작,
cto, ceo, cmo, cso, cpo, cdo, cro, coo, c-suite, 기술총괄, 전략
```

### 3.2 서브타이틀 변경

```markdown
# 기존
> 📋기획 → 🎨설계 → 🔧아키텍트 → 💻프론트 + ⚙️백엔드 → ✅QA

# 변경
> 🎯 C-Suite 오케스트레이션 | 구현은 `/vais cto {feature}`로 시작하세요
```

### 3.3 액션 목록 변경

```markdown
# 유지 (C-suite)
| `ceo [feature]` | CEO 에이전트 — 비즈니스 전략 + C-Suite 조율 |
| `cpo [feature]` | CPO 에이전트 — 제품 방향 + PRD |
| `cto [feature]` | CTO 에이전트 — 기술 전체 오케스트레이션 (plan→qa) |
| `cmo [feature]` | CMO 에이전트 — 마케팅 전략 + SEO |
| `cso [feature]` | CSO 에이전트 — 보안/검증 |
| `cfo [feature]` | CFO 에이전트 — 재무/ROI |
| `coo [feature]` | COO 에이전트 — 운영/CI/CD |

# 유지 (유틸리티)
| `init [feature]` | 기존 프로젝트 분석 → VAIS 문서 역생성 |
| `absorb [path]` | 외부 레퍼런스 평가 및 흡수 |
| `status` / `help` | 유틸리티 |

# 제거
plan, design, architect, backend, frontend, qa,
report, commit, test, next
```

### 3.4 cto 설명 강화 (액션 목록 내)

```markdown
| `cto [feature]` | CTO 에이전트 — plan→design→architect→backend→frontend→qa 전체 오케스트레이션. 각 단계마다 사용자 확인 |
```

---

## 4. 리다이렉트 스텁 패턴

`skills/vais/phases/{dev-action}.md` 파일을 아래 패턴으로 교체:

```markdown
## ⚠️ 이 커맨드는 CTO를 통해 실행됩니다

`/vais {action}`은 더 이상 직접 실행되지 않습니다.

👉 **`/vais cto {feature}`** 를 실행하세요.

CTO가 다음 단계를 자동으로 오케스트레이션합니다:
  plan → design → architect → backend + frontend → qa

각 단계 완료 시 CTO가 확인을 요청합니다.
```

---

## 5. 구현 순서 (Session Guide)

### Module 1 — SKILL.md 수정 (핵심)
1. `skills/vais/SKILL.md` description 트리거에서 구현 키워드 제거
2. 액션 목록에서 구현 단계 제거, C-suite만 유지
3. 서브타이틀 및 cto 설명 업데이트

### Module 2 — Phase 스텁 교체 (10개)
4. `plan.md`, `design.md`, `architect.md`, `backend.md`, `frontend.md` 교체
5. `qa.md`, `report.md`, `commit.md`, `test.md`, `next.md` 교체

---

## 6. 변경 전/후 사용자 경험

### 변경 전
```
/vais plan login      → plan 단계 직접 실행
/vais architect login → architect 단계 직접 실행
/vais cto login       → CTO가 전체 오케스트레이션
```

### 변경 후
```
/vais plan login      → "CTO를 통해 실행하세요: /vais cto login"
/vais cto login       → CTO가 plan→qa 전체 오케스트레이션 (각 Gate에서 확인)
```

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-01 | 최초 작성 (Option B 선택) |
