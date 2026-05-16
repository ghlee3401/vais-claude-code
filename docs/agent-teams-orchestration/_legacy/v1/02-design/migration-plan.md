---
owner: cto
artifact: migration-plan
phase: design
feature: agent-teams-orchestration
generated: 2026-05-16
summary: ".vais/status.json v3 → v4 스키마 변경 (activeFeature → activeFeatures[] + per-feature lock) + 무손실 마이그레이션 스크립트 설계"
---

# agent-teams-orchestration — Migration Plan (CTO)

> Design phase | Owner: CTO | Date: 2026-05-16
> 참조: [tech-plan.md §4 Must-2 + Impact Analysis](../01-plan/tech-plan.md), AC G1 (opt-in 비파괴)

## 1. 스키마 v3 (현재) vs v4 (목표)

### v3 (0.67.0 현재)
```json
{
  "version": 3,
  "activeFeature": "vais-positioning-rethink",
  "features": {
    "{name}": {
      "createdAt": "...",
      "currentPhase": "report",
      "phases": { ... },
      "rolePhases": { ... },
      "gapAnalysis": { ... },
      "fsmState": { ... }
    }
  }
}
```

### v4 (목표)
```json
{
  "version": 4,
  "activeFeatures": ["vais-positioning-rethink"],
  "features": {
    "{name}": {
      "createdAt": "...",
      "currentPhase": "report",
      "phases": { ... },
      "rolePhases": { ... },
      "gapAnalysis": { ... },
      "fsmState": { ... },
      "lock": null,
      "subagentLocks": {}
    }
  }
}
```

**변경 요약**:
1. `activeFeature: string` → `activeFeatures: string[]` (단일 → 배열)
2. `features.{name}.lock: { clevel, sessionId, acquiredAt } | null` 신규 필드 (선택, default null)
3. `features.{name}.subagentLocks: { [agent]: SubagentLock }` 신규 필드 (default `{}`) — 패턴 D 용
4. `version: 3` → `version: 4`

## 2. 마이그레이션 스크립트 (의사 코드)

**위치**: `scripts/migrate-status-v3-to-v4.js` (신규)

```javascript
function migrate(v3) {
  if (v3.version === 4) return v3;            // idempotent
  if (v3.version !== 3) throw new Error('Unknown version');

  return {
    version: 4,
    activeFeatures: v3.activeFeature ? [v3.activeFeature] : [],
    features: Object.fromEntries(
      Object.entries(v3.features).map(([name, feat]) => [
        name,
        {
          ...feat,
          lock: feat.lock || null,
          subagentLocks: feat.subagentLocks || {}    // 패턴 D
        }
      ])
    )
  };
}
```

**호출 시점**: `lib/status.js > loadStatus()` 진입 시 자동 검사 → v3 발견 → 백업 (`status.json.v3.bak`) → 마이그레이션 → 저장.

## 3. Consumer 영향 분석

| Consumer | 현재 접근 | v4 대응 |
|----------|----------|---------|
| `lib/status.js` | `data.activeFeature` | `data.activeFeatures[0]` 폴백 + 신규 `getActiveFeatures()` |
| `hooks/session-start.js` | 활성 피처 1개 표시 | 다중 피처 표시 (현재 status header 확장) |
| `.vais/dashboard.html` | activeFeature 강조 | activeFeatures 다중 강조 |
| `scripts/vais-validate-plugin.js` | version=3 검증 | version=4 허용 |
| `lib/ceo-algorithm.js` | currentPhase 1개 | 다중 활성 → 가장 최근 lock 활동 기준 |

## 4. 마이그레이션 검증 (SC-03)

| Test | 입력 | 기대 출력 |
|------|------|----------|
| T1 | 현재 5 완료 피처 v3 status.json | v4 변환 후 5 피처 모두 보존 + `phases/rolePhases/gapAnalysis/fsmState` 무손실 |
| T2 | `activeFeature: null` v3 | v4 `activeFeatures: []` |
| T3 | 이미 v4 status.json | idempotent (변경 없음) |
| T4 | version 필드 누락 | throw error (방어적) |
| T5 | v3 + `subagentLocks` 필드 없음 | v4 변환 시 `subagentLocks: {}` 자동 추가 |

**검증 스크립트**: `scripts/test-migration-v3-v4.js` — 본 design 의 T1~T4 자동 실행.

## 5. 롤백 시나리오 (위험 평가)

| 위험 | 영향 | 대응 |
|------|------|------|
| 마이그레이션 후 v3 hooks 가 `activeFeature` 직접 참조 | session-start 가 undefined 표시 | (1) `status.json.v3.bak` 으로 수동 복원 (2) hooks 동시 패치 (Do phase) |
| `lock` 필드 누락된 피처 access | `feat.lock` undefined → falsy 평가 → 안전 | 별도 대응 불필요 |
| 동시 마이그레이션 (2 세션 동시 실행) | 파일 경합 | atomic write 사용 (`fs.promises.writeFile` + temp + rename) |

## 6. Do phase 작업 순서

1. `scripts/migrate-status-v3-to-v4.js` 작성 (idempotent)
2. `lib/status.js` 패치 — loadStatus 진입 시 자동 migrate
3. `hooks/session-start.js` 패치 — activeFeatures[] 다중 표시
4. `.vais/dashboard.html` 패치 — 다중 피처 grid
5. `scripts/vais-validate-plugin.js` — v4 허용
6. T1~T4 검증 실행
7. **로컬 status.json 마이그레이션 (사용자 확인 후)** — 자동 git restore 금지 정책에 따라 사용자 명시 승인 필요

> ⚠️ 7번은 메모리 `feedback_no_auto_git_restore` 정신 — 사용자 의도 확인 우선.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-16 | 초기 작성 — v3→v4 스키마 diff + 마이그레이션 스크립트 + 5 consumer 영향 + T1~T4 검증 |
| v1.1 | 2026-05-16 | 패턴 D 확장 — `subagentLocks` 신규 필드 + migrate 함수 default `{}` + T5 검증 케이스 추가 |
