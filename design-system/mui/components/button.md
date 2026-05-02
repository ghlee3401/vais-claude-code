# Button

> **MUI Path**: `@mui/material/Button`
> **DS**: mui v1.0.1
> **Generated**: 2026-05-02T10:04:26.994Z

## Anatomy

```
[Icon? | Label | Icon?]
```

## Variants

| Variant | Description | Token references |
|---------|-------------|------------------|
| `text` | Borderless, low emphasis | `color.primary.main` |
| `outlined` | Bordered, medium emphasis | `color.primary.main`, `radius.medium` |
| `contained` | Filled, high emphasis | `color.primary.main`, `shadow.2` |

## Sizes

| Size | height | padding | typography |
|------|------|------|------|
| `small` | 30 | 4px 10px | button (0.8125rem) |
| `medium` | 36 | 6px 16px | button (0.875rem) |
| `large` | 42 | 8px 22px | button (0.9375rem) |

## States

`default` / `hover` / `active` / `disabled` / `focus-visible`

## Accessibility

- role="button" 자동 적용
- keyboard: Enter / Space 활성화
- disabled 시 aria-disabled="true"
- focus-visible outline 은 color.primary.main 사용

## Usage Example

```tsx
<Button variant="contained" color="primary" size="medium">
  Submit
</Button>
```

## 디자인 가이드

ui-designer 산출물에 `Button` 사용 시:

1. variant / size / color prop 명시
2. 토큰 참조 — 인라인 hex/px 금지
3. states (default/hover/focus/disabled) 모두 와이어프레임에 명시
4. accessibility 요구사항 충족 (위 a11y 섹션)
