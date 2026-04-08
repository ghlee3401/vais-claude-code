# CTO Design: agent-rename-v2

> CTO plan v1.0의 9-phase 실행 계획을 도구·정규식·커밋 단위로 구체화

## 0. 위임 구조

| 항목 | 결정 |
|------|------|
| **위임 sub-agent** | **없음** (CTO 직접 실행) |
| **사유** | rename 대상이 sub-agent 자체 — 위임 시 파일명/frontmatter 불일치로 호출 실패 위험 |
| **사용 도구** | Bash (git mv), Edit (치환, replace_all), Read, Grep |
| **대안 검토 (기각)** | ui-designer/infra-architect 위임 → UI/DB 변경 없으므로 부적합 |

## 1. 매핑 단일 진실 소스 (SoT)

```
OLD                    NEW                       CATEGORY
dev-backend         →  backend-engineer          CTO
dev-frontend        →  frontend-engineer         CTO
test-builder        →  test-engineer             CTO
bug-investigator    →  incident-responder        CTO
deploy-ops          →  release-engineer          CTO/COO
qa-validator        →  qa-engineer               CTO
validate-plugin     →  plugin-validator          CSO
compliance-audit    →  compliance-auditor        CSO/CFO
code-review         →  code-reviewer             CSO
perf-benchmark      →  performance-engineer      COO
sre-ops             →  sre-engineer              COO
canary-monitor      →  release-monitor           COO
docs-writer         →  technical-writer          COO/CTO/CPO
pricing-modeler     →  pricing-analyst           CFO
cost-analyst        →  finops-analyst            CFO
retro-report        →  retrospective-writer      CEO
pm-discovery        →  product-discoverer        CPO
pm-strategy         →  product-strategist        CPO
pm-research         →  product-researcher        CPO
pm-prd              →  prd-writer                CPO
```

## 2. 충돌 매트릭스 (Substring 위험 분석)

신규 이름이 다른 신규 이름의 부분 문자열인 경우 치환 순서가 중요:

| 신규 이름 | 다른 이름의 substring? | 치환 순서 |
|-----------|----------------------|-----------|
| `backend-engineer` | — | 어떤 순서든 OK |
| `frontend-engineer` | — | OK |
| `qa-engineer` | — | OK |
| `release-engineer` | `release-monitor`와 prefix 충돌 → ⚠️ | `release-engineer` 먼저 치환 |
| `release-monitor` | — | `release-engineer` 다음 |
| `compliance-auditor` | `compliance-audit`(OLD)의 superstring → ⚠️ | OLD `compliance-audit`를 먼저 정확 치환 |
| `code-reviewer` | `code-review`(OLD)의 superstring → ⚠️ | OLD `code-review` 먼저 정확 치환 |

**원칙**: OLD → NEW 치환 시 OLD가 NEW의 substring인 경우(`code-review` ⊂ `code-reviewer`), 단순 replace는 무한 확장 위험. **단어 경계 + 정확 매칭** 사용.

### 단어 경계 전략

bash `grep -E "\bcode-review\b"`는 `-`가 단어 문자가 아니므로 `\b` 위치가 `-` 양옆으로 잡혀 의도대로 동작 (검증됨). Edit 도구는 정규식 미지원이므로 **정확 문자열 + 컨텍스트 포함** 매칭 사용.

예:
- `Edit("code-review", "code-reviewer")` → ❌ 무한 확장 위험 (이미 `code-reviewer`가 있으면 `code-reviewerer`)
- `Edit("\"code-review\"", "\"code-reviewer\"")` → ✅ JSON 컨텍스트
- `Edit("- code-review\n", "- code-reviewer\n")` → ✅ 리스트 컨텍스트
- `Edit("`code-review`", "`code-reviewer`")` → ✅ 마크다운 인라인 코드

## 3. Phase별 실행 도구 매핑

### P1. 파일 rename (23건)

