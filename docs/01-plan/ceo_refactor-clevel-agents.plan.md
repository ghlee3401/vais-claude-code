# refactor-clevel-agents - 기획서

> ⛔ **Plan 단계 범위**: 이 문서는 분석과 결정만 기록합니다. 프로덕트 파일 생성·수정은 Do 단계에서 수행하세요.

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 7개 C-Level 에이전트 파일(총 3,450줄)이 비대하고 공통 규칙·체크포인트·필수 문서 규약이 중복 복제되어 있다. CEO(696), CTO(702)는 `skill_eval` BODY_WARN_LINES=500을 초과해 경고 상태. |
| **Solution** | 공통 보일러플레이트를 추출하되, **sub-agent 프롬프트 주입 메커니즘의 특성상 `@see` 참조가 자동 전개되지 않는** 점을 고려하여 "인라인 압축"을 1차, "명시적 Read 지시 + shared 파일" 을 2차 전략으로 조합한다. 내용 손실 0건이 핵심 제약. |
| **Function/UX Effect** | C-Level 응답 품질 유지 + 파일 가독성/유지보수성 향상 + skill_eval WARN 해소. 사용자 체감 변화는 없어야 함(규칙 보존). |
| **Core Value** | 유지보수 비용 감소, 향후 새 C-Level/규칙 추가 시 중복 수정 필요 없음, skill_eval 품질 게이트 통과. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 공통 규칙 수정 시 7곳을 동시에 고쳐야 함 → 누락/불일치 발생 위험. CEO/CTO는 skill_eval WARN 상태(이미 `cso_skill-validator-absorption.qa.md`에서 별도 이슈로 분리됨). |
| **WHO** | 플러그인 유지보수자 (1차). 간접적으로 모든 /vais 사용자(규칙 일관성 향상). |
| **RISK** | ⚠️ **최상위 리스크**: 리팩터링 과정에서 규칙 문구가 누락·약화되어 sub-agent 실행 시 강제력이 사라지는 것. AskUserQuestion 강제, CP 멈춤, Plan 범위 제한 등은 **문자 그대로** 유지되어야 함. |
| **SUCCESS** | ① 7개 파일 모두 skill_eval WARN(<500줄) 해소 ② 기존 규칙 0건 손실 (diff 기반 매핑표로 검증) ③ 기존 피처 파이프라인 regression 없음 |
| **SCOPE** | `agents/{c-level}/{c-level}.md` 7개 본문만. frontmatter·파일명·경로 **불변**. 하위 실행 에이전트(backend-engineer 등) 및 skills/phases/*.md 는 이번 범위 밖. |

---

## 0. 아이디어 개요

### 아이디어 한 줄 설명
> 7개 C-Level 에이전트 파일의 중복 보일러플레이트와 장황한 프레임워크 섹션을 안전하게 추출/압축하여 각 파일을 500줄 이하로 줄이되, 규칙의 강제력은 100% 보존한다.

### 배경 (왜 필요한지)
- **현재 문제**: 3,450줄 중 약 650~1,050줄이 7개 파일에 반복 복제. 공통 규칙 1건 수정 = 7곳 수정 필요.
- **기존 해결책의 한계**: 과거 `cto_cto-plan-prd-consumption.do.md:57` 에서 "CP 템플릿이 cto.md에 인라인 — skills/vais/utils/cp-templates.md 추출 검토(V2)"로 deferred 된 이슈.
- **이 아이디어가 필요한 이유**: (1) skill_eval WARN 상태 해소 필요, (2) 규칙 일관성 보장, (3) 새 규칙 추가 비용 절감.

### 타겟 사용자
- **주요**: 플러그인 유지보수자 (CEO/CTO 에이전트 정의 수정하는 개발자)
- **보조**: /vais 사용자 (간접 — 더 일관된 규칙 경험)
- **Pain Point**: "규칙 한 줄 고치려고 7개 파일 열어야 함", "새 CP 추가 시 어느 파일에 몇 번째 CP로 넣어야 할지 혼동"

### 사용자 시나리오
1. **상황**: 유지보수자가 "AskUserQuestion 강제 규칙"을 강화하려 한다
2. **행동**: 현재는 7개 파일을 각각 편집해야 함 → 리팩터링 후에는 1곳(공통 섹션) 또는 인라인 압축본 7개를 동일 패턴으로 sed 가능
3. **결과**: 규칙 불일치 버그 감소, PR 리뷰 범위 축소

## 0.5 MVP 범위

### 핵심 기능 브레인스토밍 (중요도/난이도 매트릭스)

| 기능 | 중요도 | 난이도 | MVP 포함 |
|------|--------|--------|---------|
| F1. 인라인 중복 문구 압축 (공통 규칙, 단계별 실행 모드, 체크포인트 멈춤 규칙) | 5 | 2 | Y |
| F2. 종료 전 문서 체크리스트 표 압축 | 4 | 1 | Y |
| F3. CEO/CTO 파일 고유 섹션 구조 재정비 (서비스 런칭 모드, PDCA 표 등) | 5 | 3 | Y |
| F4. CSO 법적 컴플라이언스 체크리스트 추출 → `shared/frameworks/compliance-checklist.md` + 에이전트에서 명시 Read 지시 | 3 | 4 | N (2차) |
| F5. CMO GTM / CFO 가격책정 / COO CI/CD 프레임워크 추출 | 3 | 4 | N (2차) |
| F6. 공통 규칙 별도 파일화 (shared/common-rules.md) | 3 | 5 | N (3차 — 리스크 분석 후) |
| F7. `scripts/refactor-audit.js` — before/after 규칙 keyword 검증 스크립트 | 5 | 2 | Y |

### MVP 포함 기능
- **F1, F2, F3, F7**: 인라인 압축 + 감사 스크립트. 외부 파일 의존성 없음 → sub-agent 주입 리스크 제로.
- 목표: 7개 파일 모두 500줄 이하, 중복 규칙 keyword 100% 보존.

### 이후 버전으로 미룰 기능
- **F4, F5**: 도메인 프레임워크 추출. sub-agent 프롬프트에서 명시 Read가 안정적임을 MVP로 검증한 뒤 추진.
- **F6**: 공통 규칙 외부 파일화. sub-agent 주입 시 외부 파일 로드 보장 어려움 → 검증된 패턴 확보 후.

## 0.6 경쟁/참고 분석

| 서비스 | 유사 기능 | 장점 | 단점 | 차별화 포인트 |
|-------|----------|------|------|--------------|
| Claude Code 공식 에이전트 | 단일 파일 구조 | 단순 | 중복 허용 | 본 리팩터링은 압축으로 단순성 유지 |
| Cursor `.cursor/rules/` | 다파일 rule 분리 | 재사용성 | rule 로드 순서 의존 | 우리는 sub-agent 실행 경로가 단일 파일 주입이라 분리가 부적합 |
| `cto_cto-plan-prd-consumption.do.md:57` | 동일 이슈 deferred 기록 | 이미 문제 인식 | 미해결 | 본 기획이 그 후속 |

## 0.7 PRD 입력 (CTO 전용)
(N/A — CEO 전용 기획서)

## 1. 개요

### 1.1 기능 설명
> 7개 C-Level 에이전트 파일의 중복/장황 섹션을 **인라인 압축** 방식으로 재구성하여 각 파일을 500줄 이하로 줄이고, 동시에 before/after keyword diff 감사로 규칙 손실 0건을 보장한다.

### 1.2 목적
- **해결하려는 문제**: 파일 비대화, 중복 복제, skill_eval WARN
- **기대 효과**: 유지보수 비용 50%+ 감소, 규칙 일관성 보장, WARN 해소
- **대상 사용자**: 유지보수자

## 2. Plan-Plus 검증

### 2.1 의도 발견
> "파일이 크다"가 본질이 아니라 **"규칙이 복제되어 있어 일관성 관리가 어렵다"** 가 근본 문제. 단순 라인 수 감축은 부차적 지표.

### 2.2 대안 탐색

| # | 대안 | 장점 | 단점 | 채택 여부 |
|---|------|------|------|----------|
| 1 | **인라인 압축만** (외부 파일 없음) | sub-agent 주입 리스크 제로, 즉시 검증 가능 | 근본적 중복 해소 한계 | ✅ MVP 채택 |
| 2 | shared/common-rules.md + 각 에이전트가 명시 Read | 진정한 DRY | sub-agent 첫 단계에 Read 호출 강제 → 실패 시 규칙 미적용 리스크 | ⏸ 2차 검토 |
| 3 | 빌드 타임 include 생성기 (소스 분리, 배포 시 합치기) | DRY + 런타임 리스크 0 | 빌드 파이프라인 복잡도 증가, CLAUDE.md "frontmatter 변경 금지" 정책과 충돌 가능 | ❌ 기각 |
| 4 | 프레임워크 섹션(GTM/Pricing/Compliance) 만 먼저 추출 | 도메인별 분리 명확 | 공통 규칙은 여전히 중복 | ⏸ 2차 (MVP 후) |

### 2.3 YAGNI 리뷰
- [x] 현재 필요한 것만: 인라인 압축 + 감사 스크립트
- [x] 과잉 설계 없음: 빌드 시스템 도입 지양
- [x] 제거 가능: 외부 파일 분리는 검증 후 도입
- **제거 후보**: 3차 범위의 shared/common-rules.md 는 본 플랜에서 제외

## 3. 사용자 스토리

| # | As a... | I want to... | So that... |
|---|---------|-------------|------------|
| 1 | 플러그인 유지보수자 | 공통 규칙을 한 곳에서 확인하고 싶다 | 7개 파일을 대조하지 않아도 된다 |
| 2 | /vais 사용자 | 모든 C-Level이 동일한 체크포인트 경험을 제공하기를 원한다 | 규칙 불일치로 인한 혼란이 없다 |
| 3 | 플러그인 검증자 | skill_eval WARN이 없기를 원한다 | 품질 게이트 통과가 깔끔하다 |

## 4. 기능 요구사항

### 4.1 기능 목록

| # | 기능 | 설명 | 관련 파일 | 우선순위 | 상태 |
|---|------|------|----------|---------|------|
| F1 | 공통 보일러플레이트 인라인 압축 | 최우선 규칙/단계별 실행 모드/Plan 범위 제한/필수 문서/체크포인트 규칙 표 등 압축 | `agents/{7}/{c}.md` | Must | 미구현 |
| F2 | 종료 전 문서 체크리스트 통합 표준화 | phase별 산출물 표를 공통 양식으로 통일 | 7개 | Must | 미구현 |
| F3 | CEO/CTO 고유 섹션 재정비 | 서비스 런칭 모드, 동적 라우팅, PDCA 표 등 장황 섹션 압축 | `ceo.md`, `cto.md` | Must | 미구현 |
| F7 | refactor-audit 스크립트 | before/after keyword 100% 보존 자동 검증 | `scripts/refactor-audit.js` (신규) | Must | 미구현 |

### 4.2 기능 상세

#### F1. 공통 보일러플레이트 인라인 압축
- **트리거**: Do 단계 Edit 호출
- **정상 흐름**: (1) baseline keyword extract → (2) 표 형태로 압축 → (3) 동일 keyword 보존 확인
- **예외 흐름**: keyword 누락 감지 시 → 즉시 중단, 원본 복원
- **산출물**: 7개 파일의 압축본 + baseline-keywords.txt

#### F3. CEO/CTO 고유 섹션 재정비
- **트리거**: F1 완료 후
- **정상 흐름**: (1) CEO 서비스 런칭 모드 다이어그램 압축 (2) CTO CP 템플릿 펜스 → 표 변환 (3) PDCA 표 합병
- **예외 흐름**: CP ID (CP-1/CP-2/CP-Q/CP-R/CP-A/CP-L2) 중 하나라도 사라지면 중단

#### F7. refactor-audit 스크립트
- **트리거**: Do 단계 완료 시 수동 실행
- **정상 흐름**: (1) pre-refactor snapshot(`git show HEAD:agents/...`) vs working tree diff (2) 규칙 keyword 리스트 grep (3) 모든 CP ID, "AskUserQuestion", "Plan 단계 범위", "종료 전 필수 문서" 등 필수 토큰 매칭 횟수 비교
- **예외 흐름**: 매칭 횟수 감소 시 exit 1
- **산출물**: `docs/03-do/ceo_refactor-clevel-agents.audit.txt`

## 5. 정책 정의

### 5.1 비즈니스 규칙

| # | 정책 | 규칙 | 비고 |
|---|------|------|------|
| 1 | frontmatter 불변 | name/version/description/model/tools 등 변경 금지 | CLAUDE.md "Do NOT" |
| 2 | CP ID 보존 | CP-1, CP-2, CP-Q, CP-R, CP-A, CP-L2, CP-0(CTO), CP-D, CP-G 등 모두 유지 | 기존 동작 보장 |
| 3 | 규칙 문구 keyword 보존 | "AskUserQuestion", "반드시", "절대 금지", "Plan 단계 범위" 등 강제 keyword 총 출현 횟수 ≥ baseline | F7 감사 |
| 4 | 파일 경로 불변 | `agents/{c-level}/{c-level}.md` 경로 유지 | skill/phase loader 의존 |
| 5 | 본문 500줄 이하 | skill_eval BODY_WARN_LINES=500 이하 | 전 파일 적용 |
| 6 | 외부 파일 의존성 금지 (MVP) | Read/include 없이 인라인만 | sub-agent 주입 리스크 회피 |

### 5.3 유효성 검증 규칙

| 필드 | 규칙 | 에러 시 조치 |
|------|------|------------|
| 본문 라인 수 | ≤ 500 | skill_eval FAIL 시 재압축 |
| CP ID 출현 | baseline과 동일 | 누락 시 복원 |
| frontmatter | 변경 없음 | diff 기반 차단 |

## 6. 비기능 요구사항

| 항목 | 요구사항 | 기준 |
|------|---------|------|
| 품질 | skill_eval WARN 0건 | `python3 -m scripts.skill_eval.quick_validate agents/*/c*.md` 전부 PASS |
| 호환성 | 기존 /vais 명령어 100% 작동 | 수동 회귀: `/vais ceo plan dummy`, `/vais cto plan dummy`, `/vais cso qa dummy` 3건 smoke |
| 유지보수성 | 공통 규칙 수정 포인트 감소 | 향후 규칙 추가 시 변경 라인 수 측정(정성) |

## Success Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | 7개 C-Level 파일 모두 본문 ≤ 500줄 | `wc -l agents/*/c*.md` |
| SC-02 | skill_eval 실행 결과 WARN/FAIL 0건 | `quick_validate.py` exit 0 |
| SC-03 | 필수 규칙 keyword 출현 횟수 ≥ baseline | `scripts/refactor-audit.js` PASS |
| SC-04 | 기존 CP ID(CP-0/1/2/Q/R/A/L2/D/G) 모두 보존 | grep per-file count 유지 |
| SC-05 | frontmatter 4개 필드(name/version/model/tools) 변경 0 | `git diff --stat` + frontmatter diff |
| SC-06 | smoke 회귀 3건 정상 실행 (Plan-only, phase 실행 구조 응답) | 수동 테스트 로그 |
| SC-07 | Plan 범위 제한, AskUserQuestion 강제 등 핵심 문구 누락 0 | F7 감사 whitelist |

## Impact Analysis

### Changed Resources

| Resource | Type | Change Description |
|----------|------|-------------------|
| `agents/ceo/ceo.md` | modify | 본문 696 → ~450줄. 서비스 런칭 모드 다이어그램 압축, 중복 규칙 표화. frontmatter 불변. |
| `agents/cto/cto.md` | modify | 702 → ~470줄. CP 템플릿 펜스 → 표, PDCA 표 합병. frontmatter 불변. |
| `agents/cso/cso.md` | modify | 485 → ~400줄. 법적 체크리스트는 유지(2차에 추출). 공통 규칙 압축. |
| `agents/cmo/cmo.md` | modify | 441 → ~350줄. GTM 프레임워크 유지, 공통 규칙 압축. |
| `agents/cfo/cfo.md` | modify | 399 → ~320줄. 가격책정 프레임워크 유지, 공통 규칙 압축. |
| `agents/cpo/cpo.md` | modify | 366 → ~300줄. 공통 규칙 압축. |
| `agents/coo/coo.md` | modify | 361 → ~300줄. 공통 규칙 압축. |
| `scripts/refactor-audit.js` | create | Do 단계 감사 스크립트 (신규) |
| `docs/03-do/ceo_refactor-clevel-agents.audit.txt` | create | 감사 로그 |

### Current Consumers (Side-Effect 상세 분석)

| Resource | Operation | Code Path | Impact | 대응 |
|----------|-----------|-----------|--------|------|
| `skills/vais/phases/{c}.md` | Read | `${CLAUDE_PLUGIN_ROOT}/agents/{c}/{c}.md`를 명시적으로 Read | ✅ 경로 불변 → 무영향 | 없음 |
| Claude Code sub-agent loader | Read (자동) | 에이전트 invoke 시 `agents/**/*.md` 본문을 프롬프트로 주입 | ⚠️ **핵심 리스크**: 본문 내용이 sub-agent 행동을 결정. 규칙 문구 손실 시 즉시 동작 변경 | F7 감사, 키워드 화이트리스트 |
| `scripts/skill_eval/quick_validate.py` | BODY_WARN_LINES=500, BODY_FAIL_LINES=800 체크 | 본문 라인 수만 체크 | ✅ 긍정적 영향 (WARN 해소) | 없음 |
| `scripts/vais-validate-plugin.js` | description 500자 체크 | frontmatter.description 만 체크 | ✅ 무영향 (frontmatter 불변) | 없음 |
| `hooks/session-start.js` | 세션 시작 시 output-style 로드 | agent .md 본문 미사용 | ✅ 무영향 | 없음 |
| `scripts/doc-validator.js` `doc-tracker.js` `stop-handler.js` | `docs/{phase}/{c}_{feature}.{phase}.md` 경로 체크 | 에이전트 본문 미사용 | ✅ 무영향 | 없음 |
| `scripts/cp-guard.js` `cp-tracker.js` | CP 상태 추적 | CP ID(CP-1/2/Q 등) 문자열 매칭 가능성 | ⚠️ CP ID 보존 필수 | F7 감사 SC-04 |
| `scripts/gate-check.js` | Gate 통과 조건 체크 | 고정 키워드 매칭("배포 승인" 등) | ⚠️ 게이트 키워드 손실 시 CI 실패 | F7 감사 SC-07 |
| `agents/ceo/absorb-analyzer.md` `retrospective-writer.md` 등 하위 에이전트 | ceo.md 본문 내 경로 참조 없음 확인됨 | 없음 | ✅ | 없음 |
| `CHANGELOG.md` `vais.config.json` | 버전 동기화 | 본 리팩터링도 버전 범프 필요 | v0.49.0 또는 v0.48.3 | Do 단계에서 bump |
| 기존 `docs/**` 완료 피처 산출물 | 과거 QA 문서가 ceo.md:322, cto.md:248-251 등 **line-number 기반 참조** 보유 | ⚠️ 리팩터링 후 line number 변경 | 과거 문서는 historical record로 유지 (수정 금지), 신규 감사에서만 참조 경로 재생성 | 없음 (과거 QA 문서는 snapshot) |
| Plugin marketplace cache (`~/.claude/plugins/cache/vais-marketplace/vais-code/0.48.0/`) | 배포 후 자동 동기화 | 사용자 PC 로컬 캐시 | ⚠️ 릴리스 후 사용자 캐시 갱신 지연 가능 | CHANGELOG 명기 + 동작 불변 보장 |

### 사이드 이펙트 매트릭스 (핵심 우려 대응)

> "수정 후 내용이 생략되어 프로세스 진행 시 무시되거나 없어지는 경우가 없도록" — 이것이 본 기획의 최상위 제약.

**발생 가능 시나리오 × 방지책**

| # | 시나리오 | 발생 지점 | 방지책 |
|---|---------|---------|--------|
| R1 | "AskUserQuestion 도구를 반드시 호출" 문구 압축 중 누락 | F1 공통 규칙 압축 | F7 감사: `grep -c "AskUserQuestion"` baseline 대비 ≥ 동일 |
| R2 | "⛔ Plan 단계 범위 제한" 섹션 헤더 누락 | F1 | F7: 헤더 리터럴 매칭 7개 파일 각각 ≥ 1 |
| R3 | 체크포인트 표에서 CP-R, CP-A, CP-L2 등 저빈도 CP 행 누락 | F3 (CEO 고유) | F7: `CP-[A-Z0-9]+` grep per-file, baseline 대비 동일 매칭 |
| R4 | 서비스 런칭 모드 동적 라우팅 규칙 문구 단순화 중 의미 변경 | F3 | Plan 단계에서 원문 보존 표 유지, 다이어그램만 압축. 문장 rewording 금지. |
| R5 | 종료 전 문서 체크리스트 phase별 경로 표기 누락 | F2 | F7: `docs/0[1-5]-(plan|design|do|qa|report)/{c}_` 패턴 출현 횟수 확인 |
| R6 | Plan-only 실행 경로에서 Plan 범위 제한 문구 약화 → Plan 단계 구현 실수 유발 | F1 | 원문 문구 그대로 유지, 오직 중복만 제거 |
| R7 | Sub-agent invoke 시 프롬프트 누락으로 규칙 적용 안 됨 | 외부 파일 분리 시 | **MVP에서 외부 분리 금지**. 인라인 유지. |
| R8 | frontmatter 우발 변경으로 description 500자 초과 | Edit 실수 | git diff frontmatter 섹션 0 변경 검증 |
| R9 | CEO/CTO 라인 수 축소 과정에서 고유 로직(동적 라우팅) 약화 | F3 | 압축은 "표 형식화"와 "중복 제거"만. 로직 문장 rewording 금지. |
| R10 | 배포 후 사용자 plugin cache가 옛 버전을 계속 사용 | 릴리스 후 | CHANGELOG 명기, 버전 범프로 캐시 무효화 유도 |

### Verification
- [x] 모든 consumer 확인 완료 (scripts/*.js, skill_eval, hooks, sub-agent loader)
- [x] breaking change 없음 확인 (frontmatter 불변, 경로 불변, CP ID 보존, 규칙 keyword 보존)

## 7. 기술 스택
(N/A — 문서 리팩터링 작업)

## 8. 화면 목록
(N/A)

## 데이터 모델
(N/A)

## API 엔드포인트
(N/A)

## 9. 일정 (예상)

| 단계 | 산출물 |
|------|--------|
| 기획 (CEO) | 본 plan 문서 — **현재 단계** |
| 설계 (CTO design) | 각 파일별 before/after 구조 매핑, keyword whitelist 정의, refactor-audit.js 스펙 |
| 인프라/구현 (CTO do) | F1/F2/F3/F7 구현, 7개 파일 순차 리팩터링 |
| QA (CTO qa) | SC-01~SC-07 검증, smoke 회귀 3건, skill_eval 실행 |
| 보고 (CTO report) | 변경 요약, 라인 감축 수치, 이후 2차 범위 제안 |

> 다음 단계: **CEO CP-1 범위 결정 → CTO plan 위임** 권장

---

## CP-1 결정 (2026-04-08)

**선택: B. 표준 (Balanced)** — 사용자 승인 완료

- 범위: F1(공통 압축) + F2(문서 체크리스트 표준화) + F3(CEO/CTO 고유 섹션 재정비) + F7(refactor-audit 감사)
- 목표: 7개 파일 모두 본문 500줄 이하, skill_eval WARN 0건, 규칙 keyword 100% 보존
- 엄격 제약: R9 방지책 — **문장 rewording 금지, 중복 제거와 표 형식화만 허용**
- 제외: F4/F5(도메인 프레임워크 외부 추출), F6(shared/common-rules.md) → 2차 작업으로 분리

## CP-1 범위 옵션 (사용자 결정 필요)

> ⚠️ 본 기획은 사이드 이펙트 최소화를 최상위 제약으로 설정했습니다. 범위에 따라 리스크/효과가 다릅니다.

### A. 최소 (Safe) — 추천 ⭐
- **범위**: F1(공통 보일러플레이트 인라인 압축) + F2(문서 체크리스트 표준화) + F7(감사 스크립트)
- **제외**: F3의 CEO 서비스 런칭 모드 압축, CTO 고유 섹션 재정비, 도메인 프레임워크 추출
- **예상 결과**: ceo.md 696→~600, cto.md 702→~620, 기타 5개 파일 <400줄. 일부(CEO/CTO) WARN 잔존 가능
- **리스크**: ⭐ 매우 낮음 (고유 로직 미변경)
- **적합 상황**: 안전 최우선, 규칙 손실 리스크 제로가 절대 조건

### B. 표준 (Balanced)
- **범위**: F1 + F2 + F3(CEO/CTO 고유 섹션 재정비 포함) + F7
- **제외**: 도메인 프레임워크 외부 파일 추출(F4/F5), shared/common-rules.md(F6)
- **예상 결과**: 7개 파일 모두 500줄 이하 (SC-01 달성), skill_eval WARN 0건
- **리스크**: 🟡 중간 (CEO/CTO 서비스 런칭 다이어그램 압축 시 의미 보존 주의 필요)
- **적합 상황**: skill_eval WARN 완전 해소가 목표, R9 방지책(문장 rewording 금지) 엄격 준수

### C. 확장 (Ambitious)
- **범위**: B + F4/F5(프레임워크 외부 파일 추출 + 각 에이전트 명시 Read 지시)
- **예상 결과**: CSO 400→280, CMO 350→250, CFO 320→220, COO 300→220
- **리스크**: 🔴 높음 (R7 — sub-agent가 shared 파일을 실제로 Read하는지 검증 필요, 첫 Read 실패 시 규칙 미적용)
- **적합 상황**: 2차 작업으로 분리하는 것이 안전. 본 MVP 완료 + smoke 회귀 검증 후 별도 기획으로 진행 권장.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-08 | 초기 작성 (CEO plan) |
