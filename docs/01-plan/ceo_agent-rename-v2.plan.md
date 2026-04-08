# CEO Plan: agent-rename-v2

> 하위 에이전트 이름을 **업계 표준 직무명**으로 재정렬 (sub-agent-rename v1.1의 후속)

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 직전 `sub-agent-rename` 작업으로 모든 하위 에이전트가 2단어 kebab-case로 통일되었으나, 일부 이름이 업계 표준 직무명과 어긋나거나 VAIS 내부 조어로 남아 있어 마켓플레이스 검색성·외부 사용자 인지도가 떨어진다 |
| **Solution** | 30개 하위 에이전트 중 비표준/조어 ~10개를 업계 표준 직무명(`-engineer`, `-architect`, `-analyst`, `-auditor`, `-designer`, `-writer`, `-researcher`)으로 재정렬한다 |
| **Effect** | 마켓플레이스 검색 정확도 향상, Cursor/Copilot 등 호환 도구에서 직무 매칭 개선, 신규 사용자 온보딩 비용 감소 |
| **Core Value** | 일관된 품사(명사형 직무 접미사) + 업계 표준 직무 도메인 = "VAIS만의 조어" 제거 |

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 직전 1차 리네이밍은 "단어 수 통일"에 집중했지만 직무 표준화는 다루지 못함. 마켓플레이스 배포·외부 흡수 시 표준 용어가 핵심 |
| **WHO** | VAIS Code 사용자 (특히 외부 신규 사용자, 마켓플레이스 검색 사용자, Cursor/Copilot 사용자) |
| **RISK** | (1) 직전 작업을 일부 되돌리는 형태라 git history 노이즈 (2) `.vais/status.json` 진행 중 피처가 옛 에이전트명을 참조할 가능성 (3) 외부 docs/blog의 참조 깨짐 |
| **SUCCESS** | 모든 하위 에이전트가 `{도메인}-{표준 직무 접미사}` 패턴 준수 + `node scripts/vais-validate-plugin.js` 통과 + grep 잔존 참조 0건 |
| **SCOPE** | 에이전트 파일명/frontmatter + 모든 코드·설정·문서 참조 (영향 ~66개 파일) |

## 배경: 직전 작업과의 관계

`docs/01-plan/ceo_sub-agent-rename.plan.md` (v1.1, 2026-04-05) 에서 18개 에이전트를 단어1개 → 2단어 kebab-case로 통일했다. 본 작업은 그 결과 일부가 다음 문제를 가진다는 것을 직전 대화의 네이밍 평가에서 식별한 데서 출발한다:

| 문제 유형 | 사례 | 비율 |
|-----------|------|------|
| 비표준 접두사 (`dev-`) | `dev-backend`, `dev-frontend` | 2개 |
| 비표준 명사 (`-builder`, `-investigator`) | `test-builder`, `bug-investigator` | 2개 |
| 동사+명사 (역순) | `validate-plugin`, `compliance-audit`, `code-review` | 3개 |
| `-ops` 중복 | `sre-ops`, `deploy-ops` | 2개 |
| 약한 접두사 (`pm-`) | `pm-discovery`, `pm-strategy`, `pm-research`, `pm-prd` | 4개 |
| 명사+명사 어색 | `perf-benchmark`, `pricing-modeler`, `retro-report` | 3개 |

## 네이밍 매핑 후보 (CP-1에서 최종 확정)

### A. 변경 권장 (12개)

| # | 현재 | 후보안 | C-Level | 근거 |
|---|------|--------|---------|------|
| 1 | `dev-backend` | `backend-engineer` | CTO | 업계 표준 직무명 (Cursor/Copilot 에이전트 마켓에서도 동일 패턴) |
| 2 | `dev-frontend` | `frontend-engineer` | CTO | 동상 |
| 3 | `test-builder` | `test-engineer` (또는 `sdet`) | CTO | SDET = Software Dev Engineer in Test, 업계 표준 |
| 4 | `bug-investigator` | `incident-responder` | CTO | SRE/DevOps 표준 직무. 디버깅 + RCA 포함 의미 |
| 5 | `deploy-ops` | `release-engineer` | CTO/COO | 업계 표준 (Release Engineering). `-ops` 중복 제거 |
| 6 | `validate-plugin` | `plugin-validator` | CSO | 동사 → 명사형 통일 |
| 7 | `compliance-audit` | `compliance-auditor` | CSO/CFO | 동사 → `-er` 직무 형태 |
| 8 | `code-review` | `code-reviewer` | CSO | 동상 |
| 9 | `perf-benchmark` | `performance-engineer` | COO | 업계 표준 (Performance Engineering) |
| 10 | `pricing-modeler` | `pricing-analyst` | CFO | `-analyst`가 보편 |
| 11 | `retro-report` | `retrospective-writer` | CEO | `-writer`로 직무 명확화 |
| 12 | `sre-ops` | `sre-engineer` | COO | SRE 자체가 Site Reliability Engineering이므로 `-engineer` 부착이 자연스러움 |

