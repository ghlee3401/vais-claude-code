# Select

> **MUI Path**: `@mui/material/Select`
> **DS**: mui v1.0.1
> **Generated**: 2026-05-02T10:04:26.995Z

## Anatomy

```
[Label] [Selected value | Dropdown icon] → Menu
```

## Variants

| Variant | Description | Token references |
|---------|-------------|------------------|
| `outlined` | 기본 | `color.text.primary`, `radius.medium` |
| `filled` | 배경 채움 | `color.action.hover` |
| `standard` | 하단 라인 | `color.text.primary` |

## Sizes

| Size | height |
|------|------|
| `small` | 40 |
| `medium` | 56 |

## States

`default` / `open` / `focus` / `disabled` / `error`

## Accessibility

- role="combobox"
- aria-expanded 동적 갱신
- keyboard: Arrow keys / Enter / Escape

## Usage Example

```tsx
<Select value={value} onChange={handleChange}>
  <MenuItem value="a">A</MenuItem>
</Select>
```

## 디자인 가이드

ui-designer 산출물에 `Select` 사용 시:

1. variant / size / color prop 명시
2. 토큰 참조 — 인라인 hex/px 금지
3. states (default/hover/focus/disabled) 모두 와이어프레임에 명시
4. accessibility 요구사항 충족 (위 a11y 섹션)
