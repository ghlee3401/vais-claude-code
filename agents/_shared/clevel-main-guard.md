## C-LEVEL MAIN.MD RULES (v3.0 summary)

canonical full: `agents/_shared/clevel-main-guard.full.md` — 위반 의심·재진입 충돌 시 read.
workflow contract: `docs/workflow-contract-alignment/01-plan/workflow-contract-matrix.md`.

v3.0 핵심 변경 (v0.68+, agent-teams-orchestration 도입): **2 모델 공존** — v1 (5섹션 인덱스, 기존) + v2 (합성문, 신규). frontmatter `model-version` 필드로 분기.

### v1 모드 (`model-version: v1` 또는 키 없음) — 기존 동작
1. main.md = 5섹션 인덱스 (Executive Summary / Decision Record / Artifacts 표 / CEO 판단 근거 / Next Phase). 본문 X.
2. 다른 C-Level 의 Decision Record 행·Artifacts 표 엔트리 수정·삭제 금지.
3. Decision Record append-only. Owner 컬럼 필수, 누락 → `W-MRG-02`.
4. Artifact frontmatter 4 필수 (owner/artifact/phase/feature). 상세: `subdoc-guard.md`.

### v2 모드 (`model-version: v2`) — 대화-합성 (agent-teams-orchestration 활성 시)
1. main.md = **합성문 9섹션** (`templates/synthesis.template.md`). synthesizer 단독 작성.
2. **Decision Record 분리** — main.md 의 §2 결정 + 별도 `decisions-log.md` (timeline, 모든 SendMessage event).
3. frontmatter 필수 6 필드: owner / artifact / phase / feature / **synthesizer** / **model-version** (v2 강제).
4. **synthesizer 일관성 계약**: main.md frontmatter.synthesizer = decisions-log frontmatter.synthesizer = §2 결정 합성자. Do 작업 test C1~C2 검증.

### 공통 규칙
5. 1 artifact = 1 MD (통합 금지). 파일명 = frontmatter `artifact` 값.
6. enforcement: warn (W-OWN/W-MRG/W-MAIN-SIZE/W-SYNTH-CONSISTENCY 모두 경고). 순서: advisor-guard → subdoc-guard → clevel-main-guard.
7. main.md 200줄 가이드라인 — v1 인덱스는 자연 충족, v2 합성문은 phase 성격에 따라 가변 (warn only).
8. 재진입 시: v1 = 자기 owner 의 요약·Next Phase 갱신 / v2 = synthesizer 가 새 draft + decisions-log 새 timeline row append.
9. **모델 마이그레이션**: v1 → v2 자동 변환 X. 기존 5 완료 피처는 frontmatter `model-version: v1` 추가만 (본문 보존). 신규 피처부터 v2 적용. `orchestration.agentTeams.enabled=true` 가 신규 피처 v2 트리거.

<!-- clevel-main-guard version: v3.0 -->
