# Avatar

> **MUI Path**: `@mui/material/Avatar`
> **DS**: mui v1.0.1
> **Generated**: 2026-05-02T10:04:26.995Z

## Anatomy

```
[Image | Initials | Icon]
```

## Variants

| Variant | Description | Token references |
|---------|-------------|------------------|
| `circular` | 원형 (기본) | `radius.circle` |
| `rounded` | 둥근 사각 | `radius.medium` |
| `square` | 사각 | — |

## Sizes

| Size | size |
|------|------|
| `default` | 40 |

## States

`default`

## Accessibility

- 이미지 fallback (alt + 이니셜)
- 장식용은 aria-hidden, 의미 있으면 alt 필수

## Usage Example

```tsx
<Avatar src="/path.jpg" alt="User" />
```

## 디자인 가이드

ui-designer 산출물에 `Avatar` 사용 시:

1. variant / size / color prop 명시
2. 토큰 참조 — 인라인 hex/px 금지
3. states (default/hover/focus/disabled) 모두 와이어프레임에 명시
4. accessibility 요구사항 충족 (위 a11y 섹션)
