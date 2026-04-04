---
name: license-check
description: 라이선스 검사 유틸리티. 의존성 라이선스 호환성 확인 + 전염성 라이선스 감지.
---

# License Check — 라이선스 검사 유틸리티

프로젝트 의존성의 라이선스 호환성을 검사합니다.

## 실행 순서

1. **`package.json` / `package-lock.json` 읽기**
   - dependencies + devDependencies 목록 추출
2. **각 의존성 라이선스 확인**
   - `node_modules/{pkg}/package.json`의 license 필드
   - 또는 `npm view {pkg} license` 실행
3. **전염성 라이선스 감지**
   - ❌ AGPL: 사용 금지 (SaaS에서도 소스 공개 의무)
   - ⚠️ GPL: 주의 필요 (링크 방식에 따라 전염)
   - ✅ MIT/Apache/BSD/ISC: 안전
4. **호환성 매트릭스 출력**

| 프로젝트 라이선스 | MIT | Apache | GPL | AGPL |
|----------------|-----|--------|-----|------|
| MIT | ✅ | ✅ | ⚠️ | ❌ |
| Apache 2.0 | ✅ | ✅ | ⚠️ | ❌ |

5. **위험 의존성 경고** — 문제 의존성 대체 패키지 제안

> CSO의 compliance 에이전트 축약 버전. 상세 검사는 `/vais cso {feature}` 사용.

---

| version | date | change |
|---------|------|--------|
| v1.0.0 | 2026-04-04 | 초기 작성 |
