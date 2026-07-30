# Code Conventions

> 상한 3KB. 근거 없는 규칙 추가 금지 — 메타 규칙은 `guidelines/README.md`.

## 모듈

- **CJS** (`require`/`module.exports`). ESM(.mjs) 신규 작성 금지 — 기존 `.mjs`는 마이그레이션 대상.
- 외부 의존성 추가는 기본 금지. 추가하려면 plan.md에 사유 명기 (현재 허용: `gray-matter`, `js-yaml`).
- Node 내장(`fs`, `path`, `child_process`)과 프로젝트 lib(`lib/*.js`)만으로 해결을 우선한다.

## 네이밍

- 파일: `kebab-case.js` / 함수·변수: `camelCase` / 상수: `UPPER_SNAKE`.
- 내부 전용(export 하지만 외부 계약 아님)은 `_` 접두 (`_renderX`, `_internal`).
- 이름은 동작을 서술: `getActiveFeature`, `ensureVaisDirs` — 축약어 금지(`cfg`, `mgr` 등).

## 에러 처리 — 두 가지 모드를 구분한다

| 코드 위치 | 모드 | 형태 |
|-----------|------|------|
| **hook / 상태 기록** (사용자 세션을 막으면 안 되는 곳) | fail-safe | `try { ... } catch (e) { debugLog(scope, msg, {error: e.message}); }` — 조용히 계속, 단 debugLog 필수 (완전 무음 `catch (_) {}`는 루프 내 개별 항목 처리에만 허용) |
| **CLI 스크립트 / 검증기** (실패를 알려야 하는 곳) | fail-loud | 한국어 에러 메시지 + `process.exit(1)` |

- hook의 stdout은 JSON 프로토콜 전용 — 사람용 경고는 `process.stderr.write`.

## 주석·문서화

- 파일 상단에 책임 1~3줄 주석 (한국어, `이 파일의 책임:` 패턴).
- export 함수에는 JSDoc (`@param`/`@returns`). 내부 함수는 이름으로 충분하면 생략.
- 외부 자료 참조 시 `// @see {URL}`.

## 테스트

- `node --test`, 파일명 `tests/{대상}.test.js` (통합: `tests/integration/`).
- 테스트 설명은 한국어로 동작을 서술: `test('활성 피처가 없으면 null을 반환한다', ...)`.
- 모듈 삭제 시 그 모듈의 테스트도 같은 커밋에서 삭제한다.
- 파일시스템을 만지는 테스트는 tmp 디렉토리 사용 — 리포지토리 트리를 오염시키지 않는다.

## 금지

- `rm -rf`, `git push --force`, `DROP TABLE` — 코드·스크립트 내에서도 생성 금지.
- 시크릿 하드코딩 금지 — 환경 변수로만.
- 한 함수가 상태 저장 + 렌더링 + I/O를 겸하지 않는다 (status.js 비대화의 교훈).
