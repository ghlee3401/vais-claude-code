# Sub-plan 08 — Tools Cleanup & Activation

> 릴리즈: **v0.56.0** (CP-9 릴리즈 분리 결정)
> 선행: v0.55 전체 완료
> 후행: v0.56용 docs/tests 마무리
> 담당 SC: SC-13, SC-14, SC-15
> 갱신: 2026-04-17 CP-7 결정 + CP-9 릴리즈 분리 반영

---

## 0. 목적

CP-7에서 결정된 에이전트 내부 도구 처리:

| 대상 | 결정 | 섹션 |
|------|------|------|
| `scripts/skill_eval/*.py` | 유지 (명시 호출자 있음) | 건드리지 않음 |
| `scripts/refactor-audit.js` + baseline | **삭제 (B1)** | §1 |
| `scripts/generate-dashboard.js` | **활성화 (C2)** — `/vais dashboard` 커맨드 진입점 신설 | §2 |
| `scripts/seo-audit.js` + `scripts/auditors/*` + `scripts/seo-helpers.js` + `scripts/seo-scoring.js` | **활성화 (D2)** — `agents/cbo/seo-analyst.md`에 CLI 호출 가이드 추가 | §3 |

세 작업은 **서로 독립**이므로 순서 없이 병렬 진행 가능.

---

## 1. Refactor-audit 제거 (B1)

### 1.1 배경

`scripts/refactor-audit.js` (458 LOC)는 v0.48.2 → v0.49.0 C-Level 에이전트 리팩터 시 keyword/CP ID/section 보존을 검증하는 **일회성 도구**. baseline snapshot 기반.

- 참조 baseline: `docs/03-do/ceo_refactor-clevel-agents.baseline.json` (레거시 top-level docs 경로)
- 현재 agent markdown 참조자 0
- CHANGELOG에서 "v0.49 리팩터 시 사용"으로만 언급

미래에 다시 대규모 agent 리팩터가 필요해지면 **처음부터 재작성**이 적절 (v050 이후 구조 많이 바뀜).

### 1.2 삭제

```
rm scripts/refactor-audit.js
rm -rf docs/_legacy/03-do/ceo_refactor-clevel-agents.baseline.json   # 존재 여부 확인 후
rm docs/03-do/ceo_refactor-clevel-agents.baseline.json              # 존재하면 (Rule #13 위반 위치)
```

baseline 파일 위치를 먼저 탐색:
```
find . -name "ceo_refactor-clevel-agents.baseline.json" -not -path "./node_modules/*"
```

### 1.3 참조 정리

- `CHANGELOG.md` 역사 기록은 유지 (v0.49 섹션 그대로)
- `guide/harness-plan-v2.md`의 도구 표에서 `refactor-audit.js` 행 삭제

### 1.4 검증

| # | 검증 | 방법 |
|---|------|------|
| V-1 | `scripts/refactor-audit.js` 부재 | `ls scripts/refactor-audit.js` fail |
| V-2 | baseline JSON 부재 | `find . -name "*refactor-clevel*"` → 0 |
| V-3 | agent markdown에 refactor-audit 호출 없음 | `grep -rn "refactor-audit" agents/ skills/` → 0 |

---

## 2. Dashboard 활성화 (C2)

### 2.1 배경

`scripts/generate-dashboard.js` (547 LOC)는 `.vais/dashboard.html` 진행 상황 대시보드를 생성한다. 기능은 완비되어 있으나 **호출 진입점이 없어** dead 상태.

### 2.2 진입점 설계

**스킬 커맨드**: `/vais dashboard`

- 위치: `skills/vais/utils/dashboard.md` (신규)
- 동작: 사용자가 `/vais dashboard` 실행 시 Bash tool로 `node scripts/generate-dashboard.js` 실행 + 생성된 HTML 경로 stdout 출력
- 선택적 옵션:
  - `/vais dashboard --open` → 생성 후 `xdg-open`/`open` 시도 (OS 감지 후)
  - `/vais dashboard --feature=<name>` → 특정 피처만 필터

### 2.3 skill markdown 예시

```markdown
---
name: dashboard
description: VAIS 피처 진행 상황 HTML 대시보드 생성
---

# VAIS Dashboard

`.vais/dashboard.html`을 생성하여 모든 피처의 phase 진행, 산출물 링크, gate 결과를 시각화한다.

## 사용

\`\`\`bash
node scripts/generate-dashboard.js [project-dir]
\`\`\`

생성 위치: `.vais/dashboard.html`

브라우저로 열어 확인.
```

