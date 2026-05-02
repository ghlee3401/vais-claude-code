# Snackbar

> **MUI Path**: `@mui/material/Snackbar`
> **DS**: mui v1.0.1
> **Generated**: 2026-05-02T10:04:26.995Z

## Anatomy

```
[Message | Action?]
```

## Variants

| Variant | Description | Token references |
|---------|-------------|------------------|
| `default` | 기본 | `color.text.primary`, `color.background.paper` |

## States

`hidden` / `entering` / `visible` / `exiting`

## Accessibility

- role="alert" 또는 "status"
- autoHideDuration 권장 (4~10s)
- 키보드/스크린리더 즉시 알림

## Usage Example

```tsx
<Snackbar open={open} autoHideDuration={6000} onClose={handleClose} message="Saved" />
```

## 디자인 가이드

ui-designer 산출물에 `Snackbar` 사용 시:

1. variant / size / color prop 명시
2. 토큰 참조 — 인라인 hex/px 금지
3. states (default/hover/focus/disabled) 모두 와이어프레임에 명시
4. accessibility 요구사항 충족 (위 a11y 섹션)
