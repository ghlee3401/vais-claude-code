---
name: analyze-cost
description: 비용 분석 유틸리티. 인프라 구성 파악 → 비용 추정 → 최적화 제안.
---

# Analyze Cost — 비용 분석 유틸리티

프로젝트 인프라 비용을 분석하고 최적화 방안을 제안합니다.

## 실행 순서

1. 프로젝트 인프라 구성 파악
   - `package.json` 의존성 분석 (외부 API 서비스)
   - `Dockerfile`, `docker-compose.yml` 확인
   - 환경 변수에서 외부 서비스 키 감지
2. **외부 API 사용 현황 분석**
   - Stripe, SendGrid, OpenAI 등 과금 서비스 식별
   - 코드에서 API 호출 패턴 분석
3. **클라우드 비용 추정**
   - 컴퓨팅/스토리지/DB/CDN 항목별 월 비용
   - Low/Medium/High 트래픽 시나리오별 비용
4. **최적화 제안 출력**
   - 캐싱, CDN, Reserved Instance 등 절감 방안
   - 비용 대비 효과 순위

> CFO의 cost-analyst 에이전트 축약 버전. 상세 분석은 `/vais cfo {feature}` 사용.

---

| version | date | change |
|---------|------|--------|
| v1.0.0 | 2026-04-04 | 초기 작성 |
