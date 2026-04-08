# CTO QA: agent-rename-v2

> Do phase 산출물 검증 + 회귀 분석 + Critical 이슈 분류

## 검증 요약

| Test | 결과 | 비고 |
|------|------|------|
| T1. validate-plugin | ✅ 통과 | 0 errors / 0 warnings / 38 agents |
| T2. JSON 유효성 (5 파일) | ✅ 통과 | package, vais.config, plugin, marketplace, hooks |
| T3. Frontmatter 일관성 (38) | ✅ 통과 | 0 mismatches / 38 agents |
| T4. subAgents 무결성 | ⚠️ 1건 | **사전 존재 이슈** (rename 회귀 아님) |
| T5. OLD 이름 잔존 | ✅ 통과 | 실제 잔존 0, FP 4 (스크립트 파일명) |
| T6. git 변경 통계 | ℹ️ 정보 | 67 파일 변경 (rename 23 + modified 40 + 산출물 4) |

## Gap 분석

| Plan/Design 요구 | 구현 결과 | 일치 |
|-----------------|-----------|------|
| 20개 sub-agent rename | 20개 완료 | ✅ |
| 23 git mv (agents 20 + skills/phases 3) | 23건 | ✅ |
| frontmatter `name:` 갱신 | 23건 | ✅ |
| 단어 경계 substring 충돌 회피 | `\b` 패턴 적용 | ✅ |
| code-review/compliance-audit superstring | 자연 차단됨 | ✅ |
| vais.config.json subAgents/parallelGroups 갱신 | 적용됨 | ✅ |
| 7곳 버전 동기화 | v0.48.0 | ✅ |
| CHANGELOG BREAKING CHANGES | 매핑 표 + 마이그레이션 | ✅ |
| validate-plugin 통과 | 0 errors | ✅ |
| 단일 atomic 커밋 (CP-D 결정) | **미실행** (사용자 `/vais commit` 대기) | ⏸️ |

**Gap 일치율: 9/10 (90%)** — 1건은 의도적 보류 (커밋 사용자 명시 대기)

## 발견 이슈

### Critical (P0): 0건

### High (P1): 0건

### Medium (P2): 1건

#### M-01: `coo.subAgents`에 `release-engineer` 참조 — 파일은 `agents/cto/`에 위치

**발견**: T4 무결성 체크에서 `agents/coo/release-engineer.md` not found.

**원인 분석**: `vais.config.json`의 `coo.subAgents`에 `release-engineer`(구 `deploy-ops`)가 등록되어 있지만 실제 파일은 `agents/cto/release-engineer.md`에 위치. 이는 `deploy-ops`가 **CTO/COO 공유 sub-agent**로 의도된 설계의 흔적.

**회귀 여부**: ❌ 아님 — rename 전에도 동일 상태였음 (`coo.subAgents`에 `deploy-ops` 등록, 파일은 `agents/cto/deploy-ops.md`).

**현재 영향**:
- `validate-plugin` 자체는 통과 (스크립트가 cross-directory 참조를 허용)
- 런타임 영향 없음 (Claude Code agent loader는 `name:` frontmatter 기반 lookup)
- 다만 `vais.config.json`의 `subAgents`를 디렉토리 기반 검색에 쓰는 도구가 있다면 깨질 수 있음

**권장 조치**:
- **Option A** (보수): 본 피처 범위 밖이므로 별도 피처(`config-subagents-cleanup`)로 분리
- **Option B** (적극): qa-engineer 위임 없이 CTO가 즉시 수정 (`coo.subAgents`에서 `release-engineer` 제거 또는 cross-ref 메타 추가)

### Low (P3): 1건

#### L-01: Design 충돌 매트릭스 누락 항목

**발견**: P3-P7 실행 중 `\bvalidate-plugin\b` 패턴이 스크립트 파일명 `vais-validate-plugin.js`의 substring과 매칭되어 3개 파일에 false positive 발생 → 즉시 복원.

**근본 원인**: design 단계의 충돌 매트릭스(§2)는 **agent-name 간** substring 충돌만 다뤘고, **agent-name이 다른 식별자(스크립트 파일명, 변수명)에 포함되는 경우**는 다루지 않음.

**조치 (이미 수행)**: P3-P7 종료 직후 `sed -i 's/vais-plugin-validator/vais-validate-plugin/g'`로 복원 완료.

**향후 개선 (report에 기록)**:
- design 충돌 매트릭스 템플릿에 "OLD 이름이 다른 파일/식별자의 substring인가?" 체크 항목 추가
- 본 사례를 `references/` 또는 `docs/` 회고에 저장

## 회귀 분석

| 영역 | 검증 | 결과 |
|------|------|------|
| validate-plugin 스크립트 동작 | T1 재실행 | ✅ |
| 다른 진행 피처 영향 | `.vais/` 진행 피처 0 확인 | ✅ |
| docs/ 역사 기록 보존 | 의도된 OLD 이름 잔존 ✓ | ✅ |
| 백업 파일 존재 | `.vais/agent-state.json.bak.*` | ✅ |
| 사용자 메모리 룰 준수 | `/vais commit` 대기, version 7곳 동기화 | ✅ |

## Success Criteria 최종 평가

| SC | 결과 |
|----|------|
| SC-01 ~ SC-08 | ✅ 모두 통과 |

> 단, M-01은 SC 외 사전 존재 이슈로, 본 피처의 SC 평가에는 포함하지 않음.

## 권장 조치 (CP-Q 선택지)

| 옵션 | 설명 | 영향 |
|------|------|------|
| **A. 모두 수정** | M-01 + L-01 모두 처리. M-01은 `coo.subAgents`에서 `release-engineer` 제거 (의미 변경 위험) | 추가 변경 |
| **B. Critical만 수정** | Critical 0건 → 사실상 "그대로 진행"과 동일 | 변경 없음 |
| **C. 그대로 진행** | M-01은 별도 피처로 분리, L-01은 report에 기록만 | 변경 없음, 다음 단계 진행 |
| **D. 중단** | report 안 가고 종료 | — |

💡 **권장: C. 그대로 진행** — M-01은 사전 존재 이슈로 본 피처 scope 밖. 별도 피처로 분리하는 것이 git history 깔끔. L-01은 report 회고 항목으로 기록.

## CP-Q 결정 (2026-04-08)

**선택: A. 모두 수정**

### M-01 수정 결과 ✅

- **조치**: `agents/coo/release-engineer.md` → `../cto/release-engineer.md` 심볼릭 링크 생성
- **사유**: COO가 release-engineer를 위임하는 의미는 보존(시맨틱 변경 없음), 파일은 단일 진실 소스(`agents/cto/`) 유지
- **검증**:
  - T4 무결성 재실행: 0 issues
  - validate-plugin 재실행: 0 errors, **39 agents** (38→39, 심볼릭 링크 카운트)
  - 심볼릭 링크는 git이 추적
- **트레이드오프**: agent loader가 `name: release-engineer`를 두 경로에서 발견하지만 동일 frontmatter라 중복 등록 무해

### L-01 처리

- **조치**: report 단계에서 회고 항목으로 기록 (design 충돌 매트릭스 템플릿 개선 제안)
- **현재 상태**: P3-P7 수행 중 즉시 복원 완료, 잔존 영향 없음

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-08 | 초기 작성 — T1~T6 검증, Gap 90%, M-01 사전 이슈 + L-01 design 누락 식별 |
| v1.1 | 2026-04-08 | CP-Q: A. 모두 수정. M-01 symlink로 수정 완료, L-01은 report 회고로 인계. 39 agents |