**Bash 단일 명령** (atomic):
```bash
git mv agents/cto/dev-backend.md agents/cto/backend-engineer.md && \
git mv agents/cto/dev-frontend.md agents/cto/frontend-engineer.md && \
git mv agents/cto/test-builder.md agents/cto/test-engineer.md && \
git mv agents/cto/bug-investigator.md agents/cto/incident-responder.md && \
git mv agents/cto/deploy-ops.md agents/cto/release-engineer.md && \
git mv agents/cto/qa-validator.md agents/cto/qa-engineer.md && \
git mv agents/cso/validate-plugin.md agents/cso/plugin-validator.md && \
git mv agents/cso/compliance-audit.md agents/cso/compliance-auditor.md && \
git mv agents/cso/code-review.md agents/cso/code-reviewer.md && \
git mv agents/coo/perf-benchmark.md agents/coo/performance-engineer.md && \
git mv agents/coo/sre-ops.md agents/coo/sre-engineer.md && \
git mv agents/coo/canary-monitor.md agents/coo/release-monitor.md && \
git mv agents/coo/docs-writer.md agents/coo/technical-writer.md && \
git mv agents/cfo/pricing-modeler.md agents/cfo/pricing-analyst.md && \
git mv agents/cfo/cost-analyst.md agents/cfo/finops-analyst.md && \
git mv agents/ceo/retro-report.md agents/ceo/retrospective-writer.md && \
git mv agents/cpo/pm-discovery.md agents/cpo/product-discoverer.md && \
git mv agents/cpo/pm-strategy.md agents/cpo/product-strategist.md && \
git mv agents/cpo/pm-research.md agents/cpo/product-researcher.md && \
git mv agents/cpo/pm-prd.md agents/cpo/prd-writer.md && \
git mv skills/vais/phases/dev-backend.md skills/vais/phases/backend-engineer.md && \
git mv skills/vais/phases/dev-frontend.md skills/vais/phases/frontend-engineer.md && \
git mv skills/vais/phases/qa-validator.md skills/vais/phases/qa-engineer.md
```

**검증**: `git status` → 23개 R(renamed) 표시 확인

### P2. Frontmatter `name:` 갱신 (23건)

각 rename된 파일의 첫 5줄 내 `name: {old}` → `name: {new}`:

```
Edit(file=agents/cto/backend-engineer.md, old="name: dev-backend", new="name: backend-engineer")
... (23회)
```

**검증**: `grep -rE "^name:" agents/ skills/vais/phases/ | sort` → 옛 이름 0건

### P3. agents/ 내부 교차 참조 (33 파일)

C-Level 에이전트(ceo/cpo/cto/cso/cmo/coo/cfo)와 일부 sub-agent 내부 텍스트가 다른 sub-agent를 참조함. 예:

- `agents/cto/cto.md`: "dev-frontend + dev-backend + test-builder Agent 병렬 호출"
- `agents/cso/cso.md`: "validate-plugin 위임"
- `agents/coo/coo.md`: "canary-monitor, perf-benchmark, sre-ops 위임"

**전략**: 파일별로 Read → 모든 OLD 단어를 NEW로 Edit (replace_all=true 사용 가능, **단 substring 충돌 항목은 컨텍스트 매칭**)

**충돌 주의 항목**:
- `code-review` → `code-reviewer`: replace_all 금지 (이미 reviewer가 있으면 무한 확장)
- `compliance-audit` → `compliance-auditor`: 동상

### P4. skills/vais/phases/ + utils/ (11 파일)

같은 방식으로 처리. 단 phases/cto.md는 위임 표 다수 포함 → 신중 검토.

### P5. vais.config.json (1 파일)

JSON 배열 항목 교체:

```json
"subAgents": ["dev-backend", "dev-frontend", ...]
→
"subAgents": ["backend-engineer", "frontend-engineer", ...]
```

`parallelGroups.implementation`, `parallelGroups.coo-do` 동일.

