# Interface Contract Schema (CTO)

Gate 2 (Design 완료) 에서 생성. Plan 데이터 모델 + Design 화면-데이터 매핑 합성.

위치: `docs/{feature}/02-design/interface-contract.md`

## 표준 형식

```markdown
## Interface Contract — {feature}

### API 엔드포인트
| Method | Path | Request Body | Response | Auth | Description |

### 에러 코드
| 400 유효성 검증 실패 / 401 인증 필요 / 403 권한 없음 / 404 리소스 없음 / 409 중복 |

### 공통 응답 형식
{ "success": boolean, "data": T | null, "error": { "code": number, "message": string } | null }
```

## 작성 시 체크리스트

- [ ] 모든 화면이 사용하는 endpoint 가 표에 존재
- [ ] Request Body 필드가 데이터 모델 (Plan 산출물) 과 일치
- [ ] Auth 필요 endpoint 명시 (Bearer / Session / None)
- [ ] 에러 코드 5종 이상 정의 (400/401/403/404/409 기본)
- [ ] 공통 응답 형식 통일 (success/data/error)

## 사용처

- Gate 2 통과 조건 (interface-contract.md 존재 필수)
- Do phase 시 frontend-engineer + backend-engineer 가 동일 contract 참조
- Gate 4 (Do 완료) 에서 양쪽이 contract 따랐는지 검증
