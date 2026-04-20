---
owner: cto
authors: []
topic: requirements
phase: plan
feature: clevel-doc-coexistence
---

# clevel-doc-coexistence — plan — requirements

> Topic: requirements | Owner: cto | Phase: plan
> 참조: `./main.md` (인덱스), `../00-ideation/main.md`

## 1. 목적 (WHY) 한 문장

여러 C-Level 이 같은 phase 문서에 공존하도록 `main.md` 를 append-only, topic 을 owner-labeled 로 재정의한다. **그리고 C-Level 직접 작성 phase 에서도 main.md 비대화를 막는 topic 강제 분리 규칙을 포함한다(F14 — 본 피처 진행 중 사용자 지적으로 추가됨).**

## 2. 기능 요구사항 — Feature ID 매핑

### F1. `topicPresets` phase×c-level 확장

- **As-Is (v0.57)**: `workflow.topicPresets.{phase}: string[]`
- **To-Be (v0.58)**: 두 형태 병행
  ```json
  "topicPresets": {
    "01-plan": {
      "_default": ["requirements", "impact-analysis", "policy"],
      "cpo": ["requirements", "user-stories", "acceptance-criteria"],
      "cto": ["architecture-plan", "impact-analysis", "tech-risks"],
      "cbo": ["market-analysis", "gtm-plan", "unit-economics"],
      "cso": ["security-requirements", "compliance-checklist"],
      "coo": ["deployment-plan", "monitoring-spec"]
    }
  }
  ```
- **Backward compat**: 배열이면 `_default`. 기존 v0.57 피처 무변경.

### F2. Topic 문서 frontmatter 규약

```yaml
---
owner: cpo            # enum, 필수
authors:              # 선택
  - prd-writer
topic: requirements   # 필수, 파일 stem
phase: plan
feature: saas-time-tracker
---
```

파일명은 topic-first (`requirements.md` O, `cpo-requirements.md` X). owner 누락 시 `W-OWN-01`.

### F3/F3b. main.md append-merge + Multi-owner Decision Record

**구조 (H2 헤딩 기반)**: 각 C-Level 진입 시 `## [{C-LEVEL}] ...` 섹션 append, 다른 C-Level 섹션 수정·삭제 금지. Decision Record 표에 Owner 컬럼 필수.

### F4. `doc-validator.js` 신규 경고

| 코드 | 조건 |
|------|------|
| `W-OWN-01` | topic.md `owner` 누락 |
| `W-OWN-02` | owner ∉ C-Level enum |
| `W-MRG-02` | Decision Record 표에 Owner 컬럼 없음 |
| `W-MRG-03` | owner 섹션 0 AND topic ≥ 2 |
| `W-MAIN-SIZE` (F14) | main.md 줄 수 > threshold AND topic 0 AND `_tmp/` 0 |

(`W-MRG-01` git 이력 기반은 v0.58.1 이연.)

### F5. 6 C-Level agent md 블록 복붙 (Option A)

v0.57 선례. `_shared/clevel-main-guard.md` canonical → `<!-- clevel-main-guard begin vX.Y.Z -->` 마커로 6 agent md 본문 삽입. `scripts/patch-clevel-guard.js` idempotent.

### F6. `_shared/clevel-main-guard.md` 신설

canonical 소스. 내용:
1. main.md 진입 프로토콜 (Read 먼저)
2. H2 섹션 규약 (`## [{C-LEVEL}] ...`)
3. Decision Record 표 자기 행 append
4. Topic Documents 인덱스 갱신
5. Topic frontmatter owner 규약
6. 재진입(동일 owner) 시 섹션 교체 + 변경 이력 엔트리 필수
7. 금지: 다른 C-Level 섹션 수정·삭제
8. **(F14) size budget 규칙** — main.md 가 threshold 초과 시 topic 분리
9. enforcement=warn

### F7. 5 templates 업데이트

plan/design/do/qa/report `.template.md`:
- Executive Summary 에 `Contributing C-Levels` 컬럼
- Decision Record 에 `Owner` 컬럼
- `## [{C-LEVEL}]` 플레이스홀더 주석
- **(F14)** `<!-- size budget: main.md ≤ 200 lines 권장 (초과 시 topic 분리) -->`

### F8. CLAUDE.md Rule #15 신설

