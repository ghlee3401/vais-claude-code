---
name: deploy
description: 배포 유틸리티. 환경 확인 → 체크리스트 → 배포 → 헬스체크.
---

# Deploy — 배포 유틸리티

배포 전 체크 + 배포 실행 + 헬스체크를 수행합니다.

## 실행 순서

1. 배포 환경 확인 (dev/staging/prod)
   - `package.json` scripts 확인 (deploy, build 등)
   - Vercel/Railway/Docker 등 배포 대상 감지
2. **배포 전 체크리스트**:
   - [ ] 빌드 성공 (`npm run build`)
   - [ ] 테스트 통과 (`npm test`)
   - [ ] 환경 변수 설정 확인
   - [ ] lint 통과
3. 체크리스트 미통과 시 → 실패 항목 보고 후 중단
4. 배포 명령 실행 (감지된 플랫폼에 따라)
5. 배포 후 헬스체크 (HTTP 200 확인)
6. 배포 결과 요약 출력

> **주의**: prod 배포 시 반드시 사용자 확인 필요

---

| version | date | change |
|---------|------|--------|
| v1.0.0 | 2026-04-04 | 초기 작성 |
