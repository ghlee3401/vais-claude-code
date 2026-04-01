---
name: absorb
description: 외부 레퍼런스 평가 및 흡수. CEO가 오케스트레이션 주체.
---

# /vais absorb — Reference Absorption

> ⚠️ **absorb는 CEO가 오케스트레이션합니다.**
>
> `phases/ceo.md`를 읽고 **Reference Absorption** 섹션의 지침에 따라 실행하세요.

## 라우팅

`/vais absorb {path}` 명령은 CEO 에이전트가 처리합니다:

1. Read 도구로 `${CLAUDE_SKILL_DIR}/phases/ceo.md`를 읽으세요.
2. **Reference Absorption (`/vais absorb`)** 섹션의 지침에 따라 실행하세요.
3. 전달 인자: path = `{path}` (사용자가 입력한 경로)

## 이력 조회 (`/vais absorb --history`)

`.vais/absorption-ledger.jsonl` 파일을 읽어 출력합니다:

```
📋 흡수 이력
─────────────────────────────
총 {total}건 | 흡수: {absorbed} | 거부: {rejected} | 병합: {merged}

최근 항목:
| 날짜 | 판정 | 소스 | 이유 |
|------|------|------|------|
| ... | ✅ absorbed | ../bkit/gap-detector.md | 품질 양호, CSO에 배치 |
| ... | ❌ rejected | ../old-skill.md | 중복 (cso.md와 90% 겹침) |
```