> **C-Level 공존 원칙 (v0.58+)** — 같은 `{NN-phase}/main.md` 에 여러 C-Level 기여. 각 C-Level 은 자기 `## [{C-LEVEL}] ...` 섹션 append, 다른 섹션 수정·삭제 금지. topic 은 frontmatter `owner` 필수, 파일명은 topic-first. **(F14) main.md 가 `cLevelCoexistencePolicy.mainMdMaxLines` 초과 시 topic 분리 필수 — C-Level 직접 작성 phase 도 동일.** 검증: `W-OWN-*` / `W-MRG-*` / `W-MAIN-SIZE`.

AGENTS.md / README.md 동기화.

### F9. `cLevelCoexistencePolicy` 정책 키

```json
"cLevelCoexistencePolicy": {
  "enforcement": "warn",
  "mainMergeRule": "append-only",
  "sectionMarkerStyle": "heading",
  "ownerRequired": true,
  "reentrySectionReplace": true,
  "reentryChangelogRequired": true,
  "mainMdMaxLines": 200,
  "mainMdMaxLinesAction": "warn"
}
```

### F11. `lib/status.js` 확장

```javascript
registerTopic(feature, phase, topic, { owner, authors })
listFeatureTopics(feature, phase?)
listScratchpadAuthors(feature, phase)       // D-Q3 헬퍼
getOwnerSectionPresence(feature, phase)
getFeatureTopics(feature, phase)            // D-Q6 인터페이스 (구현 v0.58.1)
getMainDocSize(feature, phase)              // (F14) 줄 수 측정
```

### F12. `scripts/patch-clevel-guard.js`

`patch-subdoc-frontmatter.js` 복제. idempotent. 삽입 위치는 `<!-- subdoc-guard end -->` 직후.

### F13. 버전 bump

4 파일 + `CHANGELOG.md` 0.57.0 → 0.58.0.

### F14. (신규 — 사용자 지적 2026-04-20) C-Level 직접 작성 phase topic 분리 강제

- **문제**: v0.57 모델은 "sub-agent 호출 → `_tmp/` → C-Level 큐레이션 → topic" 루프 전제. CTO 직접 작성 phase(ui-designer 미적용 메타 피처 등) 에서는 `_tmp/` 미생성 → topic 트리거 부재 → main.md 비대화 재발.
- **해결**:
  1. `cLevelCoexistencePolicy.mainMdMaxLines` (기본 200) + `mainMdMaxLinesAction` 정책 추가
  2. `scripts/doc-validator.js` `W-MAIN-SIZE` 경고 추가
  3. `agents/_shared/clevel-main-guard.md` §8 size budget 규칙 포함
  4. 5 templates 에 size budget 주석
  5. `lib/status.js > getMainDocSize()` 헬퍼
- **자가 적용**: 본 피처의 01-plan / 02-design 도 리팩토링(사용자 요청) → 이 피처가 자기 규칙을 시연.

## 3. MVP 포함 / 제외

**포함 (14건)**: F1, F2, F3, F3b, F4, F5, F6, F7, F8, F9, F11, F12, F13, **F14** (사용자 지적 — 2026-04-20 v1.1 갱신).

**제외 (v0.58.1+)**: F10 CEO 컨텍스트 자동 전파, `W-MRG-01` git 이력, `enforcement=fail`, 자동 conflict resolver.

## 4. 큐레이션 기록

| Source (`_tmp/...`) | 채택 | 거절 | 병합 | 추가 | 이유 |
|---------------------|:----:|:----:|:----:|:----:|------|
| (없음 — CTO 직접 작성 phase) | — | — | — | — | sub-agent 위임 없음. 본 topic 은 main.md v1.0 §2 에서 추출 |
| 사용자 원문 (2026-04-20) | ✅ | | | ✅ | "main.md 만 생기는 이유" — F14 추가 트리거 |

**필요성**: F14 는 본 피처 범위 내(C-Level 공존 이슈의 자연 확장). **충돌 없음** — 기존 F1-F13 과 독립.

## 5. 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-20 | 초기 작성 — F1-F13 MVP 정의 (main.md 에서 추출) |
| v1.1 | 2026-04-20 | F14 추가 (사용자 지적: C-Level 직접 작성 phase 에서도 topic 분리 강제) |
