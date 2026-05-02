# IconButton

> **MUI Path**: `@mui/material/IconButton`
> **DS**: mui v1.0.1
> **Generated**: 2026-05-02T10:04:26.995Z

## Anatomy

```
[Icon]
```

## Variants

| Variant | Description | Token references |
|---------|-------------|------------------|
| `default` | 아이콘 단독 버튼 | `color.action.active`, `radius.circle` |

## Sizes

| Size | height |
|------|------|
| `small` | 30 |
| `medium` | 40 |
| `large` | 48 |

## States

`default` / `hover` / `active` / `disabled` / `focus-visible`

## Accessibility

- aria-label 필수 (텍스트 라벨이 없으므로)
- keyboard: Enter / Space

## Usage Example

```tsx
<IconButton aria-label="delete" size="medium">
  <DeleteIcon />
</IconButton>
```

## 디자인 가이드

ui-designer 산출물에 `IconButton` 사용 시:

1. variant / size / color prop 명시
2. 토큰 참조 — 인라인 hex/px 금지
3. states (default/hover/focus/disabled) 모두 와이어프레임에 명시
4. accessibility 요구사항 충족 (위 a11y 섹션)
