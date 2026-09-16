---
schema: vais-stage/v1
stage: stage-architecture
status: draft
---

## 스택
Node 20, Express, SQLite, 순수 HTML/CSS/JS.

## 폴더
src/server, src/web, data/.

## 환경
.env 의 PORT, DB_PATH.

## 실행 명령
npm run dev → http://localhost:3000

## 배포
단일 컨테이너.

### T-001
| 항목 | 내용 |
|---|---|
| 내용 | 서버·웹·DB 를 한 프로세스로 묶고 컨테이너 하나로 배포한다 |
