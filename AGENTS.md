# VAIS Code - Agent Instructions

> 이 파일은 AI 코딩 도구(Claude Code, Cursor, Copilot 등)에서 공통으로 참조하는 에이전트 지침입니다.

## 프로젝트 구조

이 프로젝트는 VAIS Code 플러그인입니다. Claude Code에서 5단계 개발 워크플로우를 제공합니다.

## 개발 워크플로우 (5단계)

```
📋기획(plan) → 🎨설계(design) → 🔧구현(do) → ✅QA(qa) → 📊보고서(report)
```

모든 기능 개발은 반드시 기획(plan)부터 시작합니다.
각 단계의 산출물은 `docs/{번호}-{단계}/{역할}_{기능명}.{단계}.md`에 저장합니다.

### 병렬 실행 구간

- **구현(do)**: frontend + backend + tester 병렬

### Gate 체크포인트

```
Plan → [Gate] → Design → [Gate] → Do (frontend+backend) → [Gate] → QA → Report
```

## 실행 방식 (C-Suite 오케스트레이션)

```
/vais cto login              — CTO가 기술 전체 오케스트레이션 (plan→design→do→qa→report)
/vais ceo login              — CEO가 비즈니스 전략 + C-Suite 조율
/vais cpo login              — CPO가 제품 방향 + PRD + 로드맵
/vais status                 — 프로젝트 상태 조회
/vais help                   — 사용법 안내
```

실행 에이전트(architect, frontend, backend 등)는 직접 호출하지 않습니다. C-레벨 에이전트가 필요에 따라 위임합니다.

## 필수 규칙

1. **기획 없이 코드 금지**: 기획서가 없으면 먼저 `/vais cto {feature}`로 기획부터 시작합니다
2. **코딩 규칙 준수**: 구현 시 반드시 기획서(`docs/01-plan/`)의 코딩 규칙 섹션을 참조합니다
3. **QA 필수**: 구현 완료 후 CTO가 QA 에이전트를 통해 빌드 확인 + 설계 대비 일치율을 검증합니다
4. **문서 참조 투명성**: 구현 시 참조한 문서 목록을 산출물 상단에 기록합니다
5. **위험 명령 금지**: `rm -rf`, `DROP TABLE`, `git push --force` 사용 금지
6. **환경 변수**: 민감 정보는 반드시 환경 변수로 관리합니다

## 에이전트 역할

### C-Suite (전략 레이어, Opus)

| 에이전트 | 역할 |
|---------|------|
| cto | 기술 총괄 오케스트레이터 (필수) |
| ceo | 비즈니스 전략 + absorb 오케스트레이터 |
| cpo | 제품 방향 + PRD + pm-* 서브에이전트 오케스트레이션 |
| cfo | 재무 분석, ROI, 가격 책정 (cost-analyst/pricing-modeler 위임) |
| cmo | 마케팅 + SEO/copywriter/growth 위임 |
| cso | 보안 Gate A + 플러그인 검증 Gate B + 독립 리뷰 Gate C + compliance |
| coo | 운영, CI/CD, 모니터링 (sre/devops/docs-writer 위임) |

### Execution (실행 레이어, Sonnet)

| 에이전트 | C-Level | 역할 |
|---------|---------|------|
| architect | CTO | DB 스키마 + 환경 + 프로젝트 설정 |
| design | CTO | IA + 와이어프레임 + UI 설계 |
| frontend | CTO | 프론트엔드 구현 |
| backend | CTO | 백엔드 API 구현 |
| qa | CTO | Gap 분석 + 코드 리뷰 + QA 검증 |
| tester | CTO | 테스트 코드 작성 (unit/integration/e2e) |
| devops | CTO/COO | CI/CD + Docker + 배포 자동화 |
| database | CTO | DB 스키마 최적화 + 마이그레이션 + 쿼리 튜닝 |
| security | CSO | 보안 감사 (OWASP Top 10) |
| compliance | CSO/CFO | 컴플라이언스 (GDPR/라이선스) |
| seo | CMO | SEO 감사 |
| copywriter | CMO | 마케팅 카피 |
| growth | CMO | 그로스 퍼널 전략 |
| sre | COO | SRE/모니터링 + 인시던트 런북 |
| docs-writer | COO/CTO/CPO | 기술 문서 (API docs/README) |
| cost-analyst | CFO | 클라우드 비용 분석 |
| pricing-modeler | CFO | 가격 모델링 + 수익 시뮬레이션 |
| ux-researcher | CPO | UX 리서치 |
| data-analyst | CPO/CTO/CFO | 제품 메트릭 분석 |
| investigate | CTO | 체계적 디버깅 |
| canary | COO | 배포 후 카나리 모니터링 |
| benchmark | COO | 성능 벤치마크 |
| retro | CEO | 엔지니어링 회고 |

실행 에이전트는 **직접 호출 금지** — 반드시 CTO를 통해 호출합니다.

## 문서 위치

| 단계 | 경로 |
|------|------|
| 기획 (plan) | `docs/01-plan/` |
| 설계 (design) | `docs/02-design/` |
| 구현 (do) | `docs/03-do/` |
| QA (qa) | `docs/04-qa/` |
| 보고서 (report) | `docs/05-report/` |

## 피처 이름 가이드

kebab-case 영문 소문자를 권장합니다. 아래는 서비스에서 자주 쓰는 이름 예시입니다:

| 분류 | 예시 |
|------|------|
| 인증·사용자 | `login`, `signup`, `oauth`, `user-profile`, `my-page`, `password-reset` |
| 결제·커머스 | `payment`, `cart`, `checkout`, `order-history`, `wishlist`, `coupon` |
| 콘텐츠 | `feed`, `post`, `comment`, `search`, `notification`, `bookmark` |
| 소셜 | `chat`, `follow`, `share`, `invite`, `review` |
| 관리·운영 | `dashboard`, `settings`, `admin-panel`, `analytics` |

> 강제 사항은 아닙니다. 자유롭게 작명하되, 파일 경로에 들어가므로 영문 kebab-case가 편합니다.

## 기술 스택 참고

프로젝트별로 다르므로 `docs/01-plan/` 기획서의 기술 스택 섹션을 참조합니다.