### 2.4 `skills/vais/SKILL.md` 진입점 등록

기존 SKILL.md의 utils 목록에 `dashboard.md` 추가.

### 2.5 `README.md` 업데이트 (05에서 병합)

플러그인 사용법 섹션에 `/vais dashboard` 예시 추가.

### 2.6 선택적 테스트

`tests/dashboard-command.test.js` (선택, ~50 LOC):
- `scripts/generate-dashboard.js`를 subprocess 실행
- `.vais/dashboard.html` 생성 확인
- HTML에 피처 이름이 포함되어 있는지 sanity check

### 2.7 검증

| # | 검증 | 방법 |
|---|------|------|
| V-1 | `skills/vais/utils/dashboard.md` 존재 | `ls` |
| V-2 | `skills/vais/SKILL.md`에 dashboard 진입점 등록 | `grep "dashboard" skills/vais/SKILL.md` |
| V-3 | `node scripts/generate-dashboard.js` 실행 시 `.vais/dashboard.html` 생성 | smoke test |

---

## 3. SEO Audit 활성화 (D2)

### 3.1 배경

`scripts/seo-audit.js` (206 LOC) + `scripts/auditors/*` 7 파일 + `seo-helpers.js` + `seo-scoring.js` = **약 1,575 LOC**의 SEO 감사 도구. Next.js 메타데이터, hreflang, Core Web Vitals, SSR 분석 등 광범위하게 커버.

`agents/cbo/seo-analyst.md`가 이를 호출한다는 명시 가이드 부재 → 런타임 미사용.

### 3.2 조치

**`agents/cbo/seo-analyst.md` 본문에 CLI 호출 가이드 추가** (~30 LOC 블록 신설):

```markdown
## SEO 감사 도구 사용

사용자 프로젝트의 SEO를 감사할 때 아래 CLI를 사용한다.

\`\`\`bash
# 전체 감사 (사람 친화 리포트)
node <plugin-root>/scripts/seo-audit.js <project-root>

# JSON 출력 (다른 도구 연계용)
node <plugin-root>/scripts/seo-audit.js <project-root> --json
\`\`\`

### 감사 항목 (A~O 카테고리)

- A~K: HTML 메타, sitemap, robots 등 기본 SEO
- L: 크롤러 접근성 (return null, 인증 게이트 탐지)
- M: SSR/CSR 렌더링 분석 (use client, dynamic ssr:false)
- N: Core Web Vitals 힌트 (next/image, CLS, 폰트)
- O: 국제화 SEO (hreflang, alternates, locale)

### 점수 해석 (scoring)

- 90 이상: 우수
- 70~89: 개선 여지
- 70 미만: 구조적 문제

출력 JSON의 `score`, `issues[]`, `recommendations[]`을 활용해 다음 작업(code 변경 또는 CMS 변경)의 우선순위를 결정한다.

### 자주 쓰는 플로우

1. 초기 감사: `seo-audit.js <root>` → 현재 상태 파악
2. 개선 작업: CPO/CTO와 협업하여 코드 수정
3. 재감사: 동일 명령 재실행 → 점수 상승 확인
```

### 3.3 참조 정리

- `scripts/seo-audit.js` 헤더 주석에 "호출 시점: CBO/seo-analyst agent markdown §SEO 감사 도구" 추가
- `CHANGELOG.md [0.55.0]`에 "SEO 감사 도구 활성화" 기록

### 3.4 검증

| # | 검증 | 방법 |
|---|------|------|
| V-1 | `agents/cbo/seo-analyst.md`에 "seo-audit" 호출 가이드 존재 | `grep "seo-audit" agents/cbo/seo-analyst.md` |
| V-2 | `node scripts/seo-audit.js <any-dir>` 실행 시 JSON 파싱 가능 | smoke test |
| V-3 | `scripts/auditors/*` 7 파일 전부 존재 | `ls scripts/auditors/` |

---

## 4. Carry-forward

**sub-plan 05 (CHANGELOG)**:
- Removed: `scripts/refactor-audit.js`, baseline JSON
- Added: `/vais dashboard` 스킬 커맨드, `seo-analyst.md`에 SEO 감사 CLI 가이드

**범위 밖 (v0.56+)**:
- dashboard에 gate activation(07) 결과 섹션 추가
- SEO auditor의 새 카테고리 (AI 검색 최적화 등)
- refactor-audit 재구현 (대규모 agent 리팩터가 다시 필요해질 때)
