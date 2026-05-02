# Chip

> **MUI Path**: `@mui/material/Chip`
> **DS**: mui v1.0.1
> **Generated**: 2026-05-02T10:04:26.995Z

## Anatomy

```
[Avatar/Icon? | Label | Delete Icon?]
```

## Variants

| Variant | Description | Token references |
|---------|-------------|------------------|
| `filled` | 기본 채움 | `color.action.selected` |
| `outlined` | 외곽선 | `color.divider`, `radius.large` |

## Sizes

| Size | height |
|------|------|
| `small` | 24 |
| `medium` | 32 |

## States

`default` / `clickable` / `disabled` / `deletable` / `focus-visible`

## Accessibility

- clickable 시 role="button"
- delete 아이콘은 별도 버튼
- keyboard: Enter / Backspace(delete)

## Usage Example

```tsx
<Chip label="Tag" onDelete={handleDelete} />
```

## 디자인 가이드

ui-designer 산출물에 `Chip` 사용 시:

1. variant / size / color prop 명시
2. 토큰 참조 — 인라인 hex/px 금지
3. states (default/hover/focus/disabled) 모두 와이어프레임에 명시
4. accessibility 요구사항 충족 (위 a11y 섹션)