`autoKeywords`는 sub-agent 이름이 아닌 키워드라 변경 불필요 (확인 후 결정).

**검증**: `node -e "JSON.parse(require('fs').readFileSync('vais.config.json'))"` JSON 유효성

### P6. lib/ + scripts/ (5 파일)

- `lib/absorb-evaluator.mjs`: sub-agent 이름 문자열 매칭 로직 — 정확 치환
- `scripts/agent-start.js`: 동상
- `scripts/doc-validator.js`: 동상
- `scripts/generate-dashboard.js`: 동상
- `scripts/vais-validate-plugin.js`: 동상

### P7. 루트 문서 (3 파일)

- `CLAUDE.md`: 에이전트 테이블 (24+ 참조) — Read 후 일괄 Edit
- `AGENTS.md`: 동상 (~22 참조)
- `README.md`: 일부 참조

### P8. CHANGELOG + 버전 (4 파일)

- `CHANGELOG.md`: 신규 섹션 `## v0.48.0` + 매핑 표 + BREAKING CHANGE 명시
- 버전 동기화 7곳:
  1. `package.json` (version + claude-plugin.version)
  2. `vais.config.json` (version)
  3. `CHANGELOG.md`
  4. `output-styles/vais-default.md` (v0.47.1 표기)
  5. `skills/vais/SKILL.md` (있다면)
  6. `hooks/session-start.js` (있다면)
  7. `scripts/vais-validate-plugin.js` (있다면)

> 사용자 메모리 기준 7곳 체크리스트 준수

### P9. 검증

```bash
# 1. JSON 유효성
node -e "JSON.parse(require('fs').readFileSync('vais.config.json','utf8'))"

# 2. validate-plugin
node scripts/vais-validate-plugin.js

# 3. grep 잔존 (각 OLD 이름 0건)
for name in dev-backend dev-frontend test-builder bug-investigator deploy-ops \
            validate-plugin compliance-audit code-review perf-benchmark \
            pricing-modeler retro-report sre-ops pm-discovery pm-strategy \
            pm-research pm-prd canary-monitor docs-writer cost-analyst qa-validator; do
  hits=$(grep -rE "\b$name\b" agents/ skills/ lib/ scripts/ output-styles/ \
         CLAUDE.md AGENTS.md README.md vais.config.json 2>/dev/null | wc -l)
  echo "$name: $hits"
done
# 모두 0이어야 함

# 4. frontmatter name 일관성
for f in agents/*/*.md; do
  fname=$(basename "$f" .md)
  yname=$(grep "^name:" "$f" | sed 's/name: //')
  [ "$fname" != "$yname" ] && echo "MISMATCH: $f → name=$yname"
done
```

## 4. 실행 순서 (의존성 관점)

```
P1 (rename) → P2 (frontmatter) → P3-P7 (참조 치환, 병렬 가능) → P8 (changelog/version) → P9 (검증)
```

P1 먼저 하는 이유: rename 후 새 경로로 Read 가능. P2와 P3는 다른 파일을 건드리므로 충돌 없음.

## 5. 백업 / 롤백 전략

| 항목 | 백업 | 롤백 |
|------|------|------|
| **git** | rename 전 커밋 (`git status` clean) | `git reset --hard HEAD~1` |
| **`.vais/agent-state.json`** | `cp .vais/agent-state.json .vais/agent-state.json.bak` | `mv` 복구 |
| **현재 진행 피처** | 없음 (확인됨: agent-rename-v2 외 진행 피처 0) | — |

> ⚠️ 사용자 보안 룰: `git reset --hard`는 사용자 명시적 승인 없이 실행 금지. 롤백 필요 시 사용자 확인.

## 6. 커밋 전략 (CP-D 선택지)

