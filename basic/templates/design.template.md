# {feature} — 설계서

> 작성자: orchestrator | 단계: design | 버전: v1.0
> 참조: [기획서](../plan/{feature}.plan.md)

## 1. 아키텍처 개요

```
[Client] → [API Layer] → [Service Layer] → [DB]
```

## 2. 디렉토리 구조

```
src/
└── {feature}/
    ├── index.js          # 진입점
    ├── service.js        # 비즈니스 로직
    ├── repository.js     # DB 접근
    └── __tests__/
        └── service.test.js
```

## 3. API 인터페이스

### POST /api/{feature}

**Request**
```json
{
  "field1": "string",
  "field2": "number"
}
```

**Response (200)**
```json
{
  "id": "uuid",
  "createdAt": "ISO8601"
}
```

**Error (400)**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "설명"
}
```

## 4. 상태 다이어그램

```
idle → loading → success
             ↓
           error
```

## 5. 보안 고려사항

- 인증: 
- 인가:
- 입력 검증:

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | {date} | 초기 작성 |
