---
name: 테스트 DB mock 금지
description: 테스트에서 DB를 mock하지 말고 실제 DB를 사용해야 한다는 규칙
type: feedback
---

테스트에서 DB를 mock하지 않는다. 항상 실제 DB(테스트 인스턴스)에 연결한다.

**Why:** mock과 실제 DB 동작 차이로 인해 테스트 통과 → 프로덕션 장애 발생 이력 있음.

**How to apply:** 테스트 파일 작성 시 DB 관련 의존성은 mock하지 않는다.
`jest.mock('./db')` 패턴 사용 금지. 대신 테스트용 DB 인스턴스 사용.
