# Switch

> **MUI Path**: `@mui/material/Switch`
> **DS**: mui v1.0.1
> **Generated**: 2026-05-02T10:04:26.995Z

## Anatomy

```
[Track [Thumb]]
```

## Variants

| Variant | Description | Token references |
|---------|-------------|------------------|
| `default` | 기본 | `color.primary.main`, `radius.large` |

## Sizes

| Size | width |
|------|------|
| `small` | 34 |
| `medium` | 58 |

## States

`off` / `on` / `hover` / `disabled` / `focus-visible`

## Accessibility

- role="switch"
- aria-checked: true|false
- keyboard: Space toggle

## Usage Example

```tsx
<Switch checked={checked} onChange={handleChange} />
```

## 디자인 가이드

ui-designer 산출물에 `Switch` 사용 시:

1. variant / size / color prop 명시
2. 토큰 참조 — 인라인 hex/px 금지
3. states (default/hover/focus/disabled) 모두 와이어프레임에 명시
4. accessibility 요구사항 충족 (위 a11y 섹션)
