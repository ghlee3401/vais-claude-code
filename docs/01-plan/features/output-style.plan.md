# output-style Planning Document

> **Summary**: vais-code output-style이 적용되지 않는 문제 수정 — plugin.json 필드 복원, SessionStart hook에 하단 리포트 규칙 주입, vais-default.md 현행화
>
> **Project**: vais-code
> **Version**: 0.17.0
> **Author**: ghlee0304
> **Date**: 2026-03-25
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | v0.15.0에서 plugin.json의 `outputStyles` 필드가 삭제되어 Claude Code가 vais-code output-style을 발견/적용하지 못함. bkit의 하단 리포트(Feature Usage)와 동등한 VAIS 하단 리포트도 미표시 |
| **Solution** | (1) plugin.json에 `outputStyles` 필드 복원, (2) SessionStart hook에 VAIS 하단 리포트 규칙 주입, (3) vais-default.md를 v0.17.0 워크플로우에 맞게 업데이트 |
| **Function/UX Effect** | 매 응답마다 VAIS 상태 리포트가 자동 표시되어 사용자가 현재 피처/단계/진행률을 즉시 파악 가능 |
| **Core Value** | 플러그인 브랜드 일관성 확보, 사용자 경험 향상, bkit과 동등한 output-style 인프라 구축 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | output-style 파일은 존재하지만 plugin.json 등록 누락으로 Claude Code가 인식 못 함 |
| **WHO** | vais-code 플러그인 사용자 |
| **RISK** | plugin.json 포맷 호환성 (이전에 "비표준" 이유로 삭제된 전적), hook 출력 포맷 오류 |
| **SUCCESS** | (1) `/output-style` 메뉴에 vais-default 표시, (2) 매 응답에 VAIS 하단 리포트 표시, (3) 기존 테스트 통과 |
| **SCOPE** | plugin.json 1필드 + session-start.js 하단리포트 규칙 추가 + vais-default.md 내용 개선 |

---

## 1. Overview

### 1.1 Purpose

vais-code의 output-style 인프라를 복구하고 강화하여, bkit의 "Feature Usage" 리포트와 동등한 "VAIS 하단 리포트"가 매 응답에 표시되도록 한다.

### 1.2 Background

- v0.14.1까지 plugin.json에 `"outputStyles": "./output-styles/"` 필드가 존재했음
- commit `cb38030` (v0.15.0)에서 "공식 문서 기준 플러그인 포맷 수정" 사유로 삭제
- 결과: `output-styles/vais-default.md` 파일은 있으나 Claude Code plugin loader가 미인식
- `lib/paths.js`의 `loadOutputStyle()` 함수도 정의만 되고 어디서도 호출되지 않음
- bkit은 SessionStart hook의 `additionalContext`에 Feature Usage 규칙을 주입하여 매 응답 강제 표시

### 1.3 Related Documents

| Document | Path |
|----------|------|
| bkit session-context.js | `~/.claude/plugins/cache/bkit-marketplace/bkit/2.0.6/hooks/startup/session-context.js` |
| vais session-start.js | `hooks/session-start.js` |
| vais plugin.json | `.claude-plugin/plugin.json` |
| vais-default.md | `output-styles/vais-default.md` |
| vais paths.js | `lib/paths.js` |

---

## 2. Requirements

### 2.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | plugin.json에 `outputStyles` 필드 복원 | Critical |
| FR-02 | SessionStart hook에 VAIS 하단 리포트 출력 규칙을 `additionalContext`에 주입 | Critical |
| FR-03 | vais-default.md 내용을 v0.17.0 6단계 워크플로우에 맞게 현행화 | Important |
| FR-04 | `loadOutputStyle()` 함수를 session-start.js에서 활용하거나, 미사용이면 제거 | Minor |

### 2.2 Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | 기존 테스트(`tests/`) 전부 통과 |
| NFR-02 | SessionStart hook 실행 시간 증가 최소화 (현재 대비 +50ms 이내) |
| NFR-03 | bkit output-style과 충돌 없음 (동시 설치 시 각각 독립 표시) |

---

## 3. Scope

### 3.1 In Scope

| 항목 | 파일 | 변경 내용 |
|------|------|-----------|
| plugin.json 복원 | `.claude-plugin/plugin.json` | `"outputStyles": "./output-styles/"` 필드 추가 |
| SessionStart hook 강화 | `hooks/session-start.js` | 하단 리포트 규칙을 `additionalContext`에 추가 |
| output-style 현행화 | `output-styles/vais-default.md` | 6단계 아이콘, 하단 리포트 포맷, 변경 이력 업데이트 |
| 데드코드 정리 | `lib/paths.js` | `loadOutputStyle()` 활용 여부 결정 |

### 3.2 Out of Scope

