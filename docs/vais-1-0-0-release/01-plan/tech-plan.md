---
owner: cto
artifact: tech-plan
phase: plan
feature: vais-1-0-0-release
generated: 2026-05-16
agent: infra-architect
summary: "0.68.0 → 1.0.0 GA 기술 작업 분해: 버전 동기화 5파일 + status v3→v4 마이그레이션 + narrative 재정렬 + git tag"
---

> 참조 문서: `docs/vais-1-0-0-release/00-ideation/main.md`

# Tech Plan — vais-1-0-0-release (0.68.0 → 1.0.0 GA)

> Phase: plan | Owner: CTO | Agent: infra-architect | Date: 2026-05-16

## 1. 요청 원문

> "vais-claude-code를 1.0.0으로 업데이트 하는 계획을 세우고 싶어. 코드 리뷰를 통해서 이전 버전에 대한 잔제를 없애고, 1.0.0으로 하고 깃에도 태그를 달고 릴리즈 하고 싶어"

---

## 2. In-Scope (작업 분해)

### 2-A. 버전 동기화 — 5 파일

| 파일 | 변경 경로 | 변경 요지 |
|------|----------|----------|
| `package.json` | `version` | `"0.68.0"` → `"1.0.0"` |
| `vais.config.json` | `version` | `"0.68.0"` → `"1.0.0"` |
| `.claude-plugin/plugin.json` | `version` | `"0.68.0"` → `"1.0.0"` |
| `.claude-plugin/marketplace.json` | `metadata.version` + `plugins[0].version` | 두 필드 모두 `"1.0.0"` |
| `CHANGELOG.md` | 최상단 `## [1.0.0]` 섹션 추가 | Keep a Changelog 6 섹션 (COO 위임 — §5 참조) |

### 2-B. status.json 마이그레이션

| 단계 | 명령 | 검증 |
|------|------|------|
| 실행 | `node scripts/migrate-status-v3-to-v4.js` | stdout: `migrated v3 → v4` |
| 백업 확인 | `.vais/status.json.v3.bak` 존재 여부 | `ls -la .vais/` |
| 완료 검증 | `.vais/status.json` 의 `version === 4` | `node -e "console.log(require('./.vais/status.json').version)"` |

스크립트: idempotent + atomic write (temp → rename). 이미 v4 면 `exit(0)`.

### 2-C. Narrative 재정렬

**대상 파일 + 변경 요지**:

| 파일 | 변경 요지 |
|------|----------|
| `CLAUDE.md` (헤더 + What This Project Is) | v0.x 계열 버전 라벨 제거 → `1.0.0 GA` + organization-in-a-box 정체성 문구 일관화 |
| `ONBOARDING.md` | 버전 표기 `0.68.0` → `1.0.0`, v0.x 내러티브 문구 정렬 |
| `.claude-plugin/marketplace.json` `.metadata.description` | `v0.68:` 접두사 → `v1.0 GA:` + organization-in-a-box GA 문구 |
| `.claude-plugin/plugin.json` `description` | v2.0 라벨 제거 또는 GA 일관화 |
| `README.md` | 존재 시 버전 표기 + 정체성 문구 정렬 (존재 여부 Do phase 초입 확인) |

### 2-D. _legacy 정리 결정

| 경로 | 현황 | 결정 | 사유 |
|------|------|------|------|
| `docs/agent-teams-orchestration/_legacy/v1/` | v1 archive, 격리됨 | **보존** | git history 증거 + dogfood 비교 기준점. 실익 없이 삭제 시 traceback 불가 |

Do phase 에서 결정을 `implementation-log.md` 에 기록 후 종결.

### 2-E. CHANGELOG 1.0.0 섹션

- Keep a Changelog 6 섹션: Added / Changed / Deprecated / Removed / Fixed / Security
- **COO release-notes-writer 위임** (§5 Hand-off 참조)
- 0.68.0 이전 cumulative 111 entries 는 기존 형식 보존 — 1.0.0 섹션만 추가

---

## 3. Out-of-Scope

