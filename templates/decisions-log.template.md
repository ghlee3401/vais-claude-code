---
owner: {synthesizer}
artifact: decisions-log
phase: {phase}
feature: {feature}
generated: {YYYY-MM-DD}
synthesizer: {synthesizer}
model-version: v2
summary: "{phase} 의사결정 타임라인"
---

# {feature} — Decisions Log ({phase})

> 1 event = 1 row. event-type enum / actor enum 명시.
> 본 timeline 은 SendMessage 대화 + Lazy Consensus 상태 전이를 박제한다.

## Events Timeline

| # | time (UTC ISO 8601) | actor | event-type | topic | ref | mode | messageHash |
|---|--------------------|-------|-----------|-------|-----|------|-------------|
| 1 | {2026-mm-ddT...} | {actor} | {제기|반박|합의|pivot|timeout} | {한 줄 요약} | {링크 또는 hash} | {real\|simulated} | {sha256 또는 —} |

> real 모드 = CC 내장 SendMessage 도구 사용 / simulated = CTO 일괄 합성.
> event-type enum 정의는 동일. messageHash = SHA-256(response JSON), simulated 행은 `—`.
> 하위 호환: 기존 v1.0 timeline 행은 mode/messageHash 컬럼 비워도 valid.

**event-type enum**:
- `제기` — 새 의견/draft 제기
- `반박` — 기존 의견에 이의
- `합의` — Lazy Consensus 통과
- `pivot` — 모델/방향 자체 변경
- `timeout` — N턴 초과 강행 합성

**actor enum**:
- `PO` — 외부 사용자
- `{c-level}` — ceo/cpo/cto/cso/cbo/coo
- `*` — 전체 합의
- `system` — 자동 박제 (hook 등)

## Lazy Consensus 상태

| Item | Draft 작성자 | Review window (N턴) | 이의 제기자 | 상태 |
|------|-------------|---------------------|-----------|------|
| {phase main.md} | {synthesizer} | {N=2 기본} | {C-Level 목록 또는 —} | {draft|review-window|consensus-reached|timeout} |

## 참여 actor 목록 (이 phase)

| Actor | 역할 | 메시지 수 (추정) |
|-------|------|-----------------|
| PO | {의사결정자|승인자} | {N} |
| {synthesizer} | 합성자 / 도메인 리드 | {N} |
| {other c-level} | 참여 | {N} |

## 미참여 사유 박제 (선택)

- **{c-level}**: {왜 본 phase 에 참여하지 않았는지 — phase 성격, 도메인 부적합 등}

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | {date} | 초기 작성 — {N} events 박제 |

<!-- decisions-log template version: v2.0 -->
