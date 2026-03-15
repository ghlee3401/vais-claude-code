# VAIS Code

> 기획부터 배포까지, 팀 개발을 빠르고 튼튼하게.

**v0.10.0** · 최종 수정 2026-03-15

VAIS Code는 Claude Code 플러그인으로, 체계적인 9단계 개발 워크플로우를 제공합니다.
체이닝 문법(순차 `:` / 병렬 `+`), 설계 병렬화(UI+DB), 빌드 검증 통합 Gap 분석을 지원합니다.

---

## 목차

- [요구사항](#요구사항)
- [설치](#설치)
- [빠른 시작](#빠른-시작)
- [개발 워크플로우 (9단계)](#개발-워크플로우-9단계)
- [실행 방식 (체이닝 문법)](#실행-방식-체이닝-문법)
- [커맨드 레퍼런스](#커맨드-레퍼런스)
- [핵심 기능 상세](#핵심-기능-상세)
- [에이전트 팀](#에이전트-팀)
- [훅 시스템](#훅-시스템)
- [설정 (vais.config.json)](#설정-vaisconfigjson)
- [프로젝트 구조](#프로젝트-구조)
- [FAQ](#faq)
- [현재 미지원 항목 (Roadmap)](#현재-미지원-항목-roadmap)
- [라이선스](#라이선스)
- [변경 이력](./CHANGELOG.md)

---

## 요구사항

| 항목 | 최소 버전 |
|------|----------|
| Claude Code | v2.1.32+ |
| Node.js | v18+ |

---

## 설치

### 마켓플레이스 (권장)

```bash
/plugin install vais-code
```

### GitHub에서 설치

```bash
/plugin install github:ghlee3401/vais-claude-code
```

### 오프라인 설치

```bash
git clone https://github.com/ghlee3401/vais-claude-code.git ~/.claude/plugins/vais-code
```

설치 후 Claude Code를 재시작하면 자동으로 플러그인이 로드됩니다.

---

## 빠른 시작

```bash
/vais auto SNS앱                          # 전체 자동 (tech-lead 오케스트레이션)
/vais plan:ia:wireframe 로그인기능         # 순차 체이닝
/vais fe+be 로그인기능                     # 병렬 체이닝
/vais plan 로그인기능                      # 단일 실행
/vais status                               # 진행 상태 확인
```

피처명 없이 실행하면 기존 피처 목록에서 선택하거나 새 피처명을 입력할 수 있습니다.

자세한 실행 방식은 [실행 방식 (체이닝 문법)](#실행-방식-체이닝-문법) 참고.

---

## 개발 워크플로우 (9단계)

```
🔭조사·탐색 → 📋기획 → 🗺IA → 🖼와이어프레임 → 🎨설계(UI+DB) → 💻프론트 → ⚙️백엔드 → 🔎Gap분석 → 🔍검토
```

### 산출물 경로

| 단계 | 산출물 경로 |
|------|-----------|
| 조사·탐색 | `docs/01-research/{feature}.md` |
| 기획 (+ 코딩 규칙) | `docs/02-plan/{feature}.md` |
| IA | `docs/03-ia/{feature}.md` |
| 와이어프레임 | `docs/04-wireframe/{feature}.md` |
| UI 설계 | `docs/05-design/{feature}.md` |
| DB 설계 | `docs/05-design/{feature}-db.md` |
| Gap 분석 | `docs/06-check/{feature}.md` |
| 검토 | `docs/07-review/{feature}.md` |

프론트엔드·백엔드 단계는 코드가 산출물이므로 별도 문서를 생성하지 않습니다.

---

## 실행 방식 (체이닝 문법)

명령어가 곧 실행 방식입니다. 별도의 "모드" 전환이 없습니다.

| 방식 | 문법 | 예시 |
|------|------|------|
| 단일 | `/vais {단계} {기능}` | `/vais plan 로그인기능` |
| 순차 (`:`) | `/vais {단계}:{단계} {기능}` | `/vais plan:ia:wireframe 로그인기능` |
| 병렬 (`+`) | `/vais {단계}+{단계} {기능}` | `/vais fe+be 로그인기능` |
| 혼합 | 순차와 병렬 조합 | `/vais plan:ia:design:fe+be:check 로그인기능` |
| 전체 | `/vais auto {기능}` | `/vais auto 로그인기능` |

### 범위 패턴 (자동 체이닝)

한국어 범위 표현을 자동으로 체이닝 문법으로 변환합니다:

```bash
/vais plan부터 check까지 로그인기능
# → 자동 변환: /vais plan:ia:wireframe:design:fe+be:check 로그인기능
```

`parallelGroups` 설정에 따라 병렬 구간(`fe+be`)이 자동 적용됩니다.

### 혼합 체이닝 실행 흐름

```
/vais plan:ia:design:fe+be:check 로그인기능

① plan 완료 →
② ia 완료 →
③ design 완료 (내부에서 UI+DB 병렬) →
④ fe와 be 동시 실행, 둘 다 완료 →
⑤ check 실행
```

에러 발생 시 **즉시 중단**하고 사용자에게 보고합니다.

---

## 커맨드 레퍼런스

### 워크플로우 커맨드

| 커맨드 | 설명 |
|--------|------|
| `/vais init {기능}` | 기존 프로젝트 분석 → VAIS 문서 역생성 |
| `/vais auto {기능}` | 전체 자동 워크플로우 |
| `/vais research {기능}` | 아이디어 정리 + MVP 범위 결정 |
| `/vais plan {기능}` | 기획서 작성 (코딩 규칙 포함) + Plan-Plus 검증 |
| `/vais ia {기능}` | Information Architecture 설계 |
| `/vais wireframe {기능}` | 와이어프레임 생성 (ASCII/HTML) |
| `/vais design {기능}` | UI + DB 설계 (병렬) |
| `/vais fe {기능}` | 프론트엔드 구현 |
| `/vais be {기능}` | 백엔드 구현 |
| `/vais check {기능}` | 빌드 검증 + Gap 분석 + QA 시나리오 생성 |
| `/vais review {기능}` | 코드 리뷰 + QA 판정 + 최종 승인 |
| `/vais fix {기능}` | 영향 분석 → 코드·문서 일괄 수정 → 검증 |

### 유틸리티 커맨드

| 커맨드 | 설명 |
|--------|------|
| `/vais test` | 테스트 실행 + 커버리지 리포트 |
| `/vais commit` | Conventional Commits 형식 자동 커밋 |
| `/vais status` | 전체 피처 워크플로우 진행 상태 |
| `/vais next` | 다음 단계 자동 안내 |
| `/vais help` | 대화형 사용법 안내 |

### 와이어프레임 옵션

| 커맨드 | 설명 |
|--------|------|
| `/vais wireframe {기능}` | ASCII 와이어프레임 (기본) |
| `/vais wireframe {기능} --format html` | HTML 와이어프레임 |
| `/vais wireframe {기능} --format mermaid` | Mermaid 화면 흐름도 |
| `/vais wireframe {기능} --device all` | 반응형 전체 (모바일+태블릿+데스크탑) |

---

## 핵심 기능 상세

### 자동 워크플로우 (`/vais auto`)

tech-lead 에이전트가 전체 9단계를 자동 오케스트레이션합니다.

**게이트 체크포인트**: `plan`, `fe` 단계 완료 시 사용자에게 확인을 요청합니다.
- "계속" — 다음 단계로 진행
- "수정 후 계속" — 피드백 반영 후 진행
- "여기서 중단" — 워크플로우 일시 중지

### Plan-Plus (강화된 기획)

기획 단계에서 3단계 검증을 자동 수행합니다:

| 검증 단계 | 질문 | 목적 |
|----------|------|------|
| 의도 탐색 | "이 기능이 정말 해결하려는 문제가 뭔가?" | 근본 원인 파악 |
| 대안 탐색 | "기존 라이브러리나 다른 접근법은 없나?" | 최선의 방법 선택 |
| YAGNI 리뷰 | "지금 당장 필요한 것만 포함했나?" | 과잉 설계 방지 |

### 설계 병렬화 (UI + DB)

design 단계에서 UI 설계와 DB 설계를 병렬로 진행합니다:

- plan에서 `hasDatabase` 플래그를 판단
- DB 필요 시 → designer (UI) + backend-dev (DB) 동시 실행
- DB 불필요 시 → UI 설계만 실행

DB 종류는 auto 모드에서 SQLite(zero-config)가 기본이며, 수동 모드에서는 PostgreSQL, Supabase, Firebase, MongoDB 등을 선택할 수 있습니다.

| DB 종류 | ORM/클라이언트 |
|---------|--------------|
| SQLite | better-sqlite3 / Prisma |
| PostgreSQL | Prisma / Drizzle |
| Supabase | @supabase/supabase-js |
| Firebase | firebase-admin |
| MongoDB | mongoose |

### 빌드 검증 + Gap 분석 (`/vais check`)

check 단계는 4단계로 구성됩니다:

1. **빌드/실행 검증** — 의존성 → 빌드 → 서버 시작 → 핵심 동작 확인
2. **Gap 분석** — 설계 vs 구현 비교, 일치율 산출, 패치 단위 수정 지시
3. **보안 스캔** — OWASP Top 10 체크
4. **QA 시나리오 생성** — 기획서 기반 테스트 시나리오 (review에서 판정)

빌드 실패 시 Gap 분석으로 넘어가지 않고, 먼저 빌드 에러를 수정합니다.
Gap 발견 시 추상적인 설명 대신 구체적인 수정 지시를 출력합니다:

```markdown
| # | 미구현 항목 | 출처 | 수정 대상 파일 | 수정 범위 | 수정 내용 |
|---|-----------|------|-------------|---------|---------|
| 1 | 비밀번호 재설정 | plan 3.1.4 | src/api/auth.ts | 45-60 | resetPassword 엔드포인트 추가 |
```

### 와이어프레임 컴포넌트 어노테이션

와이어프레임에 `data-component` 속성을 추가하여 프론트엔드 매핑을 자동화합니다:

```html
<div data-component="LoginForm" data-props="onSubmit, isLoading, error">
  <input data-component="EmailInput" data-props="value, onChange, error" />
</div>
```

### 문서 참조 투명성

에이전트가 구현 시 참조한 문서 목록을 산출물 상단에 기록합니다:

```markdown
> 참조 문서:
> - convention 3.1: 네이밍 규칙
> - design 4.2: 색상 토큰
> - plan 3.6: 배치 변환 요구사항
```

check 단계에서 역추적이 가능하고, 빠진 참조가 있으면 바로 식별합니다.

### CSS 파일 감지 (프론트엔드)

frontend 단계에서 기존 CSS/스타일 파일을 자동 감지합니다:

| 모드 | 동작 |
|------|------|
| auto | CSS 파일이 없으면 design 토큰 기반으로 자동 생성 |
| 수동 | AskUserQuestion으로 선택: 자동 생성 / 파일 지정 / Tailwind |

기존 CSS 파일이 있으면 해당 스타일을 분석하여 일관된 디자인을 유지합니다.

### 테스트 & 커밋

```bash
/vais test     # 프레임워크 자동 감지 (jest, vitest, pytest 등)
/vais commit   # → feat(auth): 로그인 API 엔드포인트 추가
```

---

## 에이전트 팀

5명의 전문 에이전트가 역할 기반으로 협업합니다.

| 에이전트 | 모델 | 역할 | 담당 단계 |
|---------|------|------|----------|
| tech-lead | opus | 아키텍처 결정, 팀 오케스트레이션 | 전체 총괄 |
| designer | sonnet | UI/UX, 와이어프레임 | ia, wireframe, design (UI) |
| frontend-dev | sonnet | 프론트엔드 구현 | fe |
| backend-dev | sonnet | 백엔드 + DB 설계/구현 | design (DB), be |
| reviewer | sonnet | 빌드 검증, Gap 분석, 코드 리뷰 | check, review |

### 언제 에이전트를 사용하나요?

| 실행 방식 | 에이전트 사용 | 설명 |
|----------|-------------|------|
| 단일 (`/vais plan`) | 사용 안 함 | 메인 Claude가 직접 처리 |
| 순차 체이닝 (`plan:ia`) | 사용 안 함 | 순차라 에이전트 불필요 |
| 병렬 체이닝 (`fe+be`) | **사용함** | 병렬 실행에 에이전트 필요 |
| 자동 (`/vais auto`) | **사용함** | tech-lead가 에이전트 팀 운영 |

### 에이전트 동작 모드

**서브에이전트 모드 (기본)**: tech-lead가 Task tool로 각 에이전트를 호출합니다.

```
tech-lead (직접): research → plan
  → designer에게 위임: ia → wireframe
  → designer + backend-dev 병렬: design (UI + DB)
  → frontend-dev + backend-dev 병렬: fe + be
  → reviewer와 공동: check → review
```

**Agent Teams 모드 (실험적)**: 환경 변수 설정 필요:
```bash
CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude
```

---

## 훅 시스템

6개의 훅으로 워크플로우를 자동화합니다.

| 훅 | 역할 | 스크립트 |
|----|------|---------|
| SessionStart | 이전 작업 복원, 레벨/워크플로우 안내 | `hooks/session-start.js` |
| PreToolUse(Bash) | 위험 명령 차단 | `scripts/bash-guard.js` |
| PostToolUse(Write\|Edit) | 문서 작성 시 워크플로우 상태 자동 갱신 | `scripts/doc-tracker.js` |
| Stop | 다음 단계 자동 안내 | `scripts/stop-handler.js` |
| UserPromptSubmit | 의도/체이닝 감지 | `scripts/prompt-handler.js` |
| SubagentStop | 서브에이전트 작업 결과 로깅 | `scripts/subagent-stop.js` |

---

## 설정 (vais.config.json)

| 설정 | 기본값 | 설명 |
|------|-------|------|
| `workflow.phases` | 9단계 배열 | research → plan → ia → wireframe → design → fe → be → check → review |
| `parallelGroups.design` | `["ui-design", "db-design"]` | 설계 단계 병렬 그룹 |
| `parallelGroups.implementation` | `["fe", "be"]` | 구현 단계 병렬 그룹 |
| `chaining.sequential` | `":"` | 순차 실행 구분자 |
| `chaining.parallel` | `"+"` | 병렬 실행 구분자 |
| `gapAnalysis.matchThreshold` | 90 | Gap 분석 통과 기준 (%) |
| `gapAnalysis.maxIterations` | 5 | 자동 수정 최대 반복 횟수 |
| `orchestration.gates` | `["plan", "fe"]` | 자동 모드에서 사용자 확인 체크포인트 |
| `team.maxTeammates` | 5 | 동시 에이전트 최대 수 |

---

## 프로젝트 구조

```
vais-claude-code/
├── .claude-plugin/
│   ├── plugin.json           # 플러그인 매니페스트
│   └── marketplace.json      # 마켓플레이스 매니페스트
├── hooks/
│   ├── hooks.json            # 훅 이벤트 정의
│   └── session-start.js      # 세션 초기화
├── scripts/
│   ├── bash-guard.js         # 위험 명령 차단
│   ├── doc-tracker.js        # 문서 상태 추적
│   ├── stop-handler.js       # 다음 단계 안내
│   ├── prompt-handler.js     # 의도/체이닝 감지
│   └── subagent-stop.js      # 서브에이전트 완료 처리
├── skills/
│   └── vais/
│       ├── SKILL.md          # 슬림 라우터 (Skills 2.0)
│       └── phases/           # phase별 참조 파일
├── agents/
│   ├── tech-lead.md          # 기술 리드 (opus)
│   ├── designer.md           # UI/UX 디자이너 (sonnet)
│   ├── frontend-dev.md       # 프론트엔드 (sonnet)
│   ├── backend-dev.md        # 백엔드 + DB (sonnet)
│   └── reviewer.md           # 리뷰어 (sonnet)
├── templates/                 # 문서 템플릿 (7+1개)
├── output-styles/
│   └── vais-default.md       # 응답 스타일
├── lib/                       # 유틸리티
│   ├── io.js
│   ├── paths.js              # 경로 관리
│   ├── status.js             # 상태 + Gap 분석
│   └── debug.js
├── tests/                     # 유닛 테스트 (node --test)
├── AGENTS.md                  # 크로스 툴 호환 에이전트 지침
├── CHANGELOG.md               # 릴리즈 노트
├── vais.config.json           # 중앙 설정
└── LICENSE                    # MIT 라이선스
```

---

## 크로스 툴 호환

`AGENTS.md` 파일을 통해 Claude Code 외의 AI 코딩 도구(Cursor, Copilot 등)에서도
동일한 개발 규칙을 적용할 수 있습니다.

---

## FAQ

### Q: 특정 단계만 실행할 수 있나요?

네. `/vais plan 로그인기능`처럼 단일 실행하거나, `/vais plan:ia 로그인기능`으로 체이닝할 수 있습니다.

### Q: 기존 프로젝트에도 적용할 수 있나요?

네. `/vais init {피처명}`으로 기존 코드를 분석해 VAIS 문서를 역생성합니다. 코드는 수정하지 않고 문서(research, plan, ia, wireframe, design)만 만들어서 바로 개발 워크플로우에 진입할 수 있습니다.

### Q: 체이닝에서 `:` 과 `+` 의 차이는?

`:` 는 순차 실행 (앞 단계 끝나면 다음), `+` 는 병렬 실행 (동시에 에이전트로 처리)입니다.

### Q: 외부 의존성이 있나요?

없습니다. Node.js 내장 모듈만 사용합니다.

### Q: 한국어만 지원하나요?

커맨드는 영문(`/vais plan`)이지만, 기능명은 한국어/영문 모두 지원합니다:
```bash
/vais plan 로그인기능    # 한국어 OK
/vais plan user-auth     # 영문 OK
```

---

## 현재 미지원 항목 (Roadmap)

아래 항목들은 VAIS Code 워크플로우에 아직 포함되지 않은 영역입니다.

| 카테고리 | 구체적 항목 | 비고 |
|---------|-----------|------|
| 인증/보안 | OAuth, JWT, RBAC, CORS, CSP, 입력 검증 | check 단계 OWASP 스캔은 기본 수준 |
| 결제 | PG 연동, 구독 모델, 웹훅 처리 | — |
| 배포/CI/CD | Docker, GitHub Actions, Vercel/AWS, 환경변수 관리 | — |
| GA4/Analytics | 이벤트 트래킹, 전환 추적, GTM 설정 | — |
| SEO | 메타태그, sitemap, OG태그, 구조화 데이터 | — |
| i18n | 다국어 지원, 번역 키 관리, RTL | — |
| 접근성(a11y) | WCAG, ARIA, 키보드 내비게이션, 스크린리더 | — |
| 성능 최적화 | 번들 분석, 이미지 최적화, 코드 스플리팅, 캐싱 | — |
| DB 마이그레이션 | 스키마 변경, 시드 데이터, 롤백 전략 | design 단계에서 초기 스키마만 생성 |
| 모니터링/로깅 | Sentry, 에러 트래킹, 헬스체크, 알림 | — |
| API 문서화 | OpenAPI/Swagger, API 버저닝 | — |
| E2E 테스트 | Playwright, Cypress, 시나리오 테스트 | check 단계 QA 시나리오는 수동 검증용 |

---

## 라이선스

MIT License - [LICENSE](./LICENSE) 참조

---

Made by [VAIS Voice](https://github.com/ghlee3401)

전체 변경 이력은 [CHANGELOG](./CHANGELOG.md)를 참조하세요.
