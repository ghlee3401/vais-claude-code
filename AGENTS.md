# VAIS Code - Agent Instructions

> 이 파일은 AI 코딩 도구(Claude Code, Cursor, Copilot 등)에서 공통으로 참조하는 에이전트 지침입니다.

## 프로젝트 구조

이 프로젝트는 VAIS Code 플러그인입니다. Claude Code에서 6단계 개발 워크플로우를 제공합니다.

## 개발 워크플로우 (6단계)

```
📋기획 → 🎨설계 → 🔧인프라 → 💻프론트 + ⚙️백엔드 → ✅QA
```

모든 기능 개발은 반드시 기획(plan)부터 시작합니다.
각 단계의 산출물은 `docs/{번호}-{단계}/{기능명}.md`에 저장합니다.

### 병렬 실행 구간

- **구현**: frontend-dev + backend-dev 병렬

### Gate 체크포인트 (4개)

```
Plan → [Gate 1] → Design → [Gate 2] → Infra → [Gate 3] → FE+BE → [Gate 4] → QA
```

## 실행 방식 (체이닝 문법)

```
/vais plan 로그인기능                          — 단일 실행
/vais plan:design:infra 로그인기능              — 순차 체이닝 (: = 순차)
/vais fe+be 로그인기능                          — 병렬 체이닝 (+ = 병렬)
/vais plan:design:infra:fe+be:qa 로그인기능     — 혼합
/vais auto 로그인기능                           — 전체 자동
```

## 필수 규칙

1. **기획 없이 코드 금지**: 기획서가 없으면 먼저 `/vais plan`을 실행합니다
2. **코딩 규칙 준수**: 구현 시 반드시 기획서(`docs/01-plan/`)의 코딩 규칙 섹션을 참조합니다
3. **QA 필수**: 구현 완료 후 반드시 `/vais qa`로 빌드 확인 + 설계 대비 일치율을 확인합니다
4. **문서 참조 투명성**: 구현 시 참조한 문서 목록을 산출물 상단에 기록합니다
5. **위험 명령 금지**: `rm -rf`, `DROP TABLE`, `git push --force` 사용 금지
6. **환경 변수**: 민감 정보는 반드시 환경 변수로 관리합니다

## 에이전트 역할

| 에이전트 | 역할 | 모델 |
|---------|------|------|
| manager | Plan 실행 + 전체 오케스트레이션 + Gate 판정 | opus |
| designer | IA + 와이어프레임 + UI 설계 | sonnet |
| infra-dev | DB 스키마 + 환경 + 프로젝트 설정 | sonnet |
| frontend-dev | 프론트엔드 구현 | sonnet |
| backend-dev | 백엔드 API 구현 | sonnet |
| qa | Gap 분석 + 코드 리뷰 + QA 검증 | sonnet |

## 문서 위치

| 단계 | 경로 |
|------|------|
| 기획서 (+ 코딩 규칙) | `docs/01-plan/` |
| 설계 (IA + 와이어프레임 + UI) | `docs/02-design/` |
| 인프라 (DB + 환경) | `docs/03-infra/` |
| QA (Gap + 리뷰) | `docs/04-qa/` |

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

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v0.7.0 | 2026-03-14 | 초기 에이전트 지침 생성 |
| v0.8.0 | 2026-03-14 | 9단계 워크플로우 반영, frontend/backend 병렬 복원 |
| v0.8.1 | 2026-03-14 | 기능정의서·정책정의서·화면정의서 통합 반영 |
| v0.8.2 | 2026-03-14 | Stop Handler 항상 표시 |
| v0.8.3 | 2026-03-14 | 피처 레지스트리 자동 추적 |
| v0.8.4 | 2026-03-14 | 단계명 간소화: frontend→fe, backend→be |
| v0.9.0 | 2026-03-14 | wireframe 통합, fix 체이닝 |
| v0.10.0 | 2026-03-15 | Manager 에이전트, Memory 시스템 도입 |
| v0.11.0 | 2026-03-16 | 코드 리뷰 반영: bash-guard 강화, 에러 로깅 |
| v0.12.0 | 2026-03-17 | UI/UX Pro Max 번들 |
| v0.15.0 | 2026-03-20 | 9→6단계 리스트럭처링: research+plan 통합, ia+wireframe+design 통합, check+review→qa, manager+tech-lead 통합, infra 단계 추가, 4-Gate 시스템, Interface Contract, QA 리턴 경로 |
