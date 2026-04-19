# sample-feature — design (CTO)

> Author: cto
> Phase: 02-design
> Scratchpads: 3 (_tmp/)
> Topic Docs: 2 (architecture, data-model)

## Executive Summary

| Perspective | Content |
|-------------|---------|
| Problem | 인증 흐름이 분산되어 있어 유지보수 어려움 |
| Solution | JWT + Redis refresh-token 통합 |
| Effect | 로그인 응답 시간 30% 단축 |
| Core Value | 수평 확장 + 세션 상태 없음 |

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | 기존 session 방식 한계 |
| WHO | 서비스 사용자, 운영팀 |
| RISK | refresh token 탈취 |
| SUCCESS | P95 < 200ms, 가용성 99.95% |
| SCOPE | 로그인/토큰 갱신/로그아웃만 |

## Decision Record

| # | 결정 | 대안 | 선택 이유 | 근거 scratchpad / topic |
|---|------|------|-----------|-------------------------|
| 1 | JWT 인증 | Session (stateful) | 수평 확장 + 무상태 | [_tmp/backend-engineer.md](_tmp/backend-engineer.md#auth) |
| 2 | Redis refresh | DB refresh | 빠른 조회 + TTL native | [_tmp/db-architect.md](_tmp/db-architect.md#refresh) |

## Topic Documents

| Topic | 파일 | 한 줄 요약 | 참조 scratchpad |
|-------|------|-----------|----------------|
| architecture | `architecture.md` | 3-tier + JWT 통합 | backend-engineer, infra-architect |
| data-model | `data-model.md` | 3 테이블 ER + refresh TTL | db-architect, infra-architect |

## Scratchpads (_tmp/)

| Agent | 경로 | 크기 | 갱신 |
|-------|------|:----:|-----|
| infra-architect | `_tmp/infra-architect.md` | 4.2KB | 2026-04-19 |
| backend-engineer | `_tmp/backend-engineer.md` | 6.8KB | 2026-04-19 |
| db-architect | `_tmp/db-architect.md` | 3.1KB | 2026-04-19 |

## Gate Metrics

- matchRate: 93%
- criticalIssueCount: 0

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-19 | 초기 작성 |
