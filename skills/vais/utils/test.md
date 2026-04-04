---
name: test
description: 테스트 실행 유틸리티. 테스트 프레임워크 감지 → 실행 → 커버리지 리포트.
---

# Test — 테스트 실행 유틸리티

프로젝트 테스트를 실행하고 결과를 요약합니다.

## 실행 순서

1. **테스트 프레임워크 감지**
   - `package.json`의 devDependencies 확인
   - Vitest / Jest / Playwright / Mocha 중 감지
   - `scripts.test` 필드 확인
2. **테스트 실행**
   - 감지된 프레임워크에 따라 실행 (예: `npx vitest run`, `npm test`)
   - 인자가 있으면 특정 파일/패턴으로 필터링
3. **커버리지 리포트 생성** (가능한 경우)
   - `--coverage` 플래그 추가
   - Statement/Branch/Function/Line 커버리지 출력
4. **결과 요약 출력**
   - 총 테스트 수 / 통과 / 실패 / 건너뜀
   - 실패 테스트 목록 + 에러 메시지
   - 커버리지 수치

> CTO의 tester 에이전트는 테스트 코드 **작성**, 이 스킬은 테스트 **실행**에 특화.

---

| version | date | change |
|---------|------|--------|
| v1.0.0 | 2026-04-04 | 초기 — CTO 리다이렉트 |
| v2.0.0 | 2026-04-04 | 확장 — 프레임워크 감지 + 실행 + 커버리지 |
