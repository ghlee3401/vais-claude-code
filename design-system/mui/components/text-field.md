# TextField

> **MUI Path**: `@mui/material/TextField`
> **DS**: mui v1.0.1
> **Generated**: 2026-05-02T10:04:26.995Z

## Anatomy

```
[Label] [Input | Adornment?] [Helper Text? / Error?]
```

## Variants

| Variant | Description | Token references |
|---------|-------------|------------------|
| `outlined` | 기본 — 외곽선 | `color.text.primary`, `radius.medium` |
| `filled` | 배경 채움 | `color.action.hover` |
| `standard` | 하단 라인만 | `color.text.primary` |

## Sizes

| Size | height |
|------|------|
| `small` | 40 |
| `medium` | 56 |

## States

`default` / `focus` / `hover` / `disabled` / `error` / `readonly`

## Accessibility

- label 필수 (label prop 또는 aria-label)
- error 시 aria-invalid="true"
- helperText/error → aria-describedby

## Usage Example

```tsx
<TextField label="Email" variant="outlined" size="medium" />
```

## 디자인 가이드

ui-designer 산출물에 `TextField` 사용 시:

1. variant / size / color prop 명시
2. 토큰 참조 — 인라인 hex/px 금지
3. states (default/hover/focus/disabled) 모두 와이어프레임에 명시
4. accessibility 요구사항 충족 (위 a11y 섹션)
