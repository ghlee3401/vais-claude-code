---
feature: vais-dev
status: design
architecture: C (Move + Redirect)
created: 2026-04-01
---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | `/vais`가 C-suite와 구현 단계를 혼재 → 계층 불명확 |
| **WHO** | vais-code 사용자 (개발자) |
| **RISK** | 기존 `/vais plan` 사용 습관 → 리다이렉트로 완화 |
| **SUCCESS** | `/vais`=전략, `/vais-dev`=구현 역할이 커맨드 이름에서 자명 |
| **SCOPE** | 스킬 레이어만. agents/*.md 수정 없음 |

---

## 1. 선택 아키텍처: Option C — Move + Redirect

### 핵심 원칙
- dev phase 파일을 `vais/phases/` → `vais-dev/phases/`로 **이동** (복사 아님)
- `vais/phases/`의 이동된 자리에 **리다이렉트 스텁** 배치
- `vais/SKILL.md`에서 dev 트리거/액션 제거
- `vais-dev/SKILL.md` 신설

---

## 2. 파일 구조 변경

### 2.1 목표 디렉토리 구조

```
skills/
  vais/
    SKILL.md                  ← 수정 (dev 트리거/액션 제거)
    phases/
      # C-suite (유지)
      ceo.md
      cfo.md
      cmo.md
      coo.md
      cpo.md
      cso.md
      cto.md
      # 유틸리티 (유지)
      absorb.md
      init.md
      help.md                 ← 수정 (/vais-dev 안내 추가)
      status.md               ← 유지 (전체 프로젝트 상태)
      # 구현 단계 → 리다이렉트 스텁으로 교체
      plan.md                 ← REDIRECT STUB
      design.md               ← REDIRECT STUB
      architect.md            ← REDIRECT STUB
      backend.md              ← REDIRECT STUB
      frontend.md             ← REDIRECT STUB
      qa.md                   ← REDIRECT STUB
      report.md               ← REDIRECT STUB
      commit.md               ← REDIRECT STUB
      test.md                 ← REDIRECT STUB
      next.md                 ← REDIRECT STUB

  vais-dev/                   ← 신설
    SKILL.md                  ← 신설
    phases/
      plan.md                 ← vais/phases/plan.md 내용 이동
      design.md               ← vais/phases/design.md 내용 이동
      architect.md            ← vais/phases/architect.md 내용 이동
      backend.md              ← vais/phases/backend.md 내용 이동
      frontend.md             ← vais/phases/frontend.md 내용 이동
      qa.md                   ← vais/phases/qa.md 내용 이동
      report.md               ← vais/phases/report.md 내용 이동
      commit.md               ← vais/phases/commit.md 내용 이동
      test.md                 ← vais/phases/test.md 내용 이동
      next.md                 ← vais/phases/next.md 내용 이동
      status.md               ← 신설 (구현 진행 상태)
      help.md                 ← 신설 (구현 레이어 도움말)
```

---

## 3. 각 파일 상세 설계

### 3.1 `skills/vais-dev/SKILL.md`

```yaml
name: vais-dev
description: >
  VAIS Code 구현 레이어. plan → design → architect → backend → frontend → qa 워크플로우를 관리합니다.
  Triggers: vais-dev, plan, design, architect, backend, frontend, qa, 기획, 설계, 구현, 백엔드,
  프론트엔드, 아키텍트, 인프라, DB, 환경설정, 마이그레이션, 스키마, wireframe, 와이어프레임,
  화면설계, 목업, mockup, commit, test, report, 완료, 커밋, 테스트, 보고서, 배포
  Do NOT use for: C-suite 전략, 비즈니스 방향, 마케팅, 재무, 보안 정책
argument-hint: "[action] [feature]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TodoWrite, AskUserQuestion
```

**본문 구조:**
- 현재 상태: `.vais/status.json` 읽기 (vais와 동일)
- 공통 규칙: vais와 동일 (한국어 문서, 영어 피처명)
- 액션 목록: plan, design, architect, backend, frontend, qa, report, commit, test, next, status, help
- 실행 지침: `${CLAUDE_SKILL_DIR}/phases/$0.md` 읽기 (vais와 동일 패턴)
- 완료 아웃로: `/vais-dev {다음액션}` 형식으로 출력

### 3.2 `skills/vais/SKILL.md` 변경 사항

**description 트리거에서 제거:**
```
# 제거 대상
plan, design, implement, qa, QA, gap, test, commit,
wireframe, 와이어프레임, 화면설계, 목업, mockup, layout, 레이아웃, 화면 구성,
architect, 아키텍트, 인프라, DB, 환경설정, 마이그레이션, 스키마,
frontend, backend
```

**액션 목록 변경:**
```markdown
# 유지
| `init [feature]` | 기존 프로젝트 분석 → VAIS 문서 역생성 |
| `ceo [feature]` | CEO 에이전트 |
| `cpo [feature]` | CPO 에이전트 |
| `cto [feature]` | CTO 에이전트 |
| `cmo [feature]` | CMO 에이전트 |
| `cso [feature]` | CSO 에이전트 |
| `cfo [feature]` | CFO 에이전트 |
| `coo [feature]` | COO 에이전트 |
| `absorb [path]` | 외부 레퍼런스 흡수 |
| `status` / `help` | 유틸리티 |

# 제거
plan ~ qa, report, commit, test, next
```

**서브타이틀 변경:**
```
# 기존
> 📋기획 → 🎨설계 → 🔧아키텍트 → 💻프론트 + ⚙️백엔드 → ✅QA

# 변경
> 🎯전략 → 기술 방향 설정 | 구현은 `/vais-dev` 사용
```

### 3.3 리다이렉트 스텁 패턴

모든 이동된 dev phase 파일 자리에 동일 패턴 적용:

```markdown
## ⚠️ 커맨드가 이동했습니다

`/vais {action}`은 `/vais-dev`로 이동했습니다.

👉 **`/vais-dev {action} {feature}`** 를 사용하세요.

구현 전체 워크플로우:
  `/vais-dev plan` → `design` → `architect` → `backend` → `frontend` → `qa`
```

### 3.4 `skills/vais/phases/help.md` 수정

기존 커맨드 목록에 섹션 추가:

```markdown
🔧 구현 (vais-dev):
  /vais-dev plan | design | architect | backend | frontend | qa
  /vais-dev report | commit | test | status
```

### 3.5 `skills/vais-dev/phases/status.md` (신설)

구현 단계 전용 상태 출력:
- `.vais/status.json`에서 현재 피처 및 구현 단계(plan/design/architect/backend/frontend/qa) 상태 표시
- 다음 실행할 단계 제안

### 3.6 `skills/vais-dev/phases/help.md` (신설)

구현 레이어 전용 도움말:
- `vais-dev` 워크플로우 설명
- 각 단계 커맨드 목록
- "전략 관련은 `/vais`를 사용하세요" 크로스 링크

---

## 4. 구현 순서 (Session Guide)

### Module 1 — vais-dev 스킬 신설
1. `skills/vais-dev/` 디렉토리 생성
2. `skills/vais-dev/SKILL.md` 작성
3. `skills/vais-dev/phases/` 디렉토리 생성

### Module 2 — Phase 파일 이동
4. `vais/phases/`의 dev 파일 10개를 `vais-dev/phases/`로 내용 이동
   (plan, design, architect, backend, frontend, qa, report, commit, test, next)

### Module 3 — 리다이렉트 스텁 작성
5. `vais/phases/`의 이동된 파일 자리에 리다이렉트 스텁 10개 작성

### Module 4 — vais 정리
6. `skills/vais/SKILL.md` 수정 (트리거, 액션 목록, 서브타이틀)
7. `skills/vais/phases/help.md` 수정 (vais-dev 안내 추가)

### Module 5 — vais-dev 유틸 신설
8. `skills/vais-dev/phases/status.md` 신설
9. `skills/vais-dev/phases/help.md` 신설

---

## 5. 변경 파일 목록

| 파일 | 작업 | 비고 |
|------|------|------|
| `skills/vais-dev/SKILL.md` | 신설 | |
| `skills/vais-dev/phases/plan.md` | 신설 (vais 내용 이동) | |
| `skills/vais-dev/phases/design.md` | 신설 (vais 내용 이동) | |
| `skills/vais-dev/phases/architect.md` | 신설 (vais 내용 이동) | |
| `skills/vais-dev/phases/backend.md` | 신설 (vais 내용 이동) | |
| `skills/vais-dev/phases/frontend.md` | 신설 (vais 내용 이동) | |
| `skills/vais-dev/phases/qa.md` | 신설 (vais 내용 이동) | |
| `skills/vais-dev/phases/report.md` | 신설 (vais 내용 이동) | |
| `skills/vais-dev/phases/commit.md` | 신설 (vais 내용 이동) | |
| `skills/vais-dev/phases/test.md` | 신설 (vais 내용 이동) | |
| `skills/vais-dev/phases/next.md` | 신설 (vais 내용 이동) | |
| `skills/vais-dev/phases/status.md` | 신설 | |
| `skills/vais-dev/phases/help.md` | 신설 | |
| `skills/vais/SKILL.md` | 수정 | 트리거/액션 정리 |
| `skills/vais/phases/plan.md` | 리다이렉트 스텁으로 교체 | |
| `skills/vais/phases/design.md` | 리다이렉트 스텁으로 교체 | |
| `skills/vais/phases/architect.md` | 리다이렉트 스텁으로 교체 | |
| `skills/vais/phases/backend.md` | 리다이렉트 스텁으로 교체 | |
| `skills/vais/phases/frontend.md` | 리다이렉트 스텁으로 교체 | |
| `skills/vais/phases/qa.md` | 리다이렉트 스텁으로 교체 | |
| `skills/vais/phases/report.md` | 리다이렉트 스텁으로 교체 | |
| `skills/vais/phases/commit.md` | 리다이렉트 스텁으로 교체 | |
| `skills/vais/phases/test.md` | 리다이렉트 스텁으로 교체 | |
| `skills/vais/phases/next.md` | 리다이렉트 스텁으로 교체 | |
| `skills/vais/phases/help.md` | 수정 | vais-dev 안내 추가 |
| `agents/*.md` | **수정 없음** | |

**총계: 신설 13개, 수정 2개, 교체 10개**

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-01 | 최초 작성 (Option C 선택) |