| 항목 | 사유 |
|------|------|
| 신규 기능 추가 | 1.0.0 = narrative GA + cleanup only. feature freeze. |
| v2 합성문 9→5 섹션 압축 | AC5 분량 실측 후 조건부 결정 — 추측으로 사전 결정 X. 필요 시 별도 follow-up 피처로 박제. |
| agent-teams SC-06 wall-clock benchmark | 외부 측정 환경 필요. 1.0.0 범위 외. |
| CPO/CBO 산출물 | 내부 도구 GA — `feedback_internal_feature_no_persona` 정책 |

---

## 4. AC (Acceptance Criteria)

| # | 기준 | 검증 방법 |
|---|------|----------|
| AC1 | 5 버전 파일 모두 `"1.0.0"` 일치 | `grep -r '"1.0.0"' package.json vais.config.json .claude-plugin/` — 5 hits |
| AC2 | `.vais/status.json` 의 `version === 4` | `node -e "console.log(require('./.vais/status.json').version)"` → `4` |
| AC3 | `node scripts/vais-validate-plugin.js` 0 err / 최대 1 warn | agent-teams `enabled=true` warn 은 의도된 것이므로 1 warn 까지 허용 |
| AC4 | `CHANGELOG.md` 내 `## [1.0.0]` 섹션 존재 + 6 섹션 (Added/Changed/Deprecated/Removed/Fixed/Security) 모두 채워짐 | `grep -A 50 "\[1.0.0\]" CHANGELOG.md` |
| AC5 | `docs/vais-1-0-0-release/01-plan/main.md` 분량 측정 — ≥ 200 줄이면 9→5 섹션 압축을 별도 follow-up 피처로 박제. < 150 줄이면 9 섹션 유지 + lean 실증으로 정당화. | `wc -l docs/vais-1-0-0-release/01-plan/main.md` |
| AC6 | git tag `v1.0.0` 생성 완료 | `git tag \| grep v1.0.0` |
| AC7 | 비파괴 fallback 절차 명시 — agent-teams 라우팅/SendMessage 이상 시 `vais.config.json > orchestration.agentTeams.enabled: false` 1줄 토글로 즉시 sequential 회귀. 회귀 후 CTO PDCA sequential 재진입 (ideation 건너뜀, plan 문서 재사용). fallback 트리거 조건: FSM 5-state stuck / SendMessage 3회 timeout / synthesizer 오류. | Do phase `implementation-log.md` 에 fallback 절차 박제 확인 |
| AC8 | `docs/agent-teams-orchestration/_legacy/v1/` 처리 결정 박제 | `implementation-log.md` 내 "legacy 처리 결정" 항목 존재 (권고: 보존) |

---

## 5. 의존성 + Hand-off

### 의존성 그래프

```
ideation (완료) → plan (현재)
                     ↓
              CSO Gate B 통과
                     ↓
               do phase 진입
                ┌───┴───────────────┐
       (1) version sync      (2) status migration
       (3) narrative 재정렬  (4) git tag v1.0.0
```

**Do phase 내부 순서**: (1) CSO Gate B 통과 확인 → (2) version sync 5 파일 → (3) status v3→v4 migration → (4) narrative 재정렬 → (5) git tag

### CSO 위임

- `docs/vais-1-0-0-release/01-plan/security-gate-plan.md` — CSO security-auditor 작성 예정
- 본 tech-plan 은 **CSO Gate B 통과를 Do phase 의 hard dependency** 로 지정
- Gate B 미통과 시 Do phase 진입 차단

### COO 위임

- `docs/vais-1-0-0-release/02-design/release-pipeline.md` — COO release-notes-writer 작성 예정
- CHANGELOG `## [1.0.0]` 6 섹션 작성 + git tag 생성 절차 = COO hand-off
- git tag 명령: `git tag -a v1.0.0 -m "1.0.0 GA — organization-in-a-box"` + `git push origin v1.0.0`

### Phase 순서

| Phase | 주요 산출물 | 완료 조건 |
|-------|------------|----------|
| 01-plan | tech-plan (본 문서) + security-gate-plan | AC1~8 정의 완료 |
| 02-design | release-pipeline (COO) | CHANGELOG 드래프트 + git tag 절차 |
| 03-do | implementation-log + plugin-validation + release-notes-v1 | AC1~4, 6~8 충족 |
| 04-qa | gap-analysis + code-review-independent | AC3 재확인 |
| 05-report | completion-report + release-monitor | v1.0.0 GA 선언 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-16 | 초기 작성 |
