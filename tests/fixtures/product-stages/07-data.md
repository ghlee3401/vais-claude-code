---
schema: vais-stage/v1
stage: stage-data
status: draft
---

## 범위: reading-log

### D-001 ← F-001
| 항목 | 내용 |
|---|---|
| 항목 | book: id, title, author, createdAt |
| 관계 | book 1 — rating 0..1 |
| 규칙 | title+author 유일 |
| 쉬운 말 설명 | 책 한 권이 한 줄이고, 별점은 책마다 하나 |

### D-002 ← F-002
| 항목 | 내용 |
|---|---|
| 항목 | rating: bookId, stars, note, updatedAt |
| 관계 | rating N — book 1 |
| 규칙 | stars 1~5 |
| 쉬운 말 설명 | 별점 줄이 책 줄을 가리킨다 |
