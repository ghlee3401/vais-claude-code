---
owner: cto
agent: cto-direct
artifact: migration-guide
phase: report
feature: simplify-non-cto-workflow
generated: 2026-05-03
summary: "외부 vais-code 사용자가 v0.62 → v2.0 적용하는 단계별 가이드. Breaking change 0, 옵트인 정책, rollback 시나리오 포함."
---

# Migration Guide — v0.62 → v2.0

## TL;DR

**Breaking change 0건**. 외부 사용자는 v2.0 으로 업그레이드만 하면 즉시 동작. 옛 `_tmp/` 모델 사용자는 그대로 작동 (rollback 시나리오 보존).

## 단계별 적용

### Step 1: 플러그인 업그레이드

```bash
# Claude Code marketplace 갱신
/plugin update vais-code

# 검증 (0 errors / 0 warnings 기대)
node scripts/vais-validate-plugin.js
```

### Step 2: 자동 동작 변화 인지

| 기존 명령 | v2.0 동작 | 사용자 액션 |
|----------|----------|----------|
| `/vais ceo {feature}` | 7 차원 알고리즘 활성, AskUserQuestion 클릭만으로 phase 진행 | 그대로 사용. 자연어 명령어 입력 X |
| `/vais cto plan|design|do|qa|report {feature}` | mandatory PDCA 그대로 | 그대로 사용 |
| `/vais cpo {feature}` | CEO 가 활성화한 phase 만 실행 (mandatory 미적용) | 그대로 사용. 단, CEO 가 "이 피처는 CPO 활성 안 됨" 판단할 수도 있음 |
| `/vais cbo {feature}` | Secondary — CBO 자료 그대로 작동 (옵트인) | 그대로 사용. CEO 자동 라우팅에는 안 들어감 |
| `/vais coo {feature}` | 동일 (Secondary) | 그대로 사용 |

### Step 3: sub-doc 모델 적응 (자동)

옛 `_tmp/{slug}.md` 가 있는 기존 피처: 그대로 git 보존. v2.0 sub-agent 호출 시 새 위치 (`docs/{feature}/{phase}/{artifact}.md`) 에 직접 박제. **이전 _tmp 와 새 artifact 공존 OK**.

```bash
# 옛 _tmp 파일은 그대로 둠 (git 보존)
ls docs/old-feature/01-plan/_tmp/   # 옛 모델

# 새 피처는 v2.0 직접 박제
ls docs/new-feature/01-plan/        # main.md + artifact*.md (no _tmp)
```

### Step 4: main.md 점진 마이그레이션 (선택)

옛 v1.x 모델로 작성된 main.md (Topic Documents + Scratchpads 섹션 등) 는 그대로 동작 (`mainMdMaxLines = warn` 정책). 새 피처부터 자동으로 v2.0 인덱스 형식 적용.

기존 main.md 를 v2.0 로 재작성하고 싶다면:
```bash
# 템플릿 복사
cp templates/main-md.template.md docs/{feature}/01-plan/main.md.new
# {placeholder} 채우기 후 main.md 로 rename
```

> 강제 마이그레이션 X. 자연 마이그레이션 권장.

### Step 5: doc-validator 실행 (검증)

```bash
node scripts/doc-validator.js {feature}
# 기대: passed: true, frontmatterWarnings: []
# 잔여 W-MAIN-SIZE / W-MRG-03 경고는 옛 모델 잔존 — 차단 안 함
```

## 옵트인: CBO/COO 자료 보존

CBO/COO 가 자동 라우팅에서 빠졌지만 **자료는 보존**:
- `agents/cbo/cbo.md` + 10 sub-agent (market-researcher / pricing-analyst / financial-modeler / ...)
- `agents/coo/coo.md` + 8 sub-agent (release-notes-writer / ci-cd-configurator / runbook-author / ...)

사용자가 GTM/마케팅/재무/운영 필요 시 명시 호출 (`/vais cbo {feature}` 또는 `/vais coo {feature}`). 옛 v0.62 동작 그대로.

## Rollback (v2.0 → v0.62 복귀)

```bash
# 1. plugin 옛 버전 설치
/plugin install vais-code@0.62.0

# 2. patch 스크립트 legacy mode (rollback)
node scripts/patch-subdoc-block.js --legacy   # ⚠️ 미구현 — 본 PDCA 에서 not delivered
node scripts/patch-clevel-guard.js --legacy   # ⚠️ 동일

# 3. vais.config.json 옛 키 복원 (git checkout)
git checkout v0.62.x vais.config.json

# 4. doc-validator 옛 룰 복원
git checkout v0.62.x scripts/doc-validator.js scripts/auto-judge.js
```

> ⚠️ `--legacy` 옵션은 본 PDCA 에서 미구현. 다음 follow-up 피처에서 구현 권장 (rollback 시나리오 안전성).

## FAQ

| Q | A |
|---|---|
| 기존 `_tmp/` 폴더는 어떻게 하나요? | git 보존. 새 sub-agent 호출은 v2.0 모델로 새 위치에 박제. 자연 공존 |
| CBO/COO 호출이 자동 안 되는 이유는? | v2.0 코드 개발 도우미 정체성. CBO/COO 는 사용자 명시 호출 시만 — 보존하되 부담 ↓ |
| 옛 main.md 가 200줄 초과면 차단되나요? | 아니요. `mainMdMaxLinesAction = warn` 정책. 차단 안 함 |
| AskUserQuestion 강제는 옛날부터 있었나요? | v0.50+ 에 있었음. v2.0 은 자가 점검 블록 (응답 송신 직전) 추가로 강화 |
| 토큰 사용량이 변하나요? | sub-agent 직접 박제 + 큐레이션 폐기 → 약 50% 절감 추정 (다음 피처에서 실측) |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-03 | v0.62 → v2.0 5 단계 가이드 + 옵트인 정책 + Rollback 시나리오 + FAQ. Breaking change 0 입증. `--legacy` 옵션 미구현 명시 (follow-up). |
