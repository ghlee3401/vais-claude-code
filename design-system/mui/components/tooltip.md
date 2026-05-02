# Tooltip

> **MUI Path**: `@mui/material/Tooltip`
> **DS**: mui v1.0.1
> **Generated**: 2026-05-02T10:04:26.995Z

## Anatomy

```
[Trigger] → [Tooltip Body]
```

## Variants

| Variant | Description | Token references |
|---------|-------------|------------------|
| `default` | 기본 (dark) | `color.grey.700` |
| `arrow` | 화살표 포함 | `color.grey.700` |

## States

`hidden` / `visible`

## Accessibility

- role="tooltip"
- aria-describedby 자동
- enter/leave delay 권장

## Usage Example

```tsx
<Tooltip title="Delete">
  <IconButton><DeleteIcon /></IconButton>
</Tooltip>
```

## 디자인 가이드

ui-designer 산출물에 `Tooltip` 사용 시:

1. variant / size / color prop 명시
2. 토큰 참조 — 인라인 hex/px 금지
3. states (default/hover/focus/disabled) 모두 와이어프레임에 명시
4. accessibility 요구사항 충족 (위 a11y 섹션)
