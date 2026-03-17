# Changelog

## [0.11.1] - 2026-03-17

### Added

- **`.claude/settings.json` 훅 등록** — 플러그인 미설치 환경에서도 Stop, UserPromptSubmit, PreToolUse, PostToolUse 훅이 동작하도록 프로젝트 설정 파일 추가

---

## [0.10.0] - 2026-03-15

### Added

- **Manager 에이전트** — 프로젝트 최상위 의사결정자. 전체 히스토리 기억, 피처 간 의존성 관리, Tech Lead 지시
  - `/vais manager` — Query 모드 (프로젝트 현황, 피처 히스토리, 의존성, 기술 부채 조회)
  - `/vais manager "자연어"` — Command 모드 (판단 후 Tech Lead에 위임)
  - 두 가지 모드: Query (질의 → memory 조회 → 답변), Command (실행 요청 → 판단 → Tech Lead 지시)
- **Memory 시스템** (`lib/memory.js`) — `.vais/memory.json` 영속 메모리
  - 7가지 엔트리 타입: decision, change, feedback, dependency, debt, error, milestone
  - 피처별/타입별/기간별 조회, 의존성 맵, 기술 부채 관리, 프로젝트 요약
- **doc-tracker memory 연동** — 단계 완료 시 milestone 자동 기록

### Changed

- **auto 워크플로우** — Manager → Tech Lead 경유 구조로 변경
- **fix 워크플로우** — Manager 경유 크로스-피처 영향 분석 추가 (Step 0, Step 7)
- **SKILL.md** — manager 트리거 키워드 추가 (매니저, 현황, 히스토리, 부채, 의존성, 브리핑)
- **vais.config.json** — manager 설정 섹션 추가, team.maxTeammates 5→6
- **에이전트 계층 구조**: Manager (What & Why) → Tech Lead (How) → 전문 에이전트팀

---

## [0.9.1] - 2026-03-15

### Changed

- **README.md 전면 개선** — 중복 제거(체이닝 예시·auto 설명·병렬 매핑·설정 JSON+표), 빠른 시작 경량화, 변경 이력은 CHANGELOG 링크로 대체
- **제목 아래 버전·수정일 한 줄 표시** — `**v0.9.1** · 최종 수정 2026-03-14`
- **전체 날짜 수정** — 모든 파일의 2025 날짜를 2026-03-14로 통일

---

## [0.9.0] - 2026-03-14

### Changed

- **wireframe 스킬 통합** — 별도 `/wireframe` 스킬을 `/vais wireframe`으로 통합. 옵션(`--format`, `--device`) 및 컴포넌트 라이브러리를 wireframe 페이즈에 병합
- **fix 체이닝 방식 전환** — 직접 문서/코드 수정에서 영향 분석 후 적절한 단계 체이닝 실행으로 변경
- **check Gap 방향 판단** — Gap 발견 시 AskUserQuestion으로 구현 수정/설계 수정 선택권 부여

---

## [0.8.8] - 2026-03-14

### Fixed

- **`vais.config.json` gates 불일치** — `["plan", "design"]` → `["plan", "fe"]` (tech-lead.md와 동기화)
- **`plugin.json` hooks 경로** — `./hooks/hooks.json` → `../hooks/hooks.json` (plugin.json 기준 상대 경로)

---

## [0.8.7] - 2026-03-14

### Fixed

- **`status.js` 중복 조건문 제거** — `updatePhase()`에서 `idx + 1 < phases.length` 조건이 외부 조건과 중복
- **피처명 빈값 검증** — `initFeature()`, `saveFeatureRegistry()`에 빈 문자열/null 검증 추가
- **`loadConfig()` 캐싱** — 같은 프로세스 내 반복 JSON 파싱 방지 (성능 최적화)

---

## [0.8.6] - 2026-03-14

### Fixed

- **🔴 크리티컬: `status.js` `path` 모듈 누락** — 피처 레지스트리 함수(`saveFeatureRegistry`, `getFeatureRegistry`, `updateFeatureStatus`)가 `path.join()` 호출 시 크래시하던 버그 수정
- **`get-context.js` 다음 단계 표시 오류** — 현재 단계를 "다음"으로 잘못 표시하던 문제 수정. in-progress면 "📍 진행중", 아니면 "💡 다음"으로 표시
- **`doc-tracker.js` design-db 매핑** — `design-db` 문서 작성 시 `design` 단계로 올바르게 매핑
- **`prompt-handler.js` fix 키워드 충돌** — 일반 대화에서 "수정", "바꿔" 등으로 fix 모드 오진입 방지. `/vais fix` 명시 호출만 감지

### Changed

- **`session-start.js` 출력 형식 간소화** — `hookSpecificOutput` 중첩 구조 제거, `additionalContext`만 사용 (최신 스펙)
- **`plugin.json` 스키마 업데이트** — `agents`, `hooks` 필드 추가
- **`hooks.json`에 `Notification` 이벤트 추가** — 백그라운드 작업 완료 알림 처리

---

## [0.8.5] - 2026-03-14

### Added

- **`/vais fix` 명령어**: 영향 분석 기반 수정
  - 피처 자동 감지 → 영향 범위 분석 → 사용자 확인 → 코드·문서 일괄 수정 → 검증
  - 수정 유형별 영향 범위 매핑: UI/레이아웃, 기능, 정책, 데이터, 화면 추가/삭제
  - 정책 충돌 감지 — 기획서 정책과 충돌 시 사용자에게 알림
  - 수정 후 빌드 검증 + 문서 일관성 체크 (최대 3회 재시도)
  - prompt-handler 키워드: fix, 수정, 고쳐, 바꿔, 변경해, 이상해, 깨져, 틀어