- 새로운 output-style 추가 (vais-learning, vais-enterprise 등은 향후 과제)
- bkit Feature Usage 포맷 변경
- vais.config.json 구조 변경

---

## 4. Technical Approach

### 4.1 Task 1: plugin.json `outputStyles` 필드 복원 (FR-01)

**파일**: `.claude-plugin/plugin.json`

**변경**:
```json
{
  "name": "vais-code",
  ...
  "outputStyles": "./output-styles/",
  ...
}
```

**근거**: Claude Code plugin loader는 `outputStyles` 필드를 읽어 해당 디렉토리의 `.md` 파일들을 output-style로 등록. 이전에 "비표준"으로 삭제했으나, bkit을 포함한 다수 플러그인이 사용 중인 표준 필드.

**위험**: 이전 삭제 사유("마켓플레이스 설치 실패")가 재발할 가능성 → 설치 테스트로 검증 필요.

### 4.2 Task 2: SessionStart hook에 하단 리포트 규칙 주입 (FR-02)

**파일**: `hooks/session-start.js`

**변경**: `additionalContext`에 VAIS 하단 리포트 규칙 섹션 추가

**주입할 규칙** (bkit의 `buildFeatureUsageRule()` 패턴 참고):

```markdown
## VAIS 하단 리포트 (Required for all responses)

**Rule: 매 응답 마지막에 아래 형식의 하단 리포트를 반드시 포함하세요.**

\```
────────────────────────────
💠 VAIS Code v{version}
────────────────────────────
🎯 피처: {현재 피처명 또는 "없음"}
📍 단계: {현재 단계 아이콘+이름}
📊 진행: [{n}/6] {진행바}
💡 다음: /vais {다음액션} {피처명}
────────────────────────────
\```

### 리포트 규칙:
1. 모든 응답 끝에 반드시 포함 (미포함 시 불완전 응답)
2. 진행 중 피처가 없으면 "피처: 없음", 단계/진행/다음은 생략
3. ✅=완료, 🔄=현재, ⬜=대기 (항상 6칸)
```

**구현 방식**: `loadOutputStyle()`로 `vais-default.md`를 읽어 하단 리포트 규칙 부분만 추출하는 것이 아니라, session-start.js에 직접 규칙 문자열을 포함 (bkit 패턴과 동일). output-style 파일은 Claude Code의 기본 스타일 시스템용, hook 주입은 강제 표시용.

### 4.3 Task 3: vais-default.md 현행화 (FR-03)

**파일**: `output-styles/vais-default.md`

**변경 사항**:
1. 하단 리포트 포맷이 session-start.js의 규칙과 일관되도록 동기화
2. 변경 이력에 v0.17.0 엔트리 추가
3. `keep-coding-instructions: true` frontmatter 추가 (bkit 패턴)
4. 현재 6단계 워크플로우 정확히 반영 확인

### 4.4 Task 4: 데드코드 정리 (FR-04)

**파일**: `lib/paths.js`

**판단**: `loadOutputStyle()` 함수는 session-start.js에서 직접 규칙을 주입하므로 불필요. 단, 향후 다른 hook이나 스킬에서 활용할 가능성이 있으므로 유지하되, JSDoc에 용도를 명시.

---

## 5. Implementation Order

```
1. plugin.json 복원 (FR-01) — 5분
   ↓
2. session-start.js 하단 리포트 규칙 추가 (FR-02) — 15분
   ↓
3. vais-default.md 현행화 (FR-03) — 10분
   ↓
4. loadOutputStyle() 정리 (FR-04) — 5분
   ↓
5. 테스트 실행 및 검증 — 10분
```

---

## 6. Success Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | `/output-style` 메뉴에서 `vais-default` 스타일이 표시됨 | 세션 재시작 후 확인 |
| SC-02 | 세션 시작 시 `additionalContext`에 하단 리포트 규칙이 포함됨 | `node hooks/session-start.js` 출력 확인 |
| SC-03 | 매 응답 하단에 VAIS Code 리포트 블록이 표시됨 | 실제 대화에서 확인 |
| SC-04 | `npm test` 전체 통과 | CI/테스트 실행 |
| SC-05 | bkit Feature Usage 리포트와 충돌 없이 공존 | 동시 활성화 시 확인 |

---

## 7. Risk Analysis

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| plugin.json `outputStyles` 필드가 마켓플레이스 설치 실패 유발 | High | Low | 로컬 설치 테스트 선행, 이전 삭제 커밋 사유 재검토 |
| SessionStart hook 출력이 너무 길어짐 | Medium | Low | 규칙 텍스트 최소화, 현재 bkit 수준과 동등하게 유지 |
| vais 하단 리포트와 bkit Feature Usage 충돌 | Medium | Low | 각각 독립 블록으로 표시, 포맷 구분 명확화 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-03-25 | 초기 작성 |
