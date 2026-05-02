# Menu

> **MUI Path**: `@mui/material/Menu`
> **DS**: mui v1.0.1
> **Generated**: 2026-05-02T10:04:26.995Z

## Anatomy

```
[Anchor] → [MenuItem | MenuItem | ...]
```

## Variants

| Variant | Description | Token references |
|---------|-------------|------------------|
| `default` | 기본 | `color.background.paper`, `shadow.8`, `radius.medium` |

## States

`closed` / `open`

## Accessibility

- role="menu" / "menuitem"
- keyboard: Arrow keys 이동, Enter/Escape
- focus 자동 첫 항목

## Usage Example

```tsx
<Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
  <MenuItem onClick={...}>A</MenuItem>
</Menu>
```

## 디자인 가이드

ui-designer 산출물에 `Menu` 사용 시:

1. variant / size / color prop 명시
2. 토큰 참조 — 인라인 hex/px 금지
3. states (default/hover/focus/disabled) 모두 와이어프레임에 명시
4. accessibility 요구사항 충족 (위 a11y 섹션)
