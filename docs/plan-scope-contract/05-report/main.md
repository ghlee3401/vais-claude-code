# plan-scope-contract - 완료 보고서

> Phase: Report (CTO)
> 참조: `../01-plan/main.md` + `../02-design/main.md` + `../03-do/main.md` + `../04-qa/main.md`

## Executive Summary

| Key | Value |
|-----|-------|
| **Problem** | plan phase scope creep → "다시 짜" 재작업 사이클이 "비용" 의 본질 |
| **Solution** | prompt default + 문서 섹션 의무화 + Rule #9 재기술 + validator + event 스키마 (4지점 저비용 개입) |
| **Result** | 6 파일 수정 / 1 파일 생성 / ~270 lines. Test 7/7 + Regression 217/0. matchRate 100% |
| **Core Value** | 재작업 사이클의 **구조적 강제 감소** + dog-fooding 으로 본 피처가 자기 규칙 준수 |

## Context Anchor (최종)

| Key | Value |
|-----|-------|
| WHY | VAIS 사용 비용 체감 병목이 토큰이 아닌 재작업 사이클이라는 ideation 진단 이행 |
| WHO | VAIS 내부·배포 사용자 — `/vais cto plan` 결과물 소비자 |
| OUTCOME | plan/main.md 상단 3섹션으로 scope 계약 명시화, validator 가 누락 시 warn |
| SCOPE | F1+F2+F3 + event schema 만. F4 / CEO gate / 자동 발화 훅은 별도 피처 분기 |

---

## 완료 내용

### MVP (Must)

| # | 기능 | 검증 |
|:-:|-----|------|
| F1 | CTO agent `## Plan Scope Default` 블록 추가 (`agents/cto/cto.md`) | 문구 확인 (do/main.md §구현 결정) |
| F2 | plan.template.md 상단 3섹션 + W-SCOPE-01/02/03 validator | test 7/7 + dog-fooding pass |
| F3 | CLAUDE.md Rule #9 부연 ("Lake 는 사용자가 지정") | 문구 확인 |
| + | event-log 스키마 `plan_completed` / `plan_rewrite_requested` | schema.js validatePayload 통과 |
| + | vais.config.json `workflow.scopeContractPolicy` 키 | config load 성공 |

### Out-of-scope (분기 피처로 이월)

| 후속 피처 제안 | 내용 | 우선 |
|---------------|------|:---:|
| `plan-scope-observability` | event-log 자동 발화 훅 (reason 키워드 휴리스틱) + SC-01 대시보드 | 중 |
| `template-include-mechanism` | F4 공통 헤더 승격을 위한 `templates/_shared/` include 시스템 | 중 |
| `ceo-scope-triage` | trivial/small/feature/launch 4단계 라벨링 gate | 하 (1+2+a 효과 관찰 후) |

---

## Success Criteria 최종 평가

| SC | 기준 | 상태 | 비고 |
|----|-----|:----:|------|
| SC-01 | 재작성 요청률 50%↓ | ⏸ Deferred | 자동 발화 훅 별도 피처 분기로 자동 측정 불가. 정성 관찰로 대체 |
| SC-02 | 3섹션 누락률 10%↓ | ⚠️ Partial → ⏸ Deferred | validator 준비 완료, 신규 피처 누적 후 2주차 집계 |
| SC-03 | 검토 시간 체감 개선 | ⏸ Deferred | 내부 사용자 주관 피드백 2주 후 |
| SC-04 | 타 C-Level 부작용 0건 | ✅ 현재 0건 | 2주 관측 지속 |

**2주 관측 계획** (2026-04-23 → 2026-05-07)
- 신규 `/vais {c-level} plan {feature}` 호출 시 W-SCOPE 경고 발화 여부 수동 카운트
- `plan_rewrite_requested` 발생 시 대화에서 감지하여 수동 `.vais/event-log.jsonl` append (자동 발화 전 임시 방안)
- 관측 종료 후 `plan-scope-observability` 피처 ideation 진입 여부 결정

---

## 기술 부채

| 우선순위 | 부채 | 조치 |
|:------:|-----|------|
| Medium | plan.template.md `Context Anchor > SCOPE` 와 신규 `## Out-of-scope` 중복 표현 | 2주 관측 후 Context Anchor SCOPE 제거 결정 |
| Low | W-SCOPE regex 가 H2 만 매치 — 일부 작성자가 H3 로 작성 시 false negative | 교육/문서로 1차 대응, 재발 시 regex 완화 |
| Low | QA 의 Nice-1 `validateFeatureName()` 참조 — 전체 validator 공통 패턴, 본 피처 단독 수정 대상 아님 | 전사 validator 리팩터링 별도 피처 후보 |

---

## 버전 범프 권고

**v0.58.2 → v0.58.3** (patch) — 사용자 영향 있는 변경 (새 규칙 + 템플릿 변경) 이라 **반드시 범프**. 동기화 대상 파일 (CLAUDE.md §Version Management):

- `package.json` (version)
- `vais.config.json` (version)
- `.claude-plugin/plugin.json` (version)
- `.claude-plugin/marketplace.json` (metadata.version + plugins[0].version)
- `CHANGELOG.md` (신규 엔트리)
- (추가 발견 시) README / session-start output-style

### CHANGELOG 엔트리 초안

```markdown
## [0.58.3] - 2026-04-23

### Added
- **plan-scope-contract**: plan/main.md 에 `## 요청 원문` / `## In-scope` / `## Out-of-scope` 3섹션 의무화
- `scripts/doc-validator.js`: `validateScopeContract()` + W-SCOPE-01/02/03 경고 (severity=warn)
- `agents/cto/cto.md`: `## Plan Scope Default (v0.58.3+)` 섹션 — Minimum Viable Plan default
- `lib/observability/schema.js`: `plan_completed` / `plan_rewrite_requested` 이벤트 스키마
- `vais.config.json`: `workflow.scopeContractPolicy` 정책 키

### Changed
- `CLAUDE.md` Rule #9 (Boil the Lake) 부연: "Lake 는 사용자가 지정한다. AI 는 확장하지 않는다"
- `templates/plan.template.md`: 최상단에 Scope Contract 3섹션 블록 삽입

### Dog-fooding
- 이 피처의 plan/main.md 자체가 새 규약을 준수 (H3→H2 self-correction 1건)

### Deferred (별도 피처 후보)
- event-log 자동 발화 훅 → `plan-scope-observability`
- F4 공통 헤더 승격 → `template-include-mechanism`
- CEO triage gate → `ceo-scope-triage` (1+2+a 효과 관찰 후)
```

---

## Next

> 다음 단계: **`/vais commit`** — 버전 범프 + CHANGELOG append + 커밋 메시지 생성 일괄 처리

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-23 | 최종 보고서 — MVP 3건 + event 스키마 완료, SC 2주 관측 계획, v0.58.3 범프 권고 |
