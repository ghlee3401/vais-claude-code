# VAIS Code

> 기획부터 배포까지, 팀 개발을 빠르고 튼튼하게.

**v0.16.0** · 최종 수정 2026-03-23

VAIS Code는 Claude Code 플러그인으로, 체계적인 6단계 개발 워크플로우를 제공합니다.
체이닝 문법(순차 `:` / 병렬 `+`), 4-Gate 시스템, Interface Contract, QA 리턴 경로를 지원합니다.

---

## 목차

- [요구사항](#요구사항)
- [설치](#설치) (Ubuntu · Windows · WSL2)
- [빠른 시작](#빠른-시작)
- [개발 워크플로우 (6단계)](#개발-워크플로우-6단계)
- [실행 방식 (체이닝 문법)](#실행-방식-체이닝-문법)
- [커맨드 레퍼런스](#커맨드-레퍼런스)
- [핵심 기능 상세](#핵심-기능-상세)
- [에이전트 팀](#에이전트-팀)
- [훅 시스템](#훅-시스템)
- [웹훅 알림 (Slack/Discord)](#웹훅-알림-slackdiscord)
- [설정 (vais.config.json)](#설정-vaisconfigjson)
- [프로젝트 구조](#프로젝트-구조)
- [FAQ](#faq)
- [HTML 대시보드](#html-대시보드)
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

### 사전 준비

VAIS Code는 Claude Code 플러그인이므로, Claude Code가 먼저 설치되어 있어야 합니다.

#### Ubuntu / Debian

```bash
# 1. Node.js 18+ 설치 (이미 설치되어 있다면 건너뛰세요)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Claude Code 설치
npm install -g @anthropic-ai/claude-code

# 3. Claude Code 실행 (최초 실행 시 인증 안내가 표시됩니다)
claude
```

#### Windows

```powershell
# 1. Node.js 18+ 설치
#    https://nodejs.org 에서 LTS 버전 다운로드 후 설치
#    또는 winget 사용:
winget install OpenJS.NodeJS.LTS

# 2. Claude Code 설치 (PowerShell 또는 명령 프롬프트)
npm install -g @anthropic-ai/claude-code

# 3. Claude Code 실행
claude
```

> **Windows 참고**: Windows에서는 WSL2(Windows Subsystem for Linux) 환경에서 실행하는 것을 권장합니다. WSL2에서는 Ubuntu와 동일한 방법으로 설치할 수 있습니다.

```powershell
# WSL2 설치 (관리자 PowerShell)
wsl --install

# WSL2 Ubuntu 셸에서 위의 Ubuntu 설치 방법을 따라 진행
```

### VAIS Code 플러그인 설치

Claude Code가 준비되었으면, 아래 세 가지 방법 중 하나로 VAIS Code를 설치합니다.

#### 마켓플레이스 (권장)

```bash
/plugin install vais-code
```

#### GitHub에서 설치

```bash
/plugin install github:ghlee3401/vais-claude-code
```

#### 오프라인 설치 (수동)

**Ubuntu / macOS:**

```bash
git clone https://github.com/ghlee3401/vais-claude-code.git ~/.claude/plugins/vais-code
```

**Windows (PowerShell):**

```powershell
git clone https://github.com/ghlee3401/vais-claude-code.git "$env:USERPROFILE\.claude\plugins\vais-code"
```

**Windows (WSL2):**

```bash
# WSL2 내에서는 Ubuntu와 동일합니다
git clone https://github.com/ghlee3401/vais-claude-code.git ~/.claude/plugins/vais-code
```

설치 후 Claude Code를 재시작하면 자동으로 플러그인이 로드됩니다.

### 설치 확인

Claude Code에서 다음 명령을 실행하여 정상 설치를 확인합니다:

```bash
/vais help
```

VAIS Code 사용법 안내가 표시되면 설치가 완료된 것입니다.
표시되지 않으면 Claude Code를 재시작하거나, 플러그인 디렉토리에 파일이 있는지 확인하세요.

| OS | 플러그인 경로 |
|----|------------|
| Ubuntu / macOS | `~/.claude/plugins/vais-code/` |
| Windows (네이티브) | `%USERPROFILE%\.claude\plugins\vais-code\` |
| Windows (WSL2) | `~/.claude/plugins/vais-code/` (WSL 내부) |

---

## 빠른 시작

```bash
/vais auto 기능명                          # 전체 자동 (Manager 오케스트레이션)
/vais plan:design:infra 기능명             # 순차 체이닝
/vais fe+be 기능명                         # 병렬 체이닝
/vais plan 기능명                          # 단일 실행
/vais status                               # 진행 상태 확인
```

피처명 없이 실행하면 기존 피처 목록에서 선택하거나 새 피처명을 입력할 수 있습니다.

자세한 실행 방식은 [실행 방식 (체이닝 문법)](#실행-방식-체이닝-문법) 참고.

### 첫 번째 피처 만들기

처음 사용한다면 아래 순서를 따라해 보세요:

```bash
# 1. 전체 자동 모드로 시작 (가장 간단)
/vais auto login

# 2. 또는 단계별로 직접 진행
/vais plan login              # 기획서 작성 (아이디어 탐색 + 요구사항 + 코딩 규칙)
/vais design login            # 설계 (IA + 와이어프레임 + UI)
/vais infra login             # 인프라 (DB 스키마 + 환경 설정)
/vais fe+be login             # 프론트+백엔드 (병렬)
/vais qa login                # QA (Gap 분석 + 코드 리뷰 + 보안)

# 3. 진행 상태 확인
/vais status
```

> **참고**: 에이전트 팀은 병렬 실행(`fe+be`)이나 자동 모드(`auto`)에서만 사용됩니다. 단일 실행 시에는 메인 Claude가 직접 처리하므로, 솔로 개발자도 동일한 워크플로우를 사용할 수 있습니다.

---

## 개발 워크플로우 (6단계)

```
📋기획 → 🎨설계 → 🔧인프라 → 💻프론트 + ⚙️백엔드 → ✅QA
```

| # | 단계 | 설명 | 산출물 |
|---|------|------|--------|
| 01 | 📋 기획 (plan) | 아이디어 탐색, MVP 범위, 요구사항, 정책, 코딩 규칙 | `docs/01-plan/{feature}.md` |
| 02 | 🎨 설계 (design) | IA + 와이어프레임 + UI 설계 통합 | `docs/02-design/{feature}.md` |
| 03 | 🔧 인프라 (infra) | DB 스키마, 마이그레이션, 환경 설정 | `docs/03-infra/{feature}.md` |
| 04 | 💻 프론트엔드 (fe) | 컴포넌트 구현 | 코드 직접 생성 |
| 05 | ⚙️ 백엔드 (be) | API + 데이터 액세스 (FE와 병렬) | 코드 직접 생성 |
| 06 | ✅ QA (qa) | Gap 분석 + 코드 리뷰 + 보안 + 테스트 | `docs/04-qa/{feature}.md` |

> 프론트엔드·백엔드 단계는 코드가 산출물이므로 별도 문서를 생성하지 않습니다.

### 4-Gate 체크포인트

```
Plan → [Gate 1] → Design → [Gate 2] → Infra → [Gate 3] → FE+BE → [Gate 4] → QA
```

각 Gate는 바이너리 체크리스트로 판정합니다. Gate 2에서 **Interface Contract**(API 스펙)이 자동 생성됩니다.

---

## 실행 방식 (체이닝 문법)

명령어가 곧 실행 방식입니다. 별도의 "모드" 전환이 없습니다.

| 방식 | 문법 | 예시 |
|------|------|------|
| 단일 | `/vais {단계} {기능}` | `/vais plan 기능명` |
| 순차 (`:`) | `/vais {단계}:{단계} {기능}` | `/vais plan:design:infra 기능명` |
| 병렬 (`+`) | `/vais {단계}+{단계} {기능}` | `/vais fe+be 기능명` |
| 혼합 | 순차와 병렬 조합 | `/vais plan:design:infra:fe+be:qa 기능명` |
| 전체 | `/vais auto {기능}` | `/vais auto 기능명` |

### 범위 패턴 (자동 체이닝)

한국어 범위 표현을 자동으로 체이닝 문법으로 변환합니다:

```bash
/vais plan부터 qa까지 기능명
# → 자동 변환: /vais plan:design:infra:fe+be:qa 기능명
```

`parallelGroups` 설정에 따라 병렬 구간(`fe+be`)이 자동 적용됩니다.

### 혼합 체이닝 실행 흐름

```
/vais plan:design:infra:fe+be:qa 기능명

① plan 완료 →
② design 완료 →
③ infra 완료 →
④ fe와 be 동시 실행, 둘 다 완료 →
⑤ qa 실행
```

에러 발생 시 **즉시 중단**하고 사용자에게 보고합니다.

---

## 커맨드 레퍼런스

### 워크플로우 커맨드

| 커맨드 | 설명 |
|--------|------|
| `/vais init {기능}` | 기존 프로젝트 분석 → VAIS 문서 역생성 |
| `/vais manager [질문/지시]` | 프로젝트 매니저 — 히스토리 조회, 전략 판단, 영향 분석 기반 수정 |
| `/vais auto {기능}` | 전체 자동 워크플로우 |
| `/vais plan {기능}` | 기획서 작성 (아이디어 탐색 + 요구사항 + 코딩 규칙 + Plan-Plus 검증) |
| `/vais design {기능}` | IA + 와이어프레임 + UI 설계 통합 |
| `/vais infra {기능}` | DB 스키마 + 마이그레이션 + 환경 설정 |
| `/vais fe {기능}` | 프론트엔드 구현 |
| `/vais be {기능}` | 백엔드 구현 |
| `/vais qa {기능}` | 빌드 검증 + Gap 분석 + 보안 + 코드 리뷰 |

### 유틸리티 커맨드

| 커맨드 | 설명 |
|--------|------|
| `/vais test` | 테스트 실행 + 커버리지 리포트 |
| `/vais commit` | Conventional Commits 형식 자동 커밋 |
| `/vais status` | 전체 피처 워크플로우 진행 상태 |
| `/vais next` | 다음 단계 자동 안내 |
| `/vais help` | 대화형 사용법 안내 |

---

## 핵심 기능 상세

### 자동 워크플로우 (`/vais auto`)

Manager 에이전트가 전체 6단계를 자동 오케스트레이션합니다.

**4-Gate 체크포인트**: 각 단계 완료 시 바이너리 체크리스트로 판정합니다.
- "계속" — 다음 단계로 진행
- "수정 요청" — 피드백 반영 → 변경 내용 표시 → 재확인 (핑퐁 루프)
- "여기서 중단" — 워크플로우 일시 중지

사용자가 "계속"을 선택할 때까지 피드백 루프가 반복됩니다.

### Interface Contract (Gate 2)

Gate 2에서 Manager가 Plan(데이터 모델) + Design(화면-데이터 매핑)을 합성하여 API 스펙을 확정합니다:
- API 엔드포인트 목록 + 요청/응답 형식
- 공통 에러 코드 + 인증 방식
- FE와 BE가 동일한 Contract를 참조하여 병렬 구현

### Plan-Plus (강화된 기획)

기획 단계에서 3단계 검증을 자동 수행합니다:

| 검증 단계 | 질문 | 목적 |
|----------|------|------|
| 의도 탐색 | "이 기능이 정말 해결하려는 문제가 뭔가?" | 근본 원인 파악 |
| 대안 탐색 | "기존 라이브러리나 다른 접근법은 없나?" | 최선의 방법 선택 |
| YAGNI 리뷰 | "지금 당장 필요한 것만 포함했나?" | 과잉 설계 방지 |

### QA + 리턴 경로

QA 단계는 5단계로 구성됩니다:

1. **빌드/실행 검증** — 의존성 → 빌드 → 서버 시작 → 핵심 동작 확인
2. **Gap 분석** — 설계 vs 구현 비교, 일치율 산출, 패치 단위 수정 지시
3. **보안 스캔** — OWASP Top 10 체크
4. **QA 시나리오** — 기획서 기반 테스트 시나리오 판정
5. **코드 리뷰** — 코드 품질, 성능, 유지보수성 검토

Gap 발견 시 **리턴 경로**를 포함합니다:

```markdown
| # | 미구현 항목 | 대상 에이전트 | 수정 힌트 | 리턴 단계 |
|---|-----------|-------------|---------|---------|
| 1 | 비밀번호 재설정 | backend-dev | auth.ts에 resetPassword 추가 | qa |
```

Manager는 리턴 경로를 기반으로 해당 에이전트에게 수정을 위임하고, 수정 후 QA를 재실행합니다.

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
> - plan 코딩 규칙: 네이밍 규칙
> - design 4.2: 색상 토큰
> - interface contract: API 엔드포인트 스펙
```

qa 단계에서 역추적이 가능하고, 빠진 참조가 있으면 바로 식별합니다.

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

5명의 전문 에이전트 + 1명의 매니저가 역할 기반으로 협업합니다.

| 에이전트 | 모델 | 역할 | 담당 단계 |
|---------|------|------|----------|
| manager | opus | Plan 실행 + 전체 오케스트레이션 + Gate 판정 | 최상위 의사결정 |
| designer | sonnet | IA + 와이어프레임 + UI 설계 | design |
| infra-dev | sonnet | DB 스키마 + 환경 + 프로젝트 설정 | infra |
| frontend-dev | sonnet | 프론트엔드 구현 | fe |
| backend-dev | sonnet | 백엔드 API + 데이터 액세스 | be |
| qa | sonnet | Gap 분석 + 코드 리뷰 + 보안 + QA | qa |

### 언제 에이전트를 사용하나요?

| 실행 방식 | 에이전트 사용 | 설명 |
|----------|-------------|------|
| 단일 (`/vais plan`) | 사용 안 함 | 메인 Claude가 직접 처리 |
| 순차 체이닝 (`plan:design`) | 사용 안 함 | 순차라 에이전트 불필요 |
| 병렬 체이닝 (`fe+be`) | **사용함** | 병렬 실행에 에이전트 필요 |
| 자동 (`/vais auto`) | **사용함** | Manager가 에이전트 팀 운영 |

### 에이전트 동작 모드

**서브에이전트 모드 (기본)**: Manager가 각 에이전트를 직접 호출합니다.

```
Manager (직접): plan
  → designer에게 위임: design (IA + 와이어프레임 + UI)
  → infra-dev에게 위임: infra (DB + 환경)
  → frontend-dev + backend-dev 병렬: fe + be
  → qa에게 위임: qa (Gap + 리뷰 + 보안)
```

**Agent Teams 모드 (실험적)**: 환경 변수 설정 필요:
```bash
CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude
```

---

## 훅 시스템

5개의 훅으로 워크플로우를 자동화합니다.

| 훅 | 역할 | 스크립트 |
|----|------|---------|
| SessionStart | 이전 작업 복원, 워크플로우 안내 | `hooks/session-start.js` |
| PreToolUse(Bash) | 위험 명령 차단 | `scripts/bash-guard.js` |
| PostToolUse(Write\|Edit) | 문서 작성 시 워크플로우 상태 자동 갱신 | `scripts/doc-tracker.js` |
| Stop | 다음 단계 자동 안내 | `scripts/stop-handler.js` |
| UserPromptSubmit | 의도/체이닝 감지 | `scripts/prompt-handler.js` |

---

## 웹훅 알림 (Slack/Discord)

`VAIS_WEBHOOK_URL` 환경변수를 설정하면, 모든 VAIS Code 세션에서 워크플로우 이벤트를 외부로 알림합니다.

> 단방향 알림입니다. Slack/Discord에서 메시지를 받을 수 있지만, 답장으로 Claude Code에 지시를 내릴 수는 없습니다.

### 전송되는 이벤트

| 이벤트 | 시점 | 데이터 |
|--------|------|--------|
| `session_start` | Claude Code 세션 시작 | 프로젝트 경로, 활성 피처, 피처 수 |
| `phase_complete` | 워크플로우 단계 완료 | 피처명, 단계, 파일명 |
| `stop` | Claude 응답 완료 | 피처명, 현재 단계, 진행률, 다음 단계 |

### Slack 설정

1. https://api.slack.com/apps 접속
2. **Create New App** → **From scratch** → 앱 이름 입력 (예: `VAIS Alert`) → 워크스페이스 선택
3. 왼쪽 **Incoming Webhooks** → 토글 **On**
4. **Add New Webhook to Workspace** → 알림 받을 채널 선택 (예: `#vais-alerts`) → 허용
5. 생성된 URL 복사 → 셸 프로필에 추가:

```bash
# ~/.bashrc 또는 ~/.zshrc
export VAIS_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../...
```

### Discord 설정

1. 서버 설정 → 연동 → 웹후크 → **새 웹후크**
2. 알림 받을 채널 선택 → **웹후크 URL 복사**
3. 셸 프로필에 추가:

```bash
export VAIS_WEBHOOK_URL=https://discord.com/api/webhooks/000000000000/XXXXXXXXXXXX
```

### 비활성화

환경변수를 제거하거나 비우면 웹훅이 전송되지 않습니다. 웹훅 전송 실패 시에도 워크플로우는 정상 동작합니다.

---

## 설정 (vais.config.json)

| 설정 | 기본값 | 설명 |
|------|-------|------|
| `workflow.phases` | 6단계 배열 | plan → design → infra → fe → be → qa |
| `parallelGroups.implementation` | `["fe", "be"]` | 구현 단계 병렬 그룹 |
| `chaining.sequential` | `":"` | 순차 실행 구분자 |
| `chaining.parallel` | `"+"` | 병렬 실행 구분자 |
| `gapAnalysis.matchThreshold` | 90 | Gap 분석 통과 기준 (%) |
| `gapAnalysis.maxIterations` | 5 | 자동 수정 최대 반복 횟수 |
| `orchestration.gates` | `["plan", "design", "infra", "fe"]` | 자동 모드 4-Gate 체크포인트 |
| `team.maxTeammates` | 6 | 동시 에이전트 최대 수 |

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
│   ├── generate-dashboard.js # HTML 대시보드 생성
│   ├── vais-validate-plugin.js # 플러그인/마켓플레이스 검증
│   └── seo-audit.js         # SEO 감사
├── skills/
│   ├── vais/
│   │   ├── SKILL.md          # 슬림 라우터 (Skills 2.0)
│   │   └── phases/           # phase별 참조 파일
│   ├── vais-validate-plugin/
│   │   └── SKILL.md          # 플러그인 검증 (독립 스킬)
│   └── vais-seo/
│       └── SKILL.md          # SEO 감사 (독립 스킬)
├── agents/
│   ├── manager.md            # 프로젝트 매니저 (opus)
│   ├── designer.md           # UI/UX 디자이너 (sonnet)
│   ├── infra-dev.md          # 인프라 개발자 (sonnet)
│   ├── frontend-dev.md       # 프론트엔드 (sonnet)
│   ├── backend-dev.md        # 백엔드 (sonnet)
│   └── qa.md                 # QA 엔지니어 (sonnet)
├── templates/                 # 문서 템플릿
├── output-styles/
│   └── vais-default.md       # 응답 스타일
├── mcp/
│   └── design-system-server.json  # MCP 디자인 시스템 (lazy load)
├── lib/                       # 유틸리티
│   ├── io.js
│   ├── paths.js              # 경로 관리
│   ├── status.js             # 상태 + Gap 분석
│   ├── memory.js             # Manager 메모리 시스템
│   ├── webhook.js            # 웹훅 알림 유틸리티
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

## 트러블슈팅

### 플러그인이 로드되지 않을 때

1. Claude Code 재시작
2. `~/.claude/plugins/vais-code/` 디렉토리 확인
3. `/vais help` 실행하여 응답 확인

### Gap 분석이 90%에 도달하지 않을 때

Gap 분석은 최대 5회 반복합니다. 5회 후에도 90% 미만이면:

1. `/vais qa {기능}` 결과에서 미구현 항목 목록을 확인
2. 수동으로 누락된 기능을 구현
3. `/vais qa {기능}`을 다시 실행

### 피처명 오류

피처명에는 한글, 영문, 숫자, `-`, `_`만 사용할 수 있습니다:

```bash
# OK
/vais plan user-auth
/vais plan 로그인기능

# 오류 — 공백, 슬래시, 특수문자 불가
/vais plan "my feature"     # 공백 불가
/vais plan path/to/feature  # 슬래시 불가
```

### .vais/status.json 손상 시

`.vais/status.json`을 삭제하면 초기 상태로 돌아갑니다:

```bash
rm .vais/status.json
/vais init {기능명}    # 다시 초기화
```

---

## FAQ

### Q: 특정 단계만 실행할 수 있나요?

네. `/vais plan 기능명`처럼 단일 실행하거나, `/vais plan:design 기능명`으로 체이닝할 수 있습니다.

### Q: 기존 프로젝트에도 적용할 수 있나요?

네. `/vais init {피처명}`으로 기존 코드를 분석해 VAIS 문서를 역생성합니다. 코드는 수정하지 않고 문서(plan, design, infra)만 만들어서 바로 개발 워크플로우에 진입할 수 있습니다.

### Q: 체이닝에서 `:` 과 `+` 의 차이는?

`:` 는 순차 실행 (앞 단계 끝나면 다음), `+` 는 병렬 실행 (동시에 에이전트로 처리)입니다.

### Q: 외부 의존성이 있나요?

없습니다. Node.js 내장 모듈만 사용합니다.

### Q: 한국어만 지원하나요?

커맨드는 영문(`/vais plan`)이지만, 기능명은 한국어/영문 모두 지원합니다:
```bash
/vais plan 기능명    # 한국어 OK
/vais plan user-auth     # 영문 OK
```

---

## HTML 대시보드

`docs/` 하위의 마크다운 산출물을 브라우저에서 보기 좋은 HTML 페이지로 변환합니다.

```bash
node scripts/generate-dashboard.js              # 현재 프로젝트
node scripts/generate-dashboard.js /path/to/project  # 다른 프로젝트
# → docs/dashboard.html 생성
```

생성된 `docs/dashboard.html`을 브라우저에서 열면 됩니다.

### 대시보드 기능

| 기능 | 설명 |
|------|------|
| 피처별 사이드바 | 피처 선택 시 해당 산출물로 전환 |
| Phase 탭 | 기획·설계·인프라 등 단계별 문서 탭 전환 |
| 피처 레지스트리 | 기능 목록 + 구현 상태 + 진행률 바 |
| Phase 진행 표시 | 6단계 완료/진행/대기 상태를 아이콘으로 표시 |
| Mermaid 다이어그램 | ERD, 사이트맵, 화면 흐름도 자동 렌더링 |
| Memory 타임라인 | Manager Memory 의사결정 이력 시각화 |
| 반응형 + 인쇄 | 모바일 대응, 인쇄 시 전체 문서 출력 |

외부 의존성 없이 Node.js 기본 모듈만 사용합니다.

---

## 현재 미지원 항목 (Roadmap)

아래 항목들은 VAIS Code 워크플로우에 아직 포함되지 않은 영역입니다.

| 카테고리 | 구체적 항목 | 비고 |
|---------|-----------|------|
| 인증/보안 | OAuth, JWT, RBAC, CORS, CSP, 입력 검증 | qa 단계 OWASP 스캔은 기본 수준 |
| 결제 | PG 연동, 구독 모델, 웹훅 처리 | — |
| 배포/CI/CD | Docker, GitHub Actions, Vercel/AWS, 환경변수 관리 | — |
| GA4/Analytics | 이벤트 트래킹, 전환 추적, GTM 설정 | — |
| SEO | 메타태그, sitemap, OG태그, 구조화 데이터 | — |
| i18n | 다국어 지원, 번역 키 관리, RTL | — |
| 접근성(a11y) | WCAG, ARIA, 키보드 내비게이션, 스크린리더 | — |
| 성능 최적화 | 번들 분석, 이미지 최적화, 코드 스플리팅, 캐싱 | — |
| DB 마이그레이션 | 스키마 변경, 시드 데이터, 롤백 전략 | infra 단계에서 초기 스키마만 생성 |
| 모니터링/로깅 | Sentry, 에러 트래킹, 헬스체크, 알림 | — |
| API 문서화 | OpenAPI/Swagger, API 버저닝 | — |
| E2E 테스트 | Playwright, Cypress, 시나리오 테스트 | qa 단계 QA 시나리오는 수동 검증용 |

---

## 라이선스

MIT License - [LICENSE](./LICENSE) 참조

---

Made by [VAIS Voice](https://github.com/ghlee3401)

전체 변경 이력은 [CHANGELOG](./CHANGELOG.md)를 참조하세요.
