---
name: write-docs
description: 기술 문서 유틸리티. 코드 분석 → API docs + README 생성/업데이트.
---

# Write Docs — 기술 문서 유틸리티

코드 구조를 분석하여 기술 문서를 생성합니다.

## 실행 순서

1. **코드 구조 분석**
   - API 라우트 파일 스캔 (`app/api/`, `pages/api/`, `routes/`)
   - 컴포넌트 디렉토리 분석
   - 주요 모듈/라이브러리 식별
2. **API 문서 생성**
   - 엔드포인트 목록 (Method + Path)
   - 파라미터 + 요청 바디 스키마
   - 응답 형태 + 상태 코드
   - 인증 요구사항
3. **README 업데이트**
   - 프로젝트 소개
   - 설치 방법 (`package.json` scripts 기반)
   - 사용법 + 환경 변수 목록
   - 기술 스택
4. 산출물 저장 경로 안내

> COO의 docs-writer 에이전트 축약 버전. 상세 문서는 `/vais coo {feature}` 사용.

---

| version | date | change |
|---------|------|--------|
| v1.0.0 | 2026-04-04 | 초기 작성 |
