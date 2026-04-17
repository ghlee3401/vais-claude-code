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

### Fallback 모드 CLI 호출 (v0.56+)

session-start hook이 `.vais/advisor-mode.json` 을 작성한다. `mode` 가:

- `native` — Claude Code가 frontmatter `advisor:` 를 직접 처리. 본 섹션 **불필요**.
- `wrapper` — Bash 도구로 아래 CLI 를 직접 호출.
- `disabled` — ANTHROPIC_API_KEY 부재 등. advisor 전체 스킵.

wrapper 모드에서 advisor 의견이 필요하면:

```bash
node <plugin-root>/scripts/advisor-call.js \
  --sub-agent=<your-agent-name> \
  --c-level=<cto|cpo|cso|cbo|coo|ceo> \
  --trigger=<early|stuck|final|reconcile> \
  --summary="간결한 현재 상황 요약"
```

응답:
- stdout → advice 본문 (그대로 읽어 판단에 반영).
- exit 0 + stdout 비어있음 → native/disabled 모드 (스킵).
- exit 1 + stderr → budget_block / unavailable / timeout. degrade 규칙 적용.

CLI 한 번 호출 = advisor 한 번 호출로 카운트. `max_calls_per_session` 캡 안에서 절제.
