---
owner: cto
agent: cto-direct
artifact: tech-risks
phase: plan
feature: simplify-non-cto-workflow
generated: 2026-05-02
summary: "v2.x 통합 모델의 위험 5건 + 완화 + rollback. 가장 큰 위험 = subdoc-guard 100% 재작성으로 인한 sub-agent 동작 변경."
---

# Tech Risks — v2.x 위험 + Rollback

## 한 줄 요약

위험 5건. 가장 큰 위험 = subdoc-guard 100% 재작성 (37 sub-agent 본문 영향). 완화 = patch 스크립트 + 단계적 적용 + rollback 시나리오.

## R-1 (HIGH) — subdoc-guard 100% 재작성으로 sub-agent 동작 변경

### 영향

37 sub-agent 의 본문에 inline 주입된 SUB-DOC RULES 블록이 새 spec 으로 전체 교체. 기존 sub-agent 호출 시 동작 변경 가능.

### 시나리오

- 기존 _tmp/{slug}.md 박제 → 새 docs/{feature}/{phase}/{artifact}.md 박제
- 큐레이션 기록 섹션 자동 생성 → 폐기
- handoff 형식 (scratchpadPath → artifacts) 변경

### 완화

| 단계 | 조치 |
|------|------|
| 1 | `patch-subdoc-block.js` 갱신 + dry-run 모드로 변경 미리보기 |
| 2 | 모든 37 sub-agent md 본문 새 블록 일괄 교체 |
| 3 | 회귀 테스트 — 각 sub-agent 1번씩 호출 → 박제 위치 / frontmatter 검증 |
| 4 | 단계적 도입 — `vais.config.json > orchestration.subdocV2.enabled` (기본 true, 옵트아웃 가능) |

### Rollback

- git revert + patch 스크립트 옛 버전 재실행 → 옛 SUB-DOC RULES 블록 복원
- 기존 `_tmp/` 산출물 (있으면) 그대로 보존 → 옛 모델 호환

### 잔존 위험

낮음 — patch 스크립트 + dry-run + 옵트아웃.

---

## R-2 (MEDIUM) — CEO 알고리즘 7 차원 변경으로 라우팅 결과 다름

### 영향

기존 6 C-Suite 자동 라우팅 → 4 C-Suite + 2 선택 활성. 사용자가 옛 모델 기대했다면 "왜 CBO 안 거치지?" 의문.

### 완화

| 단계 | 조치 |
|------|------|
| 1 | CEO ideation 응답에 "CBO/COO 자동 라우팅 제외 — 명시 호출 (`/vais cbo ...`) 가능" 1줄 명시 |
| 2 | ONBOARDING.md 워크플로우 예시에 "CBO/COO 활성 시나리오" 섹션 |
| 3 | 사용자 override 가능 — AskUserQuestion 옵션에 "CBO/COO 추가" 포함 |

### 잔존 위험

매우 낮음 — 명시적 안내 + override.

---

## R-3 (MEDIUM) — main.md 인덱스 모델 + W-MAIN-SIZE 폐기

### 영향

기존 main.md 가 본문 포함 → 인덱스만으로 변경. doc-validator 의 W-MAIN-SIZE refuse → 폐기.

### 시나리오

- C-Level 이 main.md 작성 시 "본문도 포함해야지" 라고 잘못 작성 → 200줄 초과
- 외부 사용자가 옛 main.md 형식 따름 → 호환성

### 완화

| 단계 | 조치 |
|------|------|
| 1 | `templates/main-md.template.md` (신규) — 5 섹션 표준 |
| 2 | C-Level agent md 의 본문에 "main.md = 인덱스만" 명시 |
| 3 | doc-validator 의 W-MAIN-SIZE = warn (refuse 아님). 200줄 초과 시 자연 가이드만 |
| 4 | W-IDX-01 = "Artifacts 섹션 검사" 로 변경 (옛 Topic Documents 검사 대체) |

### 잔존 위험

낮음 — 템플릿 + 명시 + 자동 가이드.

---

## R-4 (LOW) — frontmatter 표준 8 필드 누락

### 영향

sub-agent 가 artifact MD 작성 시 frontmatter 일부 누락 → C-Level 이 main.md 인덱스 작성 시 정보 부족.

### 완화

| 단계 | 조치 |
|------|------|
| 1 | doc-validator 가 8 필드 검사 (필수 6 / 조건부 2) |
| 2 | 누락 시 ERROR (필수) 또는 WARN (조건부) |
| 3 | sub-agent md 의 본문 SUB-DOC RULES 블록에 명시 |

### 잔존 위험

매우 낮음 — validator 검증.

---

## R-5 (LOW) — 외부 marketplace 사용자 호환성

### 영향

vais-code = Claude Code marketplace plugin. 외부 사용자가 v0.6x 사용 시 v2.x 변경 영향?

### 완화

| 단계 | 조치 |
|------|------|
| 1 | breaking change 평가 결과 모두 ❌ (impact-analysis.md §Breaking Change) |
| 2 | CHANGELOG.md 에 변경 명시 (Added / Changed / Removed) |
| 3 | 옵트아웃 — `vais.config.json > orchestration.legacyV1.enabled` (옛 모델 호환, 기본 false) |
| 4 | major bump (v0.62.x → v0.70.0 또는 v1.0.0) |

### 잔존 위험

매우 낮음 — 옵트아웃 + major bump.

---

## 위험 매트릭스

| ID | 가능성 | 영향 | 등급 | 완화 후 |
|----|:-----:|:----:|:----:|:------:|
| R-1 | High | High | High | Low |
| R-2 | Medium | Medium | Medium | Very Low |
| R-3 | Medium | Medium | Medium | Low |
| R-4 | Medium | Low | Low | Very Low |
| R-5 | Low | Medium | Low | Very Low |

## Rollback 시나리오 (전체)

본 피처 적용 후 critical 문제 발견 시:

```bash
1. git revert {본 피처 commit}
2. node scripts/patch-subdoc-block.js --legacy   # 옛 블록 복원
3. node scripts/patch-clevel-guard.js --legacy   # 옛 블록 복원
4. vais.config.json 옛 키 복원 (cSuite.primary/secondary 제거)
5. doc-validator / auto-judge 옛 룰 복원
6. CHANGELOG.md 에 rollback entry
```

또는:

```bash
# 옵트아웃 (rollback 없이)
vais.config.json > orchestration.legacyV1.enabled = true
```

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | 위험 5건 + 매트릭스 + 완화 + rollback 시나리오. R-1 (subdoc-guard 재작성) High → Low. |
