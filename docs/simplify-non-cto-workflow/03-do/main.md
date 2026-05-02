---
owner: cto
agent: cto-direct
artifact: phase-index
phase: do
feature: simplify-non-cto-workflow
generated: 2026-05-02
summary: "v2.x 통합 모델 do 단계 1 진행. 정본 4 + 모듈 2 = 6 파일 변경. 35 파일 중 6 완료, 29 남음."
---

# simplify-non-cto-workflow — Do (구현 로그, 진행 중)

> Phase: 🔧 do | Owner: CTO (직접) | Date: 2026-05-02

## 한 줄 요약

design v1.0 의 7 spec 으로 실제 코드 변경 시작. 단계 1 (정본 + 모듈) 완료. 단계 2~6 진행 예정 (정책 / patch / C-Level / skill / 검증).

## 변경된 파일 (단계 1 — 6 파일)

| # | 파일 | 작업 | 핵심 변경 |
|---|------|------|----------|
| 1 | `agents/_shared/subdoc-guard.md` | 100% 재작성 | v0.58.4 → v2.0. `_tmp` 폐기, 직접 박제 규약, frontmatter 8 필드 표준 |
| 2 | `templates/main-md.template.md` | create | 5 섹션 표준 — Executive Summary / Decision Record / Artifacts / CEO 판단 근거 / Next Phase |
| 3 | `lib/ceo-algorithm.js` | create | CEO 7 차원 휴리스틱 + buildArtifactPlan + analyzeCEO entry |
| 4 | `docs/simplify-non-cto-workflow/03-do/main.md` | create | 본 문서 |
| 5 | `agents/_shared/clevel-main-guard.md` | v0.58.4 → v2.0 (50% 단순화) | Topic Documents → Artifacts 표, Size budget refuse → warn, Topic 프리셋 → CEO 알고리즘 |
| 6 | `agents/_shared/ideation-guard.md` | v0.x → v2.0 (30% 갱신) | CEO 7 차원 알고리즘 적용 + AskUserQuestion 클릭 + CBO/COO 명시 호출 정책 + 박제 형식 |

## Smoke Test — `lib/ceo-algorithm.js`

```bash
$ node -e "const ceo=require('./lib/ceo-algorithm');console.log(ceo.analyzeCEO({rawText:'결제 기능 만들고 싶어 OAuth + PCI', feature:'payment-flow'}))"
```

결과:
- 보안: **high** (결제/OAuth 매칭)
- 컴플라이언스: **high** (PCI 매칭)
- UX/데이터/외부통신/성능: low/medium
- 제품정의: medium (기능 추가)
- 활성 C-Level: **CEO + CPO + CTO + CSO** (CBO/COO 자동 X)
- artifactPlan: ~10 artifact (phase 별)

→ 7 차원 휴리스틱 정상. CBO/COO 자동 라우팅 제외 정상.

## 단계별 진행

### 단계 1: 정본 + 모듈 ✅ 완료

- [x] `agents/_shared/subdoc-guard.md` v2.0 정본
- [x] `templates/main-md.template.md` 신규
- [x] `lib/ceo-algorithm.js` 신규
- [x] `agents/_shared/clevel-main-guard.md` v2.0 (50% 단순화)
- [x] `agents/_shared/ideation-guard.md` v2.0 (30% 갱신)

### 단계 2: 정책 ✅ 완료

- [x] `CLAUDE.md` Rule #2/#3/#9/#11/#13/#14/#15 갱신 (v2.0 모델)
- [x] `vais.config.json` primary/secondary + autoRouting + phaseArtifactMapping + enforcement 완화 (subDocPolicy/cLevelCoexistencePolicy/scopeContractPolicy)
- [x] `.claude-plugin/plugin.json` description (4 Primary + 2 Secondary 명시)

### 단계 3: Validator ✅ 완료

- [x] `scripts/doc-validator.js` — `validateArtifactFrontmatter()` 신규 함수 (W-FRONT-00~05) + `formatFrontmatterWarnings()` + CLI 통합 + module.exports. 본 피처 16 artifact frontmatter 모두 검증 통과 (`frontmatterWarnings: []`)
- [x] `scripts/auto-judge.js` — judgeCPO v2.0 분기 (01-plan/prd.md 우선 검증, 없으면 v1.x fallback) + judgeAll v2.0 (primary 만 자동 판정, CBO/COO secondary 제외). smoke test 통과

> 정책 enforcement 완화는 vais.config.json 갱신으로 자동 적용됨 (단계 2):
> - `subDocPolicy.requireCurationRecord: true → false` (W-TPC-01 자동 비활성)
> - `cLevelCoexistencePolicy.mainMdMaxLinesAction: refuse → warn` (W-MAIN-SIZE 자연 강등)
> - `scopeContractPolicy.enforcement: fail → warn` (W-SCOPE 자연 강등)

### 단계 4: Patch 스크립트 + 실행 ⬜

- [ ] `scripts/patch-subdoc-block.js` --legacy / --dry-run 옵션 추가
- [ ] `scripts/patch-clevel-guard.js` 동일
- [ ] 실행 → 37 sub-agent md + 6 C-Level md 본문 갱신

### 단계 5: C-Level + Skill ⬜

- [ ] `agents/{ceo,cpo,cto,cso,cbo,coo}/{c-level}.md` Contract 갱신
- [ ] `skills/vais/SKILL.md` + `phases/{c-level}.md`

### 단계 6: 진입 가이드 + lib ⬜

- [ ] `lib/status.js` per-role mandatory phases
- [ ] `ONBOARDING.md` 4 Primary + 2 Secondary
- [ ] `AGENTS.md` 4 C-Suite

## 미완료 (다음 응답)

29 파일. 본 응답에서 한 응답 분량 한계로 단계 1 정본 부분 + 단계 2~6 다음으로.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | CTO do 단계 1 부분 — subdoc-guard v2.0 + main-md template + ceo-algorithm 모듈. smoke test 통과. 29 파일 미완. |
| v1.1 | 2026-05-02 | 단계 1 완료 — clevel-main-guard v2.0 + ideation-guard v2.0 추가. 6 파일 변경. 단계 2~6 (29 파일) 다음 세션. |
| v1.2 | 2026-05-02 | 단계 2 완료 — CLAUDE.md Rule v2.0 + vais.config.json (primary/secondary + phaseArtifactMapping + enforcement 완화) + plugin.json description. 3 파일. JSON 검증 통과. 누적 9 파일 변경 (35 중 9, 26 남음). |
| v1.3 | 2026-05-02 | 단계 3 부분 — doc-validator.js 갱신. validateArtifactFrontmatter() 신규 (W-FRONT-00~05 frontmatter 8 필드 검증). 정책 enforcement 완화는 vais.config.json 으로 자연 자동 적용. 본 피처 16 artifact frontmatter 모두 통과. auto-judge 는 다음. 누적 10/35. |
| v1.4 | 2026-05-02 | 단계 3 완료 — auto-judge.js v2.0. judgeCPO 에 v2.0 분기 추가 (01-plan/prd.md 우선 검증, fallback 호환). judgeAll 이 primary 만 자동 판정 (CBO/COO secondary 명시 호출만). 누적 11/35. 단계 4 (patch 실행) 매우 위험 — 다음 세션 권장. |
