# VAIS Code - Agent Instructions

> 이 파일은 AI 코딩 도구(Claude Code, Cursor, Copilot 등)에서 공통으로 참조하는 에이전트 지침입니다.

## 프로젝트 구조

이 프로젝트는 VAIS Code 플러그인입니다. Claude Code에서 9단계 개발 워크플로우를 제공합니다.

## 레벨 시스템

| 레벨 | 목적 | 단계 수 |
|------|------|--------|
| Quick | MVP, 프로토타입, 빠른 검증 | 7단계 (research, review 스킵) |
| Full | 프로덕션, 장기 운영, 팀 협업 | 9단계 전체 |

## 개발 워크플로우 (9단계)

```
🔭조사·탐색 → 📋기획 → 🗺IA → 🖼와이어프레임 → 🎨설계(UI+DB) → 💻프론트 → ⚙️백엔드 → 🔎Gap분석 → 🔍검토
```

모든 기능 개발은 반드시 기획(plan)부터 시작합니다.
각 단계의 산출물은 `docs/{번호}-{단계}/{기능명}.md`에 저장합니다.

### 병렬 실행 구간

- **설계**: UI 설계 (designer) + DB 설계 (backend-dev) 병렬
- **구현**: frontend-dev + backend-dev 병렬

## 실행 방식 (체이닝 문법)

```
/vais plan 로그인기능                              — 단일 실행
/vais plan:ia:wireframe 로그인기능                  — 순차 체이닝 (: = 순차)
/vais fe+be 로그인기능                               — 병렬 체이닝 (+ = 병렬)
/vais plan:ia:design:fe+be:check 로그인기능            — 혼합
/vais auto 로그인기능                               — 전체 자동
```

## 필수 규칙

1. **기획 없이 코드 금지**: 기획서가 없으면 먼저 `/vais plan`을 실행합니다
2. **코딩 규칙 준수**: 구현 시 반드시 기획서(`docs/02-plan/`)의 코딩 규칙 섹션을 참조합니다
3. **빌드 검증 + Gap 분석 필수**: 구현 완료 후 반드시 `/vais check`로 빌드 확인 + 설계 대비 일치율을 확인합니다
4. **문서 참조 투명성**: 구현 시 참조한 문서 목록을 산출물 상단에 기록합니다
5. **위험 명령 금지**: `rm -rf`, `DROP TABLE`, `git push --force` 사용 금지
6. **환경 변수**: 민감 정보는 반드시 환경 변수로 관리합니다

## 에이전트 역할

| 에이전트 | 역할 | 모델 |
|---------|------|------|
| tech-lead | 아키텍처 결정, 팀 오케스트레이션 | opus |
| designer | UI/UX, 와이어프레임 | sonnet |
| frontend-dev | 프론트엔드 구현 | sonnet |
| backend-dev | 백엔드 API + DB 설계/구현 | sonnet |
| reviewer | 빌드 검증, Gap 분석, 코드 리뷰 | sonnet |

## 문서 위치

| 단계 | 경로 |
|------|------|
| 조사·탐색 | `docs/01-research/` |
| 기획서 (+ 코딩 규칙) | `docs/02-plan/` |
| IA 설계 | `docs/03-ia/` |
| 와이어프레임 | `docs/04-wireframe/` |
| UI/UX 설계 | `docs/05-design/` |
| DB 설계 | `docs/05-design/{feature}-db.md` |
| Gap 분석 | `docs/06-check/` |
| 리뷰 | `docs/07-review/` |

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

프로젝트별로 다르므로 `docs/02-plan/` 기획서의 기술 스택 섹션을 참조합니다.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v0.7.0 | 2026-03-14 | 초기 에이전트 지침 생성 |
| v0.8.0 | 2026-03-14 | 9단계 워크플로우 반영, convention 제거, frontend/backend 병렬 복원 |
| v0.8.1 | 2026-03-14 | 기능정의서·정책정의서·화면정의서 통합 반영 |
| v0.8.2 | 2026-03-14 | Stop Handler 항상 표시 (버전+다음단계 안내) |
| v0.8.3 | 2026-03-14 | 피처 레지스트리 — plan→review 기능 목록 자동 추적 |
| v0.8.4 | 2026-03-14 | 단계명 간소화: frontend→fe, backend→be |
| v0.8.5 | 2026-03-14 | /vais fix — 영향 분석 기반 수정 커맨드 추가 |
| v0.8.6 | 2026-03-14 | 전체 점검: 버그 수정, 훅 최적화, 스펙 업데이트 |
| v0.8.7 | 2026-03-14 | 코드 품질: 중복 제거, 입력 검증, loadConfig 캐싱 |
| v0.8.8 | 2026-03-14 | gates 불일치 수정, plugin.json hooks 경로 수정 |
| v0.9.0 | 2026-03-14 | wireframe 스킬 통합, fix 체이닝 방식 전환, check Gap 방향 판단 |
| v0.9.1 | 2026-03-15 | README 전면 개선, 날짜 통일, 버전·수정일 표시 추가 |
| v0.10.0 | 2026-03-15 | Manager 에이전트 추가, Memory 시스템 도입 |
| v0.11.0 | 2026-03-16 | 코드 리뷰 반영: bash-guard 강화, doc-tracker 경로 매칭 수정, 에러 로깅 추가, no-op 훅 제거, 템플릿 보완 |
| v0.11.1 | 2026-03-17 | .claude/settings.json 훅 등록 추가 — 플러그인 미설치 환경에서도 훅 동작 |
| v0.11.2 | 2026-03-17 | 폴더 구조 통일: init 템플릿 참조 추가, $1→{feature} 플레이스홀더 통일, feature registry 생성 |
| v0.12.0 | 2026-03-17 | UI/UX Pro Max 번들 — 디자인 토큰 자동 생성, designer 에이전트 역할 분리 |