### A. 단일 atomic 커밋
- **Pros**: 원자성, 마켓플레이스 배포 시 깨짐 없음
- **Cons**: 거대 diff (~80 파일), 리뷰 어려움
- **메시지**: `feat(agents)!: rename 20 sub-agents to industry-standard names (v0.48.0)`

### B. Phase별 분할 (3 커밋)
- C1: `feat(agents)!: rename 20 sub-agent files + frontmatter` (P1+P2)
- C2: `refactor(refs): update 52 files referencing renamed agents` (P3-P7)
- C3: `chore(release): v0.48.0 + CHANGELOG migration map` (P8)
- **Pros**: 리뷰 단위 명확, 단계별 잔존 검증 가능
- **Cons**: C1과 C2 사이는 빌드/검증이 깨진 상태 (atomic 아님)

### C. 카테고리별 분할 (5+ 커밋)
- C-Level별로 (CTO 6개 / CSO 3개 / COO 4개 / CFO 2개 / CEO 1개 / CPO 4개)
- **Pros**: blame 정확도 최고
- **Cons**: 중간 상태가 불일치 → CI 통과 불가

**권장: A. 단일 atomic 커밋** — 마켓플레이스 플러그인 특성상 원자성이 가장 중요.

## 7. 아키텍처 비교표 (CP-D 선택지)

| 비교 항목 | A. 단일 atomic | B. 3 커밋 분할 | C. 카테고리별 |
|----------|---------------|---------------|---------------|
| 접근 방식 | 한 번에 모든 변경 | rename / refs / release 단계 분할 | C-Level별 단계 분할 |
| 복잡도 | ⭐ 낮음 | ⭐⭐ 보통 | ⭐⭐⭐ 높음 |
| 원자성 | ✅ 완벽 | ⚠️ 중간 단계 깨짐 | ❌ 다단 깨짐 |
| 리뷰 편의 | ❌ 거대 diff | ⭐⭐⭐ 단계별 명확 | ⭐⭐⭐⭐ 도메인별 |
| 새 파일 수 | 23 (rename) | 23 | 23 |
| 수정 파일 수 | ~52 | ~52 | ~52 |
| 리스크 | 거대 PR 리뷰 누락 | 중간 커밋에서 빌드 깨짐 → 체크아웃 시 위험 | 중간 상태 불일치 다수 |
| 마켓플레이스 영향 | 안전 (한 번에 v0.48.0) | 안전 (마지막 커밋만 배포) | 동상 |

💡 **권장: A. 단일 atomic 커밋** — 마켓플레이스 플러그인은 어느 커밋에서 체크아웃해도 동작해야 하므로 atomic이 최적.

## 8. Success Criteria (Plan에서 상속 + 추가)

- (Plan에서 정의한 SC-01 ~ SC-07 그대로 유지)
- **SC-08 (Design 추가)**: 충돌 매트릭스의 `code-review`/`compliance-audit` superstring 항목이 정확 컨텍스트 매칭으로 치환되어 `code-reviewerer`/`compliance-auditorr` 같은 오염 0건

## 9. Decision Record

| 결정 | 선택 | 사유 |
|------|------|------|
| 위임 vs 직접 | 직접 | sub-agent rename 자체가 대상이라 dependency 충돌 |
| git mv vs cp+rm | git mv | history 보존 |
| 정규식 vs 정확 매칭 | 정확 매칭 + 컨텍스트 | Edit 도구 정규식 미지원, substring 충돌 회피 |
| 커밋 전략 | (CP-D에서 결정) | A/B/C 사용자 선택 |
| 버전 bump | v0.48.0 (BREAKING) | 외부 사용자 워크플로우 깨짐 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-08 | 초기 작성 — 9-phase 도구 매핑, 충돌 매트릭스, 커밋 전략 3옵션 |
| v1.1 | 2026-04-08 | CP-D 결정: A. 단일 atomic 커밋 채택. 커밋 메시지 `feat(agents)!: rename 20 sub-agents to industry-standard names (v0.48.0)` |
