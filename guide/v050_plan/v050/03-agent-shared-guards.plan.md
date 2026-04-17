# Sub-plan 03 — Shared Guards & Registry

> 상위: `../v050-full-overhaul.plan.md`
> 선행: 01, 02
> 후행: 04, 06

---

## 0. 목적

v0.50에서 모든 sub-agent가 공유하는 **공통 가드 프롬프트**와 **AgentRegistry의 includes 병합 메커니즘**을 도입한다. 두 가드:
1. `advisor-guard.md` — Sonnet sub-agent가 Advisor Tool을 호출할 때 지켜야 할 규칙 (sub-plan 04의 기반)
2. `ideation-guard.md` — C-Level이 ideation 모드에서 산출물 강제를 금지하고 사용자 명시 종료까지 대기 (sub-plan 05의 기반)

AgentRegistry가 frontmatter `includes: [...]`를 인식해 공통 블록을 자동으로 본문에 병합하도록 한다.

---

## 1. 만들 파일

```
agents/_shared/
├── advisor-guard.md           # 신규 (32 sub-agent 공통 include)
├── ideation-guard.md          # 신규 (6 C-Level 공통 include)
└── README.md                  # 선택 — _shared/ 디렉토리 사용법 메모
```

**수정 파일**:
- `lib/registry/agent-registry.js` (신규 또는 기존 확장) — frontmatter `includes:` 필드 파서 + 병합 로직

---

## 2. `agents/_shared/advisor-guard.md`

**역할**: Sonnet sub-agent가 `advisor_20260301` 도구를 호출할 때의 정책.

### 2.1 파일 내용 골격

```markdown
## ADVISOR TOOL USAGE (active for all Sonnet sub-agents)

`advisor` 도구가 활성화되어 있다. 이는 Opus reviewer가 너의 전체 대화를 자동 전달받아
전략적 가이드를 주는 도구다. 파라미터 없음.

### 호출 시점 (권장)

1. **Early plan** — 본격 작업 직전 1회
   - 탐색/오리엔테이션은 작업이 아니다. 파일을 쓰거나 결정을 내리기 직전에 호출.
2. **Stuck** — 막힐 때 1회
   - 동일 에러 반복, 접근 방식이 수렴하지 않을 때.
3. **Final review** — 완료 선언 직전 1회
   - 단, 산출물은 먼저 영속화한 뒤 호출.

### 절제 규칙

- 짧은 단일 액션 작업에는 호출 금지 (advisor 가치 없음).
- `max_uses=3` 도달 시 추가 호출은 자동 거부된다 — 그대로 진행.
- advisor 조언이 본인의 1차 자료(파일 내용, 테스트 결과)와 충돌하면
  한 번 더 advisor를 호출해 reconcile 요청. silent switch 금지.

### advisor 응답 처리

- 진지하게 받아들이되, 본인이 직접 확인한 증거가 advisor와 충돌하면 reconcile call.
- advisor는 full context를 받지만 실시간 코드 상태는 모른다. 최신 상태 요약을
  첫 호출에 함께 전달.

### 비용 degrade

- `.vais/advisor-spend.json` 에 기록된 누적 비용이 캡 초과 시 advisor는 자동으로
  disable된다. 이때는 Sonnet 단독으로 정상 작업을 계속하라. advisor 없다고
  사용자에게 묻지 말 것.
```

### 2.2 포함되는 sub-agent (32개 전원)

| C-Level | Sub-agent |
|---------|-----------|
| CEO (2) | absorb-analyzer, skill-creator |
| CPO (7) | product-discoverer, product-strategist, product-researcher, prd-writer, backlog-manager, ux-researcher, data-analyst |
| CTO (8) | infra-architect, backend-engineer, frontend-engineer, ui-designer, db-architect, qa-engineer, test-engineer, incident-responder |
| CSO (7) | security-auditor, code-reviewer, secret-scanner, dependency-analyzer, plugin-validator, skill-validator, compliance-auditor |
| CBO (10) | market-researcher, customer-segmentation-analyst, seo-analyst, copy-writer, growth-analyst, pricing-analyst, financial-modeler, unit-economics-analyst, finops-analyst, marketing-analytics-analyst |
| COO (4) | release-engineer, sre-engineer, release-monitor, performance-engineer |

