### 테스트 실행

#### Step 1: 테스트 프레임워크 감지

프로젝트 루트의 설정 파일을 Glob/Grep으로 탐색하여 테스트 프레임워크를 감지합니다:

| 감지 대상 | 프레임워크 | 실행 명령 |
|-----------|-----------|----------|
| `jest.config.*`, `package.json`의 `"jest"` | Jest | `npx jest` |
| `vitest.config.*`, `package.json`의 `"vitest"` | Vitest | `npx vitest run` |
| `pytest.ini`, `pyproject.toml`의 `[tool.pytest]` | pytest | `pytest` |
| `*.test.js`, `*.spec.ts` (설정 파일 없음) | Node test runner | `node --test` |

- 프레임워크를 감지하지 못하면 AskUserQuestion으로 사용자에게 테스트 실행 방법을 확인합니다.
- `package.json`의 `scripts.test`가 있으면 `npm test`를 우선 사용합니다.

#### Step 2: 테스트 실행

1. 감지된 프레임워크로 테스트 실행
2. 실패한 테스트가 있으면 에러 메시지 분석 → 원인 파악 → 수정 제안
3. 수정 후 재실행하여 통과 확인

#### Step 3: 커버리지 리포트

- `--coverage` 플래그를 지원하는 경우 커버리지 포함 실행
- 결과 요약: 전체 커버리지 %, 미커버 파일 목록
