# VAIS 하네스 — 제품 노트

> 이 폴더는 vais-code 플러그인 자체의 설계 정본이다. 원본 승인 기록: `docs/work-items/harness-design/2026-09-15-harness-design/` (Design revision 1, 2026-09-15 사용자 승인).

## 한 장 요약 (비개발자용)

비개발자가 개발자처럼 웹 앱을 만들게 하는 하네스의 설계 정본이다. 요구사항부터 구현까지 11단계 사슬을 단계마다 문서·ID·승인·기록으로 묶고, 앞 단계 승인 없이는 다음 단계를 못 가게 runtime 억지력이 막는다. 단계마다 기획자·디자이너·개발자·QA 역할 카드가 붙고, 사용자는 말하기·고르기·확인만 한다. 기억·안전·확장이 바탕이다.

## 목차

| 문서 | 내용 |
|---|---|
| [design.md](design.md) | 설계 정본 — 원칙, 사슬 11단계, ID 사슬, 억지력, 루프와 kind, 제품 노트, 명령, 바탕 셋, 역할, 대응표, 사용 장면 6, 결함, 로드맵 |
| [roadmap.md](roadmap.md) | 후속 작업 H1~H8 순서·규모·의존·완료 조건 |

## 상태

| 항목 | 값 |
|---|---|
| 설계 승인 | 2026-09-15 (Design revision 1) |
| 구현 | 로드맵 H1~H8 완료 (4.0.1, 2026-09-17) |
| 현재 커널 | v2 runtime 모듈 38 (`lib/workflow/v2/*.js`, index.js 포함), hook 이벤트 5 · 스크립트 6, CLI 1 (`scripts/vais-workflow-v2.js`) |

세는 기준: 모듈은 `lib/workflow/v2` 의 `.js` 파일 수, hook 이벤트는 `hooks/hooks.json` 의 최상위 키 수, hook 스크립트는 그 파일이 부르는 `hooks/*.js` 의 서로 다른 수, CLI 는 hook 이 명령 형태를 지정하는 `scripts/vais-workflow-v2.js` 하나. 버전은 `vais.config.json > version`.
