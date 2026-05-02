# Material UI Design System (mui)

> **DS**: `mui` v1.0.1
> **Source**: Material UI for Figma (Community) + @mui/material npm
> **License**: Apache-2.0 (MUI) + Figma Community
> **Generated**: 2026-05-02T10:04:26.995Z
> **Importer**: `scripts/import-mui-design-system.js`

본 문서는 **자동 생성**된 디자인 시스템 카탈로그입니다. 직접 편집하지 말고 `scripts/import-mui-design-system.js` 를 재실행하세요.

---

## 사용 가이드

이 카탈로그는 ui-designer agent와 사람이 디자인할 때 참조하는 **single source of truth**입니다.

- **토큰을 직접 사용**: `color.primary.main` 같은 토큰 ID 로 참조. hex 값을 인라인하지 마세요.
- **컴포넌트 어휘**: 19 개 핵심 컴포넌트의 anatomy/variants/sizes/states 를 따르세요.
- **확장이 필요하면**: `design-system/_overrides.json` 에 사내 토큰 추가 → 재실행 시 우선 적용.
- **갱신**: Figma 자료가 바뀌면 `node scripts/import-mui-design-system.js` 재실행.

---

## 토큰 (94+)

| 카테고리 | 개수 | 파일 |
|---------|:----:|------|
| Color | 55 | [tokens/color.md](./tokens/color.md) |
| Typography | 14 | [tokens/typography.md](./tokens/typography.md) |
| Spacing | unit=8, scale 10단계 | [tokens/spacing.md](./tokens/spacing.md) |
| Radius | 4 | [tokens/radius.md](./tokens/radius.md) |
| Shadow (elevation) | 25 | [tokens/shadow.md](./tokens/shadow.md) |

---

## 컴포넌트 (19)

| # | Component | MUI Path | 파일 |
|---|-----------|----------|------|
| 1 | Button | `@mui/material/Button` | [components/button.md](./components/button.md) |
| 2 | IconButton | `@mui/material/IconButton` | [components/icon-button.md](./components/icon-button.md) |
| 3 | TextField | `@mui/material/TextField` | [components/text-field.md](./components/text-field.md) |
| 4 | Select | `@mui/material/Select` | [components/select.md](./components/select.md) |
| 5 | Checkbox | `@mui/material/Checkbox` | [components/checkbox.md](./components/checkbox.md) |
| 6 | Radio | `@mui/material/Radio` | [components/radio.md](./components/radio.md) |
| 7 | Switch | `@mui/material/Switch` | [components/switch.md](./components/switch.md) |
| 8 | Slider | `@mui/material/Slider` | [components/slider.md](./components/slider.md) |
| 9 | Card | `@mui/material/Card` | [components/card.md](./components/card.md) |
| 10 | Modal | `@mui/material/Modal` | [components/modal.md](./components/modal.md) |
| 11 | Dialog | `@mui/material/Dialog` | [components/dialog.md](./components/dialog.md) |
| 12 | Snackbar | `@mui/material/Snackbar` | [components/snackbar.md](./components/snackbar.md) |
| 13 | Alert | `@mui/material/Alert` | [components/alert.md](./components/alert.md) |
| 14 | Tabs | `@mui/material/Tabs` | [components/tabs.md](./components/tabs.md) |
| 15 | Menu | `@mui/material/Menu` | [components/menu.md](./components/menu.md) |
| 16 | Tooltip | `@mui/material/Tooltip` | [components/tooltip.md](./components/tooltip.md) |
| 17 | Chip | `@mui/material/Chip` | [components/chip.md](./components/chip.md) |
| 18 | Avatar | `@mui/material/Avatar` | [components/avatar.md](./components/avatar.md) |
| 19 | Input | `@mui/material/Input` | [components/input.md](./components/input.md) |

---

## 출처 + 신뢰도

| Source | 의미 | confidence |
|--------|------|:----------:|
| `mui-npm (figma-validated)` | Figma 가 토큰 존재 확인 + MUI npm 이 값 제공 | 90 |
| `mui-npm` | MUI npm 디폴트만 (Figma 미일치/스킵) | 50 |
| `figma+mui` | Figma 와 MUI 값 모두 비교 (일치 시 100) | 80~100 |
| `override` | `_overrides.json` 우선 적용 | 100 |
| `figma-only` | Figma 만 (MUI 디폴트 없음) | 30 |

---

## Inputs (lockfile 참조)

| Input | Value |
|-------|-------|
| Figma file | `X10nxc156LeEsmUHI1uOtO` (2026-04-30T03:38:34Z) |
| MUI npm | `@mui/material@6.5.0` |
| Overrides | _(none)_ |

자세한 입출력 hash 는 [`lockfile.json`](./lockfile.json), 변경 이력은 [`CHANGELOG.md`](./CHANGELOG.md).
