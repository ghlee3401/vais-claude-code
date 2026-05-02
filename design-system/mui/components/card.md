# Card

> **MUI Path**: `@mui/material/Card`
> **DS**: mui v1.0.1
> **Generated**: 2026-05-02T10:04:26.995Z

## Anatomy

```
[Header? | Media? | Content | Actions?]
```

## Variants

| Variant | Description | Token references |
|---------|-------------|------------------|
| `elevation` | 그림자 | `shadow.1`, `radius.medium` |
| `outlined` | 외곽선 | `color.divider`, `radius.medium` |

## States

`default` / `hover (interactive)` / `focus-visible (interactive)`

## Accessibility

- interactive 카드는 role="button" + tabIndex={0} 명시
- CardActionArea 권장

## Usage Example

```tsx
<Card variant="outlined">
  <CardContent>...</CardContent>
</Card>
```

## 디자인 가이드

ui-designer 산출물에 `Card` 사용 시:

1. variant / size / color prop 명시
2. 토큰 참조 — 인라인 hex/px 금지
3. states (default/hover/focus/disabled) 모두 와이어프레임에 명시
4. accessibility 요구사항 충족 (위 a11y 섹션)
