# Alert

> **MUI Path**: `@mui/material/Alert`
> **DS**: mui v1.0.1
> **Generated**: 2026-05-02T10:04:26.995Z

## Anatomy

```
[Icon | Title? | Message | Action?]
```

## Variants

| Variant | Description | Token references |
|---------|-------------|------------------|
| `standard` | 기본 (filled 배경) | `color.{severity}.main` |
| `filled` | 진한 색 | `color.{severity}.main` |
| `outlined` | 외곽선 | `color.{severity}.main` |

## States

`default`

## Accessibility

- role="alert"
- severity = error/warning/info/success → 색상으로 의미 + 아이콘 동반 (색상 only 금지)

## Usage Example

```tsx
<Alert severity="success">Saved successfully</Alert>
```

## 디자인 가이드

ui-designer 산출물에 `Alert` 사용 시:

1. variant / size / color prop 명시
2. 토큰 참조 — 인라인 hex/px 금지
3. states (default/hover/focus/disabled) 모두 와이어프레임에 명시
4. accessibility 요구사항 충족 (위 a11y 섹션)