**합계 = 2+7+8+7+10+4 = 38... 주의**: 가이드에 "32"로 반복 언급됨. 재확인 필요:
- 실제 v0.50 sub-agent 최종 카운트 재검증 필요 (AD-8 체크포인트)
- 만약 38이면 마스터의 SC-14와 AD-8 수치 조정
- 본 sub-plan에서는 **실제 `ls agents/*/*.md | grep -v "{c-level-main}.md"` 카운트**를 기준으로 진행

### 2.3 C-Level 본체는 제외
CEO/CPO/CTO/CSO/CBO/COO 6개 본체 markdown에는 advisor-guard를 include **하지 않는다** (이미 Opus이므로 self-advisor 무의미, AD-1).

---

## 3. `agents/_shared/ideation-guard.md`

**역할**: C-Level이 `/vais {role} ideation {topic}` 진입 시 산출물 강제 프롬프트 비활성화, 사용자 명시 종료까지 대기 (CP-3c).

### 3.1 파일 내용 골격

```markdown
## IDEATION MODE GUARD (active for C-Level agents in ideation phase)

현재 모드: **ideation (Phase 0, optional)**

### 허용 동작

- 자유 대화 — 산출물 포맷(PRD / 요구사항 템플릿 등) 강제 금지
- 사용자 아이디어에 대해 질문 / 선명화 / 프레임 제안
- 유사 사례 / 선행 사례 참고 제시
- 이미 저장된 다른 `docs/00-ideation/*.md` 있으면 참조 가능

### 금지 동작

- "plan 갈까요?", "이제 시작할까요?" 반복 질문 — 사용자 명시 종료까지 대기 (CP-3c)
- 임의 산출물 생성 (예: PRD 템플릿에 자동 채움)
- mandatory phase 체크 (Rule #2) 발동 — ideation은 예외
- 사용자가 종료 키워드 없이 멈춘 상태에서 AI가 "요약할까요?" 자체 판단으로 제안

### 종료 트리거 (사용자 명시 키워드)

- "plan 가자" / "ideation 종료" / "끝" / "정리해줘" / "요약"
- 이 중 하나가 나오면:
  1. 현재까지 대화에서 핵심 추출 → `templates/ideation.template.md` 구조 채움
  2. `docs/00-ideation/{c-level}_{topic}.md` 저장
  3. `ideation_ended` 이벤트 기록
  4. CEO 라우팅 모드일 때: 다음 C-Level 추천 + AskUserQuestion
  5. 기타: "`/vais {c-level} plan {topic}` 으로 진입하시겠어요?" 1회만 제안

### 요약 템플릿 필드

- key_points (3~7개 핵심 주제)
- decisions (확정된 결정, 있다면)
- open_questions (미해결 질문)
- next_step (제안된 다음 phase / C-Level)
```

### 3.2 포함되는 agent
CEO / CPO / CTO / CSO / CBO / COO **본체 6개**만. sub-agent는 ideation 모드 진입 자체 없음.

---

## 4. AgentRegistry `includes` 메커니즘

### 4.1 위치
`lib/registry/agent-registry.js` (없으면 신규 생성)

### 4.2 기능
- `loadAgent(agentPath) → {frontmatter, body, mergedBody}`
- `includes: [_shared/advisor-guard.md, _shared/ideation-guard.md]` 형태의 frontmatter 필드를 파싱
- 각 경로를 `agents/` 기준 상대로 resolve
- 병합 순서: **본문 앞(prepend)** 또는 **뒤(append)** — 이 sub-plan에서 **prepend**로 고정

### 4.3 API 예시
```js
const registry = require('./lib/registry/agent-registry');
const agent = await registry.loadAgent('agents/cto/backend-engineer.md');
// agent.body == 파일 원본 본문
// agent.mergedBody == [advisor-guard.md 내용] + "\n\n" + agent.body
// agent.frontmatter == YAML 파싱 객체 (includes 포함)
```

### 4.4 단위 테스트
- `tests/agent-registry.test.js`:
  - Fixture: `agents/_shared/fixture-guard.md` + `agents/_test/sample.md` (includes: [_shared/fixture-guard.md])
  - Load → mergedBody의 앞부분이 fixture 내용과 일치
  - Frontmatter 미존재 시 graceful fallback (원본 반환)
  - 순환 include 방지 (A includes B, B includes A → warn + skip 두 번째)

---

## 5. 진입 시 신경 쓸 점

### 5.1 선행에서 보장됨
- 01 완료: `agents/cbo/*.md` 11개 존재
- 02 완료: 신규 sub-agent 4종 존재, C-Level 본체 갱신

### 5.2 다음으로 넘길 보증
- `agents/_shared/advisor-guard.md` 존재 + 공통 정책 명문화
- `agents/_shared/ideation-guard.md` 존재
- `lib/registry/agent-registry.js`가 `includes:` 필드를 인식하고 병합
- **이 시점까지 sub-agent frontmatter에 includes를 기재하지 않는다** — 04에서 한꺼번에 기재
- sub-agent 최종 카운트를 `ls agents/{cpo,cto,cso,cbo,coo,ceo}/*.md | grep -v "^{same-name}\.md"` 로 확정 (가이드의 32 vs 실측 38 차이 해결)

### 5.3 함정
- **_shared/ 디렉토리는 agent 아님**: `plugin-validator` 등이 이 디렉토리를 스캔하지 않도록 제외 규칙 추가. frontmatter가 없으므로 "이건 agent가 아니다"를 식별.
- **includes path resolution**: 상대 경로 `_shared/advisor-guard.md` 형식이 `agents/cto/backend-engineer.md` 기준일지 `agents/` 기준일지 명시. 본 plan은 **`agents/` 기준**으로 고정.
- **prepend vs append**: 가드가 본문 앞이어야 LLM이 먼저 읽고 준수한다. append 시 본문 실행 지시가 먼저 와서 가드가 약화. **prepend 고정**.
- **순환 include 방지**: A가 B를 include하고 B가 A를 include하면 무한 루프. registry에서 visited set 관리.
- **본문 변경 없이 frontmatter만 추가**: 03은 registry 로직 + 가드 파일만 만들고, 각 sub-agent frontmatter 편집은 04(Advisor)에서 일괄 처리. 두 단계 섞으면 diff가 지저분.

---

## 6. 검증

- [ ] `agents/_shared/advisor-guard.md` 존재 + 5개 섹션 (호출 시점 / 절제 / 응답 처리 / degrade / 호출 시점 설명) 포함
- [ ] `agents/_shared/ideation-guard.md` 존재 + 허용/금지/종료 섹션
- [ ] `lib/registry/agent-registry.js` 존재 + export `loadAgent`
- [ ] `tests/agent-registry.test.js` 통과 (includes 병합, 순환 방지)
- [ ] sub-agent 실제 카운트 확정 (`ls agents/{cpo,cto,cso,cbo,coo,ceo}/*.md | wc -l` 에서 본체 6개 제외)
  - 예상: CEO 2 + CPO 7 + CTO 8 + CSO 7 + CBO 10 + COO 4 = **38**. 32와 차이 나면 마스터 SC-14 문구 수정 필요 → sub-plan 09에서 업데이트

연결 SC: **SC-15**

---

## 7. 다음 단계

- **04** Advisor Integration — advisor-guard 기반으로 모든 Sonnet sub-agent에 frontmatter 추가
