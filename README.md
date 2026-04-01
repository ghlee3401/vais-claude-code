# VAIS Code

**v0.26.1** · 내 개인 Claude Code 플러그인

> C-Suite AI 팀. `/vais cto {feature}` 하나로 기획부터 구현까지.

---

## 이 플러그인이 하는 일

Claude Code에 C-Suite 에이전트 팀을 붙여준다. 사용자는 C-레벨만 호출하고, C-레벨이 하위 실무자에게 알아서 위임한다.

```
나 → /vais cto login
        CTO → design 에이전트 위임
           → architect 에이전트 위임
           → frontend + backend 병렬 위임
           → qa 에이전트 위임
        각 단계마다 Gate 체크 + 내게 확인 요청
```

**핵심 원칙**: 구현 단계(`/vais plan`, `/vais architect` 등)는 직접 부르지 않는다. CTO가 알아서 한다.

---

## 새 PC 세팅

```bash
# 1. 레포 클론
git clone https://github.com/ghlee3401/vais-claude-code.git
cd vais-claude-code

# 2. 개발 환경 세팅 (symlink: marketplace → 이 레포)
bash scripts/setup-dev.sh

# 3. Claude Code 열고
/reload-plugins

# 4. 확인
/vais help
```

setup-dev.sh가 하는 일: `~/.claude/plugins/marketplaces/vais-marketplace` → 이 레포를 심링크로 연결. 이후 코드 수정 → `/reload-plugins` 만으로 즉시 반영된다.

**Windows (WSL2)**: WSL 터미널에서 동일하게 실행.

---

## 자기 업그레이드 루프

이 플러그인은 자기 자신으로 자신을 개발한다.

```
vais-code 현재 버전
    ↓
/vais cto {new-feature}    ← CTO가 이 레포를 수정
    ↓
/reload-plugins
    ↓
vais-code 개선된 버전
    ↓
/vais cto {next-feature}   ← 반복
```

새 기능을 추가하고 싶으면 `/vais cto feature-name`으로 시작한다. CTO가 plan → design → implement → qa까지 진행한다.

---

## C-Suite 에이전트

| 에이전트 | 모델 | 역할 |
|---------|------|------|
| CEO | opus | 비즈니스 전략, Reference Absorption 지휘 |
| CPO | sonnet | 제품 방향, PRD 생성 (pm sub-agents 오케스트레이션) |
| CTO | opus | 기술 전체 오케스트레이션 (plan→qa, Gate 1-4) |
| CMO | sonnet | 마케팅 분석 + SEO (seo sub-agent 위임) |
| CSO | sonnet | 보안 검토 Gate A, 플러그인 검증 Gate B |
| CFO | sonnet | 재무/ROI 분석 _(stub)_ |
| COO | sonnet | 운영/CI/CD _(stub)_ |

### CTO 구현 에이전트 (CTO가 직접 위임, 내가 직접 부르지 않음)

| 에이전트 | 역할 |
|---------|------|
| design | IA + 와이어프레임 + UI 설계 |
| architect | DB 스키마 + 환경 설정 |
| frontend | 프론트엔드 구현 |
| backend | 백엔드 API |
| qa | Gap 분석 + 코드 리뷰 + 보안 |

### CMO / CSO Sub-agent (각 C-Suite이 위임, 내가 직접 부르지 않음)

| 에이전트 | 상위 | 역할 |
|---------|------|------|
| seo | CMO | SEO 감사 |
| security | CSO | OWASP Top 10 보안 검토 |
| validate-plugin | CSO | 플러그인 구조 검증 |

---

## 커맨드

### 주력

```bash
/vais cto {feature}      # 구현 전체 오케스트레이션 (가장 많이 씀)
/vais ceo {feature}      # 비즈니스 방향 먼저 잡을 때
/vais cpo {feature}      # PRD 먼저 만들 때
/vais cmo {feature}      # 마케팅/SEO 점검
/vais cso {feature}      # 보안 검토
```

### 유틸리티

```bash
/vais status             # 피처 진행 현황
/vais absorb {path}      # 외부 레퍼런스 흡수
/vais commit             # git 변경사항 분석 → Conventional Commits 메시지 생성 + semver 범프 제안
/vais init {feature}     # 기존 프로젝트 → VAIS 문서 역생성
/vais help               # 도움말
```

