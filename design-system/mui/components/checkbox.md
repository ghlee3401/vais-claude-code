# Checkbox

> **MUI Path**: `@mui/material/Checkbox`
> **DS**: mui v1.0.1
> **Generated**: 2026-05-02T10:04:26.995Z

## Anatomy

```
[Box (□ ☑ ⊟)]
```

## Variants

| Variant | Description | Token references |
|---------|-------------|------------------|
| `default` | 기본 | `color.primary.main` |

## Sizes

| Size | size |
|------|------|
| `small` | 30 |
| `medium` | 38 |

## States

`unchecked` / `checked` / `indeterminate` / `hover` / `disabled` / `focus-visible`

## Accessibility

- role="checkbox"
- aria-checked: true|false|"mixed"(indeterminate)
- keyboard: Space toggle

## Usage Example

```tsx
<Checkbox checked={checked} onChange={handleChange} />
```

## 디자인 가이드

ui-designer 산출물에 `Checkbox` 사용 시:

1. variant / size / color prop 명시
2. 토큰 참조 — 인라인 hex/px 금지
3. states (default/hover/focus/disabled) 모두 와이어프레임에 명시
4. accessibility 요구사항 충족 (위 a11y 섹션)
