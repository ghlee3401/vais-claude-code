---
topic: hard-fail-strategy
owner: cto
phase: 01-plan
feature: design-system-mcp-activation
---

# Hard Fail Strategy — Python3 / vendor 무결성 검증 + 안내

> 본 topic 은 main.md 의 D-4 (ideation 인용) + D-9 + D-11 + D-12 + 정책 2 + 비기능 호환성 + SC-02 의 상세화.

## 문제

OSS default ON + 자동 호출 = 사용자 환경에 Python3 + `vendor/ui-ux-pro-max/data` 가 없으면 design phase 가 **사일런트로 깨지거나 무토큰 진행**. 어느 쪽도 사용자 혼란 유발.

## 결정 (D-4 ideation 인용)

**Hard fail** — graceful degradation 거부. Python3 / vendor 미충족 시 design phase 즉시 `exit(1)` + 명확한 안내 메시지.

## D-9: vendor 무결성 검증 범위

| 단계 | 검증 항목 | 명령 |
|:----:|----------|------|
| 1 | `vendor/ui-ux-pro-max/` 디렉토리 존재 | `fs.existsSync` |
| 2 | `vendor/ui-ux-pro-max/data/` 디렉토리 존재 | `fs.existsSync` |
| 3 | `data/` 비어있지 않음 (≥ 1 파일) | `fs.readdirSync().length > 0` |
| 4 | `vendor/ui-ux-pro-max/scripts/search.py` 존재 | `fs.existsSync` |

**checksum 은 over-engineering** — 손상 사례가 실제로 발생하면 추가 (YAGNI).

### Python3 검증

```javascript
// lib/mcp-validator.js (신규) 의사코드
const { execSync } = require('child_process');
function checkPython() {
  try {
    const v = execSync('python3 --version', { encoding: 'utf8' });
    const m = v.match(/Python (\d+)\.(\d+)\.(\d+)/);
    if (!m) return { ok: false, reason: 'parse-fail', raw: v };
    const [, major, minor] = m;
    if (Number(major) < 3 || (Number(major) === 3 && Number(minor) < MIN_MINOR)) {
      return { ok: false, reason: 'version-too-low', current: `${major}.${minor}` };
    }
    return { ok: true, version: `${major}.${minor}` };
  } catch (e) {
    return { ok: false, reason: 'not-installed', err: String(e.message).slice(0, 200) };
  }
}
```

**MIN_MINOR**: Python 3.10 잠정 (D-8). design 단계에서 `vendor/ui-ux-pro-max/scripts/search.py` 의 실제 의존 (f-string ≥ 3.6, walrus ≥ 3.8, match ≥ 3.10 등) 측정 후 확정.

## D-11: 안내 메시지

### 메시지 본문 (한국어 우선)

```
❌ design-system MCP 활성화 실패

원인: {Python3 미설치 | Python3 버전 부족 (현재: 3.X, 필요: 3.10+) | vendor/ui-ux-pro-max 디렉토리 누락 | vendor data 비어있음}

조치:
1. Python3 설치: https://www.python.org/downloads/  (또는 OS 패키지 매니저 — brew, apt, dnf)
2. 본 plugin 의 vendor 디렉토리 무결성 확인:
   ls vendor/ui-ux-pro-max/data/
3. 그래도 안 되면 plugin 재설치: claude code plugin install vais-code

상세 가이드: README#Installation 절 또는 CLAUDE.md "## 의존성"

긴급 우회 (권장하지 않음):
   vais.config.json > orchestration.mcp.enabled: false
```

### 출력 위치

- `console.error` (stderr) — Claude Code 가 사용자에게 전달
- design phase exit code 1 → SubagentStop hook 이 차단 메시지 추가

### i18n

- v1: 한국어만 — 본 plugin 1차 사용자 한국어 화자
- v2 (별도 피처): 영어 추가 — `lib/i18n.js` 도입 시 통합

## D-12: 테스트 전략

### CI (npm test)

- **mock subprocess** — `tests/integration/mcp-validator.test.js` 에서 `execSync` mock
- 시나리오:
  - TC-1: Python3 정상 → ok: true
  - TC-2: Python3 미설치 (mock throw) → ok: false, reason: 'not-installed'
  - TC-3: Python 3.9 → ok: false, reason: 'version-too-low'
  - TC-4: vendor 디렉토리 누락 → ok: false, reason: 'vendor-missing'
  - TC-5: vendor data empty → ok: false, reason: 'vendor-empty'
  - TC-6: 안내 메시지 형식 검증 (4종 reason 별 메시지 본문 + 조치 링크)

### Manual smoke

- 실제 Python3 호출은 manual — CI 환경의 Python 버전 통제 불가
- 체크리스트:
  - [ ] 본인 macOS — design phase 자동 호출 → MASTER.md 생성 확인
  - [ ] Python 3.9 환경 (pyenv) → Hard fail 메시지 정확성 확인
  - [ ] Python uninstall — Hard fail 메시지 + exit 1 확인

## 정책 2 (Hard fail trigger 조건)

```
Python3 미설치 OR Python3 버전 부족 OR vendor 누락 OR vendor data empty
  → design phase exit(1) + console.error(안내 메시지)
```

**OR 조건 — 어느 하나라도 미충족이면 즉시 fail.** AND 가 아닌 이유: 부분 충족도 도구 호출 시 깨지므로.

## 비기능: 호환성

| 항목 | 요구 | 검증 |
|------|------|------|
| OS | macOS 14+ / Ubuntu 22+ / Debian 12+ / Windows (WSL2) | manual smoke 4종 |
| Python | 3.10+ (D-8 잠정, design 단계 확정) | mock + manual |
| Node.js | ≥ 18 (기존 vais-code 요구사항 그대로) | 변경 없음 |

## SC-02 (Success Criteria)

> Python3 미설치 환경에서 design phase 진입 시 한국어 안내 + exit(1)

- 검증: mock CI TC-2 + manual smoke (Python uninstall)

## 큐레이션 기록

- (채택) Hard fail (D-4 ideation) — 사일런트 회피 우선
- (거절) Auto opt-out — 자동 config 변경이 risky, 사용자 의도 모호
- (병합) D-9 (vendor 무결성) + D-11 (안내) + D-12 (테스트) — 모두 Hard fail 시나리오의 부분 결정
- (추가) i18n v1 한국어만 — 별도 피처로 분리

## 참조

- main.md `## Decision Record` (D-4, D-9, D-11, D-12)
- main.md `## 5. 정책` (정책 2)
- main.md `## 6. 비기능 요구사항` (호환성)
- main.md `## Success Criteria` (SC-02)
- ideation main.md D-4 (Hard fail 결정 원본)
- ideation main.md Q-4 (Python 버전), Q-5 (vendor 무결성), Q-7 (안내), Q-8 (테스트)

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — D-9/D-11/D-12 + 정책 2 + 비기능 호환성 + SC-02 통합 |
