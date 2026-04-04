---
name: growth-audit
description: 그로스 감사 유틸리티. AARRR 퍼널 분석 → 병목 식별 → 개선 제안.
---

# Growth Audit — 그로스 감사 유틸리티

제품 퍼널 구조를 분석하고 그로스 개선점을 제안합니다.

## 실행 순서

1. **제품 퍼널 구조 분석 (AARRR)**
   - Acquisition: 유입 채널 + 랜딩 페이지 분석
   - Activation: 온보딩 플로우 + 핵심 가치 도달 경로
   - Retention: 재방문 트리거 + 알림 구조
   - Revenue: 수익화 포인트 + 가격 페이지
   - Referral: 공유/초대 메커니즘
2. **각 단계별 전환율 추정**
   - 코드에서 이벤트 트래킹 포인트 식별
   - 퍼널 드롭오프 예상 지점
3. **병목 지점 식별**
   - 가장 큰 전환율 하락 구간
   - UX 마찰 포인트
4. **개선 제안 출력**
   - Quick Win (1-2일 내 적용)
   - Medium Term (1-2주)
   - Strategic (장기 전략)

> CMO의 growth 에이전트 축약 버전. 상세 전략은 `/vais cmo {feature}` 사용.

---

| version | date | change |
|---------|------|--------|
| v1.0.0 | 2026-04-04 | 초기 작성 |
