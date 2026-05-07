# CI/CD 4단계 표준 (COO)

release-engineer 가 사용. auto-judge 가 `opsReadiness` 메트릭 (>= 70 통과) 계산.

## 4단계 (필수)

| 단계 | 설명 | 도구 예시 | 키워드 |
|------|------|---------|--------|
| **Lint** | 코드 스타일 검사 | ESLint, Prettier, ruff | `lint` |
| **Test** | 단위/통합 테스트 | Jest, Vitest, pytest | `test` |
| **Build** | 빌드 성공 확인 | tsc, vite build, webpack | `build` |
| **Deploy** | 환경별 배포 | Vercel, Railway, AWS | `deploy` |

추가 권장: **Security** (npm audit, snyk) — opsReadiness 에는 미포함

## 작성 형식 (auto-judge 파싱용)

Do 문서에 4단계 키워드를 영어 단어로 명시:

```markdown
## CI/CD 파이프라인
1. **Lint**: ESLint + Prettier
2. **Test**: unit + integration (npm test)
3. **Build**: Vite 프로덕션 빌드
4. **Deploy**: Vercel / AWS
```

> 파서는 대소문자 무시. "린트" 만 쓰고 영어 `lint` 단어 없으면 미탐지.

## opsReadiness 계산

| 단계 발견 | 점수 | 등급 |
|----------|------|------|
| 4/4 | 100 | Full |
| 3/4 | 75 | Pass (threshold) |
| 2/4 | 50 | Fail |

threshold: `opsReadiness >= 70` (= 4 단계 중 3 단계 이상 커버)

## 모니터링 임계값 (참고)

- 에러율 > 1% → Critical
- 응답 시간 p99 > 3s → Warning
- 가용성 < 99.9% → Critical
