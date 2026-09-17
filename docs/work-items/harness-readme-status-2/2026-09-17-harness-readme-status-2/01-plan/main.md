---
schema: vais-phase/v1
work_item: WI-2026-09-17-harness-readme-status-2
phase: plan
revision: 1
status: approved
based_on: []
---

# Plan — 하네스 README 상태 표 갱신 (harness-readme-status-2)

kind: harness (플러그인 자체 문서 정리) · 규모: compact · 관련 작업: regression-and-docs(H7 문서 정리) 후속

## 1. 문제

`docs/harness/README.md` 는 설계 정본 폴더의 입구인데 `## 상태` 표가 H1 시점(2026-09-15)에 멈춰 있다. "구현: H1 진행 중", "현재 커널: 23 모듈, hook 4" 라고 적혀 있지만 실제는 로드맵 H1~H8 완료(4.0.1, 2026-09-17), 모듈·hook 수도 달라졌다. 처음 온 사람이 이 표를 믿으면 하네스가 아직 초기 단계라고 오해한다. 그 밖의 docs 는 확인 결과 손댈 것이 없다(README·features·product 는 자동 생성, work-items 는 증거 사슬).

## 2. 목표

`docs/harness/README.md` 한 파일이 저장소의 현재 상태(버전·로드맵 완료·모듈·hook·CLI 수)를 정확히 말하게 한다.

## 3. 범위

포함: `docs/harness/README.md` 의 `## 상태` 표, 그리고 같은 파일 요약·목차 문장 중 정본과 어긋난 숫자. 제외: `design.md`·`roadmap.md` 본문, 자동 생성 문서, 코드, docs 파일 삭제.

## 4. 요구사항

| ID | 요구사항 | 완료 조건 |
|---|---|---|
| REQ-001 | 상태 표의 구현·현재 커널 행을 현재 값으로 바꾼다. 값은 추측하지 않고 `lib/workflow/v2` 목록, `hooks/hooks.json`, `vais.config.json` 을 세어 적는다. | 표의 숫자·버전·날짜가 저장소와 일치 (Review 에서 재계산). |
| REQ-002 | 요약·목차 문장에서 정본(`design.md`, `contracts/chain-stages.json`)과 다른 숫자가 있으면 정본에 맞춘다. 없으면 "이상 없음" 으로 기록한다. | 어긋난 문장 0. |
| REQ-003 | 변경을 CHANGELOG 에 한 줄 남긴다. 문서만 바뀌므로 버전은 4.0.1 을 유지한다(사용자가 원하면 Design 에서 patch 올림으로 바꿀 수 있음). | CHANGELOG 항목 1건, 버전 7면 불일치 0. |

## 5. 사용자 흐름

사용자는 Design 의 바뀔 표 내용을 보고 승인만 한다. 이후 `docs/harness/README.md` 를 열면 4.0.1·H1~H8 완료가 보인다.

## 6. 엣지 케이스

- 모듈 수는 `index.js` 포함 여부로 달라진다 → Design 에서 세는 기준을 한 줄로 명시한다.
- hook 은 등록 이벤트 5종과 스크립트 6개가 다르다 → 표에 둘 다 적는다.
- 요약 문장의 "11단계 사슬" 이 `chain-stages.json` 단계 10과 다르면 REQ-002 대상이다.

## 7. 완료 조건

REQ-001~003 충족, `npm run validate`·`npm test` PASS(문서 변경이 검증을 깨지 않음 확인), 독립 QA PASS.

## 8. 영향

변경 파일: `docs/harness/README.md`, `CHANGELOG.md`. 코드·계약·상태 머신은 바꾸지 않는다. 커밋은 `/vais 저장` 흐름.
