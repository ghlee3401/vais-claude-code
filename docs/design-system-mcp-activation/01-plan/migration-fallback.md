---
topic: migration-fallback
owner: cto
phase: 01-plan
feature: design-system-mcp-activation
---

# Migration Fallback — 기존 사용자 자동 전환 + opt-out

> 본 topic 은 main.md 의 D-10 + 정책 4 + SC-04 의 상세화. v0.60.0 Profile gate 마이그 패턴 답습.

## 문제

기존 v0.60.0 사용자의 `vais.config.json > mcp.enabled` 가:
- **명시적 false** — opt-out 의지 (존중)
- **명시적 true** — 이미 ON (변경 없음)
- **키 자체 누락** (구버전 config) — ?

세 번째가 핵심 분기. v0.60.0 이전 사용자는 `mcp` 키가 아예 없을 수 있고, v0.59.0 ~ v0.60.0 사용자는 `mcp.enabled: false` 명시 보유.

## 결정 (D-10)

**Profile gate (v0.60.0) 패턴 답습** — fallback default = `true`. 명시적 `false` 만 OFF.

### 매트릭스

| 사용자 시나리오 | mcp config 상태 | `isMcpEnabled()` 반환 |
|----------------|----------------|:-------:|
| 신규 install (default config) | `mcp.enabled: true` | true |
| v0.60.0 사용자 (config 미수정) | `mcp.enabled: false` | **false** (opt-out 존중) |
| 구버전 사용자 (mcp 키 없음) | (키 누락) | **true** (fallback) |
| opt-out 의지 사용자 | `mcp.enabled: false` 수동 명시 | false |

### 왜 v0.60.0 명시적 false 를 자동 true 로 안 바꾸나?

- v0.60.0 의 `false` 는 **그 시점의 default 값**이지 사용자 의지가 아님
- 그러나 자동으로 true 로 덮어쓰면 사용자 환경 (Python3 가 없는 환경 포함) 에서 Hard fail 발생 가능
- → 명시적 false 는 "사용자가 의도적으로 둔 값" 으로 가정 (보수적, 안전)
- 단점: v0.60.0 사용자 중 Python3 보유자도 opt-out 상태 — 안내 한 번 필요
- 보완: v0.61.x 릴리즈 노트 + CHANGELOG 에 "명시적 ON 안내" 강조

### 코드 (의사)

```javascript
// lib/mcp-validator.js (또는 lib/project-profile.js 확장)
function isMcpEnabled() {
  try {
    const config = loadConfig();
    const flag = config?.orchestration?.mcp?.enabled
              ?? config?.mcp?.enabled;  // legacy path 호환
    if (flag === undefined || flag === null) return true;  // fallback ON
    if (typeof flag === 'boolean') return flag;
    if (flag === 'true') return true;
    if (flag === 'false') return false;
    return Boolean(flag);
  } catch (_) {
    return true;  // 예외 시도 ON
  }
}
```

> Profile gate 의 `isProfileGateEnabled()` (lib/project-profile.js:551) 과 동일 패턴.

## 정책 4 (Backwards compat)

- 기존 사용자 (`mcp` 키 없음) → 자동 ON
- 명시적 `false` → OFF (opt-out 존중)
- 명시적 `true` → ON (변경 없음)
- 잘못된 값 (`"yes"`, `1`, `null` 등) → `Boolean(flag)` fallback (대부분 ON)

## SC-04 (Success Criteria)

> 기존 v0.60.0 사용자 자동 마이그레이션

### 검증 시나리오

- mock CI TC-A: `{ orchestration: {} }` (mcp 키 없음) → `isMcpEnabled() === true`
- mock CI TC-B: `{ orchestration: { mcp: { enabled: false } } }` → `isMcpEnabled() === false`
- mock CI TC-C: `{ mcp: { enabled: true } }` (legacy path) → `isMcpEnabled() === true`
- mock CI TC-D: `{}` (config 통째로 비어있음) → `isMcpEnabled() === true`
- mock CI TC-E: loadConfig throw → `isMcpEnabled() === true` (예외 fallback)

## opt-out 가이드 (사용자용)

```json
// vais.config.json
{
  "orchestration": {
    "mcp": {
      "enabled": false
    }
  }
}
```

→ README#Installation 절에 "MCP 비활성화 옵션" 으로 추가.

## 안내 (v0.61 릴리즈 노트 권장)

- "v0.60.0 에서 명시적으로 `mcp.enabled: false` 가 설정된 사용자는 자동 ON 안 됩니다. Python3 + vendor 보유 시 수동으로 true 변경 권장."
- 개별 사용자 안내 hook 은 over-engineering (CHANGELOG + README 로 충분)

## 큐레이션 기록

- (채택) Profile gate 패턴 답습 — 일관성 + 검증된 모델
- (거절) v0.60.0 명시적 false 자동 true 전환 — 사용자 환경 가정 위험
- (거절) 마이그 hook 으로 첫 실행 시 사용자에게 묻기 — UX 비용 ↑, README 안내로 충분
- (추가) legacy path (`config.mcp.enabled`) 도 호환 — 일부 fork 사용자 대응

## 참조

- main.md `## Decision Record` (D-10)
- main.md `## 5. 정책` (정책 4)
- main.md `## Success Criteria` (SC-04)
- ideation main.md Q-6 (마이그레이션 미해결 → 본 topic 에서 해소)
- `lib/project-profile.js:551` (Profile gate fallback 패턴 — 답습 대상)

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — D-10 + 정책 4 + SC-04 + Profile gate 답습 명세 |
