# Dialog

> **MUI Path**: `@mui/material/Dialog`
> **DS**: mui v1.0.1
> **Generated**: 2026-05-02T10:04:26.995Z

## Anatomy

```
[Backdrop | Title | Content | Actions]
```

## Variants

| Variant | Description | Token references |
|---------|-------------|------------------|
| `default` | 기본 | `color.background.paper`, `shadow.24`, `radius.medium` |
| `fullScreen` | 전체 화면 | `color.background.paper` |

## Sizes

| Size | maxWidth |
|------|------|
| `xs` | 444 |
| `sm` | 600 |
| `md` | 900 |
| `lg` | 1200 |
| `xl` | 1536 |

## States

`closed` / `open`

## Accessibility

- role="dialog"
- aria-labelledby (DialogTitle id)
- aria-modal="true"
- focus trap

## Usage Example

```tsx
<Dialog open={open} onClose={handleClose}>
  <DialogTitle>Title</DialogTitle>
  <DialogContent>...</DialogContent>
  <DialogActions><Button>OK</Button></DialogActions>
</Dialog>
```

## 디자인 가이드

ui-designer 산출물에 `Dialog` 사용 시:

1. variant / size / color prop 명시
2. 토큰 참조 — 인라인 hex/px 금지
3. states (default/hover/focus/disabled) 모두 와이어프레임에 명시
4. accessibility 요구사항 충족 (위 a11y 섹션)
