---
artifact: api-implementation
owner_agent: backend-engineer
phase: how
canon_source: "Roy Fielding 'Architectural Styles and the Design of Network-based Software Architectures' (2000) PhD dissertation — REST + Kleppmann 'Designing Data-Intensive Applications' (2017) + OpenAPI Specification 3.1 (openapis.org)"
execution:
  policy: always
  intent: api-implementation
  prereq: [architecture-design]
  required_after: []
  trigger_events: []
  scope_conditions: []
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "How 단계 — Architecture Design 입력 후 API 표면 정의. REST / GraphQL / gRPC 선택 + endpoint spec + error handling + idempotency."
---

# API Implementation

> **canon**: Roy Fielding (2000) PhD dissertation — REST 정의. Kleppmann *DDIA* (2017) — distributed API 의 idempotency / consistency. OpenAPI 3.1 — API 명세 표준.
>
> **목적**: Architecture 결정 (ADR-2) 후 API endpoint 의 표면 (request / response / error / auth) 명시. Frontend·Backend 계약.

---

## 1. API Style

| Style | 적정 시점 |
|-------|----------|
| **REST** | 단순성 / 다양한 클라이언트 (web/mobile) / cacheable |
| **GraphQL** | 복잡 쿼리 / over-fetching 회피 / 단일 endpoint |
| **gRPC** | 마이크로서비스 간 / 고성능 / strongly typed |
| **WebSocket / SSE** | 실시간 push / streaming |

**Selected**: ______ (Architecture Design ADR 와 정합)

## 2. Endpoint Spec (OpenAPI Style)

### POST /api/{resource}

| 항목 | 내용 |
|------|------|
| **Description** | (이 endpoint 의 비즈니스 의도) |
| **Request Body** | (JSON schema or example) |
| **Response 201** | (created — schema + example) |
| **Response 4xx** | (validation error / unauthorized / forbidden / not found) |
| **Response 5xx** | (server error — generic message) |
| **Auth** | (Bearer / API Key / OAuth) |
| **Rate Limit** | (req/min/user) |
| **Idempotency** | (Idempotency-Key 헤더 지원 여부) |

## 3. Error Handling (RFC 7807 — Problem Details)

| HTTP Status | Type | When |
|:-----------:|------|------|
| 400 | validation-error | request body schema 위반 |
| 401 | authentication-required | token 부재/만료 |
| 403 | forbidden | 권한 부재 |
| 404 | not-found | resource 미존재 |
| 409 | conflict | 동시 수정 / 중복 생성 |
| 422 | semantic-error | schema OK 이지만 비즈니스 규칙 위반 |
| 429 | too-many-requests | rate limit 초과 |
| 500 | internal-error | 서버 에러 (stack trace 노출 X) |
| 503 | service-unavailable | downstream 장애 |

**Response 형식**:
```json
{
  "type": "https://example.com/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "field 'email' is required",
  "instance": "/api/users",
  "errors": [...]
}
```

## 4. Idempotency + Concurrency

- **Idempotency-Key 헤더**: 동일 키 재요청 시 같은 응답 (24시간 TTL)
- **Optimistic Locking**: `If-Match: <etag>` 헤더 → 409 Conflict on mismatch
- **Distributed Lock** (필요 시): Redis SETNX or DB row-level lock

## 5. Authentication + Authorization

| Layer | 메커니즘 |
|-------|---------|
| **Auth N** (인증) | OAuth 2.0 / OIDC / JWT Bearer |
| **Auth Z** (권한) | RBAC / ABAC / scope-based |
| **API Key** | 외부 통합용 (rate limit + revocable) |
| **CSRF** | 쿠키 기반 인증 시 SameSite + token |

---

## (작성된 sample)

**Project**: VAIS Code Plugin (Claude Code 마켓플레이스 — API 영역 N/A 이지만 hooks 인터페이스로 sample)

### Hook Interface (PostToolUse — ideation-guard)

| 항목 | 내용 |
|------|------|
| **Description** | ideation main.md 작성 시 Profile 12 변수 자동 추출 + `.vais/profile.yaml` 저장 |
| **Trigger** | PostToolUse Write (`docs/{feature}/00-ideation/main.md` 변경 시) |
| **Input** | hookData.toolInput.file_path + hookData.toolInput.content |
| **Output** | profile.yaml (12 변수 + draft annotation) |
| **Error** | (silent) — fail-soft (next time 재시도) |
| **Idempotency** | profile.yaml 존재 시 미덮어씀 (사용자 수정 보호) |

### Error Handling (Hook context)

| 시나리오 | Action |
|---------|--------|
| profile.yaml parse error | warning log + skip (FAILSAFE_SCHEMA) |
| Profile field 누락 | "draft: true" 표기 + 사용자 명시 보강 요청 |
| feature_name 검증 실패 | path traversal 경고 + halt |
| secret pattern 감지 | 즉시 차단 + 사용자 alert |

### Idempotency

- ideation main.md 가 변경될 때마다 hook 호출
- 기존 profile.yaml 존재 시 추출만 수행 (사용자 작성 우선)
- diff-based update (변경된 field 만 prompt)

---

## 작성 체크리스트

- [ ] API Style (REST / GraphQL / gRPC / etc) 이 **Architecture ADR 과 정합** 한가?
- [ ] 각 endpoint 에 **Description / Request / Response (success + error) / Auth / Rate Limit** 명시?
- [ ] Error Response 가 **RFC 7807 Problem Details** 형식인가?
- [ ] **Idempotency** 가 mutation endpoint 에 명시되었는가? (POST/PUT/DELETE)
- [ ] **Auth N + Auth Z** 분리 명시?
- [ ] Stack trace 가 5xx response 에 **노출 X**? (security)
- [ ] Rate Limit 이 endpoint 별 또는 user 별 명시?
- [ ] OpenAPI 3.1 spec 파일 (`openapi.yaml`) 이 코드 옆에 위치?

---

## ⚠ Anti-pattern

- **HTTP 200 + error in body**: 항상 200 반환하고 body 에 error 표기 — RESTful 위반. status code 활용 필수.
- **Stack trace exposure**: 5xx response 에 stack trace — security 위반. **Generic message 만**.
- **GET with side effects**: GET endpoint 가 DB write — caching 무력화 + RESTful 위반. mutation 은 POST/PUT/DELETE.
- **Rate Limit 부재**: DDoS / abuse 노출. 모든 public endpoint 에 rate limit 필수.
- **Idempotency 부재 mutation**: POST/PUT 이 재시도 시 중복 생성 — 결제 / 주문 등 critical. Idempotency-Key 표준화.
- **Schema validation 부재**: request body 를 그대로 신뢰 — injection / 비즈니스 위반. JSON Schema / Zod / Joi 검증 필수.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 12. Fielding REST + Kleppmann DDIA + OpenAPI 3.1 + RFC 7807 정전. API Style + Endpoint Spec + Error Handling + Idempotency + Auth + sample (VAIS Hook 인터페이스) + checklist 8 + anti-pattern 6 |