---

## [0.8.4] - 2026-03-14

### Changed

- **단계명 간소화**: `frontend` → `fe`, `backend` → `be`
  - 커맨드: `/vais fe login`, `/vais be login`, `/vais fe+be login`
  - phases 배열, phaseNames, parallelGroups, prompt-handler 키워드 매핑 일괄 변경
  - 스킬 파일 이름: `frontend.md` → `fe.md`, `backend.md` → `be.md`
  - 에이전트 이름(`frontend-dev`, `backend-dev`)은 변경 없음
  - 기존 키워드 `frontend`, `backend` 입력 시 자동으로 `fe`, `be`로 매핑

---

## [0.8.3] - 2026-03-14

### Added

- **피처 레지스트리 시스템**: plan에서 정의된 기능 목록을 `.vais/features/{feature}.json`에 구조화 저장
  - `saveFeatureRegistry()`, `getFeatureRegistry()`, `updateFeatureStatus()` — `lib/status.js`
  - plan → ia → wireframe → design → fe → be → check → review 전 단계에서 자동 참조
  - 각 기능별 구현 상태 추적 (미구현 → 진행중 → 완료)
  - `get-context.js`에서 기능 목록 컨텍스트 자동 출력
- **모든 단계 스킬 파일에 피처 레지스트리 참조 추가**: ia, wireframe, design, fe, be, check, review

---

## [0.8.2] - 2026-03-14

### Fixed

- **Stop Handler 항상 표시**: 활성 피처가 없어도 버전 정보와 시작 안내를 표시
  - 기존: 활성 피처 없으면 푸터 미출력 → 사용자 혼란
  - 변경: 항상 `💠 v0.8.2` 버전 표시 + `💡 시작: /vais init <피처명>` 안내
- 활성 피처는 있으나 진행 요약이 없는 경우에도 기본 안내 표시

---

## [0.8.1] - 2026-03-14

### Added

- **QA 시나리오 리스트**: check 단계에서 기획서 기반 QA 시나리오 자동 생성, review 단계에서 Pass/Fail 판정
  - 핵심 기능 테스트, 엣지 케이스, UI/UX 검증 포함
  - QA 통과율 산출하여 최종 판정에 반영
- **`/vais init` 명령어**: 기존 프로젝트에 VAIS Code 적용
  - 코드베이스 분석 → research/plan/ia/wireframe/design 문서 역생성
  - 코드 수정 없이 문서만 생성하여 워크플로우 진입 준비

---

## [0.8.0] - 2026-03-14

### Changed

- **워크플로우 10단계 → 9단계로 간소화 (docs 폴더 10개 → 7개)**
  - `convention` 단계 제거 → 코딩 규칙을 plan(기획) 단계에 통합
  - `frontend` / `backend` 단계는 유지하되 docs 폴더만 제거 (코드가 산출물)
  - docs 폴더 번호 재배정: 01-research ~ 07-review
- 모든 파일에서 phase 참조, 문서 경로, 다이어그램 일괄 동기화
- 버전 v0.7.0 → v0.8.0

### Removed

- `skills/vais/phases/convention.md` (convention 단계)
- `templates/convention.template.md`
- `docPaths`에서 frontend, backend 경로 (단계 자체는 유지)

---

## [0.7.0] - 2026-03-14

### Changed

- **SKILL.md를 Skills 2.0 구조로 리팩토링** — 491줄 모놀리식 → ~50줄 슬림 라우터
  - `!`cat`` 전처리로 `$0`(액션)에 해당하는 phase 파일만 동적 로드
  - `!`node`` 전처리로 현재 워크플로우 상태 동적 주입
  - `$ARGUMENTS` (`$0`, `$1`) 네이티브 치환 활용
  - frontmatter `tools` → `allowed-tools` (Skills 2.0 스펙)
- **session-start.js 경량화** — 176줄 → 50줄 (상세 컨텍스트는 SKILL.md가 담당)
- **output-styles 정리** — Quick/Full 레벨 참조 제거, 10칸 진행률로 통일

### Added

- `skills/vais/phases/` — 14개 phase별 독립 참조 파일
- `scripts/get-context.js` — 워크플로우 상태 마크다운 출력 스크립트
- `CHANGELOG.md` — 릴리즈 노트 분리

### Removed

- Quick/Full 2레벨 시스템 관련 설명 일괄 제거

---

## [0.6.3] - 2026-03-14

### Changed

- Gap 분석 자동 반복 로직 개선 (최대 5회, 90% 기준)
- 보안 스캔을 check 단계에 통합

### Added

- 컴포넌트 어노테이션 (`data-component`, `data-props`)
- 문서 참조 투명성 (에이전트 참조 문서 기록)
- CSS 파일 자동 감지 (frontend 단계)

---

## [0.6.0] - 2026-03-14

### Added

- 체이닝 문법 (`:` 순차, `+` 병렬)
- 설계 병렬화 (UI + DB)
- 5명 에이전트 팀 (tech-lead, designer, frontend-dev, backend-dev, reviewer)
- 빌드 검증 통합 Gap 분석
- Plan-Plus 3단계 검증
- 6개 훅 시스템
- 50개 유닛 테스트

---

## [0.5.0] - 2026-03-14

### Added

- 10단계 개발 워크플로우 초기 구현
- `/vais auto` 자동 워크플로우
- 와이어프레임 생성 (ASCII/HTML)
- `.vais/status.json` 상태 관리
