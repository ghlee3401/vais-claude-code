# legacy-path-guard — 완료 보고서

> 참조 문서: `docs/legacy-path-guard/plan/main.md`, `docs/legacy-path-guard/design/main.md` (v1.1), `docs/legacy-path-guard/do/main.md`, `docs/legacy-path-guard/qa/main.md`, `docs/legacy-path-guard/qa/cso-review.md`

## Executive Summary

### Project Overview

| 항목 | 내용 |
|------|------|
| Feature | `legacy-path-guard` |
| 시작일 | 2026-04-17 (`docs-structure-redesign` v0.52.1 완료 직후) |
| 완료일 | 2026-04-17 |
| 기간 | <1일 (동일 세션 완주) |
| 참여 C-Level | CEO (plan) → COO (design/do/qa/report) + CSO (독립 QA 리뷰) |

### Value Delivered

| Perspective | Planned | Actual |
|-------------|---------|--------|
| **Problem** | 레거시 경로 재발 방지 수단 부재 | pre-commit hook + CLAUDE.md rule로 **2-Layer 방어선** 구축 |
| **Solution** | (a) Pre-commit hook + (c) CLAUDE.md rule 조합 | **기존 `.hooks/pre-commit` 확장** (신규 생성 X, 재사용) |
| **Function/UX Effect** | 커밋 시점 즉각 피드백 | ✅ 달성, 격리 repo 수동 검증 Pass |
| **Core Value** | 1회성 → 상시 보장 | ✅ 달성, 의존성 0 |

---

## Success Criteria Final Status

| ID | Criterion | Status | Evidence |
|----|-----------|:------:|----------|
| SC-01 | hook이 레거시 경로 커밋 차단 | ✅ **Met** | 격리 repo Test 1 Pass (Do §검증) |
| SC-02 | 허용 예외는 통과 | ✅ **Met** | 격리 repo Test 2 Pass + 잔존 패턴 13개 파일 매칭 100% |
| SC-03 | `npm run prepare-hooks` 1회로 활성 | ⏳ **Partial** | 명령어 재사용 완료. 현재 `core.hooksPath` 미설정 — 사용자 실행 대기 (opt-in 설계) |
| SC-04 | CLAUDE.md Rule #13 | ✅ **Met** | `CLAUDE.md:142` |
| SC-05 | README 활성화 안내 | ✅ **Met** | "Developer Setup" 섹션 |
| SC-06 | 신규 의존성 0 | ✅ **Met** | `package.json` dependencies 불변 |

**Success Rate**: **5/6 Met + 1 Partial (83% Met, 100% 구현 완료)**

