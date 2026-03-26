# VAIS Code

**v0.22.0** · Claude Code Plugin

> 한 줄이면 기획부터 QA까지. AI가 6단계 개발 워크플로우를 자동으로 진행합니다.

```
/vais auto login
```

```
 ┌──────────────────────────────────────────────────────────────────────┐
 │                                                                      │
 │   📋 기획  ──▶  🎨 설계  ──▶  🔧 아키텍트 ──▶  💻+⚙️  ──▶  ✅ QA    │
 │   Plan        Design       Architect      FE+BE       QA Check  │
 │                                                                      │
 │   아이디어     IA/와이어     DB 스키마     프론트+백엔드   Gap 분석    │
 │   MVP 범위    프레임/UI     마이그레이션   (병렬 실행)    코드 리뷰    │
 │   요구사항     디자인 토큰   환경 설정     API 연동      보안 스캔    │
 │                                                                      │
 │   📄 plan.md  📄 design.md  📄 arch.md    코드 생성     📄 qa.md     │
 │                                                                      │
 └──────────────────────────────────────────────────────────────────────┘
```

---

## 30초 설치

### 1. Claude Code 설치 (이미 있으면 건너뛰세요)

```bash
npm install -g @anthropic-ai/claude-code
```

### 2. VAIS Code 플러그인 설치

```bash
# Claude Code 안에서 실행
/plugin install github:ghlee3401/vais-claude-code
```

### 3. 확인

```bash
/vais help
```

사용법이 표시되면 완료!

---

## 2분 퀵스타트

### 전체 자동 (가장 간단)

```bash
/vais auto login
```

AI가 기획 → 설계 → 아키텍트 → 프론트+백엔드 → QA를 **자동으로** 진행합니다.
각 단계마다 확인을 요청하므로 원하는 시점에 개입할 수 있습니다.

### 단계별 직접 진행

```bash
/vais plan login              # 1. 기획서 작성
/vais design login            # 2. IA + 와이어프레임 + UI 설계
/vais architect login          # 3. DB 스키마 + 환경 설정
/vais frontend+backend login  # 4. 프론트+백엔드 (병렬)
/vais qa login                # 5. Gap 분석 + 코드 리뷰 + 보안
/vais report login            # 6. 완료 보고서
```

### 진행 상태 확인

```bash
/vais status                  # 전체 피처 진행률
/vais next                    # 다음 단계 안내
```

---

## 이게 뭔가요?

