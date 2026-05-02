# Design System Index

본 폴더는 등록된 디자인 시스템(DS)의 카탈로그입니다. 각 DS 는 `{ds-name}/` 서브폴더에 위치합니다.

> 이 인덱스는 **사람이 읽는 등록부**입니다. 런타임 라우팅 로직 없음 — ui-designer 가 컨텍스트에서 자연스럽게 참조합니다.

---

## mui

| Key | Value |
|-----|-------|
| Source | Material UI for Figma (Community) + @mui/material npm |
| License | Apache-2.0 (MUI) + Figma Community |
| Version | 1.0.1 |
| Lockfile | [`mui/lockfile.json`](./mui/lockfile.json) |
| MASTER | [`mui/MASTER.md`](./mui/MASTER.md) |
| Last Imported | 2026-05-02 |
| Importer | `scripts/import-mui-design-system.js` |

## 신규 DS 추가 패턴

새 DS 를 추가하려면:

1. `scripts/import-{ds}-design-system.js` 작성
2. `design-system/{ds}/` 디렉토리에 카탈로그 박제 (MASTER + tokens + components + lockfile + CHANGELOG)
3. 본 INDEX.md 에 `## {ds}` H2 entry 추가