> SC-03 Partial은 "사용자 opt-in 실행 필요"에서 기인. 구현은 완료, 활성화는 사용자 주권(Rule #11) 영역.

---

## PDCA Cycle Summary

| Phase | Status | Key Output |
|-------|:------:|------------|
| Plan (CEO) | ✅ | `docs/legacy-path-guard/plan/main.md` v1.0 — CEO 전략 plan, (a)+(c) 범위 확정, 담당 COO |
| Design (COO) | ✅ | `docs/legacy-path-guard/design/main.md` v1.1 — ripgrep→bash 전환, 기존 `.hooks/` 재사용 결정 |
| Do (COO) | ✅ | `docs/legacy-path-guard/do/main.md` — 3 modify + 1 create, 격리 repo 수동 검증 Pass |
| QA — CSO 독립 | ✅ | `docs/legacy-path-guard/qa/cso-review.md` — 5 Gate Pass, Blocker 1건 즉시 해결 |
| QA — COO 공식 | ✅ | `docs/legacy-path-guard/qa/main.md` — SC 5 Met + 1 Partial, OWASP Pass, 최종 Pass |
| Report | ✅ | 본 문서 |

---

## Key Decisions & Outcomes

| Decision | Source | Followed? | Outcome |
|----------|--------|:---------:|---------|
| (a)+(c) 조합 (CI guard(b) 제외) | Plan §MVP | ✅ | ci-bootstrap 후속 피처로 분리 확정 |
| Native git hooks (husky 기각) | Plan §0.6 | ✅ | 의존성 0 유지 |
| ripgrep → bash grep 전환 | Design §Plan 수정 #1 | ✅ | 시스템 의존 제거, POSIX 호환 |
| 기존 `.hooks/pre-commit` 확장 (신규 생성 X) | Design v1.1 §Plan 수정 #2 | ✅ | YAGNI + Rule #10 준수, 중복 인프라 회피 |
| CLAUDE.md 예외 추가 | CSO Finding #1 | ✅ | self-blocking deadlock 해소 |
| bypass `--no-verify` 금지 | Plan §5.2 | ✅ | Rule #13 + README 명문화 |
| F9 자동 테스트 제외 | QA §Gap | ✅ (Nice 보류) | 격리 repo 수동 검증으로 대체. 필요 시 `legacy-path-guard-tests` 분리 |

---

## QA Results

| Metric | Target | Final |
|--------|:------:|:-----:|
| Gap 일치율 | ≥90% | **100%** (Must/Should) |
| QA 통과율 | ≥90% | **100%** (자동 가능 8/8) |
| Critical 이슈 | 0건 | **0건** |
| Warning 이슈 | — | **0건** |
| Info 이슈 | — | 3건 (사용자/후속 결정) |
| OWASP Top 10 | Pass | 10/10 Pass/N/A |
| 전체 테스트 | 유지 | 175 pass / 0 fail (변화 없음) |
| 플러그인 validator | 유지 | 오류 0, 경고 0 |

---

## Retrospective

### Keep (잘한 점)
- **CEO plan에서 범위 조기 분리** — (b) CI guard를 `ci-bootstrap`으로 분리한 덕에 본 피처 스코프가 명확하고 작음
- **Design 단계 Plan 수정 2건** — ripgrep 미설치 + 기존 `.hooks/` 발견을 Do 진입 전에 반영해 스코프 비대화 방지
- **CSO 독립 리뷰 배치** — Finding #1(self-blocking deadlock)을 커밋 전에 발견. 만약 커밋 후 발견했다면 즉시 revert + hotfix 사이클
- **dogfooding 연속성** — `docs-structure-redesign` → `legacy-path-guard`로 이어지는 피처 체인이 새 구조에서 5개 문서 생성으로 자연스럽게 축적

### Problem (개선할 점)
- Plan 단계에서 `scripts/git-hooks/` 신규 생성을 당연하게 가정 → 기존 `.hooks/` 확인을 Design까지 미룸. **Rule #10 Search Before Building을 Plan 단계부터 체크리스트화** 필요
- Design 단계에서 hook 스크립트의 예외 리스트가 CLAUDE.md를 빠뜨림 → **규칙 자체 설명이 담긴 파일은 자동으로 예외에 추가**하는 규약 필요 (self-reference 패턴)
- SC-03 "활성화" 기준이 모호. "사용자 실행 후" 상태를 Met로 간주할지 Partial로 남길지 논쟁 여지

### Try (다음에 시도할 것)
- **`ci-bootstrap` 피처**: 3 Layer(CI guard)로 확장. GitHub Actions 신규 구축 — npm test + eslint + legacy-path-guard 통합 실행
- **docs-structure-redesign Advisory #2**: `scripts/refactor-audit.js` owner 결정 미해결 — 별도 이슈 정리
- **self-reference 예외 패턴 룰화**: Rule 자체를 설명하는 파일(`CLAUDE.md`, 본 피처 문서)은 자동 예외 대상임을 design 단계 체크리스트에 추가

---

## 4-Layer 재발 방지 체계 현황

```
Layer 1: CLAUDE.md Rule #13 (LLM 가이드)        ✅ 본 피처 완료
Layer 2: pre-commit hook (기계 차단, opt-in)    ✅ 본 피처 완료
Layer 3: CI guard (서버 강제)                   ⬜ ci-bootstrap 후속
Layer 4: 사람 리뷰 / 정기 grep 점검              — 상시
```

**현 커버리지**: 2/4 Layer. 개발자가 hook 설치 시 개인 장치에서 100% 차단. CI 무구축이라 미설치자의 커밋은 리뷰 의존.

---

## 버전 Bump 제안

| 후보 | 적합성 | 사유 |
|------|:------:|------|
| **Patch 0.52.2** | ⭐⭐⭐ | **추천**. 개발자 환경 도구 추가 + CLAUDE.md Rule 추가. public API/플러그인 런타임 영향 0. breaking 없음 |
| Minor 0.53.0 | ⭐ | CLAUDE.md Rule 추가를 "행동 규약 변경"으로 해석 시 가능. 보수적 |
| Major 1.0.0 | ❌ | 해당 없음 |

> **권장**: **0.52.2 (patch)** — 사용자 facing 기능 확장 아님, 내부 품질 가드.

---

## CHANGELOG.md 엔트리 초안

```markdown
## [0.52.2] - 2026-04-17

### Added

- `legacy-path-guard`: pre-commit hook이 `docs/NN-` 레거시 경로 패턴 커밋을 자동 차단 (기존 `.hooks/pre-commit` 확장)
- CLAUDE.md Rule #13: "레거시 경로 금지" — LLM·사람 공통 가이드라인 명시
- README "Developer Setup" 섹션: `npm run prepare-hooks` 활성화 방법 + 비활성화 + `--no-verify` 금지 안내
- `docs/legacy-path-guard/` dogfooding 산출물 5종 (plan/design/do/qa/report + cso-review sub-doc)

### Changed

- `.hooks/pre-commit`: legacy-path-guard 섹션을 ESLint/tests 앞에 추가하여 fail-fast 제공

### Fixed

- (내부) CSO 리뷰에서 발견된 self-blocking deadlock 해결: hook 예외 목록에 `CLAUDE.md` 추가하여 Rule #13 설명 문구가 차기 커밋에서 자기 자신을 차단하지 않도록 함
```

---

## 후속 Info 이슈 처리 제안

| # | Info 이슈 | 제안 |
|---|----------|------|
| 1 | 공백 파일명 hook 처리 | 현재 리스크 낮음. 필요 시 `while IFS= read -r file; do` 전환 |
| 2 | `--no-verify` 우회 가능 | `ci-bootstrap` 피처로 서버 강제 layer 추가 |
| 3 | F9 자동 테스트 미구현 | 별도 미니 피처 `legacy-path-guard-tests` 고려. 현재는 격리 repo 수동 검증으로 충분 |

---

## Next Steps

- [ ] 사용자: `npm run prepare-hooks` 1회 실행 — SC-03 Partial → Met 전환
- [ ] 사용자: 버전 bump 방향 확정 (`0.52.2` 권장)
- [ ] **`/vais commit`** 플로우로 커밋 (사용자 메모리 규칙 준수)
- [ ] 커밋 시 7개 버전 참조 파일 동기화
- [ ] 후속 피처 `ci-bootstrap` 기획 여부 사용자 결정

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-17 | 초기 작성 — PDCA 전체 완료, SC 5 Met + 1 Partial, 버전 bump 0.52.2 권장, CHANGELOG 초안 + `ci-bootstrap` 후속 연결 |

<!-- template version: v0.18.0 -->
