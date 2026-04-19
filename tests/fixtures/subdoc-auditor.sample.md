# sample-feature — qa — qa-engineer

> Author: qa-engineer
> Phase: 04-qa
> Refs: docs/sample-feature/01-plan/main.md, docs/sample-feature/03-do/main.md
> Summary: Gap 93%, Critical 0, Important 3 — 로그인 잠금 로직 미커버, 나머지 pass

## 1. Context

- 작업 요청: CTO Do (auth 구현) 완료 후 Gap 분석 + QA
- 선행 의사결정: Plan §SC-01~07, Design Interface Contract 8 endpoint
- 스코프: 기능 / API 계약 / 빌드 / 테스트 커버리지

## 2. 감사 결과

### 2.1 검사 범위
- src/auth/*.ts (8 파일), tests/auth/*.test.ts (4 파일)
- npm test + npm run build + gap analyzer

### 2.2 Verdict
- overall: **pass_with_warnings**
- criticalCount: 0
- importantCount: 3
- matchRate: 93%

### 2.3 Findings — Critical

(없음)

### 2.4 Findings — Important

| # | Issue | File:Line | Impact | Suggested Fix |
|---|-------|-----------|--------|--------------|
| 1 | 로그인 5회 실패 잠금이 Plan §5.1 의 30분 기준 미구현 (15분으로 하드코딩) | src/auth/routes.ts:42 | 정책 위반 | 상수 → `config.ts` 로 이관, env 변수화 |
| 2 | refresh rotate 에서 old key 삭제가 async 미대기 — 동시 요청 race 가능 | src/auth/redis-store.ts:68 | 드문 케이스, 보안 경계 | await 추가 + 단위 테스트 |
| 3 | logout 이후 access token blacklist 가 5분 TTL 인데 JWT exp 은 15분 — 10분 gap | src/auth/jwt.ts:91 | 세션 재사용 가능 | blacklist TTL = JWT exp 과 동일 |

### 2.5 Findings — Advisory
- 빈 비밀번호 에러 메시지가 "Invalid credentials" 와 동일 — 명확성 보완 권장 (nice-to-fix)

### 2.6 메트릭 요약 (gate-manager 파싱용)

- `Critical: 0`
- `Important: 3`
- `matchRate: 93%`

## 3. Decisions

| # | Decision | Options | Chosen | Rationale |
|---|----------|---------|--------|-----------|
| 1 | Important 이슈 처리 | CTO 재수정 / CSO 선행 / 그대로 | CTO 재수정 | 정책 위반 (I#1) 은 보안 감사 전 수정 필요 |

## 4. Artifacts

| Path | Type | Change |
|------|------|--------|
| docs/sample-feature/04-qa/main.md | (next) | CTO 가 본 scratchpad 기반으로 작성 |

## 5. Handoff

- 다음 에이전트 (CTO): 위 I#1~3 수정 후 /vais cto do sample-feature 로 재검증
- 열린 질문: blacklist TTL 을 JWT exp 과 동일하게 하면 Redis 메모리 부담?
- 기술 부채: 없음

## 6. 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-19 | 초기 작성 — Gap 93%, Critical 0, Important 3 |

<!-- subdoc-template version: v0.57.0 -->
