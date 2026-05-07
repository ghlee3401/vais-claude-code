# Outro Format (shared, v2.1)

모든 C-Level phase 완료 시 outro 포맷. checkpointPolicy.mode 에 따라 분기.

## Lean mode 자동 진행 outro (CP 미발동)

```
─────────────────────────────────────────────
✓ {phase} 완료 — 자동 진행
─────────────────────────────────────────────
| 항목 | 결과 |
|------|------|
| 범위 | {minimal/standard/extended} (autoSelect) |
| 핵심 결정 | {1줄 요약} |
| 다음 | {next phase 또는 종료} |
| 수정 원하시면 | `/vais {role} {phase} --review` |
```

## Strict/CP 발동 outro

CP 가 발동된 경우 (CP-0/CP-Q/destructive 등):

1. 산출물 핵심 요약 (3~10줄, 펜스 밖 표 권장)
2. CEO 추천 블록 (다음 단계 추천 + 트레이드오프)
3. **`---` 수평선** 으로 작업 요약과 CEO 추천 블록 분리
4. AskUserQuestion 도구 호출

> `---` 누락 시 가독성 심각하게 저하. 항상 포함.

## CEO 추천 블록 형식

```
---

📍 CEO 추천 — 다음 단계
{1~2 문장 추천 사유}
```

선택지는 텍스트 나열 금지. AskUserQuestion 으로만 제시.
