# QA Routing & C-Level Handoff (CTO)

## QA 리턴 라우팅

1. QA 산출물의 `return_to` 값 확인
2. 해당 에이전트에게 이슈 목록 전달 (라우팅만, 직접 판단 없음)
3. 수정 완료 후 QA 재실행
4. 최대 3회 반복 후 미해결 시 사용자에게 보고 (lean mode 에서는 2회 후 CP-Q 발동)

## C-Level 핸드오프 수신

다른 C-Level 이 수정 이슈 발견 시 CTO 핸드오프 형식으로 전달. 수신 절차:

1. 핸드오프 이슈 목록 확인 (요청 C-Level 의 QA/Do 문서 참조)
2. 이슈별 최적 체이닝 경로 결정 (`modification-chaining.md` 참조)
3. 서브에이전트 실행
4. 수정 완료 후 요청 C-Level 에게 재검증 안내

| 요청 C-Level | 전형적 이슈 | 재검증 |
|-------------|-----------|--------|
| CSO | 보안 취약점, 플러그인 구조 문제 | `/vais cso {feature}` |
| CBO | SEO 점수 미달, 마케팅/비용 관련 기술 요구사항 | `/vais cbo qa {feature}` 또는 요청 phase |
| COO | CI/CD 파이프라인 구현, 인프라 설정 | `/vais coo qa {feature}` 또는 요청 phase |
| CPO | PRD 요구사항 구현 | `/vais cpo {feature}` |
| CEO | 전략 결정에 따른 기술 변경 | `/vais ceo {feature}` |

## Context Load (핸드오프 수신 시)

기본 L1-L3 외 추가:
- **L4** = 요청 C-Level artifact (`docs/{feature}/{NN-phase}/{artifact}.md`) + 해당 phase index (`main.md`)

## incident-responder 자동 호출 조건

| # | 조건 | 트리거 |
|---|------|--------|
| 1 | QA 수정 2회 실패 | 같은 이슈 2번 수정 후 QA 재실행 시 여전히 실패 |
| 2 | 빌드 실패 원인 불명 | 환경/의존성/설정 문제로 추정되는 빌드 에러 |
| 3 | CSO 이슈 수정 실패 | CSO→CTO 수정 루프 1회 후 CSO 재검토 미통과 |
| 4 | 사용자 디버깅 요청 | CP-Q 에서 사용자가 "incident-responder 호출" 선택 |

호출 형식: `incident-responder 에이전트 호출: 증상 {요약} / 재현 경로 {실패 테스트·빌드 명령} / 이전 수정 시도 {결과}`. 완료 후 리포트의 수정 제안을 적용하고 QA 재실행.

## 크로스-피처 영향 분석

수정/확장 요청 시:
1. 대상 피처 dependency 맵 조회 (`.vais/features/{feature}.json`)
2. 의존 피처 영향 범위 파악
3. 과거 의사결정 충돌 여부 확인
4. 영향 받는 피처 있으면 사용자에게 알림
