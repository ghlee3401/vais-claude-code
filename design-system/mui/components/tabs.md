# Tabs

> **MUI Path**: `@mui/material/Tabs`
> **DS**: mui v1.0.1
> **Generated**: 2026-05-02T10:04:26.995Z

## Anatomy

```
[Tab | Tab | Tab] [Indicator]
```

## Variants

| Variant | Description | Token references |
|---------|-------------|------------------|
| `standard` | 기본 indicator | `color.primary.main` |
| `fullWidth` | 전체 폭 분할 | — |
| `scrollable` | 스크롤 가능 | — |

## States

`default` / `selected` / `hover` / `disabled` / `focus-visible`

## Accessibility

- role="tablist" / "tab" / "tabpanel"
- aria-selected, aria-controls
- keyboard: Arrow keys 이동, Tab 으로 panel 진입

## Usage Example

```tsx
<Tabs value={value} onChange={handleChange}>
  <Tab label="One" />
  <Tab label="Two" />
</Tabs>
```

## 디자인 가이드

ui-designer 산출물에 `Tabs` 사용 시:

1. variant / size / color prop 명시
2. 토큰 참조 — 인라인 hex/px 금지
3. states (default/hover/focus/disabled) 모두 와이어프레임에 명시
4. accessibility 요구사항 충족 (위 a11y 섹션)