### B. 논쟁 (사용자 결정 필요)

| # | 현재 | 후보안 | 사유 |
|---|------|--------|------|
| 13 | `pm-discovery` | `product-discovery` 또는 유지 | `pm-` 접두사가 Product/Project 모호. 단, `pm-*` 4종이 한 묶음이라 일괄 처리 필요 |
| 14 | `pm-strategy` | `product-strategist` | 동상 |
| 15 | `pm-research` | `market-researcher` | "market-researcher"는 마케팅 직무와 충돌 가능 → `product-researcher`도 후보 |
| 16 | `pm-prd` | `prd-writer` | 산출물 기반 명명 |
| 17 | `canary-monitor` | `release-monitor` 또는 유지 | `canary`는 deployment 패턴 명사로 충분히 알려져 있어 유지 가능 |
| 18 | `docs-writer` | `technical-writer` | "Technical Writer"가 표준이지만 `docs-writer`도 충분히 명확 |
| 19 | `cost-analyst` | `finops-analyst` | FinOps 영역에서는 후자가 더 통용. 단, 일반 사용자에게는 `cost-analyst`가 더 직관적 |

### C. 변경하지 않음 (이미 표준)

`security-auditor`, `seo-analyst`, `copy-writer`, `growth-analyst`, `data-analyst`, `ux-researcher`, `ui-designer`, `infra-architect`, `db-architect`, `qa-validator`, `skill-validator`, `absorb-analyzer` (12개)

> 단, `qa-validator`는 `qa-engineer`도 후보로 검토 가능 (CP-1 논의 시 사용자 의견 청취)

## 일관된 네이밍 패턴 (제안)

```
{도메인}-{직무 접미사}

도메인 (어떤 영역인가):
  backend, frontend, infra, db, security, ui, ux, qa, seo, growth, copy,
  perf(performance), release, sre, finops, pricing, data, plugin, code,
  compliance, test, incident, retrospective, prd, product, ...

직무 접미사 (무엇을 하는가):
  -engineer    : 구현·운영
  -architect   : 설계·구조
  -analyst     : 분석·평가
  -auditor     : 감사·검증
  -designer    : 디자인
  -writer      : 문서 작성
  -researcher  : 리서치
  -validator   : 검증 (자동화 위주)
  -monitor     : 모니터링
  -investigator: 조사 (예외, 기존 유지 검토)
```

## 영향 범위 분석

### 변경 대상 파일

| 카테고리 | 예상 파일 수 | 설명 |
|----------|-------------|------|
| **에이전트 파일명 (rename)** | 12 | A안 채택 시. B안까지 가면 19 |
| **에이전트 frontmatter `name:`** | 12~19 | 위 동상 |
| **C-Level 에이전트 내부 참조** | ~10 | ceo, cto, cso, cmo, coo, cfo, cpo |
| **`vais.config.json`** | 1 | `subAgents`, `parallelGroups`, `autoKeywords` |
| **`package.json`** | 1 | claude-plugin agents 등록 (있다면) |
| **스킬 phase/utils 파일** | ~5 | `skills/vais/phases/`, `skills/vais/utils/` |
| **`SKILL.md`** | 1 | 에이전트 목록 |
| **lib 코드** | 2~3 | `lib/absorb-evaluator.mjs`, `lib/status.js` 등 |
| **scripts** | ~17 | `scripts/` 내 참조 |
| **CLAUDE.md / AGENTS.md** | 2 | 에이전트 테이블 |
| **Templates** | ~5 | `templates/*.template.md` 내 참조 |
| **Output styles** | ~1 | `output-styles/` |

**총 영향 파일: ~66개** (grep 기반 사전 측정)

### 변경하지 않는 영역

- C-Level 에이전트 (ceo, cpo, cto, cso, cmo, coo, cfo) — 직전 작업과 동일
- C군의 12개 (이미 표준)
- `basic/`, `vendor/`, `references/` 디렉토리
- `docs/` 내 과거 plan 문서 (역사 기록 보존)

### git history 영향

`git mv`로 파일명 변경 시 history 추적 가능하나, 직전 `sub-agent-rename` 커밋(083e220 이전)과 본 커밋이 같은 파일을 두 번 rename하는 형태가 됨. blame 정확도가 일부 떨어질 수 있음.

## 트레이드오프