---

## CTO 플로우 상세

```
/vais cto login
    │
    ├─ Plan 직접 작성
    ├─ [Gate 1] 내게 확인
    ├─ design 에이전트 위임
    ├─ [Gate 2] Interface Contract 생성 + 내게 확인
    ├─ architect 에이전트 위임
    ├─ [Gate 3] 내게 확인
    ├─ frontend + backend 병렬 위임
    ├─ [Gate 4] 내게 확인
    └─ qa 에이전트 위임
```

특정 단계만 다시 하고 싶으면: `/vais cto login` 실행 후 "architect 단계만 다시 해줘" 라고 말하면 된다.

---

## Reference Absorption

외부 레퍼런스(다른 플러그인, 문서, 레포)를 평가해서 흡수한다.

```bash
/vais absorb ../bkit/              # 디렉토리 통째로 평가
/vais absorb some-file.md          # 단일 파일
/vais absorb --history             # 흡수 이력
/vais absorb --history --filter=rejected  # 거부된 것만
```

판정 기준: 품질 25점 미만 → 거부 / 기존과 50% 이상 겹침 → 병합 권장 / 품질 50+적합성 20 이상 → 흡수. 모든 결정은 `.vais/absorption-ledger.jsonl`에 기록.

---

## 프로젝트 구조

```
vais-claude-code/
├── agents/                  # 모든 에이전트 정의
│   ├── ceo|cpo|cto|cmo|cso|cfo|coo.md   # C-Suite
│   ├── design|architect|frontend|backend|qa.md  # 구현
│   └── seo|security|validate-plugin.md   # sub-agents
├── skills/vais/
│   ├── SKILL.md             # /vais 스킬 진입점
│   └── phases/              # 각 액션 실행 지침
│       ├── cto|ceo|...md    # C-Suite 위임
│       └── plan|design|...md  # 리다이렉트 스텁 (→ CTO로 안내)
├── hooks/                   # SessionStart, SubagentStart/Stop 등
├── lib/                     # observability, absorb-evaluator
├── scripts/
│   ├── setup-dev.sh         # 새 PC 세팅
│   └── agent-start|stop|phase-transition.js
├── docs/                    # VAIS 개발 문서 (plan/design/analysis/report)
├── package.json
└── vais.config.json
```

---

## Observability

에이전트 실행 상태와 이벤트가 자동으로 기록된다.

- `.vais/agent-state.json` — 현재 활성 에이전트, 파이프라인 상태
- `.vais/event-log.jsonl` — 모든 이벤트 (session_start, agent_start/stop, gate_check, decision 등)
- 10MB 초과 또는 30일 경과 시 `.vais/archive/`로 자동 로테이션

---

## 설정 (`vais.config.json`)

자주 바꾸는 것들:

| 설정 | 기본값 | 설명 |
|------|--------|------|
| `cSuite.orchestrator` | `"cto"` | 기본 오케스트레이터 |
| `workflow.gates` | `4` | Gate 체크포인트 수 |
| `gapAnalysis.matchThreshold` | `90%` | QA 통과 기준 |
| `observability.enabled` | `true` | 로깅 on/off |

---

## 버전 히스토리

| 버전 | 주요 변경 |
|------|---------|
| v0.26.1 | C-Suite Push 규칙 문서화, /vais commit 강제화 |
| v0.26.0 | C-Suite 모델 opus 통일, governance 강화 |
| v0.25.0 | c-suite-delegation: 구현 단계 직접 호출 제거, CTO 단일 진입점 |
| v0.24.0 | C-Suite 완전 위임 패턴, CPO/CFO/COO 신설 |
| v0.23.0 | `/vais auto` → `/vais cto` 리네임 |

전체 이력: [CHANGELOG.md](./CHANGELOG.md)

---

## 트러블슈팅

| 문제 | 해결 |
|------|------|
| `/vais` 커맨드 안 됨 | `/reload-plugins` 실행 |
| 새 PC에서 플러그인 없음 | `bash scripts/setup-dev.sh` 후 `/reload-plugins` |
| agent-state.json 손상 | `rm .vais/agent-state.json` |
| symlink 깨짐 | `setup-dev.sh` 재실행 |
| `/vais plan` 쳤더니 리다이렉트됨 | 의도된 동작. `/vais cto {feature}` 사용 |
