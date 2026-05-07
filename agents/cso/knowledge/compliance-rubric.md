# 법적 컴플라이언스 체크리스트 (CSO)

Gate A 보안 검토 시 compliance-auditor 가 사용.

> ⚠️ **중요**: 본 체크리스트는 참고용. 실제 법적 문서는 반드시 데이터 프라이버시 전문 변호사의 검토 필수.

## Privacy Policy (GDPR/CCPA)

| 항목 | 설명 |
|------|------|
| 데이터 수집 목적 명시 | 수집하는 모든 데이터 유형과 이유 |
| 법적 처리 근거 (GDPR Art. 6) | 동의 / 계약 / 법적 의무 / 정당한 이익 |
| 제3자 공유 공개 | 데이터 공유 서비스 제공자 목록 |
| 데이터 보존 기간 | 계정 / 로그 / 삭제 콘텐츠 각각 명시 |
| 사용자 권리 | 접근 / 삭제 / 이동성 — 행사 방법 + 응답 기간 (30일) |
| 쿠키 동의 메커니즘 | 비필수 쿠키 = 명시적 동의 (GDPR) |
| 국제 데이터 이전 | EU 외부 이전 시 SCCs |
| 아동 개인정보 (COPPA) | 13세 미만 = 부모 동의 |
| DPO 연락처 | 개인정보 문의 이메일 |
| CCPA 옵트아웃 | 캘리포니아 데이터 판매 거부권 |

## NDA 검토

| 항목 | 핵심 |
|------|------|
| 기밀 정보 정의 범위 | 무엇이 기밀인가 |
| 유효 기간 | 2~5년 (산업 표준) |
| 예외 조항 | 공개 정보, 독립 개발 |
| 위반 시 구제 수단 | 손해배상, injunctive relief |
| 준거법 + 관할 법원 | 한국법 / 서울중앙지법 등 |

## Terms of Service 필수 조항

| 항목 |
|------|
| 서비스 범위 + 이용 제한 |
| 책임 한계 (limitation of liability) |
| 서비스 변경·종료 고지 (30일 이상 권장) |
| 분쟁 해결 (중재 or 소송) |
| 지식재산권 소유권 |
| 계정 정지·해지 조건 |

## License 컴플라이언스

dependency-analyzer 가 검사:
- GPL/AGPL — copyleft 영향 검토 (proprietary 제품에 위험)
- MIT/Apache 2.0 — 재배포 시 attribution 필요
- BSL/SSPL — 상업적 사용 제약 검토

## artifact 박제

`docs/{feature}/04-qa/compliance-report.md` (frontmatter: `owner: cso`, `agent: compliance-auditor`, `artifact: compliance-report`)
