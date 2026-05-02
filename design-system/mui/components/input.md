# Input

> **MUI Path**: `@mui/material/Input`
> **DS**: mui v1.0.1
> **Generated**: 2026-05-02T10:04:26.995Z

## Anatomy

```
[Adornment? | Input | Adornment?]
```

## Variants

| Variant | Description | Token references |
|---------|-------------|------------------|
| `default` | TextField 의 저수준 컴포넌트 | `color.text.primary` |

## Sizes

| Size | height |
|------|------|
| `small` | 32 |
| `medium` | 40 |

## States

`default` / `focus` / `disabled` / `error` / `readonly`

## Accessibility

- 반드시 label 또는 aria-label 동반 (TextField 권장)
- error 시 aria-invalid="true"

## Usage Example

```tsx
<Input value={value} onChange={handleChange} />
// 권장: <TextField /> 사용
```

## 디자인 가이드

ui-designer 산출물에 `Input` 사용 시:

1. variant / size / color prop 명시
2. 토큰 참조 — 인라인 hex/px 금지
3. states (default/hover/focus/disabled) 모두 와이어프레임에 명시
4. accessibility 요구사항 충족 (위 a11y 섹션)
