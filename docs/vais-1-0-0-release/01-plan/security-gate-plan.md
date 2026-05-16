---
owner: cso
artifact: security-gate-plan
phase: plan
feature: vais-1-0-0-release
generated: 2026-05-16
agent: security-auditor
summary: "1.0.0 GA 릴리즈 3-Gate 보안 체크리스트 — OWASP/시크릿/CVE/플러그인 검증 계획"
---

# vais-1-0-0-release — CSO Gate Plan

> Phase: 📋 plan | Owner: **CSO** (security-auditor sub-agent)
> 0.68.0 → 1.0.0 GA. 코드 변경 최소 피처 — 버전 동기화 5 파일 + status.json v3→v4 마이그레이션 + narrative 재정렬.

---

## 1. Gate 체크리스트 (3 Gate)

| Gate | 도구 | 트리거 | 통과 조건 |
|------|------|--------|----------|
| **Gate A** (보안) | security-auditor + secret-scanner + dependency-analyzer | Do phase 진입 전 | OWASP Top 10 N/A 또는 mitigation 박제 / 시크릿 0건 / CVE high·critical 0건 |
| **Gate B** (플러그인) | plugin-validator | 마켓플레이스 재배포 직전 | `node scripts/vais-validate-plugin.js` = 0 err / ≤ 2 warn (T4 agent-teams warn 허용) |
| **Gate C** (코드 리뷰) | code-reviewer (독립) | QA phase 직후 | 신규 surface 의 bug pattern 0건, perf 회귀 없음 |

---

## 2. 보안 Surface 분석

### 2.1 `scripts/migrate-status-v3-to-v4.js`

| 항목 | 평가 |
|------|------|
| Atomic write | temp 파일 → `fs.renameSync()` 패턴 적용됨 — 중간 실패 시 원본 보존 |
| 백업 | `.vais/status.json.v3.bak` 자동 생성 (writeFileSync 선행) |
| 파싱 실패 | try/catch + `process.exit(2)` — silent 실패 없음 |
| 버전 미지원 | version != 2/3/4 → Error throw + exit(3) |
| 입력 검증 | `typeof v3 !== 'object'` 체크 존재 |
| 데이터 손실 위험 | **Low** — idempotent + backup + atomic 3중 보호 |
| 비밀 노출 가능성 | **없음** — JSON 구조 변환만, 민감 필드 처리 없음 |

### 2.2 버전 동기화 5 파일

대상 파일: `package.json` / `vais.config.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` / `CHANGELOG.md`

| 항목 | 평가 |
|------|------|
| 시크릿 노출 | **없음** — version string / description / metadata 만 변경 |
| email 노출 | `ghlee0304@ncsoft.com` 이미 기존 커밋에 공개됨. 신규 노출 없음 |
| version 불일치 | 5파일 중 일부만 변경 시 Gate B 실패 → AC-CSO-4 로 감지 |

### 2.3 Narrative 변경 (CLAUDE.md / ONBOARDING.md)

- 보안 surface **0** — 문서 텍스트만 변경, 런타임 코드 미포함.

### 2.4 agent-teams 활성 (dogfood)

- T1~T8 위협 모델은 `docs/agent-teams-orchestration/02-design/main.md` §6 에 이미 박제됨.
- 본 피처에서 추가되는 신규 위협 없음. T4 (SendMessage 라우팅 오류) 만 fallback AC 확인 필요.

---

## 3. AC (CSO 관점)

| ID | 검증 내용 | 도구 | 완료 기준 |
|----|----------|------|----------|
| **AC-CSO-1** | 하드코딩 시크릿 0건 | secret-scanner — `grep -rE "(password\|secret\|api_key\|token)\s*[:=]\s*[\"'][^\"']{8,}" lib/ skills/ scripts/` | 매칭 0건 |
| **AC-CSO-2** | CVE high·critical 0 / SPDX 라이선스 호환성 | dependency-analyzer — `npm audit --audit-level=high` | 0 취약점 / MIT·Apache-2.0·ISC 만 |
| **AC-CSO-3** | 플러그인 구조 검증 통과 | plugin-validator — `node scripts/vais-validate-plugin.js` | err 0 / warn ≤ 2 |
| **AC-CSO-4** | 버전 5 파일 일치 확인 | 수동 diff: `plugin.json` ↔ `marketplace.json` ↔ `package.json` ↔ `vais.config.json` | version 필드 `1.0.0` 동기 |
| **AC-CSO-5** | 변경 surface 독립 코드 리뷰 | code-reviewer — `migrate-status-v3-to-v4.js` + version 동기화 diff | bug pattern 0건, data-loss path 없음 |

---

## 4. 위협 모델 (T1~T5)

| ID | 위협 | 가능성 | 영향 | Mitigation |
|----|------|--------|------|------------|
| **T1** | status.json 마이그레이션 중 실패 → 사용자 데이터 손실 | Low | High | `.v3.bak` 백업 + atomic rename 이미 구현. Gate A 시 dry-run 실행으로 확인 |
| **T2** | 1.0.0 GA 라벨 후 critical bug 발견 | Medium | High | 즉시 1.0.1 hotfix. COO release-pipeline-plan 에 hotfix 트리거 명시 필요 |
| **T3** | marketplace.json description 변경 → 사용자 캐시 미무효화 | Low | Low | 캐시 TTL 자연 만료 대기. 능동 조치 불필요 |
| **T4** | agent-teams dogfood 중 SendMessage 라우팅 오류 | Medium | Medium | `agentTeams.enabled=false` 1줄 fallback (CTO tech-plan AC7). Gate B warn 허용 범위 내 |
| **T5** | git tag `v1.0.0` 잘못 푸시 | Low | Medium | `git tag -d v1.0.0` + 재태깅. COO release-pipeline-plan 에 tag 검증 체크 명시 |

---

## 5. Hand-off + 의존성

| 구분 | 내용 |
|------|------|
| **선행** | CTO tech-plan — 변경 surface (5파일 목록 + migrate 스크립트) 최종 확정 후 Gate A 진입. 병렬 plan 작성 가능, Do phase 진입 전 sync |
| **후행** | Gate A 통과 → Do phase 실행 → Gate B (마켓플레이스 재배포 직전) → QA → Gate C |
| **외부 의존** | 없음 — 모든 검증 도구 in-tree (`scripts/vais-validate-plugin.js`, `npm audit`) |
| **COO 협조** | release-pipeline-plan 에 T2 hotfix 트리거 + T5 tag 검증 추가 요청 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| v1.0 | 2026-05-16 | 최초 작성 — 3-Gate + T1~T5 + AC 5건 | security-auditor |
