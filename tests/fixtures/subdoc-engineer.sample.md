# sample-feature — do — backend-engineer

> Author: backend-engineer
> Phase: 03-do
> Refs: docs/sample-feature/01-plan/main.md, docs/sample-feature/02-design/architecture.md
> Summary: JWT + Redis refresh-token 8 endpoint 구현, 단위 12 / 통합 8 테스트 추가

## 1. Context

- 작업 요청: Interface Contract 의 `/auth/*` 8 endpoint 를 JWT 기반으로 구현
- 선행 의사결정: design main.md Decision #1 (JWT), #2 (Redis refresh)
- 스코프: 로그인/갱신/로그아웃/프로필 조회. 2FA 는 v1.1 로 이관

## 2. 구현 상세

### 2.1 JWT 전략
- `jsonwebtoken@9.x` 사용, HS256
- payload = { sub: userId, iat, exp: 15m }, refresh 는 Redis key `rt:{sub}:{jti}` 1h TTL
- 서명 시크릿은 `.env` 의 `JWT_SECRET`, 최소 32 bytes 강제
- 대안: Ed25519 고려했으나 운영 환경의 OpenSSL 3.0 호환 이슈로 HS256 유지

### 2.2 Endpoint 별 변경
- POST `/auth/login` — 이메일/비번 검증 후 access+refresh 발급. Rate limit 10/min/IP
- POST `/auth/refresh` — refresh 검증 + Redis rotate (old key 삭제, new key 삽입)
- POST `/auth/logout` — Redis key 삭제, access token blacklist 5m
- GET `/auth/me` — access token 에서 sub 추출 후 users 테이블 JOIN

### 2.3 테스트 전략
- 단위 12건: jwt sign/verify, Redis mock
- 통합 8건: 로그인→갱신→로그아웃 시나리오
- e2e 3건: supertest + 실제 Redis (docker-compose)

### 2.4 성능·보안
- N+1 제거: users.profile 을 single JOIN 으로
- bcrypt work factor 12, timing-safe compare
- JWT secret rotation 은 v1.1 이관 (out-of-scope)

## 3. Decisions

| # | Decision | Options | Chosen | Rationale |
|---|----------|---------|--------|-----------|
| 1 | JWT 서명 | HS256 / RS256 / Ed25519 | HS256 | 단일 서비스, 운영 환경 호환 |
| 2 | refresh 저장 | DB / Redis / 쿠키 | Redis | TTL 네이티브 + 빠른 조회 |
| 3 | rate limit | middleware / gateway | middleware | 이미 express-rate-limit 도입됨 |

## 4. Artifacts

| Path | Type | Change |
|------|------|--------|
| src/auth/routes.ts | create | 8 endpoint |
| src/auth/jwt.ts | create | sign/verify 유틸 |
| src/auth/redis-store.ts | create | refresh key 관리 |
| src/middleware/rate-limit.ts | modify | /auth/* 강화 |
| tests/auth/*.test.ts | create | 20건 |

## 5. Handoff

- 다음 에이전트 (qa-engineer): `/auth/login` 성공/실패/잠금 3가지 시나리오 Gap 검증 필요
- 열린 질문: refresh 탈취 감지 heuristic (device fingerprint) 은 v1.1 로 이관?
- 기술 부채: JWT secret rotation 수동 (High), metric emit 미구현 (Medium)

## 6. 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-19 | 초기 작성 |

<!-- subdoc-template version: v0.57.0 -->
