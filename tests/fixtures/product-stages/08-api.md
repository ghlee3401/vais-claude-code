---
schema: vais-stage/v1
stage: stage-api
status: draft
---

### API-001 ← S-001, F-001
| 항목 | 내용 |
|---|---|
| 요청 | POST /books {title, author} |
| 응답 | 201 {id, title, author} |
| 오류 | 400 제목 없음, 409 중복 |
| 쉬운 말 설명 | 책을 서버에 저장하고 번호를 돌려받는다 |

### API-002 ← S-002, F-002
| 항목 | 내용 |
|---|---|
| 요청 | PUT /books/{id}/rating {stars, note} |
| 응답 | 200 {stars, note} |
| 오류 | 400 별점 범위 밖, 404 책 없음 |
| 쉬운 말 설명 | 별점과 감상을 책에 붙인다 |