**VAIS Code**는 [Claude Code](https://claude.ai/code) 플러그인입니다.

"로그인 기능 만들어줘"라고 하면, AI가 알아서:

```
1. 기획서를 작성하고 (MVP 범위, 요구사항, 코딩 규칙)
2. 화면을 설계하고 (IA, 와이어프레임, UI 디자인)
3. DB를 세팅하고 (스키마, 마이그레이션, 환경 변수)
4. 코드를 짜고 (프론트+백엔드 동시 진행)
5. 품질을 검증합니다 (Gap 분석, 보안 스캔, 코드 리뷰)
```

모든 과정에서 **문서가 자동 생성**되고, 각 단계의 산출물이 다음 단계의 입력이 됩니다.

### 누구를 위한 건가요?

| 상황 | VAIS Code가 해주는 것 |
|------|---------------------|
| 혼자 개발하는데 기획/설계를 체계적으로 하고 싶다 | 6단계 워크플로우 + 자동 문서화 |
| 아이디어는 있는데 어디서부터 시작할지 모르겠다 | `/vais auto` 한 줄로 전체 진행 |
| 프론트+백엔드를 빠르게 동시에 진행하고 싶다 | `frontend+backend` 병렬 실행 |
| 코드 품질을 자동으로 검증하고 싶다 | QA 단계 (Gap 분석 + OWASP 보안) |

---

## 체이닝 문법

VAIS Code의 핵심은 **체이닝**입니다. 명령어를 조합해서 원하는 만큼 실행할 수 있습니다.

```
  ":"  = 순차 실행 (앞이 끝나면 다음)
  "+"  = 병렬 실행 (동시에)
```

| 실행 | 명령어 | 설명 |
|------|--------|------|
| 단일 | `/vais plan login` | 기획만 |
| 순차 | `/vais plan:design:architect login` | 기획 → 설계 → 아키텍트 순서대로 |
| 병렬 | `/vais frontend+backend login` | 프론트+백엔드 동시 |
| 혼합 | `/vais plan:design:architect:frontend+backend:qa login` | 전체 순차+병렬 조합 |
| 자동 | `/vais auto login` | Manager가 전체 오케스트레이션 |
| 범위 | `/vais plan부터 qa까지 login` | 한국어 범위 표현 자동 변환 |

---

## 6단계 워크플로우 상세

```
Plan ──▶ [Gate 1] ──▶ Design ──▶ [Gate 2] ──▶ Architect ──▶ [Gate 3] ──▶ FE+BE ──▶ [Gate 4] ──▶ QA
                                    │
                              Interface Contract
                              (API 스펙 자동 생성)
```

### Gate 시스템

4개의 Gate가 각 단계 사이에서 품질을 검증합니다. Gate 통과 조건은 바이너리 체크리스트입니다.

| Gate | 위치 | 주요 검증 항목 |
|------|------|--------------|
| Gate 1 | Plan → Design | 피처 레지스트리 생성, 데이터 모델 정의, 기술 스택 선정 |
| Gate 2 | Design → Architect | 화면별 컴포넌트 명세, 디자인 토큰, **Interface Contract 생성** |
| Gate 3 | Architect → FE+BE | DB 스키마 일치, 마이그레이션 완료, 빌드 성공 |
| Gate 4 | FE+BE → QA | 빌드 성공, FE/BE 모두 Interface Contract 참조 |

### 각 단계가 하는 일

#### 📋 Plan (기획)

아이디어 탐색부터 시작합니다. AI가 질문하고, 답변을 바탕으로 기획서를 작성합니다.

**포함 내용**: Executive Summary, Context Anchor, MVP 범위, 기능 요구사항, 정책 정의, 비기능 요구사항, 기술 스택, Success Criteria, Impact Analysis

**Checkpoint**: 요구사항 확인 + 명확화 질문 (사용자 승인 전까지 기획서 생성 안 함)

#### 🎨 Design (설계)

IA, 와이어프레임, UI를 하나의 단계에서 통합 수행합니다.

**포함 내용**: Context Anchor (Plan에서 전파), Architecture Options (3안 비교 → 사용자 선택), 사이트맵, 유저플로우, 와이어프레임, 디자인 토큰, 화면별 상세 정의, Session Guide

**Checkpoint**: 3가지 설계안 중 사용자가 선택

#### 🔧 Architect (아키텍트)

DB 스키마와 프로젝트 환경을 세팅합니다.

**포함 내용**: ERD, 테이블 스키마, 마이그레이션, 인덱스, 환경 변수, 프로젝트 설정

#### 💻 FE + ⚙️ BE (프론트엔드 + 백엔드)

병렬로 동시 진행합니다. 둘 다 **Interface Contract**를 참조하므로 API가 일치합니다.

**FE**: UI 컴포넌트 라이브러리 설정, 화면별 구현, 상태 관리, 반응형/접근성
**BE**: API 엔드포인트, 데이터 액세스 레이어, 인증/인가, 에러 핸들링

**Code Comment Convention**: 구현 시 `// Design Ref: §섹션`, `// Plan SC: 기준` 주석으로 설계↔코드 추적

#### ✅ QA (품질 검증)

5단계 + Expert Review로 품질을 검증합니다.

| 단계 | 내용 |
|------|------|
| 빌드 검증 | 의존성 → 빌드 → 서버 → 핵심 동작 |
| Gap 분석 | 설계 vs 구현 비교, 일치율 산출, 자동 반복 (최대 5회) |
| Architecture/Convention Compliance | 계층 구조, 네이밍, import 순서 검증 |
| Success Criteria 평가 | Plan의 성공 기준을 ✅/⚠️/❌ 평가 |
| 보안 스캔 | OWASP Top 10 체크 |
| QA 시나리오 | 기획서 기반 테스트 시나리오 판정 |
| Expert Code Review | Google Staff Engineer 관점 심층 리뷰 |

**Checkpoint**: 이슈 발견 시 "모두 수정 / Critical만 / 그대로 진행" 선택

**최종 판정**: Pass (Critical 0 + Gap ≥90% + QA ≥90%) / Conditional / Needs Revision

#### 📊 Report (완료 보고서)

QA 통과 후 전체 프로젝트를 회고합니다.

**포함 내용**: Value Delivered (계획 vs 실제), Success Criteria Final Status, Key Decisions & Outcomes, Retrospective (Keep/Problem/Try)

---

## 커맨드 레퍼런스

### 워크플로우

| 커맨드 | 설명 |
|--------|------|
| `/vais auto {기능}` | 전체 자동 워크플로우 |
| `/vais plan {기능}` | 기획서 (아이디어 탐색 + 요구사항 + Plan-Plus 검증) |
| `/vais design {기능}` | IA + 와이어프레임 + UI 설계 |
| `/vais architect {기능}` | DB 스키마 + 마이그레이션 + 환경 설정 |
| `/vais frontend {기능}` | 프론트엔드 구현 |
| `/vais backend {기능}` | 백엔드 구현 |
| `/vais qa {기능}` | Gap 분석 + 코드 리뷰 + 보안 |
| `/vais report {기능}` | 완료 보고서 (Keep/Problem/Try 회고) |
| `/vais init {기능}` | 기존 프로젝트 → VAIS 문서 역생성 |
| `/vais manager` | 프로젝트 매니저 (히스토리, 전략, 영향 분석) |

### 유틸리티

| 커맨드 | 설명 |
|--------|------|
| `/vais status` | 전체 피처 진행 상태 |
| `/vais next` | 다음 단계 자동 안내 |
| `/vais test` | 테스트 실행 (프레임워크 자동 감지) |
| `/vais commit` | Conventional Commits + 자동 semver 판단 + 버전 일괄 반영 |
| `/vais help` | 대화형 사용법 안내 |

---

## 에이전트 팀

6명의 전문 에이전트가 역할 기반으로 협업합니다.

```
                    ┌─────────────────────┐
                    │   Manager (opus)    │
                    │   전체 오케스트레이션  │
                    └──────┬──────────────┘
           ┌───────────────┼───────────────┐
      ┌────▼────┐    ┌────▼────┐    ┌─────▼─────┐
      │  Design  │    │Architect│    │    QA     │
      │ 설계     │    │ 인프라   │    │ 품질 검증  │
      └─────────┘    └─────────┘    └───────────┘
                    ┌────▼────────────▼────┐
                    │  Frontend + Backend  │
                    │   (병렬 실행)         │
                    └─────────────────────┘
```

| 에이전트 | 모델 | 담당 |
|---------|------|------|
| manager | opus | Plan 실행, Gate 판정, 오케스트레이션 |
| design | sonnet | IA + 와이어프레임 + UI |
| architect | sonnet | DB + 환경 + 프로젝트 설정 |
| frontend | sonnet | 프론트엔드 구현 |
| backend | sonnet | 백엔드 API + 데이터 액세스 |
| qa | sonnet | Gap 분석 + 코드 리뷰 + 보안 |

> **참고**: 단일 실행(`/vais plan`)이나 순차 체이닝에서는 에이전트 없이 메인 Claude가 직접 처리합니다. 에이전트는 병렬 실행(`frontend+backend`)이나 자동 모드(`auto`)에서만 사용됩니다.

---

## 설치 상세

### 요구사항

| 항목 | 최소 버전 |
|------|----------|
| Claude Code | v2.1.32+ |
| Node.js | v18+ |

### OS별 사전 준비

<details>
<summary><strong>Ubuntu / Debian</strong></summary>

```bash
# Node.js 설치 (이미 있으면 건너뛰세요)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Claude Code 설치
npm install -g @anthropic-ai/claude-code
claude    # 최초 실행 시 인증
```
</details>

<details>
<summary><strong>Windows</strong></summary>

```powershell
# Node.js 설치
winget install OpenJS.NodeJS.LTS

# Claude Code 설치
npm install -g @anthropic-ai/claude-code
claude
```

> WSL2 환경을 권장합니다. WSL2에서는 Ubuntu와 동일한 방법으로 설치합니다.
</details>

<details>
<summary><strong>macOS</strong></summary>

```bash
# Node.js 설치 (Homebrew)
brew install node

# Claude Code 설치
npm install -g @anthropic-ai/claude-code
claude
```
</details>

### 플러그인 설치 방법

| 방법 | 명령어 |
|------|--------|
| GitHub (권장) | `/plugin install github:ghlee3401/vais-claude-code` |
| 수동 | `git clone https://github.com/ghlee3401/vais-claude-code.git ~/.claude/plugins/vais-code` |

설치 후 Claude Code 재시작 → `/vais help`로 확인.

---

## 핵심 기능

### Interface Contract (Gate 2)

Design → Infra 전환 시 자동 생성되는 API 스펙입니다. FE와 BE가 동일한 Contract를 참조하여 병렬 구현해도 API가 일치합니다.

### Plan-Plus (강화된 기획)

| 검증 | 질문 | 목적 |
|------|------|------|
| 의도 탐색 | "이 기능이 정말 해결하려는 문제가 뭔가?" | 근본 원인 파악 |
| 대안 탐색 | "기존 라이브러리나 다른 접근법은 없나?" | 최선의 방법 선택 |
| YAGNI 리뷰 | "지금 당장 필요한 것만 포함했나?" | 과잉 설계 방지 |

### Context Anchor (문서 간 컨텍스트 전파)

Plan에서 생성된 WHY/WHO/RISK/SUCCESS/SCOPE가 Design → FE/BE → QA로 자동 전파됩니다. 세션이 바뀌어도 "왜 이걸 만드는지"를 잊지 않습니다.

### 자동 Semver 커밋 (`/vais commit`)

커밋 전에 변경 규모를 분석하여 major/minor/patch를 자동 제안하고, 7곳의 버전 참조를 일괄 업데이트합니다.

---

## 훅 시스템

| 훅 | 역할 |
|----|------|
| SessionStart | 이전 작업 복원, 워크플로우 안내, 하단 리포트 규칙 주입 |
| PreToolUse(Bash) | 위험 명령 차단 (DROP TABLE, rm -rf 등) |
| PostToolUse(Write\|Edit) | 문서 작성 시 워크플로우 상태 자동 갱신 |
| Stop | 다음 단계 자동 안내 |
| UserPromptSubmit | 의도/체이닝 감지 |

---

## 웹훅 알림 (Slack/Discord)

`VAIS_WEBHOOK_URL` 환경변수를 설정하면 워크플로우 이벤트를 Slack/Discord로 알림받을 수 있습니다.

```bash
# ~/.bashrc 또는 ~/.zshrc
export VAIS_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../...
```

세션 시작, 단계 완료, 응답 완료 시점에 자동 전송됩니다.

---

## 설정 (vais.config.json)

| 설정 | 기본값 | 설명 |
|------|-------|------|
| `workflow.phases` | 7단계 배열 | plan → design → architect → frontend → backend → qa → report |
| `parallelGroups` | `["frontend", "backend"]` | 병렬 실행 그룹 |
| `gapAnalysis.matchThreshold` | 90 | Gap 분석 통과 기준 (%) |
| `gapAnalysis.maxIterations` | 5 | 자동 수정 최대 반복 횟수 |
| `orchestration.gates` | 4개 Gate | 자동 모드 체크포인트 |

---

## 프로젝트 구조

```
vais-claude-code/
├── .claude-plugin/          # 플러그인 매니페스트
├── hooks/                   # 5개 훅 (SessionStart, Bash Guard, 등)
├── scripts/                 # 자동화 스크립트
├── skills/vais/             # 메인 스킬 + phase별 지시 파일
├── agents/                  # 6명 에이전트 정의
├── templates/               # Plan/Design/Architect/QA/Report 템플릿
├── output-styles/           # 응답 스타일
├── lib/                     # 유틸리티 (상태, 메모리, 경로, 웹훅)
├── tests/                   # 유닛 테스트
├── vais.config.json         # 중앙 설정
└── CHANGELOG.md             # 릴리즈 노트
```

---

## FAQ

<details>
<summary><strong>기존 프로젝트에도 적용할 수 있나요?</strong></summary>

네. `/vais init {피처명}`으로 기존 코드를 분석해 VAIS 문서를 역생성합니다.
</details>

<details>
<summary><strong>외부 의존성이 있나요?</strong></summary>

없습니다. Node.js 내장 모듈만 사용합니다.
</details>

<details>
<summary><strong>한국어만 지원하나요?</strong></summary>

커맨드는 영문(`/vais plan`), 피처명은 한국어/영문 모두 가능합니다.
</details>

<details>
<summary><strong>혼자 개발해도 에이전트 팀이 필요한가요?</strong></summary>

아닙니다. 단일 실행이나 순차 체이닝에서는 메인 Claude가 직접 처리합니다. 에이전트는 병렬 실행(`frontend+backend`)이나 자동 모드에서만 사용됩니다.
</details>

---

## 트러블슈팅

| 문제 | 해결 |
|------|------|
| 플러그인이 로드되지 않음 | Claude Code 재시작 → `/vais help` 확인 |
| Gap 분석이 90%에 안 됨 | 최대 5회 자동 반복. 이후 수동으로 누락 기능 구현 |
| 피처명 오류 | 한글/영문/숫자/`-`/`_`만 허용 (공백, 슬래시 불가) |
| status.json 손상 | `rm .vais/status.json` 후 `/vais init {기능}` |

---

## 라이선스

MIT License - [LICENSE](./LICENSE)

Made by [VAIS Voice](https://github.com/ghlee3401) · [CHANGELOG](./CHANGELOG.md)