| 옵션 | 장점 | 단점 |
|------|------|------|
| **A. 최소** — A안 12개만 변경 | 명백한 비표준만 정리. 영향 최소 (~50파일). 논쟁 회피 | 일부 어색한 이름(`pm-*`, `canary-monitor`) 잔존 |
| **B. 표준** — A+B안 19개 변경 | `pm-*` 접두사 모호성까지 해결. 가장 일관된 결과 | 영향 ~66파일. 사용자 결정 필요 항목 다수 |
| **C. 확장** — A+B + 추가 검토(`qa-validator`→`qa-engineer` 등) | 완전한 업계 표준화 | 직전 작업을 거의 전부 되돌리는 셈. git noise 큼 |

## 담당 C-Level

| 역할 | 담당 |
|------|------|
| **CEO** | 네이밍 컨벤션 결정 + 직전 작업과의 충돌 분석 + 사용자 합의 |
| **CTO** | 실행 — 파일 rename, frontmatter, 코드/스크립트/문서 일괄 수정, validate-plugin 검증 |

> CPO/CSO/CMO/COO/CFO 불필요 (순수 기술 리팩터링)

## 리스크 및 대응

| 리스크 | 심각도 | 대응 |
|--------|--------|------|
| 직전 plan 결과 일부 되돌림 → git history 노이즈 | 중 | 커밋 메시지에 "v1.1 후속, 업계 표준 채택" 명기 + plan 문서로 의도 보존 |
| `.vais/status.json` 옛 이름 참조 | 저 | 마이그레이션 스크립트 또는 status 초기화 (현재 진행 중 피처 없음 확인됨) |
| 누락된 참조로 런타임 에러 | 중 | CTO Phase 8(검증)에서 grep 전수 검사 + `node scripts/vais-validate-plugin.js` 통과 필수 |
| 외부 docs/blog 깨짐 | 저 | CHANGELOG.md에 매핑 표 명시 |
| 새 이름이 또 어색하다는 피드백 | 중 | CP-1에서 사용자가 옵션별·항목별로 거부 가능하도록 설계 |

## 다음 단계

CP-1 통과 후 → CTO에게 phase별 순차 위임:
```
/vais cto plan agent-rename-v2
/vais cto design agent-rename-v2
/vais cto do agent-rename-v2
/vais cto qa agent-rename-v2
```

## CP-1 결정 (2026-04-08)

**선택: C. 확장 (Extended)** — A안 12 + B안 7 + 추가 검토 항목 포함, 완전한 업계 표준화 추구.

### 확장 범위 추가 후보

| # | 현재 | 후보안 | 사유 |
|---|------|--------|------|
| 20 | `qa-validator` | `qa-engineer` | "QA Engineer"가 가장 표준. validator는 자동화 도구 뉘앙스 |
| 21 | `skill-validator` | (유지) | 자동화 검증 도구이므로 `-validator` 적절 |
| 22 | `infra-architect` | (유지) | 이미 표준 |
| 23 | `db-architect` | (유지) | 이미 표준 |
| 24 | `absorb-analyzer` | (유지) | VAIS 내부 도메인 특수, 외부 표준 부재 |

### 최종 확정 매핑 (CTO Plan에서 최종 검토)

| # | 현재 | 신규 | C-Level |
|---|------|------|---------|
| 1 | `dev-backend` | `backend-engineer` | CTO |
| 2 | `dev-frontend` | `frontend-engineer` | CTO |
| 3 | `test-builder` | `test-engineer` | CTO |
| 4 | `bug-investigator` | `incident-responder` | CTO |
| 5 | `deploy-ops` | `release-engineer` | CTO/COO |
| 6 | `validate-plugin` | `plugin-validator` | CSO |
| 7 | `compliance-audit` | `compliance-auditor` | CSO/CFO |
| 8 | `code-review` | `code-reviewer` | CSO |
| 9 | `perf-benchmark` | `performance-engineer` | COO |
| 10 | `pricing-modeler` | `pricing-analyst` | CFO |
| 11 | `retro-report` | `retrospective-writer` | CEO |
| 12 | `sre-ops` | `sre-engineer` | COO |
| 13 | `pm-discovery` | `product-discoverer` | CPO |
| 14 | `pm-strategy` | `product-strategist` | CPO |
| 15 | `pm-research` | `product-researcher` | CPO |
| 16 | `pm-prd` | `prd-writer` | CPO |
| 17 | `canary-monitor` | `release-monitor` | COO |
| 18 | `docs-writer` | `technical-writer` | COO/CTO/CPO |
| 19 | `cost-analyst` | `finops-analyst` | CFO |
| 20 | `qa-validator` | `qa-engineer` | CTO |

**총 20개 변경**, 영향 파일 ~70~80개 추정.

> 항목별 거부/수정은 CTO `plan` 단계에서 한 번 더 확인 가능 (CP-1).

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-08 | 초기 작성 — 직전 sub-agent-rename v1.1의 후속 작업 정의, 19개 후보(A안 12 + B안 7) |
| v1.1 | 2026-04-08 | CP-1 결정: C. 확장 채택. 최종 20개 매핑 확정 (qa-validator→qa-engineer 추가) |
