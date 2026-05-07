# Checkpoint Policy (v2.1, 0.65.x)

canonical for all C-Level CP behavior. C-Level main .md 는 자기 phase 트리거만 짧게 명시하고 본 정책을 참조한다.

## 모드 (vais.config.json > workflow.checkpointPolicy.mode)

| mode | 발동 CP | 자동 진행 |
|------|---------|----------|
| `lean` (0.65 기본) | CP-0(PRD missing) + CP-Q(critical or matchRate<90) + destructive 작업 | CP-1/CP-D/CP-G/CP-2 자동 (outro 한 줄 요약) |
| `standard` | CP-0 + CP-2(Do destructive) + CP-Q | CP-1/CP-D/CP-G 자동 |
| `strict` (v0.64 회귀) | 6 CP 모두 | — |

## 발동 조건 (lean 기본)

- **CP-0** — Plan 진입 시 `gates.cto.plan.requirePrd="smart"` + PRD `quality=missing` 일 때만. `partial`/`full` 은 자동 강행 (partial 은 plan 0.7 가정 명기).
- **CP-Q** — QA 산출물에 `Critical: N>0` 또는 `matchRate<90` 일 때만. 이외 자동 통과.
- **destructive 작업** — 파일 5+ 변경, src/lib/agents/skills 수정, DB schema 변경 시 항상 confirm (mode 무관).
- **ambiguous-scope** — autoSelect 가 minimal/standard/extended 휴리스틱 결정 못한 경우 fallback CP-1.

## CP 출력 규약 (발동 시 공통)

1. 산출물 핵심 요약 3~10줄을 응답에 직접 출력 (파일에만 저장 금지).
2. 마크다운 표는 ` ``` ` 펜스 **밖**에 배치 (F8 — 펜스 안에는 ASCII 구분선만).
3. AskUserQuestion 도구 호출 (텍스트 출력만으로 갈음 금지 — F9).
4. 옵션은 구체적 트레이드오프 포함, 권장 옵션 first + "(Recommended)" 표시.
5. "수정" 선택 시 동일 CP 재실행, "중단" 선택 시 즉시 종료.

## C-Level 별 CP 트리거 매트릭스

| C-Level | CP-0 (PRD missing) | CP-Q (critical) | 추가 CP |
|---------|---|---|--------|
| CTO | ✓ (Plan 진입) | ✓ (QA 결과) | CP-2 destructive (Do 시작 5+ 파일) / **CP-G{N}** Gate 1~4 (lean: 자동 통과 + outro / strict: 발동) |
| CPO | — | ✓ (PRD 완성도 < 80%) | — |
| CSO | — | ✓ (Critical>0) | CP-C (Critical 발견 즉시 차단 여부) |
| CEO | — | ✓ (전략 정합성 미달) | CP-A absorb 배분 맵 (absorb 모드 전용) |
| CBO | — | ✓ (unit economics LTV/CAC<3x) | — |
| COO | — | ✓ (CI/CD 단계 누락) | — |

### CP-G{N} (CTO 전용)

| Gate | 시점 | 자동 통과 조건 (lean) |
|------|------|----------------------|
| 1 | Plan 완료 | feature 레지스트리 + 데이터 모델 + 기술 스택 모두 기재 |
| 2 | Design 완료 | Interface Contract 생성 (`docs/{feature}/02-design/interface-contract.md`) |
| 3 | Design+Architect 완료 | DB 스키마 일치 + 마이그레이션 + 빌드 성공 |
| 4 | Do 완료 | 빌드 성공 + Interface Contract 참조 + 레지스트리 status 갱신 |

자동 통과 시 outro 한 줄로 표시, `--review` 플래그로 강제 발동 가능. 항목별 상세 체크리스트는 `agents/cto/knowledge/gate-system.md` 참조.

## 자동 진행 outro 포맷 (CP 자동 통과 시)

```
─────────────────────────────────────────────
✓ {phase} 완료 — 자동 진행
─────────────────────────────────────────────
| 항목 | 결과 |
|------|------|
| 범위 | {minimal/standard/extended} (autoSelect) |
| 다음 | {next phase} |
| 수정 원하시면 | `/vais cto {phase} --review` |
```

> 자동 진행이지만 outro 한 줄로 결정 가시성 보장. 사용자가 `--review` 플래그로 강제 발동 가능.

## 위반 금지

- ❌ AskUserQuestion 없이 텍스트 선택지만 출력
- ❌ CP 발동 조건 충족인데 자동 진행
- ❌ destructive 작업 confirm 생략
- ❌ "수정" 응답에 무한 루프 (max 2회 — 이후 사용자에게 대안 제시)
